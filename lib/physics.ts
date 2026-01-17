/**
 * Physics Bridge - Apache Arrow Flight Integration
 * Connects to Rust Engine for high-performance matchup analysis
 * Parses Apache Arrow IPC binary responses
 */

import "server-only";
import { Table } from "apache-arrow";
import { env } from "./env";

export class PhysicsEngineError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly endpoint?: string
  ) {
    super(message);
    this.name = "PhysicsEngineError";
  }
}

export interface MatchupAnalysisResult {
  offenseId: string;
  defenseId: string;
  predictedYards: number;
  successProbability: number;
  advantage: number;
  metadata: Record<string, unknown>;
}

/**
 * Fetch matchup analysis from Rust Engine
 * Returns Apache Arrow Table for efficient binary data handling
 * 
 * @param offenseId - Offensive team identifier
 * @param defenseId - Defensive team identifier
 * @returns Apache Arrow Table containing matchup analysis
 * @throws PhysicsEngineError if request fails
 */
export async function fetchMatchupAnalysis(
  offenseId: string,
  defenseId: string
): Promise<Table> {
  const url = new URL("/matchup", env.RUST_ENGINE_URL);

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/x-apache-arrow-streaming",
      },
      body: JSON.stringify({
        offense_id: offenseId,
        defense_id: defenseId,
      }),
    });

    // Check response status
    if (!response.ok) {
      const statusCode = response.status;

      if (statusCode === 404) {
        throw new PhysicsEngineError(
          `Matchup endpoint not found: ${url.toString()}`,
          404,
          url.toString()
        );
      }

      if (statusCode >= 500) {
        const errorText = await response.text().catch(() => "Unknown server error");
        throw new PhysicsEngineError(
          `Physics engine server error: ${errorText}`,
          statusCode,
          url.toString()
        );
      }

      const errorText = await response.text().catch(() => "Unknown error");
      throw new PhysicsEngineError(
        `Physics engine request failed: ${errorText}`,
        statusCode,
        url.toString()
      );
    }

    // Check content type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("arrow")) {
      throw new PhysicsEngineError(
        `Unexpected content type: ${contentType}. Expected Apache Arrow format.`,
        response.status,
        url.toString()
      );
    }

    // Parse Apache Arrow IPC binary stream
    const arrayBuffer = await response.arrayBuffer();
    
    if (arrayBuffer.byteLength === 0) {
      throw new PhysicsEngineError(
        "Empty response from physics engine",
        response.status,
        url.toString()
      );
    }

    // Create Arrow Table from binary data
    // @ts-ignore - apache-arrow Table.from API may vary by version
    const table = Table.from(new Uint8Array(arrayBuffer));

    return table;
  } catch (error) {
    // Re-throw PhysicsEngineError as-is
    if (error instanceof PhysicsEngineError) {
      throw error;
    }

    // Wrap other errors
    throw new PhysicsEngineError(
      `Failed to fetch matchup analysis: ${error instanceof Error ? error.message : String(error)}`,
      undefined,
      url.toString()
    );
  }
}

/**
 * Fetch matchup analysis and convert to typed result
 * Convenience function that parses Arrow Table to JavaScript objects
 * 
 * @param offenseId - Offensive team identifier
 * @param defenseId - Defensive team identifier
 * @returns Typed matchup analysis result
 */
export async function getMatchupAnalysis(
  offenseId: string,
  defenseId: string
): Promise<MatchupAnalysisResult[]> {
  const table = await fetchMatchupAnalysis(offenseId, defenseId);

  // Convert Arrow Table to JavaScript objects
  // Assuming table schema matches MatchupAnalysisResult
  const results: MatchupAnalysisResult[] = [];

  for (let i = 0; i < table.numRows; i++) {
    const row = table.get(i);

    // Extract fields from Arrow record
    // Adjust field names based on actual Arrow schema
    const result: MatchupAnalysisResult = {
      offenseId: row?.get("offense_id")?.toString() || offenseId,
      defenseId: row?.get("defense_id")?.toString() || defenseId,
      predictedYards: Number(row?.get("predicted_yards") || 0),
      successProbability: Number(row?.get("success_probability") || 0),
      advantage: Number(row?.get("advantage") || 0),
      metadata: (row?.get("metadata") as Record<string, unknown>) || {},
    };

    results.push(result);
  }

  return results;
}
