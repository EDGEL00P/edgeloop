# EdgeLoop

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

Run tests with Vitest:

```bash
pnpm test              # Run tests once
pnpm test:watch        # Watch mode
pnpm test:ui           # Interactive UI
```

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
- **Testing**: Vitest for unit and integration tests
- **CI**: GitHub Actions runs typecheck, lint, format, and tests

Run quality checks:

```bash
pnpm run typecheck     # TypeScript compilation check
pnpm run lint          # ESLint
pnpm run format:check  # Prettier validation
pnpm test              # Test suite
```

## Design Principles

- **Dependency-light**: Minimal external dependencies, zero-dependency runtime
- **Security-first**: Hardened headers, input validation, fail-safe defaults
- **Observable**: Structured JSON logging, request tracing, error envelopes
- **Fail-fast**: Invalid config, malformed requests, and errors are caught early
