/**
 * Rate Limiter - Sliding Window Implementation
 * Pure Redis-based rate limiting using INCR and EXPIRE commands
 * No external SDK dependencies - direct Redis commands only
 * 
 * Throws an error if requests exceed 100/minute
 */

import "server-only";
import { getRedis, isRedisConfigured } from "./redis";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

export class RateLimitError extends Error {
  constructor(
    public readonly remaining: number,
    public readonly reset: number,
    message: string = "Rate limit exceeded"
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

const DEFAULT_LIMIT = 100;
const DEFAULT_WINDOW_SECONDS = 60; // 1 minute

/**
 * Sliding window rate limiter using pure Redis commands
 * 
 * Algorithm:
 * 1. Use INCR to increment request counter for the key
 * 2. Set EXPIRE on first request to create a TTL window
 * 3. Check if count exceeds limit - THROWS if exceeded
 * 
 * @param ip - IP address or unique identifier
 * @param limit - Maximum requests allowed (default: 100)
 * @param windowSeconds - Time window in seconds (default: 60)
 * @throws RateLimitError if requests exceed the limit
 */
export async function checkRateLimit(
  ip: string,
  limit: number = DEFAULT_LIMIT,
  windowSeconds: number = DEFAULT_WINDOW_SECONDS
): Promise<void> {
  // If Redis is not configured, allow all requests (development mode)
  if (!isRedisConfigured()) {
    return;
  }

  const redis = getRedis();
  const key = `ratelimit:${ip}`;

  try {
    // Sliding window rate limiting using INCR and EXPIRE
    // Algorithm:
    // 1. INCR the key (returns new count)
    // 2. If count is 1, set EXPIRE to create the window
    // 3. Check if count exceeds limit - THROW if exceeded
    
    // Increment counter and get new count
    const newCount = await redis.incr(key);

    // Set expiration only on first request (when count becomes 1)
    // This creates a sliding window - key expires after windowSeconds
    if (newCount === 1) {
      await redis.expire(key, windowSeconds);
    }

    // Check if limit exceeded - THROW error as per requirements
    if (newCount > limit) {
      // Get TTL to calculate reset time
      const ttl = await redis.ttl(key);
      const reset = Date.now() + (ttl > 0 ? ttl * 1000 : windowSeconds * 1000);
      
      throw new RateLimitError(
        0,
        reset,
        `Rate limit exceeded: ${newCount} requests in ${windowSeconds}s (limit: ${limit})`
      );
    }
  } catch (error) {
    // If it's already a RateLimitError, re-throw it
    if (error instanceof RateLimitError) {
      throw error;
    }
    
    // On other errors, log and allow the request (fail open)
    console.error("Rate limit check error:", error);
  }
}

/**
 * Get current rate limit status without incrementing (non-throwing version)
 * Useful for checking status before making a request
 */
export async function getRateLimitStatus(
  identifier: string,
  limit: number = DEFAULT_LIMIT,
  windowSeconds: number = DEFAULT_WINDOW_SECONDS
): Promise<RateLimitResult> {
  if (!isRedisConfigured()) {
    return {
      allowed: true,
      remaining: limit,
      reset: Date.now() + windowSeconds * 1000,
    };
  }

  const redis = getRedis();
  const key = `ratelimit:${identifier}`;

  try {
    const count = (await redis.get<number>(key)) || 0;
    const ttl = await redis.ttl(key);
    const remaining = Math.max(0, limit - count);

    return {
      allowed: count < limit,
      remaining,
      reset: Date.now() + (ttl > 0 ? ttl * 1000 : windowSeconds * 1000),
    };
  } catch (error) {
    console.error("Rate limit status error:", error);
    return {
      allowed: true,
      remaining: limit,
      reset: Date.now() + windowSeconds * 1000,
    };
  }
}

/**
 * Reset rate limit for an identifier
 * Useful for testing or manual reset
 */
export async function resetRateLimit(identifier: string): Promise<boolean> {
  if (!isRedisConfigured()) {
    return false;
  }

  try {
    const redis = getRedis();
    const key = `ratelimit:${identifier}`;
    await redis.del(key);
    return true;
  } catch (error) {
    console.error("Rate limit reset error:", error);
    return false;
  }
}
