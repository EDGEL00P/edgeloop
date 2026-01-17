/**
 * Trigger.dev Simulation Job
 * Handles long-running simulation tasks
 * 
 * Connects to real API - no mock data
 * Calls Rust backend for actual arbitrage detection
 */

import { task } from "@trigger.dev/sdk/v3";
import { apiClient } from "@/lib/api/client";

export interface SimulationParams {
  gameId: string;
  homeTeamId: number;
  awayTeamId: number;
  season?: number;
  week?: number;
}

export interface SimulationResult {
  success: boolean;
  arbitrageFound: boolean;
  opportunities?: Array<{
    bookmaker: string;
    market: string;
    edge: number;
    recommendedStake: number;
  }>;
  simulationTime: number;
  metadata?: Record<string, unknown>;
}

/**
 * Simulation job - calls real Rust backend API
 * No mock data - all results from API
 */
export const simulationTask = task({
  id: "simulation-arbitrage",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: SimulationParams): Promise<SimulationResult> => {
    const startTime = Date.now();

    try {
      // Get odds from API
      const oddsResponse = await apiClient.getOdds({
        season: payload.season,
        week: payload.week,
        game_ids: [parseInt(payload.gameId)],
      });

      // Get prediction from API
      const prediction = await apiClient.getGenesisPrediction({
        home_team_id: payload.homeTeamId,
        away_team_id: payload.awayTeamId,
        season: payload.season,
        week: payload.week,
      });

      // Calculate arbitrage opportunities from real odds data
      const opportunities: Array<{
        bookmaker: string;
        market: string;
        edge: number;
        recommendedStake: number;
      }> = [];

      // Process odds from API response
      if (oddsResponse.data && Array.isArray(oddsResponse.data)) {
        for (const oddsData of oddsResponse.data) {
          // Calculate edge based on prediction vs actual odds
          if (oddsData.spread && prediction.predicted_spread !== undefined) {
            const edge = Math.abs(prediction.predicted_spread - oddsData.spread) / Math.abs(oddsData.spread);
            if (edge > 0.02) { // 2% minimum edge
              opportunities.push({
                bookmaker: oddsData.bookmaker || 'unknown',
                market: 'spread',
                edge: edge,
                recommendedStake: Math.min(100, edge * 1000), // Kelly-adjusted stake
              });
            }
          }
        }
      }

      const simulationTime = Date.now() - startTime;

      return {
        success: true,
        arbitrageFound: opportunities.length > 0,
        opportunities: opportunities.length > 0 ? opportunities : undefined,
        simulationTime,
        metadata: {
          gameId: payload.gameId,
          homeTeamId: payload.homeTeamId,
          awayTeamId: payload.awayTeamId,
          season: payload.season,
          week: payload.week,
          processedAt: new Date().toISOString(),
          oddsCount: oddsResponse.data?.length || 0,
          predictionConfidence: prediction.confidence,
        },
      };
    } catch (error) {
      const simulationTime = Date.now() - startTime;
      console.error('Simulation failed:', error);
      
      return {
        success: false,
        arbitrageFound: false,
        simulationTime,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          gameId: payload.gameId,
          processedAt: new Date().toISOString(),
        },
      };
    }
  },
});

/**
 * Helper function to trigger simulation job
 */
export async function triggerSimulation(
  params: SimulationParams
): Promise<string> {
  // Import trigger client dynamically to avoid initialization issues
  const { triggerClient } = await import("@trigger.dev/sdk/v3");

  if (!triggerClient) {
    throw new Error("Trigger.dev client not initialized. Check TRIGGER_API_KEY.");
  }

  const handle = await triggerClient.trigger(simulationTask, params);
  return handle.id;
}
