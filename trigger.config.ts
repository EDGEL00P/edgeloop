/**
 * Trigger.dev Configuration - Production Ready
 * Configures the Trigger.dev SDK for background jobs
 */

import "server-only";
import type { TriggerConfig } from "@trigger.dev/sdk/v3";
import { env } from "@/lib/env";

// @ts-expect-error - Trigger.dev v3 config may vary
export default {
  project: env.TRIGGER_PROJECT_ID,
  logLevel: env.NODE_ENV === "production" ? "info" : "debug",
} as TriggerConfig;
