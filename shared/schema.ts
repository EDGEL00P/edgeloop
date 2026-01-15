import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export auth models (users, sessions)
export * from "./models/auth";

export const nflTeams = pgTable("nfl_teams", {
  id: integer("id").primaryKey(),
  conference: text("conference").notNull(),
  division: text("division").notNull(),
  location: text("location").notNull(),
  name: text("name").notNull(),
  fullName: text("full_name").notNull(),
  abbreviation: text("abbreviation").notNull(),
});

export const insertNflTeamSchema = createInsertSchema(nflTeams);
export type InsertNflTeam = z.infer<typeof insertNflTeamSchema>;
export type NflTeam = typeof nflTeams.$inferSelect;

export const nflPlayers = pgTable("nfl_players", {
  id: integer("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  position: text("position"),
  positionAbbreviation: text("position_abbreviation"),
  height: text("height"),
  weight: text("weight"),
  jerseyNumber: text("jersey_number"),
  college: text("college"),
  experience: text("experience"),
  age: integer("age"),
  teamId: integer("team_id"),
});

export const insertNflPlayerSchema = createInsertSchema(nflPlayers);
export type InsertNflPlayer = z.infer<typeof insertNflPlayerSchema>;
export type NflPlayer = typeof nflPlayers.$inferSelect;

export const nflGames = pgTable("nfl_games", {
  id: integer("id").primaryKey(),
  date: text("date").notNull(),
  season: integer("season").notNull(),
  week: integer("week").notNull(),
  status: text("status"),
  homeTeamId: integer("home_team_id").notNull(),
  visitorTeamId: integer("visitor_team_id").notNull(),
  homeTeamScore: integer("home_team_score"),
  visitorTeamScore: integer("visitor_team_score"),
  venue: text("venue"),
  time: text("time"),
});

export const insertNflGameSchema = createInsertSchema(nflGames);
export type InsertNflGame = z.infer<typeof insertNflGameSchema>;
export type NflGame = typeof nflGames.$inferSelect;

export const weeklyMetrics = pgTable("weekly_metrics", {
  id: text("id").primaryKey(),
  week: integer("week").notNull(),
  season: integer("season").notNull(),
  teamId: integer("team_id").notNull(),
  epaPerPlay: real("epa_per_play"),
  successRate: real("success_rate"),
  cpoe: real("cpoe"),
  hdPressureRate: real("hd_pressure_rate"),
  redZoneEpa: real("red_zone_epa"),
  vigFreePercent: real("vig_free_percent"),
  isLucky: boolean("is_lucky").default(false),
  injuryImpact: real("injury_impact"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWeeklyMetricsSchema = createInsertSchema(weeklyMetrics).omit({ updatedAt: true });
export type InsertWeeklyMetrics = z.infer<typeof insertWeeklyMetricsSchema>;
export type WeeklyMetrics = typeof weeklyMetrics.$inferSelect;

export const exploitSignals = pgTable("exploit_signals", {
  id: text("id").primaryKey(),
  week: integer("week").notNull(),
  season: integer("season").notNull(),
  gameId: integer("game_id"),
  signalType: text("signal_type").notNull(),
  description: text("description").notNull(),
  confidence: real("confidence").notNull(),
  status: text("status").notNull(),
  thresholdMet: boolean("threshold_met").default(false),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertExploitSignalSchema = createInsertSchema(exploitSignals).omit({ createdAt: true });
export type InsertExploitSignal = z.infer<typeof insertExploitSignalSchema>;
export type ExploitSignal = typeof exploitSignals.$inferSelect;

export const lineMovements = pgTable("line_movements", {
  id: text("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  openingSpread: real("opening_spread"),
  currentSpread: real("current_spread"),
  openingTotal: real("opening_total"),
  currentTotal: real("current_total"),
  steamMove: boolean("steam_move").default(false),
  trapLine: boolean("trap_line").default(false),
  keyNumberCrossed: boolean("key_number_crossed").default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLineMovementSchema = createInsertSchema(lineMovements).omit({ updatedAt: true });
export type InsertLineMovement = z.infer<typeof insertLineMovementSchema>;
export type LineMovement = typeof lineMovements.$inferSelect;

export const weatherConditions = pgTable("weather_conditions", {
  id: text("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  windSpeed: integer("wind_speed"),
  temperature: integer("temperature"),
  precipitation: text("precipitation"),
  passingDecay: boolean("passing_decay").default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWeatherConditionSchema = createInsertSchema(weatherConditions).omit({ updatedAt: true });
export type InsertWeatherCondition = z.infer<typeof insertWeatherConditionSchema>;
export type WeatherCondition = typeof weatherConditions.$inferSelect;

export const dataImports = pgTable("data_imports", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  rows: integer("rows").notNull(),
  columns: jsonb("columns").notNull().$type<string[]>(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  status: text("status").notNull(),
});

export const insertDataImportSchema = createInsertSchema(dataImports).omit({ lastUpdated: true });
export type InsertDataImport = z.infer<typeof insertDataImportSchema>;
export type DataImport = typeof dataImports.$inferSelect;

// Export chat models from the single source of truth.
export * from "./models/chat";

export const historicalGames = pgTable("historical_games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameDate: text("game_date").notNull(),
  season: integer("season").notNull(),
  week: text("week").notNull(),
  isPlayoff: boolean("is_playoff").default(false),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  favoriteTeam: text("favorite_team"),
  spread: real("spread"),
  overUnder: real("over_under"),
  stadium: text("stadium"),
  isNeutral: boolean("is_neutral").default(false),
  temperature: real("temperature"),
  windMph: real("wind_mph"),
  humidity: real("humidity"),
  weatherDetail: text("weather_detail"),
  spreadResult: text("spread_result"),
  totalResult: text("total_result"),
  homeMargin: integer("home_margin"),
  totalPoints: integer("total_points"),
});

export const insertHistoricalGameSchema = createInsertSchema(historicalGames);
export type InsertHistoricalGame = z.infer<typeof insertHistoricalGameSchema>;
export type HistoricalGame = typeof historicalGames.$inferSelect;

export const PropTypeEnum = z.enum([
  'passing_yards',
  'rushing_yards', 
  'receiving_yards',
  'touchdowns',
  'receptions',
  'completions',
  'interceptions',
  'passing_tds',
  'rushing_tds',
  'receiving_tds',
  'sacks',
  'tackles',
  'assists'
]);
export type PropType = z.infer<typeof PropTypeEnum>;

export const playerProps = pgTable("player_props", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: integer("game_id").notNull(),
  playerId: integer("player_id").notNull(),
  playerName: text("player_name").notNull(),
  teamAbbreviation: text("team_abbreviation").notNull(),
  position: text("position"),
  propType: text("prop_type").notNull(),
  line: real("line").notNull(),
  overOdds: integer("over_odds").notNull(),
  underOdds: integer("under_odds").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPlayerPropSchema = createInsertSchema(playerProps).omit({ id: true, createdAt: true });
export type InsertPlayerProp = z.infer<typeof insertPlayerPropSchema>;
export type PlayerProp = typeof playerProps.$inferSelect;

export interface PlayerPropSelection {
  id: string;
  playerId: number;
  playerName: string;
  teamAbbreviation: string;
  position?: string;
  propType: PropType;
  line: number;
  selection: 'over' | 'under';
  odds: number;
  category: string;
}

export interface CorrelationLeg {
  id: string;
  description: string;
  player_id?: number;
  team?: string;
  stat_type: string;
  odds: number;
}

export interface CorrelationResult {
  is_positive_definite: boolean;
  sgm_adjustment: number;
  fair_odds_multiplier: number;
  leg_correlations: Array<{
    leg1: string;
    leg2: string;
    correlation: number;
  }>;
  eigenvalues: number[];
}

export interface KellyResult {
  full_kelly: number;
  half_kelly: number;
  quarter_kelly: number;
  recommended_stake: number;
  recommended_fraction: string;
  edge: number;
  edge_percent: string;
  implied_probability: number;
  true_probability: number;
  roi_expected: number;
  risk_of_ruin: number;
  is_approved: boolean;
  rejection_reason: string | null;
}
