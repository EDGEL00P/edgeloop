# 🚀 Edgeloop 2027 God-Tier Architecture

## Philosophy
**"High-Performance Compute Engine with a UI"** - Not a traditional web app.

## Stack Overview

### Runtime Layer
- **Frontend UI**: Next.js 16 (React 19 + Turbopack)
- **Compute Engine**: Rust (Axum) - Zero GC latency
- **Data Ingest**: Go/Rust scrapers for high-frequency odds

### Data Layer
- **Analytics (OLAP)**: ClickHouse - Columnar database for historical analysis
- **Hot Cache**: Redis Stack (RedisJSON + RediSearch) - In-memory odds
- **Events**: Redpanda/Kafka - Event streaming for odds updates

### AI/ML Layer
- **Inference**: ONNX Runtime (Rust) - Model predictions in microseconds
- **Training**: Python (offline) - Export to ONNX/TensorRT
- **Data Processing**: Polars (Rust) - Replaces Pandas

### Communication
- **Inter-Service**: gRPC/Protobufs - 7x faster than REST
- **Client-Server**: WASM for client-side calculations

## Directory Structure

```
edgeloop/
├── apps/
│   ├── web/                    # Next.js 16 (The Control Center)
│   │   ├── app/                # App Router
│   │   └── lib/wasm/           # Rust-compiled WASM modules
│   └── docs/
├── services/
│   ├── engine-core/            # RUST (Axum) - The "Brain"
│   │   ├── src/
│   │   │   ├── arbitrage/      # Zero-latency odds comparison
│   │   │   ├── inference/      # ONNX Runtime for ML models
│   │   │   └── kelly/          # Kelly Criterion calculator
│   │   └── Cargo.toml
│   ├── data-ingest/            # GO or RUST - The "Feed"
│   │   └── scrapers/           # WebSocket connections to books
│   └── python-research/        # PYTHON - The "Lab" (Offline Training)
│       └── notebooks/          # Model design & training
├── infrastructure/
│   ├── clickhouse/             # Historical data (OLAP)
│   ├── redis-stack/            # Live odds & vector cache
│   └── kafka/                  # Event streaming (Redpanda)
└── packages/
    └── protos/                 # gRPC definitions (Protocol Buffers)
```

## Migration Strategy

### Phase 1: Foundation (Current)
- ✅ Next.js 16 with App Router
- ✅ Remove Express → Prepare for Hono (bridge to Rust)
- ⏳ Set up directory structure
- ⏳ Create WASM module stubs

### Phase 2: Rust Services (Next)
- Build engine-core in Rust (Axum)
- Implement Kelly calculator in Rust → compile to WASM
- Set up gRPC definitions

### Phase 3: Data Layer Migration
- Migrate analytics queries to ClickHouse
- Move live odds to Redis Stack
- Implement event streaming with Redpanda

### Phase 4: ML Inference
- Export Python models to ONNX
- Integrate ONNX Runtime in Rust backend
- Benchmarks & optimization

## Performance Targets

| Operation | Current | 2027 Target |
|-----------|---------|-------------|
| Kelly Calculation | 50-100ms (JS) | <1ms (WASM) |
| Odds Comparison | 200ms | <5ms (Rust) |
| ML Inference | 200-500ms (Python) | <10ms (ONNX) |
| EPA Query (5yr data) | 400ms (Postgres) | 4ms (ClickHouse) |

## Why This Stack?

**To beat multi-billion dollar bookmakers**, we need:
1. **Zero latency** in critical paths (odds → decision → bet)
2. **Real-time analytics** on massive historical datasets
3. **Native-speed math** without GC pauses
4. **Event-driven architecture** for instant updates

This is not overkill - it's the minimum required to compete.
