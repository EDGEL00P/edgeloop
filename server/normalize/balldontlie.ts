import {
  NormalizedGame,
  BdlGamesResponse,
  BdlGame,
} from "./types";

/**
 * Normalize BallDontLie games response to unified game format
 * @param raw - Raw BallDontLie API response
 * @param season - NFL season year
 * @param week - Week number
 * @returns Array of normalized games
 */
export function normalizeBDLGames(
  raw: BdlGamesResponse | BdlGame[] | null | undefined,
  season: number,
  week: number
): NormalizedGame[] {
  // Handle various response shapes
  const games = Array.isArray(raw)
    ? raw
    : (raw as BdlGamesResponse)?.data ?? (raw as BdlGamesResponse)?.games ?? [];
  
  return (Array.isArray(games) ? games : []).map((game: BdlGame) => {
    const home = game.home_team ?? game.homeTeam ?? {};
    const away = game.visitor_team ?? game.away_team ?? game.awayTeam ?? {};
    
    const homeAbbr = home.abbreviation ?? home.abbrev ?? home.alias;
    const awayAbbr = away.abbreviation ?? away.abbrev ?? away.alias;
    const key = `${season}-${week}-${awayAbbr ?? "UNK"}@${homeAbbr ?? "UNK"}`;
    
    return {
      key,
      sourceGameId: String(game.id ?? ""),
      source: "balldontlie",
      season,
      week,
      scheduled: game.date ?? game.scheduled ?? game.start_time ?? undefined,
      homeAbbr,
      awayAbbr,
      homeName: home.full_name ?? home.name ?? undefined,
      awayName: away.full_name ?? away.name ?? undefined,
      homeScore: game.home_team_score ?? game.home_score ?? null,
      awayScore: game.visitor_team_score ?? game.away_score ?? null,
      status: game.status ?? game.game_status ?? undefined,
    };
  });
}
