import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customProjectTypes, insertCustomProjectTypeSchema } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { verifyMemberAccess, verifyOwnerAccess } from "@/lib/auth-helpers";
import { z } from "zod";

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

    const types = await db
      .select()
      .from(customProjectTypes)
      .where(eq(customProjectTypes.organizationId, organizationId));

    return NextResponse.json(types);
  } catch (error) {
    console.error("Get project types error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project types" },
      { status: 500 }
    );
  }
}

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
    const data = insertCustomProjectTypeSchema.parse(body);

    const isOwner = await verifyOwnerAccess(session.user.id, data.organizationId);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Only organization owners can create project types" },
        { status: 403 }
      );
    }

    const [newType] = await db
      .insert(customProjectTypes)
      .values({
        id: nanoid(),
        ...data,
      })
      .returning();

    return NextResponse.json(newType);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create project type error:", error);
    return NextResponse.json(
      { error: "Failed to create project type" },
      { status: 500 }
    );
  }
}
