import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { projects, projectForms, organizationMembers, organizationSettings } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateForm, sanitizeFormOutput } from "@/lib/ai/generateForm";
import { ClaudeError, ClaudeRateLimitError, ClaudeOverloadedError } from "@/lib/ai/claude";
import { nanoid } from "nanoid";

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

// Helper to get project and verify access
async function getProjectAndVerifyAccess(projectId: string, userId: string) {
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (project.length === 0) {
    return { error: "Project not found", status: 404 };
  }

  const isMember = await verifyOrganizationMembership(userId, project[0].organizationId);
  if (!isMember) {
    return { error: "Not a member of this organization", status: 403 };
  }

  return { project: project[0] };
}

// POST /api/projects/[id]/generate-form - Generate client intake form using AI
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
    const result = await getProjectAndVerifyAccess(id, session.user.id);

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const project = result.project;

    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Claude AI is not configured. Please add ANTHROPIC_API_KEY to environment variables." },
        { status: 503 }
      );
    }

    // Get organization settings for context
    const orgSettings = await db
      .select()
      .from(organizationSettings)
      .where(eq(organizationSettings.organizationId, project.organizationId))
      .limit(1);

    const organizationContext = orgSettings.length > 0
      ? {
          defaultHourlyRate: orgSettings[0].defaultHourlyRate || undefined,
          customAiPrompts: orgSettings[0].customAiPrompts || undefined,
        }
      : undefined;

    // Generate form using Claude
    const generatedForm = await generateForm({
      projectBrief: project.projectBrief,
      projectType: project.projectType,
      organizationContext,
    });

    // Sanitize the output to ensure data quality
    const sanitizedForm = sanitizeFormOutput(generatedForm);

    console.log("📝 Sanitized form data:", JSON.stringify(sanitizedForm).substring(0, 200));

    // Check if a form already exists for this project
    const existingForm = await db
      .select()
      .from(projectForms)
      .where(eq(projectForms.projectId, project.id))
      .limit(1);

    console.log("📋 Existing forms found:", existingForm.length);

    let savedForm;

    if (existingForm.length > 0) {
      console.log("🔄 Updating existing form:", existingForm[0].id);
      // Update existing form
      const updatedForm = await db
        .update(projectForms)
        .set({
          formData: sanitizedForm,
          updatedAt: sql`NOW()`,
        })
        .where(eq(projectForms.id, existingForm[0].id))
        .returning();

      savedForm = updatedForm[0];
      console.log("✅ Form updated successfully");
    } else {
      console.log("➕ Creating new form for project:", project.id);
      const formId = nanoid();
      const token = nanoid(32);
      console.log("   Form ID:", formId);
      console.log("   Share token length:", token.length);
      
      // Create new form
      const newForm = await db
        .insert(projectForms)
        .values({
          id: formId,
          projectId: project.id,
          formData: sanitizedForm,
          shareToken: token,
          clientEmail: null,
          submittedAt: null,
        })
        .returning();

      console.log("✅ Form created, rows returned:", newForm.length);
      savedForm = newForm[0];
      console.log("   Saved form ID:", savedForm?.id);
    }

    // Return only the form data, excluding sensitive fields like shareToken
    return NextResponse.json({
      success: true,
      formData: savedForm.formData,
      formId: savedForm.id,
      message: "Form generated successfully",
    });
  } catch (error) {
    // Handle Claude-specific errors
    if (error instanceof ClaudeRateLimitError) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again in a few moments.",
          retryAfter: error.retryAfter,
        },
        { status: 429 }
      );
    }

    if (error instanceof ClaudeOverloadedError) {
      return NextResponse.json(
        { error: "Claude AI is currently experiencing high demand. Please try again shortly." },
        { status: 503 }
      );
    }

    if (error instanceof ClaudeError) {
      return NextResponse.json(
        { error: `AI generation failed: ${error.message}` },
        { status: 500 }
      );
    }

    console.error("Generate form error:", error);
    return NextResponse.json(
      { error: "Failed to generate form" },
      { status: 500 }
    );
  }
}
