import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, projectForms, projectTimelines } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq, sql, and, gte } from "drizzle-orm";
import { verifyMemberAccess } from "@/lib/auth-helpers";

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

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    const isMember = await verifyMemberAccess(session.user.id, organizationId);
    if (!isMember) {
      return NextResponse.json(
        { error: "Not a member of this organization" },
        { status: 403 }
      );
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [projectsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(
        and(
          eq(projects.organizationId, organizationId),
          gte(projects.createdAt, startOfMonth.toISOString())
        )
      );

    const [formsCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(projectForms)
      .innerJoin(projects, eq(projectForms.projectId, projects.id))
      .where(
        and(
          eq(projects.organizationId, organizationId),
          gte(projectForms.createdAt, startOfMonth.toISOString())
        )
      );

    const [timelinesCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(projectTimelines)
      .innerJoin(projects, eq(projectTimelines.projectId, projects.id))
      .where(
        and(
          eq(projects.organizationId, organizationId),
          gte(projectTimelines.createdAt, startOfMonth.toISOString())
        )
      );

    return NextResponse.json({
      projectsCreated: projectsCount?.count || 0,
      formsSent: formsCount?.count || 0,
      timelinesGenerated: timelinesCount?.count || 0,
    });
  } catch (error) {
    console.error("Get usage stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage statistics" },
      { status: 500 }
    );
  }
}
