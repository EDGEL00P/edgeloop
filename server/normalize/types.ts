/**
 * Normalized game representation used across all data sources.
 * This provides a consistent interface regardless of the upstream API.
 */
export interface NormalizedGame {
  /** Unique matchup key: `{season}-{week}-{away}@{home}` */
  key: string;
  /** Original game ID from the data source */
  sourceGameId?: string;
  /** Data source identifier (e.g., "sportradar", "espn") */
  source: string;
  /** NFL season year */
  season: number;
  /** Week number (1-18 for regular season) */
  week: number;
  /** ISO 8601 scheduled game time */
  scheduled?: string;
  /** Home team abbreviation (e.g., "KC") */
  homeAbbr?: string;
  /** Away team abbreviation (e.g., "BUF") */
  awayAbbr?: string;
  /** Home team full display name */
  homeName?: string;
  /** Away team full display name */
  awayName?: string;
  /** Home team score (null if game hasn't started) */
  homeScore?: number | null;
  /** Away team score (null if game hasn't started) */
  awayScore?: number | null;
  /** Game status (e.g., "scheduled", "in_progress", "final") */
  status?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sportradar API Response Types
// ─────────────────────────────────────────────────────────────────────────────

/** Sportradar team object within a game */
export interface SportradarTeam {
  id?: string;
  alias?: string;
  market?: string;
  name?: string;
}

/** Sportradar scoring object */
export interface SportradarScoring {
  home_points?: number;
  away_points?: number;
}

/** Sportradar game object */
export interface SportradarGame {
  id?: string;
  scheduled?: string;
  status?: string;
  home?: SportradarTeam;
  away?: SportradarTeam;
  scoring?: SportradarScoring;
  home_points?: number;
  away_points?: number;
}

/** Sportradar schedule response */
export interface SportradarScheduleResponse {
  week?: { games?: SportradarGame[] };
  games?: SportradarGame[];
}

// ─────────────────────────────────────────────────────────────────────────────
// ESPN API Response Types
// ─────────────────────────────────────────────────────────────────────────────

/** ESPN team object */
export interface EspnTeam {
  id?: string;
  abbreviation?: string;
  displayName?: string;
}

/** ESPN competitor (team in a game) */
export interface EspnCompetitor {
  homeAway?: "home" | "away";
  team?: EspnTeam;
  score?: string | number;
}

/** ESPN competition (single game) */
export interface EspnCompetition {
  competitors?: EspnCompetitor[];
  venue?: { fullName?: string };
}

/** ESPN game status */
export interface EspnStatus {
  type?: { name?: string };
}

/** ESPN event (game wrapper) */
export interface EspnEvent {
  id?: string;
  date?: string;
  competitions?: EspnCompetition[];
  status?: EspnStatus;
}

/** ESPN scoreboard response */
export interface EspnScoreboardResponse {
  events?: EspnEvent[];
}
