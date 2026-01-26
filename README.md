# EdgeLoop - NFL Predictions & Betting Exploits Platform

EdgeLoop is an NFL predictions platform that surfaces model-driven forecasts and betting "exploits" (edges) such as mispriced lines, arbitrage opportunities, middles, and positive expected value (EV) opportunities from bookmaker markets.

## Tech Stack

- **Next.js 15** with App Router, SSR, and Partial Prerendering (PPR)
- **React 19** with the new React Compiler
- **TypeScript** for type safety
- **Tailwind CSS 4** for styling
- **Turbopack** for fast development builds
- **pnpm** workspace for monorepo management

## Project Structure

```
edgeloop/
├── apps/
│   └── web/              # Next.js 15 application
│       ├── src/
│       │   ├── app/      # App Router pages
│       │   ├── components/
│       │   ├── lib/
│       │   └── types/
│       └── package.json
└── packages/
    └── ui/               # Shared UI package
        └── src/
            ├── tokens/   # Design tokens (colors, spacing, typography)
            └── components/
```

## Features

### Design System (@edgeloop/ui)

The shared UI package provides:

- **Design Tokens**:
  - Colors (brand, NFL teams, confidence levels, exploit types)
  - Spacing (8px grid system)
  - Typography (font families, sizes, weights)

- **Reusable Components**:
  - Card - Flexible card container
  - Button - Primary, secondary, success, danger variants
  - Badge - For confidence levels and exploit types
  - StatCard - Display key metrics

### NFL Predictions

- Model-driven forecasts with confidence ratings
- Win probability predictions
- Predicted spreads and totals
- Team colors and branding

### Betting Exploits

- **Positive EV** - Bets with expected value based on model analysis
- **Arbitrage** - Risk-free profit opportunities across different bookmakers
- **Middles** - Opportunities to win both sides of a bet
- **Line Value** - Mispriced lines based on line movement analysis

## Getting Started

### Prerequisites

- Node.js 18.17.0 or higher
- pnpm 9.0.0 or higher

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

The development server will be available at `http://localhost:3000`.

## Pages

- **Dashboard** (`/`) - Overview with stats and featured predictions/exploits
- **Predictions** (`/predictions`) - All NFL game predictions organized by confidence level
- **Exploits** (`/exploits`) - All betting exploits organized by type

## Development

This project uses:

- **Turbopack** for faster development builds
- **React 19** with the new compiler for optimized performance
- **Partial Prerendering (PPR)** for optimal loading performance
- **Tailwind CSS 4** with the new v4 syntax

## License

MIT