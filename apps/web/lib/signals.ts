/**
 * Signal Layer - Redis Pub/Sub and Rate Limiting
 * Real Redis operations for high-frequency signal broadcasting
 * Uses Upstash Redis REST API
 */

import "server-only";
import { Redis } from "@upstash/redis";
import { env } from "./env";

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

let redisClient: Redis | null = null;

/**
 * Get or initialize Redis client
 */
function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redisClient;
}

/**
 * Broadcast lock signal for a game
 * Uses Redis PUBLISH for real-time subscribers
 * 
 * @param gameId - Game identifier
 */
export async function broadcastLock(gameId: string): Promise<void> {
  const redis = getRedis();

  try {
    const message = JSON.stringify({
      gameId,
      timestamp: Date.now(),
      type: "lock",
    });

    // Publish to 'locks' channel for real-time subscribers
    await redis.publish("locks", message);
  } catch (error) {
    console.error("Failed to broadcast lock signal:", error);
    throw new Error(
      `Redis publish failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Check rate limit for an IP address
 * Uses Redis INCR + EXPIRE for atomic rate limiting
 * Throws RateLimitError if limit exceeded (> 100 requests per minute)
 * 
 * @param ip - IP address to check
 * @param limit - Maximum requests allowed (default: 100)
 * @param windowSeconds - Time window in seconds (default: 60)
 * @throws RateLimitError if limit exceeded
 */
export async function checkRateLimit(
  ip: string,
  limit: number = 100,
  windowSeconds: number = 60
): Promise<void> {
  const redis = getRedis();
  const key = `ratelimit:${ip}`;

  try {
    // Upstash Redis REST API atomic operations
    // INCR increments the counter atomically
    const newCount = await redis.incr(key);

    // Set expiration on first request only (when count becomes 1)
    // This creates the sliding window
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
    // Re-throw RateLimitError as-is
    if (error instanceof RateLimitError) {
      throw error;
    }

    // Log other errors but don't fail the request (fail open for Redis errors)
    console.error("Rate limit check error:", error);
    // Note: Fail-open behavior - if Redis fails, allow the request
  }
}
