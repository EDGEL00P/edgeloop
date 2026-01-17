import { fetchBDLGames, fetchESPNScoreboard } from "./fetchers";
import { SportradarService } from "../services/sportradarService";
import { normalizeBDLGames } from "../normalize/balldontlie";
import { normalizeESPNScoreboard } from "../normalize/espn";
import { normalizeSRSchedule } from "../normalize/sportradar";
import { NormalizedGame } from "../normalize/types";

type CrossrefResult = {
  season: number;
  week: number;
  byKey: Record<string, {
    games: Record<string, NormalizedGame>;
    conflicts: string[];
  }>;
  missing: Record<string, string[]>; // source -> keys missing
};

function diff(a?: NormalizedGame, b?: NormalizedGame): string[] {
  const out: string[] = [];
  if (!a || !b) return out;
  if (a.homeAbbr && b.homeAbbr && a.homeAbbr !== b.homeAbbr) out.push("homeAbbr");
  if (a.awayAbbr && b.awayAbbr && a.awayAbbr !== b.awayAbbr) out.push("awayAbbr");
  if (a.scheduled && b.scheduled) {
    const da = Date.parse(a.scheduled);
    const db = Date.parse(b.scheduled);
    if (Number.isFinite(da) && Number.isFinite(db)) {
      const mins = Math.abs(da - db) / 60000;
      if (mins > 5) out.push("scheduled");
    }
  }
  if (a.homeScore != null && b.homeScore != null && a.homeScore !== b.homeScore) out.push("homeScore");
  if (a.awayScore != null && b.awayScore != null && a.awayScore !== b.awayScore) out.push("awayScore");
  if (a.status && b.status && a.status !== b.status) out.push("status");
  return out;
}

export async function crossrefGames(season: number, week: number): Promise<CrossrefResult> {
  const [sr, espn, bdl] = await Promise.allSettled([
    process.env.SPORTRADAR_API_KEY ? SportradarService.getWeekSchedule(season, "REG", week) : Promise.reject(new Error("Sportradar disabled")),
    fetchESPNScoreboard(season, week),
    fetchBDLGames(season, week),
  ]);

  const srGames = sr.status === "fulfilled" ? normalizeSRSchedule(sr.value as Parameters<typeof normalizeSRSchedule>[0], season, week) : [];
  const espnGames = espn.status === "fulfilled" ? normalizeESPNScoreboard(espn.value, season, week) : [];
  const bdlGames = bdl.status === "fulfilled" ? normalizeBDLGames(bdl.value, season, week) : [];

  const allKeys = new Set<string>([...srGames, ...espnGames, ...bdlGames].map(g => g.key));

  const byKey: CrossrefResult["byKey"] = {};
  for (const key of allKeys) {
    const games: Record<string, NormalizedGame> = {};
    const pick = (arr: NormalizedGame[]) => arr.find(g => g.key === key);
    const gsr = pick(srGames); if (gsr) games.sportradar = gsr;
    const gesp = pick(espnGames); if (gesp) games.espn = gesp;
    const gbdl = pick(bdlGames); if (gbdl) games.balldontlie = gbdl;

    const conflicts = [
      ...diff(gsr, gesp),
      ...diff(gsr, gbdl),
      ...diff(gesp, gbdl),
    ];
    byKey[key] = { games, conflicts: Array.from(new Set(conflicts)) };
  }

  const missing: CrossrefResult["missing"] = { sportradar: [], espn: [], balldontlie: [] };
  for (const key of allKeys) {
    if (!byKey[key].games.sportradar) missing.sportradar.push(key);
    if (!byKey[key].games.espn) missing.espn.push(key);
    if (!byKey[key].games.balldontlie) missing.balldontlie.push(key);
  }

  return { season, week, byKey, missing };
}
