# Scopebound - Multi-tenant SaaS Platform

## Overview
Scopebound is a modern multi-tenant SaaS application built with Next.js 14, providing a foundation for building SaaS products with team collaboration features. It features secure authentication, organization management, and a clean, productivity-focused design system inspired by Linear and Notion. The platform includes AI-powered client intake form generation using Claude AI and a comprehensive project management system with organization-based access control.

## User Preferences
Preferred communication style: Simple, everyday language.

## Development Notes

### Performance Architecture
- **Server-Side Data Fetching**: Dashboard and settings pages use Next.js 14 server components to fetch data before rendering
- **Organization Context Provider**: Layout fetches user organizations once server-side and provides via React context to eliminate redundant API calls across pages
- **Database Indexing**: 14 indexes on foreign keys and composite query patterns ensure fast lookups and joins
- **Eliminated Waterfalls**: Pages no longer fetch organizations client-side, wait, then fetch content - all data is fetched server-side before initial render
- **Performance Gains**: Page load times reduced from ~2.8-3.0s to ~2.0s (33% improvement) through optimized data fetching and database indexes

### Session Persistence & Testing
- **Session persistence works correctly** when accessing the app via the direct Replit URL
- **Known limitation**: Session cookies do NOT persist when viewing the app inside the Replit IDE iframe due to browser third-party cookie restrictions
- **Solution**: Always test authentication flows using the direct application URL, not the IDE preview
- Authentication uses BetterAuth with email/password, cookies are HttpOnly with 7-day expiry

### Shareable Links
- **URL generation**: Uses `lib/url.ts` helper to automatically detect correct base URL for Replit deployments
- **Priority order**: NEXT_PUBLIC_APP_URL (if not localhost) → REPLIT_DOMAINS → request origin (if not localhost) → localhost fallback
- **Replit deployment**: Automatically uses REPLIT_DOMAINS environment variable for correct public URLs
- **Public forms**: Clients can access forms via `/f/[shareToken]` without authentication

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 14 with App Router.
- **UI Library**: Custom component library built with Tailwind CSS and Radix UI patterns (shadcn/ui).
- **State Management**: React hooks for client-side form state; server components for data fetching.
- **Styling**: Tailwind CSS with a custom design system based on spacing primitives and HSL CSS variables for light/dark mode. Inter font family for typography.
- **Route Protection**: Middleware-based authentication for protecting routes and redirecting unauthenticated users.

### Backend Architecture
- **API Design**: Next.js API Routes with RESTful conventions.
- **Authentication Flow**: BetterAuth with email/password strategy, session-based authentication, and secure HTTP-only cookies.
- **Multi-tenancy Model**: Organization-based tenancy with users belonging to multiple organizations and role-based access control (owner, member).
- **Data Access**: Drizzle ORM for type-safe query building with Neon Serverless PostgreSQL.
- **AI Integration**: Claude AI for intelligent client intake form generation, integrated via dedicated API endpoints and services.

### Data Storage
- **Database**: PostgreSQL via Neon Serverless, utilizing `drizzle-orm` for schema management.
- **Schema Design**:
    - **Authentication & User Management**: `users`, `session`, `account`, `verification`.
    - **Multi-tenancy**: `organizations`, `organization_members`, `organization_settings`, `custom_project_types`, `organization_invites`.
    - **Project Management**: `projects` (core project records), `project_forms` (dynamic client intake forms in JSONB), `project_timelines` (AI-generated timelines in JSONB).
- **Key Features**: All timestamp columns use `{ mode: "string" }` for BetterAuth compatibility. Project IDs use `nanoid`. JSONB columns store flexible data structures. Share tokens enable public access to forms and timelines. Enums enforce valid project types and status transitions.
- **Migrations**: Drizzle Kit for schema migrations.
- **Performance Optimization**: 14 database indexes on foreign keys and composite query patterns for optimal query performance:
    - Foreign key indexes: `organization_members(user_id, organization_id)`, `organization_settings(organization_id)`, `custom_project_types(organization_id)`, `organization_invites(organization_id, email)`, `projects(organization_id, status, created_at)`, `project_forms(project_id)`, `project_timelines(project_id)`
    - Composite indexes: `projects(organization_id, status)`, `projects(organization_id, created_at DESC)`, `organization_members(user_id, organization_id)`

### Authentication & Authorization
- **Library**: BetterAuth v1.3.34 for email/password authentication, Drizzle adapter for persistence, and secure session management.
- **Session Security**: Environment variable-based secret key, IP address and user agent tracking.
- **Authorization**: Role-based access control at the organization level with membership verification.
  - **Authorization Helpers** (`lib/auth-helpers.ts`): Reusable functions for verifying organization membership and owner/admin access.
  - **Owner-Only Operations**: Settings updates, project type management, team member invitations, and role changes require owner access.
  - **Member Access**: All members can view organization data, settings, and team members.

### Organization Settings
- **Settings Page** (`app/dashboard/settings/page.tsx`): Comprehensive tabbed interface for organization management.
- **Tabs**:
  - **General**: Organization name, default hourly rate, logo upload, brand color picker.
  - **Project Types**: Custom project types with AI prompt templates and default rates.
  - **Team**: Member list, role management, invitation system with email notifications.
  - **Billing**: Usage statistics (projects created, forms sent, timelines generated) and Stripe integration placeholder.
- **Email Integration**: Resend for transactional emails (invitation emails with HTML/plain-text templates).

### API Routes Structure
- **Organization Context**: All organization-scoped routes accept `organizationId` as a query parameter.
- **Validation**: Request bodies validated with Zod schemas before database operations.
- **Authorization**: Owner/member access verified using `lib/auth-helpers.ts` before mutations.
- **Error Handling**: Proper HTTP status codes (400, 403, 404) with descriptive error messages.
- **Routes**:
  - `/api/organization` - Get organization details
  - `/api/organization/settings` - Get/update organization settings
  - `/api/organization/project-types` - CRUD operations for custom project types
  - `/api/organization/members` - List members, remove members, update roles
  - `/api/organization/invite` - Send invitations
  - `/api/organization/invites` - List pending invitations
  - `/api/organization/usage` - Monthly usage statistics

## External Dependencies

### Core Framework
- **Next.js 14.2.33**
- **React 18.3.1**

### Authentication
- **BetterAuth 1.3.34**
- **bcryptjs**

### Database & ORM
- **@neondatabase/serverless**
- **drizzle-orm 0.44.7**
- **drizzle-kit 0.31.7**
- **drizzle-zod 0.8.3**

### AI Services
- **@anthropic-ai/sdk** (for Claude AI integration)

### Email
- **Resend** (for transactional emails via Replit integration)

### UI & Styling
- **Tailwind CSS 3.4.18**
- **tailwind-merge**
- **clsx**
- **lucide-react**
- **Google Fonts (Inter)**

### Validation
- **Zod 4.1.12**

### Utilities
- **nanoid**

### Development
- **TypeScript 5.9.3**
- **ESLint**
- **PostCSS & Autoprefixer**

### Runtime
- **ws (WebSockets)** (for Neon serverless connection pooling)