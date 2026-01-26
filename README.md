# EdgeLoop

A monorepo application built with Next.js, React, TypeScript, and Tailwind CSS.

## Structure

- `apps/web` - Next.js 15 web application
- `packages/ui` - Shared UI components library
- `packages/api` - API package
- `packages/core` - Core business logic
- `packages/db` - Database package with Drizzle ORM
- `packages/shared` - Shared utilities and types
- `packages/server` - Server utilities
- `packages/ml` - Machine learning models
- `packages/jobs` - Background jobs
- `packages/integrations` - Third-party integrations
- `packages/ws` - WebSocket package

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Build all packages:
```bash
pnpm build
```

3. Run the development server:
```bash
pnpm dev
```

The web application will be available at `http://localhost:3000`

## Development

- `pnpm dev` - Start the Next.js development server
- `pnpm build` - Build all packages
- `pnpm typecheck` - Type check all packages
- `pnpm test` - Run tests across all packages

## Tech Stack

- **Framework**: Next.js 15
- **React**: 19
- **TypeScript**: 5.9
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **Database**: Drizzle ORM
- **Package Manager**: pnpm (workspace)
