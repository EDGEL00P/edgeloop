import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { getRecentAlerts, getUnacknowledgedAlerts, acknowledgeAlert, getAlertById } from '@edgeloop/core'
import { nowIso, AppError, isValidUuid, asIsoDateTimeString, type ApiAlert, type ApiAlertsResponse, type AlertId, type GameId } from '@edgeloop/shared'
import type { Alert } from '@edgeloop/db'
import { requireAuth } from '../middleware/auth'

export const alertRoutes = new Hono()

const alertQuerySchema = z.object({
  acknowledged: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

/**
 * Maps a database Alert entity to the API response format.
 */
function mapAlertToApi(alert: Alert): ApiAlert {
  return {
    id: alert.id as AlertId,
    severity: alert.severity as 'info' | 'warn' | 'crit',
    type: alert.type,
    title: alert.title,
    detail: alert.detail ?? undefined,
    gameId: alert.gameId as GameId | undefined,
    modelVersion: alert.modelVersion ?? undefined,
    createdAt: asIsoDateTimeString(alert.createdAt.toISOString()),
    acknowledgedAt: alert.acknowledgedAt ? asIsoDateTimeString(alert.acknowledgedAt.toISOString()) : undefined,
  }
}

alertRoutes.get('/', zValidator('query', alertQuerySchema), async (c) => {
  const query = c.req.valid('query')

  const alerts =
    query.acknowledged === 'false' ? await getUnacknowledgedAlerts() : await getRecentAlerts(query.limit)

  const response: ApiAlertsResponse = {
    asOfIso: nowIso(),
    alerts: alerts.map(mapAlertToApi),
  }

  return c.json(response)
})

alertRoutes.get('/:id', async (c) => {
  const alertId = c.req.param('id')

  // Validate UUID format
  if (!isValidUuid(alertId)) {
    throw AppError.badRequest('Invalid alert ID: must be a valid UUID')
  }

  const alert = await getAlertById(alertId)

  if (!alert) {
    throw AppError.notFound(`Alert ${alertId} not found`)
  }

  return c.json({
    asOfIso: nowIso(),
    alert: mapAlertToApi(alert),
  })
})

alertRoutes.post('/:id/acknowledge', requireAuth, async (c) => {
  const alertId = c.req.param('id')
  const userId = c.get('userId')

  // Validate UUID format
  if (!isValidUuid(alertId)) {
    throw AppError.badRequest('Invalid alert ID: must be a valid UUID')
  }

  if (!userId) {
    throw AppError.unauthorized()
  }

  const alert = await acknowledgeAlert(alertId, userId)

  if (!alert) {
    throw AppError.notFound(`Alert ${alertId} not found`)
  }

  return c.json({
    asOfIso: nowIso(),
    alert: mapAlertToApi(alert),
  })
})
