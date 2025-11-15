import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { projects, projectTimelines, organizationMembers } from "@/lib/schema";
import { eq, and, desc, sql } from "drizzle-orm";

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

    const timeline = await db
      .select()
      .from(projectTimelines)
      .where(eq(projectTimelines.projectId, id))
      .orderBy(desc(projectTimelines.createdAt))
      .limit(1);

    if (timeline.length === 0) {
      return NextResponse.json(
        { error: "No timeline found for this project" },
        { status: 404 }
      );
    }

    await db
      .update(projects)
      .set({
        status: "approved",
        updatedAt: sql`NOW()`,
      })
      .where(eq(projects.id, id));

    return NextResponse.json({
      success: true,
      message: "Timeline approved and project status updated",
    });
  } catch (error) {
    console.error("Approve timeline error:", error);
    return NextResponse.json(
      { error: "Failed to approve timeline" },
      { status: 500 }
    );
  }
}
