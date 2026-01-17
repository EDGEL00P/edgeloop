# Edgeloop - NFL Analytics & Betting Intelligence Platform

> High-performance analytics platform powered by Next.js 16, Rust, and advanced AI prediction engines.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## 📋 Prerequisites

- Node.js 20+
- Rust (stable)
- PostgreSQL
- Docker (for local services)

## 🏗️ Architecture

Edgeloop is built on a modern, high-performance stack:

- **Frontend**: Next.js 16 (App Router) with React 19
- **Backend**: Rust (Axum) for microsecond-latency APIs
- **Database**: PostgreSQL with Drizzle ORM
- **ML Engine**: Genesis prediction engines (TDA, LTC, Active Inference)
- **Data Sources**: BALLDONTLIE NFL API (GOAT tier)

## 📁 Project Structure

```
edgeloop/
├── apps/web/          # Next.js web application
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
# Start all services
just dev

# Start only web app
npm run dev

# Start Rust API
cargo run -p el-api
```

### Code Quality

```bash
# Format code
npm run format
cargo fmt

# Lint
npm run lint
cargo clippy

# Type check
npm run check
```

## 📚 Documentation

Full documentation is available in the [`docs/`](./docs/) directory:

- [Architecture Documentation](./docs/architecture/)
- [Setup Guides](./docs/setup/)
- [Deployment Guides](./docs/deployment/)
- [Requirements](./docs/requirements/)

## 🔧 Configuration

### Environment Variables

Required environment variables are documented in `.env.example`. Key variables include:

- `DATABASE_URL` - PostgreSQL connection string
- `BALLDONTLIE_API_KEY` - NFL data API key
- `NEXT_PUBLIC_API_URL` - Rust API server URL

## 🧪 Testing

```bash
# Run all tests
npm test

# Run Rust tests
cargo test --workspace

# Run with coverage
npm run test:coverage
```

## 📦 Deployment

The platform can be deployed to:

- **Vercel** (recommended for Next.js)
- **Railway** (full-stack deployment)
- **Fly.io** (Rust services)

See [deployment documentation](./docs/deployment/) for detailed instructions.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

MIT

## 🔗 Links

- [Documentation](./docs/)
- [API Documentation](./docs/architecture/)
- [Changelog](./CHANGELOG.md)
