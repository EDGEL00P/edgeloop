# 🗺️ Migration Plan: Current → God-Tier 2027

## Current State Analysis

### What We Have
- Next.js 13.5.6 → **Upgrading to 16+**
- React 18 → **Upgrading to 19**
- Express backend → **Migrating to Hono (bridge to Rust)**
- PostgreSQL → **Planning ClickHouse + Redis Stack**
- Python ML inference → **Planning ONNX Runtime in Rust**
- REST API → **Planning gRPC**

### What's Incompatible
- ❌ Express → Replace with Hono (interim) then Rust
- ❌ Passport.js → Replace with Better-Auth
- ❌ Zod → Replace with Valibot (smaller bundle)
- ❌ WebSockets → Replace with SSE/Event Streaming
- ❌ Pandas → Replace with Polars

## Step-by-Step Migration

### ✅ Phase 1: Foundation (COMPLETED)
1. [x] Update Next.js to 16+
2. [x] Update React to 19
3. [x] Remove Vite completely
4. [x] Remove Wouter
5. [x] Set up Jest instead of Vitest

### 🔄 Phase 2: Backend Modernization (IN PROGRESS)
1. [ ] Replace Express with Hono (interim solution)
2. [ ] Replace Passport with Better-Auth
3. [ ] Replace Zod with Valibot
4. [ ] Set up WASM build pipeline
5. [ ] Create Rust project structure

### ⏳ Phase 3: Rust Core (NEXT)
1. [ ] Set up engine-core Rust project (Axum)
2. [ ] Implement Kelly calculator in Rust
3. [ ] Compile Kelly calculator to WASM
4. [ ] Integrate WASM into Next.js
5. [ ] Benchmark performance improvements

### ⏳ Phase 4: Data Layer
1. [ ] Set up ClickHouse instance
2. [ ] Migrate analytics queries to ClickHouse
3. [ ] Set up Redis Stack
4. [ ] Move live odds to Redis
5. [ ] Implement Redpanda/Kafka event streaming

### ⏳ Phase 5: ML Inference
1. [ ] Export Python models to ONNX
2. [ ] Integrate ONNX Runtime in Rust
3. [ ] Replace Python inference calls
4. [ ] Benchmark inference speed

### ⏳ Phase 6: Communication Protocol
1. [ ] Design gRPC service definitions
2. [ ] Implement gRPC server (Rust)
3. [ ] Replace REST endpoints gradually
4. [ ] Update frontend to use gRPC

## Immediate Next Steps

1. **Fix dependencies** - Ensure Next.js 16 + React 19 install correctly
2. **Create Rust project** - Initialize `services/engine-core/`
3. **WASM hello world** - Create a simple WASM module to verify pipeline
4. **Hono bridge** - Keep Hono as interim API layer while Rust develops

## Risk Mitigation

- Keep Next.js app fully functional during migration
- Implement features incrementally (not all-at-once)
- Maintain backward compatibility where possible
- Extensive testing at each phase

## Timeline Estimate

- **Phase 1**: ✅ Complete
- **Phase 2**: 1-2 weeks
- **Phase 3**: 2-3 weeks  
- **Phase 4**: 3-4 weeks
- **Phase 5**: 2-3 weeks
- **Phase 6**: 2-3 weeks

**Total**: ~10-15 weeks for full migration
