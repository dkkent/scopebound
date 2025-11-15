# Scopebound - Multi-tenant SaaS Platform

A modern multi-tenant SaaS application built with Next.js 14, featuring organization-based access control, AI-powered client intake form generation, and comprehensive project management.

## Features

- 🏢 **Multi-tenant Architecture** - Organization-based tenancy with role-based access control
- 🤖 **AI-Powered Forms** - Generate custom client intake forms using Claude AI
- 📊 **Project Management** - Comprehensive project tracking with status workflows
- 👥 **Team Collaboration** - Invite team members with role-based permissions
- 🎨 **Customizable Branding** - Custom colors and project types per organization
- 📧 **Email Integration** - Automated invitation and notification emails via Resend
- ⚡ **Optimized Performance** - Server-side rendering with 14 database indexes for fast queries
- 🔒 **Secure Authentication** - BetterAuth with session-based authentication

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI (shadcn/ui)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon Serverless) with Drizzle ORM
- **Authentication**: BetterAuth v1.3.34
- **AI**: Anthropic Claude AI
- **Email**: Resend (via Replit integration)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Neon recommended)
- Anthropic API key for AI features
- Resend API key for email features

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
SESSION_SECRET=your-session-secret-key-here

# AI Integration
ANTHROPIC_API_KEY=your-anthropic-api-key

# Email (via Resend)
RESEND_API_KEY=your-resend-api-key

# App URL (for production)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd scopebound
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run db:push
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:5000](http://localhost:5000)

## Database Schema

The application uses the following main tables:

- **users** - User accounts
- **organizations** - Organization/company records
- **organization_members** - User-organization relationships with roles
- **organization_settings** - Organization-specific settings and branding
- **projects** - Client project records
- **project_forms** - Dynamic client intake forms (JSONB)
- **project_timelines** - AI-generated project timelines (JSONB)
- **custom_project_types** - Organization-specific project types
- **organization_invites** - Pending team member invitations

### Performance Optimizations

The database includes 14 indexes on:
- Foreign keys: `organization_id`, `user_id`, `project_id`
- Composite queries: `(organization_id, status)`, `(organization_id, created_at DESC)`
- Lookup patterns: `email`, `share_token`

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Authentication pages
│   └── f/                 # Public form pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard-specific components
│   ├── settings/         # Settings page components
│   └── providers/        # React context providers
├── lib/                   # Utility functions
│   ├── auth.ts           # BetterAuth configuration
│   ├── db.ts             # Database client
│   ├── schema.ts         # Drizzle schema definitions
│   └── auth-helpers.ts   # Authorization utilities
└── replit.md             # Technical documentation

```

## Authentication & Authorization

### Authentication
- Email/password authentication via BetterAuth
- Session-based with HTTP-only cookies (7-day expiry)
- Middleware-based route protection

### Authorization
- **Owner** - Full control over organization settings, team management, and all resources
- **Member** - Can view organization data and create/manage projects

Use the helper functions in `lib/auth-helpers.ts`:
- `verifyOwnerAccess(userId, organizationId)` - Check if user is organization owner
- `verifyMemberAccess(userId, organizationId)` - Check if user is a member

## API Routes

All organization-scoped routes accept `organizationId` as a query parameter:

- `GET /api/organizations` - List user's organizations
- `GET /api/organization?organizationId=...` - Get organization details
- `GET /api/projects?organizationId=...` - List projects
- `POST /api/projects` - Create new project
- `GET /api/organization/settings?organizationId=...` - Get settings
- `PATCH /api/organization/settings` - Update settings (owner only)
- `POST /api/organization/invite` - Send invitation (owner only)
- `GET /api/organization/members?organizationId=...` - List team members

## Development

### Running Tests

```bash
npm test
```

### Database Migrations

The project uses Drizzle for schema management:

```bash
# Push schema changes to database
npm run db:push

# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate
```

### Code Style

The project uses ESLint and Prettier. Run:

```bash
npm run lint
```

## Deployment

### Deploying to Replit

1. The project is already configured for Replit deployment
2. Set environment variables in Replit Secrets
3. Click "Deploy" in the Replit interface

### Deploying to Vercel

1. Connect your GitHub repository
2. Configure environment variables
3. Deploy with zero configuration

### Environment Variables for Production

Ensure all environment variables are set:
- `DATABASE_URL`
- `SESSION_SECRET` (use a strong random string)
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL` (your production domain)

## Features Documentation

### AI Form Generation

The platform uses Claude AI to generate custom client intake forms based on:
- Project type
- Organization-specific prompt templates
- Client requirements

### Email Integration

Emails are sent via Resend for:
- Team member invitations
- Project notifications (future feature)

### Shareable Links

Projects and forms can be shared via unique tokens:
- Public form access: `/f/[shareToken]`
- No authentication required for clients

## Security

- Session-based authentication with HTTP-only cookies
- Organization-level authorization on all protected routes
- Input validation using Zod schemas
- IP-based rate limiting:
  - AI endpoints: 10 requests/minute
  - Auth endpoints: 5 requests/15 minutes
  - Invitation endpoints: 10 requests/hour
- Automatic cleanup of expired rate limit records

**Rate Limiting Limitations (MVP):**
- In-memory implementation suitable for single-instance Replit deployments
- Will not work correctly in multi-worker or distributed environments
- For production scale, upgrade to Redis/Upstash for centralized rate limiting
- See `lib/rate-limit.ts` for implementation details

## Performance

- Server-side rendering for fast initial page loads
- 14 database indexes for optimized queries
- Organization context provider eliminates redundant API calls
- Page load times: ~2.0s (33% improvement from initial 3.0s)

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
