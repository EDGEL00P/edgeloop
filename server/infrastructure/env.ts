/**
 * ENVIRONMENT VARIABLE VALIDATION
 * Ensures all required and optional API keys are properly configured
 * Provides fallback mechanisms for missing optional keys
 */

import { logger } from './logger';
import { envRegistry } from '../../infra/env/registry';

interface EnvConfig {
  name: string;
  required: boolean;
  description: string;
  fallback?: string;
  aliases?: string[];
}

const ENV_VARIABLES: EnvConfig[] = envRegistry
  .filter((entry) => entry.scopes.includes('server'))
  .map((entry) => ({
    name: entry.name,
    required:
      entry.required ||
      (!!entry.requiredInProduction && process.env.NODE_ENV === 'production'),
    description: entry.description,
    aliases: entry.aliases,
  }));

function resolveEnvValue(config: EnvConfig): string | undefined {
  const direct = process.env[config.name];
  if (direct) return direct;

  if (config.aliases) {
    for (const alias of config.aliases) {
      const aliasValue = process.env[alias];
      if (aliasValue) {
        process.env[config.name] = aliasValue;
        return aliasValue;
      }
    }
  }

  return undefined;
}

export interface EnvStatus {
  name: string;
  loaded: boolean;
  required: boolean;
  masked: string;
  status: 'loaded' | 'missing' | 'optional';
}

/**
 * Validate all environment variables
 */
export function validateEnvironment(): {
  valid: boolean;
  statuses: EnvStatus[];
  missingRequired: string[];
} {
  const statuses: EnvStatus[] = [];
  const missingRequired: string[] = [];

  for (const config of ENV_VARIABLES) {
    const value = resolveEnvValue(config);
    const loaded = !!value;
    const masked = value
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : 'N/A';

    const status: EnvStatus = {
      name: config.name,
      loaded,
      required: config.required,
      masked,
      status: loaded ? 'loaded' : config.required ? 'missing' : 'optional',
    };

    statuses.push(status);

    if (config.required && !loaded) {
      missingRequired.push(config.name);
    }
  }

  const valid = missingRequired.length === 0;

  return { valid, statuses, missingRequired };
}

/**
 * Get environment variable with validation
 */
export function getEnv(key: string, required = false): string {
  const value = process.env[key];
  
  if (required && !value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  
  return value || '';
}

/**
 * Log environment status
 */
export function logEnvironmentStatus(): void {
  const { valid, statuses, missingRequired } = validateEnvironment();

  logger.info({
    type: 'environment_validation',
    valid,
    missingRequired: missingRequired.length,
  });

  for (const status of statuses) {
    if (status.required && !status.loaded) {
      logger.error({
        type: 'env_missing_required',
        name: status.name,
        description: ENV_VARIABLES.find((e) => e.name === status.name)?.description,
      });
    } else if (status.loaded) {
      logger.info({
        type: 'env_loaded',
        name: status.name,
        required: status.required,
        masked: status.masked,
      });
    }
  }

  if (!valid) {
    logger.error({
      type: 'environment_invalid',
      message: `Missing required environment variables: ${missingRequired.join(', ')}`,
      missingRequired,
    });
  }
}

/**
 * Check if a specific service is available
 */
export function isServiceAvailable(serviceName: string): boolean {
  const serviceMap: Record<string, string> = {
    sportradar: 'SPORTSRADAR_API_KEY',
    rapidapi: 'RAPIDAPI_KEY',
    odds: 'ODDS_API_KEY',
    weather: 'WEATHER_API_KEY',
    openai: 'AI_INTEGRATIONS_OPENAI_API_KEY',
    gemini: 'AI_INTEGRATIONS_GEMINI_API_KEY',
  };

  const envKey = serviceMap[serviceName.toLowerCase()];
  if (!envKey) return false;

  if (process.env[envKey]) return true;

  const aliases: Record<string, string[]> = {
    rapidapi: ['RAPIDAPI_API_KEY'],
    openai: ['OPENAI_API_KEY'],
    gemini: ['GEMINI_API_KEY'],
  };

  return (aliases[serviceName.toLowerCase()] || []).some((alias) => !!process.env[alias]);
}

export function getRapidApiKey(): string | undefined {
  return process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_API_KEY;
}

export function getOpenAiApiKey(): string | undefined {
  return process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
}

export function getGeminiApiKey(): string | undefined {
  return process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
}
