import {
  claude,
  callClaudeWithRateLimit,
  DEFAULT_MODEL,
  ClaudeError,
} from "./claude";
import {
  buildFormGenerationPrompt,
  formGenerationOutputSchema,
  type FormGenerationOutput,
} from "./prompts/formGenerationPrompt";

interface GenerateFormParams {
  projectBrief: string;
  projectType: "saas" | "mobile" | "web" | "ecommerce" | "custom";
  organizationContext?: {
    defaultHourlyRate?: string;
    customAiPrompts?: Record<string, any>;
  };
}

export async function generateForm(
  params: GenerateFormParams
): Promise<FormGenerationOutput> {
  const { projectBrief, projectType, organizationContext } = params;

  // Build the prompt
  const prompt = buildFormGenerationPrompt({
    projectBrief,
    projectType,
    organizationContext,
  });

  try {
    // Call Claude with rate limiting
    const response = await callClaudeWithRateLimit(async () => {
      return await claude.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 8000, // Increased to allow for comprehensive forms
        temperature: 0.7, // Balanced creativity and consistency
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });
    });

    // Extract the text content from the response
    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new ClaudeError("No text content in Claude response");
    }

    const responseText = textContent.text;

    // Parse JSON response
    let jsonResponse: any;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      let jsonText = jsonMatch ? jsonMatch[1] : responseText;
      
      // Decode HTML entities that Claude sometimes returns
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

    // Validate against schema
    const validatedResponse = formGenerationOutputSchema.parse(jsonResponse);

    return validatedResponse;
  } catch (error) {
    if (error instanceof ClaudeError) {
      throw error;
    }

    console.error("Error generating form with Claude:", error);
    throw new ClaudeError(
      `Failed to generate form: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Helper to generate a unique question ID
export function generateQuestionId(
  sectionIndex: number,
  questionIndex: number,
  label: string
): string {
  const sanitizedLabel = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .substring(0, 30);
  return `q_${sectionIndex}_${questionIndex}_${sanitizedLabel}`;
}

// Helper to validate and sanitize the generated form
export function sanitizeFormOutput(
  form: FormGenerationOutput
): FormGenerationOutput {
  return {
    sections: form.sections.map((section, sectionIndex) => ({
      ...section,
      questions: section.questions.map((question, questionIndex) => {
        // Ensure question has a valid ID
        const id =
          question.id ||
          generateQuestionId(sectionIndex, questionIndex, question.label);

        // Ensure options exist for choice-based questions
        if (
          ["radio", "checkbox", "select"].includes(question.type) &&
          (!question.options || question.options.length === 0)
        ) {
          console.warn(
            `Question "${question.label}" is type "${question.type}" but has no options. Changing type to "text".`
          );
          return {
            ...question,
            id,
            type: "text" as const,
            options: undefined,
          };
        }

        return {
          ...question,
          id,
        };
      }),
    })),
  };
}
