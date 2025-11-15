import {
  claude,
  callClaudeWithRateLimit,
  DEFAULT_MODEL,
  ClaudeError,
} from "./claude";
import {
  buildTimelineGenerationPrompt,
  timelineGenerationOutputSchema,
  type TimelineGenerationOutput,
} from "./prompts/timelineGenerationPrompt";

interface GenerateTimelineParams {
  projectBrief: string;
  projectType: "saas" | "mobile" | "web" | "ecommerce" | "custom";
  clientName: string;
  hourlyRate: string;
  submittedFormData: Record<string, any>;
  formData: any;
  organizationContext?: {
    customAiPrompts?: Record<string, any>;
  };
}

export async function generateTimeline(
  params: GenerateTimelineParams
): Promise<TimelineGenerationOutput> {
  const {
    projectBrief,
    projectType,
    clientName,
    hourlyRate,
    submittedFormData,
    formData,
    organizationContext,
  } = params;

  const prompt = buildTimelineGenerationPrompt({
    projectBrief,
    projectType,
    clientName,
    hourlyRate,
    formResponses: submittedFormData,
    formData,
    organizationContext,
  });

  try {
    const response = await callClaudeWithRateLimit(async () => {
      return await claude.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 8000,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });
    });

    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new ClaudeError("No text content in Claude response");
    }

    const responseText = textContent.text;

    let jsonResponse: any;
    try {
      const jsonMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      let jsonText = jsonMatch ? jsonMatch[1] : responseText;
      
      jsonText = jsonText
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      
      jsonResponse = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error("Failed to parse Claude response as JSON:");
      console.error("Response length:", responseText.length);
      console.error("First 1000 chars:", responseText.substring(0, 1000));
      console.error("Last 500 chars:", responseText.substring(responseText.length - 500));
      console.error("Parse error:", parseError);
      throw new ClaudeError(
        "Claude response was not valid JSON. Please try again."
      );
    }

    const validatedResponse = timelineGenerationOutputSchema.parse(jsonResponse);

    return validatedResponse;
  } catch (error) {
    if (error instanceof ClaudeError) {
      throw error;
    }

    console.error("Error generating timeline with Claude:", error);
    throw new ClaudeError(
      `Failed to generate timeline: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
