import { pgTable, uuid, varchar, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { games } from './games';
import { users } from './users';
export const alertSeverity = ['info', 'warn', 'crit'];
export const alertType = [
    'drift_detected',
    'odds_movement',
    'game_update',
    'model_degradation',
    'system',
    'edge_opportunity',
];
export const alerts = pgTable('alerts', {
    id: uuid('id').defaultRandom().primaryKey(),
    severity: varchar('severity', { length: 10 }).notNull().$type(),
    type: varchar('type', { length: 50 }).notNull().$type(),
    title: varchar('title', { length: 200 }).notNull(),
    detail: text('detail'),
    gameId: uuid('game_id').references(() => games.id, { onDelete: 'set null' }),
    modelVersion: varchar('model_version', { length: 50 }),
    metadata: jsonb('metadata').$type(),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    acknowledgedBy: uuid('acknowledged_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('alerts_severity_idx').on(table.severity),
    index('alerts_type_idx').on(table.type),
    index('alerts_created_at_idx').on(table.createdAt),
    index('alerts_acknowledged_at_idx').on(table.acknowledgedAt),
]);
