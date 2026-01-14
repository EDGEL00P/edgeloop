import {
  NFL_STATS_SOURCES,
  getStatSourcesByCategory,
  getEnabledStatSources,
  fetchStatSource,
  StatSource
} from "./statsSources";
import { db } from "../db";
import { nflPlayers, weeklyMetrics, nflTeams } from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export interface PlayerStatLine {
  playerId: number;
  playerName: string;
  team: string;
  position: string;
  season: number;
  week?: number;
  stats: Record<string, any>;
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
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheDuration = 60 * 60 * 1000; // 1 hour

  private getCacheKey(source: string, filters?: Record<string, string>): string {
    const filterStr = filters ? JSON.stringify(filters) : "";
    return `${source}:${filterStr}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async fetchAllPassingStats(season?: number): Promise<PlayerStatLine[]> {
    const sources = getStatSourcesByCategory("offense").filter(s =>
      s.name.toLowerCase().includes("passing")
    );

    const allStats: PlayerStatLine[] = [];

    for (const source of sources) {
      try {
        const filters = season ? { season: season.toString() } : undefined;
        const data = await fetchStatSource(Object.keys(NFL_STATS_SOURCES).find(
          key => NFL_STATS_SOURCES[key].name === source.name
        ) || "", filters);

        const stats = this.normalizePassingStats(data, source.name);
        allStats.push(...stats);
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error);
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
        const data = await fetchStatSource(Object.keys(NFL_STATS_SOURCES).find(
          key => NFL_STATS_SOURCES[key].name === source.name
        ) || "", filters);

        const stats = this.normalizeRushingStats(data, source.name);
        allStats.push(...stats);
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error);
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
        const data = await fetchStatSource(Object.keys(NFL_STATS_SOURCES).find(
          key => NFL_STATS_SOURCES[key].name === source.name
        ) || "", filters);

        const stats = this.normalizeReceivingStats(data, source.name);
        allStats.push(...stats);
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error);
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
        const data = await fetchStatSource(Object.keys(NFL_STATS_SOURCES).find(
          key => NFL_STATS_SOURCES[key].name === source.name
        ) || "", filters);

        const stats = this.normalizeDefenseStats(data, source.name);
        allStats.push(...stats);
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error);
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
        const data = await fetchStatSource(Object.keys(NFL_STATS_SOURCES).find(
          key => NFL_STATS_SOURCES[key].name === source.name
        ) || "", filters);

        const stats = this.normalizeSpecialTeamsStats(data, source.name);
        allStats.push(...stats);
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error);
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
        const data = await fetchStatSource(Object.keys(NFL_STATS_SOURCES).find(
          key => NFL_STATS_SOURCES[key].name === source.name
        ) || "", filters);

        const stats = this.normalizeNextGenStats(data, source.name);
        allStats.push(...stats);
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error);
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
      console.error(`Error aggregating stats for player ${playerId}:`, error);
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
        this.fetchAllPassingStats(season).catch(e => {
          errors.push(`Passing: ${e.message}`);
          return [];
        }),
        this.fetchAllRushingStats(season).catch(e => {
          errors.push(`Rushing: ${e.message}`);
          return [];
        }),
        this.fetchAllReceivingStats(season).catch(e => {
          errors.push(`Receiving: ${e.message}`);
          return [];
        }),
        this.fetchAllDefenseStats(season).catch(e => {
          errors.push(`Defense: ${e.message}`);
          return [];
        }),
        this.fetchAllSpecialTeamsStats(season).catch(e => {
          errors.push(`Special Teams: ${e.message}`);
          return [];
        }),
        this.fetchNextGenStats(season).catch(e => {
          errors.push(`NextGen: ${e.message}`);
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
      console.error("Error refreshing all stats:", error);
      throw error;
    }
  }

  private normalizePassingStats(data: any, source: string): PlayerStatLine[] {
    const stats: PlayerStatLine[] = [];

    if (Array.isArray(data)) {
      for (const player of data) {
        stats.push({
          playerId: player.id || 0,
          playerName: player.name || `${player.firstName || ""} ${player.lastName || ""}`,
          team: player.team || "",
          position: player.position || "QB",
          season: player.season || new Date().getFullYear(),
          stats: {
            attempts: player.attempts || player.att || 0,
            completions: player.completions || player.comp || 0,
            yards: player.yards || player.yds || 0,
            touchdowns: player.touchdowns || player.tds || player.td || 0,
            interceptions: player.interceptions || player.ints || player.int || 0,
            rating: player.rating || player.passRating || 0
          },
          source,
          fetchedAt: new Date()
        });
      }
    }

    return stats;
  }

  private normalizeRushingStats(data: any, source: string): PlayerStatLine[] {
    const stats: PlayerStatLine[] = [];

    if (Array.isArray(data)) {
      for (const player of data) {
        stats.push({
          playerId: player.id || 0,
          playerName: player.name || `${player.firstName || ""} ${player.lastName || ""}`,
          team: player.team || "",
          position: player.position || "RB",
          season: player.season || new Date().getFullYear(),
          stats: {
            attempts: player.attempts || player.att || 0,
            yards: player.yards || player.yds || 0,
            touchdowns: player.touchdowns || player.tds || player.td || 0,
            yardsPerAttempt: player.yardsPerAttempt || player.ydsPerAtt || player.ypa || 0
          },
          source,
          fetchedAt: new Date()
        });
      }
    }

    return stats;
  }

  private normalizeReceivingStats(data: any, source: string): PlayerStatLine[] {
    const stats: PlayerStatLine[] = [];

    if (Array.isArray(data)) {
      for (const player of data) {
        stats.push({
          playerId: player.id || 0,
          playerName: player.name || `${player.firstName || ""} ${player.lastName || ""}`,
          team: player.team || "",
          position: player.position || "WR",
          season: player.season || new Date().getFullYear(),
          stats: {
            targets: player.targets || player.tgt || 0,
            receptions: player.receptions || player.rec || 0,
            yards: player.yards || player.yds || 0,
            touchdowns: player.touchdowns || player.tds || player.td || 0,
            yardsPerReception: player.yardsPerReception || player.ydsPerRec || player.ypRec || 0
          },
          source,
          fetchedAt: new Date()
        });
      }
    }

    return stats;
  }

  private normalizeDefenseStats(data: any, source: string): PlayerStatLine[] {
    const stats: PlayerStatLine[] = [];

    if (Array.isArray(data)) {
      for (const player of data) {
        stats.push({
          playerId: player.id || 0,
          playerName: player.name || `${player.firstName || ""} ${player.lastName || ""}`,
          team: player.team || "",
          position: player.position || "LB",
          season: player.season || new Date().getFullYear(),
          stats: {
            tackles: player.tackles || player.tack || player.tkl || 0,
            sacks: player.sacks || player.sck || 0,
            interceptions: player.interceptions || player.ints || player.int || 0,
            passesDefended: player.passesDefended || player.pd || player.passDef || 0,
            forcedFumbles: player.forcedFumbles || player.ff || 0
          },
          source,
          fetchedAt: new Date()
        });
      }
    }

    return stats;
  }

  private normalizeSpecialTeamsStats(data: any, source: string): PlayerStatLine[] {
    const stats: PlayerStatLine[] = [];

    if (Array.isArray(data)) {
      for (const player of data) {
        stats.push({
          playerId: player.id || 0,
          playerName: player.name || `${player.firstName || ""} ${player.lastName || ""}`,
          team: player.team || "",
          position: player.position || "K",
          season: player.season || new Date().getFullYear(),
          stats: {
            fieldGoalsMade: player.fieldGoalsMade || player.fgMade || player.fgm || 0,
            fieldGoalsAttempted: player.fieldGoalsAttempted || player.fgAttempted || player.fga || 0,
            extraPointsMade: player.extraPointsMade || player.xpMade || player.xpm || 0,
            extraPointsAttempted: player.extraPointsAttempted || player.xpAttempted || player.xpa || 0,
            punts: player.punts || 0,
            puntAverage: player.puntAverage || player.puntAvg || player.pAvg || 0
          },
          source,
          fetchedAt: new Date()
        });
      }
    }

    return stats;
  }

  private normalizeNextGenStats(data: any, source: string): PlayerStatLine[] {
    const stats: PlayerStatLine[] = [];

    if (Array.isArray(data)) {
      for (const player of data) {
        stats.push({
          playerId: player.id || 0,
          playerName: player.name || `${player.firstName || ""} ${player.lastName || ""}`,
          team: player.team || "",
          position: player.position || "",
          season: player.season || new Date().getFullYear(),
          stats: {
            epa: player.epa || player.expectedPointsAdded || 0,
            cpoe: player.cpoe || player.completionPercentageOverExpected || 0,
            successRate: player.successRate || 0,
            airYards: player.airYards || 0,
            topSpeed: player.topSpeed || 0,
            longestRun: player.longestRun || 0,
            longestPass: player.longestPass || 0
          },
          source,
          fetchedAt: new Date()
        });
      }
    }

    return stats;
  }
}

export type {
  NFL_STATS_SOURCES,
  StatSource
} from "./statsSources";

export {
  getStatSourcesByCategory,
  getEnabledStatSources,
  fetchStatSource
} from "./statsSources";

export const statsAggregator = new StatsAggregator();
