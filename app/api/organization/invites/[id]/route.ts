import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizationInvites } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { verifyOwnerAccess } from "@/lib/auth-helpers";

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

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    const isOwner = await verifyOwnerAccess(session.user.id, organizationId);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Only organization owners can cancel invitations" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const [deleted] = await db
      .delete(organizationInvites)
      .where(
        and(
          eq(organizationInvites.id, id),
          eq(organizationInvites.organizationId, organizationId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete invite error:", error);
    return NextResponse.json(
      { error: "Failed to cancel invitation" },
      { status: 500 }
    );
  }
}
