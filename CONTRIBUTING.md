# Contributing to EdgeLoop

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Testing](#testing)
7. [Deployment](#deployment)

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

### Tech Stack

- **Next.js 15.x**: PPR, React 19, Server Actions
- **React 19.2**: Compiler 1.0, concurrent features
- **Tailwind CSS 4**: New config model, custom tokens
- **Turborepo 2.x**: Remote caching on Vercel
- **Drizzle ORM**: Type-safe database queries
- **Upstash Redis**: Pub/sub, caching, rate limiting

## Getting Started

### Prerequisites

- Node.js >= 22.0.0
- pnpm >= 9.0.0
- PostgreSQL database (Neon/Supabase recommended)
- Redis instance (Upstash recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/EDGEL00P/edgeloop.git
cd edgeloop

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

### Environment Variables

See `.env.example` for all required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `BALLDONTLIE_API_KEY` - BallDontLie API key
- `UPSTASH_REDIS_REST_URL` - Redis URL
- `UPSTASH_REDIS_REST_TOKEN` - Redis token
- `REVALIDATE_SECRET` - Cache invalidation secret

## Development Workflow

### Branch Strategy

1. Create feature branch from `main`: `git checkout -b feature/your-feature-name`
2. Make changes and commit with conventional commits
3. Open PR against `main`
4. CI runs automatically (typecheck, lint, test, build)
5. Review Vercel preview deployment
6. Merge to `main` (triggers production deployment)

### Commit Convention

We use conventional commits:

```
feat: add new feature
fix: bug fix
docs: documentation changes
chore: maintenance tasks
refactor: code refactoring
test: add or update tests
```

### Code Quality

Before committing, ensure:

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Run tests
pnpm test

# Build
pnpm build
```

## Tech Stack

### Core Technologies

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL with Drizzle ORM
- **Cache**: Upstash Redis
- **Build Tool**: Turborepo 2.x
- **Authentication**: NextAuth v5
- **Forms**: React Hook Form + Zod validation

### Key Features

#### 1. Authentication & RBAC
- NextAuth v5 with JWT strategy
- Email (magic link), Google OAuth, and credentials authentication
- Role-based access control (user/analyst/admin)
- Protected routes via middleware

#### 2. Model Integration
- Expected Value (EV) calculation
- Kelly Criterion betting strategy
- Arbitrage detection
- Edge scoring system

#### 3. Alert System
- Configurable alert rules
- Email and Slack delivery
- Alert history tracking
- Multi-condition filtering

#### 4. Advanced UX
- Bet slip with Kelly calculator
- What-if analysis tool
- Backtesting engine
- Real-time edge feed

#### 5. Database Optimization
- Composite indexes
- Time-series partitioning
- Connection pooling
- Full-text search

## Project Structure

```
edgeloop/
├── apps/
│   ├── web/               # Main customer app
│   ├── admin/             # Admin dashboard (currently in _app-admin)
│   └── server/            # API server
├── packages/
│   ├── ui/                # Shared UI components
│   ├── db/                # Database schemas and migrations
│   ├── integrations/      # External API clients
│   └── tokens/            # Design tokens
├── docs/
│   ├── components/        # Component documentation
│   └── deployment/        # Deployment guides
├── .github/
│   └── workflows/         # CI/CD workflows
├── CONTRIBUTING.md        # This file
├── README.md             # Project overview
└── .env.example          # Environment variables template
```

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Test Structure

- Unit tests: `*.test.ts` files alongside source code
- Integration tests: `apps/web/src/__tests__/`
- E2E tests: Coming soon

### Writing Tests

We use Vitest for unit and integration tests:

```typescript
import { describe, it, expect } from 'vitest'

describe('calculateEV', () => {
  it('should calculate expected value correctly', () => {
    const ev = calculateEV(0.55, 1.91)
    expect(ev).toBeCloseTo(0.0545)
  })
})
```

## Deployment

### Vercel Setup

1. Connect GitHub repository to Vercel
2. Create three projects:
   - `edgeloop-web` (Root: `apps/web`)
   - `edgeloop-admin` (Root: `apps/admin`)
   - `edgeloop-workers` (Root: `apps/workers`)
3. Configure environment variables in Vercel dashboard
4. Enable automatic deployments

### Environment Configuration

Set these environment variables in Vercel (Production & Preview):

**Required:**
- `DATABASE_URL`
- `BALLDONTLIE_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `REVALIDATE_SECRET`

**Optional:**
- `THE_ODDS_API_KEY`
- `NEXTAUTH_SECRET`
- `EMAIL_API_KEY`

### Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] Performance benchmarks meet targets
- [ ] Security audit complete

See `docs/deployment/CHECKLIST.md` for complete deployment steps.

## Caching Strategy

### Next.js Cache Tags

We use tag-based revalidation for instant cache invalidation:

```typescript
// Fetch with cache tags
const games = await fetch('/api/games?season=2026&week=1', {
  next: {
    revalidate: 30,
    tags: ['games:2026:1']
  }
})

// Invalidate cache
await fetch('/api/revalidate', {
  method: 'POST',
  headers: { 'x-revalidate-secret': SECRET },
  body: JSON.stringify({ tags: ['games:2026:1'] })
})
```

### Cache Tag Taxonomy

- `games:${season}:${week}` - Weekly slate
- `game:${gameId}` - Single game
- `team:${code}` - Team dashboard
- `props:${season}:${week}` - Player props

### Redis Caching

Use Upstash Redis for hot data:

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Cache with TTL
await redis.set(`market:${marketId}`, data, { ex: 60 })

// Pub/sub
await redis.publish('edges:new', JSON.stringify(edge))
```

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
- Test with curl

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

## Additional Resources

- [Component Documentation](docs/components/) - UI component guides
- [Deployment Guide](docs/deployment/DEPLOYMENT.md) - Detailed deployment instructions
- [Design System](docs/components/DESIGN_SYSTEM.md) - Design tokens and theming
- [3D Components](docs/components/3D_COMPONENTS.md) - React Three Fiber components

## Support

For questions or issues:
- Open an issue on GitHub
- Check existing documentation in `/docs`
- Review example implementations in the codebase
