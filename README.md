
# EdgeLoop

[![CI](https://github.com/EDGEL00P/edgeloop/actions/workflows/ci.yml/badge.svg)](https://github.com/EDGEL00P/edgeloop/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/EDGEL00P/edgeloop/branch/main/graph/badge.svg)](https://codecov.io/gh/EDGEL00P/edgeloop)

Production-grade NFL prediction platform built as a TypeScript monorepo with serverless API deployment.

## Architecture

EdgeLoop is a serverless API platform that provides real-time NFL game predictions, model status monitoring, and alert notifications. The system is designed for production deployment on Vercel with strict security hardening.

## Workspace Layout

```
edgeloop/
├── packages/
│   ├── shared/        # Shared types and utilities
│   └── server/        # Server utilities and Vercel helpers
├── api/               # Vercel serverless functions
│   ├── healthz.ts     # Health check endpoint
│   ├── readyz.ts      # Readiness check endpoint
│   ├── predictions.ts # NFL game predictions
│   ├── model-status.ts# Model drift monitoring
│   └── alerts.ts      # Alert notifications
└── vitest.config.ts   # Test configuration
```

## API Endpoints

- `GET /healthz` — Liveness check with server start time
- `GET /readyz` — Readiness check for dependencies
- `GET /api/predictions` — NFL game predictions with win probabilities and betting odds
- `GET /api/model-status` — Model version and drift metrics
- `GET /api/alerts` — Active alerts (drift-based, etc.)

All endpoints return JSON with:

- Security headers (CSP, CORS, frame protection)
- Request correlation ID via `x-request-id`
- Structured error envelopes

## Local Development

Install dependencies and build:

```bash
pnpm install
pnpm run build
```

Run the standalone Node.js server (serves all API routes):

```bash
node packages/server/dist/cli.js
# Server starts on http://localhost:3000
```

### Environment Variables

- `PORT` (default: `3000`) — Server port (fail-fast if invalid)
- `HOST` (default: `0.0.0.0`) — Server bind address
- `SHUTDOWN_GRACE_MS` (default: `5000`) — Graceful shutdown timeout (0-60000ms)

> See [.env.example](.env.example) for all required environment variables.

## CI/CD Secrets & Environment Variables

The following secrets must be configured in your GitHub repository settings for CI/CD and deployment:

- `VERCEL_TOKEN`: Vercel personal access token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID
- `RAILWAY_TOKEN`: Railway account token
- `CODECOV_TOKEN`: Codecov upload token

**Do not commit secrets to the repository.**  
All environment variables required for local development and CI/CD are listed in [.env.example](.env.example).

## Branch Protection & Code Review
To maintain code quality and ensure safe releases, the following branch protection rules are recommended for the `main` branch:

- **Require pull requests before merging:** All changes to `main` must be made via pull request.
- **Require status checks to pass before merging:** All CI jobs (build, lint, test, coverage, deploy) must succeed before merging.
- **Require at least one code review:** At least one approving review is required before merging.
- **Prohibit direct pushes:** Direct pushes to `main` are not allowed.
- **Require up-to-date branches:** Pull requests must be up-to-date with `main` before merging.

> These rules can be configured in your repository's GitHub settings under "Branches" → "Branch protection rules".

## CI/CD Workflow Overview

EdgeLoop uses a fully automated CI/CD pipeline powered by GitHub Actions:

- **Triggers:** On push or pull request to `main` or `develop` branches.
- **Jobs:**
  - **build-and-test:** Installs dependencies, lints, formats, builds all packages, runs tests with coverage, uploads coverage to Codecov, and caches build artifacts.
  - **deploy-vercel:** Deploys to Vercel (production) on push to `main` after successful build and test.
  - **deploy-railway:** Deploys to Railway on push to `main` after successful build and test.
- **Secrets:** All deployment and coverage tokens are securely managed via GitHub Actions secrets.
- **Status Checks:** All jobs must pass before merging to `main`.

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml) for the full workflow definition.

## Developer Guidelines

To contribute to EdgeLoop, please follow these guidelines:

1. **Fork and clone the repository.**
2. **Install dependencies:**  
   ```bash
   pnpm install
   ```
3. **Create a feature branch:**  
   Use descriptive names, e.g. `feature/add-alerts-endpoint`.
4. **Set up environment variables:**  
   Copy `.env.example` to `.env` and fill in required values.
5. **Run quality checks locally:**  
   ```bash
   pnpm run lint
   pnpm run format:check
   pnpm run typecheck
   pnpm test
   ```
6. **Keep PRs focused:**  
   Submit small, focused pull requests with clear descriptions.
7. **Write and update tests:**  
   Ensure new features and bugfixes are covered by tests.
8. **Follow code style:**  
   Use Prettier and ESLint to maintain consistent formatting.
9. **Check CI/CD status:**  
   All status checks must pass before merging.
10. **Request review:**  
    At least one approving review is required before merging.

> For more details, see [CONTRIBUTING.md](CONTRIBUTING.md).
### Running Tests

Run tests with Vitest:

```bash
pnpm test              # Run all tests once
pnpm test:watch        # Watch mode for development
pnpm test:coverage     # Generate coverage report
pnpm test:ui           # Interactive UI
```

### Test Coverage

- **36 tests** across 6 test suites
- Coverage requirements: 70% lines/functions, 65% branches
- Automated testing in CI/CD pipeline

### Test Structure

```
api/
├── healthz.test.ts       # Health check endpoint tests (8 tests)
├── readyz.test.ts        # Readiness check tests (4 tests)
├── predictions.test.ts   # NFL predictions tests (10 tests)
├── model-status.test.ts  # Model monitoring tests (7 tests)
└── alerts.test.ts        # Alerts endpoint tests (6 tests)
```

### Testing Strategy

- **Unit Tests**: Core utility functions and business logic
- **Integration Tests**: API handlers with mocked HTTP requests/responses
- **Edge Cases**: Error handling, invalid inputs, method validation
- **Security**: Header validation, request ID tracking, error envelopes

For more details, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Deployment

### Vercel

The project is configured for Vercel's serverless platform:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

Vercel configuration (`vercel.json`):

- Builds TypeScript to JavaScript during deployment
- Routes API endpoints to serverless functions
- Applies security headers globally

## Code Quality

- **TypeScript**: Strict mode with composite project references
- **Linting**: ESLint with TypeScript plugin
- **Formatting**: Prettier with consistent style
- **Testing**: Vitest for unit and integration tests (36 tests, 70%+ coverage)
- **Commit Messages**: Conventional Commits with automatic verification
- **CI/CD**: GitHub Actions with automated quality checks
- **Pre-commit Hooks**: Automatic validation before each commit

Run quality checks:

```bash
pnpm run typecheck     # TypeScript compilation check
pnpm run lint          # ESLint
pnpm run format:check  # Prettier validation
pnpm test              # Test suite with coverage
```

Auto-fix issues:

```bash
pnpm run lint:fix      # Auto-fix linting issues
pnpm run format        # Auto-format code
```

## AI Development Tools (MCP Servers)

EdgeLoop includes a comprehensive configuration of **10 free-tier MCP (Model Context Protocol) servers** that enhance AI assistant capabilities when working with this project. All servers are 100% free with no paid APIs required!

**Quick Start**: See [`.claude/QUICKSTART.md`](.claude/QUICKSTART.md) for 2-minute setup.

### Available Free Servers

- 🐙 **GitHub** - Manage issues, PRs, and Actions (free token required)
- 📁 **Filesystem** - Read/write files (no config needed)
- 🌿 **Git** - Advanced git operations (no config needed)
- 🧠 **Memory** - Context persistence (no config needed)
- 🎭 **Playwright** - Browser automation (no config needed)
- 🎪 **Puppeteer** - Browser testing (no config needed)
- 💭 **Sequential Thinking** - Step-by-step reasoning (no config needed)
- 🌐 **Fetch** - HTTP requests (no config needed)
- ⏰ **Time** - Time utilities (no config needed)
- 🗄️ **SQLite** - Local database (no config needed)

**Total Cost**: $0.00/month 💰

For detailed setup instructions and usage, see:
- [Quick Start Guide](.claude/QUICKSTART.md) - 2-minute setup
- [Full Documentation](.claude/README.md) - Complete server reference

## Design Principles

- **Dependency-light**: Minimal external dependencies, zero-dependency runtime
- **Security-first**: Hardened headers, input validation, fail-safe defaults
- **Observable**: Structured JSON logging, request tracing, error envelopes
- **Fail-fast**: Invalid config, malformed requests, and errors are caught early