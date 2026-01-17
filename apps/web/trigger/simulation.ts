/**
 * Trigger.dev Simulation Job
 * Handles long-running simulation tasks
 * 
 * This job simulates arbitrage detection and other computation-heavy tasks
 */

import { task } from "@trigger.dev/sdk/v3";

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
 * Simulation job - runs long-running computation tasks
 * For now, simulates a 30-second delay and returns mock results
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

    // Simulate processing time (30 seconds as specified)
    await new Promise((resolve) => setTimeout(resolve, 30000));

    const simulationTime = Date.now() - startTime;

    // Mock arbitrage detection result
    const mockResult: SimulationResult = {
      success: true,
      arbitrageFound: true,
      opportunities: [
        {
          bookmaker: "draftkings",
          market: "spread",
          edge: 0.045,
          recommendedStake: 100,
        },
        {
          bookmaker: "fanduel",
          market: "total",
          edge: 0.032,
          recommendedStake: 75,
        },
      ],
      simulationTime,
      metadata: {
        gameId: payload.gameId,
        homeTeamId: payload.homeTeamId,
        awayTeamId: payload.awayTeamId,
        season: payload.season,
        week: payload.week,
        processedAt: new Date().toISOString(),
      },
    };

    return mockResult;
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
