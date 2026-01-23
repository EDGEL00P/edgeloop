# GitHub Actions Deployment Setup

Follow these steps to enable automatic deployments to Vercel and Railway.

## Prerequisites

- Vercel account with project created
- Railway account with project created
- GitHub repository admin access

## Step 1: Get Vercel Tokens

1. **Get Vercel Token:**
   ```
   Visit: https://vercel.com/account/tokens
   Click: "Create Token"
   Name: "GitHub Actions"
   Scope: Full Account
   Copy the token
   ```

2. **Get Vercel Project IDs:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login
   vercel login

   # Link project
   cd /path/to/edgeloop
   vercel link

   # Get IDs from .vercel/project.json
   cat .vercel/project.json
   ```

## Step 2: Get Railway Token

1. **Get Railway Token:**
   ```
   Visit: https://railway.app/account/tokens
   Click: "Create Token"
   Name: "GitHub Actions"
   Copy the token
   ```

2. **Get Railway Project ID:**
   ```
   Visit: https://railway.app/project/[your-project]
   Copy the project ID from the URL
   ```

## Step 3: Add GitHub Secrets

1. **Go to Repository Settings:**
   ```
   https://github.com/EDGEL00P/edgeloop/settings/secrets/actions
   ```

2. **Add Secrets:**
   Click "New repository secret" for each:

   | Secret Name | Value | Where to get it |
   |------------|-------|-----------------|
   | `VERCEL_TOKEN` | Your Vercel token | Step 1 |
   | `VERCEL_ORG_ID` | From .vercel/project.json | Step 1 |
   | `VERCEL_PROJECT_ID` | From .vercel/project.json | Step 1 |
   | `RAILWAY_TOKEN` | Your Railway token | Step 2 |
   | `RAILWAY_PROJECT_ID` | From Railway project URL | Step 2 |

## Step 4: Verify Setup

1. **Push to main branch:**
   ```bash
   git push origin main
   ```

2. **Check GitHub Actions:**
   ```
   Visit: https://github.com/EDGEL00P/edgeloop/actions
   ```

3. **Verify Deployments:**
   - Vercel workflow should run and deploy
   - Railway workflow should run and deploy
   - Check deployment URLs in workflow logs

## Troubleshooting

### Vercel Deployment Fails

**Error: "No Vercel Token provided"**
- Check `VERCEL_TOKEN` secret is set correctly
- Token should have full account access

**Error: "Project not found"**
- Check `VERCEL_PROJECT_ID` matches your project
- Run `vercel link` locally to get correct IDs

### Railway Deployment Fails

**Error: "Invalid token"**
- Check `RAILWAY_TOKEN` secret is set correctly
- Generate a new token if needed

**Error: "Service not found"**
- Update service name in `deploy-railway.yml`
- Or remove `--service` flag to use default

## Alternative: Manual Setup

If you prefer not to use GitHub Actions:

### Vercel
1. Go to: https://vercel.com/new
2. Import GitHub repository: EDGEL00P/edgeloop
3. Deploy (automatic deployments enabled)

### Railway
1. Go to: https://railway.app/new
2. Deploy from GitHub repo: EDGEL00P/edgeloop
3. Deploy (automatic deployments enabled)

## Automatic Deployment Behavior

### On Push to Main:
- ✅ Vercel deploys to production
- ✅ Railway deploys to production
- 🔗 URLs remain constant
- ⚡ Takes 2-3 minutes

### On Pull Request:
- ✅ Vercel creates preview deployment
- 💬 URL posted as PR comment
- 🧪 Test before merging

## Monitoring Deployments

### View Deployment Status:
```
GitHub Actions: https://github.com/EDGEL00P/edgeloop/actions
Vercel Dashboard: https://vercel.com/EDGEL00P/edgeloop
Railway Dashboard: https://railway.app/project/[project-id]
```

### Get Deployment URLs:
```bash
# Vercel
vercel ls

# Railway
railway status
```

## Security Notes

- Never commit tokens to repository
- Rotate tokens regularly (every 90 days)
- Use fine-grained tokens when possible
- Monitor deployment logs for unauthorized access

## Next Steps

After setup:
1. ✅ Push code to trigger deployments
2. ✅ Test API endpoints on both platforms
3. ✅ Set up monitoring and alerts
4. ✅ Configure custom domains (optional)

## Support

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- GitHub Actions: https://docs.github.com/actions
