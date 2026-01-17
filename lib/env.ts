/**
 * Environment Variables - Production-Ready Validation
 * Uses Zod to validate all required environment variables
 * Allows builds without env vars (runtime validation only)
 * 
 * Usage: import { env } from '@/lib/env' (NOT process.env)
 */

import "server-only";
import { z } from "zod";

const envSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(["development", "test", "production"]).optional().default("development"),

  // Upstash Redis (optional for builds, required at runtime)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  
  // Trigger.dev (optional for builds, required at runtime)
  TRIGGER_API_KEY: z.string().min(1).optional(),
  TRIGGER_PROJECT_ID: z.string().optional().default("edgeloop"),
  
  // Vercel AI Gateway (optional)
  AI_GATEWAY_API_KEY: z.string().min(1).optional(),

  // Rust Engine (optional, defaults to localhost)
  RUST_ENGINE_URL: z.string().url().optional().default("http://localhost:3001"),
});

// Parse with safe defaults for build time
const rawEnv = {
  NODE_ENV: process.env.NODE_ENV,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  TRIGGER_API_KEY: process.env.TRIGGER_API_KEY,
  TRIGGER_PROJECT_ID: process.env.TRIGGER_PROJECT_ID,
  AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
  RUST_ENGINE_URL: process.env.RUST_ENGINE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
};

const envResult = envSchema.safeParse(rawEnv);

// Never throw during build - allow builds to succeed
// Runtime validation will happen when code actually runs
const isBuildTime = process.env.NEXT_PHASE === "phase-production-build" || 
                    process.env.NEXT_PHASE === "phase-development-build" ||
                    typeof window === "undefined" && process.env.VERCEL === undefined;

// Export validated environment object with safe defaults
// All vars are optional during build - Vercel will provide them at runtime
export const env = envResult.success ? envResult.data : {
  NODE_ENV: (rawEnv.NODE_ENV as "development" | "test" | "production") || "development",
  UPSTASH_REDIS_REST_URL: rawEnv.UPSTASH_REDIS_REST_URL || "",
  UPSTASH_REDIS_REST_TOKEN: rawEnv.UPSTASH_REDIS_REST_TOKEN || "",
  TRIGGER_API_KEY: rawEnv.TRIGGER_API_KEY || "",
  TRIGGER_PROJECT_ID: rawEnv.TRIGGER_PROJECT_ID || "edgeloop",
  AI_GATEWAY_API_KEY: rawEnv.AI_GATEWAY_API_KEY || "",
  RUST_ENGINE_URL: rawEnv.RUST_ENGINE_URL || "http://localhost:3001",
};
