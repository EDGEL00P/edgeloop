import { CacheService, CacheKeys, CacheTTL } from "../infrastructure/cache";
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

async function fetchFromEspn(url: string): Promise<any> {
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

    const [teamData, statsData] = await Promise.all([
      fetchFromEspn(teamUrl).catch(() => null),
      fetchFromEspn(statsUrl).catch(() => null),
    ]);

    if (!teamData?.team) {
      return null;
    }

    const team = teamData.team;
    const record = team.record?.items?.[0]?.summary || "0-0";

    let offenseRank = 16;
    let defenseRank = 16;
    let yardsPerPlay = 5.5;
    let pointsPerGame = 21;
    let pointsAllowedPerGame = 21;
    let totalYards = 0;
    let totalYardsAllowed = 0;

    if (statsData?.results?.stats?.categories) {
      const categories = statsData.results.stats.categories;
      
      for (const cat of categories) {
        if (cat.name === "offensive") {
          for (const stat of cat.stats || []) {
            if (stat.name === "totalYards") totalYards = stat.value || 0;
            if (stat.name === "yardsPerPlay") yardsPerPlay = stat.value || 5.5;
            if (stat.name === "totalPointsPerGame") pointsPerGame = stat.value || 21;
          }
        }
        if (cat.name === "defensive") {
          for (const stat of cat.stats || []) {
            if (stat.name === "totalYards") totalYardsAllowed = stat.value || 0;
            if (stat.name === "totalPointsPerGame") pointsAllowedPerGame = stat.value || 21;
          }
        }
      }
    }

    const epa = (pointsPerGame - pointsAllowedPerGame) / 10;
    const successRate = yardsPerPlay > 5.5 ? 0.48 + (yardsPerPlay - 5.5) * 0.02 : 0.45;

    const stats: TeamStats = {
      teamId,
      teamName: team.displayName || team.name,
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
    
    const [teamData, leagueData] = await Promise.all([
      fetchFromEspn(teamInjuriesUrl).catch(() => ({})),
      fetchFromEspn(leagueInjuriesUrl).catch(() => ({})),
    ]);

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

    const processInjury = (injury: any, player?: any) => {
      const athlete = player || injury.athlete || {};
      const injuryDetails = injury.injuries?.[0] || injury;
      const rawStatus = (injuryDetails.status || injury.status || "").toLowerCase();
      const status: InjuryStatus = statusMap[rawStatus] || "Questionable";

      return {
        playerId: athlete.id?.toString() || "",
        playerName: athlete.displayName || athlete.fullName || athlete.name || "",
        position: athlete.position?.abbreviation || athlete.position || "",
        status,
        injury: injuryDetails.type?.description || injuryDetails.description || injury.longComment || injury.shortComment || "Unknown",
        returnDate: injuryDetails.date || injury.date || null,
      };
    };

    if (teamData?.team?.injuries) {
      for (const injury of teamData.team.injuries) {
        injuries.push(processInjury(injury));
      }
    }

    if (leagueData?.injuries) {
      for (const teamInjuries of leagueData.injuries) {
        if (teamInjuries?.team?.id?.toString() === espnTeamId) {
          for (const injury of teamInjuries.injuries || []) {
            if (!injuries.some(i => i.playerId === injury.athlete?.id?.toString())) {
              injuries.push(processInjury(injury));
            }
          }
        }
      }
    }

    if (teamData?.items) {
      for (const item of teamData.items) {
        const athlete = item.athlete || {};
        if (!injuries.some(i => i.playerId === athlete.id?.toString())) {
          injuries.push(processInjury(item, athlete));
        }
      }
    }

    await CacheService.set(cacheKey, injuries, CacheTTL.MEDIUM);
    return injuries;
  } catch (error) {
    logger.error({ type: "espn_injuries_error", teamId, error: (error as Error).message });
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
    
    const [depthData, rosterData] = await Promise.all([
      fetchFromEspn(depthChartUrl).catch(() => ({})),
      fetchFromEspn(rosterUrl).catch(() => ({})),
    ]);

    const depthChart: DepthChartPosition[] = [];
    const positionMap = new Map<string, DepthChartPlayer[]>();

    if (depthData?.depthCharts?.[0]?.positions) {
      for (const pos of Object.keys(depthData.depthCharts[0].positions)) {
        const positionData = depthData.depthCharts[0].positions[pos];
        const players: DepthChartPlayer[] = [];

        if (positionData?.athletes) {
          let depth = 1;
          for (const athlete of positionData.athletes) {
            players.push({
              name: athlete.displayName || athlete.fullName || "",
              jerseyNumber: athlete.jersey || null,
              experience: athlete.experience?.years?.toString() || null,
              playerId: athlete.id?.toString() || "",
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

    if (rosterData?.athletes) {
      for (const group of rosterData.athletes) {
        for (const athlete of group.items || []) {
          const pos = athlete.position?.abbreviation || athlete.position?.displayName || "UNKNOWN";
          if (!positionMap.has(pos)) {
            positionMap.set(pos, []);
          }
          const players = positionMap.get(pos)!;
          if (!players.some(p => p.playerId === athlete.id?.toString())) {
            players.push({
              name: athlete.displayName || athlete.fullName || "",
              jerseyNumber: athlete.jersey || null,
              experience: athlete.experience?.years?.toString() || null,
              playerId: athlete.id?.toString() || "",
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
    logger.error({ type: "espn_depth_error", teamId, error: (error as Error).message });
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

    if (!data?.header?.competitions?.[0]) {
      return null;
    }

    const competition = data.header.competitions[0];
    const competitors = competition.competitors || [];
    
    const homeCompetitor = competitors.find((c: any) => c.homeAway === "home");
    const awayCompetitor = competitors.find((c: any) => c.homeAway === "away");

    if (!homeCompetitor || !awayCompetitor) {
      return null;
    }

    let prediction = undefined;
    if (data.predictor) {
      prediction = {
        homeWinProbability: data.predictor.homeTeam?.gameProjection || 50,
        awayWinProbability: data.predictor.awayTeam?.gameProjection || 50,
        predictedSpread: data.predictor.spread || 0,
        predictedTotal: data.predictor.overUnder || 45,
      };
    } else if (data.odds?.[0]) {
      const odds = data.odds[0];
      prediction = {
        homeWinProbability: 50,
        awayWinProbability: 50,
        predictedSpread: parseFloat(odds.spread) || 0,
        predictedTotal: parseFloat(odds.overUnder) || 45,
      };
    }

    let weather = undefined;
    if (data.gameInfo?.weather) {
      weather = {
        temperature: data.gameInfo.weather.temperature || 70,
        condition: data.gameInfo.weather.displayValue || "Clear",
      };
    }

    const matchup: MatchupData = {
      gameId,
      homeTeam: {
        id: homeCompetitor.team?.id?.toString() || "",
        name: homeCompetitor.team?.displayName || homeCompetitor.team?.name || "",
        record: homeCompetitor.record?.[0]?.displayValue || "0-0",
        score: homeCompetitor.score ? parseInt(homeCompetitor.score) : undefined,
      },
      awayTeam: {
        id: awayCompetitor.team?.id?.toString() || "",
        name: awayCompetitor.team?.displayName || awayCompetitor.team?.name || "",
        record: awayCompetitor.record?.[0]?.displayValue || "0-0",
        score: awayCompetitor.score ? parseInt(awayCompetitor.score) : undefined,
      },
      venue: data.gameInfo?.venue?.fullName || competition.venue?.fullName || "",
      gameDate: competition.date || "",
      status: competition.status?.type?.description || "Scheduled",
      prediction,
      weather,
    };

    await CacheService.set(cacheKey, matchup, CacheTTL.MEDIUM);
    return matchup;
  } catch (error) {
    logger.error({ type: "espn_matchup_error", gameId, error: (error as Error).message });
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
      logger.error({ type: "espn_refresh_error", teamId, error: (error as Error).message });
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

    const games: MatchupData[] = [];

    if (data?.events) {
      for (const event of data.events) {
        const matchup = await getMatchupData(event.id);
        if (matchup) {
          games.push(matchup);
        }
      }
    }

    await CacheService.set(cacheKey, games, CacheTTL.MEDIUM);
    return games;
  } catch (error) {
    logger.error({ type: "espn_upcoming_error", error: (error as Error).message });
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
