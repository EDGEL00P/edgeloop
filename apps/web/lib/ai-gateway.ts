/**
 * AI Gateway helper (Vercel AI Gateway + AI SDK)
 *
 * Uses Vercel AI Gateway via the AI SDK `ai` package.
 * Requires `AI_GATEWAY_API_KEY` to be present (validated in `env.ts`).
 */

import "server-only";
import { streamText } from "ai";
import { env } from "@/lib/env";

export async function streamGatewayText(params: { model: string; prompt: string }) {
  // Ensure the env is referenced so builds fail fast if missing
  // (env validation already throws, but this keeps usage obvious)
  void env.AI_GATEWAY_API_KEY;

  return streamText({
    model: params.model,
    prompt: params.prompt,
  });
}

