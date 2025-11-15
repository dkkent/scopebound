import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizationMembers } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { verifyOwnerAccess } from "@/lib/auth-helpers";
import { z } from "zod";

const updateRoleSchema = z.object({
  organizationId: z.string(),
  role: z.enum(["owner", "member"]),
});

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
    const body = await request.json();
    const validatedData = updateRoleSchema.parse(body);

    const isOwner = await verifyOwnerAccess(session.user.id, validatedData.organizationId);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Only organization owners can change member roles" },
        { status: 403 }
      );
    }

    const [updated] = await db
      .update(organizationMembers)
      .set({ role: validatedData.role })
      .where(
        and(
          eq(organizationMembers.id, id),
          eq(organizationMembers.organizationId, validatedData.organizationId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update member role error:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}
