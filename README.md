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

## Testing

EdgeLoop has comprehensive test coverage across all API endpoints and core utilities.

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

## Design Principles

- **Dependency-light**: Minimal external dependencies, zero-dependency runtime
- **Security-first**: Hardened headers, input validation, fail-safe defaults
- **Observable**: Structured JSON logging, request tracing, error envelopes
- **Fail-fast**: Invalid config, malformed requests, and errors are caught early
