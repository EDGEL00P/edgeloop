/**
 * Next.js Proxy with Clerk Authentication & Rate Limiting
 * 
 * Handles authentication and rate limiting for all routes.
 * Uses the new proxy.ts convention (replaces middleware.ts in Next.js 16+).
 * 
 * Public routes: /sign-in, /sign-up (and their nested routes)
 * Protected routes: All other routes require authentication
 * 
 * @module proxy
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { checkRateLimit, RateLimitError } from "@/lib/rate-limit";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

/**
 * Extracts client IP address from request headers
 * 
 * @param request - Next.js request object
 * @returns Client IP address or "unknown" if not found
 */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

/**
 * Checks if the request path should skip rate limiting
 * 
 * @param pathname - Request pathname
 * @returns True if the path should skip rate limiting
 */
function shouldSkipRateLimit(pathname: string): boolean {
  if (pathname.startsWith("/_next")) {
    return true;
  }

  if (pathname.startsWith("/api/health")) {
    return true;
  }

  if (pathname.startsWith("/static")) {
    return true;
  }

  const staticFilePattern = /\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/;
  return staticFilePattern.test(pathname);
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const pathname = request.nextUrl.pathname;

  // Skip rate limiting for static files and Next.js internals
  if (shouldSkipRateLimit(pathname)) {
    return NextResponse.next();
  }

  // Apply rate limiting (sliding window: 100 requests per 60 seconds)
  const ip = getClientIp(request);

  try {
    await checkRateLimit(ip, 100, 60);
  } catch (error) {
    if (error instanceof RateLimitError) {
      const reset = error.reset ?? Date.now() + 60000;
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);

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
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

    // Re-throw unexpected errors
    throw error;
  }

  // Protect all routes except public authentication routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Skip Next.js internals and all static files, unless found in search params
     */
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    /*
     * Always run for API routes
     */
    "/(api|trpc)(.*)",
  ],
};
