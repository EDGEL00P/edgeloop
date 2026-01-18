/**
 * In-memory cache with TTL support
 * Provides a simple, fast caching layer for API responses and computed data
 */

import { CacheService as RedisCacheService } from "./redis";
import { logger } from "./logger";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/** Standard cache TTL values in seconds */
export const CacheTTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 1800,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
} as const;

/** Cache key generators for consistent key naming */
export const CacheKeys = {
  apiResponse: (endpoint: string, params: string) => `api:${endpoint}:${params}`,
  team: (teamId: number | string) => `team:${teamId}`,
  teams: () => "teams:all",
  game: (gameId: number) => `game:${gameId}`,
  gamesByWeek: (season: number, week: number) => `games:${season}:w${week}`,
  prediction: (gameId: number) => `prediction:${gameId}`,
  weeklyMetrics: (teamId: number, season: number, week: number) =>
    `metrics:${teamId}:${season}:w${week}`,
  odds: (gameId: number) => `odds:${gameId}`,
  oddsHistory: (gameId: number) => `odds:history:${gameId}`,
  espnStats: (teamId: string) => `espn:stats:${teamId}`,
  espnInjuries: (teamId: string) => `espn:injuries:${teamId}`,
  espnDepthChart: (teamId: string) => `espn:depth:${teamId}`,
  playerProps: (playerId: number) => `props:player:${playerId}`,
  correlation: (legs: string) => `correlation:${legs}`,
  weather: (venue: string) => `weather:${venue}`,
  playerStats: (playerId: string, season: number) => `player:stats:${playerId}:${season}`,
  activePlayers: () => "players:active",
  playerInjuries: () => "injuries:players",
  teamRoster: (teamId: number) => `roster:team:${teamId}`,
};

interface CacheStats {
  hits: number;
  misses: number;
}

interface TaggedValue<T> {
  value: T;
  tags: string[];
}

/**
 * Thread-safe in-memory cache with automatic expiration
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private stats: CacheStats = { hits: 0, misses: 0 };
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt < now) {
          this.cache.delete(key);
        }
      }
    }, 60000);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number = CacheTTL.MEDIUM): Promise<boolean> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return true;
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    return Array.from(this.cache.keys()).filter((key) => regex.test(key));
  }

  async deletePattern(pattern: string): Promise<number> {
    const matchingKeys = await this.keys(pattern);
    for (const key of matchingKeys) {
      this.cache.delete(key);
    }
    return matchingKeys.length;
  }

  async setWithTags<T>(
    key: string,
    value: T,
    ttlSeconds: number,
    tags: string[]
  ): Promise<boolean> {
    const taggedValue: TaggedValue<T> = { value, tags };
    await this.set(key, taggedValue, ttlSeconds);
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const existing = (await this.get<string[]>(tagKey)) || [];
      existing.push(key);
      await this.set(tagKey, existing, CacheTTL.DAY);
    }
    return true;
  }

  async invalidateByTag(tag: string): Promise<number> {
    const tagKey = `tag:${tag}`;
    const keys = (await this.get<string[]>(tagKey)) || [];
    for (const key of keys) {
      this.cache.delete(key);
    }
    this.cache.delete(tagKey);
    return keys.length;
  }

  getStats(): { hits: number; misses: number; hitRate: string; size: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + "%" : "N/A",
      size: this.cache.size,
    };
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map((key) => this.get<T>(key)));
  }

  async mset<T>(entries: { key: string; value: T; ttl?: number }[]): Promise<boolean> {
    for (const entry of entries) {
      await this.set(entry.key, entry.value, entry.ttl);
    }
    return true;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

export const cache = new MemoryCache();
const redisEnabled = !!process.env.REDIS_URL;

if (redisEnabled) {
  logger.info({ type: "cache_backend", message: "Redis cache enabled" });
}

/**
 * Static cache service for convenient access
 */
export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    const l1 = await cache.get<T>(key);
    if (l1 !== null) {
      return l1;
    }
    if (!redisEnabled) {
      return null;
    }
    const l2 = await RedisCacheService.get<T>(key);
    if (l2 !== null) {
      // Short L1 cache to reduce Redis round-trips
      await cache.set(key, l2, CacheTTL.SHORT);
    }
    return l2;
  }

  static async set<T>(key: string, value: T, ttl: number = CacheTTL.MEDIUM): Promise<boolean> {
    const l1Ok = await cache.set(key, value, ttl);
    if (!redisEnabled) {
      return l1Ok;
    }
    await RedisCacheService.set(key, value, ttl);
    return l1Ok;
  }

  static async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM
  ): Promise<T> {
    const cached = await CacheService.get<T>(key);
    if (cached !== null) return cached;

    const value = await fetchFn();
    await CacheService.set(key, value, ttl);
    return value;
  }

  static async invalidate(key: string): Promise<boolean> {
    const l1Ok = await cache.delete(key);
    if (redisEnabled) {
      await RedisCacheService.delete(key);
    }
    return l1Ok;
  }

  static async invalidatePattern(pattern: string): Promise<number> {
    const l1 = await cache.deletePattern(pattern);
    if (redisEnabled) {
      await RedisCacheService.invalidatePattern(pattern);
    }
    return l1;
  }

  static getStats(): { hits: number; misses: number; hitRate: string; size: number } {
    return cache.getStats();
  }
}

export default cache;
