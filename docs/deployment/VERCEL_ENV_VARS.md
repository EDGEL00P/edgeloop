# 🔧 Vercel System Environment Variables

## Overview

Vercel automatically provides system environment variables that are populated at build and runtime. These variables are available when you enable **"Automatically expose System Environment Variables"** in your Vercel project settings.

## Enable System Variables

To enable these variables in your Vercel project:

1. Navigate to your project on the [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to **Settings** → **Environment Variables**
3. Check **"Automatically expose System Environment Variables"**
4. Save the changes

**⚠️ Important**: If this setting is disabled, `VERCEL_DEPLOYMENT_ID` won't be available, which means **Skew Protection** will be disabled.

## Available System Variables

### Deployment Detection

| Variable | Available | Description | Example |
|----------|-----------|-------------|---------|
| `VERCEL` | Build + Runtime | Indicator that system env vars are exposed | `1` |
| `CI` | Build only | Indicates Continuous Integration environment | `1` |

### Environment Information

| Variable | Available | Description | Example |
|----------|-----------|-------------|---------|
| `VERCEL_ENV` | Build + Runtime | Deployment environment | `production`, `preview`, `development` |
| `VERCEL_TARGET_ENV` | Build + Runtime | System or custom environment | `production`, `preview`, `development`, `staging` |
| `VERCEL_REGION` | Runtime | Region where app is running | `iad1`, `sfo1`, `cdg1` |

### URL Information

| Variable | Available | Description | Example |
|----------|-----------|-------------|---------|
| `VERCEL_URL` | Build + Runtime | Deployment URL (without protocol) | `my-site.vercel.app` |
| `VERCEL_BRANCH_URL` | Build + Runtime | Git branch URL (without protocol) | `my-site-git-feature.vercel.app` |
| `VERCEL_PROJECT_PRODUCTION_URL` | Build + Runtime | Production domain (always set) | `my-site.com` |

### Deployment Information

| Variable | Available | Description | Example |
|----------|-----------|-------------|---------|
| `VERCEL_DEPLOYMENT_ID` | Build + Runtime | Unique deployment ID | `dpl_7Gw5ZMBpQA8h9GF832KGp7nwbuh3` |
| `VERCEL_PROJECT_ID` | Build + Runtime | Unique project ID | `prj_Rej9WaMNRbffVm34MfDqa4daCEvZzzE` |

### Skew Protection

| Variable | Available | Description | Example |
|----------|-----------|-------------|---------|
| `VERCEL_SKEW_PROTECTION_ENABLED` | Build + Runtime | Skew Protection enabled | `1` |

### Security & Automation

| Variable | Available | Description | Example |
|----------|-----------|-------------|---------|
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Build + Runtime | Protection bypass secret | `secret` |
| `VERCEL_OIDC_TOKEN` | Build | OIDC token for secure backend access | `token` |

### Git Information

| Variable | Available | Description | Example |
|----------|-----------|-------------|---------|
| `VERCEL_GIT_PROVIDER` | Build + Runtime | Git provider | `github`, `gitlab`, `bitbucket` |
| `VERCEL_GIT_REPO_SLUG` | Build + Runtime | Repository name | `edgeloop` |
| `VERCEL_GIT_REPO_OWNER` | Build + Runtime | Repository owner | `EDGEL00P` |
| `VERCEL_GIT_REPO_ID` | Build + Runtime | Repository ID | `117716146` |
| `VERCEL_GIT_COMMIT_REF` | Build + Runtime | Git branch name | `main`, `feature-branch` |
| `VERCEL_GIT_COMMIT_SHA` | Build + Runtime | Git commit SHA | `fa1eade47b73733d6312d5abfad33ce9e4068081` |
| `VERCEL_GIT_COMMIT_MESSAGE` | Build + Runtime | Commit message (truncated) | `Update about page` |
| `VERCEL_GIT_COMMIT_AUTHOR_LOGIN` | Build + Runtime | Commit author username | `johndoe` |
| `VERCEL_GIT_COMMIT_AUTHOR_NAME` | Build + Runtime | Commit author name | `John Doe` |
| `VERCEL_GIT_PREVIOUS_SHA` | Build only | Previous successful deployment SHA | `fa1eade47b73733d6312d5abfad33ce9e4068080` |
| `VERCEL_GIT_PULL_REQUEST_ID` | Build + Runtime | Pull request ID (if applicable) | `123` |

## Current Usage in Edgeloop

### ✅ Already Using

1. **`VERCEL`** - Detection in `apps/web/lib/env.ts` and `apps/web/app/layout.tsx`
   ```typescript
   const isBuildTime = process.env.VERCEL === undefined;
   ```

2. **`VERCEL_URL`** - App URL in `apps/web/next.config.mjs`
   ```typescript
   NEXT_PUBLIC_APP_URL: process.env.VERCEL_URL
     ? `https://${process.env.VERCEL_URL}`
     : 'http://localhost:3000'
   ```

### 🎯 Recommended Usage

1. **`VERCEL_ENV`** - Environment detection
   ```typescript
   const isProduction = process.env.VERCEL_ENV === 'production';
   const isPreview = process.env.VERCEL_ENV === 'preview';
   ```

2. **`VERCEL_PROJECT_PRODUCTION_URL`** - Production links (OG images, etc.)
   ```typescript
   const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || 'https://edgeloop.vercel.app';
   ```

3. **`VERCEL_REGION`** - Region monitoring
   ```typescript
   const region = process.env.VERCEL_REGION || 'unknown';
   ```

4. **`VERCEL_DEPLOYMENT_ID`** - Skew Protection
   - Automatically used by Next.js for Skew Protection
   - Available for custom implementation if needed

5. **`VERCEL_GIT_COMMIT_SHA`** - Version tracking
   ```typescript
   const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev';
   ```

## Best Practices

### 1. Environment Detection

Use `VERCEL_ENV` for environment-specific behavior:

```typescript
const isProduction = process.env.VERCEL_ENV === 'production';
const isPreview = process.env.VERCEL_ENV === 'preview';
const isDevelopment = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'development';
```

### 2. Production URLs

Always use `VERCEL_PROJECT_PRODUCTION_URL` for production links:

```typescript
// ✅ Good - Always points to production
const ogImageUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/og-image.png`;

// ❌ Bad - Points to preview in preview deployments
const ogImageUrl = `https://${process.env.VERCEL_URL}/og-image.png`;
```

### 3. Build vs Runtime

- **Build-time only**: `CI`, `VERCEL_GIT_PREVIOUS_SHA`, `VERCEL_OIDC_TOKEN`
- **Runtime only**: `VERCEL_REGION`
- **Both**: Most other variables

### 4. Type Safety

Create TypeScript types for Vercel variables:

```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      VERCEL?: string;
      VERCEL_ENV?: 'development' | 'preview' | 'production';
      VERCEL_URL?: string;
      VERCEL_PROJECT_PRODUCTION_URL?: string;
      VERCEL_REGION?: string;
      VERCEL_DEPLOYMENT_ID?: string;
      VERCEL_PROJECT_ID?: string;
    }
  }
}
```

## Security Notes

### ⚠️ React Warnings

When system variables are exposed, React may show warnings in `create-react-app` about `process.env.CI = true`. This is expected and can be ignored, or you can:

1. Add `.env` with `CI=false` to your `.gitignore`
2. Use `VERCEL_ENV` instead of `CI` for environment detection

### 🔒 OIDC Tokens

`VERCEL_OIDC_TOKEN` is only available at build time. At runtime, it's set in the `x-vercel-oidc-token` header on function requests.

## Troubleshooting

### Variables Not Available

1. **Check Settings**: Verify "Automatically expose System Environment Variables" is enabled
2. **Check Deployment**: Variables are only available in Vercel deployments
3. **Check Scope**: Some variables are build-time only (`CI`) or runtime only (`VERCEL_REGION`)

### Wrong Environment Detection

- Use `VERCEL_ENV` instead of `NODE_ENV` for Vercel deployments
- `NODE_ENV` is always `production` in Vercel builds

### Production URLs in Previews

- Always use `VERCEL_PROJECT_PRODUCTION_URL` for production links
- Use `VERCEL_URL` for current deployment URLs

## References

- [Vercel Environment Variables Documentation](https://vercel.com/docs/projects/environment-variables/system-environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Skew Protection](https://vercel.com/docs/deployments/skew-protection)
