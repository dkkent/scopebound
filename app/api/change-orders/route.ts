import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  projectChangeOrders,
  timelineProposals,
  timelineChatSessions,
  projects,
  organizationMembers,
  users,
} from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { sendEmail } from '@/lib/email/sendEmail';

const createChangeOrderSchema = z.object({
  proposalId: z.string(),
  clientEmail: z.string().email(),
  clientNotes: z.string().optional(),
  shareToken: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proposalId, clientEmail, clientNotes, shareToken } = createChangeOrderSchema.parse(body);

    const proposal = await db.query.timelineProposals.findFirst({
      where: eq(timelineProposals.id, proposalId),
    });

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    const session = await db.query.timelineChatSessions.findFirst({
      where: eq(timelineChatSessions.id, proposal.sessionId),
    });

    if (!session || session.shareToken !== shareToken) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 403 }
      );
    }

    const existingChangeOrder = await db.query.projectChangeOrders.findFirst({
      where: eq(projectChangeOrders.proposalId, proposalId),
    });

    if (existingChangeOrder) {
      return NextResponse.json(
        { error: 'A change order for this proposal already exists' },
        { status: 400 }
      );
    }

    const [changeOrder] = await db
      .insert(projectChangeOrders)
      .values({
        projectId: session.projectId,
        proposalId,
        clientEmail,
        clientNotes: clientNotes || null,
        status: 'pending_approval',
      })
      .returning();

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, session.projectId),
    });

    if (project) {
      const owners = await db
        .select({
          email: users.email,
          name: users.name,
        })
        .from(organizationMembers)
        .innerJoin(users, eq(organizationMembers.userId, users.id))
        .where(
          and(
            eq(organizationMembers.organizationId, project.organizationId),
            eq(organizationMembers.role, 'owner')
          )
        );

      const proposalDetails = proposal.proposalData as any;
      const emailHtml = `
        <h2>New Change Order Request</h2>
        <p>A client has requested a scope change for <strong>${project.name}</strong>.</p>
        
        <h3>Proposal Summary</h3>
        <p>${proposal.summary}</p>
        
        <h3>Impact</h3>
        <ul>
          <li><strong>Cost Change:</strong> ${parseFloat(proposal.deltaCost) > 0 ? '+' : ''}$${Math.abs(parseFloat(proposal.deltaCost)).toLocaleString()}</li>
          <li><strong>Timeline Change:</strong> ${parseFloat(proposal.deltaWeeks) > 0 ? '+' : ''}${parseFloat(proposal.deltaWeeks)} weeks</li>
        </ul>
        
        <h3>Proposed Changes</h3>
        <ul>
          ${proposalDetails.changes?.map((change: string) => `<li>${change}</li>`).join('') || ''}
        </ul>
        
        ${clientNotes ? `<h3>Client Notes</h3><p>${clientNotes}</p>` : ''}
        
        <p><strong>Client Email:</strong> ${clientEmail}</p>
        
        <p>Please review this change order request in your dashboard.</p>
      `;

      const emailText = `
New Change Order Request

A client has requested a scope change for ${project.name}.

Proposal Summary:
${proposal.summary}

Impact:
- Cost Change: ${parseFloat(proposal.deltaCost) > 0 ? '+' : ''}$${Math.abs(parseFloat(proposal.deltaCost)).toLocaleString()}
- Timeline Change: ${parseFloat(proposal.deltaWeeks) > 0 ? '+' : ''}${parseFloat(proposal.deltaWeeks)} weeks

Proposed Changes:
${proposalDetails.changes?.map((change: string) => `- ${change}`).join('\n') || ''}

${clientNotes ? `Client Notes:\n${clientNotes}\n` : ''}

Client Email: ${clientEmail}

Please review this change order request in your dashboard.
      `;

      for (const owner of owners) {
        if (owner.email) {
          await sendEmail({
            to: owner.email,
            subject: `New Change Order Request: ${project.name}`,
            html: emailHtml,
            text: emailText,
          });
        }
      }
    }

    return NextResponse.json({
      id: changeOrder.id,
      status: changeOrder.status,
      createdAt: changeOrder.createdAt,
      message: 'Change order request submitted successfully. The team will review your request shortly.',
    });

  } catch (error) {
    console.error('Create change order error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create change order' },
      { status: 500 }
    );
  }
}
