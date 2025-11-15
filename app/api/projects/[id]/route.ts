import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { projects, organizationMembers } from "@/lib/schema";
import { updateProjectSchema } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

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

// Helper to get project and verify access
async function getProjectAndVerifyAccess(projectId: string, userId: string) {
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (project.length === 0) {
    return { error: "Project not found", status: 404 };
  }

  const isMember = await verifyOrganizationMembership(userId, project[0].organizationId);
  if (!isMember) {
    return { error: "Not a member of this organization", status: 403 };
  }

  return { project: project[0] };
}

// GET /api/projects/[id] - Get a single project
export async function GET(
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
    const result = await getProjectAndVerifyAccess(id, session.user.id);

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ project: result.project });
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(
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
    const result = await getProjectAndVerifyAccess(id, session.user.id);

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const body = await request.json();
    
    // Strip server-managed fields from request body (in case client sends them)
    const { organizationId, id: _id, createdAt, updatedAt, ...updateData } = body;
    
    // Use dedicated update schema (more lenient regex to accept Drizzle numeric formats)
    const validatedData = updateProjectSchema.parse(updateData);

    // Update project
    const updatedProject = await db
      .update(projects)
      .set({
        ...validatedData,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(projects.id, id))
      .returning();

    return NextResponse.json({ project: updatedProject[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Update project error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
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
    const result = await getProjectAndVerifyAccess(id, session.user.id);

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    // Delete project (cascade will handle related records)
    await db.delete(projects).where(eq(projects.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
