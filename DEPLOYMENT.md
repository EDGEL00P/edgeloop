# Deployment Guide

Complete guide for deploying EdgeLoop to Vercel and Railway with remote access.

## 🚀 Quick Deploy

### Vercel (Serverless - Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/EDGEL00P/edgeloop)

**Manual Setup:**

1. **Connect GitHub Repository**
   ```bash
   # Visit: https://vercel.com/new
   # Click "Import Git Repository"
   # Search for: EDGEL00P/edgeloop
   # Click "Import"
   ```

2. **Configure Project**
   - Framework Preset: `Other`
   - Build Command: `pnpm run build`
   - Output Directory: Leave empty (API only)
   - Install Command: `pnpm install --frozen-lockfile`

3. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Get production URL: `https://edgeloop.vercel.app`

4. **Test Endpoints**
   ```bash
   curl https://edgeloop.vercel.app/healthz
   curl https://edgeloop.vercel.app/api/predictions
   ```

### Railway (Node.js Server)

**Method 1: GitHub Integration (Recommended)**

1. **Connect Repository**
   ```bash
   # Visit: https://railway.app/new
   # Click "Deploy from GitHub repo"
   # Select: EDGEL00P/edgeloop
   # Click "Deploy Now"
   ```

2. **Railway Auto-Configuration**
   - Railway detects `railway.json` and `nixpacks.toml`
   - Automatically configures Node.js 22 + pnpm
   - Runs build and starts server on random port

3. **Generate Domain**
   - Go to project settings
   - Click "Generate Domain"
   - Get URL: `https://edgeloop-production.up.railway.app`

4. **Test Endpoints**
   ```bash
   curl https://edgeloop-production.up.railway.app/healthz
   curl https://edgeloop-production.up.railway.app/api/predictions
   ```

**Method 2: CLI Deployment**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Get deployment URL
railway domain
```

## 📋 Environment Variables

### Vercel Dashboard
```
1. Go to: https://vercel.com/EDGEL00P/edgeloop/settings/environment-variables
2. Add variables:
   - PORT (optional, defaults to 3000)
   - NODE_ENV=production
3. Redeploy for changes to take effect
```

### Railway Dashboard
```
1. Go to: https://railway.app/project/[project-id]/variables
2. Add variables:
   - PORT (Railway provides automatically)
   - NODE_ENV=production
3. Redeploys automatically
```

## 🔄 Continuous Deployment

### GitHub Actions Setup

**Required Secrets for Vercel Deployment:**

To enable automated Vercel deployments via GitHub Actions, you need to configure the `VERCEL_TOKEN` secret:

1. **Get Vercel Token**
   ```bash
   # Visit: https://vercel.com/account/tokens
   # Click "Create Token"
   # Name it: "GitHub Actions"
   # Copy the token (you'll only see it once)
   ```

2. **Add to GitHub Secrets**
   ```bash
   # Visit: https://github.com/EDGEL00P/edgeloop/settings/secrets/actions
   # Click "New repository secret"
   # Name: VERCEL_TOKEN
   # Value: [paste your token]
   # Click "Add secret"
   ```

3. **Verify Workflow**
   - The workflow will automatically skip deployment if the secret is not configured
   - Once configured, deployments will run on every push to `main` and on pull requests

### Automatic Deployments

**Vercel:**
- Every push to `main` → Production deploy (requires `VERCEL_TOKEN` secret)
- Every push to feature branch → Preview deploy (requires `VERCEL_TOKEN` secret)
- PR opened → Preview deploy with URL in comment (requires `VERCEL_TOKEN` secret)
- Without `VERCEL_TOKEN`: Workflow runs but skips deployment steps gracefully

**Railway:**
- Every push to `main` → Production deploy
- GitHub check runs on PRs
- Can configure branch-specific deployments

### Manual Deployments

**Vercel CLI:**
```bash
# Preview
vercel

# Production
vercel --prod
```

**Railway CLI:**
```bash
railway up
```

## 🔗 Remote Access URLs

### Dashboard Access

**Vercel:**
- Dashboard: https://vercel.com/EDGEL00P/edgeloop
- Deployments: https://vercel.com/EDGEL00P/edgeloop/deployments
- Settings: https://vercel.com/EDGEL00P/edgeloop/settings
- Logs: https://vercel.com/EDGEL00P/edgeloop/logs

**Railway:**
- Dashboard: https://railway.app/project/[project-id]
- Deployments: https://railway.app/project/[project-id]/deployments
- Metrics: https://railway.app/project/[project-id]/metrics
- Logs: https://railway.app/project/[project-id]/logs

### API Endpoints

**Vercel (Serverless):**
```
https://edgeloop.vercel.app/healthz
https://edgeloop.vercel.app/readyz
https://edgeloop.vercel.app/api/predictions
https://edgeloop.vercel.app/api/model-status
https://edgeloop.vercel.app/api/alerts
```

**Railway (Node.js):**
```
https://edgeloop-production.up.railway.app/healthz
https://edgeloop-production.up.railway.app/readyz
https://edgeloop-production.up.railway.app/api/predictions
https://edgeloop-production.up.railway.app/api/model-status
https://edgeloop-production.up.railway.app/api/alerts
```

## 🛠️ Troubleshooting

### Vercel Build Fails

**Check build logs:**
```bash
vercel logs [deployment-url]
```

**Common issues:**
- Missing dependencies → Check `pnpm-lock.yaml` is committed
- TypeScript errors → Run `pnpm run typecheck` locally first
- Build timeout → Optimize build or upgrade Vercel plan

### Railway Build Fails

**Check build logs in dashboard:**
- Go to project → Deployments → Click failed deployment
- View "Build Logs" and "Deploy Logs"

**Common issues:**
- Port binding → Railway sets PORT env var automatically
- Memory limits → Upgrade plan if needed
- Nixpacks config → Check `nixpacks.toml` syntax

## 📊 Monitoring

### Vercel

**View Logs:**
```bash
vercel logs [deployment-url] --follow
```

**Metrics Dashboard:**
- Requests per second
- Error rate
- Response time
- Bandwidth usage

### Railway

**View Logs:**
```bash
railway logs
```

**Metrics Dashboard:**
- CPU usage
- Memory usage
- Network I/O
- Request count

## 🔐 Security

### Vercel

- Automatic HTTPS with SSL certificates
- DDoS protection included
- Security headers configured in `vercel.json`
- Environment variables encrypted at rest

### Railway

- Automatic HTTPS with SSL certificates
- Private networking between services
- Security headers configured in code
- Environment variables encrypted

## 💰 Pricing

### Vercel
- **Hobby (Free):** 100 GB bandwidth/month, serverless functions
- **Pro ($20/mo):** 1 TB bandwidth, advanced features
- Good for: Serverless API, auto-scaling

### Railway
- **Free Trial:** $5 credit, then $5/month minimum
- **Usage-based:** ~$20-30/month for production
- Good for: Always-on server, WebSockets, background jobs

## 🎯 Recommendation

**Use Vercel for:**
- Production API deployment (recommended)
- Automatic scaling
- Zero configuration
- Lower cost for API workloads

**Use Railway for:**
- Development/staging environments
- Full Node.js server features
- Background jobs or cron tasks
- More control over runtime

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [EdgeLoop API Documentation](./README.md)
- [GitHub Repository](https://github.com/EDGEL00P/edgeloop)
