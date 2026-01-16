/**
 * SYSTEM STATUS API
 * Comprehensive system status with all connections
 */

import { NextResponse } from 'next/server';
import { validateEnvironment } from '@server/infrastructure/env';
import { getRefreshStatus, getSyncTimes } from '@server/services/autoRefresh';
import { circuitBreakerManager } from '@server/infrastructure/circuit-breaker';
import { rateLimiterManager } from '@server/infrastructure/rate-limiter';
import { CacheService } from '@server/infrastructure/cache';
import { metrics } from '@server/infrastructure/metrics';
import { logger } from '@server/infrastructure/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const envCheck = validateEnvironment();
    const refreshStatus = getRefreshStatus();
    const syncTimes = getSyncTimes();

    const now = new Date();
    const hasRecentData = Object.values(syncTimes).some((time) => {
      if (!time) return false;
      const diff = now.getTime() - new Date(time).getTime();
      return diff < 5 * 60 * 1000; // 5 minutes
    });

    const hasStaleData = Object.values(syncTimes).some((time) => {
      if (!time) return false;
      const diff = now.getTime() - new Date(time).getTime();
      return diff > 15 * 60 * 1000; // 15 minutes
    });

    let systemStatus: 'healthy' | 'degraded' | 'offline' = 'healthy';
    if (hasStaleData) systemStatus = 'degraded';
    if (!refreshStatus.isRunning) systemStatus = 'offline';
    if (!envCheck.valid) systemStatus = 'degraded';

    const oddsJob = refreshStatus.jobs?.odds;
    const nextRefresh = oddsJob?.nextRun || new Date(Date.now() + 60000).toISOString();

    const status = {
      status: systemStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: {
        valid: envCheck.valid,
        missingRequired: envCheck.missingRequired.length,
        services: {
          database: !!process.env.DATABASE_URL,
          balldontlie: !!process.env.BALLDONTLIE_API_KEY,
          sportradar: !!process.env.SPORTRADAR_API_KEY,
          rapidapi: !!process.env.RAPIDAPI_KEY,
          odds: !!process.env.ODDS_API_KEY,
          weather: !!process.env.WEATHER_API_KEY,
          openai: !!process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
          gemini: !!process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
        },
      },
      dataSync: {
        lastSync: syncTimes,
        hasRecentData,
        hasStaleData,
        nextRefresh,
      },
      autoRefresh: refreshStatus,
      circuitBreakers: circuitBreakerManager.getAllStats(),
      rateLimiters: rateLimiterManager.getStats(),
      cache: CacheService.getStats(),
      metrics: metrics.getStats(),
    };

    const statusCode = systemStatus === 'healthy' ? 200 : systemStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(status, { status: statusCode });
  } catch (error) {
    logger.error({
      type: 'system_status_error',
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
