/**
 * Trigger.dev Configuration - Production Ready
 * Configures the Trigger.dev SDK for background jobs
 */

import "server-only";
import type { TriggerConfig } from "@trigger.dev/sdk/v3";
import { env } from "@/lib/env";

export default {
  project: env.TRIGGER_PROJECT_ID,
  apiKey: env.TRIGGER_API_KEY,
  logLevel: env.NODE_ENV === "production" ? "info" : "debug",
} satisfies TriggerConfig;
