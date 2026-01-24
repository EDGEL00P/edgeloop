import { pgTable, uuid, varchar, integer, decimal, timestamp, index } from 'drizzle-orm/pg-core'
import { games } from './games'

export const oddsSnapshots = pgTable(
  'odds_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    gameId: uuid('game_id')
      .references(() => games.id, { onDelete: 'cascade' })
      .notNull(),
    provider: varchar('provider', { length: 50 }).notNull(),

    moneylineHome: integer('moneyline_home'),
    moneylineAway: integer('moneyline_away'),

    spreadHome: decimal('spread_home', { precision: 4, scale: 1 }),
    spreadHomeOdds: integer('spread_home_odds'),
    spreadAwayOdds: integer('spread_away_odds'),

    totalPoints: decimal('total_points', { precision: 4, scale: 1 }),
    overOdds: integer('over_odds'),
    underOdds: integer('under_odds'),

    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('odds_game_provider_idx').on(table.gameId, table.provider),
    index('odds_fetched_at_idx').on(table.fetchedAt),
  ]
)

export type OddsSnapshot = typeof oddsSnapshots.$inferSelect
export type NewOddsSnapshot = typeof oddsSnapshots.$inferInsert
