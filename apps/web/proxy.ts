/**
 * Next.js Proxy with Clerk Authentication & Rate Limiting
 * Handles authentication and rate limiting for all routes
 * Uses the new proxy.ts convention (replaces middleware.ts in Next.js 16+)
 */

import { NextRequest, NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { checkRateLimit, RateLimitError } from "@/lib/rate-limit";

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Skip processing for static files and Next.js internals
  const pathname = request.nextUrl.pathname;
  
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/static") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/)
  ) {
    return NextResponse.next();
  }

  // Apply rate limiting (sliding window, 100 req/min)
  // checkRateLimit throws RateLimitError if exceeded, so we catch it
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
             request.headers.get("x-real-ip") || 
             "unknown";
  
  try {
    await checkRateLimit(ip, 100, 60);
  } catch (error) {
    // RateLimitError thrown if limit exceeded
    if (error instanceof RateLimitError) {
      const reset = error.reset || Date.now() + 60000;
      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
          reset,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "100",
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
          },
        }
      );
    }
    // Re-throw if not a rate limit error
    throw error;
  }

  // Clerk handles authentication automatically
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Skip Next.js internals and all static files, unless found in search params
     */
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    /*
     * Always run for API routes
     */
    '/(api|trpc)(.*)',
  ],
};
