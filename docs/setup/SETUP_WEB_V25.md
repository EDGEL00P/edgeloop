# 🛠️ Edgeloop v25 Web-First Setup Guide

## Prerequisites

### 1. Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustc --version
```

### 2. Install Just (Command Runner)
```bash
cargo install just
```

### 3. Install Node.js 20+
```bash
# macOS
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

### 4. Install Docker & Docker Compose
```bash
# macOS
brew install --cask docker

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose
```

## Quick Start

```bash
# 1. Start infrastructure (SurrealDB + NATS)
docker-compose up -d

# 2. Install Next.js dependencies
cd apps/web
npm install --legacy-peer-deps

# 3. Start everything (API + Web)
just dev

# Or separately:
# Terminal 1: Rust API
just api

# Terminal 2: Next.js Web
just web-dev
```

## Access Points

- **Web App**: http://localhost:3000 (Next.js)
- **Rust API**: http://localhost:3001 (Axum)
- **SurrealDB**: http://localhost:8000
- **NATS**: http://localhost:8222 (monitoring)

## Mobile Testing

### Chrome DevTools
1. Open Chrome DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Test mobile viewports

### Real Device
```bash
# Find your local IP
ipconfig getifaddr en0  # macOS
ip addr show            # Linux

# Access from mobile: http://YOUR_IP:3000
```

## PWA Features (Coming Soon)

- Install on mobile home screen
- Offline support
- Push notifications
- App-like experience

## Development Workflow

```bash
# Format code
just fmt

# Run tests
just test

# Lint code
just lint

# Check health
just health
```

## Architecture

```
Mobile/Desktop Browser
    ↓
Next.js 16 (http://localhost:3000)
    ↓ HTTP REST API
Rust API Server (http://localhost:3001)
    ├── el-core (Domain Logic)
    ├── el-brain (Burn ML)
    └── el-db (SurrealDB)
    ↓
Infrastructure
    ├── SurrealDB (Port 8000)
    └── NATS JetStream (Port 4222)
```

## Next Steps

1. ✅ Rust API server running
2. ✅ Next.js web app running
3. ⏳ Connect Next.js to Rust API
4. ⏳ Implement mobile-first UI
5. ⏳ Add PWA support
