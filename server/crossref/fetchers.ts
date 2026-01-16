/**
 * Data fetchers for cross-referencing game data
 * Fetches from ESPN and BallDontLie APIs
 */

import { withHealth } from "../health/withHealth";
import {
  EspnScoreboardResponse,
  BdlGamesResponse,
} from "../normalize/types";

/**
 * Fetch NFL scoreboard data from ESPN API
 */
export async function fetchESPNScoreboard(
  season: number,
  week: number
): Promise<EspnScoreboardResponse> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${week}&dates=${season}`;
  
  return withHealth("espn", async () => {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
        "Referer": "https://www.espn.com/",
      },
    });
    if (!res.ok) throw new Error(`ESPN scoreboard error: ${res.status}`);
    return res.json() as Promise<EspnScoreboardResponse>;
  });
}

/**
 * Fetch NFL games from BallDontLie API
 */
export async function fetchBDLGames(
  season: number,
  week: number
): Promise<BdlGamesResponse> {
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  if (!apiKey) throw new Error("Missing BALLDONTLIE_API_KEY");
  
  const url = `https://api.balldontlie.io/nfl/v1/games?seasons[]=${season}&weeks[]=${week}&per_page=50`;
  
  return withHealth("balldontlie", async () => {
    const res = await fetch(url, { headers: { Authorization: apiKey } });
    if (!res.ok) throw new Error(`BDL games error: ${res.status}`);
    return res.json() as Promise<BdlGamesResponse>;
  });
}
