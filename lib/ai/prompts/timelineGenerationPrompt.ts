import { z } from "zod";

// Zod schema for timeline generation output
export const timelinePhaseSchema = z.object({
  name: z.string(),
  description: z.string(),
  estimatedHours: z.number(),
  estimatedCost: z.number(),
  deliverables: z.array(z.string()),
  dependencies: z.array(z.string()).optional(),
});

export const timelineGenerationOutputSchema = z.object({
  phases: z.array(timelinePhaseSchema),
  totalHours: z.number(),
  totalCost: z.number(),
  estimatedWeeks: z.number(),
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
  formResponses?: Record<string, any>;
  hourlyRate: string;
  organizationContext?: {
    customAiPrompts?: Record<string, any>;
  };
}): string {
  const {
    projectBrief,
    projectType,
    formResponses,
    hourlyRate,
    organizationContext,
  } = params;

  const customInstructions =
    organizationContext?.customAiPrompts?.timelineGeneration || "";

  return `You are an expert project manager and estimator specializing in ${projectType} projects.

Based on the project details below, generate a detailed project timeline with phases, deliverables, and cost estimates.

**Project Type**: ${projectType}
**Project Brief**: ${projectBrief}
**Hourly Rate**: $${hourlyRate}/hour
${formResponses ? `**Client Requirements**: ${JSON.stringify(formResponses, null, 2)}` : ""}

${customInstructions ? `**Custom Instructions**: ${customInstructions}\n` : ""}

Generate a comprehensive project timeline broken down into logical phases. For each phase:
1. Provide a clear name and description
2. Estimate hours required (be realistic and include buffer time)
3. Calculate cost based on the hourly rate
4. List specific deliverables
5. Note any dependencies on previous phases

**Guidelines**:
- Include all typical phases for a ${projectType} project (e.g., Discovery, Design, Development, Testing, Launch)
- Account for client review cycles and feedback iterations
- Include buffer time for unexpected challenges (typically 15-20%)
- Consider dependencies and parallel work where applicable
- Provide assumptions about team size, expertise, and working conditions
- Identify key risks that could impact the timeline

**IMPORTANT**: You must respond with ONLY valid JSON matching this exact structure:

{
  "phases": [
    {
      "name": "Phase Name",
      "description": "What happens in this phase",
      "estimatedHours": 40,
      "estimatedCost": 6000,
      "deliverables": [
        "Specific deliverable 1",
        "Specific deliverable 2"
      ],
      "dependencies": ["Previous phase name if applicable"]
    }
  ],
  "totalHours": 200,
  "totalCost": 30000,
  "estimatedWeeks": 8,
  "assumptions": [
    "Assumption about team, resources, or approach",
    "Another key assumption"
  ],
  "risks": [
    "Potential risk that could impact timeline",
    "Another risk to consider"
  ]
}

Generate the timeline now:`;
}
