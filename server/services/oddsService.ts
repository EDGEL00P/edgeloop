const THE_ODDS_API_URL = "https://api.the-odds-api.com/v4";
import { eq, and, or } from "drizzle-orm";

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

function parseBookmakerData(bookmaker: any): BookmakerOdds {
  const result: BookmakerOdds = {
    bookmaker: bookmaker.title || bookmaker.key,
    lastUpdate: bookmaker.last_update,
    markets: {},
  };

  for (const market of bookmaker.markets || []) {
    if (market.key === 'spreads') {
      const homeOutcome = market.outcomes?.find((o: any) => o.name === bookmaker.home_team || o.point !== undefined);
      const awayOutcome = market.outcomes?.find((o: any) => o.name !== homeOutcome?.name);
      if (homeOutcome && awayOutcome) {
        result.markets.spread = {
          homeSpread: homeOutcome.point,
          homePrice: homeOutcome.price,
          awaySpread: awayOutcome.point,
          awayPrice: awayOutcome.price,
        };
      }
    } else if (market.key === 'totals') {
      const overOutcome = market.outcomes?.find((o: any) => o.name === 'Over');
      const underOutcome = market.outcomes?.find((o: any) => o.name === 'Under');
      if (overOutcome && underOutcome) {
        result.markets.totals = {
          over: overOutcome.point,
          overPrice: overOutcome.price,
          under: underOutcome.point,
          underPrice: underOutcome.price,
        };
      }
    } else if (market.key === 'h2h') {
      const homeOutcome = market.outcomes?.find((o: any) => o.name === bookmaker.home_team);
      const awayOutcome = market.outcomes?.find((o: any) => o.name !== homeOutcome?.name);
      if (homeOutcome && awayOutcome) {
        result.markets.moneyline = {
          homePrice: homeOutcome.price,
          awayPrice: awayOutcome.price,
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
    console.warn("ODDS_API_KEY not configured - returning mock odds data");
    return getMockOdds();
  }

  if (!forceRefresh && oddsCache && Date.now() - oddsCache.timestamp < CACHE_DURATION_MS) {
    return oddsCache.data;
  }

  try {
    const url = `${THE_ODDS_API_URL}/sports/americanfootball_nfl/odds?apiKey=${apiKey}&regions=us&markets=spreads,totals,h2h&oddsFormat=american`;
    console.log("Fetching NFL odds from The Odds API...");
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Odds API error: ${response.status} - ${errorText}`);
      return getMockOdds();
    }

    const data = await response.json();
    const remainingRequests = response.headers.get('x-requests-remaining');
    const usedRequests = response.headers.get('x-requests-used');

    const games: GameOdds[] = (data || []).map((game: any) => {
      const bookmakers = (game.bookmakers || []).map((bm: any) => ({
        ...parseBookmakerData(bm),
        home_team: game.home_team,
      }));

      return {
        gameId: game.id,
        sportKey: game.sport_key,
        sportTitle: game.sport_title,
        commenceTime: game.commence_time,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        bookmakers: bookmakers.map((bm: any) => {
          const { home_team, ...rest } = bm;
          return rest;
        }),
        consensus: calculateConsensus(bookmakers),
      };
    });

    const result: OddsResponse = {
      games,
      remainingRequests: remainingRequests ? parseInt(remainingRequests) : null,
      usedRequests: usedRequests ? parseInt(usedRequests) : null,
    };

    oddsCache = { data: result, timestamp: Date.now() };
    console.log(`Cached ${games.length} NFL games with odds`);

    return result;
  } catch (error) {
    console.error("Failed to fetch odds:", error);
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
