# Implementation Guide - NFL Predictions Platform

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [BallDontLie Integration](#balldontlie-integration)
3. [Real-Time Features](#real-time-features)
4. [Caching Strategy](#caching-strategy)
5. [Deployment](#deployment)

## Architecture Overview

### Monorepo Structure

This project uses Turborepo with pnpm workspaces for efficient builds and development.

```
- apps/web: Customer-facing Next.js app
- apps/admin: Admin dashboard  
- apps/workers: Serverless cron jobs
- packages/ui: Design system
- packages/tokens: Tailwind v4 tokens
- packages/db: Drizzle ORM schemas
- packages/integrations: API clients
```

### Tech Stack (2026)

- **Next.js 15.x**: PPR, React 19, Server Actions
- **React 19.2**: Compiler 1.0, concurrent features
- **Tailwind CSS 4**: New config model, custom tokens
- **Turborepo 2.x**: Remote caching on Vercel
- **Drizzle ORM**: Type-safe database queries
- **Upstash Redis**: Pub/sub, caching, rate limiting

## BallDontLie Integration

### API Client

Located in `packages/integrations/src/providers/balldontlie/client.ts`

Key features:
- Cursor-based pagination
- Automatic retry with exponential backoff
- Type-safe DTOs with Zod validation
- Rate limit respect

### API Routes

All routes use Edge runtime for low latency:

**Teams** (`/api/teams`)
- Cache: 1 hour
- Returns simplified team data

**Games** (`/api/games?season=2026&week=1`)
- Cache: 30 seconds
- Tag: `games:${season}:${week}`

**Injuries** (`/api/injuries?team=KC`)
- Cache: 1 minute
- Tag: `team:${code}`

**Roster** (`/api/roster?team=KC&season=2026`)
- Cache: 5 minutes
- Tag: `team:${code}`

### Data Flow

```
BallDontLie API
  ↓
packages/integrations (client)
  ↓
apps/web/app/api/* (Edge routes)
  ↓
React Server Components (with cache tags)
  ↓
Client Components (hydration)
```

## Real-Time Features

### Server-Sent Events (SSE)

The edge feed uses SSE for real-time updates:

```typescript
// Connect to SSE stream
const es = new EventSource('/api/stream/edges')

es.onmessage = (e) => {
  const edge = JSON.parse(e.data)
  // Update UI
}
```

**Production Setup:**
- Connect to Upstash Redis pub/sub
- Subscribe to `edges:new` channel
- Filter by gameId if needed
- Automatic reconnection on disconnect

### WebSocket Alternative

For bidirectional communication (future):
- Use Pusher or Ably for managed WebSockets
- Or Upstash Redis Streams for custom implementation

## Caching Strategy

### Next.js Cache Tags

Tag-based revalidation enables instant cache invalidation:

```typescript
// RSC fetch with tags
const games = await fetch('/api/games?season=2026&week=1', {
  next: {
    revalidate: 30,
    tags: ['games:2026:1']
  }
})

// Worker triggers revalidation
await fetch('/api/revalidate', {
  method: 'POST',
  headers: { 'x-revalidate-secret': SECRET },
  body: JSON.stringify({ tags: ['games:2026:1'] })
})
```

### Tag Taxonomy

- `games:${season}:${week}` - Weekly slate
- `game:${gameId}` - Single game
- `team:${code}` - Team dashboard
- `props:${season}:${week}` - Player props
- `futures:${season}` - Futures markets

### Redis Caching

Use Upstash Redis for hot data:

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Cache market snapshot
await redis.set(`market:${marketId}`, data, { ex: 60 })

// Publish edge update
await redis.publish('edges:new', JSON.stringify(edge))
```

## Deployment

### Vercel Projects

Create three separate projects:

1. **edgeloop-web**
   - Root: `apps/web`
   - Build: `pnpm turbo run build --filter=web`
   - Env: DATABASE_URL, BALLDONTLIE_API_KEY, etc.

2. **edgeloop-admin**
   - Root: `apps/admin`
   - Build: `pnpm turbo run build --filter=admin`
   - Protected routes (auth required)

3. **edgeloop-workers**
   - Root: `apps/workers`
   - Cron jobs: `/api/cron/*`
   - vercel.json with cron schedules

### Environment Variables

Set in Vercel dashboard (Production & Preview):

**Required:**
- `DATABASE_URL` - Neon/Supabase Postgres
- `BALLDONTLIE_API_KEY` - BallDontLie API key
- `UPSTASH_REDIS_REST_URL` - Redis URL
- `UPSTASH_REDIS_REST_TOKEN` - Redis token
- `REVALIDATE_SECRET` - Cache invalidation secret
- `WEB_BASE_URL` - Web app URL for worker callbacks

**Optional:**
- `THE_ODDS_API_KEY` - For betting odds
- `CLICKHOUSE_URL` - For analytics
- `NEXTAUTH_SECRET` - For authentication
- `EMAIL_API_KEY` - For alerts

### GitHub Actions CI

`.github/workflows/ci.yml` runs on every PR:

1. Install dependencies with pnpm
2. Type check all packages
3. Lint all packages
4. Run tests
5. Build all apps

**Vercel Integration:**
- Auto-deploys preview on PR
- Auto-deploys production on merge to main
- Comments PR with preview URL

### Build Configuration

Each app has optimized build settings:

```json
// apps/web/package.json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start"
  }
}
```

**Turbopack** for dev (fast HMR)
**Webpack** for production builds (until Turbopack prod GA)

### Cron Jobs

`apps/workers/vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/odds", "schedule": "*/2 * * * *" },
    { "path": "/api/cron/backfill", "schedule": "0 6 * * *" },
    { "path": "/api/cron/injuries", "schedule": "*/15 * * * *" }
  ]
}
```

Cron handlers call web app revalidation route after updates.

### Performance Monitoring

**Vercel Analytics:**
- Core Web Vitals dashboard
- Real User Monitoring (RUM)
- API route performance

**Custom Metrics:**
```typescript
// Track edge detection latency
performance.mark('edge-detect-start')
// ... detection logic
performance.mark('edge-detect-end')
performance.measure('edge-detect', 'edge-detect-start', 'edge-detect-end')
```

### Security

**Headers** (configured in next.config.js):
- CSP: Restrict script sources
- HSTS: Force HTTPS
- X-Frame-Options: Prevent clickjacking

**Rate Limiting:**
```typescript
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

const { success } = await ratelimit.limit(userId || ip)
if (!success) return Response.json({ error: 'Rate limited' }, { status: 429 })
```

## Development Workflow

1. Create feature branch
2. Make changes
3. Run `pnpm typecheck && pnpm lint`
4. Commit with conventional commits
5. Open PR (triggers CI)
6. Review Vercel preview
7. Merge to main (auto-deploys production)

## Troubleshooting

### Build Errors

**Module not found:**
- Check `package.json` dependencies
- Run `pnpm install`
- Verify transpilePackages in next.config.js

**Type errors:**
- Run `pnpm typecheck` locally
- Check Drizzle generated types
- Verify package exports

### Runtime Errors

**API route 500:**
- Check Vercel logs
- Verify environment variables
- Test API endpoints locally

**Cache not invalidating:**
- Verify REVALIDATE_SECRET matches
- Check revalidation route logs
- Test with curl:
  ```bash
  curl -X POST https://your-app.vercel.app/api/revalidate \
    -H "x-revalidate-secret: your-secret" \
    -H "content-type: application/json" \
    -d '{"tags":["games:2026:1"]}'
  ```

### Performance Issues

**Slow page loads:**
- Check Core Web Vitals in Vercel
- Optimize images (use next/image)
- Review bundle size
- Enable PPR for static parts

**High database latency:**
- Use connection pooling (PgBouncer)
- Add indexes for common queries
- Consider read replicas

## Next Steps

1. **Authentication**: Add NextAuth with email/OAuth
2. **User Alerts**: Implement alert rules and delivery
3. **Backtesting**: Build scenario runner UI
4. **Mobile**: Create PWA with offline support
5. **Analytics**: Add ClickHouse for deep insights
