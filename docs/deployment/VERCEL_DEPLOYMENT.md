# 🚀 Vercel Deployment Guide

## Quick Deploy

### Step 1: Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository

### Step 2: Configure Project Settings
- **Root Directory**: `apps/web`
- **Framework Preset**: Next.js
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Step 3: Install Vercel Integrations
Install these integrations (they auto-provide environment variables):

1. **Clerk** - Authentication
   - Provides: `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

2. **Upstash Redis** - Caching & Rate Limiting
   - Provides: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

3. **Trigger.dev** - Background Jobs
   - Provides: `TRIGGER_API_KEY`, `TRIGGER_PROJECT_ID`

4. **Axiom** - Logging & Observability
   - Provides: `AXIOM_TOKEN`, `AXIOM_DATASET`, `AXIOM_ORG_ID`

5. **Statsig** - A/B Testing
   - Provides: `STATSIG_SERVER_API_KEY`

6. **Resend** - Email Alerts
   - Provides: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

7. **Neon** - PostgreSQL Database
   - Provides: `DATABASE_URL`, `NEON_DATABASE_URL`

### Step 4: Set Additional Environment Variables
In Vercel dashboard → Settings → Environment Variables, add:

```
BALLDONTLIE_API_KEY=your-goat-tier-key
NEXT_PUBLIC_API_URL=https://your-rust-api.com (or http://localhost:3001 for local)
RUST_ENGINE_URL=https://your-rust-api.com (or http://localhost:3001 for local)
TRIGGER_PROJECT_ID=edgeloop (optional, defaults to "edgeloop")
```

### Step 5: Deploy
Click **"Deploy"** - Vercel will:
1. Install dependencies
2. Run build
3. Deploy to Edge Network

## Build Configuration

The project uses:
- **Next.js 16** with App Router
- **Standalone output** for optimized deployments
- **Turbopack** for faster builds
- **Edge Functions** for API routes

## Post-Deployment

### Verify Deployment
1. Check build logs in Vercel dashboard
2. Visit your deployment URL
3. Test API endpoints: `/api/health`

### Monitor Performance
- **Axiom**: View logs in Axiom dashboard
- **Vercel Analytics**: Built-in performance monitoring
- **Edge Network**: Automatic global distribution

## Troubleshooting

### Build Fails
- Check environment variables are set
- Verify root directory is `apps/web`
- Check build logs for specific errors

### Runtime Errors
- Verify all Vercel integrations are installed
- Check environment variables match integration outputs
- Review Axiom logs for errors

### API Connection Issues
- Verify `RUST_ENGINE_URL` is correct
- Check Rust API is accessible
- Test API health endpoint

## Production Checklist

- ✅ All Vercel integrations installed
- ✅ Environment variables configured
- ✅ Build succeeds without errors
- ✅ API routes responding correctly
- ✅ Authentication working (Clerk)
- ✅ Database connected (Neon)
- ✅ Redis caching working (Upstash)
- ✅ Logging configured (Axiom)

## Support

For issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- Project [Documentation](./README.md)
