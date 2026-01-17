# The Best Architecture (2026)

## Philosophy

**"One product stack, one engine boundary, contracts are the only shared language."**

## Core Principles

### 1. One Primary Product Stack
- **Next.js + TypeScript** for web + API (Route Handlers / Server Actions)
- One deployable for "product" unless you must split
- Fastest iteration, single stack for team

### 2. One "Engine" Boundary (Only If Needed)
- If you need Rust/Python, make it **ONE service**: `engine/`
- Everything talks to it through a versioned contract (OpenAPI or Protobuf)
- Avoid microservices - collapse into one engine if possible

### 3. Contract-First Shared Truth
- Single source: `contracts/`
- Generated clients: `sdks/ts`, `sdks/rust`, `sdks/python`
- **No service-to-service imports, ever**

## Repository Structure

```
edgeloop/
├── apps/
│   └── web/                      # Next.js (UI + API surface)
│       ├── app/                  # Pages & API routes
│       ├── components/           # React components
│       └── server/               # Server-only code (db, auth, integrations)
│
├── domains/                      # Modular monolith domains (pure business logic)
│   ├── auth/                     # Authentication domain
│   ├── users/                    # User management domain
│   ├── data/                     # Sports/weather ingestion logic
│   ├── trading/                  # Trading/betting domain
│   └── portfolio/                # Portfolio management domain
│
├── contracts/                    # SOURCE OF TRUTH (OpenAPI/proto/zod)
│   ├── api/                      # API contracts
│   └── events/                   # Event schemas
│
├── sdks/                         # Generated clients from contracts
│   ├── ts/                       # TypeScript SDK
│   ├── rust/                     # Rust SDK
│   └── python/                   # Python SDK
│
├── engine/                       # The only non-TS runtime (optional)
│   ├── service/                  # Rust OR Python inference server
│   └── models/                   # Exported model artifacts
│
├── platform/                     # The golden path: templates + CI helpers
│   ├── templates/
│   ├── ci/
│   └── local-dev/
│
├── infra/                        # Docker/k8s/terraform
│
└── docs/
    ├── adr/                      # Architecture decision records
    └── runbooks/
```

## Why This Is "The Best"

✅ **Fastest iteration** - One stack (TS/Next.js)  
✅ **Scales teams** - Domain modules + boundaries  
✅ **Scales systems** - Engine can become independent without rewriting  
✅ **Prevents spaghetti** - Contracts + generated SDKs  
✅ **No polyglot pain** - Python only for training, Rust only for engine (if needed)

## Migration Plan

### Phase 1: Restructure ✅
- [x] Create `domains/`, `contracts/`, `sdks/`, `engine/`
- [x] Keep `apps/web/` for Next.js
- [x] Move Python training to `ml/`

### Phase 2: Extract Domains
1. **auth/** → From `server/auth/`
2. **data/** → From `server/services/dataRouter.ts`, `server/crossref/`
3. **trading/** → From `server/betting/`, `server/services/autoPicksService.ts`
4. **users/** → User management logic

### Phase 3: Contracts
1. Define API schemas in `contracts/api/`
2. Define events in `contracts/events/`
3. Use Zod for TypeScript, generate OpenAPI

### Phase 4: Collapse Engine
- Collapse: `engine-core`, `oracle`, `executioner`, `sentinel` → `engine/service/`
- Or keep as modules within monolith (preferred)
- Use contracts to communicate with engine

### Phase 5: SDK Generation
- Generate TypeScript SDK from contracts
- Generate Rust/Python SDKs (if engine is separate)
- Update all code to use SDKs

## Boundary Rules

### Hard Rules

1. **Domains cannot import from other domains directly**
   ```typescript
   // ❌ BAD
   import { authLogic } from '../auth/';

   // ✅ GOOD
   import { authClient } from '@edgeloop/sdk-ts';
   ```

2. **Apps use SDKs only**
   ```typescript
   // ❌ BAD
   import { tradingService } from '../../domains/trading/';

   // ✅ GOOD
   import { tradingClient } from '@edgeloop/sdk-ts';
   ```

3. **Engine uses contracts**
   - Engine exposes REST/gRPC API defined in `contracts/`
   - Apps/domains communicate via generated SDK

4. **Python in ml/ only**
   - Training/evaluation only
   - Export models → consumed by TS or engine

## Enforcement

- **ESLint**: Path-based `no-restricted-imports`
- **CI**: Type checks, contract validation
- **CODEOWNERS**: Per domain

## One Sentence Rule

**"One product stack, one engine boundary, contracts are the only shared language."**
