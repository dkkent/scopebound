import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { organizationMembers, organizationSettings } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

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

// GET /api/organizations/[id]/settings - Get organization settings
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

    // Verify user is a member of the organization
    const isMember = await verifyOrganizationMembership(session.user.id, id);
    if (!isMember) {
      return NextResponse.json(
        { error: "Not a member of this organization" },
        { status: 403 }
      );
    }

    // Get organization settings
    const settings = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, id))
      .limit(1);

    // If no settings exist, create default ones
    if (settings.length === 0) {
      const newSettings = await db
        .insert(organizationSettings)
        .values({
          organizationId: id,
          defaultHourlyRate: "150",
          brandColor: "#10b981",
        })
        .returning();

      return NextResponse.json({ settings: newSettings[0] });
    }

    return NextResponse.json({ settings: settings[0] });
  } catch (error) {
    console.error("Get organization settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization settings" },
      { status: 500 }
    );
  }
}
