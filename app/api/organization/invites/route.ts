import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizationInvites } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq, and, isNull } from "drizzle-orm";
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

    const invites = await db
      .select()
      .from(organizationInvites)
      .where(
        and(
          eq(organizationInvites.organizationId, organizationId),
          isNull(organizationInvites.acceptedAt)
        )
      );

    return NextResponse.json(invites);
  } catch (error) {
    console.error("Get invites error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}
