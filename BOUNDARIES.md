# Architectural Boundaries

## The Rule

**"One product stack, one engine boundary, contracts are the only shared language."**

## Boundary Rules

### 1. Domains Cannot Import Domains
**Rule**: `domains/*` cannot import from other `domains/*` directly.

**Why**: Prevents tight coupling between business domains.

**How**: Use `contracts/` schemas and generated SDKs from `sdks/ts/`.

```typescript
// ❌ BAD
import { authenticateUser } from '../auth/authenticate';

// ✅ GOOD
import { authClient } from '@edgeloop/sdk-ts';
const user = await authClient.authenticateUser(token);
```

### 2. Apps Use SDKs Only
**Rule**: `apps/*` can only talk to domains via SDK.

**Why**: Enforces API contracts and prevents breaking changes.

```typescript
// ❌ BAD
import { getGames } from '../../domains/data/getGames';

// ✅ GOOD
import { dataClient } from '@edgeloop/sdk-ts';
const games = await dataClient.getGames(season, week);
```

### 3. Contracts Are Source of Truth
**Rule**: All inter-domain communication must go through `contracts/`.

**Why**: Single source of truth prevents API drift.

```typescript
// ✅ Define in contracts/api/data.ts
export const GetGamesRequest = z.object({
  season: z.number(),
  week: z.number(),
});

// ✅ Generated in sdks/ts/
export const dataClient = {
  getGames: (req: GetGamesRequest) => { ... }
};
```

### 4. Engine Uses Contracts
**Rule**: Engine exposes API defined in `contracts/`.

**Why**: Engine can be swapped without changing app code.

```typescript
// Engine exposes REST API from contracts/
// Apps consume via sdks/ts/
import { engineClient } from '@edgeloop/sdk-ts';
const prediction = await engineClient.predict(gameData);
```

### 5. Python in ml/ Only
**Rule**: Python code lives in `ml/` for training/evaluation only.

**Why**: Runtime should be TypeScript/Rust for consistency.

```typescript
// ❌ BAD - Python runtime service
// python_engine/api.py (runtime)

// ✅ GOOD - Python training only
// ml/training/train_model.py
// Exports model → consumed by TS or engine
```

## Enforcement

- **ESLint**: `.eslintrc.boundaries.js` blocks forbidden imports
- **CI**: Automated checks in `platform/ci/`
- **CODEOWNERS**: Domain ownership enforcement

## Contract-First Workflow

1. Define contract in `contracts/api/`
2. Generate SDKs (`sdks/ts/`, `sdks/rust/`, `sdks/python/`)
3. Implement domain logic
4. Update apps to use SDK

This ensures API contracts are always in sync.
