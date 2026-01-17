import { CacheService, CacheKeys, CacheTTL } from "../infrastructure/cache";
import { circuitBreakerManager } from "../infrastructure/circuit-breaker";
import { apiLimiters } from "../infrastructure/rate-limiter";
import { logger } from "../infrastructure/logger";
import { withHealth } from "../health/withHealth";
import { SportradarService } from "./sportradarService";
import { RapidApiNflService } from "./rapidApiNflService";

type JsonRecord = Record<string, unknown>;

interface DataSource<T> {
  name: string;
  priority: number;
  fetch: () => Promise<T>;
  isAvailable: () => boolean;
}

interface RouterConfig<T> {
  cacheKey: string;
  cacheTTL: number;
  sources: Array<DataSource<T>>;
}

interface TeamSummary {
  id: string;
  abbreviation?: string;
  name?: string;
  fullName?: string;
  location?: string;
}

interface GameTeamSide {
  team: {
    id?: string;
    abbreviation?: string;
    displayName?: string;
  };
  score?: number | null;
  homeAway?: "home" | "away";
}

interface GameSummary {
  id: string;
  date?: string;
  status?: string;
  home_team?: GameTeamSide;
  away_team?: GameTeamSide;
  venue?: string;
}

interface TeamListResponse {
  data: TeamSummary[];
  raw?: unknown;
}

interface GamesResponse {
  data: GameSummary[];
  raw?: unknown;
}

interface PlayerStatsResponse {
  data: unknown;
}

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null ? (value as JsonRecord) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
}

function mapSportradarTeams(raw: unknown): TeamSummary[] {
  const record = asRecord(raw);
  const teams = asArray(record?.teams);
  return teams
    .map((team): TeamSummary | null => {
      const teamRecord = asRecord(team);
      if (!teamRecord) return null;
      const id = toString(teamRecord.id);
      if (!id) return null;
      const name = toString(teamRecord.name);
      const market = toString(teamRecord.market);
      return {
        id,
        abbreviation: toString(teamRecord.alias),
        name,
        fullName: market && name ? `${market} ${name}` : name,
        location: market,
      };
    })
    .filter((team): team is TeamSummary => team !== null);
}

function mapEspnTeams(raw: unknown): TeamSummary[] {
  const record = asRecord(raw);
  const sports = asArray(record?.sports);
  const leagues = asArray(asRecord(sports[0])?.leagues);
  const teams = asArray(asRecord(leagues[0])?.teams);
  return teams
    .map((entry): TeamSummary | null => {
      const entryRecord = asRecord(entry);
      const team = asRecord(entryRecord?.team);
      if (!team) return null;
      const id = toString(team.id);
      if (!id) return null;
      return {
        id,
        abbreviation: toString(team.abbreviation),
        name: toString(team.shortDisplayName),
        fullName: toString(team.displayName),
        location: toString(team.location),
      };
    })
    .filter((team): team is TeamSummary => team !== null);
}

function mapSportradarGames(raw: unknown): GameSummary[] {
  const record = asRecord(raw);
  const week = asRecord(record?.week);
  const games = asArray(week?.games ?? record?.games);
  return games
    .map((game): GameSummary | null => {
      const gameRecord = asRecord(game);
      if (!gameRecord) return null;
      const id = toString(gameRecord.id);
      if (!id) return null;
      const home = asRecord(gameRecord.home);
      const away = asRecord(gameRecord.away);
      return {
        id,
        date: toString(gameRecord.scheduled),
        status: toString(gameRecord.status),
        home_team: home
          ? {
              team: {
                id: toString(home.id),
                abbreviation: toString(home.alias),
                displayName: `${toString(home.market) ?? ""} ${toString(home.name) ?? ""}`.trim(),
              },
              score: toNumber(asRecord(gameRecord.scoring)?.home_points ?? gameRecord.home_points) ?? null,
              homeAway: "home",
            }
          : undefined,
        away_team: away
          ? {
              team: {
                id: toString(away.id),
                abbreviation: toString(away.alias),
                displayName: `${toString(away.market) ?? ""} ${toString(away.name) ?? ""}`.trim(),
              },
              score: toNumber(asRecord(gameRecord.scoring)?.away_points ?? gameRecord.away_points) ?? null,
              homeAway: "away",
            }
          : undefined,
        venue: toString(asRecord(gameRecord.venue)?.name),
      };
    })
    .filter((game): game is GameSummary => game !== null);
}

function mapEspnGames(raw: unknown): GameSummary[] {
  const record = asRecord(raw);
  const events = asArray(record?.events);
  return events
    .map((event): GameSummary | null => {
      const eventRecord = asRecord(event);
      if (!eventRecord) return null;
      const id = toString(eventRecord.id);
      if (!id) return null;
      const competitions = asArray(eventRecord.competitions);
      const competition = asRecord(competitions[0]);
      const competitors = asArray(competition?.competitors);
      const home = competitors.find((c) => asRecord(c)?.homeAway === "home");
      const away = competitors.find((c) => asRecord(c)?.homeAway === "away");
      const homeRecord = asRecord(home);
      const awayRecord = asRecord(away);
      const statusType = asRecord(asRecord(eventRecord.status)?.type);
      return {
        id,
        date: toString(eventRecord.date),
        status: toString(statusType?.name),
        home_team: homeRecord
          ? {
              team: {
                id: toString(asRecord(homeRecord.team)?.id),
                abbreviation: toString(asRecord(homeRecord.team)?.abbreviation),
                displayName: toString(asRecord(homeRecord.team)?.displayName),
              },
              score: toNumber(homeRecord.score) ?? null,
              homeAway: "home",
            }
          : undefined,
        away_team: awayRecord
          ? {
              team: {
                id: toString(asRecord(awayRecord.team)?.id),
                abbreviation: toString(asRecord(awayRecord.team)?.abbreviation),
                displayName: toString(asRecord(awayRecord.team)?.displayName),
              },
              score: toNumber(awayRecord.score) ?? null,
              homeAway: "away",
            }
          : undefined,
        venue: toString(asRecord(competition?.venue)?.fullName),
      };
    })
    .filter((game): game is GameSummary => game !== null);
}

export class DataRouter {
  private static instance: DataRouter;

  static getInstance(): DataRouter {
    if (!DataRouter.instance) {
      DataRouter.instance = new DataRouter();
    }
    return DataRouter.instance;
  }

  async fetch<T>(config: RouterConfig<T>): Promise<T | null> {
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
          return data;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn({
          type: "data_router_source_failed",
          source: source.name,
          error: message,
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

async function fetchFromBallDontLie(endpoint: string): Promise<unknown> {
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

async function fetchFromESPN(endpoint: string): Promise<unknown> {
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

export async function getTeams(): Promise<TeamListResponse | null> {
  const router = DataRouter.getInstance();
  return router.fetch<TeamListResponse>({
    cacheKey: CacheKeys.teams(),
    cacheTTL: CacheTTL.DAY,
    sources: [
      {
        name: "sportradar",
        priority: 0,
        isAvailable: () => !!(process.env.SPORTSRADAR_API_KEY || process.env.SPORTRADAR_API_KEY),
        fetch: async () => {
          const data = await SportradarService.getTeams();
          return {
            data: mapSportradarTeams(data),
            raw: data as unknown,
          };
        },
      },
      {
        name: "balldontlie",
        priority: 1,
        isAvailable: () => ballDontLieBreaker.getState() !== "OPEN",
        fetch: async () => {
          const data = await fetchFromBallDontLie("/teams");
          return {
            data: asArray(asRecord(data)?.data).map((team): TeamSummary | null => {
              const teamRecord = asRecord(team);
              const id = toString(teamRecord?.id);
              if (!id) return null;
              return {
                id,
                abbreviation: toString(teamRecord?.abbreviation),
                name: toString(teamRecord?.name),
                fullName: toString(teamRecord?.full_name),
                location: toString(teamRecord?.city),
              };
            }).filter((team): team is TeamSummary => team !== null),
            raw: data,
          };
        },
      },
      {
        name: "espn",
        priority: 2,
        isAvailable: () => espnBreaker.getState() !== "OPEN",
        fetch: async () => {
          const data = await fetchFromESPN("/teams");
          return {
            data: mapEspnTeams(data),
            raw: data,
          };
        },
      },
    ],
  });
}

export async function getGames(season: number, week: number): Promise<GamesResponse | null> {
  const router = DataRouter.getInstance();
  return router.fetch<GamesResponse>({
    cacheKey: CacheKeys.gamesByWeek(season, week),
    cacheTTL: CacheTTL.MEDIUM,
    sources: [
      {
        name: "sportradar",
        priority: 0,
        isAvailable: () => !!(process.env.SPORTSRADAR_API_KEY || process.env.SPORTRADAR_API_KEY),
        fetch: async () => {
          const data = await SportradarService.getWeekSchedule(season, "REG", week);
          return {
            data: mapSportradarGames(data),
            raw: data as unknown,
          };
        },
      },
      {
        name: "balldontlie",
        priority: 1,
        isAvailable: () => ballDontLieBreaker.getState() !== "OPEN",
        fetch: async () => {
          const data = await fetchFromBallDontLie(`/games?seasons[]=${season}&weeks[]=${week}&per_page=50`);
          return {
            data: asArray(asRecord(data)?.data).map((game): GameSummary | null => {
              const gameRecord = asRecord(game);
              const id = toString(gameRecord?.id);
              if (!id) return null;
              const home = asRecord(gameRecord?.home_team);
              const away = asRecord(gameRecord?.away_team);
              return {
                id,
                date: toString(gameRecord?.date),
                status: toString(gameRecord?.status),
                home_team: home
                  ? {
                      team: {
                        id: toString(asRecord(home?.team)?.id),
                        abbreviation: toString(asRecord(home?.team)?.abbreviation),
                        displayName: toString(asRecord(home?.team)?.displayName),
                      },
                      score: toNumber(home?.score) ?? null,
                      homeAway: "home",
                    }
                  : undefined,
                away_team: away
                  ? {
                      team: {
                        id: toString(asRecord(away?.team)?.id),
                        abbreviation: toString(asRecord(away?.team)?.abbreviation),
                        displayName: toString(asRecord(away?.team)?.displayName),
                      },
                      score: toNumber(away?.score) ?? null,
                      homeAway: "away",
                    }
                  : undefined,
                venue: toString(gameRecord?.venue),
              };
            }).filter((game): game is GameSummary => game !== null),
            raw: data,
          };
        },
      },
      {
        name: "espn",
        priority: 2,
        isAvailable: () => espnBreaker.getState() !== "OPEN",
        fetch: async () => {
          const data = await fetchFromESPN(`/scoreboard?week=${week}&seasontype=2`);
          return {
            data: mapEspnGames(data),
            raw: data,
          };
        },
      },
      {
        name: "rapidapi",
        priority: 3,
        isAvailable: () => !!process.env.RAPIDAPI_KEY,
        fetch: async () => {
          const data = await RapidApiNflService.getGames(season, week);
          const record = asRecord(data);
          const games = asArray(record?.response ?? record?.games ?? data);
          return { 
            data: games.map((g): GameSummary | null => {
              const gameRecord = asRecord(g);
              const id = toString(gameRecord?.id ?? gameRecord?.game_id);
              if (!id) return null;
              return {
                id,
                date: toString(gameRecord?.date),
                status: toString(gameRecord?.status),
              };
            }).filter((g): g is GameSummary => g !== null),
          };
        },
      },
    ],
  });
}

export async function getPlayerStats(playerId: number): Promise<PlayerStatsResponse | null> {
  const router = DataRouter.getInstance();
  return router.fetch<PlayerStatsResponse>({
    cacheKey: `player:stats:${playerId}`,
    cacheTTL: CacheTTL.HOUR,
    sources: [
      {
        name: "balldontlie",
        priority: 1,
        isAvailable: () => ballDontLieBreaker.getState() !== "OPEN",
        fetch: async () => {
          const data = await fetchFromBallDontLie(`/stats?player_ids[]=${playerId}`);
          return { data };
        },
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

export async function getActivePlayers(): Promise<TeamListResponse | null> {
  const router = DataRouter.getInstance();
  return router.fetch<TeamListResponse>({
    cacheKey: CacheKeys.activePlayers(),
    cacheTTL: CacheTTL.DAY,
    sources: [
      {
        name: "balldontlie",
        priority: 0,
        isAvailable: () => ballDontLieBreaker.getState() !== "OPEN",
        fetch: async () => {
          const data = await fetchFromBallDontLie("/players/active");
          return {
            data: asArray(data?.data ?? data).map((player): TeamSummary | null => {
              const playerRecord = asRecord(player);
              const id = toString(playerRecord?.id);
              if (!id) return null;
              return {
                id,
                abbreviation: toString(playerRecord?.team?.abbreviation),
                name: `${toString(playerRecord?.first_name) || ""} ${toString(playerRecord?.last_name) || ""}`.trim(),
                fullName: `${toString(playerRecord?.first_name) || ""} ${toString(playerRecord?.last_name) || ""}`.trim(),
              };
            }).filter((p): p is TeamSummary => p !== null),
            raw: data,
          };
        },
      },
    ],
  });
}

export async function getPlayerInjuries(): Promise<{ data: unknown } | null> {
  const router = DataRouter.getInstance();
  return router.fetch<{ data: unknown }>({
    cacheKey: CacheKeys.playerInjuries(),
    cacheTTL: CacheTTL.MEDIUM,
    sources: [
      {
        name: "balldontlie",
        priority: 0,
        isAvailable: () => ballDontLieBreaker.getState() !== "OPEN",
        fetch: async () => {
          const data = await fetchFromBallDontLie("/player_injuries");
          return { data };
        },
      },
    ],
  });
}

export async function getTeamRoster(teamId?: number): Promise<{ data: unknown } | null> {
  const router = DataRouter.getInstance();
  const cacheKey = teamId ? CacheKeys.teamRoster(teamId) : "team_roster:all";
  return router.fetch<{ data: unknown }>({
    cacheKey,
    cacheTTL: CacheTTL.DAY,
    sources: [
      {
        name: "balldontlie",
        priority: 0,
        isAvailable: () => ballDontLieBreaker.getState() !== "OPEN",
        fetch: async () => {
          const endpoint = teamId ? `/team_roster?team_id=${teamId}` : "/team_roster";
          const data = await fetchFromBallDontLie(endpoint);
          return { data };
        },
      },
    ],
  });
}

export const dataRouter = DataRouter.getInstance();
export default dataRouter;
