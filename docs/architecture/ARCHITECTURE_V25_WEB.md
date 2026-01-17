# 🚀 Edgeloop v25 - Web-First Architecture

## Philosophy
**Web-first with mobile-first design** - Maximum performance through Rust backend + Next.js frontend.

## The v25 Web Stack

### Frontend (Web + Mobile)
- **Next.js 16**: React 19 + Turbopack + App Router
- **Mobile-First**: Responsive design with PWA support
- **Real-time**: SSE/WebSockets for live odds
- **Performance**: WASM modules for client-side calculations

### Backend (Rust Services)
- **Burn ML**: Native Rust neural networks (no Python)
- **NATS JetStream**: Real-time event streaming
- **SurrealDB**: Multi-model database (Graph + Vector)
- **REST APIs**: Expose Rust services to Next.js

### Architecture Flow

```
Mobile/Web Browser
    ↓
Next.js 16 (React 19) - Mobile-First UI
    ↓
REST API / SSE / WebSocket
    ↓
Rust Services (Axum HTTP Server)
    ├── el-core (Domain Logic)
    ├── el-brain (Burn ML Inference)
    ├── el-feed (NATS Consumers)
    └── el-db (SurrealDB Queries)
    ↓
Infrastructure
    ├── SurrealDB (Data Layer)
    └── NATS JetStream (Event Streaming)
```

## Directory Structure (Web-First)

```
edgeloop-v25/
├── Cargo.toml                  # Rust Workspace (Backend Services)
├── Justfile                    # Command Runner
├── docker-compose.yml          # SurrealDB + NATS
├── apps/
│   └── web/                    # Next.js 16 (PRIMARY - Web + Mobile)
│       ├── app/                # App Router (Mobile-First)
│       ├── components/         # Responsive React Components
│       ├── lib/                # WASM modules, API clients
│       └── public/             # PWA manifest, icons
├── crates/                     # Rust Backend Libraries
│   ├── el-core/                # Domain Logic (Odds, EV, Kelly)
│   ├── el-brain/               # Burn Neural Networks
│   ├── el-feed/                # NATS Connectors
│   ├── el-db/                  # SurrealDB Connection Pool
│   └── el-api/                 # Axum HTTP Server (REST API)
├── services/                   # Backend Services
│   ├── sentinel/               # Scraper (ChromiumOxide)
│   ├── oracle/                 # Predictor (Burn inference)
│   └── executioner/            # Auto-Picks (Simulation)
└── infrastructure/
    ├── surreal/                # DB Configs
    └── nats/                   # JetStream Configs
```

## Performance Targets (Web)

| Operation | Target | Implementation |
|-----------|--------|----------------|
| Page Load | <1s | Next.js SSR + Edge Caching |
| ML Inference | <10ms | Rust API (Burn) via HTTP |
| Odds Update | <100ms | SSE/WebSocket from NATS |
| Kelly Calc | <1ms | WASM in browser |
| Mobile Experience | Native-like | PWA + Responsive Design |

## Mobile-First Features

### Progressive Web App (PWA)
- Installable on mobile
- Offline support
- Push notifications
- App-like experience

### Responsive Design
- Mobile-first breakpoints
- Touch-optimized UI
- Swipe gestures
- Bottom navigation (mobile)

### Performance Optimizations
- Image optimization (Next.js Image)
- Code splitting
- WASM for heavy calculations
- Service Worker caching

## Technology Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | Next.js 16 + React 19 | App Router, SSR, PWA |
| Styling | Tailwind CSS v4 | Mobile-first utilities |
| Backend API | Rust (Axum) | Microsecond latency |
| ML Engine | Burn (Rust) | Native inference |
| Database | SurrealDB | Graph + Vector in one |
| Streaming | NATS JetStream | Real-time events |
| Scraper | ChromiumOxide (Rust) | Headless browser |

## Next Steps

1. Set up Next.js 16 with mobile-first layout
2. Create Rust API server (Axum)
3. Connect Next.js to Rust APIs
4. Implement PWA features
5. Add WASM modules for calculations
