import { withHealth } from "../health/withHealth";

const BASE = process.env.RAPIDAPI_BASE_URL || "https://api-nfl-v1.p.rapidapi.com";
const HOST = process.env.RAPIDAPI_HOST || "api-nfl-v1.p.rapidapi.com";
const KEY = process.env.RAPIDAPI_KEY;

async function rapidFetch(path: string): Promise<unknown> {
  if (!KEY) throw new Error("Missing RAPIDAPI_KEY");
  const url = `${BASE}${path}`;
  return withHealth("rapidapi", async () => {
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": KEY,
        "X-RapidAPI-Host": HOST,
        accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`RapidAPI error: ${res.status}`);
    return res.json();
  });
}

// NOTE: RapidAPI providers vary; these endpoints match api-nfl-v1 commonly used paths.
// Adjust if your RapidAPI NFL provider differs.
export const RapidApiNflService = {
  getGames: (season?: number, week?: number) => {
    const params = new URLSearchParams();
    if (season) params.set("season", String(season));
    if (week) params.set("week", String(week));
    return rapidFetch(`/games?${params.toString()}`);
  },
  getTeams: () => rapidFetch(`/teams`),
  getPlayers: (teamId?: string) => rapidFetch(teamId ? `/players?team=${encodeURIComponent(teamId)}` : `/players`),
  getInjuries: () => rapidFetch(`/injuries`),
};
