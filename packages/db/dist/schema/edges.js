import { pgTable, uuid, varchar, decimal, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { markets } from './markets';
export const edges = pgTable('edges', {
    id: uuid('id').defaultRandom().primaryKey(),
    marketId: uuid('market_id')
        .references(() => markets.id, { onDelete: 'cascade' })
        .notNull(),
    type: varchar('type', { length: 20 }), // 'ev', 'arbitrage', 'middle'
    bookIds: jsonb('book_ids').$type(),
    bookNames: jsonb('book_names').$type(),
    ev: decimal('ev', { precision: 5, scale: 4 }), // Expected value as decimal
    kelly: decimal('kelly_fraction', { precision: 5, scale: 4 }), // Kelly criterion fraction
    rationale: jsonb('rationale').$type(), // Feature importance, SHAP values, etc.
    detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('edges_market_type_idx').on(table.marketId, table.type),
    index('edges_detected_at_idx').on(table.detectedAt),
]);
