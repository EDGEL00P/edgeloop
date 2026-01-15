/**
 * Metrics collection for observability
 * Provides counters, gauges, and histograms for monitoring
 */

import { logger } from "./logger";

interface HistogramStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

interface MetricsSnapshot {
  uptime_ms: number;
  counters: Record<string, number>;
  gauges: Record<string, number>;
  histograms: Record<string, HistogramStats>;
}

/**
 * In-memory metrics collector
 */
class MetricsCollector {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, number[]>();
  private startTime = Date.now();

  /**
   * Increment a counter metric
   */
  increment(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + value);
  }

  /**
   * Set a gauge metric value
   */
  gauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);
  }

  /**
   * Record a histogram value
   */
  histogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    // Keep last 1000 values to prevent memory growth
    if (values.length > 1000) values.shift();
    this.histograms.set(key, values);
  }

  /**
   * Time an async operation and record as histogram
   */
  async timer<T>(
    name: string,
    fn: () => Promise<T>,
    labels?: Record<string, string>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.histogram(name, Date.now() - start, { ...labels, success: "true" });
      return result;
    } catch (error) {
      this.histogram(name, Date.now() - start, { ...labels, success: "false" });
      throw error;
    }
  }

  private buildKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
    return `${name}{${labelStr}}`;
  }

  /**
   * Get current metrics snapshot
   */
  getStats(): MetricsSnapshot {
    const stats: MetricsSnapshot = {
      uptime_ms: Date.now() - this.startTime,
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: {},
    };

    for (const [key, values] of this.histograms.entries()) {
      if (values.length === 0) continue;
      const sorted = [...values].sort((a, b) => a - b);
      stats.histograms[key] = {
        count: values.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      };
    }

    return stats;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

export const metrics = new MetricsCollector();

/**
 * Initialize metrics system
 */
export async function initializeMetrics(): Promise<boolean> {
  logger.info({ type: "metrics_initialized", mode: process.env.METRICS_MODE || "memory" });
  return true;
}

export default metrics;
