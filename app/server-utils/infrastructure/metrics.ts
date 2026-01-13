import { logger } from "./logger";

interface MetricData {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

interface TimerResult {
  duration: number;
  success: boolean;
}

class MetricsCollector {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, number[]>();
  private startTime = Date.now();

  increment(name: string, value: number = 1, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + value);
  }

  gauge(name: string, value: number, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);
  }

  histogram(name: string, value: number, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    if (values.length > 1000) values.shift();
    this.histograms.set(key, values);
  }

  timer<T>(name: string, fn: () => Promise<T>, labels?: Record<string, string>): Promise<T> {
    const start = Date.now();
    return fn()
      .then((result) => {
        this.histogram(name, Date.now() - start, { ...labels, success: "true" });
        return result;
      })
      .catch((error) => {
        this.histogram(name, Date.now() - start, { ...labels, success: "false" });
        throw error;
      });
  }

  private buildKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
    return `${name}{${labelStr}}`;
  }

  getStats(): Record<string, any> {
    const stats: Record<string, any> = {
      uptime_ms: Date.now() - this.startTime,
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: {},
    };

    const histogramEntries = Array.from(this.histograms.entries());
    for (const [key, values] of histogramEntries) {
      if (values.length === 0) continue;
      const sorted = [...values].sort((a: number, b: number) => a - b);
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

  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

export const metrics = new MetricsCollector();

export async function initializeMetrics() {
  logger.info({ type: "metrics_initialized", mode: process.env.METRICS_MODE || "memory" });
  return true;
}

export default metrics;
