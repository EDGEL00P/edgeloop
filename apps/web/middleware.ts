/**
 * Next.js Middleware with Arcjet Protection & Clerk Authentication
 * Protects all routes with anti-bot, rate limiting, and authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { protectRoute } from "@/lib/integrations/arcjet";

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Skip protection for static files and Next.js internals
  const pathname = request.nextUrl.pathname;
  
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/static") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/)
  ) {
    return NextResponse.next();
  }

  // Protect all routes with Arcjet (bot detection & rate limiting)
  const protection = await protectRoute(request);
  
  if (!protection.allowed) {
    return NextResponse.json(
      {
        error: "Request blocked",
        reason: protection.reason,
      },
      { status: 429 }
    );
  }

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
