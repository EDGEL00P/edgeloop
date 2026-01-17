# TypeScript SDK

**Auto-generated from contracts. Do not edit manually.**

## Generation

SDKs are generated from contracts:

```bash
npm run generate:sdk:ts
```

This command:
1. Reads Zod schemas from `contracts/http/`
2. Generates TypeScript clients in `sdks/ts/`
3. Includes request/response types and validation

## Usage

```typescript
import { identityClient, oracleClient } from '@edgeloop/sdk-ts';

// Use generated clients for inter-service communication
const user = await identityClient.getUser({ userId: '123' });
const games = await oracleClient.getGames({ season: 2024, week: 1 });
```

## Rules

- **Never edit files in `sdks/ts/` manually**
- All changes must come from contracts
- Regenerate SDKs when contracts change