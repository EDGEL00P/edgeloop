import { withHealth } from "../health/withHealth";

const BASE = process.env.SPORTSDB_BASE_URL || "https://www.thesportsdb.com/api/v1/json";
const KEY = process.env.SPORTSDB_KEY || "123";

async function sdbFetch(path: string): Promise<any> {
  const url = `${BASE}/${KEY}${path}`;
  return withHealth("sportsdb", async () => {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`SportsDB error: ${res.status}`);
    return res.json();
  });
}

export const SportsDbService = {
  // Search by team name (e.g., "Kansas City Chiefs")
  searchTeams: (teamName: string) => sdbFetch(`/searchteams.php?t=${encodeURIComponent(teamName)}`),
  lookupTeam: (teamId: string) => sdbFetch(`/lookupteam.php?id=${encodeURIComponent(teamId)}`),
  // NFL league assets (league id may vary; this is best-effort)
  lookupLeague: (leagueId: string) => sdbFetch(`/lookupleague.php?id=${encodeURIComponent(leagueId)}`),
};
