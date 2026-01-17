# Configuration Files Reference

**All configuration files remain at repository root** - this directory is for **reference documentation only**.

## Why Files Must Stay at Root

Most tools (npm, Next.js, Docker, Vercel, etc.) automatically look for config files at the repository root. Moving them would break:
- Build processes
- CI/CD pipelines  
- Developer tooling (IDE auto-detection)
- Deployment platforms

## Files at Root (Organized by Purpose)

### 🔧 Build & Package Management
- `package.json` - npm/Node.js package definition
- `package-lock.json` - npm dependency lock
- `Cargo.toml` - Rust workspace
- `pyproject.toml` - Python project
- `uv.lock` - Python uv lockfile

### ⚙️ Framework & Tooling
- `next.config.mjs` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS
- `postcss.config.js` / `postcss.config.mjs` - PostCSS
- `drizzle.config.ts` - Drizzle ORM
- `trigger.config.ts` - Trigger.dev
- `Justfile` - Just command runner

### 🚀 Deployment
- `vercel.json` - Vercel deployment
- `fly.toml` - Fly.io deployment
- `railway.json` - Railway deployment
- `render.yaml` - Render deployment
- `Dockerfile` - Docker image
- `docker-compose.yml` - Docker Compose

### 🧹 Linting & Formatting
- `.eslintrc.json` - ESLint config
- `.eslintrc.boundaries.js` - Custom ESLint rules
- `.prettierrc.json` - Prettier config
- `.prettierignore` - Prettier ignore

### 🔐 Git & Environment
- `.gitignore` - Git ignore patterns
- `.gitattributes` - Git attributes
- `.env.example` - Environment template
- `.npmrc` - npm configuration
- `.nvmrc` - Node.js version

### 📚 Documentation (Could Move)
- `README.md` - Main project README (GitHub displays from root)
- `LICENSE` - License file
- `CHANGELOG.md` - Change log
- `CONTRIBUTING.md` - Contributing guide
- `BOUNDARIES.md` - Architecture boundaries

### 🛠️ Other
- `.dockerignore` - Docker ignore patterns
- `proxy.ts` - Proxy configuration

## Alternative: Document Organization

If you want cleaner organization, consider moving **only documentation files** to `docs/`:

```
docs/
├── BOUNDARIES.md          # Moved from root
├── CHANGELOG.md           # Moved from root  
└── CONTRIBUTING.md        # Moved from root
```

**Note:** `README.md` and `LICENSE` should stay at root for GitHub/GitLab display.

## Related Directories

- `platform/` - Reusable templates and CI configs
- `infra/` - Infrastructure-as-code
- `.config-reference/` - This documentation directory