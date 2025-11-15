import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizationInvites, organizations, insertOrganizationInviteSchema } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sendEmail } from "@/lib/email/sendEmail";
import { generateInviteEmailHtml, generateInviteEmailText } from "@/lib/email/inviteEmail";
import { verifyOwnerAccess } from "@/lib/auth-helpers";
import { z } from "zod";
import { inviteRateLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await inviteRateLimiter.check(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: "Too many invitation requests. Please try again later.",
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

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
    const data = insertOrganizationInviteSchema.parse(body);

    const isOwner = await verifyOwnerAccess(session.user.id, data.organizationId);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Only organization owners can send invitations" },
        { status: 403 }
      );
    }

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, data.organizationId))
      .limit(1);

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const existing = await db
      .select()
      .from(organizationInvites)
      .where(
        and(
          eq(organizationInvites.organizationId, data.organizationId),
          eq(organizationInvites.email, data.email)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "User already invited" },
        { status: 400 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [invite] = await db
      .insert(organizationInvites)
      .values({
        id: nanoid(),
        ...data,
        invitedBy: session.user.id,
        expiresAt: expiresAt.toISOString(),
      })
      .returning();

    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const host = request.headers.get("host") || "localhost:5000";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    const inviteUrl = `${baseUrl}/invite/${invite.inviteToken}`;

    sendEmail({
      to: invite.email.trim(),
      subject: `You've been invited to join ${org.name}`,
      html: generateInviteEmailHtml({
        recipientEmail: invite.email.trim(),
        organizationName: org.name,
        inviterName: session.user.name,
        inviteUrl,
      }),
      text: generateInviteEmailText({
        recipientEmail: invite.email.trim(),
        organizationName: org.name,
        inviterName: session.user.name,
        inviteUrl,
      }),
    }).catch(error => {
      console.error("Failed to send invitation email:", error);
    });

    return NextResponse.json(invite);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Send invite error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send invitation" },
      { status: 500 }
    );
  }
}
