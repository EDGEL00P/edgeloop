export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout?: number;
  fallback?: () => Promise<any>;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt: number = Date.now();
  private lastFailureTime?: number;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        console.warn(`[CircuitBreaker] ${this.name} is OPEN, next attempt in ${this.nextAttempt - Date.now()}ms`);
        if (this.config.fallback) {
          return this.config.fallback();
        }
        throw new Error(`Circuit breaker '${this.name}' is OPEN`);
      }
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
      console.info(`[CircuitBreaker] ${this.name} transitioning to HALF_OPEN`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        console.info(`[CircuitBreaker] ${this.name} CLOSED`);
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.config.timeout;
      console.warn(`[CircuitBreaker] ${this.name} OPENED from HALF_OPEN`);
      return;
    }

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.config.timeout;
      console.warn(`[CircuitBreaker] ${this.name} OPENED after ${this.failureCount} failures`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failureCount,
      successes: this.successCount,
      lastFailure: this.lastFailureTime,
      nextAttempt: this.state === CircuitState.OPEN ? this.nextAttempt : null,
    };
  }

  reset() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    console.info(`[CircuitBreaker] ${this.name} RESET`);
  }
}

export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();

  create(name: string, config: CircuitBreakerConfig): CircuitBreaker {
    const breaker = new CircuitBreaker(name, config);
    this.breakers.set(name, breaker);
    return breaker;
  }

  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  getAll(): Map<string, CircuitBreaker> {
    return this.breakers;
  }

  getAllStats() {
    const stats: Record<string, any> = {};
    Array.from(this.breakers.entries()).forEach(([name, breaker]) => {
      stats[name] = breaker.getStats();
    });
    return stats;
  }

  resetAll() {
    Array.from(this.breakers.values()).forEach((breaker) => {
      breaker.reset();
    });
  }
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: Error) => boolean;
}

export class RetryStrategy {
  constructor(private config: RetryConfig) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    let delay = this.config.baseDelayMs;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (this.config.retryableErrors && !this.config.retryableErrors(lastError)) {
          throw lastError;
        }

        if (attempt < this.config.maxAttempts) {
          const jitter = Math.random() * 0.3 * delay;
          const waitTime = Math.min(delay + jitter, this.config.maxDelayMs);
          console.warn(`[Retry] Attempt ${attempt} failed, waiting ${Math.round(waitTime)}ms`);
          await this.sleep(waitTime);
          delay *= this.config.backoffMultiplier || 2;
        }
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(errorMessage || `Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle!);
  }
}

export async function resilientExecute<T>(
  name: string,
  fn: () => Promise<T>,
  options: {
    circuitBreaker?: CircuitBreaker;
    retry?: RetryConfig;
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const execute = async () => {
    let operation = fn;

    if (options.timeoutMs) {
      operation = () => withTimeout(fn(), options.timeoutMs!);
    }

    if (options.retry) {
      const retryStrategy = new RetryStrategy(options.retry);
      operation = () => retryStrategy.execute(fn);
    }

    return operation();
  };

  if (options.circuitBreaker) {
    return options.circuitBreaker.execute(execute);
  }

  return execute();
}

export const circuitBreakerManager = new CircuitBreakerManager();

export default CircuitBreaker;
