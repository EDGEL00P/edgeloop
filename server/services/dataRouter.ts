import { CacheService, CacheKeys, CacheTTL } from "../infrastructure/cache";
import { circuitBreakerManager } from "../infrastructure/circuit-breaker";
import { apiLimiters } from "../infrastructure/rate-limiter";
import { logger } from "../infrastructure/logger";

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
    const response = await fetch(`https://api.balldontlie.io/nfl/v1${endpoint}`, {
      headers: { Authorization: apiKey },
    });
    if (!response.ok) throw new Error(`BDL API error: ${response.status}`);
    return response.json();
  });
}

async function fetchFromESPN(endpoint: string): Promise<any> {
  const acquired = await apiLimiters.espn.acquire();
  if (!acquired) throw new Error("ESPN rate limit exceeded");

  return espnBreaker.execute(async () => {
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl${endpoint}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SingularityBot/1.0)",
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error(`ESPN API error: ${response.status}`);
    return response.json();
  });
}

export async function getTeams(): Promise<any> {
  const router = DataRouter.getInstance();
  return router.fetch({
    cacheKey: CacheKeys.teams(),
    cacheTTL: CacheTTL.DAY,
    sources: [
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
