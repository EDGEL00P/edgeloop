# Service Template

This is a template for creating new domain services in the Platform + Domain architecture.

## Structure

```
service-name/
├── src/
│   ├── main.ts              # Entry point
│   ├── routes.ts            # HTTP routes (if applicable)
│   ├── handlers/            # Request handlers
│   └── domain/              # Domain logic
├── tests/
├── Dockerfile
├── package.json             # or Cargo.toml
└── README.md
```

## Requirements

### Health Check Endpoint
Every service MUST have: `GET /health`

```typescript
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: "service-name",
    timestamp: new Date().toISOString() 
  });
});
```

### Logging
Use `libs/observability` for consistent logging:
- Structured logs (JSON)
- Request tracing
- Error tracking

### Configuration
Use `libs/config` for typed configuration:
- Environment variables
- Validation
- Defaults

### Service Contracts
- Define APIs in `libs/contracts/`
- Use generated SDKs for inter-service communication
- Never import other services directly

## CI/CD

Use `platform/ci/` workflows:
- Build/test
- Lint/boundary checks
- Deploy to staging/prod

## Local Development

Use `platform/local-dev/`:
- Docker Compose
- Task runners
- Dev containers
