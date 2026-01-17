# Contracts - Source of Truth

**This is the ONLY source of truth for inter-service and inter-domain APIs.**

## Structure

```
contracts/
├── http/                        # REST API contracts (OpenAPI/Zod)
│   ├── identity/                # Identity service APIs
│   ├── oracle/                  # Oracle service APIs
│   ├── engine/                  # Engine service APIs
│   └── execution/               # Execution service APIs
├── rpc/                         # gRPC contracts (Protobuf) - optional
│   └── engine/                  # Engine RPC definitions
└── events/                      # Event schemas (Kafka/NATS/SQS)
    ├── game-updated.ts
    ├── prediction-created.ts
    └── trade-executed.ts
```

## Format

### HTTP Contracts (Recommended for TS-first)

Use **Zod schemas** for TypeScript contracts:

```typescript
// contracts/http/oracle/v1/games.ts
import { z } from 'zod';

export const GetGamesRequestSchema = z.object({
  season: z.number().int().min(2000).max(2100),
  week: z.number().int().min(1).max(18).optional(),
});

export const GameResponseSchema = z.object({
  id: z.string(),
  season: z.number(),
  week: z.number(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  status: z.enum(['scheduled', 'live', 'finished']),
});

// Export types
export type GetGamesRequest = z.infer<typeof GetGamesRequestSchema>;
export type GameResponse = z.infer<typeof GameResponseSchema>;
```

Then generate OpenAPI from Zod schemas for external consumers.

### RPC Contracts (Optional - for high-performance services)

Use **Protobuf** for gRPC:

```protobuf
// contracts/rpc/engine/v1/predictions.proto
syntax = "proto3";

service PredictionEngine {
  rpc PredictGame(GameRequest) returns (PredictionResponse);
}
```

### Event Contracts

Use **Zod schemas** for event validation:

```typescript
// contracts/events/game-updated.ts
import { z } from 'zod';

export const GameUpdatedEventSchema = z.object({
  gameId: z.string(),
  status: z.enum(['scheduled', 'live', 'finished']),
  homeScore: z.number().optional(),
  awayScore: z.number().optional(),
  timestamp: z.string().datetime(),
});

export type GameUpdatedEvent = z.infer<typeof GameUpdatedEventSchema>;
```

## SDK Generation

Contracts here are used to generate:

- `sdks/ts/` - TypeScript client (auto-generated from Zod/OpenAPI)
- `sdks/rust/` - Rust client (auto-generated from Protobuf/OpenAPI)
- `sdks/python/` - Python client (auto-generated from OpenAPI/Protobuf)

**No hand-written SDKs. All SDKs are generated from contracts.**

## Versioning

When making breaking changes:

```
contracts/http/oracle/v1/games.ts  (old)
contracts/http/oracle/v2/games.ts  (new)
```

Both versions can coexist during migration. SDK generation includes versioned clients.

## Rules

1. **Contracts are immutable** - Version contracts when breaking changes
2. **Contracts are language-agnostic** - Can generate any client
3. **Contracts are validated** - Runtime validation via Zod (HTTP/Events) or Protobuf (RPC)
4. **No business logic in contracts** - Only schemas/types
5. **All inter-service communication via contracts** - No direct service imports