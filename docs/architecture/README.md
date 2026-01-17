# Architecture Documentation

## Overview

Edgeloop follows the **Highest-Ceiling Architecture (2026)** pattern:

**"Contracts are the source of truth. Generated SDKs everywhere. Service boundaries enforced by tooling. A Platform Golden Path."**

## Architecture Guides

- **[Highest-Ceiling Architecture 2026](./BEST_ARCHITECTURE_2026.md)** - Complete architecture overview
- **[Vercel Strategy](./VERCEL_PLATFORM_DOMAIN_STRATEGY.md)** - Deployment strategy

## Key Principles

1. **Contracts are the source of truth** - OpenAPI or Protobuf
2. **Generated SDKs everywhere** - TS/Rust/Python clients auto-generated
3. **Service boundaries enforced by tooling** - No direct imports across services
4. **Platform Golden Path** - Templates, CI, observability, deployment patterns

## Repository Structure

```
edgeloop/
├── apps/web/              # Next.js app
├── services/              # Deployable services (identity, oracle, engine, execution, notifications, audit)
├── contracts/http/        # REST API contracts (OpenAPI/Zod)
├── contracts/rpc/         # gRPC contracts (Protobuf) - optional
├── contracts/events/      # Event schemas
├── sdks/ts/              # Generated TypeScript SDKs
├── sdks/rust/            # Generated Rust SDKs
├── sdks/python/          # Generated Python SDKs
├── libs/                 # Shared infra libs ONLY (no domain logic)
├── engine/               # Rust/Python engine service
├── ml/                   # Python training/evaluation
├── platform/             # Golden path templates + CI
└── infra/                # Environments + IaC
```

## Boundary Rules

See [BOUNDARIES.md](../../BOUNDARIES.md) for detailed rules.

**TL;DR**: Services never import services. Apps never import services. Everything uses contracts and generated SDKs.

## Service Rules

- Services communicate only via generated SDKs
- Domain logic lives in services, not in libs/
- Contracts are versioned and immutable
- Breaking changes = new contract version

## Platform Golden Path

Every service scaffolded from `platform/templates/service` includes:
- Healthcheck endpoints
- Metrics & tracing
- Structured logging
- Typed config
- CI pipeline
- Docker build