/**
 * Source selection based on health scores
 * Automatically routes to the healthiest data source
 */

import { sources, SourceId } from "./sourceRegistry";
import { health, SourceHealth } from "./sourceHealth";

interface SourceSnapshot extends Partial<SourceHealth> {
  score: number;
}

/**
 * Calculate a health score for a data source (0-1)
 * Higher is better
 */
export function scoreSource(source: SourceId): number {
  const base = sources[source].weight;
  const sourceHealth = health[source];

  if (!sourceHealth) return base * 0.2; // unknown source, low confidence

  // Penalty factors (each 0-1, higher = worse)
  const latencyPenalty = Math.min(1, sourceHealth.latencyMs / 2000);
  const errorPenalty = sourceHealth.errorRate;
  const freshnessPenalty = sourceHealth.lastSuccess
    ? Math.min(1, (Date.now() - sourceHealth.lastSuccess) / 60000)
    : 1;

  return base * (1 - latencyPenalty) * (1 - errorPenalty) * (1 - freshnessPenalty);
}

/**
 * Select the best source from a list of candidates
 */
export function bestSource<T extends SourceId>(candidates: T[]): T {
  let best = candidates[0];
  let bestScore = -Infinity;
  
  for (const candidate of candidates) {
    const score = scoreSource(candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  
  return best;
}

/**
 * Get a snapshot of all source health statuses
 */
export function healthSnapshot(): Record<SourceId, SourceSnapshot> {
  const out: Record<string, SourceSnapshot> = {};
  
  for (const key of Object.keys(sources) as SourceId[]) {
    out[key] = {
      score: scoreSource(key),
      ...(health[key] ?? {}),
    };
  }
  
  return out as Record<SourceId, SourceSnapshot>;
}
