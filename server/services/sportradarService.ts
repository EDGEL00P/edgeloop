import { withHealth } from "../health/withHealth";

const BASE = process.env.SPORTRADAR_BASE_URL || "https://api.sportradar.com/nfl/official/trial/v7";
const LANG = process.env.SPORTRADAR_LANG || "en";
// Support both SPORTSRADAR_API_KEY (Vercel) and SPORTRADAR_API_KEY (legacy)
const API_KEY = process.env.SPORTSRADAR_API_KEY || process.env.SPORTRADAR_API_KEY;

async function srFetch(path: string): Promise<unknown> {
  if (!API_KEY) throw new Error("Missing SPORTSRADAR_API_KEY or SPORTRADAR_API_KEY");
  const url = `${BASE}/${LANG}${path}${path.includes("?") ? "&" : "?"}api_key=${encodeURIComponent(API_KEY)}`;
  return withHealth("sportradar", async () => {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`Sportradar error: ${res.status}`);
    return res.json();
  });
}

export const SportradarService = {
  getTeams: () => srFetch(`/league/teams.json`),
  getHierarchy: () => srFetch(`/league/hierarchy.json`),
  getSeasonSchedule: (year: number, type: "REG" | "PRE" | "PST" = "REG") =>
    srFetch(`/games/${year}/${type}/schedule.json`),
  getWeekSchedule: (year: number, type: "REG" | "PRE" | "PST", week: number) =>
    srFetch(`/games/${year}/${type}/${week}/schedule.json`),
  getGameSummary: (gameId: string) => srFetch(`/games/${gameId}/summary.json`),
  getPlayByPlay: (gameId: string) => srFetch(`/games/${gameId}/pbp.json`),
  getGameRoster: (gameId: string) => srFetch(`/games/${gameId}/roster.json`),
  getTeamProfile: (teamId: string) => srFetch(`/teams/${teamId}/profile.json`),
  getInjuries: (year: number) => srFetch(`/seasons/${year}/injuries.json`),
  getStandings: (year: number) => srFetch(`/seasons/${year}/standings.json`),
};
