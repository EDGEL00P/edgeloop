import { pgTable, uuid, varchar, text, timestamp, jsonb, index, boolean } from 'drizzle-orm/pg-core'
import { games } from './games'
import { users } from './users'
import { edges } from './edges'

export const alertSeverity = ['info', 'warn', 'crit'] as const
export type AlertSeverity = (typeof alertSeverity)[number]

export const alertType = [
  'drift_detected',
  'odds_movement',
  'game_update',
  'model_degradation',
  'system',
  'edge_opportunity',
] as const
export type AlertType = (typeof alertType)[number]

export type AlertMetadata = Record<string, unknown>

export const alerts = pgTable(
  'alerts',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    severity: varchar('severity', { length: 10 }).notNull().$type<AlertSeverity>(),
    type: varchar('type', { length: 50 }).notNull().$type<AlertType>(),

    title: varchar('title', { length: 200 }).notNull(),
    detail: text('detail'),

    gameId: uuid('game_id').references(() => games.id, { onDelete: 'set null' }),
    modelVersion: varchar('model_version', { length: 50 }),

    metadata: jsonb('metadata').$type<AlertMetadata>(),

    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    acknowledgedBy: uuid('acknowledged_by').references(() => users.id, { onDelete: 'set null' }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('alerts_severity_idx').on(table.severity),
    index('alerts_type_idx').on(table.type),
    index('alerts_created_at_idx').on(table.createdAt),
    index('alerts_acknowledged_at_idx').on(table.acknowledgedAt),
  ]
)

export type Alert = typeof alerts.$inferSelect
export type NewAlert = typeof alerts.$inferInsert

// Alert rule configuration types
export type AlertRuleConfig = {
  type: 'ev' | 'arbitrage' | 'middle' | 'line_movement' | 'injury'
  minEV?: number
  teams?: string[]
  books?: string[]
  lineMovementThreshold?: number
  quietHours?: { start: string; end: string }
  maxAlertsPerDay?: number
}

export type AlertDelivery = {
  email?: boolean
  slack?: boolean
  discord?: boolean
  webhook?: string
}

// Alert rules table - user-defined alert configurations
export const alertRules = pgTable(
  'alert_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    config: jsonb('config').notNull().$type<AlertRuleConfig>(),
    delivery: jsonb('delivery').notNull().$type<AlertDelivery>(),
    enabled: boolean('enabled').notNull().default(true),
    archived: boolean('archived').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('alert_rules_user_id_idx').on(table.userId),
    index('alert_rules_enabled_idx').on(table.enabled),
  ]
)

export type AlertRule = typeof alertRules.$inferSelect
export type NewAlertRule = typeof alertRules.$inferInsert

// Alert history table - record of sent alerts
export const alertHistory = pgTable(
  'alert_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    ruleId: uuid('rule_id').references(() => alertRules.id, { onDelete: 'set null' }),
    edgeId: uuid('edge_id').references(() => edges.id, { onDelete: 'set null' }),
    gameId: uuid('game_id').references(() => games.id, { onDelete: 'set null' }),
    type: varchar('type', { length: 50 }).notNull(),
    content: jsonb('content').notNull().$type<Record<string, unknown>>(),
    deliveryStatus: varchar('delivery_status', { length: 20 }).notNull().default('pending'),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('alert_history_user_id_idx').on(table.userId),
    index('alert_history_rule_id_idx').on(table.ruleId),
    index('alert_history_created_at_idx').on(table.createdAt),
  ]
)

export type AlertHistoryEntry = typeof alertHistory.$inferSelect
export type NewAlertHistoryEntry = typeof alertHistory.$inferInsert
