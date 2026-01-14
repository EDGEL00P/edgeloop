import { logger } from "./logger";
import { eq, and, or } from "drizzle-orm";

interface RateLimiterConfig {
  requestsPerMinute: number;
  burstAllowance?: number;
}

export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;

  constructor(private name: string, private config: RateLimiterConfig) {
    this.capacity = config.requestsPerMinute + (config.burstAllowance || 0);
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
    this.refillRate = config.requestsPerMinute / 60000;
  }

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const refillAmount = elapsed * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + refillAmount);
    this.lastRefill = now;
  }

  async acquire(tokens: number = 1): Promise<boolean> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    const waitTime = ((tokens - this.tokens) / this.refillRate);
    if (waitTime > 60000) {
      logger.warn({
        type: "rate_limit_exceeded",
        limiter: this.name,
        waitMs: waitTime,
      });
      return false;
    }

    await this.sleep(waitTime);
    this.refill();
    this.tokens -= tokens;
    return true;
  }

  tryAcquire(tokens: number = 1): boolean {
    this.refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  getWaitTime(tokens: number = 1): number {
    this.refill();
    if (this.tokens >= tokens) return 0;
    return Math.ceil((tokens - this.tokens) / this.refillRate);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

class RateLimiterManager {
  private limiters = new Map<string, TokenBucketRateLimiter>();

  create(name: string, config: RateLimiterConfig): TokenBucketRateLimiter {
    const limiter = new TokenBucketRateLimiter(name, config);
    this.limiters.set(name, limiter);
    return limiter;
  }

  get(name: string): TokenBucketRateLimiter | undefined {
    return this.limiters.get(name);
  }

  getStats(): Record<string, { available: number }> {
    const stats: Record<string, any> = {};
    const entries = Array.from(this.limiters.entries());
    for (const [name, limiter] of entries) {
      stats[name] = {
        available: limiter.getAvailableTokens(),
      };
    }
    return stats;
  }
}

export const rateLimiterManager = new RateLimiterManager();

export const apiLimiters = {
  ballDontLie: rateLimiterManager.create("balldontlie", { requestsPerMinute: 5, burstAllowance: 2 }),
  gemini: rateLimiterManager.create("gemini", { requestsPerMinute: 10, burstAllowance: 5 }),
  oddsApi: rateLimiterManager.create("odds_api", { requestsPerMinute: 10, burstAllowance: 5 }),
  weatherApi: rateLimiterManager.create("weather_api", { requestsPerMinute: 60, burstAllowance: 10 }),
  espn: rateLimiterManager.create("espn", { requestsPerMinute: 30, burstAllowance: 10 }),
};

export default rateLimiterManager;
