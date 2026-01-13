import { NormalizedGame } from "./types";

export function normalizeESPNScoreboard(raw: any, season: number, week: number): NormalizedGame[] {
  const events = raw?.events ?? [];
  return (Array.isArray(events) ? events : []).map((e: any) => {
    const comp = e.competitions?.[0];
    const home = comp?.competitors?.find((c: any) => c.homeAway === "home");
    const away = comp?.competitors?.find((c: any) => c.homeAway === "away");
    const homeAbbr = home?.team?.abbreviation;
    const awayAbbr = away?.team?.abbreviation;
    const key = `${season}-${week}-${awayAbbr ?? "UNK"}@${homeAbbr ?? "UNK"}`;
    return {
      key,
      sourceGameId: String(e.id ?? ""),
      source: "espn",
      season,
      week,
      scheduled: e.date,
      homeAbbr,
      awayAbbr,
      homeName: home?.team?.displayName,
      awayName: away?.team?.displayName,
      homeScore: home?.score != null ? Number(home.score) : null,
      awayScore: away?.score != null ? Number(away.score) : null,
      status: e.status?.type?.name,
    };
  });
}
