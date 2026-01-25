import { eq, desc, isNull, and, gte } from 'drizzle-orm'
import { getDb, alerts, type Alert, type NewAlert, type AlertSeverity, type AlertType } from '@edgeloop/db'

export async function getRecentAlerts(limit = 50): Promise<Alert[]> {
  const db = getDb()

  const result = await db.query.alerts.findMany({
    orderBy: [desc(alerts.createdAt)],
    limit,
  })

  return result
}

export async function getUnacknowledgedAlerts(): Promise<Alert[]> {
  const db = getDb()

  const result = await db.query.alerts.findMany({
    where: isNull(alerts.acknowledgedAt),
    orderBy: [desc(alerts.createdAt)],
  })

  return result
}

export async function getAlertsBySeverity(severity: AlertSeverity): Promise<Alert[]> {
  const db = getDb()

  const result = await db.query.alerts.findMany({
    where: eq(alerts.severity, severity),
    orderBy: [desc(alerts.createdAt)],
  })

  return result
}

export async function getAlertsByType(type: AlertType): Promise<Alert[]> {
  const db = getDb()

  const result = await db.query.alerts.findMany({
    where: eq(alerts.type, type),
    orderBy: [desc(alerts.createdAt)],
  })

  return result
}

export async function createAlert(data: NewAlert): Promise<Alert> {
  const db = getDb()

  const [alert] = await db.insert(alerts).values(data).returning()

  if (!alert) {
    throw new Error('Failed to create alert')
  }

  return alert
}

export async function acknowledgeAlert(alertId: string, userId: string): Promise<Alert | null> {
  const db = getDb()

  const [updated] = await db
    .update(alerts)
    .set({
      acknowledgedAt: new Date(),
      acknowledgedBy: userId,
    })
    .where(eq(alerts.id, alertId))
    .returning()

  return updated ?? null
}

export async function getAlertById(alertId: string): Promise<Alert | null> {
  const db = getDb()

  const result = await db.query.alerts.findFirst({
    where: eq(alerts.id, alertId),
  })

  return result ?? null
}

export async function getCriticalAlertsCount(): Promise<number> {
  const db = getDb()
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const result = await db.query.alerts.findMany({
    where: and(
      eq(alerts.severity, 'crit'),
      isNull(alerts.acknowledgedAt),
      gte(alerts.createdAt, oneDayAgo)
    ),
    columns: { id: true },
  })

  return result.length
}
