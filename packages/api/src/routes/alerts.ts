import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { getRecentAlerts, getUnacknowledgedAlerts, acknowledgeAlert, getAlertById } from '@edgeloop/core'
import { nowIso, AppError, type ApiAlert, type ApiAlertsResponse, type AlertId, type GameId } from '@edgeloop/shared'
import { requireAuth } from '../middleware/auth'

export const alertRoutes = new Hono()

const alertQuerySchema = z.object({
  acknowledged: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

function mapAlertToApi(alert: any): ApiAlert {
  return {
    id: alert.id as AlertId,
    severity: alert.severity,
    type: alert.type,
    title: alert.title,
    detail: alert.detail ?? undefined,
    gameId: alert.gameId as GameId | undefined,
    modelVersion: alert.modelVersion ?? undefined,
    createdAt: alert.createdAt.toISOString() as any,
    acknowledgedAt: alert.acknowledgedAt?.toISOString() as any,
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
