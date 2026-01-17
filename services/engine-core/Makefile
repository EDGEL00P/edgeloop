.PHONY: build test run wasm clean

# Build release binary
build:
	cargo build --release

# Run tests
test:
	cargo test --verbose

# Run development server
run:
	cargo run

# Build WASM module for browser
wasm:
	wasm-pack build --target web --out-dir ../../apps/web/lib/wasm/kelly

# Clean build artifacts
clean:
	cargo clean

# Format code
fmt:
	cargo fmt

# Lint code
lint:
	cargo clippy -- -D warnings
