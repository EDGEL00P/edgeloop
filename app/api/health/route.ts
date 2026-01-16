/**
 * HEALTH CHECK API
 * Comprehensive system health endpoint
 * Checks all API connections and database
 */

import { NextResponse } from 'next/server';
import { validateEnvironment, isServiceAvailable } from '@server/infrastructure/env';
import { storage } from '@server/storage';
import { logger } from '@server/infrastructure/logger';
import { circuitBreakerManager } from '@server/infrastructure/circuit-breaker';
import { CacheService } from '@server/infrastructure/cache';

export const dynamic = 'force-dynamic';

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

    // Database check
    try {
      await storage.getAllNflTeams();
      health.database = { status: 'connected', latency: Date.now() - startTime };
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
