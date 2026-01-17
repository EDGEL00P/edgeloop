/**
 * Environment Variables - Strict Validation (Fail Fast)
 * Uses Zod to validate all required environment variables
 * FAILS IMMEDIATELY at build time if any required variable is missing
 * 
 * CRITICAL: This file must be imported before any other code that uses env vars
 * Usage: import { env } from '@/lib/env' (NOT process.env)
 */

import "server-only";
import { z } from "zod";

const envSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(["development", "test", "production"]).optional().default("development"),

  // Upstash Redis
  UPSTASH_REDIS_REST_URL: z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL"),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required"),
  
  // Trigger.dev
  TRIGGER_API_KEY: z.string().min(1, "TRIGGER_API_KEY is required"),
  TRIGGER_PROJECT_ID: z.string().optional().default("edgeloop"),
  
  // Vercel AI Gateway
  AI_GATEWAY_API_KEY: z.string().min(1, "AI_GATEWAY_API_KEY is required"),

  // Rust Engine
  RUST_ENGINE_URL: z.string().url("RUST_ENGINE_URL must be a valid URL"),
});

// Validate environment variables immediately at module load time
// This will throw and crash the application if any required env var is missing
const envResult = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  TRIGGER_API_KEY: process.env.TRIGGER_API_KEY,
  TRIGGER_PROJECT_ID: process.env.TRIGGER_PROJECT_ID,
  AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
  RUST_ENGINE_URL: process.env.RUST_ENGINE_URL,
});

if (!envResult.success) {
  const errors = envResult.error.issues
    .map((err: { path: (string | number)[]; message: string }) => `${err.path.join(".")}: ${err.message}`)
    .join("\n");
  
  throw new Error(
    `❌ ENVIRONMENT VALIDATION FAILED:\n${errors}\n\n` +
    `Application cannot start. Please configure all required environment variables.`
  );
}

// Export validated environment object
// This is the ONLY way to access environment variables in the application
export const env = envResult.data;
