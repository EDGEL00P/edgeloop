# 🚀 Vercel Configuration Guide

## Overview

This document describes the optimized Vercel configuration for Edgeloop.

## Configuration File

The project uses a single `vercel.json` at the root with `rootDirectory` set to `apps/web`.

## Key Settings

### Root Directory
- **`rootDirectory: "apps/web"`** - Vercel changes working directory to `apps/web` before running commands
- All build/dev commands run from this directory automatically

### Build Configuration
- **Framework**: Next.js (auto-detected, but explicitly set)
- **Build Command**: `npm install && npm run build`
- **Install Command**: `npm install`
- **Output Directory**: `.next` (default for Next.js)

### Function Configuration
- **Runtime**: Node.js 20.x (matches package.json engines)
- **Memory**: 1024 MB for API routes
- **Max Duration**: 30 seconds for API routes
- Applies to all routes in `app/api/**/*.ts` and `app/api/**/*.tsx`

### Region
- **Primary**: `iad1` (US East - Washington, D.C.)
- Optimized for low latency in North America

### Headers

#### API Routes (`/api/:path*`)
- CORS headers for cross-origin requests
- Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)

#### All Routes (`/(.*)`)
- Security headers for all pages
- Referrer policy for privacy

### Image Optimization
- Remote patterns: All HTTPS domains allowed
- Minimum cache TTL: 60 seconds
- Optimized for Next.js Image component

### Routing
- **Clean URLs**: Enabled (removes `.html` extensions)
- **Trailing Slash**: Disabled (no trailing slashes)
- **Health Check**: `/health` rewrites to `/api/health`
- **Redirects**: `/home` → `/` (permanent)

## Environment Variables

Environment variables are managed through:
1. **Vercel Dashboard** - Project Settings → Environment Variables
2. **Vercel CLI** - `vercel env` commands
3. **Integration Secrets** - Auto-provided by integrations (Clerk, Upstash, etc.)

### Required Variables (Auto-provided by integrations)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk Auth
- `CLERK_SECRET_KEY` - Clerk Auth
- `UPSTASH_REDIS_REST_URL` - Upstash Redis
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis
- `TRIGGER_API_KEY` - Trigger.dev
- `AXIOM_TOKEN` - Axiom Logging
- `DATABASE_URL` - Neon PostgreSQL

### Optional Variables
- `NEXT_PUBLIC_API_URL` - Rust backend URL (defaults to `http://localhost:3001`)
- `RUST_ENGINE_URL` - Rust API endpoint
- `BALLDONTLIE_API_KEY` - NFL data API key
- `STATSIG_SERVER_API_KEY` - Statsig A/B testing
- `RESEND_API_KEY` - Email service

## Build Process

1. **Install Dependencies**: Runs `npm install` in `apps/web`
2. **Build**: Runs `npm run build` (Next.js build)
3. **Deploy**: Deploys `.next` output to Edge Network

## Performance Optimizations

- **Standalone Output**: Configured in `next.config.mjs`
- **Turbopack**: Enabled for faster builds
- **Image Optimization**: Automatic via Next.js Image component
- **Function Memory**: 1024 MB for complex API routes
- **Region**: US East for optimal latency

## Security

- **Security Headers**: Enabled on all routes
- **CORS**: Configured for API routes
- **Content Security**: X-Content-Type-Options, X-Frame-Options
- **XSS Protection**: Enabled via headers

## Monitoring

- **Axiom**: Real-time logging (auto-configured via integration)
- **Vercel Analytics**: Built-in performance monitoring
- **Edge Network**: Automatic global distribution

## Troubleshooting

### Build Fails
1. Check build logs in Vercel dashboard
2. Verify all dependencies in `apps/web/package.json`
3. Check Node.js version matches (20.x)
4. Verify `rootDirectory` is set correctly

### Function Errors
1. Check function logs in Vercel dashboard
2. Verify memory/duration limits are sufficient
3. Check environment variables are set
4. Review API route code

### Deployment Issues
1. Verify Git connection in Vercel
2. Check branch settings (main branch auto-deploys)
3. Review deployment logs for errors
4. Verify environment variables are configured

## Next Steps

1. **Connect Repository** to Vercel (if not already connected)
2. **Install Integrations** (Clerk, Upstash, Axiom, etc.)
3. **Set Environment Variables** (if not auto-provided)
4. **Deploy** - Automatic on push to main branch

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Configuration Reference](https://vercel.com/docs/projects/project-configuration)
