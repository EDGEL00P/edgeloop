/**
 * AI Gateway demo endpoint
 * Streams text via Vercel AI Gateway (AI SDK)
 */

import "server-only";
import { NextRequest } from "next/server";
import { streamGatewayText } from "@/lib/ai-gateway";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { prompt?: string; model?: string };

  const prompt = body.prompt ?? "Invent a new holiday and describe its traditions.";
  const model = body.model ?? "openai/gpt-4.1";

  const result = await streamGatewayText({ model, prompt });

  // AI SDK stream response helper
  return result.toTextStreamResponse();
}

