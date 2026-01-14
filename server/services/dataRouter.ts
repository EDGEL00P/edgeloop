import { CacheService, CacheKeys, CacheTTL } from "../infrastructure/cache";
import { eq, and, or } from "drizzle-orm";
import { circuitBreakerManager } from "../infrastructure/circuit-breaker";
import { apiLimiters } from "../infrastructure/rate-limiter";
import { logger } from "../infrastructure/logger";
import { withHealth } from "../health/withHealth";
import { SportradarService } from "./sportradarService";
import { RapidApiNflService } from "./rapidApiNflService";

interface DataSource {
  name: string;
  priority: number;
  fetch: () => Promise<any>;
  isAvailable: () => boolean;
}

interface RouterConfig {
  cacheKey: string;
  cacheTTL: number;
  sources: DataSource[];
}

export class DataRouter {
  private static instance: DataRouter;

  static getInstance(): DataRouter {
    if (!DataRouter.instance) {
      DataRouter.instance = new DataRouter();
    }
    return DataRouter.instance;
  }

  async fetch<T>(config: RouterConfig): Promise<T | null> {
    const cached = await CacheService.get<T>(config.cacheKey);
    if (cached) {
      logger.debug({ type: "data_router_cache_hit", key: config.cacheKey });
      return cached;
    }

    const sortedSources = config.sources
      .filter((s) => s.isAvailable())
      .sort((a, b) => a.priority - b.priority);

    for (const source of sortedSources) {
      try {
        logger.info({ type: "data_router_trying", source: source.name });
        const data = await source.fetch();
        if (data) {
          await CacheService.set(config.cacheKey, data, config.cacheTTL);
          logger.info({ type: "data_router_success", source: source.name });
          return data as T;
        }
      } catch (error) {
        logger.warn({
          type: "data_router_source_failed",
          source: source.name,
          error: (error as Error).message,
        });
      }
    }

    logger.error({ type: "data_router_all_sources_failed", key: config.cacheKey });
    return null;
  }
}

const ballDontLieBreaker = circuitBreakerManager.create("balldontlie", {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 60000,
});

const espnBreaker = circuitBreakerManager.create("espn_router", {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000,
});

async function fetchFromBallDontLie(endpoint: string): Promise<any> {
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  if (!apiKey) throw new Error("BALLDONTLIE_API_KEY not set");

  const acquired = await apiLimiters.ballDontLie.acquire();
  if (!acquired) throw new Error("Rate limit exceeded");

  return ballDontLieBreaker.execute(async () => {
    return withHealth("balldontlie", async () => {
      const response = await fetch(`https://api.balldontlie.io/nfl/v1${endpoint}`, {
      headers: { Authorization: apiKey },
    });
    if (!response.ok) throw new Error(`BDL API error: ${response.status}`);
      return response.json();
    });
  });
}

async function fetchFromESPN(endpoint: string): Promise<any> {
  const acquired = await apiLimiters.espn.acquire();
  if (!acquired) throw new Error("ESPN rate limit exceeded");

  return espnBreaker.execute(async () => {
    return withHealth("espn", async () => {
      const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl${endpoint}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SingularityBot/1.0)",
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error(`ESPN API error: ${response.status}`);
      return response.json();
    });
  });
}

export async function getTeams(): Promise<any> {
  const router = DataRouter.getInstance();
  return router.fetch({
    cacheKey: CacheKeys.teams(),
    cacheTTL: CacheTTL.DAY,
    sources: [
      {
        name: "sportradar",
        priority: 0,
        isAvailable: () => !!process.env.SPORTRADAR_API_KEY,
        fetch: async () => {
          const data = await SportradarService.getTeams();
          return {
            data: data.teams?.map((t: any) => ({
              id: t.id,
              abbreviation: t.alias,
              name: t.name,
              fullName: t.market ? `${t.market} ${t.name}` : t.name,
              location: t.market,
            })) || [],
            raw: data,
          };
        },
      },
      {
        name: "balldontlie",
        priority: 1,
        isAvailable: () => ballDontLieBreaker.getState() !== "OPEN",
        fetch: () => fetchFromBallDontLie("/teams"),
      },
      {
        name: "espn",
        priority: 2,
        isAvailable: () => espnBreaker.getState() !== "OPEN",
        fetch: async () => {
          const data = await fetchFromESPN("/teams");
          return {
            data: data.sports?.[0]?.leagues?.[0]?.teams?.map((t: any) => ({
              id: t.team.id,
              abbreviation: t.team.abbreviation,
              name: t.team.shortDisplayName,
              fullName: t.team.displayName,
              location: t.team.location,
            })) || [],
          };
        },
      },
    ],
  });
}

export async function getGames(season: number, week: number): Promise<any> {
  const router = DataRouter.getInstance();
  return router.fetch({
    cacheKey: CacheKeys.gamesByWeek(season, week),
    cacheTTL: CacheTTL.MEDIUM,
    sources: [
      {
        name: "sportradar",
        priority: 0,
        isAvailable: () => !!process.env.SPORTRADAR_API_KEY,
        fetch: async () => {
          const data = await SportradarService.getWeekSchedule(season, "REG", week);
          const games = data.week?.games || data.games || [];
          return {
            data: games.map((g: any) => ({
              id: g.id,
              date: g.scheduled,
              status: g.status,
              home_team: { team: { id: g.home?.id, abbreviation: g.home?.alias, displayName: `${g.home?.market ?? ""} ${g.home?.name ?? ""}`.trim() }, score: g.scoring?.home_points ?? g.home_points ?? null, homeAway: "home" },
              away_team: { team: { id: g.away?.id, abbreviation: g.away?.alias, displayName: `${g.away?.market ?? ""} ${g.away?.name ?? ""}`.trim() }, score: g.scoring?.away_points ?? g.away_points ?? null, homeAway: "away" },
              venue: g.venue?.name,
            })),
            raw: data,
          };
        },
      },
      {
        name: "balldontlie",
        priority: 1,
        isAvailable: () => ballDontLieBreaker.getState() !== "OPEN",
        fetch: () => fetchFromBallDontLie(`/games?seasons[]=${season}&weeks[]=${week}&per_page=50`),
      },
      {
        name: "espn",
        priority: 2,
        isAvailable: () => espnBreaker.getState() !== "OPEN",
        fetch: async () => {
          const data = await fetchFromESPN(`/scoreboard?week=${week}&seasontype=2`);
          return {
            data: data.events?.map((e: any) => ({
              id: e.id,
              date: e.date,
              status: e.status?.type?.name,
              home_team: e.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "home"),
              away_team: e.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === "away"),
              venue: e.competitions?.[0]?.venue?.fullName,
            })) || [],
          };
        },
      },
      {
        name: "rapidapi",
        priority: 3,
        isAvailable: () => !!process.env.RAPIDAPI_KEY,
        fetch: async () => {
          const data = await RapidApiNflService.getGames(season, week);
          return { data: data.response || data.games || data || [] };
        },
      },
    ],
  });
}

export async function getPlayerStats(playerId: number): Promise<any> {
  const router = DataRouter.getInstance();
  return router.fetch({
    cacheKey: `player:stats:${playerId}`,
    cacheTTL: CacheTTL.HOUR,
    sources: [
      {
        name: "balldontlie",
        priority: 1,
        isAvailable: () => ballDontLieBreaker.getState() !== "OPEN",
        fetch: () => fetchFromBallDontLie(`/players/${playerId}/stats`),
      },
      {
        name: "espn",
        priority: 2,
        isAvailable: () => espnBreaker.getState() !== "OPEN",
        fetch: async () => {
          const data = await fetchFromESPN(`/athletes/${playerId}/stats`);
          return { data: data };
        },
      },
    ],
  });
}

export const dataRouter = DataRouter.getInstance();
export default dataRouter;
