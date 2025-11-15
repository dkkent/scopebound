# Scopebound - Multi-tenant SaaS Platform

## Overview

Scopebound is a modern multi-tenant SaaS application built with Next.js 14, featuring secure authentication, organization management, and a clean productivity-focused design system. The application provides a foundation for building SaaS products with team collaboration features, drawing design inspiration from Linear and Notion's clean aesthetics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: Next.js 14 with App Router
- **Routing**: App Router with file-based routing and middleware protection
- **UI Library**: Custom component library built with Tailwind CSS and Radix UI patterns
- **State Management**: React hooks with client-side form state, server components for data fetching
- **Styling**: Tailwind CSS with custom design system based on spacing primitives (2, 4, 6, 8, 12, 16)
- **Typography**: Inter font family via Google Fonts with defined hierarchy (H1: text-4xl, H2: text-2xl, H3: text-lg)

**Design System**: System-based approach prioritizing clarity and spatial efficiency
- Color system using HSL CSS variables for light/dark mode support
- Component variants: Button (default, secondary, outline, ghost), Card, Input, Label
- Responsive layouts with max-width constraints (max-w-7xl for containers, max-w-md for forms)

**Route Protection**: Middleware-based authentication checks
- Public paths: `/`, `/login`, `/signup`
- Protected routes redirect to `/login` when unauthenticated
- Authenticated users on auth pages redirect to `/dashboard`

### Backend Architecture

**API Design**: Next.js API Routes with RESTful conventions
- `/api/auth/*` - Authentication endpoints (delegated to BetterAuth)
- `/api/organizations/*` - Organization management endpoints
- Route handlers use NextRequest/NextResponse for type safety

**Authentication Flow**: BetterAuth with email/password strategy
- Session-based authentication with 7-day expiration, 1-day update age
- Auto sign-in after signup
- Session tokens stored in HTTP-only cookies via BetterAuth
- Custom signup endpoint creates user and initial organization atomically

**Multi-tenancy Model**: Organization-based tenancy
- Users can belong to multiple organizations via organization_members join table
- Role-based access control (owner, member) at organization level
- Organization context determined by membership, switchable via API

**Data Access**: Drizzle ORM with Neon Serverless PostgreSQL
- Type-safe query builder with schema inference
- WebSocket connection pooling for serverless environments
- Server-side only database access (no client-side queries)

### Data Storage

**Database**: PostgreSQL via Neon Serverless
- Connection pooling with @neondatabase/serverless
- WebSocket constructor configured for serverless compatibility

**Schema Design**:
- `users` - User accounts with email (unique), name, emailVerified (boolean), timestamps
- `session` - BetterAuth session management with token (unique), expiration, IP address, and device tracking
- `account` - BetterAuth account table storing password hashes and OAuth tokens
- `verification` - Email verification tokens (BetterAuth)
- `organizations` - Tenant entities with owner reference
- `organization_members` - Many-to-many relationship with role enum (owner, member)

**Important Schema Notes**:
- All timestamp columns use `{ mode: "string" }` for BetterAuth compatibility (BetterAuth passes timestamps as strings, not Date objects)
- `email_verified` is a boolean column (not timestamp) to match BetterAuth's expectations
- `session.token` is a required unique text field for BetterAuth session management
- Optional dependencies `bufferutil` and `utf-8-validate` installed for Neon WebSocket performance

**Migrations**: Drizzle Kit for schema migrations
- Schema defined in TypeScript with drizzle-orm
- Type validation with drizzle-zod integration

### Authentication & Authorization

**Library**: BetterAuth v1.3.34
- Email/password authentication with bcryptjs hashing
- Drizzle adapter for PostgreSQL persistence
- Session management with secure cookies
- Client-side hooks: `useSession`, `signIn`, `signUp`, `signOut`

**Session Security**:
- Secret key from environment variables (SESSION_SECRET or BETTER_AUTH_SECRET)
- IP address and user agent tracking for sessions
- Cascade deletion of sessions when user is deleted

**Authorization**: Role-based access at organization level
- Membership verification before organization operations
- Owner role for organization creators
- Future extensibility for granular permissions

## External Dependencies

### Core Framework
- **Next.js 14.2.33** - React framework with App Router, server components, and API routes
- **React 18.3.1** - UI library with hooks and server component support

### Authentication
- **BetterAuth 1.3.34** - Authentication library with Drizzle adapter, email/password provider
- **bcryptjs** - Password hashing (used internally by BetterAuth)

### Database & ORM
- **@neondatabase/serverless** - Neon PostgreSQL serverless driver with WebSocket support
- **drizzle-orm 0.44.7** - Type-safe ORM with PostgreSQL support
- **drizzle-kit 0.31.7** - Schema migration toolkit
- **drizzle-zod 0.8.3** - Zod schema generation from Drizzle schemas

### UI & Styling
- **Tailwind CSS 3.4.18** - Utility-first CSS framework with custom configuration
- **tailwind-merge** - Utility for merging Tailwind classes
- **clsx** - Conditional class name utility
- **lucide-react** - Icon library (Inbox, Home, Settings, Users, LogOut, ChevronDown)
- **Google Fonts (Inter)** - Primary typography

### Validation
- **Zod 4.1.12** - Schema validation for API inputs and forms

### Development
- **TypeScript 5.9.3** - Type safety across application
- **ESLint** - Code linting with Next.js configuration
- **PostCSS & Autoprefixer** - CSS processing

### Runtime
- **ws (WebSockets)** - Required for Neon serverless connection pooling

### Environment Configuration
- `DATABASE_URL` - Neon PostgreSQL connection string (required)
- `SESSION_SECRET` or `BETTER_AUTH_SECRET` - Session encryption key (required in production)
- `NEXT_PUBLIC_APP_URL` - Application base URL for CORS and redirects (defaults to localhost:5000)