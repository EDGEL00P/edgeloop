/**
 * API Route: Odds via Tinybird SQL-to-API Pipeline
 * Uses Tinybird for high-performance odds queries (1k/day limit)
 */

import { NextRequest, NextResponse } from "next/server";
import { tinybird } from "@/lib/integrations/tinybird";
import { ajOdds } from "@/lib/integrations/arcjet";
import { getCachedGameOdds, cacheGameOdds } from "@/lib/integrations/upstash";
import { logApiRequest } from "@/lib/integrations/axiom";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Protect with Arcjet
  const protection = await ajOdds.protect(request, {});
  if (protection.isDenied()) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get("game_id");
    const book = searchParams.get("book");

    if (!gameId) {
      return NextResponse.json(
        { error: "game_id parameter is required" },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = await getCachedGameOdds(gameId);
    if (cached) {
      await logApiRequest({
        method: "GET",
        path: "/api/odds/tinybird",
        statusCode: 200,
        duration: Date.now() - startTime,
      });
      return NextResponse.json({ data: cached, cached: true });
    }

    // Query Tinybird
    const odds = await tinybird.getGameOdds(gameId, book || undefined);
    
    // Cache the result
    await cacheGameOdds(gameId, odds, 300); // 5 minutes

    await logApiRequest({
      method: "GET",
      path: "/api/odds/tinybird",
      statusCode: 200,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({ data: odds, cached: false });
  } catch (error) {
    await logApiRequest({
      method: "GET",
      path: "/api/odds/tinybird",
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
