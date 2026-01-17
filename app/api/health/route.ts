/**
 * HEALTH CHECK API
 * Comprehensive system health endpoint
 * Checks all API connections and database
 */

import { NextResponse } from 'next/server';
import { validateEnvironment, isServiceAvailable } from '@server/infrastructure/env';
import { logger } from '@server/infrastructure/logger';
import { circuitBreakerManager } from '@server/infrastructure/circuit-breaker';
import { CacheService } from '@server/infrastructure/cache';

export const dynamic = 'force-dynamic';

// Lazy import storage to prevent build-time database connection
function getStorage() {
  // Check if we're in a build context (Vercel sets NODE_ENV=production during build)
  const isBuildTime = 
    process.env.NEXT_PHASE === 'phase-production-build' || 
    process.env.NEXT_PHASE === 'phase-development-build' ||
    (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL && !process.env.VERCEL_ENV);
  
  // During build time or if DATABASE_URL is not set, don't import storage
  if (isBuildTime || !process.env.DATABASE_URL) {
    return null;
  }
  
  // Lazy import only at runtime
  try {
    return require('@server/storage').storage;
  } catch (error) {
    // If import fails during build, return null gracefully
    console.warn('Storage import failed (expected during build):', error);
    return null;
  }
}

export async function GET() {
  const startTime = Date.now();
  const health: Record<string, unknown> = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  try {
    // Environment check
    const envCheck = validateEnvironment();
    health.environment = {
      valid: envCheck.valid,
      missingRequired: envCheck.missingRequired,
      services: {
        sportradar: isServiceAvailable('sportradar'),
        rapidapi: isServiceAvailable('rapidapi'),
        odds: isServiceAvailable('odds'),
        weather: isServiceAvailable('weather'),
        openai: isServiceAvailable('openai'),
        gemini: isServiceAvailable('gemini'),
      },
    };

    // Database check (only at runtime, not during build)
    try {
      const storage = getStorage();
      if (storage && process.env.DATABASE_URL) {
        await storage.getAllNflTeams();
        health.database = { status: 'connected', latency: Date.now() - startTime };
      } else {
        health.database = { 
          status: 'not_configured', 
          message: process.env.NEXT_PHASE ? 'Build time - database not available' : 'DATABASE_URL not set' 
        };
        health.status = 'degraded';
      }
    } catch (error) {
      health.database = {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
      health.status = 'degraded';
    }

    // Circuit breakers
    health.circuitBreakers = circuitBreakerManager.getAllStats();

    // Cache stats
    health.cache = CacheService.getStats();

    // Response time
    health.responseTime = Date.now() - startTime;

    const statusCode = health.status === 'healthy' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    logger.error({
      type: 'health_check_error',
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
