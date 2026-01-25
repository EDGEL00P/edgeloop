export type RuntimeConfig = {
  host: string
  port: number
  shutdownGraceMs: number
}

function readPortFromEnv(): number {
  const raw = process.env.PORT
  if (!raw) return 3000

  const n = Number(raw)
  if (!Number.isInteger(n) || n <= 0 || n > 65535) {
    throw new Error(`Invalid PORT=${raw}`)
  }

  return n
}

function readShutdownGraceMs(): number {
  const raw = process.env.SHUTDOWN_GRACE_MS
  if (!raw) return 5000

  const n = Number(raw)
  if (!Number.isInteger(n) || n < 0 || n > 60000) {
    throw new Error(`Invalid SHUTDOWN_GRACE_MS=${raw}`)
  }

  return n
}

export function readRuntimeConfig(): RuntimeConfig {
  return {
    host: process.env.HOST ?? '0.0.0.0',
    port: readPortFromEnv(),
    shutdownGraceMs: readShutdownGraceMs(),
  }
}
