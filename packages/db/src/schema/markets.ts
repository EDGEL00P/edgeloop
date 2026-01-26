import { pgTable, uuid, varchar, decimal, timestamp, index } from 'drizzle-orm/pg-core'
import { games } from './games'

export const markets = pgTable(
  'markets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    gameId: uuid('game_id')
      .references(() => games.id, { onDelete: 'cascade' })
      .notNull(),
    type: varchar('type', { length: 20 }).notNull(), // 'moneyline', 'spread', 'total'
    line: decimal('line', { precision: 5, scale: 2 }), // For spread/total
    outcome: varchar('outcome', { length: 20 }), // 'home', 'away', 'over', 'under'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('markets_game_type_idx').on(table.gameId, table.type),
  ]
)

export type Market = typeof markets.$inferSelect
export type NewMarket = typeof markets.$inferInsert
