# Vercel Deployment Strategy for Platform + Domain Architecture

## Overview

Vercel excels at deploying Next.js applications. For the Platform + Domain architecture, we use a **hybrid approach**:

- **Primary App** (`apps/web`) → Deploys to Vercel (Next.js optimized)
- **Domain Services** → Deploy as Vercel Functions, Edge Functions, or separate services (Railway/Fly.io)

## Deployment Strategy

### ✅ What Vercel Handles (apps/web)

**Next.js App** - Primary deployment target:
- Framework: Next.js 16
- Functions: API routes in `app/api/` → Serverless Functions
- Edge: Middleware, edge routes → Edge Functions
- Static: Pages, assets → CDN
- Runtime: Node.js 24.x

**Configuration** (`vercel.json`):
```json
{
  "framework": "nextjs",
  "outputDirectory": ".next",
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs24.x",
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

### 🔄 Hybrid Services (Domain Services)

**Option 1: Vercel Functions (Small Services)**
- Identity service → Deploy as Vercel Functions
- Notifications → Deploy as Vercel Functions
- Use `app/api/identity/`, `app/api/notifications/`

**Option 2: Separate Deployments (Heavy Services)**
- Data Oracle → Railway/Fly.io (Rust service)
- Prediction Engine → Fly.io (Rust + Python inference)
- Execution → Fly.io (Rust service)

**Communication**:
- Services expose REST APIs
- Apps consume via generated SDKs (`libs/sdk-ts/`)
- No direct imports between services

## Vercel-Specific Considerations

### 1. Monorepo Support

Vercel supports monorepos via:
- **Root `vercel.json`** → Configures `apps/web`
- **Build command** → `cd apps/web && npm run build`
- **Root directory** → Set in Vercel dashboard or `vercel.json`

```json
{
  "buildCommand": "cd apps/web && npm install && npm run build",
  "installCommand": "cd apps/web && npm ci"
}
```

### 2. Function Deployment

**Next.js API Routes** (`apps/web/app/api/`):
- Automatically deployed as Vercel Functions
- Can proxy to external services via rewrites
- Runtime: Node.js 24.x (via `package.json` engines)

**Edge Functions** (when needed):
- Use Next.js Edge Runtime
- Deploy middleware, edge API routes

### 3. Inter-Service Communication

**Pattern**: Apps → SDKs → Services

```typescript
// In apps/web
import { dataOracleClient } from '@edgeloop/sdk-ts';

// SDK uses environment variables for service URLs
const games = await dataOracleClient.getGames(season, week);
```

**Environment Variables**:
- `DATA_ORACLE_URL` → Service URL (e.g., `https://data-oracle.fly.io`)
- `PREDICTION_ENGINE_URL` → Service URL
- SDKs read from env vars, making services swappable

### 4. Platform Templates for Vercel

**Template Structure**:
```
platform/templates/vercel-service/
├── vercel.json              # Service-specific config
├── app/
│   └── api/
│       └── [route]/
│           └── route.ts     # Next.js API route
└── README.md
```

## Vercel Configuration Updates

### Current Setup (Before Migration)

```json
{
  "functions": {
    "app/api/**/*.ts": { ... }  // Root-level app
  }
}
```

### Target Setup (After Migration)

```json
{
  "buildCommand": "cd apps/web && npm install && npm run build",
  "installCommand": "cd apps/web && npm ci",
  "rootDirectory": "apps/web",
  "functions": {
    "apps/web/app/api/**/*.ts": {
      "runtime": "nodejs24.x"
    }
  }
}
```

## Benefits of This Approach

1. **Next.js Optimization** - Vercel optimizes Next.js apps automatically
2. **Serverless Scaling** - Functions scale automatically
3. **Edge Performance** - Middleware/Edge functions run globally
4. **SDK Abstraction** - Services can move between platforms
5. **Boundary Enforcement** - Apps only use SDKs, not direct imports

## Migration Path

### Phase 1: Structure (Current)
- ✅ Created `apps/`, `services/`, `libs/`, `platform/` directories
- ✅ Set up boundary enforcement rules

### Phase 2: Move Web App
- Move `app/` → `apps/web/`
- Update `vercel.json` with `rootDirectory: "apps/web"`
- Update build commands

### Phase 3: Extract Services
- Extract identity → Vercel Functions (or keep in `apps/web/app/api/auth/`)
- Extract notifications → Vercel Functions
- Deploy heavy services (oracle, prediction) separately

### Phase 4: SDK Generation
- Generate TypeScript SDKs from contracts
- Update `apps/web` to use SDKs
- Enforce boundaries

## References

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Monorepo Deployment](https://vercel.com/docs/deployments/monorepos)
- [Functions Configuration](https://vercel.com/docs/functions/configuring-functions)
