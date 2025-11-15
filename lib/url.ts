/**
 * Get the base URL for the application
 * Prioritizes environment variables over request origin to ensure correct URLs
 * especially when running in containerized/proxied environments like Replit
 */
export function getBaseUrl(requestOrigin?: string): string {
  // Helper to check if URL is localhost
  const isLocalhost = (url: string) => {
    return url.includes('localhost') || url.includes('127.0.0.1');
  };

  // 1. Prefer explicit NEXT_PUBLIC_APP_URL if set and not localhost
  if (process.env.NEXT_PUBLIC_APP_URL && !isLocalhost(process.env.NEXT_PUBLIC_APP_URL)) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 2. Use REPLIT_DOMAINS for Replit deployments
  if (process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(",");
    const primaryDomain = domains[0].trim();
    return `https://${primaryDomain}`;
  }

  // 3. Fall back to request origin if not localhost
  if (requestOrigin && !isLocalhost(requestOrigin)) {
    return requestOrigin;
  }

  // 4. Default fallback for local development
  return "http://localhost:5000";
}
