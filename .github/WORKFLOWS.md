# GitHub Actions Workflows

This repository uses advanced GitHub Actions for comprehensive CI/CD automation.

## 🔄 Workflows

### 1. Enhanced CI/CD (`ci-enhanced.yml`)

**Triggers:** Push to `main`/`develop`, Pull Requests, Manual

**Jobs:**
- 🔐 **CodeQL Security Scan** - Static analysis for vulnerabilities
- 🏗️ **Build & Test** - Comprehensive build with advanced caching
- 🧹 **Super Lint** - Multi-language linting (TypeScript, JSON, YAML, Markdown, Docker)
- 🐳 **Docker Build** - Multi-platform images (amd64/arm64) with layer caching
- 🗄️ **Database Migrations** - PostgreSQL schema validation

**Features:**
- Parallel job execution for speed
- Artifact caching (`actions/cache@v4`)
- Build artifact uploads
- Database integration testing

### 2. Release Automation (`release.yml`)

**Triggers:** Git tags matching `v*`

**Jobs:**
- 📦 Package build artifacts
- 📝 Auto-generate changelog
- 🚀 Create GitHub Release
- 🐳 Build & push Docker images to GHCR

**Usage:**
```bash
git tag v1.0.0
git push origin v1.0.0
```

### 3. Dependency Updates (`update-deps.yml`)

**Triggers:** Weekly (Mondays 9 AM UTC), Manual

**Features:**
- Auto-updates all pnpm dependencies
- Creates PR with changes
- Runs tests before PR creation
- Auto-labels as `dependencies`

### 4. Vercel Deployment (`deploy-vercel.yml`)

**Triggers:** Push to `main`, Pull Requests

**Features:**
- Production deploys on `main`
- Preview deploys for PRs
- Auto-comments deployment URL on PRs
- Uses Vercel CLI for optimal performance

## 🔑 Required Secrets

Add these in **Settings → Secrets and variables → Actions**:

### Vercel
- `VERCEL_TOKEN` - From [Vercel Settings](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` - Run `vercel whoami` locally
- `VERCEL_PROJECT_ID` - From `.vercel/project.json`

### GitHub (Auto-configured)
- `GITHUB_TOKEN` - Automatically provided

## 🎯 Quick Actions

### Run CI Manually
```bash
gh workflow run ci-enhanced.yml
```

### Create a Release
```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### Update Dependencies Now
```bash
gh workflow run update-deps.yml
```

### Deploy to Vercel
```bash
gh workflow run deploy-vercel.yml
```

## 📊 Monitoring

- **Security:** CodeQL findings in Security tab
- **Releases:** Check Releases page
- **Docker:** GHCR packages at `ghcr.io/EDGEL00P/edgeloop`
- **Deployments:** Vercel dashboard

## 🔧 Advanced Features Used

- ✅ `actions/cache@v4` - Build caching
- ✅ `github/codeql-action` - Security scanning
- ✅ `github/super-linter` - Multi-language linting
- ✅ `docker/build-push-action` - Advanced Docker builds
- ✅ `softprops/action-gh-release` - Release automation
- ✅ `peter-evans/create-pull-request` - Automated PRs
- ✅ `actions/github-script` - Custom automation

## 📝 Best Practices

1. **Always test locally** before pushing
2. **Review auto-created PRs** from dependency updates
3. **Check CodeQL findings** in Security tab
4. **Monitor workflow run times** - optimize slow jobs
5. **Use concurrency controls** to cancel redundant runs

---

**Need help?** Check [GitHub Actions Documentation](https://docs.github.com/en/actions)
