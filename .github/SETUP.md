# 🚀 Quick Setup Guide for Advanced GitHub Actions

## ✅ Workflows Installed

| Workflow | Purpose | Triggers |
|----------|---------|----------|
| `ci-enhanced.yml` | Full CI/CD pipeline | Push, PR |
| `release.yml` | Automated releases | Git tags `v*` |
| `update-deps.yml` | Weekly dependency updates | Schedule, Manual |
| `deploy-vercel.yml` | Vercel deployments | Push to main, PRs |
| `e2e-tests.yml` | Playwright E2E testing | Push, PR, Schedule |
| `ci.yml` | Basic CI (legacy) | All branches |

## 🔧 Required Setup

### 1. GitHub Secrets
Navigate to: **Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

```bash
# Vercel (Required for deploy-vercel.yml)
VERCEL_TOKEN          # Get from https://vercel.com/account/tokens
VERCEL_ORG_ID         # Run: vercel whoami
VERCEL_PROJECT_ID     # From .vercel/project.json after vercel link

# Optional: Chromatic for visual testing
CHROMATIC_PROJECT_TOKEN  # If using visual regression tests
```

### 2. Enable GitHub Actions

1. Go to **Settings → Actions → General**
2. Set **Workflow permissions** to: 
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create pull requests
3. Click **Save**

### 3. Enable GitHub Packages (GHCR)

1. Go to **Settings → Packages**
2. Link repository to packages
3. Docker images will publish to: `ghcr.io/EDGEL00P/edgeloop`

### 4. Install Playwright (for E2E tests)

```bash
pnpm add -D @playwright/test
pnpm exec playwright install
```

Create `playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
})
```

## 🎯 Quick Commands

```bash
# Trigger workflows manually
gh workflow run ci-enhanced.yml
gh workflow run update-deps.yml
gh workflow run e2e-tests.yml

# Create a release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Check workflow status
gh run list
gh run view <run-id>
```

## 📊 Workflow Features

### Security
- ✅ CodeQL static analysis
- ✅ Dependency vulnerability scanning
- ✅ Super Linter for code quality

### Performance
- ✅ Advanced caching (pnpm, Docker layers)
- ✅ Parallel job execution
- ✅ Concurrency controls

### Automation
- ✅ Auto-create dependency update PRs
- ✅ Auto-generate release notes
- ✅ Auto-comment deployment URLs on PRs

### Testing
- ✅ Multi-browser E2E tests (Chromium, Firefox, WebKit)
- ✅ Database migration validation
- ✅ Visual regression testing (optional)

### Deployment
- ✅ Vercel integration
- ✅ Docker multi-platform builds (amd64/arm64)
- ✅ GitHub Container Registry (GHCR)

## 🔍 Monitoring

- **Actions**: [github.com/EDGEL00P/edgeloop/actions](https://github.com/EDGEL00P/edgeloop/actions)
- **Security**: [github.com/EDGEL00P/edgeloop/security](https://github.com/EDGEL00P/edgeloop/security)
- **Packages**: [github.com/EDGEL00P?tab=packages](https://github.com/EDGEL00P?tab=packages)
- **Releases**: [github.com/EDGEL00P/edgeloop/releases](https://github.com/EDGEL00P/edgeloop/releases)

## 🚨 Next Steps

1. **Commit the workflows:**
   ```bash
   git add .github/workflows/
   git commit -m "feat: add advanced GitHub Actions workflows"
   git push origin main
   ```

2. **Add required secrets** (see above)

3. **Watch first workflow run** in Actions tab

4. **Test release workflow:**
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

## 💡 Pro Tips

1. **Use workflow_dispatch** for manual testing before automation
2. **Check workflow logs** for optimization opportunities
3. **Review auto-created PRs** from dependency updates
4. **Monitor cache hit rates** in workflow logs
5. **Keep workflows DRY** with reusable workflows (advanced)

## 📚 Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel CLI Docs](https://vercel.com/docs/cli)
- [Playwright Docs](https://playwright.dev)
- [Docker BuildKit Docs](https://docs.docker.com/build/buildkit/)

---

**Questions?** Check `.github/WORKFLOWS.md` for detailed documentation.
