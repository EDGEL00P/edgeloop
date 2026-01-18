/**
 * Home Page Component
 * 
 * Server-side component that fetches dashboard data and renders DashboardClient.
 * Handles data fetching, error handling, and data transformation.
 * 
 * @module app/page
 */

import { z } from "zod";
import DashboardClient from "./components/DashboardClient";
import type {
  HealthStatus,
  NewsItem,
  OddsResponse,
  OddsGame,
  ExploitSignal,
  InjuryRecord,
  Team,
  Game,
  FetchResult,
  ScoreboardCard,
  ChartDataPoint,
  EdgeRiskDataPoint,
} from "./types/dashboard.types";

/**
 * API response schemas for validation (per godmode rule 5)
 */
const HealthStatusSchema = z.object({
  status: z.string().optional(),
  timestamp: z.string().optional(),
});

const NewsItemSchema = z.object({
  title: z.string().optional(),
  source: z.string().optional(),
  pubDate: z.string().optional(),
  link: z.string().url().optional(),
});

const NewsItemsSchema = z.array(NewsItemSchema);

const TeamSchema = z.object({
  id: z.number().int(),
  abbreviation: z.string().optional(),
  name: z.string().optional(),
  fullName: z.string().optional(),
  location: z.string().optional(),
});

const TeamsSchema = z.array(TeamSchema);

const GameSchema = z.object({
  id: z.number().int(),
  date: z.string().optional(),
  season: z.number().int().optional(),
  week: z.number().int().optional(),
  status: z.string().nullable().optional(),
  homeTeamId: z.number().int().optional(),
  visitorTeamId: z.number().int().optional(),
  homeTeamScore: z.number().nullable().optional(),
  visitorTeamScore: z.number().nullable().optional(),
  venue: z.string().nullable().optional(),
  time: z.string().nullable().optional(),
});

const GamesSchema = z.array(GameSchema);

const OddsResponseSchema = z.object({
  games: z.array(z.unknown()).optional(),
});

const ExploitSignalSchema = z.object({
  id: z.string().optional(),
  gameId: z.number().int().optional(),
  type: z.string().optional(),
  signal: z.string().optional(),
  name: z.string().optional(),
  category: z.string().optional(),
  confidence: z.number().optional(),
  direction: z.enum(["home", "away", "over", "under", "neutral"]).optional(),
  edge: z.number().optional(),
  risk: z.number().optional(),
  description: z.string().optional(),
});

const ExploitSignalsSchema = z.array(ExploitSignalSchema).or(z.object({
  data: z.array(ExploitSignalSchema).optional(),
}));

const InjuryRecordSchema = z.object({
  player: z.string().optional(),
  team: z.string().optional(),
  position: z.string().optional(),
  status: z.string().optional(),
});

const InjuryRecordsSchema = z.array(InjuryRecordSchema).or(z.object({
  data: z.array(InjuryRecordSchema).optional(),
}));

/**
 * Fallback scoreboard data when live data is unavailable
 */
const fallbackScoreboard: readonly ScoreboardCard[] = [
  {
    away: "BUF",
    home: "KC",
    status: "Preview",
    time: "Sun 4:25 PM",
    spread: "KC -2.5",
    total: "O/U 48.5",
  },
  {
    away: "PHI",
    home: "DAL",
    status: "Preview",
    time: "Sun 8:20 PM",
    spread: "PHI -1.0",
    total: "O/U 46.0",
  },
  {
    away: "SF",
    home: "SEA",
    status: "Preview",
    time: "Mon 8:15 PM",
    spread: "SF -3.5",
    total: "O/U 44.0",
  },
];

/**
 * Fetches JSON data from a URL with timeout and error handling.
 * 
 * Per godmode rule 5: All data at boundary layers must be schema-validated.
 * Note: This function accepts optional schema for validation. When no schema
 * is provided, it still returns typed data but cannot validate structure.
 * 
 * @param url - URL to fetch from
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @param schema - Optional Zod schema for runtime validation
 * @returns Promise resolving to FetchResult with validated data or error
 */
async function fetchJson<T>(
  url: string, 
  timeoutMs = 5000,
  schema?: z.ZodSchema<T>
): Promise<FetchResult<T>> {
  // Guard clause: validate URL
  if (!url || typeof url !== "string") {
    return { ok: false, error: "Invalid URL" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });
    
    // Guard clause: check response status
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    
    const rawData = await res.json();
    
    // Validate with schema if provided (per godmode rule 5)
    if (schema) {
      const validated = schema.parse(rawData);
      return { ok: true, data: validated };
    }
    
    // No schema: return as-is (per godmode rule 5, schemas are optional but recommended)
    
    return { ok: true, data: rawData as T };
  } catch (error) {
    // Guard clause: handle validation errors
    if (error instanceof z.ZodError) {
      return { ok: false, error: `Validation error: ${error.message}` };
    }
    
    // Guard clause: handle network/timeout errors
    if (error instanceof Error) {
      return { ok: false, error: error.message };
    }
    
    return { ok: false, error: "Unknown error" };
  } finally {
    clearTimeout(timeout);
  }
}

export default async function HomePage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

  const apiUnavailable: FetchResult<unknown> = { ok: false, error: "API base not configured" };
  
  // Validate and parse season/week from environment
  const seasonRaw = process.env.NEXT_PUBLIC_NFL_SEASON ?? "2025";
  const weekRaw = process.env.NEXT_PUBLIC_NFL_WEEK ?? "1";
  
  const season = Number.parseInt(seasonRaw, 10);
  const week = Number.parseInt(weekRaw, 10);
  
  // Guard clause: validate parsed values
  if (Number.isNaN(season) || season < 2020 || season > 2030) {
    throw new Error(`Invalid season: ${seasonRaw}`);
  }
  
  if (Number.isNaN(week) || week < 1 || week > 18) {
    throw new Error(`Invalid week: ${weekRaw}`);
  }
  const [health, news, odds] = await Promise.all([
    fetchJson<HealthStatus>(`${appUrl}/api/health`, 5000, HealthStatusSchema),
    apiBase
      ? fetchJson<NewsItem[]>(`${apiBase}/api/news/nfl`, 5000, NewsItemsSchema)
      : Promise.resolve(apiUnavailable as FetchResult<NewsItem[]>),
    apiBase
      ? fetchJson<OddsResponse>(`${apiBase}/api/odds/nfl`, 5000, OddsResponseSchema)
      : Promise.resolve(apiUnavailable as FetchResult<OddsResponse>),
  ]);

  const [teams, games, exploits, injuries] = apiBase
    ? await Promise.all([
        fetchJson<Team[]>(`${apiBase}/api/nfl/teams`, 5000, TeamsSchema),
        fetchJson<Game[]>(`${apiBase}/api/nfl/games?season=${season}&week=${week}`, 5000, GamesSchema),
        fetchJson<unknown>(`${apiBase}/api/exploits/${season}/${week}`, 5000, ExploitSignalsSchema),
        fetchJson<unknown>(`${apiBase}/api/nfl/injuries`, 5000, InjuryRecordsSchema),
      ])
    : [
        apiUnavailable as FetchResult<Team[]>,
        apiUnavailable as FetchResult<Game[]>,
        apiUnavailable as FetchResult<unknown>,
        apiUnavailable as FetchResult<unknown>,
      ];

  const newsItems = news.ok && Array.isArray(news.data) ? news.data.slice(0, 8) : [];
  const oddsCount = odds.ok && odds.data?.games ? odds.data.games.length : 0;
  const newsError = !news.ok ? news.error : undefined;
  const oddsError = !odds.ok ? odds.error : undefined;
  const gamesError = !games.ok ? games.error : undefined;
  const exploitsError = !exploits.ok ? exploits.error : undefined;
  const injuriesError = !injuries.ok ? injuries.error : undefined;
  const tickerItems =
    newsItems.length > 0
      ? newsItems.map((item) => item.title || "Edgeloop: Breaking NFL Update")
      : [
          "Edgeloop active — connect your data sources to stream headlines.",
          "Edgeloop analytics platform is online.",
          "Configure odds + weather APIs for full Edgeloop exploit engine.",
        ];
  const teamMap = new Map<number, Team>();
  if (teams.ok && Array.isArray(teams.data)) {
    teams.data.forEach((team) => {
      teamMap.set(team.id, team);
    });
  }
  /**
   * Maps games to scoreboard cards with team information.
   */
  function mapGameToScoreboard(game: Game, teamMap: ReadonlyMap<number, Team>): ScoreboardCard {
    const home = teamMap.get(game.homeTeamId ?? 0);
    const away = teamMap.get(game.visitorTeamId ?? 0);
    
    const hasScore = game.homeTeamScore !== null || game.visitorTeamScore !== null;
    const status = game.status ?? (hasScore ? "Final" : "Preview");
    
    return {
      away: away?.abbreviation ?? away?.name ?? "AWAY",
      home: home?.abbreviation ?? home?.name ?? "HOME",
      status,
      time: game.time ?? game.date ?? "TBD",
      scoreAway: game.visitorTeamScore ?? null,
      scoreHome: game.homeTeamScore ?? null,
      spread: "—",
      total: "—",
    };
  }

  const liveScoreboard: readonly ScoreboardCard[] =
    games.ok && Array.isArray(games.data) && games.data.length > 0
      ? games.data.slice(0, 3).map((game) => mapGameToScoreboard(game, teamMap))
      : fallbackScoreboard;

  /**
   * Extracts odds trend data from odds games.
   */
  function extractOddsTrend(oddsGames: readonly OddsGame[]): readonly ChartDataPoint[] {
    return oddsGames.slice(0, 5).map((game, index) => ({
      label: `G${index + 1}`,
      value: game.consensus?.total ?? 0,
    }));
  }

  const oddsGames: readonly OddsGame[] = odds.ok && Array.isArray(odds.data?.games)
    ? (odds.data?.games as OddsGame[])
    : [];
  const oddsTrend: readonly ChartDataPoint[] = extractOddsTrend(oddsGames);

  const exploitArray = Array.isArray(exploits.data)
    ? (exploits.data as ExploitSignal[])
    : Array.isArray((exploits.data as { data?: unknown })?.data)
      ? ((exploits.data as { data: ExploitSignal[] }).data ?? [])
      : [];

  const injuriesPayload = injuries.data as { data?: unknown } | undefined;
  const injuryArray = Array.isArray(injuriesPayload?.data)
    ? (injuriesPayload?.data as InjuryRecord[])
    : Array.isArray(injuries.data)
      ? (injuries.data as InjuryRecord[])
      : [];

  const statusCounts = injuryArray.reduce<Record<string, number>>((acc, item) => {
    const status = (item.status || "Unknown").toString();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const teamStats = Object.entries(statusCounts)
    .slice(0, 4)
    .map(([label, value]) => ({ label, value }));

  /**
   * Calculates edge/risk averages from exploit signals.
   */
  function calculateEdgeRisk(exploits: readonly ExploitSignal[]): readonly EdgeRiskDataPoint[] {
    const edgeValues = exploits
      .map((signal) => Number(signal.edge))
      .filter((value) => !Number.isNaN(value));
    const riskValues = exploits
      .map((signal) => Number(signal.risk))
      .filter((value) => !Number.isNaN(value));
    
    const edgeAvg = edgeValues.length > 0
      ? Math.round(edgeValues.reduce((a, b) => a + b, 0) / edgeValues.length)
      : 60;
    const riskAvg = riskValues.length > 0
      ? Math.round(riskValues.reduce((a, b) => a + b, 0) / riskValues.length)
      : 40;

    return [
      { label: "Edge", edge: edgeAvg, risk: riskAvg },
      { label: "Risk", edge: Math.max(20, edgeAvg - 15), risk: Math.max(20, riskAvg + 15) },
      { label: "Totals", edge: Math.max(20, edgeAvg - 5), risk: Math.max(20, riskAvg - 5) },
    ];
  }

  const edgeRisk: readonly EdgeRiskDataPoint[] = calculateEdgeRisk(exploitArray);

  // Convert readonly arrays to arrays for props (DashboardClient accepts readonly)
  const oddsTrendProp = oddsTrend.length > 0 ? [...oddsTrend] : undefined;
  const teamStatsProp = teamStats.length > 0 ? [...teamStats] : undefined;
  const edgeRiskProp = [...edgeRisk];

  return (
    <DashboardClient
      health={health}
      newsItems={newsItems}
      oddsCount={oddsCount}
      scoreboard={[...liveScoreboard]}
      tickerItems={[...tickerItems]}
      apiBase={apiBase}
      season={season}
      week={week}
      newsError={newsError}
      oddsError={oddsError}
      gamesError={gamesError}
      exploits={exploitArray}
      injuries={injuryArray}
      oddsTrend={oddsTrendProp}
      teamStats={teamStatsProp}
      edgeRisk={edgeRiskProp}
      exploitsError={exploitsError}
      injuriesError={injuriesError}
    />
  );
}
