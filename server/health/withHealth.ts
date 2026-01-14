import { health } from "./sourceHealth";

export async function withHealth<T>(source: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    const data = await fn();
    const latencyMs = Date.now() - start;
    const prev = health[source];

    health[source] = {
      ok: true,
      latencyMs,
      lastSuccess: Date.now(),
      lastError: undefined,
      errorRate: prev ? prev.errorRate * 0.9 : 0,
      consecutiveFailures: 0,
      sampleCount: (prev?.sampleCount ?? 0) + 1,
    };

    return data;
  } catch (e) {
    const prev = health[source];
    const prevErrorRate = prev?.errorRate ?? 0;
    health[source] = {
      ok: false,
      latencyMs: 9999,
      lastSuccess: prev?.lastSuccess ?? 0,
      lastError: (e as Error).message,
      errorRate: Math.min(1, prevErrorRate * 0.9 + 0.1),
      consecutiveFailures: (prev?.consecutiveFailures ?? 0) + 1,
      sampleCount: (prev?.sampleCount ?? 0) + 1,
    };
    throw e;
  }
}
