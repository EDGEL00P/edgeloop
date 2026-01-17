/**
 * Analyze API Route - Production Ready
 * High-frequency NFL telemetry analysis endpoint
 * Next.js 16 App Router with async params/headers access
 */

import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { checkRateLimit, broadcastLock } from "@/lib/signals";
import { RateLimitError } from "@/lib/rate-limit";
import { triggerPhysicsSimulation } from "@/trigger/predict";
import { getRealtimeTelemetryLatest } from "@/lib/telemetry";
import { fetchMatchupAnalysis } from "@/lib/physics";

// Force dynamic rendering - this endpoint handles live telemetry data
export const dynamic = "force-dynamic";

/**
 * Analyze Request Schema
 */
const AnalyzeRequestSchema = z.object({
  gameId: z.string().min(1),
  offenseId: z.string().min(1),
  defenseId: z.string().min(1),
  playId: z.string().optional(),
  weatherConditions: z.object({
    temperature: z.number().min(-50).max(120),
    humidity: z.number().min(0).max(100),
    windSpeed: z.number().min(0).max(100),
    windDirection: z.number().min(0).max(360),
    precipitation: z.enum(["none", "light", "moderate", "heavy"]),
    visibility: z.number().min(0).max(10),
  }).optional(),
});

type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

/**
 * Analyze Response
 */
interface AnalyzeResponse {
  success: boolean;
  gameId: string;
  telemetry: {
    rows: number;
    latestTimestamp?: string;
  };
  simulationJobId?: string;
  matchupAnalysis?: {
    rowCount: number;
    columns: string[];
  };
  timestamp: string;
}

/**
 * Extract IP address from request headers
 * Handles x-forwarded-for for proxied requests
 */
async function getClientIp(request: NextRequest): Promise<string> {
  // Next.js 16: async access to headers
  const headersList = await headers();
  
  // Check x-forwarded-for header (first IP in chain for proxied requests)
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    return ips[0] || "unknown";
  }

  // Fallback to x-real-ip
  const realIp = headersList.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Last resort: return unknown if no IP found
  return "unknown";
}

/**
 * POST /api/analyze
 * Main analysis endpoint workflow:
 * 1. Verify IP (Redis rate limit)
 * 2. Dispatch Trigger.dev Job
 * 3. Fetch Telemetry (ClickHouse)
 * 4. Fetch Matchup Analysis (Rust Engine)
 * 5. Return composite JSON
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Step 1: Extract and validate IP address for rate limiting
    const clientIp = await getClientIp(request);
    
    // Step 2: Check rate limit (throws RateLimitError if exceeded)
    try {
      await checkRateLimit(clientIp, 100, 60);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          {
            success: false,
            error: "Rate limit exceeded",
            reset: error.reset,
          },
          {
            status: 429,
            headers: {
              "Retry-After": "60",
            },
          }
        );
      }
      throw error;
    }

    // Step 3: Parse and validate request body
    let body: AnalyzeRequest;
    try {
      const rawBody = await request.json();
      body = AnalyzeRequestSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request payload",
            details: error.issues,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Step 4: Broadcast lock signal for the game
    await broadcastLock(body.gameId);

    // Step 5: Fetch real-time telemetry from Redis
    let telemetryData: Array<{ timestamp: string | number | Date; [key: string]: unknown }> = [];
    try {
      const telemetry = await getRealtimeTelemetryLatest(body.gameId, 200);
      telemetryData = telemetry;
    } catch (error) {
      console.error("Failed to fetch telemetry:", error);
      // Continue even if telemetry fails - don't block the entire request
      telemetryData = [];
    }

    // Step 6: Dispatch Trigger.dev physics simulation job (if weather conditions provided)
    let simulationJobId: string | undefined;
    if (body.weatherConditions && body.playId) {
      try {
        simulationJobId = await triggerPhysicsSimulation({
          gameId: body.gameId,
          playId: body.playId,
          weatherConditions: body.weatherConditions,
        });
      } catch (error) {
        console.error("Failed to trigger physics simulation:", error);
        // Log but don't fail - simulation is async
      }
    }

    // Step 7: Fetch matchup analysis from Rust physics engine
    let matchupAnalysis;
    try {
      const arrowTable = await fetchMatchupAnalysis(body.offenseId, body.defenseId);
      
      matchupAnalysis = {
        rowCount: arrowTable.numRows,
        columns: arrowTable.schema.fields.map((field) => field.name),
      };
    } catch (error) {
      console.error("Failed to fetch matchup analysis:", error);
      // Continue even if physics engine fails
      matchupAnalysis = undefined;
    }

    // Step 8: Build composite response
    const response: AnalyzeResponse = {
      success: true,
      gameId: body.gameId,
      telemetry: {
        rows: telemetryData.length,
        latestTimestamp: telemetryData.length > 0
          ? new Date(telemetryData[0].timestamp).toISOString()
          : undefined,
      },
      simulationJobId,
      matchupAnalysis,
      timestamp: new Date().toISOString(),
    };

    const duration = Date.now() - startTime;

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "X-Response-Time-Ms": duration.toString(),
      },
    });
  } catch (error) {
    console.error("Analyze endpoint error:", error);

    // Handle known error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
