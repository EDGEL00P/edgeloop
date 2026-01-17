# Vercel Function Template

Template for creating domain services as Vercel Functions (Next.js API routes).

## Structure

```
service-name/
├── apps/web/app/api/service-name/
│   ├── route.ts            # API route handler
│   └── types.ts            # Request/response types
├── libs/contracts/service-name/
│   └── schema.ts           # Zod schema
└── libs/sdk-ts/
    └── service-name.ts     # Generated client
```

## Example: Identity Service

```typescript
// apps/web/app/api/identity/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authSchema } from '@edgeloop/contracts/identity';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const validated = authSchema.parse(body);
  
  // Service logic here
  return NextResponse.json({ success: true });
}
```

## Benefits

- **Deploys automatically** with `apps/web`
- **Serverless scaling** via Vercel Functions
- **Type-safe** via contracts/SDKs
- **Boundary-enforced** (no direct imports)

## When to Use

✅ Use Vercel Functions for:
- Lightweight services (< 30s execution)
- Services that benefit from Edge deployment
- Services tightly coupled to web app

❌ Use separate deployments for:
- Heavy compute services
- Rust/Python services
- Services needing custom runtimes
