/**
 * Trigger.dev Physics Simulation Job - Production Ready
 * Real HTTP request to Rust Engine /simulate endpoint
 * No mocks - calls actual Rust backend
 */

import "server-only";
import { task } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { env } from "@/lib/env";

/**
 * Weather Conditions Schema
 * Strictly typed validation for weather data
 */
export const WeatherSchema = z.object({
  temperature: z.number().min(-50).max(120),
  humidity: z.number().min(0).max(100),
  windSpeed: z.number().min(0).max(100),
  windDirection: z.number().min(0).max(360),
  precipitation: z.enum(["none", "light", "moderate", "heavy"]),
  visibility: z.number().min(0).max(10),
});

export type WeatherConditions = z.infer<typeof WeatherSchema>;

/**
 * Physics Simulation Job Payload Schema
 */
const PhysicsSimulationPayloadSchema = z.object({
  gameId: z.string().min(1),
  playId: z.string().min(1),
  weatherConditions: WeatherSchema,
});

type PhysicsSimulationPayload = z.infer<typeof PhysicsSimulationPayloadSchema>;

/**
 * Rust Engine Simulation Response
 */
interface RustSimulationResponse {
  success: boolean;
  simulation_id: string;
  predictions: {
    outcome: string;
    probability: number;
    confidence: number;
  }[];
  physics_metrics: {
    ball_speed: number;
    trajectory_angle: number;
    expected_yardage: number;
  };
  metadata: Record<string, unknown>;
}

/**
 * Physics Simulation Job
 * Makes real HTTP request to Rust Engine /simulate endpoint
 * NO MOCK DATA - real backend integration
 */
export const physicsSimulationJob = task({
  id: "physics-simulation",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: PhysicsSimulationPayload): Promise<RustSimulationResponse> => {
    // Validate payload with Zod
    const validatedPayload = PhysicsSimulationPayloadSchema.parse(payload);

    const startTime = Date.now();

    try {
      // Make REAL HTTP request to Rust Engine /simulate endpoint
      const url = new URL("/simulate", env.RUST_ENGINE_URL);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          game_id: validatedPayload.gameId,
          play_id: validatedPayload.playId,
          weather_conditions: validatedPayload.weatherConditions,
        }),
        signal: AbortSignal.timeout(60_000), // 60 second timeout for simulation
      });

      if (!response.ok) {
        const statusCode = response.status;
        let errorMessage = `Rust engine simulation failed with status ${statusCode}`;

        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch {
          // Ignore parsing errors
        }

        throw new Error(
          `Physics simulation failed: ${errorMessage} (status: ${statusCode})`
        );
      }

      // Parse JSON response from Rust engine
      const result = await response.json<RustSimulationResponse>();

      // Validate response structure
      if (!result.success) {
        throw new Error("Rust engine returned unsuccessful simulation result");
      }

      const simulationTime = Date.now() - startTime;

      // Return the actual result from Rust engine
      return {
        ...result,
        metadata: {
          ...result.metadata,
          simulation_time_ms: simulationTime,
          processed_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      // Handle timeout errors
      if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
        throw new Error(
          `Physics simulation timeout after 60s for game ${validatedPayload.gameId}`
        );
      }

      // Re-throw with context
      throw new Error(
        `Physics simulation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

/**
 * Trigger physics simulation job
 * Helper function to dispatch the job
 */
export async function triggerPhysicsSimulation(
  payload: PhysicsSimulationPayload
): Promise<string> {
  const { triggerClient } = await import("@trigger.dev/sdk/v3");

  if (!triggerClient) {
    throw new Error("Trigger.dev client not initialized. Check TRIGGER_API_KEY.");
  }

  // Validate payload before dispatching
  const validatedPayload = PhysicsSimulationPayloadSchema.parse(payload);

  const handle = await triggerClient.trigger(physicsSimulationJob, validatedPayload);
  return handle.id;
}
