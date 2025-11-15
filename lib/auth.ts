import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { users, sessions, accounts, verifications } from "./schema";

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
    updateAge: 60 * 60 * 24, // 1 day
  },
  secret: process.env.SESSION_SECRET || process.env.BETTER_AUTH_SECRET || "development-secret-change-in-production",
  trustedOrigins: buildTrustedOrigins(),
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5000",
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
