import { pgTable, uuid, varchar, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { teams } from './teams'

export const gameStatus = ['scheduled', 'pregame', 'in_progress', 'halftime', 'final', 'postponed', 'cancelled'] as const
export type GameStatus = (typeof gameStatus)[number]

export const gameType = ['preseason', 'regular', 'wildcard', 'divisional', 'conference', 'superbowl'] as const
export type GameType = (typeof gameType)[number]

export type WeatherInfo = {
  temperature?: number
  windSpeed?: number
  windDirection?: string
  precipitation?: number
  humidity?: number
  isDome?: boolean
}

export const games = pgTable(
  'games',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    externalId: varchar('external_id', { length: 100 }).unique(),
    season: integer('season').notNull(),
    week: integer('week').notNull(),
    gameType: varchar('game_type', { length: 20 }).notNull().$type<GameType>(),

    homeTeamId: integer('home_team_id')
      .references(() => teams.id)
      .notNull(),
    awayTeamId: integer('away_team_id')
      .references(() => teams.id)
      .notNull(),

    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    kickoffAt: timestamp('kickoff_at', { withTimezone: true }),

    status: varchar('status', { length: 20 }).notNull().default('scheduled').$type<GameStatus>(),

    homeScore: integer('home_score'),
    awayScore: integer('away_score'),
    quarter: integer('quarter'),
    timeRemaining: varchar('time_remaining', { length: 10 }),
    possession: varchar('possession', { length: 10 }),

    venue: varchar('venue', { length: 100 }),
    weather: jsonb('weather').$type<WeatherInfo>(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('games_season_week_idx').on(table.season, table.week),
    index('games_scheduled_at_idx').on(table.scheduledAt),
    index('games_status_idx').on(table.status),
  ]
)

export type Game = typeof games.$inferSelect
export type NewGame = typeof games.$inferInsert
