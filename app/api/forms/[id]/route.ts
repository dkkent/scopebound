import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectForms, projects } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

// GET /api/forms/[id] - Public endpoint to fetch form by shareToken (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find form by shareToken (not by primary key id)
    const form = await db
      .select({
        id: projectForms.id,
        formData: projectForms.formData,
        clientEmail: projectForms.clientEmail,
        submittedAt: projectForms.submittedAt,
        projectName: projects.name,
        clientName: projects.clientName,
      })
      .from(projectForms)
      .innerJoin(projects, eq(projectForms.projectId, projects.id))
      .where(eq(projectForms.shareToken, id))
      .limit(1);

    if (form.length === 0) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    const formData = form[0];

    // Check if already submitted
    if (formData.submittedAt) {
      return NextResponse.json(
        {
          error: "This form has already been submitted",
          submittedAt: formData.submittedAt,
        },
        { status: 410 } // 410 Gone
      );
    }

    // Return form data (no sensitive fields like project details)
    return NextResponse.json({
      formId: formData.id,
      formData: formData.formData,
      projectName: formData.projectName,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
    });
  } catch (error) {
    console.error("Get form error:", error);
    return NextResponse.json(
      { error: "Failed to fetch form" },
      { status: 500 }
    );
  }
}

// Helper to validate responses against form schema
function validateFormResponses(responses: Record<string, any>, formData: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const formSchema = formData as { sections: Array<{ questions: Array<{ id: string; type: string; required?: boolean; options?: any[] }> }> };

  formSchema.sections.forEach((section) => {
    section.questions.forEach((question) => {
      const value = responses[question.id];

      // Skip validation if value is undefined/null and field is optional
      if ((value === undefined || value === null) && !question.required) {
        return;
      }

      // Validate checkbox type and values
      if (question.type === "checkbox") {
        // Checkbox must always be an array (or undefined/null if optional)
        if (value !== undefined && value !== null) {
          if (!Array.isArray(value)) {
            errors.push(`${question.id}: Must be an array`);
            return;
          }
          // Check required field has values
          if (question.required && value.length === 0) {
            errors.push(`${question.id}: This field is required`);
            return;
          }
          // Validate values against allowed options
          const validOptions = question.options?.map(o => o.value) || [];
          const invalidValues = value.filter(v => !validOptions.includes(v));
          if (invalidValues.length > 0) {
            errors.push(`${question.id}: Invalid option(s) selected`);
          }
        } else if (question.required) {
          errors.push(`${question.id}: This field is required`);
        }
      }

      // Validate radio/select values
      if ((question.type === "radio" || question.type === "select")) {
        if (question.required && (!value || value.trim() === "")) {
          errors.push(`${question.id}: This field is required`);
        } else if (value && value.trim() !== "") {
          const validOptions = question.options?.map(o => o.value) || [];
          if (!validOptions.includes(value)) {
            errors.push(`${question.id}: Invalid option selected`);
          }
        }
      }

      // Validate text/textarea values
      if ((question.type === "text" || question.type === "textarea")) {
        if (question.required && (!value || (typeof value === "string" && value.trim() === ""))) {
          errors.push(`${question.id}: This field is required`);
        }
      }
    });
  });

  return { valid: errors.length === 0, errors };
}

// POST /api/forms/[id]/submit - Submit form responses (public, no auth required)
const submitSchema = z.object({
  responses: z.record(z.string(), z.any()),
  clientEmail: z.string().email().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validation = submitSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { responses, clientEmail } = validation.data;

    // Find form by shareToken
    const form = await db
      .select()
      .from(projectForms)
      .where(eq(projectForms.shareToken, id))
      .limit(1);

    if (form.length === 0) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    // Check if already submitted
    if (form[0].submittedAt) {
      return NextResponse.json(
        { error: "This form has already been submitted" },
        { status: 409 } // 409 Conflict
      );
    }

    // Validate responses against form schema
    const validationResult = validateFormResponses(responses, form[0].formData);
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: "Invalid form responses", details: validationResult.errors },
        { status: 400 }
      );
    }

    // Update form with submission data
    const updated = await db
      .update(projectForms)
      .set({
        submittedData: responses,
        submittedAt: sql`NOW()`,
        clientEmail: clientEmail || form[0].clientEmail,
        updatedAt: sql`NOW()`,
      })
      .where(eq(projectForms.id, form[0].id))
      .returning();

    // Update project status to "scoping"
    await db
      .update(projects)
      .set({
        status: "scoping",
        updatedAt: sql`NOW()`,
      })
      .where(eq(projects.id, form[0].projectId));

    return NextResponse.json({
      success: true,
      message: "Form submitted successfully",
      submittedAt: updated[0].submittedAt,
    });
  } catch (error) {
    console.error("Submit form error:", error);
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}
