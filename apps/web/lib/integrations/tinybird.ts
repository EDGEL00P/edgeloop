/**
 * Tinybird Integration - SQL-to-API for Odds Pipeline
 * Vercel integration automatically provides TINYBIRD_TOKEN
 * Limit: 1k queries/day
 */

interface TinybirdQueryParams {
  [key: string]: string | number | boolean | undefined;
}

export class TinybirdClient {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.TINYBIRD_API_URL || "https://api.tinybird.co/v0";
    this.token = process.env.TINYBIRD_TOKEN || "";
  }

  /**
   * Execute a SQL query on Tinybird pipeline
   */
  async query<T = unknown>(
    sql: string,
    params?: TinybirdQueryParams
  ): Promise<T> {
    if (!this.token) {
      throw new Error("TINYBIRD_TOKEN is not configured");
    }

    const url = new URL(`${this.baseUrl}/sql`);
    url.searchParams.set("q", sql);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tinybird query failed: ${error}`);
    }

    const data = await response.json();
    return data.data as T;
  }

  /**
   * Get odds data for a specific game
   */
  async getGameOdds(gameId: string, book?: string) {
    const sql = book
      ? `SELECT * FROM odds WHERE game_id = {game_id:String} AND book = {book:String} ORDER BY timestamp DESC LIMIT 100`
      : `SELECT * FROM odds WHERE game_id = {game_id:String} ORDER BY timestamp DESC LIMIT 100`;
    
    return this.query(sql, { game_id: gameId, book });
  }

  /**
   * Get latest odds updates for multiple games
   */
  async getLatestOdds(gameIds: string[]) {
    const gameIdsParam = gameIds.join(",");
    const sql = `
      SELECT * FROM odds 
      WHERE game_id IN ({game_ids:String})
      ORDER BY timestamp DESC
      LIMIT 1000
    `;
    
    return this.query(sql, { game_ids: gameIdsParam });
  }

  /**
   * Get odds history for analysis
   */
  async getOddsHistory(gameId: string, hours: number = 24) {
    const sql = `
      SELECT * FROM odds 
      WHERE game_id = {game_id:String}
      AND timestamp >= now() - INTERVAL {hours:Int32} HOUR
      ORDER BY timestamp ASC
    `;
    
    return this.query(sql, { game_id: gameId, hours });
  }
}

export const tinybird = new TinybirdClient();
