# Configuration Files Reference

This directory contains **documentation and reference** for configuration files. 

**⚠️ IMPORTANT: Most configuration files must remain at the repository root** for tools to automatically detect them. This directory serves as a reference guide.

## Files That MUST Stay at Root

These files **cannot** be moved - tools require them at root:

### Build & Package Managers
- `package.json` - npm/Node.js requires at root
- `package-lock.json` - npm lockfile (must be next to package.json)
- `Cargo.toml` - Rust workspace root
- `pyproject.toml` - Python project root
- `uv.lock` - Python uv lockfile
- `tsconfig.json` - TypeScript/Next.js expects at root
- `next.config.mjs` - Next.js requires at root
- `tailwind.config.ts` - Tailwind expects at root
- `postcss.config.*` - PostCSS expects at root
- `drizzle.config.ts` - Drizzle ORM expects at root
- `trigger.config.ts` - Trigger.dev expects at root

### Deployment & Infrastructure
- `Dockerfile` - Docker expects at root (unless specified)
- `docker-compose.yml` - Docker Compose expects at root
- `vercel.json` - Vercel expects at root
- `fly.toml` - Fly.io expects at root
- `railway.json` - Railway expects at root
- `render.yaml` - Render expects at root

### Linting & Formatting
- `.eslintrc.json` - ESLint can use --config but expects root by default
- `.eslintrc.boundaries.js` - Custom ESLint config (referenced from root)
- `.prettierrc.json` - Prettier expects at root
- `.prettierignore` - Prettier expects at root

### Git & Version Control
- `.gitignore` - Git requires at root
- `.gitattributes` - Git requires at root

### Environment & Dependencies
- `.nvmrc` - nvm expects at root
- `.env.example` - Convention is root
- `.npmrc` - npm expects at root
- `.dockerignore` - Docker expects at root

### Documentation
- `README.md` - GitHub/GitLab displays root README
- `LICENSE` - License scanners expect at root
- `CHANGELOG.md` - Convention is root
- `CONTRIBUTING.md` - GitHub displays from root

### Other
- `BOUNDARIES.md` - Architecture docs (could move but root is conventional)
- `Justfile` - Just command runner expects at root
- `proxy.ts` - Application-specific (location depends on usage)

## Organization Strategy

Instead of moving files, we use:

1. **Root-level organization** - Files stay where tools expect them
2. **Documentation** - This directory explains file purposes
3. **Grouping via comments** - Use file headers to group related configs
4. **Platform folder** - Templates and reusable configs go in `platform/`

## Related Directories

- `platform/` - Reusable templates and CI configs
- `infra/` - Infrastructure-as-code (Terraform, k8s)
- `.config/` - This reference directory only

## Future Improvements

Consider creating a `monorepo-tools.json` or similar that documents all tooling and their expected file locations, if this becomes unwieldy.