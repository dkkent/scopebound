import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { projects, projectForms, projectTimelines, organizationMembers, organizationSettings } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateTimeline } from "@/lib/ai/generateTimeline";
import { ClaudeError } from "@/lib/ai/claude";

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

    if (!form[0].submittedAt || !form[0].submittedData) {
      return NextResponse.json(
        { error: "Client has not submitted the form yet" },
        { status: 400 }
      );
    }

    const orgSettings = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, project[0].organizationId))
      .limit(1);

    const organizationContext = orgSettings.length > 0 ? {
      customAiPrompts: orgSettings[0].customPrompts as Record<string, any> | undefined,
    } : undefined;

    console.log("[generate-timeline] Calling Claude AI to generate timeline...");
    const timelineData = await generateTimeline({
      projectBrief: project[0].projectBrief,
      projectType: project[0].projectType,
      clientName: project[0].clientName,
      hourlyRate: project[0].hourlyRate,
      submittedFormData: form[0].submittedData as Record<string, any>,
      formData: form[0].formData,
      organizationContext,
    });

    console.log("[generate-timeline] Timeline generated successfully");

    const [timeline] = await db
      .insert(projectTimelines)
      .values({
        projectId: id,
        timelineData: timelineData,
        totalWeeks: timelineData.total_weeks.toString(),
        totalHours: timelineData.total_hours.toString(),
        totalCost: timelineData.total_cost.toString(),
      })
      .returning();

    await db
      .update(projects)
      .set({
        status: "scoping",
        updatedAt: sql`NOW()`,
      })
      .where(eq(projects.id, id));

    return NextResponse.json({
      success: true,
      timeline: {
        id: timeline.id,
        timelineData: timeline.timelineData,
        totalWeeks: timeline.totalWeeks,
        totalHours: timeline.totalHours,
        totalCost: timeline.totalCost,
      },
      message: "Timeline generated successfully",
    });
  } catch (error) {
    if (error instanceof ClaudeError) {
      console.error("Claude AI error:", error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.error("Generate timeline error:", error);
    return NextResponse.json(
      { error: "Failed to generate timeline" },
      { status: 500 }
    );
  }
}
