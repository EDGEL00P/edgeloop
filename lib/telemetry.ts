/**
 * Telemetry Layer (Redis) - High-Frequency NFL Telemetry System
 * Stores and retrieves telemetry via Upstash Redis (Streams)
 *
 * NOTE: ClickHouse removed per request.
 */

import "server-only";
import { env } from "./env";
import { Redis } from "@upstash/redis";

export interface TelemetryRecord {
  game_id: string;
  play_id: string;
  timestamp: number;
  offense_id: string;
  defense_id: string;
  down: number;
  distance: number;
  yard_line: number;
  score_home: number;
  score_away: number;
  time_remaining: number;
  weather_temp?: number;
  weather_wind?: number;
  [key: string]: unknown; // Allow additional fields
}

const STREAM_PREFIX = "telemetry:tracking_data:";
let redisClient: Redis | null = null;

/**
 * Get or initialize Redis client
 */
function getRedis(): Redis {
  redisClient ??= new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  return redisClient;
}

/**
 * Append telemetry to Redis stream (for ingestion paths).
 * This writes REAL data to Redis; no mock data.
 */
export async function appendTelemetry(gameId: string, record: TelemetryRecord): Promise<string> {
  const redis = getRedis();
  const streamKey = `${STREAM_PREFIX}${gameId}`;

  // Store the entire record as JSON to preserve schema evolution
  const id = await redis.xadd(streamKey, "*", {
    json: JSON.stringify(record),
    ts: record.timestamp.toString(),
    play_id: record.play_id,
  });

  return String(id);
}

/**
 * Get latest telemetry for a game from Redis stream.
 * Returns most recent records (default: 200).
 */
export async function getRealtimeTelemetryLatest(
  gameId: string,
  limit: number = 200
): Promise<TelemetryRecord[]> {
  const redis = getRedis();
  const streamKey = `${STREAM_PREFIX}${gameId}`;

  // XREVRANGE returns entries newest -> oldest
  const rawEntries: unknown = await (redis as any).xrevrange(streamKey, "+", "-", limit);

  const records: TelemetryRecord[] = [];

  const entries: Array<[string, Record<string, unknown>]> = Array.isArray(rawEntries)
    ? (rawEntries as Array<[string, Record<string, unknown>]>)
    : Object.entries(rawEntries as Record<string, Record<string, unknown>>);

  for (const [, fieldsRaw] of entries) {
    const fields = fieldsRaw as Record<string, string>;
    const json = fields.json;
    if (!json) continue;

    try {
      records.push(JSON.parse(json) as TelemetryRecord);
    } catch {
      // fail fast? telemetry payload malformed means upstream wrote garbage.
      throw new Error(`Telemetry stream contains invalid JSON for gameId=${gameId}`);
    }
  }

  return records;
}

/**
 * Health check for telemetry backend (Redis).
 */
export async function checkTelemetryHealth(): Promise<boolean> {
  const redis = getRedis();
  const pong = await redis.ping();
  return pong === "PONG";
}
