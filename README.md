# 🏈 Edgeloop - NFL Analytics & Betting Intelligence Platform

> High-performance analytics platform powered by Next.js 16, React 19, Rust, and advanced AI prediction engines.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📋 Prerequisites

- Node.js 20+
- Rust (stable) - for backend services
- PostgreSQL - for database
- Docker (optional) - for local services

## 🏗️ Architecture

**2026 ESPN-Grade Stack:**

- **Frontend**: Next.js 16 (App Router) + React 19
- **Backend**: Rust (Axum) for microsecond-latency APIs
- **Database**: PostgreSQL with Drizzle ORM
- **ML Engine**: Genesis prediction engines (TDA, LTC, Active Inference)
- **Data Sources**: BALLDONTLIE NFL API
- **Infrastructure**: Vercel (Next.js), Upstash Redis, Trigger.dev, Clerk Auth

## 📁 Project Structure

```
edgeloop/
├── apps/web/          # Next.js 16 application (primary)
├── crates/            # Rust libraries
│   ├── el-api/        # HTTP API server
│   ├── el-core/       # Core business logic
│   ├── el-feed/       # Data feed connectors
│   └── genesis/       # Prediction engines
├── server/            # Node.js server utilities
├── shared/            # Shared types and schemas
└── docs/              # Documentation
```

## 🛠️ Development

### Local Development

```bash
# Start Next.js web app
npm run dev

# Start Rust API (separate terminal)
cargo run -p el-api

# Start all services
just dev
```

### Code Quality

```bash
# Type check
npm run check

# Lint
npm run lint

# Format
npm run format
```

## 📚 Documentation

Core documentation lives in [`docs/`](./docs/):

- [Architecture](./docs/architecture/ARCHITECTURE_V25_WEB.md) - System design
- [Setup](./docs/setup/SETUP_V25.md) - Installation guide
- [Deployment](./docs/deployment/DEPLOYMENT_READY.md) - Production deployment
- [Integrations](./docs/INTEGRATIONS.md) - Vercel integrations

## 🚀 Deploy to Vercel

The platform is **100% Vercel-ready**:

1. **Connect your repository** to Vercel
2. **Set root directory** to `apps/web`
3. **Install Vercel integrations**:
   - Clerk (Auth)
   - Upstash Redis (Caching)
   - Trigger.dev (Background jobs)
   - Axiom (Logging)
   - Statsig (A/B Testing)
   - Resend (Email)
   - Neon (PostgreSQL)

4. **Environment variables** are auto-provided by integrations
5. **Deploy** - Build runs automatically

See [Vercel deployment guide](./docs/deployment/DEPLOYMENT_READY.md) for details.

## 🔧 Environment Variables

Required environment variables (auto-provided by Vercel integrations):

- `DATABASE_URL` / `NEON_DATABASE_URL` - PostgreSQL connection
- `UPSTASH_REDIS_REST_URL` - Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` - Redis token
- `CLERK_SECRET_KEY` - Clerk auth key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `TRIGGER_API_KEY` - Trigger.dev API key
- `BALLDONTLIE_API_KEY` - NFL data API key

See `.env.example` for full list.

## 🧪 Testing

```bash
# Run tests
npm test

# Run Rust tests
cargo test --workspace

# Run with coverage
npm run test:coverage
```

## 📦 Deployment

**Primary Platform**: Vercel (recommended)

- ✅ Next.js optimized
- ✅ Edge functions
- ✅ Automatic deployments
- ✅ Integrations auto-configured

**Alternative Platforms**:
- Railway (full-stack)
- Fly.io (Rust services)
- Render (full-stack)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

MIT
