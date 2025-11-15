import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { projects, organizationMembers, organizationSettings } from "@/lib/schema";
import { insertProjectSchema } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
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

// GET /api/projects - List all projects for an organization
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const status = searchParams.get("status");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    // Verify user is a member of the organization
    const isMember = await verifyOrganizationMembership(session.user.id, organizationId);
    if (!isMember) {
      return NextResponse.json(
        { error: "Not a member of this organization" },
        { status: 403 }
      );
    }

    // Build query with optional status filter (only after membership is verified)
    const conditions = status
      ? and(
          eq(projects.organizationId, organizationId),
          eq(projects.status, status as any)
        )
      : eq(projects.organizationId, organizationId);

    const projectList = await db
      .select()
      .from(projects)
      .where(conditions)
      .orderBy(desc(projects.createdAt));

    return NextResponse.json({ projects: projectList });
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    
    // Validate input
    const validatedData = insertProjectSchema.parse(body);

    // Verify user is a member of the organization
    const isMember = await verifyOrganizationMembership(
      session.user.id,
      validatedData.organizationId
    );
    if (!isMember) {
      return NextResponse.json(
        { error: "Not a member of this organization" },
        { status: 403 }
      );
    }

    // If no hourly rate provided, get organization default
    let hourlyRate = validatedData.hourlyRate;
    if (!hourlyRate) {
      const orgSettings = await db
        .select()
        .from(organizationSettings)
        .where(eq(organizationSettings.organizationId, validatedData.organizationId))
        .limit(1);

      hourlyRate = orgSettings[0]?.defaultHourlyRate || "150";
    }

    // Create project
    const newProject = await db
      .insert(projects)
      .values({
        ...validatedData,
        hourlyRate, // Pass string value to Drizzle numeric column (preserves precision)
        createdBy: session.user.id,
        status: "draft",
      })
      .returning();

    return NextResponse.json({ project: newProject[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
