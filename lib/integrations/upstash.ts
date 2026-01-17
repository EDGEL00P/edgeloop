/**
 * Upstash Integration - Redis Caching
 * Vercel integration automatically provides UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 */

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

let redisClient: Redis | null = null;
let rateLimiter: Ratelimit | null = null;

function getRedisClient(): Redis | null {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token) {
      redisClient = new Redis({
        url,
        token,
      });
    }
  }
  return redisClient;
}

/**
 * Get Redis client instance
 */
export function getRedis(): Redis | null {
  return getRedisClient();
}

/**
 * Cache data with TTL
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = 3600
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) {
    return false;
  }

  try {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
    return true;
  } catch (error) {
    console.error("Redis cache set error:", error);
    return false;
  }
}

/**
 * Get cached data
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  try {
    const data = await redis.get<string>(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as T;
  } catch (error) {
    console.error("Redis cache get error:", error);
    return null;
  }
}

/**
 * Delete cached data
 */
export async function cacheDelete(key: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) {
    return false;
  }

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error("Redis cache delete error:", error);
    return false;
  }
}

/**
 * Get rate limiter instance
 */
export function getRateLimiter(): Ratelimit | null {
  if (!rateLimiter) {
    const redis = getRedisClient();
    if (!redis) {
      return null;
    }

    rateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
    });
  }
  return rateLimiter;
}

/**
 * Check rate limit for an identifier (IP, user ID, etc.)
 */
export async function checkRateLimit(
  identifier: string
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const limiter = getRateLimiter();
  if (!limiter) {
    return { allowed: true, remaining: 999, reset: Date.now() };
  }

  const result = await limiter.limit(identifier);
  return {
    allowed: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Cache game odds
 */
export async function cacheGameOdds(
  gameId: string,
  odds: unknown,
  ttlSeconds: number = 300 // 5 minutes
) {
  return cacheSet(`odds:${gameId}`, odds, ttlSeconds);
}

/**
 * Get cached game odds
 */
export async function getCachedGameOdds<T>(gameId: string): Promise<T | null> {
  return cacheGet<T>(`odds:${gameId}`);
}

/**
 * Cache prediction
 */
export async function cachePrediction(
  gameId: string,
  prediction: unknown,
  ttlSeconds: number = 1800 // 30 minutes
) {
  return cacheSet(`prediction:${gameId}`, prediction, ttlSeconds);
}

/**
 * Get cached prediction
 */
export async function getCachedPrediction<T>(gameId: string): Promise<T | null> {
  return cacheGet<T>(`prediction:${gameId}`);
}
