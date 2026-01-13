import { NormalizedGame } from "./types";

export function normalizeSRSchedule(raw: any, season: number, week: number): NormalizedGame[] {
  const games = raw?.week?.games ?? raw?.games ?? [];
  return (Array.isArray(games) ? games : []).map((g: any) => {
    const homeAbbr = g.home?.alias;
    const awayAbbr = g.away?.alias;
    const key = `${season}-${week}-${awayAbbr ?? "UNK"}@${homeAbbr ?? "UNK"}`;
    return {
      key,
      sourceGameId: String(g.id ?? ""),
      source: "sportradar",
      season,
      week,
      scheduled: g.scheduled,
      homeAbbr,
      awayAbbr,
      homeName: g.home?.market ? `${g.home.market} ${g.home.name}` : g.home?.name,
      awayName: g.away?.market ? `${g.away.market} ${g.away.name}` : g.away?.name,
      homeScore: g.scoring?.home_points ?? g.home_points ?? null,
      awayScore: g.scoring?.away_points ?? g.away_points ?? null,
      status: g.status,
    };
  });
}
