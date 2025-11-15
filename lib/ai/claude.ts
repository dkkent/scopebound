import Anthropic from "@anthropic-ai/sdk";

// Initialize Claude client with API key from environment
export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 3, // Retry on network errors and rate limits
  timeout: 60000, // 60 seconds timeout
});

// Error types for better error handling
export class ClaudeError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public requestId?: string
  ) {
    super(message);
    this.name = "ClaudeError";
  }
}

export class ClaudeRateLimitError extends ClaudeError {
  constructor(message: string, public retryAfter?: number) {
    super(message, 429);
    this.name = "ClaudeRateLimitError";
  }
}

export class ClaudeOverloadedError extends ClaudeError {
  constructor(message: string) {
    super(message, 529);
    this.name = "ClaudeOverloadedError";
  }
}

// Error handler wrapper
export async function handleClaudeError<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    if (error instanceof Anthropic.APIConnectionError) {
      throw new ClaudeError(
        `Connection failed: ${error.message}`,
        undefined,
        undefined
      );
    } else if (error instanceof Anthropic.RateLimitError) {
      const retryAfter = error.headers?.get("retry-after")
        ? parseInt(error.headers.get("retry-after") || "60")
        : undefined;
      throw new ClaudeRateLimitError(
        "Rate limit exceeded. Please try again later.",
        retryAfter
      );
    } else if (error instanceof Anthropic.APIError) {
      // Check for overloaded (529) or other status codes
      if (error.status === 529) {
        throw new ClaudeOverloadedError(
          "Claude API is currently overloaded. Please try again in a few moments."
        );
      }
      throw new ClaudeError(error.message, error.status);
    }
    throw error;
  }
}

// Token counting utilities (approximate - Claude uses different tokenization)
export function estimateTokens(text: string): number {
  // Rough approximation: ~4 characters per token
  // This is conservative - actual tokenization may vary
  return Math.ceil(text.length / 4);
}

export function estimateTokensForMessages(
  messages: Array<{ role: string; content: string }>
): number {
  const totalText = messages.map((m) => m.content).join("");
  return estimateTokens(totalText);
}

// Rate limiting helpers
// NOTE: This is an in-memory rate limiter suitable for single-instance deployments.
// For production multi-instance/serverless environments, consider using:
// - Redis-based rate limiting (e.g., upstash/ratelimit)
// - Edge/CDN rate limiting
// - Anthropic's built-in rate limiting via API key quotas
export class RateLimiter {
  private requests: number[] = [];
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(maxRequests: number = 50, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove requests outside the current window
    this.requests = this.requests.filter((time) => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getWaitTime(): number {
    if (this.canMakeRequest()) return 0;

    const now = Date.now();
    const oldestRequest = this.requests[0];
    return this.windowMs - (now - oldestRequest);
  }

  async waitIfNeeded(): Promise<void> {
    const waitTime = this.getWaitTime();
    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

// Global rate limiter instance (50 requests per minute)
export const globalRateLimiter = new RateLimiter(50, 60000);

// Helper to call Claude with rate limiting
export async function callClaudeWithRateLimit<T>(
  operation: () => Promise<T>
): Promise<T> {
  await globalRateLimiter.waitIfNeeded();
  globalRateLimiter.recordRequest();
  return handleClaudeError(operation);
}

// Model constants
export const CLAUDE_MODELS = {
  OPUS: "claude-opus-4-20250514" as const,
  SONNET: "claude-sonnet-4-5-20250929" as const,
  HAIKU: "claude-haiku-4-5-20250929" as const,
};

// Default model for form generation (good balance of speed and quality)
export const DEFAULT_MODEL = CLAUDE_MODELS.SONNET;
