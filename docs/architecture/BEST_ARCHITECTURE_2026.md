# Highest-Ceiling Architecture (2026)

## Philosophy

**"Contracts are the source of truth. Generated SDKs everywhere. Service boundaries enforced by tooling. A Platform Golden Path."**

This is what you pick when you want to support many teams, many deployables, and constant change without chaos.

## The Non-Negotiables

1. **Contracts are the source of truth** (OpenAPI or Protobuf)
2. **Generated SDKs everywhere** (TS/Rust/Python)
3. **Service boundaries enforced by tooling** (no direct imports across services)
4. **A Platform "Golden Path"** (templates, CI, observability, deployment patterns)

## Repository Structure

```
edgeloop/
  apps/                          # user-facing entrypoints
    web/                         # Next.js
    admin/                       # optional

  services/                      # deployables (service-per-domain)
    identity/                    # authz/authn/session/keys
    oracle/                      # data ingestion + normalization
    engine/                      # inference/prediction (Rust if needed)
    execution/                   # trade execution + risk checks
    notifications/               # alerts, webhooks, email
    audit/                       # compliance/event retention

  contracts/                     # SOURCE OF TRUTH (versioned)
    http/                        # OpenAPI specs OR
    rpc/                         # protobuf definitions
    events/                      # event schemas

  sdks/                          # generated from contracts (no hand-written drift)
    ts/
    rust/
    python/

  libs/                          # shared infra libs ONLY (no domain logic)
    observability/               # logging/tracing/metrics wrappers
    config/                      # typed config + secrets integration
    runtime/                     # http client, retries, idempotency helpers
    ui/                          # design system (if needed)
    utils/                       # tiny safe helpers

  platform/                      # the "golden path"
    templates/                   # new service scaffold (health, logs, CI)
    ci/                          # reusable workflows (build/test/release)
    deploy/                      # helm charts / kustomize / terraform modules
    local-dev/                   # docker compose, devcontainer, seed data

  infra/                         # environments + IaC
    env/
      dev/
      staging/
      prod/
    terraform/ | pulumi/
    k8s/                         # manifests or overlays

  docs/
    adr/
    runbooks/
    architecture/
```

## Service Rules (Hard Guardrails)

### 1. Services Never Import Each Other's Code

```typescript
// ❌ BAD
import { identityService } from '../services/identity';

// ✅ GOOD
import { identityClient } from '@edgeloop/sdk-ts';
```

**Services only talk via `sdks/*` generated from `contracts/*`.**

### 2. Domain Logic Lives in Services, Not in libs/

```typescript
// ❌ BAD - domain logic in libs/
libs/trading/betting-logic.ts

// ✅ GOOD - domain logic in services/
services/execution/betting.ts
```

**`libs/` is only "paved road" infrastructure** (logging, config, retries, http clients).

### 3. Contracts Are Immutable & Versioned

```typescript
// Versioning approach
contracts/http/identity/v1/openapi.yaml
contracts/http/identity/v2/openapi.yaml
```

**Breaking changes = new version. Both can coexist during migration.**

## Operational Rules (What Gives It the Ceiling)

### Event-Driven Integration

- Cross-domain workflows use events (Kafka/NATS/SQS, etc.)
- Event schemas defined in `contracts/events/`
- Idempotency + outbox pattern for reliability

### Distributed Tracing Everywhere

- OpenTelemetry integration in `libs/observability/`
- All services emit traces
- Cross-service request tracking

### Versioned Contracts + Compatibility Checks

- CI validates contract compatibility
- Breaking changes require explicit version bumps
- SDK generation ensures no drift

## Platform Golden Path

Every service scaffolded from `platform/templates/service` includes:

✅ **Healthcheck endpoint** (`/health`, `/ready`)  
✅ **Metrics** (Prometheus or OpenTelemetry)  
✅ **Tracing** (OpenTelemetry)  
✅ **Logging** (structured, JSON)  
✅ **Config loader** (typed, validated)  
✅ **CI pipeline** (build/test/release)  
✅ **Docker build** (multi-stage, optimized)

## Enforcement

- **ESLint**: Path-based `no-restricted-imports` (services can't import services)
- **CI**: Type checks, contract validation, SDK generation
- **CODEOWNERS**: Per service, per contract

## Migration Path

### Phase 1: Structure ✅
- [x] Create `services/`, `contracts/`, `sdks/`, `platform/`
- [x] Create `infra/env/` structure

### Phase 2: Services (Current)
- [x] Extract `identity/` from `server/auth/` ✅
- [ ] Extract `oracle/` from `server/services/dataRouter.ts`
- [ ] Extract `execution/` from `server/betting/`
- [ ] Extract `engine/` (consolidate Rust services)
- [ ] Extract `notifications/` (if exists)
- [ ] Extract `audit/` (if needed)

### Phase 3: Contracts
- [ ] Pick contract system (OpenAPI recommended for TS-first)
- [ ] Define contracts in `contracts/http/` or `contracts/rpc/`
- [ ] Set up SDK generation pipeline

### Phase 4: SDKs
- [ ] Generate TypeScript SDK from contracts
- [ ] Update services to use SDKs
- [ ] Generate Rust/Python SDKs (if needed)

### Phase 5: Platform
- [ ] Create service template in `platform/templates/service`
- [ ] Create reusable CI workflows in `platform/ci/`
- [ ] Enforce boundaries in CI + ESLint

## One Sentence Rule

**"Contracts are the source of truth. Generated SDKs everywhere. Service boundaries enforced by tooling. A Platform Golden Path."**