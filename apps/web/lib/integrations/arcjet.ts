/**
 * Arcjet Integration - Anti-Scraper Shield & Rate Limiting
 * Vercel integration automatically provides ARCJET_KEY
 */

import arcjet, { detectBot, fixedWindow } from "@arcjet/next";
import { NextRequest } from "next/server";

// Initialize Arcjet with bot detection and rate limiting
export const aj = arcjet({
  key: process.env.ARCJET_KEY || "",
  characteristics: ["ip.src", "http.request.uri.path"],
  rules: [
    // Bot detection
    detectBot({
      mode: "LIVE", // Block automated requests
      block: ["AUTOMATED"],
    }),
    // Rate limiting - 10 requests per minute per IP
    fixedWindow({
      mode: "LIVE",
      window: "1m",
      max: 10,
    }),
  ],
});

/**
 * Protect API route with Arcjet
 */
export async function protectRoute(request: NextRequest) {
  const decision = await aj.protect(request);
  
  if (decision.isDenied()) {
    return {
      allowed: false,
      reason: decision.reason,
      results: decision.results,
    };
  }
  
  return {
    allowed: true,
    decision,
  };
}

/**
 * Advanced protection for odds/prediction endpoints
 */
export const ajOdds = arcjet({
  key: process.env.ARCJET_KEY || "",
  characteristics: ["ip.src", "http.request.uri.path", "http.request.headers.user-agent"],
  rules: [
    detectBot({
      mode: "LIVE",
      block: ["AUTOMATED", "LIKELY_AUTOMATED"],
    }),
    fixedWindow({
      mode: "LIVE",
      window: "1m",
      max: 30, // Higher limit for odds data
    }),
    fixedWindow({
      mode: "LIVE",
      window: "1h",
      max: 500, // Hourly limit
    }),
  ],
});
