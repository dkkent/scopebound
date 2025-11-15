import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { projects, projectForms, organizationMembers } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";

// Helper to verify organization membership
async function verifyOrganizationMembership(userId: string, organizationId: string) {
  const membership = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId)
      )
    )
    .limit(1);

  return membership.length > 0;
}

// POST /api/projects/[id]/send-form - Generate shareable link and update project status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get project and verify access
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const isMember = await verifyOrganizationMembership(
      session.user.id,
      project[0].organizationId
    );

    if (!isMember) {
      return NextResponse.json(
        { error: "Not a member of this organization" },
        { status: 403 }
      );
    }

    // Check if form exists
    const form = await db
      .select()
      .from(projectForms)
      .where(eq(projectForms.projectId, id))
      .limit(1);

    if (form.length === 0) {
      return NextResponse.json(
        { error: "No form has been generated for this project yet" },
        { status: 404 }
      );
    }

    // Update project status to "form_sent" if still in draft
    if (project[0].status === "draft") {
      await db
        .update(projects)
        .set({
          status: "form_sent",
          updatedAt: sql`NOW()`,
        })
        .where(eq(projects.id, id));
    }

    // Get the base URL from the request
    const baseUrl = request.nextUrl.origin;
    const shareUrl = `${baseUrl}/f/${form[0].shareToken}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      shareToken: form[0].shareToken,
      message: "Form is ready to send to client",
    });
  } catch (error) {
    console.error("Send form error:", error);
    return NextResponse.json(
      { error: "Failed to generate share link" },
      { status: 500 }
    );
  }
}
