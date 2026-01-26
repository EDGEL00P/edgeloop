'use server'

import { db } from '@edgeloop/db'
import { alertRules, alertHistory } from '@edgeloop/db/schema/alerts'
import { eq, and, desc } from 'drizzle-orm'
import type { AlertRule, AlertRuleConfig, AlertDelivery, NewAlertRule } from '@edgeloop/db/schema/alerts'
import { z } from 'zod'

const AlertRuleConfigSchema = z.object({
  type: z.enum(['ev', 'arbitrage', 'middle', 'line_movement', 'injury']),
  minEV: z.number().optional(),
  teams: z.array(z.string()).optional(),
  books: z.array(z.string()).optional(),
  lineMovementThreshold: z.number().optional(),
  quietHours: z.object({ start: z.string(), end: z.string() }).optional(),
  maxAlertsPerDay: z.number().optional(),
})

const AlertDeliverySchema = z.object({
  email: z.boolean().optional(),
  slack: z.boolean().optional(),
  discord: z.boolean().optional(),
  webhook: z.string().url().optional(),
})

const CreateAlertRuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  config: AlertRuleConfigSchema,
  delivery: AlertDeliverySchema,
})

export type CreateAlertRuleInput = z.infer<typeof CreateAlertRuleSchema>

export async function createAlertRule(userId: string, input: CreateAlertRuleInput): Promise<AlertRule> {
  const parsed = CreateAlertRuleSchema.parse(input)

  const result = await db
    .insert(alertRules)
    .values({
      userId,
      name: parsed.name,
      description: parsed.description,
      config: parsed.config as AlertRuleConfig,
      delivery: parsed.delivery as AlertDelivery,
      enabled: true,
    })
    .returning()

  return result[0]
}

export async function getAlertRules(userId: string): Promise<AlertRule[]> {
  return db
    .select()
    .from(alertRules)
    .where(and(eq(alertRules.userId, userId), eq(alertRules.archived, false)))
    .orderBy(desc(alertRules.createdAt))
}

export async function getAlertRule(userId: string, ruleId: string): Promise<AlertRule | undefined> {
  const result = await db
    .select()
    .from(alertRules)
    .where(and(eq(alertRules.id, ruleId), eq(alertRules.userId, userId)))
    .limit(1)

  return result[0]
}

export async function updateAlertRule(
  userId: string,
  ruleId: string,
  input: Partial<CreateAlertRuleInput>
): Promise<AlertRule> {
  const parsed = CreateAlertRuleSchema.partial().parse(input)

  const result = await db
    .update(alertRules)
    .set({
      ...parsed,
      config: parsed.config as AlertRuleConfig | undefined,
      delivery: parsed.delivery as AlertDelivery | undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(alertRules.id, ruleId), eq(alertRules.userId, userId)))
    .returning()

  return result[0]
}

export async function toggleAlertRule(userId: string, ruleId: string): Promise<AlertRule> {
  const rule = await getAlertRule(userId, ruleId)
  if (!rule) throw new Error('Alert rule not found')

  const result = await db
    .update(alertRules)
    .set({
      enabled: !rule.enabled,
      updatedAt: new Date(),
    })
    .where(and(eq(alertRules.id, ruleId), eq(alertRules.userId, userId)))
    .returning()

  return result[0]
}

export async function archiveAlertRule(userId: string, ruleId: string): Promise<AlertRule> {
  const result = await db
    .update(alertRules)
    .set({
      archived: true,
      updatedAt: new Date(),
    })
    .where(and(eq(alertRules.id, ruleId), eq(alertRules.userId, userId)))
    .returning()

  return result[0]
}

export async function deleteAlertRule(userId: string, ruleId: string): Promise<void> {
  await db.delete(alertRules).where(and(eq(alertRules.id, ruleId), eq(alertRules.userId, userId)))
}

export async function getAlertHistory(userId: string, limit: number = 50): Promise<typeof alertHistory.$inferSelect[]> {
  return db
    .select()
    .from(alertHistory)
    .where(eq(alertHistory.userId, userId))
    .orderBy(desc(alertHistory.createdAt))
    .limit(limit)
}

export async function logAlert(
  userId: string,
  ruleId: string,
  type: string,
  content: Record<string, unknown>,
  edgeId?: string,
  gameId?: string
): Promise<typeof alertHistory.$inferSelect> {
  const result = await db
    .insert(alertHistory)
    .values({
      userId,
      ruleId,
      edgeId,
      gameId,
      type,
      content,
      deliveryStatus: 'pending',
    })
    .returning()

  return result[0]
}

export async function updateAlertDeliveryStatus(
  alertId: string,
  status: 'sent' | 'failed',
  errorMessage?: string
): Promise<void> {
  await db
    .update(alertHistory)
    .set({
      deliveryStatus: status,
      deliveredAt: new Date(),
      errorMessage,
    })
    .where(eq(alertHistory.id, alertId))
}
