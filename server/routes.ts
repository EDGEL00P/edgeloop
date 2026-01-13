import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDataImportSchema } from "@shared/schema";
import { registerChatRoutes } from "./replit_integrations/chat";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { OmniEngine } from "./analytics/omniEngine";
import {
  AgentSwarm,
  runAgentSwarmAnalysis,
  runMonteCarloSimulation,
  calculateKellyWithUncertainty,
  SwarmAnalysisInput,
} from "./analytics/agentSwarm";
import {
  PredictionEngine,
  getTeamAtsRecord,
  getTeamOverUnderRecord,
  getHomeFieldAdvantage,
  getWeatherImpact,
  predictSpread,
  predictTotal,
  getMatchupAnalysis
} from "./analytics/predictionEngine";
import { ExploitEngine, analyzeExploits, getExploitSummary, GameData } from "./analytics/exploitEngine";
import OpenAI from "openai";
import { getNflNews } from "./services/newsService";
import { WeatherService, getWeatherForVenue } from "./services/weatherService";
import { OddsService, getNflOdds, getOddsForGame } from "./services/oddsService";
import { EspnService, getTeamStats, getTeamInjuries, getTeamDepthChart, getMatchupData, refreshAllEspnData } from "./services/espnService";
import { GeminiService } from "./services/geminiService";
import { getGameMedia, getAllPodcasts, getAllTvNetworks, getTeamRadio } from "./services/mediaService";
import { dataRouter, getTeams as getRouterTeams, getGames as getRouterGames } from "./services/dataRouter";
import { startAutoRefresh, getRefreshStatus, getSyncTimes } from "./services/autoRefresh";
import { AutoPicksService, generateAutoPicks, getTopPicks } from "./services/autoPicksService";
import { metrics } from "./infrastructure/metrics";
import { circuitBreakerManager } from "./infrastructure/circuit-breaker";
import { rateLimiterManager } from "./infrastructure/rate-limiter";
import { CacheService } from "./infrastructure/cache";

const BALLDONTLIE_NFL_API_URL = "https://api.balldontlie.io/nfl/v1";

const CACHE_DURATION_MS = 60 * 60 * 1000;

function generateMockPlayerProps(gameId: string) {
  const players = [
    { id: 1, name: "Patrick Mahomes", team: "KC", position: "QB" },
    { id: 2, name: "Travis Kelce", team: "KC", position: "TE" },
    { id: 3, name: "Isiah Pacheco", team: "KC", position: "RB" },
    { id: 4, name: "Rashee Rice", team: "KC", position: "WR" },
    { id: 5, name: "Josh Allen", team: "BUF", position: "QB" },
    { id: 6, name: "Stefon Diggs", team: "BUF", position: "WR" },
    { id: 7, name: "James Cook", team: "BUF", position: "RB" },
    { id: 8, name: "Dalton Kincaid", team: "BUF", position: "TE" },
    { id: 9, name: "Jalen Hurts", team: "PHI", position: "QB" },
    { id: 10, name: "A.J. Brown", team: "PHI", position: "WR" },
    { id: 11, name: "Saquon Barkley", team: "PHI", position: "RB" },
    { id: 12, name: "DeVonta Smith", team: "PHI", position: "WR" },
    { id: 13, name: "Micah Parsons", team: "DAL", position: "LB" },
    { id: 14, name: "Fred Warner", team: "SF", position: "LB" },
    { id: 15, name: "T.J. Watt", team: "PIT", position: "LB" },
    { id: 16, name: "Maxx Crosby", team: "LV", position: "DE" },
  ];

  const propTypes = [
    { type: "passing_yards", category: "Passing", positions: ["QB"], lines: [225.5, 250.5, 275.5, 300.5] },
    { type: "passing_tds", category: "Passing", positions: ["QB"], lines: [1.5, 2.5] },
    { type: "completions", category: "Passing", positions: ["QB"], lines: [20.5, 22.5, 24.5] },
    { type: "interceptions", category: "Passing", positions: ["QB"], lines: [0.5, 1.5] },
    { type: "rushing_yards", category: "Rushing", positions: ["RB", "QB"], lines: [50.5, 65.5, 75.5, 85.5] },
    { type: "rushing_tds", category: "Rushing", positions: ["RB", "QB"], lines: [0.5] },
    { type: "receiving_yards", category: "Receiving", positions: ["WR", "TE", "RB"], lines: [45.5, 55.5, 65.5, 75.5] },
    { type: "receptions", category: "Receiving", positions: ["WR", "TE", "RB"], lines: [4.5, 5.5, 6.5] },
    { type: "receiving_tds", category: "Receiving", positions: ["WR", "TE"], lines: [0.5] },
    { type: "touchdowns", category: "Touchdowns", positions: ["QB", "RB", "WR", "TE"], lines: [0.5, 1.5] },
    { type: "tackles", category: "Defense", positions: ["LB", "DE", "S", "CB"], lines: [5.5, 6.5, 7.5] },
    { type: "sacks", category: "Defense", positions: ["LB", "DE"], lines: [0.5, 1.5] },
  ];

  const props: any[] = [];
  let propId = 1;

  players.forEach(player => {
    propTypes.forEach(propType => {
      if (propType.positions.includes(player.position)) {
        const line = propType.lines[Math.floor(Math.random() * propType.lines.length)];
        const baseOdds = -110;
        const variance = Math.floor(Math.random() * 30) - 15;
        props.push({
          id: `prop-${gameId}-${propId++}`,
          gameId: parseInt(gameId) || 1,
          playerId: player.id,
          playerName: player.name,
          teamAbbreviation: player.team,
          position: player.position,
          propType: propType.type,
          line: line,
          overOdds: baseOdds + variance,
          underOdds: baseOdds - variance,
          category: propType.category,
        });
      }
    });
  });

  return props;
}

function normalizeDivision(division: string): string {
  if (!division) return "";
  return division.charAt(0).toUpperCase() + division.slice(1).toLowerCase();
}

async function fetchNflFromBallDontLie(endpoint: string): Promise<any> {
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  if (!apiKey) {
    throw new Error("BALLDONTLIE_API_KEY not configured");
  }

  const url = `${BALLDONTLIE_NFL_API_URL}${endpoint}`;
  console.log(`Fetching NFL data from: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`BallDontLie API error: ${response.status} - ${errorText}`);
    throw new Error(`BallDontLie API error: ${response.status}`);
  }

  return response.json();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Setup Replit Auth (MUST be before other routes)
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/player-props/:gameId", async (req, res) => {
    try {
      const { gameId } = req.params;
      const mockProps = generateMockPlayerProps(gameId);
      res.json(mockProps);
    } catch (error) {
      console.error("Failed to fetch player props:", error);
      res.status(500).json({ 
        error: "Failed to fetch player props",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/news/nfl", async (_req, res) => {
    try {
      const news = await getNflNews();
      res.json(news);
    } catch (error) {
      console.error("Failed to fetch NFL news:", error);
      res.status(500).json({ 
        error: "Failed to fetch NFL news",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/weather/:venue", async (req, res) => {
    try {
      const { venue } = req.params;
      const decodedVenue = decodeURIComponent(venue);
      const weather = await getWeatherForVenue(decodedVenue);
      res.json(weather);
    } catch (error) {
      console.error("Failed to fetch weather:", error);
      res.status(500).json({ 
        error: "Failed to fetch weather data",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/weather/game/:gameId", async (req, res) => {
    try {
      const { gameId } = req.params;
      const game = await storage.getNflGame(Number(gameId));
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      const weather = await getWeatherForVenue(game.venue);
      res.json({ 
        ...weather, 
        venue: game.venue,
        gameId: game.id 
      });
    } catch (error) {
      console.error("Failed to fetch game weather:", error);
      res.status(500).json({ 
        error: "Failed to fetch weather data",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/odds/nfl", async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const odds = await getNflOdds(forceRefresh);
      res.json(odds);
    } catch (error) {
      console.error("Failed to fetch NFL odds:", error);
      res.status(500).json({ 
        error: "Failed to fetch odds data",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/odds/game", async (req, res) => {
    try {
      const { homeTeam, awayTeam } = req.query;
      if (!homeTeam || !awayTeam) {
        return res.status(400).json({ error: "homeTeam and awayTeam query params required" });
      }
      const odds = await getOddsForGame(String(homeTeam), String(awayTeam));
      if (!odds) {
        return res.status(404).json({ error: "No odds found for this matchup" });
      }
      res.json(odds);
    } catch (error) {
      console.error("Failed to fetch game odds:", error);
      res.status(500).json({ 
        error: "Failed to fetch odds data",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/exploits/:gameId", async (req, res) => {
    try {
      const { gameId } = req.params;
      const game = await storage.getNflGame(Number(gameId));
      
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      
      // Fetch team names from storage
      const homeTeam = await storage.getNflTeam(game.homeTeamId);
      const awayTeam = await storage.getNflTeam(game.visitorTeamId);
      const homeTeamName = homeTeam?.name || `Team ${game.homeTeamId}`;
      const awayTeamName = awayTeam?.name || `Team ${game.visitorTeamId}`;
      
      // Parse game date to determine day of week
      const gameDate = new Date(game.date);
      const dayOfWeek = gameDate.toLocaleDateString('en-US', { weekday: 'long' });
      const gameTime = game.time || undefined;
      
      // Determine if primetime based on time
      const isPrimetime = gameTime ? 
        (gameTime.includes('8:') || gameTime.includes('20:') || 
         (dayOfWeek === 'Thursday' || dayOfWeek === 'Monday')) : false;
      
      // Check if divisional game (same division)
      const isDivisional = homeTeam && awayTeam ? 
        (homeTeam.division === awayTeam.division && homeTeam.conference === awayTeam.conference) : false;
      
      const weather = await getWeatherForVenue(game.venue || null);
      const odds = await getOddsForGame(homeTeamName, awayTeamName);
      
      const gameData: GameData = {
        gameId: game.id,
        homeTeam: homeTeamName,
        awayTeam: awayTeamName,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.visitorTeamId,
        spread: odds?.consensus?.spread,
        total: odds?.consensus?.total,
        venue: game.venue || undefined,
        weather,
        week: game.week,
        isDivisional,
        isPrimetime,
        isMondayNight: dayOfWeek === "Monday",
        isThursdayNight: dayOfWeek === "Thursday",
        isSundayNight: isPrimetime && dayOfWeek === "Sunday",
        gameTime,
        gameDay: dayOfWeek,
      };
      
      const exploits = analyzeExploits(gameData);
      const summary = getExploitSummary(exploits);
      
      res.json({
        gameId: game.id,
        homeTeam: homeTeamName,
        awayTeam: awayTeamName,
        venue: game.venue,
        exploits,
        summary,
        analyzedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to analyze exploits:", error);
      res.status(500).json({
        error: "Failed to analyze exploits",
        message: (error as Error).message,
      });
    }
  });

  app.get("/api/picks/auto", async (req, res) => {
    try {
      const minGrade = req.query.minGrade as 'A+' | 'A' | 'B+' | undefined;
      const picks = minGrade ? await getTopPicks(minGrade) : await generateAutoPicks();
      
      const summary = {
        total: picks.length,
        aPlusCount: picks.filter(p => p.grade === 'A+').length,
        aCount: picks.filter(p => p.grade === 'A').length,
        bPlusCount: picks.filter(p => p.grade === 'B+').length,
        skipCount: picks.filter(p => p.grade === 'SKIP').length,
      };
      
      res.json({
        success: true,
        generated: new Date().toISOString(),
        summary,
        picks: picks.filter(p => p.grade !== 'SKIP'),
        allPicks: picks,
      });
    } catch (error) {
      console.error("Failed to generate auto picks:", error);
      res.status(500).json({ 
        error: "Failed to generate auto picks",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/espn/stats/:teamId", async (req, res) => {
    try {
      const { teamId } = req.params;
      const stats = await getTeamStats(teamId);
      if (!stats) {
        return res.status(404).json({ error: "Team stats not found" });
      }
      res.json(stats);
    } catch (error) {
      console.error("Failed to fetch ESPN team stats:", error);
      res.status(500).json({ 
        error: "Failed to fetch team stats",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/espn/injuries/:teamId", async (req, res) => {
    try {
      const { teamId } = req.params;
      const injuries = await getTeamInjuries(teamId);
      res.json(injuries);
    } catch (error) {
      console.error("Failed to fetch ESPN injuries:", error);
      res.status(500).json({ 
        error: "Failed to fetch team injuries",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/espn/depth/:teamId", async (req, res) => {
    try {
      const { teamId } = req.params;
      const depthChart = await getTeamDepthChart(teamId);
      res.json(depthChart);
    } catch (error) {
      console.error("Failed to fetch ESPN depth chart:", error);
      res.status(500).json({ 
        error: "Failed to fetch depth chart",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/espn/matchup/:gameId", async (req, res) => {
    try {
      const { gameId } = req.params;
      const matchup = await getMatchupData(gameId);
      if (!matchup) {
        return res.status(404).json({ error: "Matchup not found" });
      }
      res.json(matchup);
    } catch (error) {
      console.error("Failed to fetch ESPN matchup:", error);
      res.status(500).json({ 
        error: "Failed to fetch matchup data",
        message: (error as Error).message 
      });
    }
  });

  app.post("/api/espn/refresh", async (_req, res) => {
    try {
      const result = await refreshAllEspnData();
      res.json({ 
        success: true,
        message: "ESPN data refresh completed",
        ...result
      });
    } catch (error) {
      console.error("Failed to refresh ESPN data:", error);
      res.status(500).json({ 
        error: "Failed to refresh ESPN data",
        message: (error as Error).message 
      });
    }
  });

  // Media Service Routes
  app.get("/api/media/game/:gameId", async (req, res) => {
    try {
      const { gameId } = req.params;
      const media = await getGameMedia(Number(gameId));
      if (!media) {
        return res.status(404).json({ error: "Game not found or no media available" });
      }
      res.json(media);
    } catch (error) {
      console.error("Failed to fetch game media:", error);
      res.status(500).json({ 
        error: "Failed to fetch media links",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/media/podcasts", async (_req, res) => {
    try {
      const podcasts = getAllPodcasts();
      res.json(podcasts);
    } catch (error) {
      console.error("Failed to fetch podcasts:", error);
      res.status(500).json({ 
        error: "Failed to fetch podcasts",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/media/tv", async (_req, res) => {
    try {
      const networks = getAllTvNetworks();
      res.json(networks);
    } catch (error) {
      console.error("Failed to fetch TV networks:", error);
      res.status(500).json({ 
        error: "Failed to fetch TV networks",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/media/radio/:teamAbbr", async (req, res) => {
    try {
      const { teamAbbr } = req.params;
      const radio = getTeamRadio(teamAbbr);
      if (!radio) {
        return res.status(404).json({ error: "Team radio not found" });
      }
      res.json(radio);
    } catch (error) {
      console.error("Failed to fetch team radio:", error);
      res.status(500).json({ 
        error: "Failed to fetch team radio",
        message: (error as Error).message 
      });
    }
  });

  // Python Singularity Engine Proxy Routes
  const PYTHON_ENGINE_URL = 'http://localhost:8000';
  
  async function proxyToPython(path: string, method: 'GET' | 'POST', body?: any): Promise<any> {
    try {
      const response = await fetch(`${PYTHON_ENGINE_URL}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        throw new Error(`Python engine error: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Python engine proxy error:', error);
      throw error;
    }
  }

  app.get("/api/singularity/health", async (_req, res) => {
    try {
      const health = await proxyToPython('/health', 'GET');
      res.json(health);
    } catch (error) {
      res.status(503).json({ status: 'unavailable', engine: 'singularity' });
    }
  });

  app.post("/api/singularity/simulate", async (req, res) => {
    try {
      const result = await proxyToPython('/api/simulate', 'POST', req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Simulation failed', message: (error as Error).message });
    }
  });

  app.post("/api/singularity/predict", async (req, res) => {
    try {
      const result = await proxyToPython('/api/predict', 'POST', req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Prediction failed', message: (error as Error).message });
    }
  });

  app.post("/api/singularity/kelly", async (req, res) => {
    try {
      const result = await proxyToPython('/api/kelly', 'POST', req.body);
      res.json(result);
    } catch (error) {
      try {
        const { probability, odds, bankroll = 1000 } = req.body;
        const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
        const impliedProb = 1 / decimalOdds;
        const edge = probability - impliedProb;
        const fullKelly = edge > 0 ? (edge * decimalOdds) / (decimalOdds - 1) : 0;
        const kellyResult = {
          fullKelly: Math.max(0, Math.min(0.25, fullKelly)),
          halfKelly: Math.max(0, Math.min(0.125, fullKelly * 0.5)),
          quarterKelly: Math.max(0, Math.min(0.0625, fullKelly * 0.25)),
          recommendedStake: Math.round(bankroll * Math.max(0, Math.min(0.125, fullKelly * 0.5))),
          edge: edge,
          source: 'typescript_fallback'
        };
        res.json(kellyResult);
      } catch (fallbackError) {
        res.status(500).json({ error: 'Kelly calculation failed', message: (error as Error).message });
      }
    }
  });

  app.post("/api/singularity/correlation", async (req, res) => {
    try {
      const result = await proxyToPython('/api/correlation', 'POST', req.body);
      res.json(result);
    } catch (error) {
      try {
        const { legs } = req.body;
        if (!legs || !Array.isArray(legs)) {
          return res.status(400).json({ error: 'legs array required' });
        }
        const correlationMatrix: number[][] = [];
        const n = legs.length;
        for (let i = 0; i < n; i++) {
          correlationMatrix[i] = [];
          for (let j = 0; j < n; j++) {
            if (i === j) {
              correlationMatrix[i][j] = 1.0;
            } else {
              const leg1 = legs[i];
              const leg2 = legs[j];
              let corr = 0;
              if (leg1.team === leg2.team) {
                if (leg1.type === 'passing' && leg2.type === 'receiving') corr = 0.65;
                else if (leg1.type === leg2.type) corr = 0.3;
                else corr = 0.15;
              } else {
                corr = Math.random() * 0.2 - 0.1;
              }
              correlationMatrix[i][j] = corr;
            }
          }
        }
        const avgCorrelation = n > 1 
          ? correlationMatrix.flat().filter((_, idx) => Math.floor(idx / n) !== idx % n).reduce((a, b) => a + b, 0) / (n * n - n)
          : 0;
        res.json({
          matrix: correlationMatrix,
          legs: legs.map(l => l.player || l.type),
          averageCorrelation: avgCorrelation,
          correlationAdjustment: 1 - Math.abs(avgCorrelation) * 0.1,
          riskLevel: Math.abs(avgCorrelation) > 0.4 ? 'high' : Math.abs(avgCorrelation) > 0.2 ? 'medium' : 'low',
          source: 'typescript_fallback'
        });
      } catch (fallbackError) {
        res.status(500).json({ error: 'Correlation analysis failed', message: (error as Error).message });
      }
    }
  });

  app.post("/api/singularity/ev", async (req, res) => {
    try {
      const result = await proxyToPython('/api/ev', 'POST', req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'EV calculation failed', message: (error as Error).message });
    }
  });

  app.post("/api/singularity/poisson", async (req, res) => {
    try {
      const result = await proxyToPython('/api/poisson', 'POST', req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Poisson matrix failed', message: (error as Error).message });
    }
  });

  app.get("/api/singularity/teams", async (_req, res) => {
    try {
      const teams = await proxyToPython('/api/teams', 'GET');
      res.json(teams);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get teams', message: (error as Error).message });
    }
  });

  app.get("/api/nfl/teams", async (_req, res) => {
    try {
      let teams = await storage.getAllNflTeams();
      
      if (teams.length === 0) {
        console.log("No teams in cache, fetching from BallDontLie API...");
        const data = await fetchNflFromBallDontLie("/teams");
        for (const team of data.data || []) {
          await storage.upsertNflTeam({
            id: team.id,
            conference: team.conference || "",
            division: normalizeDivision(team.division || ""),
            location: team.location || "",
            name: team.name || "",
            fullName: team.full_name || `${team.location} ${team.name}`,
            abbreviation: team.abbreviation || "",
          });
        }
        teams = await storage.getAllNflTeams();
        console.log(`Cached ${teams.length} teams from BallDontLie API`);
      }
      
      res.json(teams);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      res.status(500).json({ 
        error: "Failed to fetch teams from BallDontLie API",
        message: (error as Error).message 
      });
    }
  });

  app.post("/api/nfl/teams/refresh", async (_req, res) => {
    try {
      console.log("Force refreshing teams from BallDontLie API...");
      const data = await fetchNflFromBallDontLie("/teams");
      const teams = [];
      for (const team of data.data || []) {
        const saved = await storage.upsertNflTeam({
          id: team.id,
          conference: team.conference || "",
          division: normalizeDivision(team.division || ""),
          location: team.location || "",
          name: team.name || "",
          fullName: team.full_name || `${team.location} ${team.name}`,
          abbreviation: team.abbreviation || "",
        });
        teams.push(saved);
      }
      console.log(`Refreshed ${teams.length} teams from BallDontLie API`);
      res.json({ success: true, count: teams.length, teams });
    } catch (error) {
      console.error("Failed to refresh teams:", error);
      res.status(500).json({ 
        error: "Failed to refresh teams from BallDontLie API",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/nfl/players", async (req, res) => {
    try {
      const { team_id, cursor, refresh } = req.query;
      
      if (team_id) {
        const teamPlayers = await storage.getPlayersByTeam(Number(team_id));
        if (teamPlayers.length > 0 && !refresh) {
          return res.json(teamPlayers);
        }
      }
      
      let players = await storage.getAllNflPlayers();
      
      if (players.length === 0 || refresh === 'true') {
        console.log("Fetching players from BallDontLie API...");
        let endpoint = "/players?per_page=100";
        if (team_id) endpoint += `&team_ids[]=${team_id}`;
        if (cursor) endpoint += `&cursor=${cursor}`;
        
        const data = await fetchNflFromBallDontLie(endpoint);
        for (const player of data.data || []) {
          await storage.upsertNflPlayer({
            id: player.id,
            firstName: player.first_name || "",
            lastName: player.last_name || "",
            position: player.position || null,
            positionAbbreviation: player.position_abbreviation || null,
            height: player.height || null,
            weight: player.weight || null,
            jerseyNumber: player.jersey_number || null,
            college: player.college || null,
            experience: player.experience || null,
            age: player.age || null,
            teamId: player.team?.id || null,
          });
        }
        
        if (team_id) {
          players = await storage.getPlayersByTeam(Number(team_id));
        } else {
          players = await storage.getAllNflPlayers();
        }
        console.log(`Cached ${players.length} players from BallDontLie API`);
        
        return res.json({
          data: players,
          meta: data.meta || { next_cursor: null }
        });
      }
      
      res.json({ data: players, meta: { next_cursor: null } });
    } catch (error) {
      console.error("Failed to fetch players:", error);
      res.status(500).json({ 
        error: "Failed to fetch players from BallDontLie API",
        message: (error as Error).message 
      });
    }
  });

  app.post("/api/nfl/players/refresh", async (req, res) => {
    try {
      console.log("Force refreshing players from BallDontLie API...");
      const { team_id } = req.query;
      let endpoint = "/players?per_page=100";
      if (team_id) endpoint += `&team_ids[]=${team_id}`;
      
      let allPlayers: any[] = [];
      let cursor: string | null = null;
      let pageCount = 0;
      const maxPages = 20;
      
      do {
        const fetchEndpoint = cursor ? `${endpoint}&cursor=${cursor}` : endpoint;
        const data = await fetchNflFromBallDontLie(fetchEndpoint);
        
        for (const player of data.data || []) {
          const saved = await storage.upsertNflPlayer({
            id: player.id,
            firstName: player.first_name || "",
            lastName: player.last_name || "",
            position: player.position || null,
            positionAbbreviation: player.position_abbreviation || null,
            height: player.height || null,
            weight: player.weight || null,
            jerseyNumber: player.jersey_number || null,
            college: player.college || null,
            experience: player.experience || null,
            age: player.age || null,
            teamId: player.team?.id || null,
          });
          allPlayers.push(saved);
        }
        
        cursor = data.meta?.next_cursor || null;
        pageCount++;
        
        if (pageCount >= maxPages) {
          console.log(`Reached max pages (${maxPages}), stopping pagination`);
          break;
        }
      } while (cursor);
      
      console.log(`Refreshed ${allPlayers.length} players from BallDontLie API`);
      res.json({ success: true, count: allPlayers.length, players: allPlayers });
    } catch (error) {
      console.error("Failed to refresh players:", error);
      res.status(500).json({ 
        error: "Failed to refresh players from BallDontLie API",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/nfl/games", async (req, res) => {
    try {
      const { season = 2025, week } = req.query;
      let games = week 
        ? await storage.getGamesByWeek(Number(season), Number(week))
        : await storage.getAllNflGames();
      
      if (games.length === 0) {
        console.log(`No games in cache for ${season}${week ? ` Week ${week}` : ''}, fetching from BallDontLie API...`);
        let endpoint = `/games?per_page=100&seasons[]=${season}`;
        if (week) endpoint += `&weeks[]=${week}`;
        
        const data = await fetchNflFromBallDontLie(endpoint);
        for (const game of data.data || []) {
          await storage.upsertNflGame({
            id: game.id,
            date: game.date || "",
            season: game.season || Number(season),
            week: game.week || Number(week || 1),
            status: game.status || null,
            homeTeamId: game.home_team?.id || 0,
            visitorTeamId: game.visitor_team?.id || 0,
            homeTeamScore: game.home_team_score || null,
            visitorTeamScore: game.visitor_team_score || null,
            venue: game.venue || null,
            time: game.time || null,
          });
        }
        games = week 
          ? await storage.getGamesByWeek(Number(season), Number(week))
          : await storage.getAllNflGames();
        console.log(`Cached ${games.length} games from BallDontLie API`);
      }
      
      res.json(games);
    } catch (error) {
      console.error("Failed to fetch games:", error);
      res.status(500).json({ 
        error: "Failed to fetch games from BallDontLie API",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/nfl/games/week/:season/:week", async (req, res) => {
    try {
      const { season, week } = req.params;
      let games = await storage.getGamesByWeek(Number(season), Number(week));
      
      if (games.length === 0) {
        console.log(`No games in cache for ${season} Week ${week}, fetching from BallDontLie API...`);
        const endpoint = `/games?seasons[]=${season}&weeks[]=${week}&per_page=50`;
        const data = await fetchNflFromBallDontLie(endpoint);
        
        for (const game of data.data || []) {
          await storage.upsertNflGame({
            id: game.id,
            date: game.date || "",
            season: game.season || Number(season),
            week: game.week || Number(week),
            status: game.status || null,
            homeTeamId: game.home_team?.id || 0,
            visitorTeamId: game.visitor_team?.id || 0,
            homeTeamScore: game.home_team_score || null,
            visitorTeamScore: game.visitor_team_score || null,
            venue: game.venue || null,
            time: game.time || null,
          });
        }
        games = await storage.getGamesByWeek(Number(season), Number(week));
        console.log(`Cached ${games.length} games for ${season} Week ${week}`);
      }
      
      res.json(games);
    } catch (error) {
      console.error("Failed to fetch week games:", error);
      res.status(500).json({ 
        error: "Failed to fetch games from BallDontLie API",
        message: (error as Error).message 
      });
    }
  });

  // Refresh games data from API (force fetch)
  app.post("/api/nfl/games/refresh/:season/:week", async (req, res) => {
    try {
      const { season, week } = req.params;
      console.log(`Refreshing games for ${season} Week ${week}...`);
      
      const endpoint = `/games?seasons[]=${season}&weeks[]=${week}&per_page=50`;
      const data = await fetchNflFromBallDontLie(endpoint);
      
      const games = [];
      for (const game of data.data || []) {
        const saved = await storage.upsertNflGame({
          id: game.id,
          date: game.date || "",
          season: game.season || Number(season),
          week: game.week || Number(week),
          status: game.status || null,
          homeTeamId: game.home_team?.id || 0,
          visitorTeamId: game.visitor_team?.id || 0,
          homeTeamScore: game.home_team_score || null,
          visitorTeamScore: game.visitor_team_score || null,
          venue: game.venue || null,
          time: game.time || null,
        });
        games.push(saved);
      }
      
      console.log(`Refreshed ${games.length} games from BallDontLie API`);
      res.json({ success: true, count: games.length, games });
    } catch (error) {
      console.error("Failed to refresh games:", error);
      res.status(500).json({ error: "Failed to refresh games from API", message: (error as Error).message });
    }
  });

  app.get("/api/metrics/:season/:week", async (req, res) => {
    try {
      const { season, week } = req.params;
      const metrics = await storage.getWeeklyMetrics(Number(season), Number(week));
      res.json(metrics);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
      res.status(500).json({ 
        error: "Failed to fetch metrics",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/exploits/:season/:week", async (req, res) => {
    try {
      const { season, week } = req.params;
      const signals = await storage.getExploitSignals(Number(season), Number(week));
      res.json(signals);
    } catch (error) {
      console.error("Failed to fetch exploit signals:", error);
      res.status(500).json({ 
        error: "Failed to fetch exploit signals",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/data-imports", async (_req, res) => {
    try {
      const imports = await storage.getAllDataImports();
      res.json(imports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data imports" });
    }
  });

  app.post("/api/data-imports", async (req, res) => {
    try {
      const validatedData = insertDataImportSchema.parse(req.body);
      const dataImport = await storage.createDataImport(validatedData);
      res.status(201).json(dataImport);
    } catch (error) {
      res.status(400).json({ error: "Invalid data import" });
    }
  });

  app.delete("/api/data-imports/:id", async (req, res) => {
    try {
      const success = await storage.deleteDataImport(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Data import not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete data import" });
    }
  });

  // Register AI chat routes
  registerChatRoutes(app);

  // Omni Analytics Engine Routes
  app.post("/api/analytics/poisson", async (req, res) => {
    try {
      const { homeExpected, awayExpected, spread = 0, total = 0 } = req.body;
      const matrix = OmniEngine.generateScoreMatrix(homeExpected, awayExpected, 50);
      const outcomes = OmniEngine.calculateOutcomeProbabilities(matrix, spread);
      
      // Calculate most likely score
      let maxProb = 0;
      let likelyScore = { home: 0, away: 0 };
      for (let h = 0; h <= 50; h++) {
        for (let a = 0; a <= 50; a++) {
          if (matrix[h][a] > maxProb) {
            maxProb = matrix[h][a];
            likelyScore = { home: h, away: a };
          }
        }
      }

      // Calculate over/under probability
      let overProb = 0;
      for (let h = 0; h <= 50; h++) {
        for (let a = 0; a <= 50; a++) {
          if (h + a > total) overProb += matrix[h][a];
        }
      }

      res.json({
        outcomes,
        likelyScore,
        overProbability: overProb,
        underProbability: 1 - overProb,
        spreadCoverProbability: outcomes.homeWin,
      });
    } catch (error) {
      res.status(500).json({ error: "Poisson calculation failed" });
    }
  });

  app.post("/api/analytics/ev", async (req, res) => {
    try {
      const { odds, trueProbability, stake = 100 } = req.body;
      const result = OmniEngine.calculateEV(odds, trueProbability, stake);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "EV calculation failed" });
    }
  });

  app.post("/api/analytics/kelly", async (req, res) => {
    try {
      const { edge, bankroll, odds } = req.body;
      const result = OmniEngine.kellyBetSize(edge, bankroll, odds);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Kelly calculation failed" });
    }
  });

  app.post("/api/analytics/line-check", async (req, res) => {
    try {
      const { openingLine, currentLine, publicBetPercent } = req.body;
      const result = OmniEngine.detectLineAnomalies(openingLine, currentLine, publicBetPercent);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Line analysis failed" });
    }
  });

  app.post("/api/analytics/weather", async (req, res) => {
    try {
      const { windSpeed, temperature, precipitation } = req.body;
      const result = OmniEngine.calculateWeatherImpact(windSpeed, temperature, precipitation);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Weather analysis failed" });
    }
  });

  app.post("/api/analytics/injury-cascade", async (req, res) => {
    try {
      const { injuries } = req.body;
      const result = OmniEngine.calculateInjuryCascade(injuries);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Injury cascade analysis failed" });
    }
  });

  app.post("/api/analytics/ai-analysis", async (req, res) => {
    try {
      const { homeTeam, awayTeam, homeMetrics, awayMetrics, spread, total } = req.body;
      const analysis = await OmniEngine.analyzeGameWithAI(
        homeTeam,
        awayTeam,
        homeMetrics,
        awayMetrics,
        spread,
        total
      );
      res.json({ analysis });
    } catch (error) {
      res.status(500).json({ error: "AI analysis failed" });
    }
  });

  // AI Prediction Engine Routes
  app.get("/api/predictions/team/:team/ats", async (req, res) => {
    try {
      const { team } = req.params;
      const seasons = req.query.seasons ? Number(req.query.seasons) : undefined;
      const record = await getTeamAtsRecord(team, seasons);
      res.json(record);
    } catch (error) {
      console.error("Failed to get ATS record:", error);
      res.status(500).json({ error: "Failed to get team ATS record" });
    }
  });

  app.get("/api/predictions/team/:team/totals", async (req, res) => {
    try {
      const { team } = req.params;
      const record = await getTeamOverUnderRecord(team);
      res.json(record);
    } catch (error) {
      console.error("Failed to get O/U record:", error);
      res.status(500).json({ error: "Failed to get team over/under record" });
    }
  });

  app.post("/api/predictions/spread", async (req, res) => {
    try {
      const { homeTeam, awayTeam, spread } = req.body;
      if (!homeTeam || !awayTeam || spread === undefined) {
        return res.status(400).json({ error: "homeTeam, awayTeam, and spread are required" });
      }
      const prediction = await predictSpread(homeTeam, awayTeam, spread);
      res.json(prediction);
    } catch (error) {
      console.error("Failed to predict spread:", error);
      res.status(500).json({ error: "Failed to predict spread outcome" });
    }
  });

  app.post("/api/predictions/total", async (req, res) => {
    try {
      const { homeTeam, awayTeam, total } = req.body;
      if (!homeTeam || !awayTeam || total === undefined) {
        return res.status(400).json({ error: "homeTeam, awayTeam, and total are required" });
      }
      const prediction = await predictTotal(homeTeam, awayTeam, total);
      res.json(prediction);
    } catch (error) {
      console.error("Failed to predict total:", error);
      res.status(500).json({ error: "Failed to predict over/under outcome" });
    }
  });

  app.post("/api/predictions/matchup", async (req, res) => {
    try {
      const { homeTeam, awayTeam, spread, total } = req.body;
      if (!homeTeam || !awayTeam) {
        return res.status(400).json({ error: "homeTeam and awayTeam are required" });
      }
      
      const [matchupAnalysis, spreadPrediction, totalPrediction] = await Promise.all([
        getMatchupAnalysis(homeTeam, awayTeam),
        spread !== undefined ? predictSpread(homeTeam, awayTeam, spread) : null,
        total !== undefined ? predictTotal(homeTeam, awayTeam, total) : null
      ]);
      
      res.json({
        matchup: matchupAnalysis,
        spreadPrediction,
        totalPrediction
      });
    } catch (error) {
      console.error("Failed to analyze matchup:", error);
      res.status(500).json({ error: "Failed to analyze matchup" });
    }
  });

  app.get("/api/predictions/trends", async (req, res) => {
    try {
      const temp = req.query.temp ? Number(req.query.temp) : 60;
      const wind = req.query.wind ? Number(req.query.wind) : 5;
      
      const [homeFieldAdvantage, weatherImpact] = await Promise.all([
        getHomeFieldAdvantage(),
        getWeatherImpact(temp, wind)
      ]);
      
      res.json({
        homeFieldAdvantage,
        weatherImpact,
        generalTrends: {
          homeTeamWinRateATS: homeFieldAdvantage.homeCoverRate,
          homeFavoriteCoversRate: homeFieldAdvantage.homeCoversAsFavorite,
          homeUnderdogCoversRate: homeFieldAdvantage.homeCoversAsUnderdog,
          weatherRecommendation: weatherImpact.recommendation
        }
      });
    } catch (error) {
      console.error("Failed to get betting trends:", error);
      res.status(500).json({ error: "Failed to get betting trends" });
    }
  });

  app.post("/api/predictions/ai-analysis", async (req, res) => {
    try {
      const { homeTeam, awayTeam, spread, total, context } = req.body;
      if (!homeTeam || !awayTeam) {
        return res.status(400).json({ error: "homeTeam and awayTeam are required" });
      }

      const [matchupAnalysis, homeAts, awayAts, homeOU, awayOU, homeField] = await Promise.all([
        getMatchupAnalysis(homeTeam, awayTeam),
        getTeamAtsRecord(homeTeam, 3),
        getTeamAtsRecord(awayTeam, 3),
        getTeamOverUnderRecord(homeTeam),
        getTeamOverUnderRecord(awayTeam),
        getHomeFieldAdvantage()
      ]);

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const historicalDataSummary = `
Historical Data Summary for ${homeTeam} vs ${awayTeam}:

HEAD-TO-HEAD:
- ${homeTeam} wins: ${matchupAnalysis.headToHead.homeWins}, ${awayTeam} wins: ${matchupAnalysis.headToHead.awayWins}
- ${homeTeam} covers: ${matchupAnalysis.headToHead.homeCovers}, ${awayTeam} covers: ${matchupAnalysis.headToHead.awayCovers}
- Overs: ${matchupAnalysis.headToHead.overs}, Unders: ${matchupAnalysis.headToHead.unders}
- Average total points: ${matchupAnalysis.averageTotalPoints.toFixed(1)}
- Sample size: ${matchupAnalysis.headToHead.sampleSize} games

${homeTeam} ATS (Last 3 Seasons):
- Record: ${homeAts.wins}-${homeAts.losses}-${homeAts.pushes} (${homeAts.winPercentage.toFixed(1)}%)
- Sample size: ${homeAts.sampleSize} games

${awayTeam} ATS (Last 3 Seasons):
- Record: ${awayAts.wins}-${awayAts.losses}-${awayAts.pushes} (${awayAts.winPercentage.toFixed(1)}%)
- Sample size: ${awayAts.sampleSize} games

${homeTeam} Over/Under:
- Overs: ${homeOU.overs}, Unders: ${homeOU.unders}, Pushes: ${homeOU.pushes}
- Over percentage: ${homeOU.overPercentage.toFixed(1)}%

${awayTeam} Over/Under:
- Overs: ${awayOU.overs}, Unders: ${awayOU.unders}, Pushes: ${awayOU.pushes}
- Over percentage: ${awayOU.overPercentage.toFixed(1)}%

HOME FIELD ADVANTAGE (League-wide):
- Home teams cover rate: ${homeField.homeCoverRate.toFixed(1)}%
- Home favorites cover: ${homeField.homeCoversAsFavorite.toFixed(1)}%
- Home underdogs cover: ${homeField.homeCoversAsUnderdog.toFixed(1)}%

${spread !== undefined ? `CURRENT SPREAD: ${spread > 0 ? '+' : ''}${spread}` : ''}
${total !== undefined ? `CURRENT TOTAL: ${total}` : ''}
${context ? `ADDITIONAL CONTEXT: ${context}` : ''}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are an expert NFL sports betting analyst with deep knowledge of statistical trends, team dynamics, and betting markets. Provide detailed, actionable betting analysis based on historical data. Be specific with your recommendations and confidence levels. Consider:
- ATS (Against the Spread) trends
- Over/Under tendencies
- Head-to-head matchup history
- Home field advantage
- Key numbers in NFL betting (3, 7, etc.)
- Sample size reliability

Format your response with clear sections: SPREAD ANALYSIS, TOTAL ANALYSIS, KEY FACTORS, and FINAL RECOMMENDATIONS.`
          },
          {
            role: "user",
            content: `Analyze this NFL matchup and provide betting recommendations:\n\n${historicalDataSummary}`
          }
        ],
        max_completion_tokens: 1500
      });

      const analysis = response.choices[0]?.message?.content || "Unable to generate analysis";

      res.json({
        analysis,
        historicalData: {
          matchup: matchupAnalysis,
          homeTeamAts: homeAts,
          awayTeamAts: awayAts,
          homeTeamOU: homeOU,
          awayTeamOU: awayOU,
          homeFieldAdvantage: homeField
        }
      });
    } catch (error) {
      console.error("Failed to generate AI analysis:", error);
      res.status(500).json({ error: "Failed to generate AI betting analysis" });
    }
  });

  // AI Service Routes (Gemini-powered contextual analysis)
  const { AIService } = await import("./services/aiService");

  app.post("/api/ai/quick-analysis", async (req, res) => {
    try {
      const { homeTeam, awayTeam, homeWinProb, awayWinProb, spread, total } = req.body;
      if (!homeTeam || !awayTeam) {
        return res.status(400).json({ error: "homeTeam and awayTeam are required" });
      }
      const analysis = await AIService.getQuickGameAnalysis({
        homeTeam,
        awayTeam,
        homeWinProb,
        awayWinProb,
        spread,
        total,
      });
      res.json({ analysis });
    } catch (error) {
      console.error("Quick analysis error:", error);
      res.status(500).json({ error: "Failed to generate quick analysis" });
    }
  });

  app.post("/api/ai/team-analysis", async (req, res) => {
    try {
      const { teamName, conference, division, wins, losses, pointsFor, pointsAgainst, streak, playoffStatus } = req.body;
      if (!teamName) {
        return res.status(400).json({ error: "teamName is required" });
      }
      const analysis = await AIService.getTeamAnalysis({
        teamName,
        conference: conference || "",
        division: division || "",
        wins,
        losses,
        pointsFor,
        pointsAgainst,
        streak,
        playoffStatus,
      });
      res.json({ analysis });
    } catch (error) {
      console.error("Team analysis error:", error);
      res.status(500).json({ error: "Failed to generate team analysis" });
    }
  });

  app.post("/api/ai/matchup", async (req, res) => {
    try {
      const { homeTeam, awayTeam, homeRecord, awayRecord, spread, total, venue } = req.body;
      if (!homeTeam || !awayTeam) {
        return res.status(400).json({ error: "homeTeam and awayTeam are required" });
      }
      const analysis = await AIService.getMatchupAnalysis({
        homeTeam,
        awayTeam,
        homeRecord,
        awayRecord,
        spread,
        total,
        venue,
      });
      res.json({ analysis });
    } catch (error) {
      console.error("Matchup analysis error:", error);
      res.status(500).json({ error: "Failed to generate matchup analysis" });
    }
  });

  app.post("/api/ai/exploit-analysis", async (req, res) => {
    try {
      const { homeTeam, awayTeam, spread, total, publicBetPercent, lineMovement, weather } = req.body;
      if (!homeTeam || !awayTeam) {
        return res.status(400).json({ error: "homeTeam and awayTeam are required" });
      }
      const analysis = await AIService.getExploitAnalysis({
        homeTeam,
        awayTeam,
        spread: spread || 0,
        total: total || 45,
        publicBetPercent,
        lineMovement,
        weather,
      });
      res.json({ analysis });
    } catch (error) {
      console.error("Exploit analysis error:", error);
      res.status(500).json({ error: "Failed to generate exploit analysis" });
    }
  });

  app.post("/api/singularity/analyze", async (req, res) => {
    try {
      const input: SwarmAnalysisInput = {
        homeTeamName: req.body.homeTeam,
        awayTeamName: req.body.awayTeam,
        currentSpread: req.body.spread ?? 0,
        currentTotal: req.body.total ?? 45,
        stats: req.body.stats,
        market: req.body.market,
        weather: req.body.weather,
        injuries: req.body.injuries,
        trends: req.body.trends,
      };

      if (!input.homeTeamName || !input.awayTeamName) {
        return res.status(400).json({ error: "homeTeam and awayTeam are required" });
      }

      const result = await runAgentSwarmAnalysis(input);
      res.json(result);
    } catch (error) {
      console.error("Agent swarm analysis error:", error);
      res.status(500).json({ error: "Failed to run agent swarm analysis" });
    }
  });

  app.post("/api/singularity/monte-carlo", async (req, res) => {
    try {
      const {
        homeExpectedPoints,
        awayExpectedPoints,
        spread = 0,
        total = 45,
        simulations = 10000,
        variance = 10,
      } = req.body;

      if (homeExpectedPoints === undefined || awayExpectedPoints === undefined) {
        return res.status(400).json({ error: "homeExpectedPoints and awayExpectedPoints are required" });
      }

      const result = runMonteCarloSimulation(
        homeExpectedPoints,
        awayExpectedPoints,
        spread,
        total,
        Math.min(simulations, 50000),
        variance
      );
      res.json(result);
    } catch (error) {
      console.error("Monte Carlo simulation error:", error);
      res.status(500).json({ error: "Failed to run Monte Carlo simulation" });
    }
  });

  app.post("/api/singularity/kelly", async (req, res) => {
    try {
      const {
        trueProbability,
        odds,
        uncertainty = 0.1,
        bankroll = 1000,
        uncertaintyThreshold = 0.03,
        betType = "spread",
        side = "home",
      } = req.body;

      if (trueProbability === undefined || odds === undefined) {
        return res.status(400).json({ error: "trueProbability and odds are required" });
      }

      const result = calculateKellyWithUncertainty(
        trueProbability,
        odds,
        uncertainty,
        bankroll,
        uncertaintyThreshold
      );

      result.betType = betType;
      result.side = side;

      res.json(result);
    } catch (error) {
      console.error("Kelly criterion calculation error:", error);
      res.status(500).json({ error: "Failed to calculate Kelly criterion" });
    }
  });

  app.post("/api/ai/analyze-value", async (req, res) => {
    try {
      const { game, historicalStats } = req.body;
      if (!game || !game.homeTeam || !game.awayTeam) {
        return res.status(400).json({ 
          error: "game object with homeTeam and awayTeam is required" 
        });
      }
      const result = await GeminiService.analyzeBettingValue(game, historicalStats || {});
      res.json(result);
    } catch (error) {
      console.error("Betting value analysis error:", error);
      res.status(500).json({ 
        error: "Failed to analyze betting value",
        message: (error as Error).message 
      });
    }
  });

  app.post("/api/ai/predict", async (req, res) => {
    try {
      const { homeTeam, awayTeam, stats } = req.body;
      if (!homeTeam || !awayTeam) {
        return res.status(400).json({ 
          error: "homeTeam and awayTeam are required" 
        });
      }
      const result = await GeminiService.predictGameOutcome(homeTeam, awayTeam, stats || {});
      res.json(result);
    } catch (error) {
      console.error("Game prediction error:", error);
      res.status(500).json({ 
        error: "Failed to predict game outcome",
        message: (error as Error).message 
      });
    }
  });

  app.post("/api/ai/injury-impact", async (req, res) => {
    try {
      const { injuries } = req.body;
      if (!injuries || !Array.isArray(injuries)) {
        return res.status(400).json({ 
          error: "injuries array is required" 
        });
      }
      const result = await GeminiService.analyzeInjuryImpact(injuries);
      res.json(result);
    } catch (error) {
      console.error("Injury impact analysis error:", error);
      res.status(500).json({ 
        error: "Failed to analyze injury impact",
        message: (error as Error).message 
      });
    }
  });

  app.post("/api/ai/narrative", async (req, res) => {
    try {
      const { picks } = req.body;
      if (!picks || !Array.isArray(picks)) {
        return res.status(400).json({ 
          error: "picks array is required" 
        });
      }
      const result = await GeminiService.generatePicksNarrative(picks);
      res.json(result);
    } catch (error) {
      console.error("Picks narrative generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate picks narrative",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/ai/health", async (_req, res) => {
    try {
      const health = GeminiService.getServiceHealth();
      res.json({ status: "healthy", ...health });
    } catch (error) {
      res.status(500).json({ 
        status: "unhealthy",
        error: (error as Error).message 
      });
    }
  });

  app.get("/api/system/status", async (_req, res) => {
    try {
      const refreshStatus = getRefreshStatus();
      const syncTimes = getSyncTimes();
      
      const now = new Date();
      const hasRecentData = Object.values(syncTimes).some(time => {
        if (!time) return false;
        const diff = now.getTime() - new Date(time).getTime();
        return diff < 5 * 60 * 1000;
      });
      const hasStaleData = Object.values(syncTimes).some(time => {
        if (!time) return false;
        const diff = now.getTime() - new Date(time).getTime();
        return diff > 15 * 60 * 1000;
      });
      
      let systemStatus: 'healthy' | 'degraded' | 'offline' = 'healthy';
      if (hasStaleData) systemStatus = 'degraded';
      if (!refreshStatus.isRunning) systemStatus = 'offline';
      
      const oddsJob = refreshStatus.jobs?.odds;
      const nextRefresh = oddsJob?.nextRun || new Date(Date.now() + 60000).toISOString();
      
      const status = {
        status: systemStatus,
        lastSync: syncTimes,
        nextRefresh,
        apiQuotaRemaining: 1000,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        autoRefresh: refreshStatus,
        circuitBreakers: circuitBreakerManager.getAllStats(),
        rateLimiters: rateLimiterManager.getStats(),
        cache: CacheService.getStats(),
        metrics: metrics.getStats(),
      };
      res.json(status);
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to get system status",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/system/metrics", async (_req, res) => {
    res.json(metrics.getStats());
  });

  app.post("/api/system/refresh/start", async (_req, res) => {
    try {
      startAutoRefresh();
      res.json({ success: true, message: "Auto-refresh started" });
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to start auto-refresh",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/router/teams", async (_req, res) => {
    try {
      const teams = await getRouterTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to fetch teams via data router",
        message: (error as Error).message 
      });
    }
  });

  app.get("/api/router/games/:season/:week", async (req, res) => {
    try {
      const { season, week } = req.params;
      const games = await getRouterGames(Number(season), Number(week));
      res.json(games);
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to fetch games via data router",
        message: (error as Error).message 
      });
    }
  });

  startAutoRefresh();
  console.log("Auto-refresh system started");

  return httpServer;
}
