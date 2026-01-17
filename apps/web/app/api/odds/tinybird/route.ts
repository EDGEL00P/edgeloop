/**
 * Disabled Tinybird Odds Route
 *
 * Tinybird + Arcjet are removed from this repo. This route remains only to prevent
 * legacy deployments from failing at build-time due to stale imports/types.
 *
 * Status: 410 Gone
 */

import "server-only";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      error: "gone",
      message:
        "This endpoint has been removed. Use the primary odds endpoints instead.",
    },
    { status: 410 }
  );
}

