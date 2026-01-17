# Architecture Documentation

## Overview

Edgeloop follows the **2026 Best Architecture** pattern:

**"One product stack, one engine boundary, contracts are the only shared language."**

## Architecture Guides

- **[Best Architecture 2026](./BEST_ARCHITECTURE_2026.md)** - Complete architecture overview
- **[Vercel Strategy](./VERCEL_PLATFORM_DOMAIN_STRATEGY.md)** - Deployment strategy for Platform + Domain

## Key Principles

1. **One Primary Product Stack** - Next.js + TypeScript
2. **One Engine Boundary** - Rust/Python only if needed, as ONE service
3. **Contract-First** - All inter-domain communication via contracts/SDKs
4. **Modular Monolith** - Domains are modules, not microservices

## Repository Structure

```
edgeloop/
├── apps/web/              # Next.js app
├── domains/               # Business logic domains
├── contracts/             # API contracts (source of truth)
├── sdks/                  # Generated clients
├── engine/                # Optional Rust/Python engine
├── ml/                    # Python training/evaluation
└── platform/              # Golden path templates
```

## Boundary Rules

See [BOUNDARIES.md](../../BOUNDARIES.md) for detailed rules.

**TL;DR**: Domains don't import domains. Apps don't import domains. Everything uses contracts/SDKs.
