import { CacheService, CacheKeys, CacheTTL } from "../infrastructure/cache";
import { logger } from "../infrastructure/logger";
import { metrics } from "../infrastructure/metrics";
import { dataRouter, getTeams, getGames } from "./dataRouter";

interface RefreshJob {
  name: string;
  intervalMs: number;
  lastRun: number;
  isRunning: boolean;
  execute: () => Promise<void>;
}

interface DataSourceSyncTimes {
  games: string | null;
  odds: string | null;
  injuries: string | null;
  weather: string | null;
  news: string | null;
}

const dataSyncTimes: DataSourceSyncTimes = {
  games: null,
  odds: null,
  injuries: null,
  weather: null,
  news: null,
};

export function updateSyncTime(source: keyof DataSourceSyncTimes) {
  dataSyncTimes[source] = new Date().toISOString();
}

export function getSyncTimes(): DataSourceSyncTimes {
  return { ...dataSyncTimes };
}

class AutoRefreshManager {
  private jobs: Map<string, RefreshJob> = new Map();
  private intervalHandle: NodeJS.Timeout | null = null;
  private isStarted = false;

  registerJob(name: string, intervalMs: number, execute: () => Promise<void>) {
    this.jobs.set(name, {
      name,
      intervalMs,
      lastRun: 0,
      isRunning: false,
      execute,
    });
    logger.info({ type: "refresh_job_registered", name, intervalMs });
  }

  start() {
    if (this.isStarted) return;
    this.isStarted = true;

    this.intervalHandle = setInterval(() => this.runDueJobs(), 10000);
    logger.info({ type: "auto_refresh_started", jobCount: this.jobs.size });

    this.warmCaches();
  }

  stop() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    this.isStarted = false;
    logger.info({ type: "auto_refresh_stopped" });
  }

  private async runDueJobs() {
    const now = Date.now();
    const jobEntries = Array.from(this.jobs.entries());

    for (const [name, job] of jobEntries) {
      if (job.isRunning) continue;
      if (now - job.lastRun < job.intervalMs) continue;

      job.isRunning = true;
      job.lastRun = now;

      try {
        const start = Date.now();
        await job.execute();
        metrics.histogram("refresh_job_duration_ms", Date.now() - start, { job: name });
        metrics.increment("refresh_job_success", 1, { job: name });
        logger.debug({ type: "refresh_job_completed", name, durationMs: Date.now() - start });
      } catch (error) {
        metrics.increment("refresh_job_error", 1, { job: name });
        logger.error({ type: "refresh_job_failed", name, error: (error as Error).message });
      } finally {
        job.isRunning = false;
      }
    }
  }

  private async warmCaches() {
    logger.info({ type: "cache_warming_started" });

    try {
      await getTeams();
      logger.debug({ type: "cache_warmed", item: "teams" });
    } catch (error) {
      logger.warn({ type: "cache_warm_failed", item: "teams", error: (error as Error).message });
    }

    const currentWeek = getCurrentNFLWeek();
    try {
      await getGames(2025, currentWeek);
      logger.debug({ type: "cache_warmed", item: `games_week_${currentWeek}` });
    } catch (error) {
      logger.warn({ type: "cache_warm_failed", item: "games", error: (error as Error).message });
    }

    logger.info({ type: "cache_warming_completed" });
  }

  getStatus(): Record<string, any> {
    const status: Record<string, any> = {
      isRunning: this.isStarted,
      jobs: {},
    };

    const jobEntries = Array.from(this.jobs.entries());
    for (const [name, job] of jobEntries) {
      status.jobs[name] = {
        lastRun: job.lastRun ? new Date(job.lastRun).toISOString() : "never",
        nextRun: job.lastRun ? new Date(job.lastRun + job.intervalMs).toISOString() : "pending",
        isRunning: job.isRunning,
      };
    }

    return status;
  }
}

function getCurrentNFLWeek(): number {
  const now = new Date();
  const seasonStart = new Date(2025, 8, 4);
  const diffMs = now.getTime() - seasonStart.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(18, diffWeeks + 1));
}

export const autoRefreshManager = new AutoRefreshManager();

autoRefreshManager.registerJob("teams", 24 * 60 * 60 * 1000, async () => {
  await getTeams();
});

autoRefreshManager.registerJob("current_week_games", 5 * 60 * 1000, async () => {
  const week = getCurrentNFLWeek();
  await getGames(2025, week);
  updateSyncTime('games');
});

autoRefreshManager.registerJob("odds", 60 * 1000, async () => {
  try {
    const response = await fetch("http://localhost:5000/api/odds/nfl?refresh=true");
    if (!response.ok) throw new Error(`Odds refresh failed: ${response.status}`);
    updateSyncTime('odds');
  } catch (error) {
    logger.warn({ type: "odds_refresh_skipped", error: (error as Error).message });
  }
});

autoRefreshManager.registerJob("injuries", 15 * 60 * 1000, async () => {
  updateSyncTime('injuries');
});

autoRefreshManager.registerJob("weather", 30 * 60 * 1000, async () => {
  updateSyncTime('weather');
});

autoRefreshManager.registerJob("news", 10 * 60 * 1000, async () => {
  updateSyncTime('news');
});

autoRefreshManager.registerJob("cache_cleanup", 60 * 60 * 1000, async () => {
  logger.debug({ type: "cache_cleanup_running" });
});

export function startAutoRefresh() {
  autoRefreshManager.start();
}

export function stopAutoRefresh() {
  autoRefreshManager.stop();
}

export function getRefreshStatus() {
  return autoRefreshManager.getStatus();
}

export default autoRefreshManager;
