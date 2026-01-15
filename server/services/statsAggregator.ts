import {
  NFL_STATS_SOURCES,
  getStatSourcesByCategory,
  fetchStatSource
} from "./statsSources";
import { db } from "../db";
import { nflPlayers, weeklyMetrics, nflTeams } from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { logger } from "../infrastructure/logger";

type StatValue = number | string | boolean | null;
type StatRecord = Record<string, StatValue>;
type UnknownRecord = Record<string, unknown>;
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface PlayerStatLine {
  playerId: number;
  playerName: string;
  team: string;
  position: string;
  season: number;
  week?: number;
  stats: StatRecord;
  source: string;
  fetchedAt: Date;
}

export interface AggregatedPlayerStats {
  playerId: number;
  playerName: string;
  team: string;
  position: string;
  passing?: {
    attempts: number;
    completions: number;
    yards: number;
    touchdowns: number;
    interceptions: number;
    rating: number;
    epa: number;
    successRate: number;
    cpoe: number;
  };
  rushing?: {
    attempts: number;
    yards: number;
    touchdowns: number;
    yardsPerAttempt: number;
    epa: number;
    successRate: number;
  };
  receiving?: {
    targets: number;
    receptions: number;
    yards: number;
    touchdowns: number;
    yardsPerReception: number;
    epa: number;
    successRate: number;
  };
  defense?: {
    tackles: number;
    sacks: number;
    interceptions: number;
    passesDefended: number;
    forcedFumbles: number;
    tacklesForLoss: number;
  };
  specialTeams?: {
    fieldGoalsMade: number;
    fieldGoalsAttempted: number;
    extraPointsMade: number;
    extraPointsAttempted: number;
    punts: number;
    puntAverage: number;
    kickoffReturns: number;
    kickoffReturnYards: number;
    puntReturns: number;
    puntReturnYards: number;
  };
  advanced?: {
    expectedPointsAdded: number;
    completionPercentageOverExpected: number;
    airYards: number;
    averageTimeToThrow: number;
    catchRate: number;
    yardsAfterCatch: number;
    expectedCompletion: number;
  };
  nextGen?: {
    topSpeed: number;
    longestRun: number;
    longestPass: number;
    acceleration: number;
  };
}

export class StatsAggregator {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private cacheDuration = 60 * 60 * 1000; // 1 hour

  private getCacheKey(source: string, filters?: Record<string, string>): string {
    const filterStr = filters ? JSON.stringify(filters) : "";
    return `${source}:${filterStr}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data as T;
    }
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private isRecord(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null;
  }

  private readNumber(record: UnknownRecord, keys: string[], fallback = 0): number {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "number" && !Number.isNaN(value)) {
        return value;
      }
      if (typeof value === "string") {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) return parsed;
      }
    }
    return fallback;
  }

  private readString(record: UnknownRecord, keys: string[], fallback = ""): string {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" && value.trim().length > 0) {
        return value;
      }
    }
    return fallback;
  }

  private getSourceKeyByName(sourceName: string): string | null {
    const entry = Object.entries(NFL_STATS_SOURCES).find(([, source]) => source.name === sourceName);
    return entry ? entry[0] : null;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  async fetchAllPassingStats(season?: number): Promise<PlayerStatLine[]> {
    const sources = getStatSourcesByCategory("offense").filter(s =>
      s.name.toLowerCase().includes("passing")
    );

    const allStats: PlayerStatLine[] = [];

    for (const source of sources) {
      try {
        const filters = season ? { season: season.toString() } : undefined;
        const sourceKey = this.getSourceKeyByName(source.name);
        if (!sourceKey) {
          logger.warn({ type: "stats_source_missing", source: source.name });
          continue;
        }
        const data = await fetchStatSource(sourceKey, filters);

        const stats = this.normalizePassingStats(data, source.name);
        allStats.push(...stats);
      } catch (error) {
        logger.error({
          type: "stats_fetch_error",
          source: source.name,
          message: this.getErrorMessage(error),
        });
      }
    }

    return allStats;
  }

  async fetchAllRushingStats(season?: number): Promise<PlayerStatLine[]> {
    const sources = getStatSourcesByCategory("offense").filter(s =>
      s.name.toLowerCase().includes("rushing")
    );

    const allStats: PlayerStatLine[] = [];

    for (const source of sources) {
      try {
        const filters = season ? { season: season.toString() } : undefined;
        const sourceKey = this.getSourceKeyByName(source.name);
        if (!sourceKey) {
          logger.warn({ type: "stats_source_missing", source: source.name });
          continue;
        }
        const data = await fetchStatSource(sourceKey, filters);

        const stats = this.normalizeRushingStats(data, source.name);
        allStats.push(...stats);
      } catch (error) {
        logger.error({
          type: "stats_fetch_error",
          source: source.name,
          message: this.getErrorMessage(error),
        });
      }
    }

    return allStats;
  }

  async fetchAllReceivingStats(season?: number): Promise<PlayerStatLine[]> {
    const sources = getStatSourcesByCategory("offense").filter(s =>
      s.name.toLowerCase().includes("receiving")
    );

    const allStats: PlayerStatLine[] = [];

    for (const source of sources) {
      try {
        const filters = season ? { season: season.toString() } : undefined;
        const sourceKey = this.getSourceKeyByName(source.name);
        if (!sourceKey) {
          logger.warn({ type: "stats_source_missing", source: source.name });
          continue;
        }
        const data = await fetchStatSource(sourceKey, filters);

        const stats = this.normalizeReceivingStats(data, source.name);
        allStats.push(...stats);
      } catch (error) {
        logger.error({
          type: "stats_fetch_error",
          source: source.name,
          message: this.getErrorMessage(error),
        });
      }
    }

    return allStats;
  }

  async fetchAllDefenseStats(season?: number): Promise<PlayerStatLine[]> {
    const sources = getStatSourcesByCategory("defense");

    const allStats: PlayerStatLine[] = [];

    for (const source of sources) {
      try {
        const filters = season ? { season: season.toString() } : undefined;
        const sourceKey = this.getSourceKeyByName(source.name);
        if (!sourceKey) {
          logger.warn({ type: "stats_source_missing", source: source.name });
          continue;
        }
        const data = await fetchStatSource(sourceKey, filters);

        const stats = this.normalizeDefenseStats(data, source.name);
        allStats.push(...stats);
      } catch (error) {
        logger.error({
          type: "stats_fetch_error",
          source: source.name,
          message: this.getErrorMessage(error),
        });
      }
    }

    return allStats;
  }

  async fetchAllSpecialTeamsStats(season?: number): Promise<PlayerStatLine[]> {
    const sources = getStatSourcesByCategory("special_teams");

    const allStats: PlayerStatLine[] = [];

    for (const source of sources) {
      try {
        const filters = season ? { season: season.toString() } : undefined;
        const sourceKey = this.getSourceKeyByName(source.name);
        if (!sourceKey) {
          logger.warn({ type: "stats_source_missing", source: source.name });
          continue;
        }
        const data = await fetchStatSource(sourceKey, filters);

        const stats = this.normalizeSpecialTeamsStats(data, source.name);
        allStats.push(...stats);
      } catch (error) {
        logger.error({
          type: "stats_fetch_error",
          source: source.name,
          message: this.getErrorMessage(error),
        });
      }
    }

    return allStats;
  }

  async fetchNextGenStats(season?: number): Promise<PlayerStatLine[]> {
    const sources = getStatSourcesByCategory("advanced");

    const allStats: PlayerStatLine[] = [];

    for (const source of sources) {
      try {
        const filters = season ? { season: season.toString() } : undefined;
        const sourceKey = this.getSourceKeyByName(source.name);
        if (!sourceKey) {
          logger.warn({ type: "stats_source_missing", source: source.name });
          continue;
        }
        const data = await fetchStatSource(sourceKey, filters);

        const stats = this.normalizeNextGenStats(data, source.name);
        allStats.push(...stats);
      } catch (error) {
        logger.error({
          type: "stats_fetch_error",
          source: source.name,
          message: this.getErrorMessage(error),
        });
      }
    }

    return allStats;
  }

  async aggregatePlayerStats(
    playerId: number,
    season: number,
    week?: number
  ): Promise<AggregatedPlayerStats | null> {
    try {
      const player = await db.query.nflPlayers.findFirst({
        where: eq(nflPlayers.id, playerId)
      });

      if (!player) return null;

      const stats: AggregatedPlayerStats = {
        playerId: player.id,
        playerName: `${player.firstName} ${player.lastName}`,
        team: "",
        position: player.position || ""
      };

      if (player.teamId) {
        const teamData = await db.query.nflTeams.findFirst({
          where: eq(nflTeams.id, player.teamId)
        });
        if (teamData) {
          stats.team = teamData.abbreviation;
        }
      }

      const weekly = week ? await db.query.weeklyMetrics.findFirst({
        where: and(
          eq(weeklyMetrics.teamId, player.teamId || 0),
          eq(weeklyMetrics.week, week),
          eq(weeklyMetrics.season, season)
        )
      }) : null;

      if (weekly) {
        stats.advanced = {
          expectedPointsAdded: weekly.epaPerPlay || 0,
          completionPercentageOverExpected: weekly.cpoe || 0,
          airYards: 0,
          averageTimeToThrow: 0,
          catchRate: weekly.successRate || 0,
          yardsAfterCatch: 0,
          expectedCompletion: 0
        };
      }

      return stats;
    } catch (error) {
      logger.error({
        type: "stats_aggregate_error",
        playerId,
        message: this.getErrorMessage(error),
      });
      return null;
    }
  }

  async refreshAllStats(season: number): Promise<{
    totalPlayers: number;
    sources: string[];
    errors: string[];
  }> {
    const errors: string[] = [];
    const sources: string[] = [];

    try {
      const [passing, rushing, receiving, defense, specialTeams, nextGen] = await Promise.all([
        this.fetchAllPassingStats(season).catch((e: unknown) => {
          errors.push(`Passing: ${this.getErrorMessage(e)}`);
          return [];
        }),
        this.fetchAllRushingStats(season).catch((e: unknown) => {
          errors.push(`Rushing: ${this.getErrorMessage(e)}`);
          return [];
        }),
        this.fetchAllReceivingStats(season).catch((e: unknown) => {
          errors.push(`Receiving: ${this.getErrorMessage(e)}`);
          return [];
        }),
        this.fetchAllDefenseStats(season).catch((e: unknown) => {
          errors.push(`Defense: ${this.getErrorMessage(e)}`);
          return [];
        }),
        this.fetchAllSpecialTeamsStats(season).catch((e: unknown) => {
          errors.push(`Special Teams: ${this.getErrorMessage(e)}`);
          return [];
        }),
        this.fetchNextGenStats(season).catch((e: unknown) => {
          errors.push(`NextGen: ${this.getErrorMessage(e)}`);
          return [];
        })
      ]);

      const allStats = [
        ...passing,
        ...rushing,
        ...receiving,
        ...defense,
        ...specialTeams,
        ...nextGen
      ];

      const uniquePlayers = new Set(allStats.map(s => s.playerId));

      return {
        totalPlayers: uniquePlayers.size,
        sources: [...new Set(allStats.map(s => s.source))],
        errors
      };
    } catch (error) {
      logger.error({
        type: "stats_refresh_error",
        message: this.getErrorMessage(error),
      });
      throw error;
    }
  }

  private normalizePassingStats(data: unknown, source: string): PlayerStatLine[] {
    const stats: PlayerStatLine[] = [];

    if (Array.isArray(data)) {
      for (const player of data) {
        if (!this.isRecord(player)) continue;
        stats.push({
          playerId: this.readNumber(player, ["id", "playerId", "player_id"]),
          playerName: this.readString(player, ["name"], `${this.readString(player, ["firstName", "first_name"])} ${this.readString(player, ["lastName", "last_name"])}`.trim()),
          team: this.readString(player, ["team", "teamAbbr", "team_abbr"]),
          position: this.readString(player, ["position"], "QB"),
          season: this.readNumber(player, ["season"], new Date().getFullYear()),
          stats: {
            attempts: this.readNumber(player, ["attempts", "att"]),
            completions: this.readNumber(player, ["completions", "comp"]),
            yards: this.readNumber(player, ["yards", "yds"]),
            touchdowns: this.readNumber(player, ["touchdowns", "tds", "td"]),
            interceptions: this.readNumber(player, ["interceptions", "ints", "int"]),
            rating: this.readNumber(player, ["rating", "passRating"]),
          },
          source,
          fetchedAt: new Date()
        });
      }
    }

    return stats;
  }

  private normalizeRushingStats(data: unknown, source: string): PlayerStatLine[] {
    const stats: PlayerStatLine[] = [];

    if (Array.isArray(data)) {
      for (const player of data) {
        if (!this.isRecord(player)) continue;
        stats.push({
          playerId: this.readNumber(player, ["id", "playerId", "player_id"]),
          playerName: this.readString(player, ["name"], `${this.readString(player, ["firstName", "first_name"])} ${this.readString(player, ["lastName", "last_name"])}`.trim()),
          team: this.readString(player, ["team", "teamAbbr", "team_abbr"]),
          position: this.readString(player, ["position"], "RB"),
          season: this.readNumber(player, ["season"], new Date().getFullYear()),
          stats: {
            attempts: this.readNumber(player, ["attempts", "att"]),
            yards: this.readNumber(player, ["yards", "yds"]),
            touchdowns: this.readNumber(player, ["touchdowns", "tds", "td"]),
            yardsPerAttempt: this.readNumber(player, ["yardsPerAttempt", "ydsPerAtt", "ypa"]),
          },
          source,
          fetchedAt: new Date()
        });
      }
    }

    return stats;
  }

  private normalizeReceivingStats(data: unknown, source: string): PlayerStatLine[] {
    const stats: PlayerStatLine[] = [];

    if (Array.isArray(data)) {
      for (const player of data) {
        if (!this.isRecord(player)) continue;
        stats.push({
          playerId: this.readNumber(player, ["id", "playerId", "player_id"]),
          playerName: this.readString(player, ["name"], `${this.readString(player, ["firstName", "first_name"])} ${this.readString(player, ["lastName", "last_name"])}`.trim()),
          team: this.readString(player, ["team", "teamAbbr", "team_abbr"]),
          position: this.readString(player, ["position"], "WR"),
          season: this.readNumber(player, ["season"], new Date().getFullYear()),
          stats: {
            targets: this.readNumber(player, ["targets", "tgt"]),
            receptions: this.readNumber(player, ["receptions", "rec"]),
            yards: this.readNumber(player, ["yards", "yds"]),
            touchdowns: this.readNumber(player, ["touchdowns", "tds", "td"]),
            yardsPerReception: this.readNumber(player, ["yardsPerReception", "ydsPerRec", "ypRec"]),
          },
          source,
          fetchedAt: new Date()
        });
      }
    }

    return stats;
  }

  private normalizeDefenseStats(data: unknown, source: string): PlayerStatLine[] {
    const stats: PlayerStatLine[] = [];

    if (Array.isArray(data)) {
      for (const player of data) {
        if (!this.isRecord(player)) continue;
        stats.push({
          playerId: this.readNumber(player, ["id", "playerId", "player_id"]),
          playerName: this.readString(player, ["name"], `${this.readString(player, ["firstName", "first_name"])} ${this.readString(player, ["lastName", "last_name"])}`.trim()),
          team: this.readString(player, ["team", "teamAbbr", "team_abbr"]),
          position: this.readString(player, ["position"], "LB"),
          season: this.readNumber(player, ["season"], new Date().getFullYear()),
          stats: {
            tackles: this.readNumber(player, ["tackles", "tack", "tkl"]),
            sacks: this.readNumber(player, ["sacks", "sck"]),
            interceptions: this.readNumber(player, ["interceptions", "ints", "int"]),
            passesDefended: this.readNumber(player, ["passesDefended", "pd", "passDef"]),
            forcedFumbles: this.readNumber(player, ["forcedFumbles", "ff"]),
          },
          source,
          fetchedAt: new Date()
        });
      }
    }

    return stats;
  }

  private normalizeSpecialTeamsStats(data: unknown, source: string): PlayerStatLine[] {
    const stats: PlayerStatLine[] = [];

    if (Array.isArray(data)) {
      for (const player of data) {
        if (!this.isRecord(player)) continue;
        stats.push({
          playerId: this.readNumber(player, ["id", "playerId", "player_id"]),
          playerName: this.readString(player, ["name"], `${this.readString(player, ["firstName", "first_name"])} ${this.readString(player, ["lastName", "last_name"])}`.trim()),
          team: this.readString(player, ["team", "teamAbbr", "team_abbr"]),
          position: this.readString(player, ["position"], "K"),
          season: this.readNumber(player, ["season"], new Date().getFullYear()),
          stats: {
            fieldGoalsMade: this.readNumber(player, ["fieldGoalsMade", "fgMade", "fgm"]),
            fieldGoalsAttempted: this.readNumber(player, ["fieldGoalsAttempted", "fgAttempted", "fga"]),
            extraPointsMade: this.readNumber(player, ["extraPointsMade", "xpMade", "xpm"]),
            extraPointsAttempted: this.readNumber(player, ["extraPointsAttempted", "xpAttempted", "xpa"]),
            punts: this.readNumber(player, ["punts"]),
            puntAverage: this.readNumber(player, ["puntAverage", "puntAvg", "pAvg"]),
          },
          source,
          fetchedAt: new Date()
        });
      }
    }

    return stats;
  }

  private normalizeNextGenStats(data: unknown, source: string): PlayerStatLine[] {
    const stats: PlayerStatLine[] = [];

    if (Array.isArray(data)) {
      for (const player of data) {
        if (!this.isRecord(player)) continue;
        stats.push({
          playerId: this.readNumber(player, ["id", "playerId", "player_id"]),
          playerName: this.readString(player, ["name"], `${this.readString(player, ["firstName", "first_name"])} ${this.readString(player, ["lastName", "last_name"])}`.trim()),
          team: this.readString(player, ["team", "teamAbbr", "team_abbr"]),
          position: this.readString(player, ["position"]),
          season: this.readNumber(player, ["season"], new Date().getFullYear()),
          stats: {
            epa: this.readNumber(player, ["epa", "expectedPointsAdded"]),
            cpoe: this.readNumber(player, ["cpoe", "completionPercentageOverExpected"]),
            successRate: this.readNumber(player, ["successRate"]),
            airYards: this.readNumber(player, ["airYards"]),
            topSpeed: this.readNumber(player, ["topSpeed"]),
            longestRun: this.readNumber(player, ["longestRun"]),
            longestPass: this.readNumber(player, ["longestPass"]),
          },
          source,
          fetchedAt: new Date()
        });
      }
    }

    return stats;
  }
}

export { NFL_STATS_SOURCES } from "./statsSources";
export type { StatSource } from "./statsSources";

export {
  getStatSourcesByCategory,
  getEnabledStatSources,
  fetchStatSource
} from "./statsSources";

export const statsAggregator = new StatsAggregator();
