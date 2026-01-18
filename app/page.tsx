import DashboardClient from "./components/DashboardClient";

const fallbackScoreboard = [
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

export type HealthStatus = {
  status?: string;
  timestamp?: string;
};

export type NewsItem = {
  title?: string;
  source?: string;
  pubDate?: string;
  link?: string;
};

export type OddsResponse = {
  games?: unknown[];
};

type OddsGame = {
  commenceTime?: string;
  consensus?: {
    total?: number;
    spread?: number;
    homeMoneyline?: number;
    awayMoneyline?: number;
  } | null;
};

export type ExploitSignal = {
  gameId?: number;
  signal?: string;
  category?: string;
  edge?: number;
  risk?: number;
  description?: string;
};

export type InjuryRecord = {
  player?: string;
  team?: string;
  position?: string;
  status?: string;
};

export type Team = {
  id: number;
  abbreviation?: string;
  name?: string;
  fullName?: string;
  location?: string;
};

export type Game = {
  id: number;
  date?: string;
  season?: number;
  week?: number;
  status?: string | null;
  homeTeamId?: number;
  visitorTeamId?: number;
  homeTeamScore?: number | null;
  visitorTeamScore?: number | null;
  venue?: string | null;
  time?: string | null;
};

type FetchResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

async function fetchJson<T>(url: string, timeoutMs = 5000): Promise<FetchResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  } finally {
    clearTimeout(timeout);
  }
}

export default async function HomePage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

  const apiUnavailable: FetchResult<unknown> = { ok: false, error: "API base not configured" };
  const season = Number(process.env.NEXT_PUBLIC_NFL_SEASON || 2025);
  const week = Number(process.env.NEXT_PUBLIC_NFL_WEEK || 1);
  const [health, news, odds] = await Promise.all([
    fetchJson<HealthStatus>(`${appUrl}/api/health`),
    apiBase
      ? fetchJson<NewsItem[]>(`${apiBase}/api/news/nfl`)
      : Promise.resolve(apiUnavailable as FetchResult<NewsItem[]>),
    apiBase
      ? fetchJson<OddsResponse>(`${apiBase}/api/odds/nfl`)
      : Promise.resolve(apiUnavailable as FetchResult<OddsResponse>),
  ]);

  const [teams, games, exploits, injuries] = apiBase
    ? await Promise.all([
        fetchJson<Team[]>(`${apiBase}/api/nfl/teams`),
        fetchJson<Game[]>(`${apiBase}/api/nfl/games?season=${season}&week=${week}`),
        fetchJson<unknown>(`${apiBase}/api/exploits/${season}/${week}`),
        fetchJson<unknown>(`${apiBase}/api/nfl/injuries`),
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
      ? newsItems.map((item) => item.title || "Breaking NFL Update")
      : [
          "Live feed ready — connect your data sources to stream headlines.",
          "Edge-grade analytics platform is online.",
          "Configure odds + weather APIs for full exploit engine.",
        ];
  const teamMap = new Map<number, Team>();
  if (teams.ok && Array.isArray(teams.data)) {
    teams.data.forEach((team) => {
      teamMap.set(team.id, team);
    });
  }
  const liveScoreboard =
    games.ok && Array.isArray(games.data) && games.data.length > 0
      ? games.data.slice(0, 3).map((game) => {
          const home = teamMap.get(game.homeTeamId || 0);
          const away = teamMap.get(game.visitorTeamId || 0);
          const status = game.status || (game.homeTeamScore || game.visitorTeamScore ? "Final" : "Preview");
          return {
            away: away?.abbreviation || away?.name || "AWAY",
            home: home?.abbreviation || home?.name || "HOME",
            status,
            time: game.time || game.date || "TBD",
            scoreAway: game.visitorTeamScore ?? null,
            scoreHome: game.homeTeamScore ?? null,
            spread: "—",
            total: "—",
          };
        })
      : fallbackScoreboard;

  const oddsGames = odds.ok && Array.isArray(odds.data?.games)
    ? (odds.data?.games as OddsGame[])
    : [];
  const oddsTrend = oddsGames.slice(0, 5).map((game, index) => ({
    label: `G${index + 1}`,
    value: game.consensus?.total ?? 0,
  }));

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

  const edgeValues = exploitArray
    .map((signal) => Number(signal.edge))
    .filter((value) => !Number.isNaN(value));
  const riskValues = exploitArray
    .map((signal) => Number(signal.risk))
    .filter((value) => !Number.isNaN(value));
  const edgeAvg = edgeValues.length
    ? Math.round(edgeValues.reduce((a, b) => a + b, 0) / edgeValues.length)
    : 0;
  const riskAvg = riskValues.length
    ? Math.round(riskValues.reduce((a, b) => a + b, 0) / riskValues.length)
    : 0;

  const edgeRisk = [
    { label: "Edge", edge: edgeAvg || 60, risk: riskAvg || 40 },
    { label: "Risk", edge: Math.max(20, edgeAvg - 15) || 45, risk: Math.max(20, riskAvg + 15) || 65 },
    { label: "Totals", edge: Math.max(20, edgeAvg - 5) || 55, risk: Math.max(20, riskAvg - 5) || 35 },
  ];

  return (
    <DashboardClient
      health={health}
      newsItems={newsItems}
      oddsCount={oddsCount}
      scoreboard={liveScoreboard}
      tickerItems={tickerItems}
      apiBase={apiBase}
      season={season}
      week={week}
      newsError={newsError}
      oddsError={oddsError}
      gamesError={gamesError}
      exploits={exploitArray}
      injuries={injuryArray}
      oddsTrend={oddsTrend.length ? oddsTrend : undefined}
      teamStats={teamStats.length ? teamStats : undefined}
      edgeRisk={edgeRisk}
      exploitsError={exploitsError}
      injuriesError={injuriesError}
    />
  );
}
