import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations, organizationSettings, insertOrganizationSettingsSchema } from "@/lib/schema";
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

    let [settings] = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, organizationId))
      .limit(1);

    if (!settings) {
      const isOwner = await verifyOwnerAccess(session.user.id, organizationId);
      if (!isOwner) {
        return NextResponse.json(
          { error: "Organization settings not configured. Contact organization owner." },
          { status: 404 }
        );
      }

      [settings] = await db
        .insert(organizationSettings)
        .values({
          id: nanoid(),
          organizationId,
          defaultHourlyRate: "150",
          brandColor: "#10b981",
        })
        .returning();
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Get organization settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

const updateSettingsSchema = z.object({
  organizationId: z.string(),
  name: z.string().optional(),
  defaultHourlyRate: z.string().optional(),
  brandColor: z.string().optional(),
  logoUrl: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
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
    const validatedData = updateSettingsSchema.parse(body);

    const isOwner = await verifyOwnerAccess(session.user.id, validatedData.organizationId);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Only organization owners can update settings" },
        { status: 403 }
      );
    }
    
    if (validatedData.name) {
      const [org] = await db
        .update(organizations)
        .set({ name: validatedData.name })
        .where(eq(organizations.id, validatedData.organizationId))
        .returning();
      
      if (!org) {
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 }
        );
      }
    }

    const settingsData = insertOrganizationSettingsSchema.parse({
      organizationId: validatedData.organizationId,
      defaultHourlyRate: validatedData.defaultHourlyRate,
      brandColor: validatedData.brandColor,
      logoUrl: validatedData.logoUrl,
    });

    let [settings] = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, validatedData.organizationId))
      .limit(1);

    if (settings) {
      [settings] = await db
        .update(organizationSettings)
        .set({
          defaultHourlyRate: settingsData.defaultHourlyRate,
          brandColor: settingsData.brandColor,
          logoUrl: settingsData.logoUrl,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(organizationSettings.organizationId, validatedData.organizationId))
        .returning();
    } else {
      [settings] = await db
        .insert(organizationSettings)
        .values({
          id: nanoid(),
          ...settingsData,
        })
        .returning();
    }

    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update organization settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
