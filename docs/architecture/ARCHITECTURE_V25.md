# 🚀 Edgeloop v25 - God-Tier Architecture

## Philosophy
**Microsecond latency (μs) over millisecond latency (ms)** - Zero-copy, native Rust, edge-first.

## The v25 Stack

### The Core (Rust + Burn)
- **Burn ML Framework**: Deep Learning 100% in Rust
- No Python serialization overhead
- Zero-copy prediction in same memory space
- GPU acceleration via WGPU/CUDA

### The Nervous System (NATS JetStream)
- **NATS**: Request/Reply (RPC) + Streams (Events) in one binary
- Leaf Node topology for edge computing
- 18 million messages/second
- "At most once" delivery for odds

### The Interface (Tauri v2)
- **Desktop-first**: Chrome rendering + Rust backend
- Multi-window support (Matrix View + Oracle)
- Inter-window communication via Rust channels
- 10x lighter than Electron

### The Data Fabric (SurrealDB)
- **Multi-model**: Graph + Document + Vector in one DB
- No ORM needed - SQL-like queries
- Built-in vector search
- Graph relationships for NFL data

### The Scraper (ChromiumOxide)
- **Headless Chrome in Rust**: chromiumoxide crate
- Undetectable by antibots
- Direct Rust control, no Puppeteer overhead

## Directory Structure

```
edgeloop-v25/
├── Cargo.toml                  # Rust Workspace Root
├── Justfile                    # Command Runner
├── docker-compose.yml          # SurrealDB + NATS
├── apps/
│   ├── terminal/               # Tauri App (Betting Station)
│   │   ├── src-tauri/          # Rust Backend
│   │   └── src-ui/             # React 19 + Framer Motion
│   └── dashboard/              # Next.js 15 (Mobile/Remote)
├── crates/                     # Shared Libraries
│   ├── el-core/                # Domain Logic (Odds, EV)
│   ├── el-brain/               # Burn Neural Networks
│   ├── el-feed/                # NATS Connectors
│   └── el-db/                  # SurrealDB Pool
├── services/                   # Micro-Agents
│   ├── sentinel/               # Scraper (ChromiumOxide)
│   ├── oracle/                 # Predictor (Burn inference)
│   └── executioner/            # Auto-Picks (Simulation)
└── infrastructure/
    ├── surreal/                # DB Configs
    └── nats/                   # JetStream Configs
```

## Performance Targets

| Operation | Target | Why |
|-----------|--------|-----|
| ML Inference | <10μs | Burn native Rust, no serialization |
| Odds Update | <1μs | NATS direct memory publish |
| Graph Query | <50μs | SurrealDB in-memory graph |
| Vector Search | <100μs | SurrealDB native vector index |

## Key Advantages

1. **Zero Serialization**: Rust → Rust communication
2. **Zero Context Switch**: Everything in same process
3. **Native Speed**: No JavaScript/V8 overhead
4. **Edge-First**: Leaf nodes connect to cloud seamlessly
5. **GPU Ready**: Burn supports WGPU/CUDA automatically

## Migration from Previous Stack

- ❌ **ONNX Runtime** → ✅ **Burn (native Rust)**
- ❌ **Kafka/Redpanda** → ✅ **NATS JetStream**
- ❌ **Browser-only** → ✅ **Tauri Desktop + Web**
- ❌ **Postgres/ClickHouse** → ✅ **SurrealDB (all-in-one)**
- ❌ **Python ML** → ✅ **Burn training & inference**

## Next Steps

1. Install Rust toolchain
2. Install just (command runner)
3. Set up Tauri CLI
4. Start SurrealDB + NATS
5. Build crates incrementally
