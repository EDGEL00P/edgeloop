# Contracts - Source of Truth

**This is the ONLY source of truth for inter-domain and inter-service APIs.**

## Structure

```
contracts/
├── api/                        # REST API contracts
│   ├── data.ts                 # Data domain APIs
│   ├── trading.ts              # Trading domain APIs
│   ├── auth.ts                 # Auth domain APIs
│   └── engine.ts               # Engine service APIs
└── events/                     # Event schemas
    ├── game-updated.ts
    └── prediction-created.ts
```

## Format

Use **Zod schemas** for TypeScript contracts:

```typescript
// contracts/api/data.ts
import { z } from 'zod';

export const GetGamesRequest = z.object({
  season: z.number().int().min(2000).max(2100),
  week: z.number().int().min(1).max(18),
});

export const GameResponse = z.object({
  id: z.string(),
  season: z.number(),
  week: z.number(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  status: z.enum(['scheduled', 'live', 'finished']),
});

export const GetGamesResponse = z.object({
  games: z.array(GameResponse),
  total: z.number(),
});

// Export types
export type GetGamesRequest = z.infer<typeof GetGamesRequest>;
export type GameResponse = z.infer<typeof GameResponse>;
export type GetGamesResponse = z.infer<typeof GetGamesResponse>;
```

## SDK Generation

Contracts here are used to generate:
- `sdks/ts/` - TypeScript client (auto-generated)
- `sdks/rust/` - Rust client (if needed)
- `sdks/python/` - Python client (if needed)

## Rules

1. **Contracts are immutable** - Version contracts when breaking changes
2. **Contracts are language-agnostic** - Can generate any client
3. **Contracts are validated** - Runtime validation via Zod
4. **No business logic in contracts** - Only schemas/types

## Versioning

When making breaking changes:

```typescript
// contracts/api/data/v1.ts (old)
// contracts/api/data/v2.ts (new)

// Both can coexist during migration
```
