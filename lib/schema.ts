import { pgTable, text, timestamp, varchar, pgEnum, boolean, numeric, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "nanoid";

// Enums
export const roleEnum = pgEnum("role", ["owner", "member"]);
export const projectTypeEnum = pgEnum("project_type", ["saas", "mobile", "web", "ecommerce", "custom"]);
export const projectStatusEnum = pgEnum("project_status", [
  "draft",
  "form_sent",
  "scoping",
  "approved",
  "in_progress",
  "completed",
]);

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

// Sessions table (for BetterAuth)
export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
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
  expiresAt: timestamp("expires_at", { mode: "string" }),
  password: text("password"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

// Verification tokens table (for BetterAuth)
export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

// Organizations table
export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
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
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
}, (table) => ({
  organizationIdx: index("org_members_org_idx").on(table.organizationId),
  userIdx: index("org_members_user_idx").on(table.userId),
}));

// Projects table
export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  clientName: text("client_name").notNull(),
  projectType: projectTypeEnum("project_type").notNull(),
  projectBrief: text("project_brief").notNull(),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  status: projectStatusEnum("status").notNull().default("draft"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
}, (table) => ({
  organizationIdx: index("projects_org_idx").on(table.organizationId),
  createdByIdx: index("projects_created_by_idx").on(table.createdBy),
  statusIdx: index("projects_status_idx").on(table.status),
}));

// Project forms table
export const projectForms = pgTable("project_forms", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  projectId: text("project_id")
    .notNull()
    .unique()
    .references(() => projects.id, { onDelete: "cascade" }),
  formData: jsonb("form_data").notNull(),
  clientEmail: text("client_email"),
  shareToken: text("share_token").unique().$defaultFn(() => nanoid(32)),
  submittedAt: timestamp("submitted_at", { mode: "string" }),
  submittedData: jsonb("submitted_data"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
}, (table) => ({
  projectIdx: index("project_forms_project_idx").on(table.projectId),
  shareTokenIdx: index("project_forms_share_token_idx").on(table.shareToken),
}));

// Project timelines table
export const projectTimelines = pgTable("project_timelines", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  timelineData: jsonb("timeline_data").notNull(),
  totalWeeks: numeric("total_weeks", { precision: 10, scale: 2 }).notNull(),
  totalHours: numeric("total_hours", { precision: 10, scale: 2 }).notNull(),
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }).notNull(),
  shareToken: text("share_token").unique().$defaultFn(() => nanoid(32)),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
}, (table) => ({
  projectIdx: index("project_timelines_project_idx").on(table.projectId),
  shareTokenIdx: index("project_timelines_share_token_idx").on(table.shareToken),
}));

// Organization settings table
export const organizationSettings = pgTable("organization_settings", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organizations.id, { onDelete: "cascade" }),
  defaultHourlyRate: numeric("default_hourly_rate", { precision: 10, scale: 2 }).notNull().default("150"),
  brandColor: text("brand_color").notNull().default("#10b981"),
  logoUrl: text("logo_url"),
  customPrompts: jsonb("custom_prompts"),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
}, (table) => ({
  organizationIdx: index("org_settings_org_idx").on(table.organizationId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  organizationMembers: many(organizationMembers),
  ownedOrganizations: many(organizations),
  sessions: many(sessions),
  accounts: many(accounts),
  createdProjects: many(projects),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, {
    fields: [organizations.ownerId],
    references: [users.id],
  }),
  members: many(organizationMembers),
  projects: many(projects),
  settings: one(organizationSettings, {
    fields: [organizations.id],
    references: [organizationSettings.organizationId],
  }),
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

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
  form: one(projectForms, {
    fields: [projects.id],
    references: [projectForms.projectId],
  }),
  timelines: many(projectTimelines),
}));

export const projectFormsRelations = relations(projectForms, ({ one }) => ({
  project: one(projects, {
    fields: [projectForms.projectId],
    references: [projects.id],
  }),
}));

export const projectTimelinesRelations = relations(projectTimelines, ({ one }) => ({
  project: one(projects, {
    fields: [projectTimelines.projectId],
    references: [projects.id],
  }),
}));

export const organizationSettingsRelations = relations(organizationSettings, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationSettings.organizationId],
    references: [organizations.id],
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

export const insertProjectSchema = createInsertSchema(projects, {
  name: z.string().min(1),
  clientName: z.string().min(1),
  projectBrief: z.string().min(10),
  hourlyRate: z.string().or(z.number()),
}).omit({
  id: true,
  createdBy: true, // Populated from session on server
  createdAt: true,
  updatedAt: true,
});

export const insertProjectFormSchema = createInsertSchema(projectForms, {
  formData: z.any(),
  clientEmail: z.string().email().optional(),
  submittedData: z.any().optional(),
}).omit({
  id: true,
  shareToken: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectTimelineSchema = createInsertSchema(projectTimelines, {
  timelineData: z.any(),
  totalWeeks: z.string().or(z.number()),
  totalHours: z.string().or(z.number()),
  totalCost: z.string().or(z.number()),
}).omit({
  id: true,
  shareToken: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSettingsSchema = createInsertSchema(organizationSettings, {
  defaultHourlyRate: z.string().or(z.number()).optional(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  customPrompts: z.any().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type ProjectForm = typeof projectForms.$inferSelect;
export type InsertProjectForm = z.infer<typeof insertProjectFormSchema>;
export type ProjectTimeline = typeof projectTimelines.$inferSelect;
export type InsertProjectTimeline = z.infer<typeof insertProjectTimelineSchema>;
export type OrganizationSettings = typeof organizationSettings.$inferSelect;
export type InsertOrganizationSettings = z.infer<typeof insertOrganizationSettingsSchema>;
