import { sources } from "./sourceRegistry";
import { health } from "./sourceHealth";

export function scoreSource(source: keyof typeof sources): number {
  const base = sources[source].weight;
  const h = health[source];

  if (!h) return base * 0.2; // unknown, low confidence

  const latencyPenalty = Math.min(1, h.latencyMs / 2000); // 0..1
  const errorPenalty = h.errorRate; // 0..1
  const freshnessPenalty = h.lastSuccess
    ? Math.min(1, (Date.now() - h.lastSuccess) / 60000) // 1 minute stale => 1
    : 1;

  return base * (1 - latencyPenalty) * (1 - errorPenalty) * (1 - freshnessPenalty);
}

export function bestSource<T extends keyof typeof sources>(candidates: T[]): T {
  let best = candidates[0];
  let bestScore = -Infinity;
  for (const c of candidates) {
    const s = scoreSource(c);
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }
  return best;
}

export function healthSnapshot() {
  const out: Record<string, any> = {};
  for (const key of Object.keys(sources)) {
    out[key] = { score: scoreSource(key as any), ...(health[key] ?? null) };
  }
  return out;
}
