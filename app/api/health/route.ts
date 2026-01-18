/**
 * Health Check API Route
 * 
 * Validates and returns health status with timestamp.
 * All boundary layers must use schema validation per godmode rules.
 * 
 * @module app/api/health/route
 */

import { z } from "zod";

/**
 * Health response schema
 */
const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.string().datetime(),
});

/**
 * Type-safe health response
 */
type HealthResponse = z.infer<typeof HealthResponseSchema>;

/**
 * GET handler for health check endpoint
 * 
 * @returns JSON response with health status and timestamp
 */
export async function GET(): Promise<Response> {
  const response: HealthResponse = {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
  
  // Validate response before returning (per godmode rule 5)
  const validated = HealthResponseSchema.parse(response);
  
  return Response.json(validated);
}
