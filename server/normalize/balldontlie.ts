import { NormalizedGame } from "./types";

export function normalizeBDLGames(raw: any, season: number, week: number): NormalizedGame[] {
  const games = raw?.data ?? raw?.games ?? raw ?? [];
  return (Array.isArray(games) ? games : []).map((g: any) => {
    const home = g.home_team ?? g.homeTeam ?? {};
    const away = g.visitor_team ?? g.away_team ?? g.awayTeam ?? {};
    const homeAbbr = home.abbreviation ?? home.abbrev ?? home.alias;
    const awayAbbr = away.abbreviation ?? away.abbrev ?? away.alias;
    const key = `${season}-${week}-${awayAbbr ?? "UNK"}@${homeAbbr ?? "UNK"}`;
    return {
      key,
      sourceGameId: String(g.id ?? ""),
      source: "balldontlie",
      season,
      week,
      scheduled: g.date ?? g.scheduled ?? g.start_time ?? undefined,
      homeAbbr,
      awayAbbr,
      homeName: home.full_name ?? home.name ?? undefined,
      awayName: away.full_name ?? away.name ?? undefined,
      homeScore: g.home_team_score ?? g.home_score ?? null,
      awayScore: g.visitor_team_score ?? g.away_score ?? null,
      status: g.status ?? g.game_status ?? undefined,
    };
  });
}
