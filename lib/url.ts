/**
 * Get the base URL for the application
 * Prioritizes environment variables over request origin to ensure correct URLs
 * especially when running in containerized/proxied environments like Replit
 */
export function getBaseUrl(requestOrigin?: string): string {
  // 1. Prefer explicit NEXT_PUBLIC_APP_URL if set
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 2. Use REPLIT_DOMAINS for Replit deployments
  if (process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(",");
    const primaryDomain = domains[0].trim();
    return `https://${primaryDomain}`;
  }

  // 3. Fall back to request origin (for local development)
  if (requestOrigin) {
    return requestOrigin;
  }

  // 4. Default fallback
  return "http://localhost:5000";
}
