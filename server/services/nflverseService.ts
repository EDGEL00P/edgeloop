/**
 * NFLverse Service
 * 
 * Integrates nflverse Python package for comprehensive NFL data
 * Provides live game data, player stats, team information, and more
 */

import { logger } from "../infrastructure/logger";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface NflverseGame {
  game_id: string;
  season: number;
  week: number;
  game_type: string;
  gameday: string;
  weekday: string;
  gametime: string;
  away_team: string;
  home_team: string;
  away_score?: number;
  home_score?: number;
  result?: number;
  total?: number;
  spread_line?: number;
  total_line?: number;
  div_game?: boolean;
  roof?: string;
  surface?: string;
  temp?: number;
  wind?: number;
  away_coach?: string;
  home_coach?: string;
  stadium?: string;
  stadium_id?: string;
  away_rest?: number;
  home_rest?: number;
  away_moneyline?: number;
  home_moneyline?: number;
}

interface NflversePlayer {
  player_id: string;
  player_name: string;
  position: string;
  team: string;
  season: number;
  week?: number;
  games?: number;
  passing_yards?: number;
  rushing_yards?: number;
  receiving_yards?: number;
  touchdowns?: number;
}

interface NflverseTeam {
  team_abbr: string;
  team_name: string;
  team_nick: string;
  team_color?: string;
  team_color2?: string;
  team_color3?: string;
  team_color4?: string;
  team_logo_wikipedia?: string;
  team_logo_espn?: string;
}

/**
 * Execute Python script to fetch nflverse data
 */
async function runNflverseScript(script: string): Promise<unknown> {
  try {
    const pythonScript = `
import json
import sys
try:
    ${script}
except Exception as e:
    print(json.dumps({"error": str(e)}), file=sys.stderr)
    sys.exit(1)
`;
    
    const { stdout, stderr } = await execAsync(
      `python3 -c ${JSON.stringify(pythonScript)}`,
      { maxBuffer: 10 * 1024 * 1024 }
    );
    
    if (stderr && !stdout) {
      throw new Error(stderr);
    }
    
    return JSON.parse(stdout);
  } catch (error) {
    logger.error({ type: "nflverse_error", error: String(error) });
    throw error;
  }
}

/**
 * Get games for a specific season and week
 */
export async function getNflverseGames(
  season: number,
  week?: number
): Promise<NflverseGame[]> {
  const weekFilter = week ? `df = df[df['week'] == ${week}]` : "";
  
  const script = `
from nflverse import nflfastR
import json
import pandas as pd

df = nflfastR.load_pbp_data([${season}])
${weekFilter}
games = df[['game_id', 'season', 'week', 'game_type', 'gameday', 'weekday', 'gametime', 
            'away_team', 'home_team', 'away_score', 'home_score', 'result', 'total',
            'spread_line', 'total_line', 'div_game', 'roof', 'surface', 'temp', 'wind',
            'away_coach', 'home_coach', 'stadium', 'stadium_id', 'away_rest', 'home_rest',
            'away_moneyline', 'home_moneyline']].drop_duplicates(subset=['game_id']).to_dict('records')
print(json.dumps(games))
`;
  
  try {
    const result = await runNflverseScript(script);
    return Array.isArray(result) ? (result as NflverseGame[]) : [];
  } catch (error) {
    logger.error({ type: "nflverse_games_error", season, week, error: String(error) });
    return [];
  }
}

/**
 * Get player stats
 */
export async function getNflversePlayerStats(
  season: number,
  playerId?: string
): Promise<NflversePlayer[]> {
  const playerFilter = playerId ? `df = df[df['player_id'] == '${playerId}']` : "";
  
  const script = `
from nflverse import nflfastR
import json
import pandas as pd

df = nflfastR.load_player_stats([${season}])
${playerFilter}
stats = df[['player_id', 'player_name', 'position', 'team', 'season', 'week', 'games',
            'passing_yards', 'rushing_yards', 'receiving_yards', 'touchdowns']].to_dict('records')
print(json.dumps(stats))
`;
  
  try {
    const result = await runNflverseScript(script);
    return Array.isArray(result) ? (result as NflversePlayer[]) : [];
  } catch (error) {
    logger.error({ type: "nflverse_player_stats_error", season, playerId, error: String(error) });
    return [];
  }
}

/**
 * Get team information
 */
export async function getNflverseTeams(): Promise<NflverseTeam[]> {
  const script = `
from nflverse import nflfastR
import json
import pandas as pd

df = nflfastR.load_teams()
teams = df.to_dict('records')
print(json.dumps(teams))
`;
  
  try {
    const result = await runNflverseScript(script);
    return Array.isArray(result) ? (result as NflverseTeam[]) : [];
  } catch (error) {
    logger.error({ type: "nflverse_teams_error", error: String(error) });
    return [];
  }
}

/**
 * Get current season schedule
 */
export async function getNflverseSchedule(season: number): Promise<NflverseGame[]> {
  const script = `
from nflverse import nflfastR
import json
import pandas as pd

df = nflfastR.load_schedules([${season}])
games = df.to_dict('records')
print(json.dumps(games))
`;
  
  try {
    const result = await runNflverseScript(script);
    return Array.isArray(result) ? (result as NflverseGame[]) : [];
  } catch (error) {
    logger.error({ type: "nflverse_schedule_error", season, error: String(error) });
    return [];
  }
}
