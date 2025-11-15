import { z } from "zod";

// Zod schema for form generation output
export const formQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["radio", "checkbox", "text", "select", "textarea"]),
  label: z.string(),
  description: z.string().optional(),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
        impact: z.string(), // e.g., "+8-12 hours", "Higher complexity"
      })
    )
    .optional(),
  required: z.boolean(),
});

export const formSectionSchema = z.object({
  title: z.string(),
  description: z.string(),
  questions: z.array(formQuestionSchema),
});

export const formGenerationOutputSchema = z.object({
  sections: z.array(formSectionSchema),
});

export type FormQuestion = z.infer<typeof formQuestionSchema>;
export type FormSection = z.infer<typeof formSectionSchema>;
export type FormGenerationOutput = z.infer<typeof formGenerationOutputSchema>;

// Prompt template for form generation
export function buildFormGenerationPrompt(params: {
  projectBrief: string;
  projectType: string;
  organizationContext?: {
    defaultHourlyRate?: string;
    customAiPrompts?: Record<string, any>;
  };
}): string {
  const { projectBrief, projectType, organizationContext } = params;

  const customInstructions =
    organizationContext?.customAiPrompts?.formGeneration || "";
  const hourlyRate = organizationContext?.defaultHourlyRate || "150";

  return `You are an expert project scoping assistant helping to gather detailed requirements from clients.

Based on the project brief and type below, generate a comprehensive client intake form that will help gather all necessary information to accurately scope and estimate the project.

**Project Type**: ${projectType}
**Project Brief**: ${projectBrief}
**Default Hourly Rate**: $${hourlyRate}/hour

${customInstructions ? `**Custom Instructions**: ${customInstructions}\n` : ""}

Generate a structured intake form with multiple sections. Each section should focus on a specific aspect of the project (e.g., Features, Design, Technical Requirements, Timeline, etc.).

For each question:
1. Use the appropriate input type (radio, checkbox, text, textarea, select)
2. Provide clear labels and helpful descriptions
3. For questions with options (radio/checkbox/select), include an "impact" field that explains how each choice affects the project scope or timeline (e.g., "+8-12 hours", "Increases complexity by 20%", "Requires additional API integration")
4. Mark critical questions as required

**Guidelines**:
- Ask about specific features and functionality
- Gather information about design preferences and branding
- Understand technical requirements (integrations, platforms, performance needs)
- Clarify timeline expectations and constraints
- Identify any existing assets or systems to integrate with
- Ask about user roles, permissions, and security requirements (if applicable)
- Include questions about post-launch support and maintenance expectations

Make the form comprehensive but not overwhelming - aim for 15-25 well-crafted questions organized into 4-6 logical sections.

**IMPORTANT**: You must respond with ONLY valid JSON matching this exact structure:

{
  "sections": [
    {
      "title": "Section Title",
      "description": "Brief description of this section",
      "questions": [
        {
          "id": "unique_question_id",
          "type": "radio" | "checkbox" | "text" | "textarea" | "select",
          "label": "Question text",
          "description": "Optional helpful context",
          "options": [
            {
              "value": "option_value",
              "label": "Option label",
              "impact": "Impact on project (e.g., +8-12 hours, Medium complexity)"
            }
          ],
          "required": true | false
        }
      ]
    }
  ]
}

Generate the form now:`;
}
