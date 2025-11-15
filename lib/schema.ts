import { pgTable, text, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["owner", "member"]);

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// Sessions table (for BetterAuth)
export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// Accounts table (for BetterAuth password storage)
export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  password: text("password"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// Verification tokens table (for BetterAuth)
export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// Organizations table
export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Organization members table
export const organizationMembers = pgTable("organization_members", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  organizationMembers: many(organizationMembers),
  ownedOrganizations: many(organizations),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, {
    fields: [organizations.ownerId],
    references: [users.id],
  }),
  members: many(organizationMembers),
}));

export const organizationMembersRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMembers.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [organizationMembers.userId],
      references: [users.id],
    }),
  })
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  name: z.string().min(1),
}).pick({
  email: true,
  name: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations, {
  name: z.string().min(1),
}).pick({
  name: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
