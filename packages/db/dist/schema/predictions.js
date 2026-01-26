import { pgTable, uuid, varchar, decimal, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { games } from './games';
export const predictions = pgTable('predictions', {
    id: uuid('id').defaultRandom().primaryKey(),
    gameId: uuid('game_id')
        .references(() => games.id, { onDelete: 'cascade' })
        .notNull(),
    modelVersion: varchar('model_version', { length: 50 }).notNull(),
    winProbHome: decimal('win_prob_home', { precision: 5, scale: 4 }).notNull(),
    winProbAway: decimal('win_prob_away', { precision: 5, scale: 4 }).notNull(),
    confidence: decimal('confidence', { precision: 5, scale: 4 }).notNull(),
    predictedSpread: decimal('predicted_spread', { precision: 5, scale: 2 }),
    predictedTotal: decimal('predicted_total', { precision: 5, scale: 2 }),
    edgeHomeMoneyline: decimal('edge_home_ml', { precision: 5, scale: 4 }),
    edgeAwayMoneyline: decimal('edge_away_ml', { precision: 5, scale: 4 }),
    edgeSpreadHome: decimal('edge_spread_home', { precision: 5, scale: 4 }),
    edgeOver: decimal('edge_over', { precision: 5, scale: 4 }),
    edgeUnder: decimal('edge_under', { precision: 5, scale: 4 }),
    features: jsonb('features').$type(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('pred_game_model_idx').on(table.gameId, table.modelVersion),
    index('pred_created_at_idx').on(table.createdAt),
]);
