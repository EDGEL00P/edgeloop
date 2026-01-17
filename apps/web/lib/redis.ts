/**
 * Redis Client - Core Infrastructure
 * Pure Redis client for caching and rate limiting
 * Uses Upstash Redis REST API
 */

import "server-only";
import { Redis } from "@upstash/redis";
import { env } from "./env";

let redisClient: Redis | null = null;

/**
 * Get or initialize Redis client
 * Uses validated environment variables from env.ts
 */
export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redisClient;
}

/**
 * Check if Redis is configured
 * Always returns true since env validation ensures it's set
 */
export function isRedisConfigured(): boolean {
  return true; // env.ts validation ensures these are always set
}
