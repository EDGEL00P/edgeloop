/**
 * Axiom Integration - Observability & Logging
 * Vercel integration automatically provides AXIOM_TOKEN and AXIOM_DATASET
 */

// @ts-ignore - Axiom types may not be fully exported
import AxiomClient from "@axiomhq/axiom-node";

let axiomClient: typeof AxiomClient | null = null;

function getAxiomClient(): typeof AxiomClient | null {
  if (!axiomClient) {
    const token = process.env.AXIOM_TOKEN;
    const dataset = process.env.AXIOM_DATASET;

    if (token && dataset) {
      // @ts-ignore - Axiom constructor may have type issues
      axiomClient = new AxiomClient({
        token,
        orgId: process.env.AXIOM_ORG_ID,
      });
    }
  }
  return axiomClient;
}

/**
 * Log event to Axiom
 */
export async function logToAxiom(
  event: Record<string, unknown>,
  dataset?: string
) {
  const client = getAxiomClient();
  if (!client) {
    // Silently fail if Axiom is not configured
    return;
  }

  const targetDataset = dataset || process.env.AXIOM_DATASET;
  if (!targetDataset) {
    return;
  }

  try {
    await client.ingest(targetDataset, [
      {
        ...event,
        _time: new Date().toISOString(),
      },
    ]);
  } catch (error) {
    console.error("Axiom ingestion error:", error);
  }
}

/**
 * Log API request
 */
export async function logApiRequest(params: {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userId?: string;
  error?: string;
}) {
  await logToAxiom({
    type: "api_request",
    ...params,
  });
}

/**
 * Log prediction event
 */
export async function logPrediction(params: {
  gameId: string;
  homeTeamId: number;
  awayTeamId: number;
  predictedSpread: number;
  confidence: number;
  algorithm: string;
  userId?: string;
}) {
  await logToAxiom({
    type: "prediction",
    ...params,
  });
}

/**
 * Log odds update
 */
export async function logOddsUpdate(params: {
  gameId: string;
  book: string;
  spread: number;
  total: number;
  timestamp: string;
}) {
  await logToAxiom({
    type: "odds_update",
    ...params,
  });
}

/**
 * Log error
 */
export async function logError(params: {
  error: string;
  stack?: string;
  context?: Record<string, unknown>;
  userId?: string;
}) {
  await logToAxiom({
    type: "error",
    level: "error",
    ...params,
  });
}
