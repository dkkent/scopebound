import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  timelineChatSessions,
  timelineChatMessages,
  timelineProposals,
  projectTimelines,
  projects,
} from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { applyRateLimit } from '@/lib/rate-limit';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const chatRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  clientEmail: z.string().email().optional(),
});

const proposalSchema = z.object({
  type: z.literal('scope_change'),
  summary: z.string(),
  changes: z.array(z.string()),
  deltaCost: z.number(),
  deltaWeeks: z.number(),
  reasoning: z.string(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = applyRateLimit(ip, 'ai', { maxRequests: 10, windowMs: 60000 });
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const { shareToken } = params;
    const body = await request.json();
    const { message, clientEmail } = chatRequestSchema.parse(body);

    const timeline = await db.query.projectTimelines.findFirst({
      where: eq(projectTimelines.shareToken, shareToken),
      with: {
        project: {
          with: {
            organization: {
              with: {
                settings: true,
              },
            },
          },
        },
      },
    });

    if (!timeline) {
      return NextResponse.json(
        { error: 'Timeline not found' },
        { status: 404 }
      );
    }

    let session = await db.query.timelineChatSessions.findFirst({
      where: eq(timelineChatSessions.shareToken, shareToken),
    });

    if (!session) {
      const [newSession] = await db
        .insert(timelineChatSessions)
        .values({
          shareToken,
          projectId: timeline.projectId,
          timelineId: timeline.id,
          clientEmail: clientEmail || null,
        })
        .returning();
      session = newSession;
    } else if (clientEmail && !session.clientEmail) {
      [session] = await db
        .update(timelineChatSessions)
        .set({ clientEmail })
        .where(eq(timelineChatSessions.id, session.id))
        .returning();
    }

    await db.insert(timelineChatMessages).values({
      sessionId: session.id,
      role: 'user',
      content: message,
    });

    const chatHistory = await db.query.timelineChatMessages.findMany({
      where: eq(timelineChatMessages.sessionId, session.id),
      orderBy: [desc(timelineChatMessages.createdAt)],
      limit: 20,
    });

    const timelineData = timeline.timelineData as any;
    const project = timeline.project;
    const orgSettings = project.organization.settings;

    const systemPrompt = `You are an AI assistant helping a client explore scope changes for their project.

Project: ${project.name}
Project Type: ${project.projectType}
Current Budget: $${project.budget?.toLocaleString() || 'Not specified'}
Current Timeline: ${project.estimatedWeeks} weeks
Hourly Rate: $${orgSettings?.defaultHourlyRate || 150}

Current Project Timeline:
${JSON.stringify(timelineData, null, 2)}

Your role:
1. Answer questions about the current scope and timeline
2. When the client suggests changes (adding features, extending timeline, etc.), calculate the impact
3. For scope changes, respond with a JSON proposal in this format:
{
  "type": "scope_change",
  "summary": "Brief description of the change",
  "changes": ["Change 1", "Change 2"],
  "deltaCost": 5000,
  "deltaWeeks": 2,
  "reasoning": "Explanation of the estimate"
}

4. For general questions, respond conversationally without the JSON format

Be helpful, professional, and transparent about costs and timeline impacts.`;

    let messages = chatHistory
      .reverse()
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    while (messages.length > 0 && messages[0].role === 'assistant') {
      messages.shift();
    }

    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      messages.push({ role: 'user', content: message });
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: systemPrompt,
      messages,
    });

    const assistantMessage = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    await db.insert(timelineChatMessages).values({
      sessionId: session.id,
      role: 'assistant',
      content: assistantMessage,
    });

    let proposal = null;
    const jsonMatch = assistantMessage.match(/\{[\s\S]*"type"\s*:\s*"scope_change"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const proposalData = JSON.parse(jsonMatch[0]);
        const validatedProposal = proposalSchema.parse(proposalData);
        
        const [newProposal] = await db
          .insert(timelineProposals)
          .values({
            sessionId: session.id,
            baseTimelineId: timeline.id,
            proposalData: validatedProposal,
            deltaCost: validatedProposal.deltaCost.toString(),
            deltaWeeks: validatedProposal.deltaWeeks.toString(),
            status: 'draft',
            summary: validatedProposal.summary,
          })
          .returning();
        proposal = newProposal;
      } catch (e) {
        console.error('Failed to parse or validate proposal JSON:', e);
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      proposal: proposal ? {
        id: proposal.id,
        summary: proposal.summary,
        deltaCost: parseFloat(proposal.deltaCost),
        deltaWeeks: parseFloat(proposal.deltaWeeks),
        proposalData: proposal.proposalData,
      } : null,
      sessionId: session.id,
    });

  } catch (error) {
    console.error('Chat endpoint error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const { shareToken } = params;

    const session = await db.query.timelineChatSessions.findFirst({
      where: eq(timelineChatSessions.shareToken, shareToken),
    });

    if (!session) {
      return NextResponse.json({ 
        messages: [], 
        proposals: [],
        sessionId: null,
        session: null,
      });
    }

    const messages = await db.query.timelineChatMessages.findMany({
      where: eq(timelineChatMessages.sessionId, session.id),
      orderBy: [desc(timelineChatMessages.createdAt)],
    });

    const proposals = await db.query.timelineProposals.findMany({
      where: eq(timelineProposals.sessionId, session.id),
      orderBy: [desc(timelineProposals.createdAt)],
    });

    return NextResponse.json({
      sessionId: session.id,
      session: {
        clientEmail: session.clientEmail,
      },
      messages: messages.reverse().map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      })),
      proposals: proposals.map(p => ({
        id: p.id,
        summary: p.summary,
        deltaCost: parseFloat(p.deltaCost),
        deltaWeeks: parseFloat(p.deltaWeeks),
        proposalData: p.proposalData,
        status: p.status,
        createdAt: p.createdAt,
      })),
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}
