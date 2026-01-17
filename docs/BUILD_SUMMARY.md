# Edgeloop Build Configuration Summary

Complete overview of all integrations, build settings, and deployment configuration for the Edgeloop NFL Analytics Platform.

## 🏗️ Build Architecture

### Framework & Runtime
- **Framework**: Next.js 16.1.2 (App Router)
- **Node.js**: >=20.0.0 (auto-upgrades on major releases)
- **Package Manager**: npm (with `legacy-peer-deps=true` for compatibility)
- **Build System**: Turbopack (Next.js 16 default)
- **Output**: Standalone build for optimal deployment

### Project Structure
```
edgeloop-1/
├── apps/web/              # Next.js 16 App Router application
│   ├── app/               # App Router pages and API routes
│   ├── lib/               # Client-side utilities
│   │   └── integrations/  # Vercel integration clients
│   └── middleware.ts      # Auth & protection middleware
├── crates/                # Rust backend services
│   ├── el-api/            # Axum HTTP API server
│   ├── el-feed/           # Data feed connectors
│   └── genesis/           # Prediction engines
├── server/                # Node.js server utilities
└── docs/                  # Documentation
```

## 🔌 Vercel Integrations

### 1. **Tinybird** - SQL-to-API for Odds Pipeline
- **Purpose**: High-performance odds queries via SQL
- **Limit**: 1,000 queries/day
- **Package**: Custom client (no npm package needed)
- **API Route**: `/api/odds/tinybird`
- **Documentation**: [Vercel Integration](https://www.tinybird.co/docs/integrations/vercel)

### 2. **Arcjet** - Anti-Scraper Shield & Rate Limiting
- **Purpose**: Bot detection and DDoS protection
- **Tier**: Generous Dev Tier
- **Package**: `@arcjet/next@^1.0.0-beta.17`
- **Protection Levels**:
  - General routes: 10 req/min per IP
  - Odds endpoints: 30 req/min, 500 req/hour
- **Middleware**: Applied in `apps/web/middleware.ts`
- **Documentation**: [Arcjet Docs](https://docs.arcjet.com/)

### 3. **Statsig** - Algorithm A/B Testing
- **Purpose**: Test prediction algorithm variants
- **Limit**: 2,000,000 events
- **Package**: `statsig-node@^6.5.1`
- **Features**: Feature flags, experiments, configs
- **Integration**: Used in `/api/predictions/genesis`
- **Documentation**: [Statsig Vercel Integration](https://docs.statsig.com/integrations/vercel)

### 4. **Resend** - High-Priority Email Alerts
- **Purpose**: Send prediction alerts via email
- **Limit**: 3,000 emails/month
- **Package**: `resend@^6.7.0`
- **API Route**: `/api/alerts`
- **Features**: HTML email templates, tags, priority headers

### 5. **Axiom** - Observability & Logging
- **Purpose**: Centralized logging and observability
- **Package**: `@axiomhq/axiom-node@^0.12.0`
- **Features**: 
  - Automatic API request logging
  - Prediction event tracking
  - Error logging
- **Documentation**: [Axiom Vercel Integration](https://axiom.co/docs/apps/vercel)

### 6. **Upstash Redis** - Caching & Rate Limiting
- **Purpose**: Redis caching for odds and predictions
- **Packages**: 
  - `@upstash/redis@^1.36.1`
  - `@upstash/ratelimit@^2.0.8`
- **Usage**:
  - Cache game odds (5min TTL)
  - Cache predictions (30min TTL)
  - Rate limiting support
- **Documentation**: [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted)

### 7. **Upstash QStash** - Task Queue
- **Purpose**: Scheduled jobs and background processing
- **Usage**: Background prediction updates, data sync
- **Documentation**: [Upstash QStash](https://upstash.com/docs/qstash/overall/getstarted)

### 8. **Clerk** - Authentication & Authorization
- **Purpose**: User authentication and protected routes
- **Package**: `@clerk/nextjs@^6.0.0`
- **Setup**:
  - `ClerkProvider` in `app/layout.tsx`
  - `clerkMiddleware()` in `middleware.ts`
  - Auto-generated keys on first startup
- **Features**: Sign-in, sign-up, user management, protected routes
- **Documentation**: [Clerk Next.js Quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart)

### 9. **Neon** - Serverless PostgreSQL
- **Purpose**: Primary database for NFL data and predictions
- **Connection**: Uses `DATABASE_URL` or `NEON_DATABASE_URL`
- **Features**: Auto-scaling, branching, serverless
- **Documentation**: [Neon Docs](https://neon.com/docs/introduction)

## 🔧 Build Configuration

### Vercel Settings (`vercel.json`)
```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "apps/web/app/api/**/*.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

### Package Manager Configuration
- **`.npmrc`**: `legacy-peer-deps=true` (handles React 19 peer dependency warnings)
- **Corepack**: Not enabled (using npm directly)

### Build Commands
- **Install**: `npm install`
- **Build**: `npm run build` (runs `next build`)
- **Start**: `npm start` (runs `next start`)

## 🛡️ Security & Protection

### Middleware Stack (`apps/web/middleware.ts`)
1. **Clerk Authentication** - Verifies user sessions
2. **Arcjet Protection** - Bot detection and rate limiting
3. **Static File Exclusion** - Skips protection for assets

### Environment Variable Protection
- Database connection is lazy-loaded (prevents build-time errors)
- All integrations gracefully handle missing env vars
- Build-time detection via `VERCEL_ENV` and `NEXT_PHASE`

## 📊 API Routes

### Protected Routes
- `/api/odds/tinybird` - Odds queries (Arcjet protected)
- `/api/predictions/genesis` - Predictions with A/B testing
- `/api/alerts` - Email alerts (Arcjet protected)

### Public Routes
- `/api/health` - Health check (database optional)

## 🗄️ Database Configuration

### Connection Strategy
- **Lazy Loading**: Database connection deferred until runtime
- **Build-Time**: Returns stub during Next.js build phase
- **Runtime**: Connects to Neon PostgreSQL when accessed

### Connection String Detection
Supports multiple environment variable names:
- `DATABASE_URL` (primary)
- `NEON_DATABASE_URL`
- `POSTGRES_URL`
- `RAILWAY_DATABASE_URL`
- And 8+ other common variants

## 🔐 Authentication Flow

1. User visits site → Clerk middleware checks session
2. If not authenticated → Redirects to sign-in
3. Protected API routes → Server-side `auth()` check
4. Client components → Use `<SignedIn>`, `<SignedOut>`, `<UserButton>`

## 📦 Dependencies

### Key Production Dependencies
- `next@^16.1.2` - Next.js framework
- `react@^19.2.3` - React library
- `@clerk/nextjs@^6.0.0` - Authentication
- `@arcjet/next@^1.0.0-beta.17` - Security
- `statsig-node@^6.5.1` - A/B testing
- `resend@^6.7.0` - Email
- `@upstash/redis@^1.36.1` - Caching
- `@axiomhq/axiom-node@^0.12.0` - Logging

### React Three Fiber (3D Components)
- Used in `Scene3D.tsx` and `BentoGrid2027.tsx`
- React 19 compatibility warnings (safe to ignore with `legacy-peer-deps`)

## 🚀 Deployment Process

1. **Git Push** → Triggers Vercel build
2. **Install Dependencies** → `npm install` with legacy peer deps
3. **Type Check** → TypeScript validation
4. **Lint** → ESLint checks
5. **Build** → `next build` (Turbopack)
6. **Deploy** → Standalone output to Vercel edge network

## 🐛 Known Issues & Solutions

### Peer Dependency Warnings
- **Issue**: React 19 with packages expecting React 18
- **Solution**: `.npmrc` with `legacy-peer-deps=true`
- **Impact**: None (warnings only, no errors)

### Build-Time Database Errors
- **Issue**: DATABASE_URL not available during build
- **Solution**: Lazy loading with build-time detection
- **Implementation**: Proxy pattern in `server/db.ts`

### CI/CD Jest Flag
- **Issue**: Using Vitest `--run` flag with Jest
- **Solution**: Changed to Jest `--ci` flag
- **Status**: ✅ Fixed

## 📝 Environment Variables Checklist

### Required for Production
- ✅ `DATABASE_URL` / `NEON_DATABASE_URL`
- ✅ `BALLDONTLIE_API_KEY`
- ✅ `NEXT_PUBLIC_API_URL`

### Optional (Auto-provided by Vercel)
- `ARCJET_KEY`
- `TINYBIRD_TOKEN`
- `STATSIG_SERVER_API_KEY`
- `RESEND_API_KEY`
- `AXIOM_TOKEN`
- `UPSTASH_REDIS_REST_URL`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

## 🎯 Performance Optimizations

- **Caching**: Upstash Redis for odds (5min) and predictions (30min)
- **Rate Limiting**: Arcjet + Upstash dual-layer protection
- **Lazy Loading**: Database, storage, and integrations
- **Standalone Build**: Optimized Next.js output
- **Edge Functions**: Deployed to `iad1` region

## 📚 Documentation References

- [Vercel Build Configuration](https://vercel.com/docs/builds/configure-a-build)
- [Clerk Next.js Quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart)
- [Arcjet Documentation](https://docs.arcjet.com/)
- [Statsig Vercel Integration](https://docs.statsig.com/integrations/vercel)
- [Axiom Vercel Integration](https://axiom.co/docs/apps/vercel)
- [Neon Documentation](https://neon.com/docs/introduction)
- [Upstash Documentation](https://upstash.com/docs)

## ✅ Build Status

- **TypeScript**: ✅ Passing
- **Linting**: ✅ Passing
- **Tests**: ✅ Configured (Jest with `--ci` flag)
- **Build**: ✅ Standalone output
- **Deployment**: ✅ Ready for Vercel

## 🔄 Next Steps

1. Install integrations via Vercel dashboard
2. Environment variables auto-synced
3. Run `vercel env pull` locally for development
4. Deploy and verify all integrations working
