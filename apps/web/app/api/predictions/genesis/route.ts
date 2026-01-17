/**
 * API Route: Genesis Prediction with A/B Testing & Caching
 * Uses Statsig for algorithm A/B testing, Upstash for caching, Axiom for logging
 */

import { NextRequest, NextResponse } from "next/server";
import { getAlgorithmVariant, logPredictionEvent } from "@/lib/integrations/statsig";
import { getCachedPrediction, cachePrediction } from "@/lib/integrations/upstash";
import { logPrediction, logApiRequest } from "@/lib/integrations/axiom";
import { apiClient } from "@/lib/api/client";

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const homeTeamId = searchParams.get("home_team_id");
    const awayTeamId = searchParams.get("away_team_id");
    const season = searchParams.get("season");
    const week = searchParams.get("week");
    const userId = searchParams.get("user_id") || "anonymous";

    if (!homeTeamId || !awayTeamId) {
      return NextResponse.json(
        { error: "home_team_id and away_team_id are required" },
        { status: 400 }
      );
    }

    const gameId = `${homeTeamId}_${awayTeamId}_${season || "current"}_${week || "all"}`;

    // Check cache first
    const cached = await getCachedPrediction(gameId);
    if (cached) {
      await logApiRequest({
        method: "GET",
        path: "/api/predictions/genesis",
        statusCode: 200,
        duration: Date.now() - startTime,
        userId,
      });
      return NextResponse.json({ ...cached, cached: true });
    }

    // Get algorithm variant from Statsig A/B test
    const algorithm = await getAlgorithmVariant(userId, "prediction_algorithm");
    
    // Call Genesis prediction (currently only one algorithm, but Statsig ready)
    const prediction = await apiClient.getGenesisPrediction({
      home_team_id: parseInt(homeTeamId),
      away_team_id: parseInt(awayTeamId),
      season: season ? parseInt(season) : undefined,
      week: week ? parseInt(week) : undefined,
    });

    // Log to Statsig
    await logPredictionEvent(userId, "prediction_generated", {
      gameId,
      algorithm,
      confidence: prediction.confidence,
      predictedSpread: prediction.predicted_spread,
    });

    // Log to Axiom
    await logPrediction({
      gameId,
      homeTeamId: parseInt(homeTeamId),
      awayTeamId: parseInt(awayTeamId),
      predictedSpread: prediction.predicted_spread,
      confidence: prediction.confidence,
      algorithm,
      userId,
    });

    // Cache the result
    await cachePrediction(gameId, prediction, 1800); // 30 minutes

    await logApiRequest({
      method: "GET",
      path: "/api/predictions/genesis",
      statusCode: 200,
      duration: Date.now() - startTime,
      userId,
    });

    return NextResponse.json({
      ...prediction,
      algorithm,
      cached: false,
    });
  } catch (error) {
    await logApiRequest({
      method: "GET",
      path: "/api/predictions/genesis",
      statusCode: 500,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
