export class RateLimitError extends Error {
  reset?: number;

  constructor(message: string, reset?: number) {
    super(message);
    this.name = "RateLimitError";
    this.reset = reset;
  }
}

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

function getStore(): Map<string, RateLimitEntry> {
  const globalScope = globalThis as typeof globalThis & {
    __edgeloopRateLimitStore?: Map<string, RateLimitEntry>;
  };

  if (!globalScope.__edgeloopRateLimitStore) {
    globalScope.__edgeloopRateLimitStore = new Map();
  }

  return globalScope.__edgeloopRateLimitStore;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<void> {
  const store = getStore();
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  entry.count += 1;
  if (entry.count > limit) {
    throw new RateLimitError("Rate limit exceeded", entry.resetAt);
  }
}
