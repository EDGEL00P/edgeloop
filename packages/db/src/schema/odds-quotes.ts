import { pgTable, uuid, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { markets } from './markets'

export const oddsQuotes = pgTable(
  'odds_quotes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    marketId: uuid('market_id')
      .references(() => markets.id, { onDelete: 'cascade' })
      .notNull(),
    bookId: integer('book_id'), // Reference to books table (or vendor name)
    bookName: varchar('book_name', { length: 50 }), // e.g., 'draftkings', 'fanduel'
    priceAmerican: integer('price_american').notNull(), // American odds format
    ts: timestamp('ts', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('odds_quotes_market_book_idx').on(table.marketId, table.bookName),
    index('odds_quotes_ts_idx').on(table.ts),
  ]
)

export type OddsQuote = typeof oddsQuotes.$inferSelect
export type NewOddsQuote = typeof oddsQuotes.$inferInsert
