export type SourceHealth = {
  ok: boolean;
  latencyMs: number;
  lastSuccess: number;
  lastError?: string;
  errorRate: number; // 0..1 exponentially-smoothed
  consecutiveFailures: number;
  sampleCount: number;
};

export const health: Record<string, SourceHealth> = {};
