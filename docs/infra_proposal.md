# Infra Proposal — Vercel vs Cloudflare + Repo Strategy

## Summary
This note compares two edge-first hosting approaches and repo strategies for `Edgeloop` to meet performance, longevity, and sustainability goals.

## Hosting: Vercel (Next.js native)
- Pros: Native Next.js integration, telemetry, preview deployments, automatic image optimization, ISR, incremental builds.
- Cons: Vendor lock-in for some optimizations; edge functions pricing at scale.
- Best for: Fast developer experience, Git preview deployments, integrated analytics.

## Hosting: Cloudflare (Workers + Pages)
- Pros: Global edge everywhere (Workers), Workers KV / D1 for low-latency, stronger control over edge logic, Cloudflare Images.
- Cons: Requires more infra work to wire Next.js to Cloudflare Workers (or use SSG/SSR via adapter). Learning curve.
- Best for: Ultra-low-latency edge compute and maximum global distribution.

## Multi-Repo vs Monorepo
- Monorepo (recommended initially): keep `apps/` and `libs/` together (fast local dev, versioned UI libs, shared types). Use Turborepo or pnpm workspaces for scaling.
- Multi-Repo: split UI (frontend) and backend/services into separate repos. Good for large orgs or when teams require strict ownership boundaries.

## Green Hosting & Sustainability
- Prefer providers with renewable-energy commitments (Vercel partners with green regions; Cloudflare has renewable initiatives).
- Use autoscaling, edge caching, and pre-rendering to reduce compute and transfer.

## Recommendations (Phase 2)
1. Start with Vercel for speed and full Next features. Use Vercel Edge functions for latency-critical endpoints.
2. House shared UI components in `libs/ui` inside a monorepo. Publish the UI package to a private registry when mature.
3. Implement Lighthouse and accessibility audits in CI; add a nightly job that runs Lighthouse CI against the production preview.
