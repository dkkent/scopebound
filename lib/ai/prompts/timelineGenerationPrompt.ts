import { z } from "zod";

// Zod schema for timeline generation output
export const timelinePhaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration_weeks: z.number(),
  tasks: z.array(z.string()),
  dependencies: z.array(z.string()),
});

export const timelineGenerationOutputSchema = z.object({
  phases: z.array(timelinePhaseSchema),
  total_weeks: z.number(),
  total_hours: z.number(),
  total_cost: z.number(),
  assumptions: z.array(z.string()),
  risks: z.array(z.string()),
});

export type TimelinePhase = z.infer<typeof timelinePhaseSchema>;
export type TimelineGenerationOutput = z.infer<
  typeof timelineGenerationOutputSchema
>;

// Prompt template for timeline generation
export function buildTimelineGenerationPrompt(params: {
  projectBrief: string;
  projectType: string;
  clientName: string;
  formResponses?: Record<string, any>;
  formData?: any;
  hourlyRate: string;
  organizationContext?: {
    customAiPrompts?: Record<string, any>;
  };
}): string {
  const {
    projectBrief,
    projectType,
    clientName,
    formResponses,
    formData,
    hourlyRate,
    organizationContext,
  } = params;

  const customInstructions =
    organizationContext?.customAiPrompts?.timelineGeneration || "";

  return `You are an expert project manager and estimator specializing in ${projectType} projects.

Based on the project details and client's questionnaire responses below, generate a detailed project timeline with phases, tasks, and cost estimates.

**Client Name**: ${clientName}
**Project Type**: ${projectType}
**Project Brief**: ${projectBrief}
**Hourly Rate**: $${hourlyRate}/hour

${formResponses && formData ? formatFormResponses(formResponses, formData) : ""}

${customInstructions ? `**Custom Instructions**: ${customInstructions}\n` : ""}

Generate a comprehensive project timeline broken down into logical phases. For each phase:
1. Provide a unique ID (e.g., "phase-1", "phase-2")
2. Provide a clear, descriptive name
3. Estimate duration in weeks (can use decimals like 1.5, 2.5)
4. List 3-7 high-level tasks or deliverables
5. Specify dependencies on other phase IDs

**Guidelines**:
- Include all typical phases for a ${projectType} project (e.g., Discovery & Planning, Design, Development, Testing, Launch)
- Account for client review cycles and feedback iterations
- Include buffer time for unexpected challenges (typically 15-20%)
- Consider dependencies and parallel work where applicable
- Provide realistic assumptions about team size, expertise, and working conditions
- Identify key risks that could impact the timeline
- Ensure total_cost = total_hours * ${hourlyRate}

**IMPORTANT**: You must respond with ONLY valid JSON matching this exact structure:

{
  "phases": [
    {
      "id": "phase-1",
      "name": "Discovery & Planning",
      "duration_weeks": 2,
      "tasks": [
        "Requirements gathering sessions",
        "Technical architecture design",
        "Project kickoff meeting"
      ],
      "dependencies": []
    },
    {
      "id": "phase-2",
      "name": "Design",
      "duration_weeks": 3,
      "tasks": [
        "Wireframes and mockups",
        "User interface design",
        "Design system creation"
      ],
      "dependencies": ["phase-1"]
    }
  ],
  "total_weeks": 12,
  "total_hours": 480,
  "total_cost": 72000,
  "assumptions": [
    "Client provides timely feedback within 2 business days",
    "All content and assets will be provided by client",
    "No major scope changes after approval"
  ],
  "risks": [
    "Third-party API integration delays",
    "Client availability for review cycles",
    "Potential scope creep in feature requirements"
  ]
}

Generate the timeline now:`;
}

// Helper function to format form responses for the prompt
function formatFormResponses(
  responses: Record<string, any>,
  formData: any
): string {
  if (!formData?.sections) {
    return "";
  }

  let formatted = "\n**Client Questionnaire Responses**:\n";
  
  formData.sections.forEach((section: any) => {
    formatted += `\n### ${section.title}\n`;
    if (section.description) {
      formatted += `${section.description}\n`;
    }

    section.questions.forEach((question: any) => {
      const answer = responses[question.id];
      formatted += `\n**Q: ${question.label}**`;
      if (question.required) {
        formatted += " *(Required)*";
      }
      formatted += "\n";

      if (answer !== undefined && answer !== null) {
        if (Array.isArray(answer)) {
          formatted += answer.length > 0 ? `A: ${answer.join(", ")}` : "A: Not answered";
        } else {
          formatted += `A: ${answer}`;
        }
      } else {
        formatted += "A: Not answered";
      }
      formatted += "\n";
    });
  });

  return formatted;
}
