import Redis, { RedisOptions } from "ioredis";

const createRedisClient = () => {
  const options: RedisOptions = {
    maxRetriesPerRequest: 3,
    retryStrategy: (retries: number) => {
      if (retries > 20) return null;
      return Math.min(retries * 100, 3000);
    },
    enableReadyCheck: true,
    lazyConnect: true,
  };

  const url = process.env.REDIS_URL;
  if (url) {
    return new Redis(url, options);
  }
  return new Redis({
    host: "localhost",
    port: 6379,
    ...options
  });
};

const redis = createRedisClient();

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

redis.on("connect", () => {
  console.log("Redis connected");
});

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export const CacheKeys = {
  prediction: (gameId: string) => `pred:${gameId}`,
  propPrediction: (propId: string) => `prop:${propId}`,
  playerProps: (gameId: string) => `props:${gameId}`,
  sgmOptimizer: (gameId: string) => `sgm:${gameId}`,
  weeklyRecs: (season: number, week: number) => `weekly:${season}:${week}`,
  teamStats: (teamId: string) => `team:${teamId}`,
  playerStats: (playerId: string, season: number) => `player:${playerId}:${season}`,
  correlationMatrix: (gameId: string) => `corr:${gameId}`,
};

export const CacheTTL = {
  SHORT: 60,
  MEDIUM: 300,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
};

export const CacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      if (cached) {
        const entry: CacheEntry<T> = JSON.parse(cached);
        return entry.data;
      }
      return null;
    } catch (error) {
      console.error(`Cache get error for ${key}:`, error);
      return null;
    }
  },

  async set<T>(key: string, data: T, ttlSeconds: number = CacheTTL.MEDIUM): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlSeconds,
      };
      await redis.setex(key, ttlSeconds, JSON.stringify(entry));
    } catch (error) {
      console.error(`Cache set error for ${key}:`, error);
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for ${key}:`, error);
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error(`Cache invalidate error for ${pattern}:`, error);
    }
  },

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = CacheTTL.MEDIUM
  ): Promise<T> {
    const cached = await CacheService.get<T>(key);
    if (cached) return cached;
    const data = await fetchFn();
    await CacheService.set(key, data, ttlSeconds);
    return data;
  },
};

export default CacheService;
