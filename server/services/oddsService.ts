import { logger } from "../infrastructure/logger";

const THE_ODDS_API_URL = "https://api.the-odds-api.com/v4";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null ? (value as JsonRecord) : null;
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

export interface BookmakerOdds {
  bookmaker: string;
  lastUpdate: string;
  markets: {
    spread?: { homeSpread: number; homePrice: number; awaySpread: number; awayPrice: number };
    totals?: { over: number; overPrice: number; under: number; underPrice: number };
    moneyline?: { homePrice: number; awayPrice: number };
  };
}

export interface GameOdds {
  gameId: string;
  sportKey: string;
  sportTitle: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  bookmakers: BookmakerOdds[];
  consensus: {
    spread: number;
    spreadPrice: number;
    total: number;
    totalPrice: number;
    homeMoneyline: number;
    awayMoneyline: number;
  } | null;
}

export interface OddsResponse {
  games: GameOdds[];
  remainingRequests: number | null;
  usedRequests: number | null;
}

interface OddsCacheEntry {
  data: OddsResponse;
  timestamp: number;
}

let oddsCache: OddsCacheEntry | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000;

function parseBookmakerData(bookmaker: unknown, homeTeam: string): BookmakerOdds {
  const bookmakerRecord = asRecord(bookmaker) ?? {};
  const result: BookmakerOdds = {
    bookmaker: getString(bookmakerRecord.title, getString(bookmakerRecord.key)),
    lastUpdate: getString(bookmakerRecord.last_update),
    markets: {},
  };

  const markets = asArray(bookmakerRecord.markets);
  for (const market of markets) {
    const marketRecord = asRecord(market) ?? {};
    const marketKey = getString(marketRecord.key);
    const outcomes = asArray(marketRecord.outcomes);

    if (marketKey === "spreads") {
      const homeOutcome = outcomes.find((o) => getString(asRecord(o)?.name) === homeTeam || asRecord(o)?.point !== undefined);
      const awayOutcome = outcomes.find((o) => getString(asRecord(o)?.name) !== getString(asRecord(homeOutcome)?.name));
      if (homeOutcome && awayOutcome) {
        result.markets.spread = {
          homeSpread: getNumber(asRecord(homeOutcome)?.point),
          homePrice: getNumber(asRecord(homeOutcome)?.price),
          awaySpread: getNumber(asRecord(awayOutcome)?.point),
          awayPrice: getNumber(asRecord(awayOutcome)?.price),
        };
      }
    } else if (marketKey === "totals") {
      const overOutcome = outcomes.find((o) => getString(asRecord(o)?.name) === "Over");
      const underOutcome = outcomes.find((o) => getString(asRecord(o)?.name) === "Under");
      if (overOutcome && underOutcome) {
        result.markets.totals = {
          over: getNumber(asRecord(overOutcome)?.point),
          overPrice: getNumber(asRecord(overOutcome)?.price),
          under: getNumber(asRecord(underOutcome)?.point),
          underPrice: getNumber(asRecord(underOutcome)?.price),
        };
      }
    } else if (marketKey === "h2h") {
      const homeOutcome = outcomes.find((o) => getString(asRecord(o)?.name) === homeTeam);
      const awayOutcome = outcomes.find((o) => getString(asRecord(o)?.name) !== getString(asRecord(homeOutcome)?.name));
      if (homeOutcome && awayOutcome) {
        result.markets.moneyline = {
          homePrice: getNumber(asRecord(homeOutcome)?.price),
          awayPrice: getNumber(asRecord(awayOutcome)?.price),
        };
      }
    }
  }

  return result;
}

function calculateConsensus(bookmakers: BookmakerOdds[]): GameOdds['consensus'] {
  const spreads: number[] = [];
  const totals: number[] = [];
  const homeMLs: number[] = [];
  const awayMLs: number[] = [];

  for (const bm of bookmakers) {
    if (bm.markets.spread) spreads.push(bm.markets.spread.homeSpread);
    if (bm.markets.totals) totals.push(bm.markets.totals.over);
    if (bm.markets.moneyline) {
      homeMLs.push(bm.markets.moneyline.homePrice);
      awayMLs.push(bm.markets.moneyline.awayPrice);
    }
  }

  if (spreads.length === 0 && totals.length === 0) return null;

  return {
    spread: spreads.length > 0 ? spreads.reduce((a, b) => a + b, 0) / spreads.length : 0,
    spreadPrice: -110,
    total: totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : 45,
    totalPrice: -110,
    homeMoneyline: homeMLs.length > 0 ? Math.round(homeMLs.reduce((a, b) => a + b, 0) / homeMLs.length) : -110,
    awayMoneyline: awayMLs.length > 0 ? Math.round(awayMLs.reduce((a, b) => a + b, 0) / awayMLs.length) : -110,
  };
}

export async function getNflOdds(forceRefresh = false): Promise<OddsResponse> {
  const apiKey = process.env.ODDS_API_KEY;

  if (!apiKey) {
    logger.warn({ type: "odds_api_missing_key", message: "ODDS_API_KEY not configured" });
    return getMockOdds();
  }

  if (!forceRefresh && oddsCache && Date.now() - oddsCache.timestamp < CACHE_DURATION_MS) {
    return oddsCache.data;
  }

  try {
    const url = `${THE_ODDS_API_URL}/sports/americanfootball_nfl/odds?apiKey=${apiKey}&regions=us&markets=spreads,totals,h2h&oddsFormat=american`;
    logger.info({ type: "odds_api_fetch_start" });
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ type: "odds_api_error", status: response.status, error: errorText });
      return getMockOdds();
    }

    const data = await response.json();
    const remainingRequests = response.headers.get('x-requests-remaining');
    const usedRequests = response.headers.get('x-requests-used');

    const games: GameOdds[] = asArray(data).map((game) => {
      const gameRecord = asRecord(game) ?? {};
      const homeTeam = getString(gameRecord.home_team);
      const bookmakers = asArray(gameRecord.bookmakers).map((bm) => parseBookmakerData(bm, homeTeam));

      return {
        gameId: getString(gameRecord.id),
        sportKey: getString(gameRecord.sport_key),
        sportTitle: getString(gameRecord.sport_title),
        commenceTime: getString(gameRecord.commence_time),
        homeTeam,
        awayTeam: getString(gameRecord.away_team),
        bookmakers,
        consensus: calculateConsensus(bookmakers),
      };
    });

    const result: OddsResponse = {
      games,
      remainingRequests: remainingRequests ? parseInt(remainingRequests) : null,
      usedRequests: usedRequests ? parseInt(usedRequests) : null,
    };

    oddsCache = { data: result, timestamp: Date.now() };
    logger.info({ type: "odds_api_cached", games: games.length });

    return result;
  } catch (error) {
    logger.error({ type: "odds_api_fetch_failed", error: error instanceof Error ? error.message : String(error) });
    return getMockOdds();
  }
}

function getMockOdds(): OddsResponse {
  return {
    games: [],
    remainingRequests: null,
    usedRequests: null,
  };
}

export async function getOddsForGame(homeTeam: string, awayTeam: string): Promise<GameOdds | null> {
  const odds = await getNflOdds();
  
  const normalizeTeamName = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '');
  
  const game = odds.games.find(g => {
    const homeMatch = normalizeTeamName(g.homeTeam).includes(normalizeTeamName(homeTeam)) ||
                      normalizeTeamName(homeTeam).includes(normalizeTeamName(g.homeTeam));
    const awayMatch = normalizeTeamName(g.awayTeam).includes(normalizeTeamName(awayTeam)) ||
                      normalizeTeamName(awayTeam).includes(normalizeTeamName(g.awayTeam));
    return homeMatch && awayMatch;
  });
  
  return game || null;
}

export const OddsService = {
  getNflOdds,
  getOddsForGame,
};
