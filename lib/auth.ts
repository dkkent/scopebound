import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import { users, sessions, accounts, verifications } from "./schema";
import { randomUUID } from "crypto";

// Build trusted origins list from environment
const buildTrustedOrigins = () => {
  const origins = ["http://localhost:5000"];
  
  // Add Replit domains if available
  if (process.env.REPLIT_DOMAINS) {
    const replitDomains = process.env.REPLIT_DOMAINS.split(",");
    replitDomains.forEach(domain => {
      origins.push(`https://${domain.trim()}`);
    });
  }
  
  // Add custom app URL if provided
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL);
  }
  
  return origins;
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day - refresh session daily
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cache - balances performance and freshness
    },
  },
  secret: process.env.SESSION_SECRET || process.env.BETTER_AUTH_SECRET || "development-secret-change-in-production",
  trustedOrigins: buildTrustedOrigins(),
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5000",
  advanced: {
    cookiePrefix: "better-auth",
    generateId: () => randomUUID(),
    crossSubDomainCookies: {
      enabled: true,
    },
    // Explicit cookie attributes for persistence
    defaultCookieAttributes: {
      maxAge: 60 * 60 * 24 * 7, // 7 days - CRITICAL for persistent cookies
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Allow cross-page navigation
      path: "/",
      // httpOnly managed by BetterAuth per cookie type (session vs cache)
    },
  },
  plugins: [
    nextCookies(), // Required for Next.js to properly handle session cookies
  ],
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
