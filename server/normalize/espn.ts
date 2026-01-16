import {
  NormalizedGame,
  EspnScoreboardResponse,
  EspnEvent,
  EspnCompetitor,
} from "./types";

/**
 * Normalize ESPN scoreboard response to unified game format
 * @param raw - Raw ESPN API response
 * @param season - NFL season year
 * @param week - Week number
 * @returns Array of normalized games
 */
export function normalizeESPNScoreboard(
  raw: EspnScoreboardResponse | null | undefined,
  season: number,
  week: number
): NormalizedGame[] {
  const events = raw?.events ?? [];
  
  return (Array.isArray(events) ? events : []).map((event: EspnEvent) => {
    const competition = event.competitions?.[0];
    const competitors = competition?.competitors ?? [];
    
    const home = competitors.find(
      (c: EspnCompetitor) => c.homeAway === "home"
    );
    const away = competitors.find(
      (c: EspnCompetitor) => c.homeAway === "away"
    );
    
    const homeAbbr = home?.team?.abbreviation;
    const awayAbbr = away?.team?.abbreviation;
    const key = `${season}-${week}-${awayAbbr ?? "UNK"}@${homeAbbr ?? "UNK"}`;
    
    return {
      key,
      sourceGameId: String(event.id ?? ""),
      source: "espn",
      season,
      week,
      scheduled: event.date,
      homeAbbr,
      awayAbbr,
      homeName: home?.team?.displayName,
      awayName: away?.team?.displayName,
      homeScore: home?.score != null ? Number(home.score) : null,
      awayScore: away?.score != null ? Number(away.score) : null,
      status: event.status?.type?.name,
    };
  });
}
