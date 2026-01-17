# 🏈 Edgeloop 2026 ESPN-Grade Architecture

## Stack Overview

### Frontend (2026 Maxed)
- **Next.js 16** (App Router) - Server Components for predictions
- **React 19** - `use()` for streaming, Transitions for updates, Optimistic UI
- **TanStack Query** - Truth (data fetching)
- **Zustand** - Emphasis (event-driven UI orchestration)
- **Radix UI** - Accessible components
- **Framer Motion** - Surgical animations (state changes only)
- **Tailwind CSS** - Design compiler with ESPN-grade tokens

### Backend
- **Rust (Axum + Tokio)** - Microsecond latency APIs
- **Python ML (UV + PyTorch/XGBoost)** - Prediction engines
- **NATS JetStream** - Event streaming → frontend
- **Neon PostgreSQL** - Historical data
- **Upstash Redis** - Prediction snapshots, caching
- **SurrealDB** - Relationship graphs

## Architecture Patterns

### Server Components (RSC)
✅ **Prediction Call** - Rendered on server
✅ **Analyst Summary** - Server-rendered breakdown
✅ **Streaming + Suspense** - Live data with loading states

### Client Components
✅ **Risk Strip** - Event-driven using Zustand
✅ **Line Movement Timeline** - React 19 `use()` for streaming
✅ **Optimistic UI** - "Make the Play" button with transitions

### Event-Driven State
**Pattern**: TanStack Query = truth (data), Zustand = emphasis (UI)

**Examples**:
- Injury event → Zustand expands Risk Strip
- Market stabilization → Zustand collapses noise
- High confidence prediction → UI quiets itself

## 3D ESPN-Style Design System

### Virtual Prediction Desk
- Dark matte desk surface
- Slight depth (Z-axis)
- Hard edges, sharp corners
- White typography projected onto planes

### Prediction Call Plane
- 5-8° perspective tilt
- Thick rectangular border
- Inner content stays flat (3D container, 2D info)

### Analyst Breakdown Panels
- Slightly raised panels
- Soft shadows (not glow)
- Sharp rectangular edges
- Feels like physical studio tiles

### Motion Rules
✅ **Allowed**: Slow slide-ins, depth easing, subtle parallax (desktop only)
❌ **Forbidden**: Spins, zooms, elastic easing, continuous motion

### Lower-Thirds Rule
Lower thirds are **NEVER 3D** - they stay flat, fast, familiar.

## Design Tokens

### Edge States
- `edge-high` - High edge (>5%)
- `edge-medium` - Medium edge (2-5%)
- `edge-low` - Low edge (<2%)

### Risk States
- `risk-high` - High-priority risk
- `risk-medium` - Moderate risk
- `risk-low` - Low-level risk

### Broadcast Spacing
- `broadcast-spacing` - 1rem standard
- `studio-spacing` - 2rem panel spacing
- `field-spacing` - 0.5rem field lines

## Component Structure

```
apps/web/app/
├── components/
│   ├── PredictionCall.tsx      # Server Component (RSC)
│   ├── AnalystSummary.tsx      # Server Component (RSC)
│   ├── RiskStrip.tsx           # Client (Zustand emphasis)
│   ├── VirtualDesk.tsx         # 3D studio container
│   ├── LineMovementTimeline.tsx # Client (React 19 use())
│   ├── OptimisticPlayButton.tsx # Client (Transitions)
│   └── Dashboard.tsx           # Composes Server + Client
└── page.tsx                    # Entry point with Suspense
```

## State Management

### Emphasis Store (`lib/stores/emphasis.ts`)
Event-driven UI orchestration:

```typescript
// Events trigger UI changes
onInjuryEvent(severity) → expands Risk Strip
onMarketStabilized() → collapses noise
onHighConfidencePrediction(confidence) → quiets UI
```

### TanStack Query
Handles all data fetching:
- Predictions
- Games
- Market data
- Historical records

## React 19 Features

### `use()` for Streaming
```typescript
const data = use(dataPromise); // Streamed prediction data
```

### Transitions
```typescript
const [isPending, startTransition] = useTransition();
// Smooth market updates
```

### Optimistic UI
```typescript
// "Make the Play" button shows immediate feedback
setOptimisticState('playing');
```

## The "Singularity" UX

This architecture enables:

✅ **Prediction appears before user scrolls** (Server Components)
✅ **UI quiets itself when confidence is high** (Event-driven)
✅ **Risk surfaces instantly on volatility** (NATS events → Zustand)
✅ **Explanations feel human, not ML** (Server-rendered)
✅ **Interface feels official** (ESPN-grade design)

## Performance Targets

| Operation | Target | Implementation |
|-----------|--------|----------------|
| Page Load | <1s | Next.js SSR + Edge Caching |
| Prediction Render | <100ms | Server Component |
| Event → UI | <50ms | NATS → Zustand |
| Animation | <300ms | Framer Motion (state change only) |

## Cursor Optimization

This architecture is optimized for Cursor AI:

✅ **Server Component shells** - Easy to generate
✅ **Radix wrappers** - Simple to extract
✅ **Tailwind token maps** - Refactorable
✅ **Client/server boundaries** - Clear separation
✅ **State orchestration** - Pattern-based

**Example Prompt**:
> "Refactor this dashboard so the Prediction Call is a Server Component and the Risk Strip is client-only, using Zustand for emphasis state."

## What This Enables

With this exact setup:

- **Events drive UI** (NATS → Zustand)
- **UI tells a story** (Server Components)
- **ML stays invisible** (Only edge, stability, explanations sent)
- **Design is disciplined** (ESPN-grade tokens)

This is **NFL intelligence software, not a betting app**.
