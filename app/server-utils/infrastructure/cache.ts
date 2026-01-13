interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export const CacheTTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 1800,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
};

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
};

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = { hits: 0, misses: 0 };
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      Array.from(this.cache.entries()).forEach(([key, entry]) => {
        if (entry.expiresAt < now) {
          this.cache.delete(key);
        }
      });
    }, 60000);
  }

  async get<T = any>(key: string): Promise<T | null> {
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

  async set(key: string, value: any, ttlSeconds: number = CacheTTL.MEDIUM): Promise<boolean> {
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

  async setWithTags(
    key: string,
    value: any,
    ttlSeconds: number,
    tags: string[]
  ): Promise<boolean> {
    await this.set(key, { value, tags }, ttlSeconds);
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

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + "%" : "N/A",
      size: this.cache.size,
    };
  }

  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map((key) => this.get<T>(key)));
  }

  async mset(entries: { key: string; value: any; ttl?: number }[]): Promise<boolean> {
    for (const entry of entries) {
      await this.set(entry.key, entry.value, entry.ttl);
    }
    return true;
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

export const cache = new MemoryCache();

export class CacheService {
  static async get<T = any>(key: string): Promise<T | null> {
    return cache.get<T>(key);
  }

  static async set(key: string, value: any, ttl: number = CacheTTL.MEDIUM): Promise<boolean> {
    return cache.set(key, value, ttl);
  }

  static async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM
  ): Promise<T> {
    const cached = await cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await cache.set(key, value, ttl);
    return value;
  }

  static async invalidate(key: string): Promise<boolean> {
    return cache.delete(key);
  }

  static async invalidatePattern(pattern: string): Promise<number> {
    return cache.deletePattern(pattern);
  }

  static getStats() {
    return cache.getStats();
  }
}

export default cache;
