# 🛠️ Edgeloop v25 Setup Guide

## Prerequisites Installation

### 1. Install Rust Toolchain
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verify installation
rustc --version
cargo --version
```

### 2. Install Just (Command Runner)
```bash
cargo install just
```

### 3. Install Tauri CLI
```bash
cargo install tauri-cli
```

### 4. System Dependencies (Tauri)
```bash
# macOS
brew install libappindicator

# Ubuntu/Debian
sudo apt-get install libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

# Windows
# Install Visual Studio Build Tools (C++ workload)
```

### 5. Install Docker & Docker Compose
```bash
# macOS
brew install --cask docker

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Verify
docker --version
docker-compose --version
```

## Quick Start

```bash
# 1. Start infrastructure (SurrealDB + NATS)
just dev

# Or manually:
docker-compose up -d

# 2. Verify services are running
just health

# 3. Start Tauri app
just tauri-dev

# 4. In another terminal, start scraper
just sentinel

# 5. In another terminal, start oracle
just oracle
```

## Development Workflow

```bash
# Format code
just fmt

# Run tests
just test

# Lint code
just lint

# Watch for changes
just watch

# Build release
just build-release
```

## Service Architecture

```
┌─────────────┐
│   Tauri UI  │ (apps/terminal)
└──────┬──────┘
       │ Rust IPC
┌──────▼──────┐     ┌──────────────┐
│  el-core    │◄────┤  SurrealDB   │
│ (Domain)    │     │   (Data)     │
└──────┬──────┘     └──────────────┘
       │
┌──────▼──────┐     ┌──────────────┐
│   NATS      │◄────┤   Sentinel   │
│ JetStream   │     │  (Scraper)   │
└──────┬──────┘     └──────────────┘
       │
┌──────▼──────┐
│   Oracle    │
│  (Burn ML)  │
└─────────────┘
```

## Troubleshooting

### NATS not starting
```bash
docker-compose logs nats
```

### SurrealDB connection issues
```bash
docker-compose logs surrealdb
curl http://localhost:8000/health
```

### Tauri build fails
```bash
# Check system dependencies
rustc --version
cargo tauri info
```

### Rust workspace issues
```bash
# Clean and rebuild
just clean
cargo build --workspace
```

## Performance Verification

```bash
# Check NATS throughput
docker exec -it edgeloop-nats-box /bin/sh
nats stream ls
nats pub test.performance "message"

# Check SurrealDB latency
# (Use el-db crate benchmarks when ready)
```

## Next Steps

1. **Build crates**: Start with `el-core` (domain logic)
2. **Train model**: Use `el-brain` with Burn
3. **Connect services**: Wire NATS between services
4. **Build UI**: Create Tauri windows in `apps/terminal`
