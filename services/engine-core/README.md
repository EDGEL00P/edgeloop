# Engine Core - Rust Service

High-performance betting engine written in Rust using Axum.

## 🚀 Performance Targets

- **Kelly calculation**: <1ms
- **Odds comparison**: <5ms  
- **ML inference**: <10ms (when ONNX Runtime integrated)

## 📦 Features

### ✅ Implemented
- Kelly Criterion calculator (full, half, quarter)
- Arbitrage detection (2-way markets)
- Axum HTTP server
- RESTful API endpoints

### 🚧 Coming Soon
- ONNX Runtime integration for ML inference
- gRPC server for inter-service communication
- WASM compilation for browser use
- 3-way market arbitrage (sports with draws)

## 🏗️ Build & Run

```bash
cd services/engine-core

# Build
cargo build --release

# Run tests
cargo test

# Run server
cargo run --release
```

The server will start on `http://localhost:8080`

## 🌐 API Endpoints

### Health Check
```
GET /health
```

### Kelly Calculator
```
POST /api/kelly
Body: { "probability": 0.55, "decimal_odds": 1.91, "bankroll": 10000 }
```

### Quarter Kelly (Conservative)
```
POST /api/kelly/quarter
Body: { "probability": 0.55, "decimal_odds": 1.91, "bankroll": 10000 }
```

### Arbitrage Detection
```
POST /api/arbitrage/detect
Body: { "odds": [...] }
```

## 🔧 WASM Compilation (Browser)

To compile Kelly calculator for browser use:

```bash
# Install wasm-pack if not already installed
cargo install wasm-pack

# Compile to WASM
wasm-pack build --target web --out-dir ../../apps/web/lib/wasm/kelly
```

This will create a WASM module that can be imported in Next.js:
```typescript
import init, { calculate_kelly } from '@/lib/wasm/kelly';
```

## 📊 Example Usage

### Kelly Calculation

```rust
use engine_core::KellyCalculator;

let calc = KellyCalculator::new();
let result = calc.calculate(0.55, 1.91, 10000.0)?;

println!("Kelly Fraction: {}", result.kelly_fraction);
println!("Recommended Stake: ${}", result.recommended_stake);
```

### Arbitrage Detection

```rust
use engine_core::arbitrage::{ArbitrageDetector, Odds};

let detector = ArbitrageDetector::new();
let odds = vec![
    Odds { book: "BookA".to_string(), home_odds: 2.10, away_odds: 1.90, draw_odds: None },
    Odds { book: "BookB".to_string(), home_odds: 1.95, away_odds: 2.05, draw_odds: None },
];

let opportunity = detector.detect_2way(odds);
if opportunity.exists {
    println!("Arbitrage found! Profit: {}%", opportunity.profit_percentage);
}
```

## 🎯 Next Steps

1. **ONNX Runtime** - Integrate ML model inference
2. **gRPC** - Add Protocol Buffers definitions
3. **Performance Benchmarks** - Measure against targets
4. **WASM Integration** - Connect to Next.js frontend
