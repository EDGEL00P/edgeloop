# EdgeLoop

NFL predictions platform with advanced analytics, real-time edge detection, and automated betting strategies.

## Documentation

- **[Contributing Guide](CONTRIBUTING.md)** - Development workflow, architecture, and setup
- **[Component Library](docs/components/)** - UI components and design system
  - [3D Components](docs/components/3D_COMPONENTS.md) - React Three Fiber components
  - [Design System](docs/components/DESIGN_SYSTEM.md) - Design tokens and theming
  - [UX Enhancements](docs/components/UX_ENHANCEMENTS.md) - UI/UX patterns
- **[Deployment](docs/deployment/)** - Production deployment guides
  - [Deployment Guide](docs/deployment/DEPLOYMENT.md) - Vercel setup and configuration
  - [Deployment Checklist](docs/deployment/CHECKLIST.md) - Pre-deployment checklist

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

## Project Structure

```
edgeloop/
├── apps/
│   ├── web/          # Main application
│   └── server/       # API server
├── packages/
│   ├── ui/           # UI components
│   ├── db/           # Database schemas
│   └── integrations/ # External APIs
└── docs/             # Documentation
```

## Tech Stack

- **Framework**: Next.js 15 (React 19, App Router)
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL with Drizzle ORM
- **Cache**: Upstash Redis
- **Build Tool**: Turborepo

## License

Proprietary
