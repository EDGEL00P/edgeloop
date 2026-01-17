# Edgeloop v25 - Web-First Command Runner
# Install just: cargo install just

# Start the full stack (DB + Stream + API + Web)
dev:
    @echo "🚀 Starting Edgeloop v25 (Web-First)..."
    docker-compose up -d
    @echo "⏳ Waiting for services to be ready..."
    sleep 3
    @echo "🖥️  Starting Rust API server..."
    just api &
    @echo "🌐 Starting Next.js web app..."
    just web-dev

# Start Next.js development (Web + Mobile)
web-dev:
    cd apps/web && npm run dev

# Start Rust API server
api:
    @echo "⚙️  Starting Rust API server on port 3001..."
    cargo run -p el-api

# Build Next.js for production
web-build:
    cd apps/web && npm run build

# Run the Scraper Agent (Sentinel)
sentinel:
    @echo "👁️  Starting Sentinel scraper..."
    cargo run -p sentinel

# Run the Oracle predictor
oracle:
    @echo "🔮 Starting Oracle predictor..."
    cargo run -p oracle

# Train the Burn model
train:
    @echo "🧠 Training Burn model..."
    cargo run -p el-brain --bin train -- --epochs 100

# Run all tests
test:
    @echo "🧪 Running all tests..."
    cargo test --workspace
    cd apps/web && npm test

# Format all code
fmt:
    @echo "📝 Formatting code..."
    cargo fmt --all
    cd apps/web && npm run format

# Lint all code
lint:
    @echo "🔍 Linting code..."
    cargo clippy --workspace -- -D warnings
    cd apps/web && npm run lint

# Clean build artifacts
clean:
    @echo "🧹 Cleaning build artifacts..."
    cargo clean
    cd apps/web && rm -rf .next node_modules

# Reset everything
reset:
    @echo "🔄 Resetting v25 environment..."
    docker-compose down -v
    just clean
    docker-compose up -d

# Check system health
health:
    @echo "🏥 Checking system health..."
    @curl -s http://localhost:8000/health || echo "SurrealDB: ❌"
    @curl -s http://localhost:8222/healthz || echo "NATS: ❌"
    @curl -s http://localhost:3001/health || echo "Rust API: ❌"

# Build release for all services
build-release:
    @echo "📦 Building release binaries..."
    cargo build --release --workspace
    just web-build
