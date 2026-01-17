# Service Template

This template scaffolds a new service with:

✅ Healthcheck endpoints (`/health`, `/ready`)  
✅ Metrics (Prometheus/OpenTelemetry)  
✅ Tracing (OpenTelemetry)  
✅ Structured logging (JSON)  
✅ Typed config loader  
✅ CI pipeline  
✅ Docker build

## Structure

```
services/your-service/
├── src/
│   ├── index.ts           # Entry point
│   ├── server.ts          # HTTP server setup
│   ├── routes.ts          # API routes
│   ├── config.ts          # Typed config
│   └── health.ts          # Healthcheck endpoints
├── Dockerfile
├── package.json
├── tsconfig.json
└── .github/workflows/ci.yml
```

## Usage

1. Copy this template to `services/your-service/`
2. Update `package.json` with service name
3. Define contracts in `contracts/http/your-service/`
4. Generate SDKs from contracts
5. Use SDKs for inter-service communication

## Contracts First

Before implementing the service:

1. Define API contracts in `contracts/http/your-service/v1/`
2. Generate TypeScript SDK: `npm run generate:sdk`
3. Implement service using contracts as reference

## Health Checks

- `GET /health` - Basic liveness check
- `GET /ready` - Readiness check (checks dependencies)

## Metrics

Metrics available at `/metrics` (Prometheus format):

- `http_requests_total` - Request count
- `http_request_duration_seconds` - Request latency
- `service_errors_total` - Error count

## Example

```typescript
// services/your-service/src/index.ts
import { createServer } from './server';
import { loadConfig } from './config';

const config = loadConfig();
const server = createServer(config);

server.listen(config.port, () => {
  console.log(`Service listening on port ${config.port}`);
});
```