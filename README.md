# EdgeLoop (NFL broadcast platform)

This repository is being scaffolded as a production-grade monorepo with a strict TypeScript baseline and a low tracked-file footprint.

## Workspace layout

- `packages/shared` — shared types/utilities (no runtime assumptions)
- `packages/server` — server/runtime components (health/readiness, reliability hardening)
- `apps/*` — UI applications (broadcast UX shell)

## Local development

Because shell execution is currently unavailable in this environment, install/build is expected to be run externally:

```bash
pnpm install
pnpm run build
```

(You can use pnpm/yarn/bun if preferred; the repo is configured with standard workspaces.)

## Runtime (server)

The server package is a minimal Node HTTP runtime with reliability defaults:

- `GET /healthz` (liveness)
- `GET /readyz` (readiness placeholder)

It emits structured JSON logs and propagates a request correlation ID via `x-request-id`.

### Run

```bash
# from repo root
pnpm install
pnpm run build

# start the compiled CLI
node packages/server/dist/cli.js
```

### Environment variables

- `PORT` (default `3000`) — **fail-fast** if set but invalid
- `HOST` (default `0.0.0.0`)
- `SHUTDOWN_GRACE_MS` (default `5000`) — bounded to `0..60000`

## UI (control room)

`apps/control-room` is a minimal HTML/CSS/TypeScript shell meant to enforce consistent UX states.

Behavior:

- starts in **loading**
- calls `GET /healthz`
- transitions to **success** or **error**
- displays `x-request-id` when present (ties UI errors to server logs)

## Guardrails

- **Tracked file cap:** <170 hard, <145 preferred.
- Prefer dependency-light implementations unless a library demonstrably reduces custom complexity.
