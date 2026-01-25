# EdgeLoop

[![CI](https://github.com/EDGEL00P/edgeloop/actions/workflows/ci.yml/badge.svg)](https://github.com/EDGEL00P/edgeloop/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/EDGEL00P/edgeloop/branch/main/graph/badge.svg)](https://codecov.io/gh/EDGEL00P/edgeloop)

**AI-Powered Sports Analytics Platform** - Real-time predictions with broadcast-quality insights.

## 2026 Tech Stack

EdgeLoop is built on a modern, maintainable, and scalable architecture:

### Frontend
- **Next.js 15+** with App Router & React Server Components
- **React 19** with latest concurrent features
- **TypeScript** (strict mode)
- **Tailwind CSS** with ESPN-grade design tokens
- **Radix UI** primitives for accessible components
- **Recharts** for visualization
- **TanStack Query** for data fetching
- **tRPC** for end-to-end type safety

### Backend
- **Next.js Edge Functions** for low-latency APIs
- **tRPC** for typed API contracts
- **Drizzle ORM** for database operations
- **Upstash Redis** for edge caching

### Data Layer
- **PostgreSQL** via Supabase/Neon (serverless)
- **Upstash Redis** for real-time caching
- **Drizzle ORM** for type-safe queries

### AI/ML
- **OpenAI / Anthropic / Gemini** for explanation synthesis
- **Custom ML models** for predictions
- **Real-time inference** with sub-50ms latency

### Deployment
- **Vercel** for frontend & edge functions
- **Turborepo** for build orchestration
- **GitHub Actions** for CI/CD

## Project Structure

```
edgeloop/
├── apps/
│   └── web/                    # Next.js 15 App Router frontend
│       ├── app/                # App Router pages & API routes
│       │   ├── (dashboard)/    # Dashboard route group
│       │   │   ├── games/      # Live games page
│       │   │   ├── predictions/# AI predictions page
│       │   │   └── analytics/  # Model analytics page
│       │   └── api/trpc/       # tRPC API handler
│       ├── components/         # Page-level components
│       ├── hooks/              # React hooks
│       ├── lib/                # Utilities & tRPC client
│       └── styles/             # Global CSS & Tailwind
│
├── packages/
│   ├── ui/                     # Shared UI component library
│   │   ├── primitives/         # Button, Badge, Card
│   │   ├── broadcast/          # ScoreBug, Ticker, LowerThird
│   │   ├── charts/             # WinProbability, Momentum
│   │   ├── cards/              # GameCard, PredictionCard
│   │   ├── overlays/           # AnalystOverlay
│   │   └── layouts/            # DashboardLayout
│   │
│   ├── ml/                     # ML prediction engine
│   │   ├── models/             # Prediction & explanation models
│   │   ├── providers/          # AI provider clients (OpenAI, Anthropic)
│   │   └── utils/              # Drift detection, calibration
│   │
│   ├── api/                    # Fastify API server
│   ├── core/                   # Business logic services
│   ├── db/                     # Drizzle ORM schema & migrations
│   ├── integrations/           # External API integrations
│   ├── jobs/                   # Background workers
│   ├── shared/                 # Shared types & utilities
│   └── ws/                     # WebSocket server
│
└── turbo.json                  # Turborepo configuration
```

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/EDGEL00P/edgeloop.git
cd edgeloop

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
pnpm dev:web
```

### Development Commands

```bash
# Start all services
pnpm dev

# Start web only
pnpm dev:web

# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint & format
pnpm lint
pnpm format
```

## UI Component Library

EdgeLoop includes a comprehensive ESPN-grade UI library at `packages/ui`:

### Broadcast Components
- **ScoreBug** - Live game score display
- **Ticker** - Real-time news/score ticker
- **LowerThird** - Broadcast-style overlays

### Charts
- **WinProbabilityChart** - Dynamic probability visualization
- **MomentumChart** - Game momentum tracking
- **ConfidenceGauge** - Prediction confidence display

### Cards
- **GameCard** - Game summary with predictions
- **PredictionCard** - Detailed prediction breakdown
- **StatCard** - Key metric display

### Overlays
- **AnalystOverlay** - Full AI analysis panel

## AI/ML Integration

EdgeLoop uses multi-provider AI for explanation synthesis:

```typescript
import { createExplanationGenerator } from '@edgeloop/ml'

// Local explanation (no API required)
const generator = createExplanationGenerator('local')

// OpenAI-powered explanation
const openaiGenerator = createExplanationGenerator('openai')

// Anthropic Claude-powered explanation
const claudeGenerator = createExplanationGenerator('anthropic')
```

## Environment Variables

See [.env.example](.env.example) for all configuration options:

- **Database**: PostgreSQL connection string
- **Cache**: Upstash Redis credentials
- **AI**: OpenAI, Anthropic, Gemini API keys
- **Sports Data**: The Odds API key
- **Observability**: Sentry, OpenTelemetry

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy preview
vercel

# Deploy production
vercel --prod
```

### Environment Setup

Required secrets for CI/CD:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `DATABASE_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Architecture Principles

| Principle | Why It Matters |
|-----------|----------------|
| **API-First** | Contracts govern logic, not guessing |
| **Server Components** | Performance & SEO |
| **Edge + Serverless** | Global scale with low ops |
| **Observable by Default** | Bugs caught early |
| **Type Safety Everywhere** | Compile-time correctness |

## Contributing

1. Fork the repository
2. Create a feature branch (`feature/amazing-feature`)
3. Run quality checks (`pnpm lint && pnpm test`)
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with the 2026 tech stack - practical, scalable, and what teams actually ship.
