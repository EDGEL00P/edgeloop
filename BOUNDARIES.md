# Architectural Boundaries

**Hard rules that prevent chaos as the codebase scales.**

## Service Rules

### 1. Services Never Import Each Other's Code

```typescript
// ❌ BAD - Direct service import
import { identityService } from '../services/identity';

// ✅ GOOD - Use generated SDK
import { identityClient } from '@edgeloop/sdk-ts';
```

**Services only communicate via `sdks/*` generated from `contracts/*`.**

### 2. Domain Logic Lives in Services, Not in libs/

```typescript
// ❌ BAD - Domain logic in libs/
libs/trading/betting-logic.ts

// ✅ GOOD - Domain logic in services/
services/execution/betting.ts
```

**`libs/` contains only infrastructure utilities** (logging, config, http clients, retries).

### 3. Apps Use SDKs, Not Direct Service Imports

```typescript
// ❌ BAD - App importing service directly
import { oracleService } from '../../services/oracle';

// ✅ GOOD - App using SDK
import { oracleClient } from '@edgeloop/sdk-ts';
```

### 4. Contracts Are the Only Shared Language

- All inter-service APIs defined in `contracts/http/` or `contracts/rpc/`
- Event schemas in `contracts/events/`
- No ad-hoc shared types or interfaces

## Enforcement

### ESLint Rules

Path-based `no-restricted-imports` blocks forbidden imports:

```javascript
// .eslintrc.boundaries.js
rules: {
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          group: ['../services/*'],
          message: 'Services cannot import other services. Use SDKs instead.',
        },
        {
          group: ['../../services/*'],
          message: 'Apps cannot import services. Use SDKs instead.',
        },
      ],
    },
  ],
}
```

### CI Validation

- Type checks validate no forbidden imports
- Contract validation ensures SDKs are up to date
- Boundary violations fail the build

### CODEOWNERS

Each service has owners:

```
/services/identity/ @team-auth
/services/oracle/ @team-data
/services/execution/ @team-trading
/contracts/ @team-platform
```

## Examples

### ✅ Allowed

```typescript
// Service using its own code
import { authHelper } from './helpers';

// Service using libs (infrastructure)
import { logger } from '@edgeloop/libs-observability';
import { httpClient } from '@edgeloop/libs-runtime';

// Service using SDK (generated from contracts)
import { oracleClient } from '@edgeloop/sdk-ts';

// App using SDK
import { identityClient } from '@edgeloop/sdk-ts';
```

### ❌ Forbidden

```typescript
// Service importing another service
import { oracleService } from '../services/oracle';

// Service importing app code
import { componentUtil } from '../../apps/web/utils';

// App importing service directly
import { executionService } from '../../services/execution';

// Domain logic in libs
// libs/trading/calculator.ts - NO!
```

## One Sentence Rule

**"Services never import services. Apps never import services. Everything uses contracts and generated SDKs."**