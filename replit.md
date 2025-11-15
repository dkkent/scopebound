# Scopebound - Multi-tenant SaaS Platform

## Overview

Scopebound is a modern multi-tenant SaaS application built with Next.js 14, featuring secure authentication, organization management, and a clean productivity-focused design system. The application provides a foundation for building SaaS products with team collaboration features, drawing design inspiration from Linear and Notion's clean aesthetics.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (November 15, 2025)

### Session Persistence & Password UX - COMPLETED (Latest)
1. **Session Cookie Persistence Fix**: Configured BetterAuth cookie settings for 7-day persistent sessions
   - Added `maxAge: 60 * 60 * 24 * 7` to `defaultCookieAttributes` (critical for cross-session persistence)
   - Users no longer need to log in every browser session
   - Cookie settings: `secure` for production HTTPS, `sameSite: "lax"` for navigation, `path: "/"`
   - BetterAuth manages `httpOnly` per cookie type automatically
   
2. **Password Visibility Toggle**: Created PasswordInput component with Eye/EyeOff icons
   - Toggle between showing/hiding password text
   - Fully keyboard accessible (in natural tab order)
   - Screen-reader friendly with dynamic aria-labels ("Show password" / "Hide password")
   - Used in both login and signup forms
   - Reuses Input component styling for consistency

### Project Management System - COMPLETED
**Complete project CRUD interface with organization access control**

1. **Session Cookies Fix**: Added BetterAuth `nextCookies()` plugin for proper Next.js cookie handling
   - 7-day session expiration with daily refresh
   - Cookie caching enabled for performance
   - Cross-subdomain cookie support for Replit deployments

2. **Project Edit Bug Fix**: Removed `clientEmail` field from edit form (belongs in project_forms table, not projects table)

3. **Numeric Field Handling - Dual Schema Approach**:
   - **Problem**: Drizzle's `numeric` columns return varying decimal precision (e.g., "150.000000") but form validation required strict 2-decimal format
   - **Solution**: Separate schemas for insert vs update operations
     - `insertProjectSchema`: Strict validation `/^\d+(\.\d{1,2})?$/` for new user-entered data
     - `updateProjectSchema`: Lenient validation `/^\d+(\.\d+)?$/` accepts any Drizzle numeric format
   - **Implementation**: 
     - POST /api/projects uses `insertProjectSchema` (strict user input validation)
     - PATCH /api/projects/[id] uses `updateProjectSchema` (accepts DB output formats)
     - Edit form normalizes with `.toFixed(2)` as defense-in-depth
   - **Fields**: Applied to `hourlyRate`, `totalWeeks`, `totalHours`, `totalCost`, `defaultHourlyRate`

4. **API Routes**: Complete REST API with organization-based access control
   - POST /api/projects - Create project (validates membership)
   - GET /api/projects - List projects (filtered by organization membership)
   - GET /api/projects/[id] - Get single project (verifies access)
   - PATCH /api/projects/[id] - Update project (verifies access, uses lenient schema)
   - DELETE /api/projects/[id] - Delete project (verifies access)

5. **Dashboard Features**:
   - Project list with status filtering (all, draft, in-progress, completed)
   - Empty states for new users and filtered views
   - Project cards with status badges, client info, and action buttons
   - Responsive grid layout (1-3 columns based on screen size)

6. **Forms & Validation**:
   - React Hook Form with Zod validation
   - All fields have proper data-testid attributes for e2e testing
   - Error handling with toast notifications
   - Loading states during mutations

## Recent Changes (November 15, 2025)

### Shadcn/UI Component Library - COMPLETED
1. **Component System**: Implemented complete shadcn/ui component library with 10+ components:
   - Form components: Input, Label, Select, Textarea, Form
   - Data display: Table, Badge, Avatar, Card (with CardHeader, CardTitle, CardDescription, CardContent)
   - Navigation: Tabs, Dialog, DropdownMenu
   - Layout: Button (multiple variants and sizes)
2. **Layout Components**: Created comprehensive layout infrastructure:
   - `DashboardLayout`: Sidebar navigation with responsive design
   - `ClientLayout`: Next.js client-side layout wrapper
   - `PageHeader`: Reusable page header component with heading and description
   - `UserMenu`: User dropdown with logout functionality
3. **Design System Page**: Built `/design-system` documentation page showcasing:
   - Color palette (Primary, Secondary, Accent, Destructive)
   - Typography hierarchy
   - Button variants (default, secondary, outline, ghost, destructive) and sizes
   - Badge variants (default, secondary, success, warning, destructive)
   - Form elements (input, select, textarea)
   - Interactive tabs component
   - Table with sample data
   - Avatar display
   - Spacing scale reference
4. **Testing Infrastructure**: Added comprehensive `data-testid` attributes to all interactive and display elements:
   - Naming convention: {action}-{target} for interactive elements (e.g., `button-variant-default`)
   - Naming convention: {type}-{content} for display elements (e.g., `text-user-name`)
   - Enables automated browser testing with Playwright
5. **CSS Architecture**: Consolidated Tailwind styles into single `app/globals.css` to resolve @layer compilation errors
6. **Components Configuration**: Created `components.json` for shadcn/ui CLI with custom paths and styling preferences

### BetterAuth Integration Issues - RESOLVED
1. **Session Cookie Persistence**: Fixed signup endpoint to use BetterAuth's request handler pattern for proper cookie management
2. **Middleware Edge Runtime Compatibility**: Removed database calls from middleware (edge runtime doesn't support WebSocket). Now uses cookie presence check only
3. **Type Serialization**: Changed all `createdAt` fields from `Date` to `string` in TypeScript interfaces to match database schema
4. **Client Component Boundaries**: Added `"use client"` directives to:
   - `components/ui/button.tsx` - Required for onClick handlers
   - `components/dashboard/empty-state.tsx` - Required for interactive components
   - `components/dashboard/user-menu.tsx` - Required for dropdown menu state and interactions
5. **Server/Client Component Pattern**: Removed event handler props from server component → client component boundaries
6. **User Menu & Logout**: Added user menu dropdown in dashboard header with logout functionality
7. **Trusted Origins**: Updated BetterAuth configuration to include Replit domains from `REPLIT_DOMAINS` environment variable for CORS compatibility
8. **Login Endpoint**: Created custom `/api/auth/login` endpoint that proxies to BetterAuth's sign-in handler for proper session cookie management

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

**Authentication & User Management:**
- `users` - User accounts with email (unique), name, emailVerified (boolean), timestamps
- `session` - BetterAuth session management with token (unique), expiration, IP address, and device tracking
- `account` - BetterAuth account table storing password hashes and OAuth tokens
- `verification` - Email verification tokens (BetterAuth)

**Multi-tenancy:**
- `organizations` - Tenant entities with owner reference
- `organization_members` - Many-to-many relationship with role enum (owner, member)
- `organization_settings` - Per-organization configuration (default hourly rate, brand color, logo, custom AI prompts)

**Project Management (November 15, 2025):**
- `projects` - Core project records with client info, type (saas/mobile/web/ecommerce/custom), brief, hourly rate, status workflow
- `project_forms` - Dynamic client intake forms (JSONB structure) with share tokens and submission tracking
- `project_timelines` - AI-generated project timelines with phases, hours, costs, and public share capability

**Important Schema Notes**:
- All timestamp columns use `{ mode: "string" }` for BetterAuth compatibility (BetterAuth passes timestamps as strings, not Date objects)
- `email_verified` is a boolean column (not timestamp) to match BetterAuth's expectations
- `session.token` is a required unique text field for BetterAuth session management
- Optional dependencies `bufferutil` and `utf-8-validate` installed for Neon WebSocket performance
- Project IDs use nanoid() for unique, URL-safe identifiers
- JSONB columns store flexible data structures for forms, timelines, and custom prompts
- Share tokens (32 characters) enable public access to forms and timelines
- Enums enforce valid project types and status transitions

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

### Utilities
- **nanoid** - Secure, URL-safe unique ID generation for projects, forms, and timelines

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