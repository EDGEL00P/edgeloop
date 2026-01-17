/**
 * Statsig Integration - Algorithm A/B Testing
 * Vercel integration automatically provides STATSIG_SERVER_API_KEY
 * Limit: 2 Million Events
 */

import Statsig from "statsig-node";

let statsigInitialized = false;

/**
 * Initialize Statsig SDK
 */
export function initStatsig() {
  if (statsigInitialized) {
    return;
  }

  const serverApiKey = process.env.STATSIG_SERVER_API_KEY;
  if (!serverApiKey) {
    console.warn("Statsig server API key not configured");
    return;
  }

  Statsig.initialize(serverApiKey);
  statsigInitialized = true;
}

/**
 * Get feature gate value for A/B testing different algorithms
 */
export async function getAlgorithmVariant(
  userId: string,
  experimentName: string = "prediction_algorithm"
): Promise<"genesis_v1" | "genesis_v2" | "baseline"> {
  if (!statsigInitialized) {
    initStatsig();
  }

  try {
    const user = { userID: userId };
    const gate = Statsig.getExperiment(user, experimentName);
    
    return (gate.get("algorithm", "baseline") as "genesis_v1" | "genesis_v2" | "baseline");
  } catch (error) {
    console.error("Statsig error:", error);
    return "baseline";
  }
}

/**
 * Log custom event to Statsig
 */
export async function logPredictionEvent(
  userId: string,
  eventName: string,
  metadata: Record<string, unknown> = {}
) {
  if (!statsigInitialized) {
    initStatsig();
  }

  try {
    const user = { userID: userId };
    Statsig.logEvent(user, eventName, undefined, metadata);
  } catch (error) {
    console.error("Statsig log error:", error);
  }
}

/**
 * Check if feature is enabled
 */
export async function isFeatureEnabled(
  userId: string,
  featureName: string
): Promise<boolean> {
  if (!statsigInitialized) {
    initStatsig();
  }

  try {
    const user = { userID: userId };
    return Statsig.checkGate(user, featureName);
  } catch (error) {
    console.error("Statsig gate check error:", error);
    return false;
  }
}

/**
 * Get configuration value for algorithm parameters
 */
export function getConfigValue<T>(
  userId: string,
  configName: string,
  defaultValue: T
): T {
  if (!statsigInitialized) {
    initStatsig();
  }

  try {
    const user = { userID: userId };
    const config = Statsig.getConfig(user, configName);
    return config.get(configName, defaultValue) as T;
  } catch (error) {
    console.error("Statsig config error:", error);
    return defaultValue;
  }
}
