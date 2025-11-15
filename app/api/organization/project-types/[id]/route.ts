import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customProjectTypes } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { verifyOwnerAccess } from "@/lib/auth-helpers";
import { z } from "zod";

const updateTypeSchema = z.object({
  organizationId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  defaultHourlyRate: z.string().optional(),
  aiPromptTemplate: z.string().optional(),
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
    const validatedData = updateTypeSchema.parse(body);

    const isOwner = await verifyOwnerAccess(session.user.id, validatedData.organizationId);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Only organization owners can update project types" },
        { status: 403 }
      );
    }

    const [updated] = await db
      .update(customProjectTypes)
      .set({
        name: validatedData.name,
        description: validatedData.description,
        defaultHourlyRate: validatedData.defaultHourlyRate,
        aiPromptTemplate: validatedData.aiPromptTemplate,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(customProjectTypes.id, id),
          eq(customProjectTypes.organizationId, validatedData.organizationId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Project type not found" },
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
    console.error("Update project type error:", error);
    return NextResponse.json(
      { error: "Failed to update project type" },
      { status: 500 }
    );
  }
}

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
        { error: "Only organization owners can delete project types" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const [deleted] = await db
      .delete(customProjectTypes)
      .where(
        and(
          eq(customProjectTypes.id, id),
          eq(customProjectTypes.organizationId, organizationId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Project type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete project type error:", error);
    return NextResponse.json(
      { error: "Failed to delete project type" },
      { status: 500 }
    );
  }
}
