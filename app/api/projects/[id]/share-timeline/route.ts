import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { projects, projectTimelines, organizationMembers, projectForms } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sendEmail } from "@/lib/email/sendEmail";
import { generateTimelineEmailHtml, generateTimelineEmailText } from "@/lib/email/timelineEmail";
import { getBaseUrl } from "@/lib/url";

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

export async function POST(
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

    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const isMember = await verifyOrganizationMembership(
      session.user.id,
      project[0].organizationId
    );

    if (!isMember) {
      return NextResponse.json(
        { error: "Not a member of this organization" },
        { status: 403 }
      );
    }

    if (project[0].status !== "approved") {
      return NextResponse.json(
        { error: "Timeline must be approved before sharing" },
        { status: 400 }
      );
    }

    const timeline = await db
      .select()
      .from(projectTimelines)
      .where(eq(projectTimelines.projectId, id))
      .orderBy(desc(projectTimelines.createdAt))
      .limit(1);

    if (timeline.length === 0) {
      return NextResponse.json(
        { error: "No timeline found for this project" },
        { status: 404 }
      );
    }

    let shareToken = timeline[0].shareToken;
    const isNewShare = !shareToken;
    
    if (!shareToken) {
      shareToken = nanoid(32);
      await db
        .update(projectTimelines)
        .set({ shareToken })
        .where(eq(projectTimelines.id, timeline[0].id));
    }

    // Send email notification if this is a new share and client email exists
    if (isNewShare) {
      const form = await db
        .select()
        .from(projectForms)
        .where(eq(projectForms.projectId, id))
        .limit(1);

      // Validate client email before sending
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const hasValidEmail = form.length > 0 && form[0].clientEmail && emailRegex.test(form[0].clientEmail);

      if (hasValidEmail) {
        const baseUrl = getBaseUrl(request);
        const timelineUrl = `${baseUrl}/timeline/${shareToken}`;

        const emailHtml = generateTimelineEmailHtml({
          clientName: project[0].clientName,
          clientEmail: form[0].clientEmail,
          projectName: project[0].name,
          timelineUrl,
        });

        const emailText = generateTimelineEmailText({
          clientName: project[0].clientName,
          clientEmail: form[0].clientEmail,
          projectName: project[0].name,
          timelineUrl,
        });

        // Send email (non-blocking, don't wait for response)
        sendEmail({
          to: form[0].clientEmail,
          subject: `Your Project Timeline for ${project[0].name} is Ready`,
          html: emailHtml,
          text: emailText,
        }).catch((error) => {
          console.error("Failed to send timeline email:", error);
        });
      }
    }

    return NextResponse.json({
      success: true,
      shareToken,
      message: isNewShare 
        ? "Timeline shared successfully. Email notification sent to client."
        : "Timeline share link retrieved successfully.",
    });
  } catch (error) {
    console.error("Share timeline error:", error);
    return NextResponse.json(
      { error: "Failed to share timeline" },
      { status: 500 }
    );
  }
}
