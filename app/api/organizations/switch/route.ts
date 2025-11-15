import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizationMembers } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const switchSchema = z.object({
  organizationId: z.string(),
});

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
    const { organizationId } = switchSchema.parse(body);

    // Verify user is a member of the organization
    const membership = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, session.user.id),
          eq(organizationMembers.organizationId, organizationId)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json(
        { error: "Not a member of this organization" },
        { status: 403 }
      );
    }

    // In a real app, you'd store the current organization in session or cookie
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      organizationId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Switch organization error:", error);
    return NextResponse.json(
      { error: "Failed to switch organization" },
      { status: 500 }
    );
  }
}
