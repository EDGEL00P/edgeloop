/**
 * API Route: Send Prediction Alerts via Resend
 * High-priority email alerts when edges are detected
 */

import { NextRequest, NextResponse } from "next/server";
import { sendPredictionAlert } from "@/lib/integrations/resend";
import { logApiRequest, logError } from "@/lib/integrations/axiom";
import { protectRoute } from "@/lib/integrations/arcjet";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Protect with Arcjet
  const protection = await protectRoute(request);
  if (!protection.allowed) {
    return NextResponse.json(
      { error: "Request blocked" },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { email, gameInfo } = body;

    if (!email || !gameInfo) {
      return NextResponse.json(
        { error: "email and gameInfo are required" },
        { status: 400 }
      );
    }

    const { homeTeam, awayTeam, prediction, confidence, edge } = gameInfo;

    if (!homeTeam || !awayTeam || !prediction || confidence === undefined || edge === undefined) {
      return NextResponse.json(
        { error: "Invalid gameInfo format" },
        { status: 400 }
      );
    }

    // Only send alerts for high-confidence predictions with positive edge
    if (confidence < 0.7 || edge <= 0) {
      return NextResponse.json(
        { error: "Alert not sent: insufficient confidence or edge" },
        { status: 400 }
      );
    }

    // Send alert via Resend
    const result = await sendPredictionAlert(email, {
      homeTeam,
      awayTeam,
      prediction,
      confidence,
      edge,
    });

    await logApiRequest({
      method: "POST",
      path: "/api/alerts",
      statusCode: 200,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      messageId: result.data?.id,
    });
  } catch (error) {
    await logError({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      context: { endpoint: "/api/alerts" },
    });

    await logApiRequest({
      method: "POST",
      path: "/api/alerts",
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
