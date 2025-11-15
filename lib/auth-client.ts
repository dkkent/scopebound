import { createAuthClient } from "better-auth/react";

// Detect the correct base URL for the current environment
function getBaseURL() {
  // If running in browser, use the current origin
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  
  // Fallback to environment variable or localhost for SSR
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5000";
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
