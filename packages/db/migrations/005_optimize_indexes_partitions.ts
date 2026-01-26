import { sql } from 'drizzle-orm'
import type { Migration } from 'drizzle-orm/migrator'

/**
 * Migration: Add optimized indexes and partitioning for production performance
 * 
 * Optimizations:
 * 1. Composite indexes on commonly filtered columns
 * 2. Time-series indexes for temporal queries
 * 3. Full-text search indexes for team/player names
 * 4. Foreign key indexes for joins
 * 5. Hash partitioning on high-volume tables
 */

export const up = async (db: any) => {
  // ==========================================
  // Composite Indexes for Common Queries
  // ==========================================

  // Games table: season/week filters
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_games_season_week 
        ON games(season, week) 
        WHERE archived = false`
  )

  // Games table: date range queries
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_games_date_season 
        ON games(date DESC, season)
        WHERE archived = false`
  )

  // Games table: team lookups
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_games_teams 
        ON games(home_team_id, away_team_id)
        INCLUDE (season, week, status)`
  )

  // Odds table: market lookups with timestamp
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_odds_game_market_ts 
        ON odds(game_id, market_id, book_id, timestamp DESC)
        INCLUDE (spread, moneyline, total_points)`
  )

  // Odds table: recent quotes for real-time updates
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_odds_book_recent 
        ON odds(book_id, timestamp DESC)
        WHERE timestamp > NOW() - INTERVAL '24 hours'`
  )

  // Edges table: type and score filtering
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_edges_type_score 
        ON edges(game_id, (metadata->>'type'), (metadata->>'score')::numeric DESC)
        WHERE archived = false`
  )

  // Edges table: detection time
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_edges_created_at 
        ON edges(created_at DESC)
        WHERE archived = false
        INCLUDE (game_id, metadata)`
  )

  // Predictions table: user access patterns
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_predictions_user_season 
        ON predictions(user_id, season, week DESC)
        WHERE archived = false`
  )

  // ==========================================
  // Full-Text Search Indexes
  // ==========================================

  // Teams: searchable names and abbreviations
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_teams_fts 
        ON teams USING GIN (to_tsvector('english', name || ' ' || COALESCE(abbreviation, '')))`
  )

  // Injuries: searchable player names and teams
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_injuries_fts 
        ON injuries USING GIN (to_tsvector('english', player_name || ' ' || team_id))`
  )

  // ==========================================
  // Foreign Key Indexes (for JOIN performance)
  // ==========================================

  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_games_home_team_id 
        ON games(home_team_id)`
  )

  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_games_away_team_id 
        ON games(away_team_id)`
  )

  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_odds_game_id 
        ON odds(game_id)`
  )

  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_odds_market_id 
        ON odds(market_id)`
  )

  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS idx_edges_game_id 
        ON edges(game_id)`
  )

  // ==========================================
  // Partitioning Strategy (Time-Series)
  // ==========================================

  // Create partitioned table for odds_quotes (high volume)
  // Partition by month for efficient time-range queries
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS odds_quotes_partitioned (
      LIKE odds INCLUDING ALL
    ) PARTITION BY RANGE (DATE_TRUNC('month', timestamp))`
  )

  // Create monthly partitions for 2 years of data
  const now = new Date()
  for (let i = 24; i >= 0; i--) {
    const date = new Date(now)
    date.setMonth(date.getMonth() - i)
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1)

    const partitionName = `odds_quotes_${monthStart.getFullYear()}_${String(monthStart.getMonth() + 1).padStart(2, '0')}`

    await db.execute(
      sql`CREATE TABLE IF NOT EXISTS ${sql.identifier([partitionName])} 
          PARTITION OF odds_quotes_partitioned
          FOR VALUES FROM (${sql.raw(`'${monthStart.toISOString()}'`)}) TO (${sql.raw(`'${monthEnd.toISOString()}'`)})`
    )
  }

  // ==========================================
  // Statistics & Query Optimization
  // ==========================================

  // Analyze main tables for query planner
  await db.execute(sql`ANALYZE games`)
  await db.execute(sql`ANALYZE odds`)
  await db.execute(sql`ANALYZE edges`)
  await db.execute(sql`ANALYZE predictions`)

  // ==========================================
  // Connection Pool Configuration
  // ==========================================

  // Create a connection pooling comment (document for PgBouncer config)
  await db.execute(
    sql`COMMENT ON SCHEMA public IS 'Edgeloop database - use PgBouncer with pool_mode=transaction, max_client_conn=1000, default_pool_size=50'`
  )
}

export const down = async (db: any) => {
  // Drop all created indexes
  const indexes = [
    'idx_games_season_week',
    'idx_games_date_season',
    'idx_games_teams',
    'idx_odds_game_market_ts',
    'idx_odds_book_recent',
    'idx_edges_type_score',
    'idx_edges_created_at',
    'idx_predictions_user_season',
    'idx_teams_fts',
    'idx_injuries_fts',
    'idx_games_home_team_id',
    'idx_games_away_team_id',
    'idx_odds_game_id',
    'idx_odds_market_id',
    'idx_edges_game_id',
  ]

  for (const idx of indexes) {
    await db.execute(sql`DROP INDEX IF EXISTS ${sql.identifier([idx])}`)
  }

  // Drop partitioned table
  await db.execute(sql`DROP TABLE IF EXISTS odds_quotes_partitioned`)
}
