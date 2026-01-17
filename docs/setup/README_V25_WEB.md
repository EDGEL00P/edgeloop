# 🚀 Edgeloop v25 - Web-First Architecture

## ✅ What's Been Set Up

### 1. Rust Backend Services ✅
- **el-core**: Domain logic (Kelly calculator, arbitrage)
- **el-api**: Axum HTTP server (REST API on port 3001)
- **el-brain**: Burn ML framework (stub - ready for models)
- **el-db**: SurrealDB connection pool (stub)
- **el-feed**: NATS JetStream connectors (stub)

### 2. Infrastructure ✅
- **Docker Compose**: SurrealDB + NATS JetStream
- **Justfile**: Command runner for all operations

### 3. Next.js Web App ✅
- **Next.js 16**: React 19 + Turbopack
- **Mobile-First**: Responsive design ready
- **WASM Support**: Configured for client-side calculations

## 🏃 Quick Start

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Install Next.js dependencies
cd apps/web
npm install --legacy-peer-deps

# 3. Start Rust API (Terminal 1)
just api

# 4. Start Next.js (Terminal 2)
just web-dev
```

## 📱 Access Points

- **Web App**: http://localhost:3000
- **Rust API**: http://localhost:3001
- **API Health**: http://localhost:3001/health

## 🎯 Architecture

```
Mobile Browser / Desktop
    ↓
Next.js 16 (React 19)
    ↓ HTTP REST
Rust API Server (Axum)
    ├── el-core (Kelly, Arbitrage)
    ├── el-brain (Burn ML) [TODO]
    ├── el-db (SurrealDB) [TODO]
    └── el-feed (NATS) [TODO]
    ↓
Infrastructure
    ├── SurrealDB (Port 8000) [TODO]
    └── NATS JetStream (Port 4222) [TODO]
```

## ✅ Working Now

- ✅ Rust API server (Kelly calculator endpoints)
- ✅ Next.js 16 foundation
- ✅ Docker infrastructure
- ✅ Command runner (Justfile)

## 🚧 Coming Next

- ⏳ Connect Next.js to Rust API
- ⏳ Implement mobile-first UI components
- ⏳ Add PWA support
- ⏳ Complete Burn ML models
- ⏳ Connect SurrealDB
- ⏳ Connect NATS JetStream

## 📚 Documentation

- `ARCHITECTURE_V25_WEB.md` - Complete architecture spec
- `SETUP_WEB_V25.md` - Setup instructions
- `Justfile` - All available commands

The foundation is ready! Build the UI and connect the pieces. 🚀
