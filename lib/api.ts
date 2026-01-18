export type FetchResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

export function getSeasonWeek(): { season: number; week: number } {
  const season = Number(process.env.NEXT_PUBLIC_NFL_SEASON || new Date().getFullYear());
  const week = Number(process.env.NEXT_PUBLIC_NFL_WEEK || 1);
  return { season, week };
}

export async function fetchJson<T>(url: string, timeoutMs = 5000): Promise<FetchResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  } finally {
    clearTimeout(timeout);
  }
}
