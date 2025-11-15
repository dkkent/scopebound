import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectTimelines, projects } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params;

    const timeline = await db
      .select({
        timeline: projectTimelines,
        project: projects,
      })
      .from(projectTimelines)
      .innerJoin(projects, eq(projectTimelines.projectId, projects.id))
      .where(eq(projectTimelines.shareToken, shareToken))
      .limit(1);

    if (timeline.length === 0) {
      return NextResponse.json(
        { error: "Timeline not found or not shared" },
        { status: 404 }
      );
    }

    if (timeline[0].project.status !== "approved") {
      return NextResponse.json(
        { error: "Timeline is not yet approved" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      timeline: timeline[0].timeline,
      project: {
        name: timeline[0].project.name,
        clientName: timeline[0].project.clientName,
        projectType: timeline[0].project.projectType,
        projectBrief: timeline[0].project.projectBrief,
      },
    });
  } catch (error) {
    console.error("Get timeline error:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline" },
      { status: 500 }
    );
  }
}
