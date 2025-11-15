# Scopebound - Multi-tenant SaaS Platform

## Overview
Scopebound is a modern multi-tenant SaaS application built with Next.js 14, providing a foundation for building SaaS products with team collaboration features. It features secure authentication, organization management, and a clean, productivity-focused design system inspired by Linear and Notion. The platform includes AI-powered client intake form generation using Claude AI and a comprehensive project management system with organization-based access control.

## User Preferences
Preferred communication style: Simple, everyday language.

## Development Notes

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
    - **Multi-tenancy**: `organizations`, `organization_members`, `organization_settings`.
    - **Project Management**: `projects` (core project records), `project_forms` (dynamic client intake forms in JSONB), `project_timelines` (AI-generated timelines in JSONB).
- **Key Features**: All timestamp columns use `{ mode: "string" }` for BetterAuth compatibility. Project IDs use `nanoid`. JSONB columns store flexible data structures. Share tokens enable public access to forms and timelines. Enums enforce valid project types and status transitions.
- **Migrations**: Drizzle Kit for schema migrations.

### Authentication & Authorization
- **Library**: BetterAuth v1.3.34 for email/password authentication, Drizzle adapter for persistence, and secure session management.
- **Session Security**: Environment variable-based secret key, IP address and user agent tracking.
- **Authorization**: Role-based access control at the organization level with membership verification.

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