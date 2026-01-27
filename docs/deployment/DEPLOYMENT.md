# Deployment Guide - Vercel Setup

## Prerequisites

- GitHub repository connected
- Vercel account
- Environment variables ready

## Step 1: Install Vercel GitHub App

1. Go to https://vercel.com/new
2. Click "Add GitHub Account"
3. Select your repository
4. Grant permissions

## Step 2: Create Three Vercel Projects

### Project 1: Web App (Customer-Facing)

**Project Settings:**
- Name: `edgeloop-web` (or your preferred name)
- Framework Preset: Next.js
- Root Directory: `apps/web`
- Build Command: (leave default)
- Output Directory: (leave default)
- Install Command: `pnpm install --frozen-lockfile`

**Environment Variables (Production + Preview):**
```
DATABASE_URL=postgresql://...
BALLDONTLIE_API_BASE=https://api.balldontlie.io
BALLDONTLIE_API_KEY=your-key
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
REVALIDATE_SECRET=your-random-secret
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_ENV=production
```

### Project 2: Admin Dashboard

**Project Settings:**
- Name: `edgeloop-admin`
- Framework Preset: Next.js
- Root Directory: `apps/admin`
- Same build/install commands

**Environment Variables:**
Same as web app, plus:
```
NEXTAUTH_URL=https://admin.your-domain.com
NEXTAUTH_SECRET=your-auth-secret
```

### Project 3: Workers (Cron Jobs)

**Project Settings:**
- Name: `edgeloop-workers`
- Framework Preset: Next.js
- Root Directory: `apps/workers`

**Environment Variables:**
Same as web app, plus:
```
WEB_BASE_URL=https://edgeloop-web.vercel.app
```

**Note:** The `vercel.json` file in `apps/workers` defines cron schedules.

## Step 3: Configure GitHub Integration

### Branch Settings

**Production Branch:** `main`
- Auto-deploy on push
- Use production environment variables

**Preview Branches:** All other branches
- Auto-deploy on PR
- Use preview environment variables
- Comment PR with preview URL

### Build Settings

Enable Vercel Remote Caching for Turborepo:
```bash
# In your local terminal
pnpm dlx turbo login
pnpm dlx turbo link
```

This speeds up CI builds by sharing cache across team members.

## Step 4: Configure Custom Domains (Optional)

### Web App
- Add domain: `app.yourdomain.com`
- Add www redirect if needed

### Admin
- Add domain: `admin.yourdomain.com`

### Workers
- Workers typically don't need custom domain
- Access via Vercel subdomain is fine

## Step 5: Set Up Database

### Option A: Neon (Recommended)

1. Create account at https://neon.tech
2. Create project
3. Copy connection string
4. Add to Vercel environment variables as `DATABASE_URL`

**Neon Benefits:**
- Serverless Postgres
- Auto-scaling
- Generous free tier
- Instant branching for preview deployments

### Option B: Supabase

1. Create project at https://supabase.com
2. Go to Settings → Database
3. Copy connection string (pooler mode)
4. Add to Vercel environment variables

## Step 6: Set Up Redis

1. Create account at https://upstash.com
2. Create Redis database
3. Copy REST URL and Token
4. Add to Vercel:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

## Step 7: Get BallDontLie API Key

1. Sign up at https://www.balldontlie.io
2. Get API key from dashboard
3. Add to Vercel as `BALLDONTLIE_API_KEY`

## Step 8: Run Initial Migration

From your local machine:

```bash
# Set DATABASE_URL in .env.local
echo "DATABASE_URL=your-neon-url" > .env.local

# Generate migration files
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed initial data
pnpm db:seed
```

## Step 9: Deploy

### First Deploy

1. Push to main branch
2. Vercel automatically builds and deploys
3. Check deployment logs for errors
4. Visit deployed URL to verify

### Subsequent Deploys

**For features:**
1. Create feature branch
2. Push to GitHub
3. Vercel creates preview deployment
4. Review preview URL
5. Merge to main
6. Production auto-deploys

## Step 10: Verify Deployment

### Health Checks

Check these endpoints:

```bash
# Teams API
curl https://your-app.vercel.app/api/teams

# Games API
curl https://your-app.vercel.app/api/games?season=2026&week=1

# Health check
curl https://your-app.vercel.app/api/health
```

### Test Real-Time Feed

Visit: `https://your-app.vercel.app/edges`

Should see:
- Connection status indicator
- Live edge updates (demo mode)

### Test Cache Revalidation

```bash
curl -X POST https://your-app.vercel.app/api/revalidate \
  -H "x-revalidate-secret: your-secret" \
  -H "content-type: application/json" \
  -d '{"tags":["games:2026:1"]}'
```

Should return:
```json
{
  "ok": true,
  "tags": ["games:2026:1"],
  "revalidated": 1
}
```

## Monitoring & Debugging

### Vercel Dashboard

**Deployments:**
- View build logs
- Check deployment status
- Roll back if needed

**Analytics:**
- Core Web Vitals
- Page performance
- API route metrics

**Logs:**
- Real-time function logs
- Filter by severity
- Search by text

### Common Issues

**Build fails with "Module not found":**
- Check `transpilePackages` in next.config.js
- Verify package.json dependencies
- Clear Vercel cache and redeploy

**API routes return 500:**
- Check function logs
- Verify environment variables are set
- Test locally with `vercel env pull`

**Database connection fails:**
- Verify DATABASE_URL is correct
- Check IP allowlist (Neon/Supabase)
- Use connection pooler for serverless

**Cron jobs not running:**
- Verify `vercel.json` in workers project
- Check Vercel dashboard → Cron
- Logs appear under each cron execution

## Performance Optimization

### Enable Vercel Speed Insights

1. Go to project settings
2. Enable Speed Insights
3. View real user metrics

### Configure ISR

For prediction pages, set revalidate times:

```typescript
export const revalidate = 30 // 30 seconds
```

### Use Edge Runtime

For API routes that don't need Node APIs:

```typescript
export const runtime = 'edge'
```

Benefits:
- Lower latency (global edge network)
- Faster cold starts
- Lower costs

## Security Checklist

- [ ] All secrets in environment variables
- [ ] REVALIDATE_SECRET is random and strong
- [ ] DATABASE_URL uses SSL mode
- [ ] CSP headers configured
- [ ] Rate limiting enabled
- [ ] CORS configured for known domains
- [ ] Auth protected routes (admin)

## Scaling Considerations

### Database
- Use read replicas for heavy queries
- Connection pooling (PgBouncer)
- Partition large tables (odds_quotes)

### Redis
- Upgrade Upstash plan as traffic grows
- Use Redis Streams for job queues
- Cache hot data aggressively

### Vercel
- Monitor function duration (10s limit)
- Use Edge runtime where possible
- Consider Vercel Pro for better performance

## Rollback Procedure

If deployment breaks production:

1. Go to Vercel dashboard
2. Find last working deployment
3. Click "..." → "Redeploy"
4. Select "Use existing build cache"
5. Click "Redeploy"

This restores previous version immediately.

## Next Steps

1. Set up monitoring alerts
2. Configure custom domain
3. Enable Vercel Analytics
4. Set up error tracking (Sentry)
5. Create runbook for incidents
