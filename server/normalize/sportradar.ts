import {
  NormalizedGame,
  SportradarScheduleResponse,
  SportradarGame,
} from "./types";

/**
 * Normalize Sportradar schedule response to unified game format
 * @param raw - Raw Sportradar API response
 * @param season - NFL season year
 * @param week - Week number
 * @returns Array of normalized games
 */
export function normalizeSRSchedule(
  raw: SportradarScheduleResponse | null | undefined,
  season: number,
  week: number
): NormalizedGame[] {
  const games = raw?.week?.games ?? raw?.games ?? [];
  
  return (Array.isArray(games) ? games : []).map((game: SportradarGame) => {
    const homeAbbr = game.home?.alias;
    const awayAbbr = game.away?.alias;
    const key = `${season}-${week}-${awayAbbr ?? "UNK"}@${homeAbbr ?? "UNK"}`;
    
    return {
      key,
      sourceGameId: String(game.id ?? ""),
      source: "sportradar",
      season,
      week,
      scheduled: game.scheduled,
      homeAbbr,
      awayAbbr,
      homeName: game.home?.market
        ? `${game.home.market} ${game.home.name}`
        : game.home?.name,
      awayName: game.away?.market
        ? `${game.away.market} ${game.away.name}`
        : game.away?.name,
      homeScore: game.scoring?.home_points ?? game.home_points ?? null,
      awayScore: game.scoring?.away_points ?? game.away_points ?? null,
      status: game.status,
    };
  });
}
