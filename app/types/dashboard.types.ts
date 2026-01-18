/**
 * Dashboard Type Definitions
 * 
 * Centralized type definitions for the dashboard module.
 * Following godmode rules: use interfaces, readonly where applicable.
 * 
 * @module app/types/dashboard.types
 */

/**
 * Health status from API health check
 */
export interface HealthStatus {
  readonly status?: string;
  readonly timestamp?: string;
}

/**
 * News item from RSS feeds
 */
export interface NewsItem {
  readonly title?: string;
  readonly source?: string;
  readonly pubDate?: string;
  readonly link?: string;
}

/**
 * Odds API response structure
 */
export interface OddsResponse {
  readonly games?: readonly unknown[];
}

/**
 * Odds game data
 */
export interface OddsGame {
  readonly commenceTime?: string;
  readonly consensus?: {
    readonly total?: number;
    readonly spread?: number;
    readonly homeMoneyline?: number;
    readonly awayMoneyline?: number;
  } | null;
}

/**
 * Exploit signal from analytics engine
 */
export interface ExploitSignal {
  readonly id?: string;
  readonly gameId?: number;
  readonly type?: string;
  readonly signal?: string;
  readonly name?: string;
  readonly category?: string;
  readonly confidence?: number;
  readonly direction?: "home" | "away" | "over" | "under" | "neutral";
  readonly edge?: number;
  readonly risk?: number;
  readonly description?: string;
}

/**
 * Exploit summary statistics
 */
export interface ExploitSummary {
  readonly totalExploits: number;
  readonly highConfidence: number;
  readonly categories: Readonly<Record<string, number>>;
  readonly primaryDirection: "home" | "away" | "over" | "under" | "neutral";
  readonly combinedEdge: number;
}

/**
 * Injury record from data sources
 */
export interface InjuryRecord {
  readonly player?: string;
  readonly team?: string;
  readonly position?: string;
  readonly status?: string;
}

/**
 * Team information
 */
export interface Team {
  readonly id: number;
  readonly abbreviation?: string;
  readonly name?: string;
  readonly fullName?: string;
  readonly location?: string;
}

/**
 * Game/matchup information
 */
export interface Game {
  readonly id: number;
  readonly date?: string;
  readonly season?: number;
  readonly week?: number;
  readonly status?: string | null;
  readonly homeTeamId?: number;
  readonly visitorTeamId?: number;
  readonly homeTeamScore?: number | null;
  readonly visitorTeamScore?: number | null;
  readonly venue?: string | null;
  readonly time?: string | null;
}

/**
 * Scoreboard card display data
 */
export interface ScoreboardCard {
  readonly away: string;
  readonly home: string;
  readonly status: string;
  readonly time: string;
  readonly spread: string;
  readonly total: string;
  readonly scoreAway?: number | null;
  readonly scoreHome?: number | null;
}

/**
 * Chart data point
 */
export interface ChartDataPoint {
  readonly label: string;
  readonly value: number;
}

/**
 * Edge/Risk data point
 */
export interface EdgeRiskDataPoint {
  readonly label: string;
  readonly edge: number;
  readonly risk: number;
}

/**
 * Fetch result wrapper for API calls
 */
export interface FetchResult<T> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: string;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  readonly ok: boolean;
  readonly data?: HealthStatus;
  readonly error?: string;
}

/**
 * Dashboard component props
 * 
 * Note: Arrays are mutable here to allow for component state updates,
 * but should be treated as readonly by the component.
 */
export interface DashboardProps {
  readonly health: HealthCheckResult;
  readonly newsItems: NewsItem[];
  readonly oddsCount: number;
  readonly scoreboard: ScoreboardCard[];
  readonly tickerItems: string[];
  readonly apiBase: string;
  readonly season: number;
  readonly week: number;
  readonly newsError?: string;
  readonly oddsError?: string;
  readonly gamesError?: string;
  readonly exploits: ExploitSignal[];
  readonly exploitSummary?: ExploitSummary;
  readonly injuries: InjuryRecord[];
  readonly oddsTrend?: ChartDataPoint[];
  readonly teamStats?: ChartDataPoint[];
  readonly edgeRisk?: EdgeRiskDataPoint[];
  readonly exploitsError?: string;
  readonly injuriesError?: string;
}

/**
 * Chart component props
 */
export interface ChartProps {
  readonly oddsTrend: readonly ChartDataPoint[];
  readonly teamStats: readonly ChartDataPoint[];
  readonly edgeRisk: readonly EdgeRiskDataPoint[];
}