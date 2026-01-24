import { Hono } from 'hono'
import { getDb } from '@edgeloop/db'
import { nowIso } from '@edgeloop/shared'
import type { ApiHealthResponse, ApiReadyResponse } from '@edgeloop/shared'

const startedAt = nowIso()

export const healthRoutes = new Hono()

healthRoutes.get('/healthz', (c) => {
  const response: ApiHealthResponse = {
    status: 'ok',
    startedAt,
  }
  return c.json(response)
})

healthRoutes.get('/readyz', async (c) => {
  const checks = {
    database: false,
  }

  // Check database connection
  try {
    const db = getDb()
    await db.execute('SELECT 1')
    checks.database = true
  } catch {
    checks.database = false
  }

  const isReady = checks.database

  const response: ApiReadyResponse = {
    status: isReady ? 'ready' : 'not_ready',
    checks,
  }

  return c.json(response, isReady ? 200 : 503)
})
