# Vercel Integrations Setup

This document describes all Vercel integrations installed and configured in the Edgeloop project.

## Installed Integrations

### 1. **Tinybird** - SQL-to-API for Odds
- **Purpose**: High-performance odds queries
- **Limit**: 1k queries/day
- **API Route**: `/api/odds/tinybird`
- **Usage**: Provides cached, optimized odds data via SQL queries
- **Documentation**: [Tinybird Vercel Integration](https://www.tinybird.co/docs/integrations/vercel)

### 2. **Arcjet** - Anti-Scraper Shield
- **Purpose**: Bot detection and rate limiting
- **Tier**: Generous Dev Tier
- **Protection**: All routes automatically protected via `middleware.ts`
- **Features**: 
  - Bot detection (blocks automated requests)
  - Rate limiting (10 req/min per IP)
  - Enhanced protection for odds endpoints (30 req/min, 500 req/hour)
- **Documentation**: [Arcjet Docs](https://docs.arcjet.com/)

### 3. **Statsig** - Algorithm A/B Testing
- **Purpose**: A/B test prediction algorithms
- **Limit**: 2 Million Events
- **Usage**: Test different algorithm variants (genesis_v1, genesis_v2, baseline)
- **API Route**: Integrated into `/api/predictions/genesis`
- **Documentation**: [Statsig Vercel Integration](https://docs.statsig.com/integrations/vercel)

### 4. **Resend** - High-Priority Email Alerts
- **Purpose**: Send prediction alerts via email
- **Limit**: 3k emails/month
- **API Route**: `/api/alerts`
- **Usage**: Alert users when high-confidence edges are detected

### 5. **Axiom** - Observability & Logging
- **Purpose**: Centralized logging
- **Usage**: Automatic logging of API requests, predictions, and errors
- **Features**: Logs all prediction events, API requests, and system errors
- **Documentation**: [Axiom Vercel Integration](https://axiom.co/docs/apps/vercel)

### 6. **Upstash Redis** - Caching
- **Purpose**: Redis caching for odds and predictions
- **Usage**: Cache game odds (5min TTL) and predictions (30min TTL)
- **Features**: Rate limiting support via `@upstash/ratelimit`
- **Documentation**: [Upstash Docs](https://upstash.com/docs/redis/overall/getstarted)

### 7. **Upstash QStash** - Task Queue
- **Purpose**: Scheduled jobs and task queuing
- **Usage**: Background processing for predictions and data updates
- **Documentation**: [Upstash QStash](https://upstash.com/docs/qstash/overall/getstarted)

### 8. **Clerk** - Authentication
- **Purpose**: User authentication and authorization
- **Features**: Sign-in, sign-up, user management, protected routes
- **Integration**: App Router middleware with `clerkMiddleware()`
- **Documentation**: [Clerk Next.js Quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart)

### 9. **Neon** - Serverless PostgreSQL
- **Purpose**: Serverless PostgreSQL database
- **Usage**: Primary database for storing NFL data, predictions, and user data
- **Documentation**: [Neon Docs](https://neon.com/docs/introduction)

## Environment Variables

All environment variables are automatically provided by Vercel when you install the integrations. Use `vercel env pull` to sync them locally.

### Required Variables (Auto-provided by Vercel)

#### Core Services
- `DATABASE_URL` / `NEON_DATABASE_URL` - Neon PostgreSQL connection string
- `BALLDONTLIE_API_KEY` - NFL data API key

#### Integrations
- `ARCJET_KEY` - Arcjet API key
- `TINYBIRD_TOKEN` - Tinybird API token
- `TINYBIRD_API_URL` - Tinybird API URL (default: https://api.tinybird.co/v0)
- `STATSIG_SERVER_API_KEY` - Statsig server API key
- `RESEND_API_KEY` - Resend API key
- `RESEND_FROM_EMAIL` - Resend from email address
- `AXIOM_TOKEN` - Axiom API token
- `AXIOM_DATASET` - Axiom dataset name
- `AXIOM_ORG_ID` - Axiom organization ID
- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST token
- `UPSTASH_QSTASH_URL` - Upstash QStash URL
- `UPSTASH_QSTASH_TOKEN` - Upstash QStash token
- `CLERK_SECRET_KEY` - Clerk secret key (server-side)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key (client-side)
- `CLERK_WEBHOOK_SECRET` - Clerk webhook secret

## API Routes

### `/api/odds/tinybird`
- **Method**: GET
- **Query Params**: 
  - `game_id` (required) - Game identifier
  - `book` (optional) - Sportsbook name
- **Response**: `{ data: Odds[], cached: boolean }`
- **Caching**: 5 minutes via Upstash Redis
- **Protection**: Arcjet rate limiting (30 req/min, 500 req/hour)

### `/api/predictions/genesis`
- **Method**: GET
- **Query Params**:
  - `home_team_id` (required) - Home team ID
  - `away_team_id` (required) - Away team ID
  - `season` (optional) - Season year
  - `week` (optional) - Week number
  - `user_id` (optional) - User ID for A/B testing
- **Response**: Prediction with algorithm variant and cache status
- **Features**:
  - A/B testing via Statsig
  - Caching via Upstash (30min TTL)
  - Logging via Axiom

### `/api/alerts`
- **Method**: POST
- **Body**: 
  ```json
  {
    "email": "user@example.com",
    "gameInfo": {
      "homeTeam": "Chiefs",
      "awayTeam": "Ravens",
      "prediction": "HOME COVER",
      "confidence": 0.85,
      "edge": 0.12
    }
  }
  ```
- **Response**: `{ success: boolean, messageId?: string }`
- **Protection**: Arcjet rate limiting
- **Requirement**: Only sends if confidence >= 0.7 and edge > 0

## Integration Files

All integration clients are located in `apps/web/lib/integrations/`:

- `arcjet.ts` - Arcjet protection and rate limiting
- `tinybird.ts` - Tinybird SQL-to-API client
- `statsig.ts` - Statsig A/B testing client
- `resend.ts` - Resend email client
- `axiom.ts` - Axiom logging client
- `upstash.ts` - Upstash Redis caching client
- `index.ts` - Central exports

## Middleware

The `apps/web/middleware.ts` file automatically protects all routes with:
- **Clerk Authentication** - User authentication and protected routes
- **Arcjet Protection** - Bot detection (blocks automated requests) and rate limiting (10 req/min per IP)
- Static file exclusions

## Authentication (Clerk)

### Setup
1. Install Clerk via Vercel integrations
2. Environment variables are auto-provided
3. `ClerkProvider` wraps the app in `app/layout.tsx`
4. `clerkMiddleware()` handles authentication in `middleware.ts`

### Usage Examples

```tsx
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

// In your components
<SignedOut>
  <SignInButton />
  <SignUpButton />
</SignedOut>
<SignedIn>
  <UserButton />
</SignedIn>
```

```typescript
// In API routes or server components
import { auth } from '@clerk/nextjs/server';

const { userId } = await auth();
if (!userId) {
  return new Response('Unauthorized', { status: 401 });
}
```

## Limits & Quotas

- **Tinybird**: 1,000 queries/day
- **Statsig**: 2,000,000 events
- **Resend**: 3,000 emails/month
- **Arcjet**: Generous dev tier (no hard limits mentioned)
- **Upstash**: Varies by plan
- **Axiom**: Varies by plan
- **Clerk**: Free tier available
- **Neon**: Free tier available

## Notes

- All integrations gracefully handle missing environment variables
- Caching is used extensively to reduce API calls
- Logging is automatic and non-blocking
- Rate limiting is applied at multiple levels (Arcjet + Upstash)
- Authentication is handled seamlessly via Clerk middleware
