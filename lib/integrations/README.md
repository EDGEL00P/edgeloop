# Vercel Integrations

This directory contains integrations for all Vercel services installed in the project.

## Services

### 1. **Statsig** - Algorithm A/B Testing
- **Purpose**: A/B test different prediction algorithms
- **Usage**: See `apps/web/app/api/predictions/genesis/route.ts`
- **Env Var**: `STATSIG_SERVER_API_KEY`
- **Limit**: 2 Million Events
- **Documentation**: [Statsig Vercel Integration](https://docs.statsig.com/integrations/vercel)

### 2. **Resend** - High-Priority Email Alerts
- **Purpose**: Send prediction alerts via email (3k emails/month)
- **Usage**: See `apps/web/app/api/alerts/route.ts`
- **Env Vars**:
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`

### 3. **Axiom** - Observability & Logging
- **Purpose**: Centralized logging and observability
- **Usage**: Automatic logging in all API routes
- **Env Vars**:
  - `AXIOM_TOKEN`
  - `AXIOM_DATASET`
  - `AXIOM_ORG_ID`
- **Documentation**: [Axiom Vercel Integration](https://axiom.co/docs/apps/vercel)

### 4. **Upstash Redis** - Caching & Rate Limiting
- **Purpose**: Redis caching for odds and predictions
- **Usage**: Caching layer in API routes
- **Env Vars**:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- **Documentation**: [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted)

### 5. **Clerk** - Authentication & Authorization
- **Purpose**: User authentication and protected routes
- **Usage**: Integrated in `proxy.ts` and `app/layout.tsx`
- **Env Vars**:
  - `CLERK_SECRET_KEY`
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- **Documentation**: [Clerk Next.js Quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart)

### 6. **Neon** - Serverless PostgreSQL
- **Purpose**: Primary database for NFL data and predictions
- **Usage**: Via `DATABASE_URL` or `NEON_DATABASE_URL`
- **Documentation**: [Neon Docs](https://neon.com/docs/introduction)

## Environment Variables

All environment variables are automatically provided by Vercel when you install the integrations. Use `vercel env pull` to sync them locally.

## Usage Examples

### Cache with Upstash
```typescript
import { cacheGameOdds, getCachedGameOdds } from "@/lib/integrations/upstash";

// Get cached data
const cached = await getCachedGameOdds("game123");
if (cached) return cached;

// Cache new data
await cacheGameOdds("game123", odds, 300); // 5 minutes
```

### Send Email Alert
```typescript
import { sendPredictionAlert } from "@/lib/integrations/resend";

await sendPredictionAlert("user@example.com", {
  homeTeam: "Chiefs",
  awayTeam: "Ravens",
  prediction: "HOME COVER",
  confidence: 0.85,
  edge: 0.12,
});
```

### Log to Axiom
```typescript
import { logPrediction } from "@/lib/integrations/axiom";

await logPrediction({
  gameId: "123",
  homeTeamId: 1,
  awayTeamId: 2,
  predictedSpread: 3.5,
  confidence: 0.85,
  algorithm: "genesis_v1",
});
```

### A/B Testing with Statsig
```typescript
import { getAlgorithmVariant } from "@/lib/integrations/statsig";

const algorithm = await getAlgorithmVariant(userId, "prediction_algorithm");
// Returns: "genesis_v1" | "genesis_v2" | "baseline"
```

### Authentication with Clerk
```typescript
// In API routes or server components
import { auth } from '@clerk/nextjs/server';

const { userId } = await auth();
if (!userId) {
  return new Response('Unauthorized', { status: 401 });
}
```

```tsx
// In client components
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

<SignedOut>
  <SignInButton />
  <SignUpButton />
</SignedOut>
<SignedIn>
  <UserButton />
</SignedIn>
```
