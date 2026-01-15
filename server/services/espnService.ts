import { CacheService, CacheKeys, CacheTTL } from "../infrastructure/cache";
import { eq, and, or } from "drizzle-orm";
import { CircuitBreaker, circuitBreakerManager } from "../infrastructure/circuit-breaker";
import { apiLimiters } from "../infrastructure/rate-limiter";
import { logger } from "../infrastructure/logger";

const ESPN_API_BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";
const ESPN_CORE_API = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl";

const ESPN_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  "Referer": "https://www.espn.com/",
};

export type InjuryStatus = "Out" | "Doubtful" | "Questionable" | "Probable" | "IR" | "PUP" | "Suspended";

type EspnRecord = Record<string, unknown>;

function asRecord(value: unknown): EspnRecord | null {
  return typeof value === "object" && value !== null ? (value as EspnRecord) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function getString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function getNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

function getOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
}

export interface PlayerInjury {
  playerId: string;
  playerName: string;
  position: string;
  status: InjuryStatus;
  injury: string;
  returnDate: string | null;
}

export interface TeamStats {
  teamId: string;
  teamName: string;
  offenseRank: number;
  defenseRank: number;
  epa: number;
  successRate: number;
  yardsPerPlay: number;
  pointsPerGame: number;
  pointsAllowedPerGame: number;
  totalYards: number;
  totalYardsAllowed: number;
  turnovers: number;
  takeaways: number;
  record: string;
}

export interface DepthChartPlayer {
  name: string;
  jerseyNumber: string | null;
  experience: string | null;
  playerId: string;
  depth: number;
}

export interface DepthChartPosition {
  position: string;
  players: DepthChartPlayer[];
}

export interface MatchupData {
  gameId: string;
  homeTeam: {
    id: string;
    name: string;
    record: string;
    score?: number;
  };
  awayTeam: {
    id: string;
    name: string;
    record: string;
    score?: number;
  };
  venue: string;
  gameDate: string;
  status: string;
  prediction?: {
    homeWinProbability: number;
    awayWinProbability: number;
    predictedSpread: number;
    predictedTotal: number;
  };
  weather?: {
    temperature: number;
    condition: string;
  };
}

const espnCircuitBreaker = circuitBreakerManager.create("espn", {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
  fallback: async () => null,
});

const ESPN_TEAM_ID_MAP: Record<string, string> = {
  "ARI": "22", "ATL": "1", "BAL": "33", "BUF": "2",
  "CAR": "29", "CHI": "3", "CIN": "4", "CLE": "5",
  "DAL": "6", "DEN": "7", "DET": "8", "GB": "9",
  "HOU": "34", "IND": "11", "JAX": "30", "KC": "12",
  "LAC": "24", "LAR": "14", "LV": "13", "MIA": "15",
  "MIN": "16", "NE": "17", "NO": "18", "NYG": "19",
  "NYJ": "20", "PHI": "21", "PIT": "23", "SF": "25",
  "SEA": "26", "TB": "27", "TEN": "10", "WAS": "28",
};

function getEspnTeamId(teamId: string): string {
  if (ESPN_TEAM_ID_MAP[teamId.toUpperCase()]) {
    return ESPN_TEAM_ID_MAP[teamId.toUpperCase()];
  }
  return teamId;
}

async function fetchFromEspn(url: string): Promise<unknown> {
  const acquired = await apiLimiters.espn.acquire();
  if (!acquired) {
    throw new Error("ESPN rate limit exceeded");
  }

  return espnCircuitBreaker.execute(async () => {
    logger.info({ type: "espn_fetch", url });
    
    const response = await fetch(url, {
      headers: ESPN_HEADERS,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ type: "espn_error", status: response.status, error: errorText });
      throw new Error(`ESPN API error: ${response.status}`);
    }

    return response.json();
  });
}

export async function getTeamStats(teamId: string): Promise<TeamStats | null> {
  const espnTeamId = getEspnTeamId(teamId);
  const cacheKey = CacheKeys.espnStats(teamId);

  const cached = await CacheService.get<TeamStats>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const teamUrl = `${ESPN_API_BASE}/teams/${espnTeamId}`;
    const statsUrl = `${ESPN_API_BASE}/teams/${espnTeamId}/statistics`;

    const [teamDataRaw, statsDataRaw] = await Promise.all([
      fetchFromEspn(teamUrl).catch(() => null),
      fetchFromEspn(statsUrl).catch(() => null),
    ]);

    const teamData = asRecord(teamDataRaw);
    const statsData = asRecord(statsDataRaw);
    const team = asRecord(teamData?.team);

    if (!team) {
      return null;
    }

    const recordItems = asArray(asRecord(team.record)?.items);
    const recordSummary = asRecord(recordItems[0]);
    const record = getString(recordSummary?.summary, "0-0");

    let offenseRank = 16;
    let defenseRank = 16;
    let yardsPerPlay = 5.5;
    let pointsPerGame = 21;
    let pointsAllowedPerGame = 21;
    let totalYards = 0;
    let totalYardsAllowed = 0;

    const categories = asArray(asRecord(asRecord(asRecord(statsData?.results)?.stats)?.categories));
    for (const category of categories) {
      const categoryRecord = asRecord(category);
      const categoryName = getString(categoryRecord?.name);
      const stats = asArray(categoryRecord?.stats);
      if (categoryName === "offensive") {
        for (const stat of stats) {
          const statRecord = asRecord(stat);
          const statName = getString(statRecord?.name);
          const statValue = getNumber(statRecord?.value, 0);
          if (statName === "totalYards") totalYards = statValue;
          if (statName === "yardsPerPlay") yardsPerPlay = statValue || 5.5;
          if (statName === "totalPointsPerGame") pointsPerGame = statValue || 21;
        }
      }
      if (categoryName === "defensive") {
        for (const stat of stats) {
          const statRecord = asRecord(stat);
          const statName = getString(statRecord?.name);
          const statValue = getNumber(statRecord?.value, 0);
          if (statName === "totalYards") totalYardsAllowed = statValue;
          if (statName === "totalPointsPerGame") pointsAllowedPerGame = statValue || 21;
        }
      }
    }

    const epa = (pointsPerGame - pointsAllowedPerGame) / 10;
    const successRate = yardsPerPlay > 5.5 ? 0.48 + (yardsPerPlay - 5.5) * 0.02 : 0.45;

    const stats: TeamStats = {
      teamId,
      teamName: getString(team.displayName, getString(team.name)),
      offenseRank,
      defenseRank,
      epa: Math.round(epa * 100) / 100,
      successRate: Math.round(successRate * 1000) / 1000,
      yardsPerPlay: Math.round(yardsPerPlay * 10) / 10,
      pointsPerGame: Math.round(pointsPerGame * 10) / 10,
      pointsAllowedPerGame: Math.round(pointsAllowedPerGame * 10) / 10,
      totalYards,
      totalYardsAllowed,
      turnovers: 0,
      takeaways: 0,
      record,
    };

    await CacheService.set(cacheKey, stats, CacheTTL.HOUR);
    return stats;
  } catch (error) {
    logger.error({ type: "espn_stats_error", teamId, error: (error as Error).message });
    return null;
  }
}

export async function getTeamInjuries(teamId: string): Promise<PlayerInjury[]> {
  const espnTeamId = getEspnTeamId(teamId);
  const cacheKey = CacheKeys.espnInjuries(teamId);

  const cached = await CacheService.get<PlayerInjury[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const teamInjuriesUrl = `${ESPN_API_BASE}/teams/${espnTeamId}/injuries`;
    const leagueInjuriesUrl = `${ESPN_API_BASE}/injuries`;
    
    const [teamDataRaw, leagueDataRaw] = await Promise.all([
      fetchFromEspn(teamInjuriesUrl).catch(() => ({})),
      fetchFromEspn(leagueInjuriesUrl).catch(() => ({})),
    ]);

    const teamData = asRecord(teamDataRaw) ?? {};
    const leagueData = asRecord(leagueDataRaw) ?? {};

    const injuries: PlayerInjury[] = [];
    const statusMap: Record<string, InjuryStatus> = {
      "o": "Out",
      "out": "Out",
      "d": "Doubtful",
      "doubtful": "Doubtful",
      "q": "Questionable",
      "questionable": "Questionable",
      "p": "Probable",
      "probable": "Probable",
      "ir": "IR",
      "pup": "PUP",
      "suspended": "Suspended",
    };

    const processInjury = (injury: unknown, player?: unknown): PlayerInjury => {
      const injuryRecord: EspnRecord = asRecord(injury) ?? {};
      const playerRecord = asRecord(player);
      const athlete = playerRecord ?? asRecord(injuryRecord.athlete) ?? {};
      const injuryDetails = asRecord(asArray(injuryRecord.injuries)[0]) ?? injuryRecord;
      const rawStatus = getString(injuryDetails.status ?? injuryRecord.status).toLowerCase();
      const status: InjuryStatus = statusMap[rawStatus] || "Questionable";

      return {
        playerId: getString(athlete.id),
        playerName: getString(athlete.displayName, getString(athlete.fullName, getString(athlete.name))),
        position: getString(asRecord(athlete.position)?.abbreviation, getString(athlete.position)),
        status,
        injury: getString(
          asRecord(injuryDetails.type)?.description,
          getString(injuryDetails.description, getString(injuryRecord.longComment, getString(injuryRecord.shortComment, "Unknown")))
        ),
        returnDate: getString(injuryDetails.date, getString(injuryRecord.date)) || null,
      };
    };

    const teamInjuries = asArray(asRecord(asRecord(teamData.team)?.injuries));
    if (teamInjuries.length > 0) {
      for (const injury of teamInjuries) {
        injuries.push(processInjury(injury));
      }
    }

    const leagueInjuries = asArray(leagueData.injuries);
    if (leagueInjuries.length > 0) {
      for (const teamInjuryEntry of leagueInjuries) {
        const entryRecord = asRecord(teamInjuryEntry);
        const entryTeamId = getString(asRecord(entryRecord?.team)?.id);
        if (entryTeamId === espnTeamId) {
          for (const injury of asArray(entryRecord?.injuries)) {
            const injuryRecord = asRecord(injury);
            const athleteId = getString(asRecord(injuryRecord?.athlete)?.id);
            if (!injuries.some((i) => i.playerId === athleteId)) {
              injuries.push(processInjury(injury));
            }
          }
        }
      }
    }

    const teamItems = asArray(teamData.items);
    if (teamItems.length > 0) {
      for (const item of teamItems) {
        const itemRecord = asRecord(item) ?? {};
        const athlete = asRecord(itemRecord.athlete) ?? {};
        const athleteId = getString(athlete.id);
        if (!injuries.some((i) => i.playerId === athleteId)) {
          injuries.push(processInjury(itemRecord, athlete));
        }
      }
    }

    await CacheService.set(cacheKey, injuries, CacheTTL.MEDIUM);
    return injuries;
  } catch (error) {
    logger.error({ type: "espn_injuries_error", teamId, error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

export async function getTeamDepthChart(teamId: string): Promise<DepthChartPosition[]> {
  const espnTeamId = getEspnTeamId(teamId);
  const cacheKey = CacheKeys.espnDepthChart(teamId);

  const cached = await CacheService.get<DepthChartPosition[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const depthChartUrl = `${ESPN_API_BASE}/teams/${espnTeamId}/depthcharts`;
    const rosterUrl = `${ESPN_API_BASE}/teams/${espnTeamId}/roster`;
    
    const [depthDataRaw, rosterDataRaw] = await Promise.all([
      fetchFromEspn(depthChartUrl).catch(() => ({})),
      fetchFromEspn(rosterUrl).catch(() => ({})),
    ]);

    const depthData = asRecord(depthDataRaw) ?? {};
    const rosterData = asRecord(rosterDataRaw) ?? {};

    const depthChart: DepthChartPosition[] = [];
    const positionMap = new Map<string, DepthChartPlayer[]>();

    const depthCharts = asArray(depthData.depthCharts);
    const firstChart = asRecord(depthCharts[0]);
    const positions = asRecord(firstChart?.positions) ?? {};

    if (Object.keys(positions).length > 0) {
      for (const pos of Object.keys(positions)) {
        const positionData = asRecord(positions[pos]);
        const players: DepthChartPlayer[] = [];

        if (positionData) {
          const athletes = asArray(positionData.athletes);
          let depth = 1;
          for (const athlete of athletes) {
            const athleteRecord = asRecord(athlete) ?? {};
            players.push({
              name: getString(athleteRecord.displayName, getString(athleteRecord.fullName)),
              jerseyNumber: getString(athleteRecord.jersey) || null,
              experience: getString(asRecord(athleteRecord.experience)?.years) || null,
              playerId: getString(athleteRecord.id),
              depth,
            });
            depth++;
          }
        }

        if (players.length > 0) {
          positionMap.set(pos, players);
        }
      }
    }

    const rosterGroups = asArray(rosterData.athletes);
    if (rosterGroups.length > 0) {
      for (const group of rosterGroups) {
        const groupRecord = asRecord(group) ?? {};
        const items = asArray(groupRecord.items);
        for (const athlete of items) {
          const athleteRecord = asRecord(athlete) ?? {};
          const positionRecord = asRecord(athleteRecord.position);
          const pos = getString(positionRecord?.abbreviation, getString(positionRecord?.displayName, "UNKNOWN"));
          if (!positionMap.has(pos)) {
            positionMap.set(pos, []);
          }
          const players = positionMap.get(pos)!;
          const athleteId = getString(athleteRecord.id);
          if (!players.some(p => p.playerId === athleteId)) {
            players.push({
              name: getString(athleteRecord.displayName, getString(athleteRecord.fullName)),
              jerseyNumber: getString(athleteRecord.jersey) || null,
              experience: getString(asRecord(athleteRecord.experience)?.years) || null,
              playerId: athleteId,
              depth: players.length + 1,
            });
          }
        }
      }
    }

    Array.from(positionMap.entries()).forEach(([position, players]) => {
      depthChart.push({ position, players });
    });

    depthChart.sort((a, b) => {
      const order = ["QB", "RB", "WR", "TE", "LT", "LG", "C", "RG", "RT", "DE", "DT", "LB", "CB", "S", "K", "P"];
      const aIdx = order.indexOf(a.position);
      const bIdx = order.indexOf(b.position);
      if (aIdx === -1 && bIdx === -1) return a.position.localeCompare(b.position);
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });

    await CacheService.set(cacheKey, depthChart, CacheTTL.HOUR);
    return depthChart;
  } catch (error) {
    logger.error({ type: "espn_depth_error", teamId, error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

export async function getMatchupData(gameId: string): Promise<MatchupData | null> {
  const cacheKey = `espn:matchup:${gameId}`;

  const cached = await CacheService.get<MatchupData>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const url = `${ESPN_API_BASE}/summary?event=${gameId}`;
    const data = await fetchFromEspn(url);
    const dataRecord = asRecord(data);
    const header = asRecord(dataRecord?.header);
    const competitions = asArray(header?.competitions);
    const competition = asRecord(competitions[0]);

    if (!competition) {
      return null;
    }

    const competitors = asArray(competition.competitors);
    
    const homeCompetitor = competitors.find((c) => getString(asRecord(c)?.homeAway) === "home");
    const awayCompetitor = competitors.find((c) => getString(asRecord(c)?.homeAway) === "away");
    const homeRecord = asRecord(homeCompetitor);
    const awayRecord = asRecord(awayCompetitor);

    if (!homeRecord || !awayRecord) {
      return null;
    }

    let prediction = undefined;
    const predictor = asRecord(dataRecord?.predictor);
    if (predictor) {
      const homeTeam = asRecord(predictor.homeTeam);
      const awayTeam = asRecord(predictor.awayTeam);
      prediction = {
        homeWinProbability: getNumber(homeTeam?.gameProjection, 50),
        awayWinProbability: getNumber(awayTeam?.gameProjection, 50),
        predictedSpread: getNumber(predictor.spread, 0),
        predictedTotal: getNumber(predictor.overUnder, 45),
      };
    } else {
      const oddsList = asArray(dataRecord?.odds);
      const odds = asRecord(oddsList[0]);
      if (odds) {
      prediction = {
        homeWinProbability: 50,
        awayWinProbability: 50,
        predictedSpread: getNumber(odds.spread, 0),
        predictedTotal: getNumber(odds.overUnder, 45),
      };
      }
    }

    let weather = undefined;
    const gameInfo = asRecord(dataRecord?.gameInfo);
    const weatherRecord = asRecord(gameInfo?.weather);
    if (weatherRecord) {
      weather = {
        temperature: getNumber(weatherRecord.temperature, 70),
        condition: getString(weatherRecord.displayValue, "Clear"),
      };
    }

    const matchup: MatchupData = {
      gameId,
      homeTeam: {
        id: getString(asRecord(homeRecord.team)?.id),
        name: getString(asRecord(homeRecord.team)?.displayName, getString(asRecord(homeRecord.team)?.name)),
        record: getString(asRecord(asArray(homeRecord.record)[0])?.displayValue, "0-0"),
        score: getOptionalNumber(homeRecord.score),
      },
      awayTeam: {
        id: getString(asRecord(awayRecord.team)?.id),
        name: getString(asRecord(awayRecord.team)?.displayName, getString(asRecord(awayRecord.team)?.name)),
        record: getString(asRecord(asArray(awayRecord.record)[0])?.displayValue, "0-0"),
        score: getOptionalNumber(awayRecord.score),
      },
      venue: getString(asRecord(gameInfo?.venue)?.fullName, getString(asRecord(competition.venue)?.fullName)),
      gameDate: getString(competition.date),
      status: getString(asRecord(asRecord(competition.status)?.type)?.description, "Scheduled"),
      prediction,
      weather,
    };

    await CacheService.set(cacheKey, matchup, CacheTTL.MEDIUM);
    return matchup;
  } catch (error) {
    logger.error({ type: "espn_matchup_error", gameId, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

export async function refreshAllEspnData(): Promise<{ refreshed: number; errors: number }> {
  let refreshed = 0;
  let errors = 0;

  const teamIds = Object.keys(ESPN_TEAM_ID_MAP);
  
  await CacheService.invalidatePattern("espn:*");

  for (const teamId of teamIds) {
    try {
      await getTeamStats(teamId);
      await getTeamInjuries(teamId);
      refreshed += 2;
      
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      errors++;
      logger.error({ type: "espn_refresh_error", teamId, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return { refreshed, errors };
}

export async function getUpcomingGames(): Promise<MatchupData[]> {
  const cacheKey = "espn:upcoming_games";
  
  const cached = await CacheService.get<MatchupData[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const url = `${ESPN_API_BASE}/scoreboard`;
    const data = await fetchFromEspn(url);
    const dataRecord = asRecord(data) ?? {};

    const games: MatchupData[] = [];

    const events = asArray(dataRecord.events);
    if (events.length > 0) {
      for (const event of events) {
        const eventRecord = asRecord(event);
        const eventId = getString(eventRecord?.id);
        if (!eventId) continue;
        const matchup = await getMatchupData(eventId);
        if (matchup) {
          games.push(matchup);
        }
      }
    }

    await CacheService.set(cacheKey, games, CacheTTL.MEDIUM);
    return games;
  } catch (error) {
    logger.error({ type: "espn_upcoming_error", error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

export const EspnService = {
  getTeamStats,
  getTeamInjuries,
  getTeamDepthChart,
  getMatchupData,
  refreshAllEspnData,
  getUpcomingGames,
  ESPN_TEAM_ID_MAP,
};

export default EspnService;
