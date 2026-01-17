/**
 * ENVIRONMENT VARIABLE VALIDATION
 * Ensures all required and optional API keys are properly configured
 * Provides fallback mechanisms for missing optional keys
 */

import { logger } from './logger';

interface EnvConfig {
  name: string;
  required: boolean;
  description: string;
  fallback?: string;
}

const ENV_VARIABLES: EnvConfig[] = [
  // Database (Required)
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string',
  },
  
  // Core APIs (Required)
  {
    name: 'BALLDONTLIE_API_KEY',
    required: true,
    description: 'BallDontLie API key for NFL data',
  },
  
  // Optional APIs
  {
    name: 'SPORTRADAR_API_KEY',
    required: false,
    description: 'SportRadar API key for additional NFL data',
  },
  {
    name: 'RAPIDAPI_KEY',
    required: false,
    description: 'RapidAPI key for NFL data services',
  },
  {
    name: 'ODDS_API_KEY',
    required: false,
    description: 'The Odds API key for betting odds',
  },
  {
    name: 'WEATHER_API_KEY',
    required: false,
    description: 'OpenWeatherMap API key for weather data',
  },
  
  // AI Services (Optional)
  {
    name: 'AI_INTEGRATIONS_OPENAI_API_KEY',
    required: false,
    description: 'OpenAI API key for AI analysis',
  },
  {
    name: 'AI_INTEGRATIONS_GEMINI_API_KEY',
    required: false,
    description: 'Google Gemini API key for AI analysis',
  },
  {
    name: 'OPENROUTER_API_KEY',
    required: false,
    description: 'OpenRouter API key for AI models',
  },
  {
    name: 'GROK_API_KEY',
    required: false,
    description: 'Grok API key for AI analysis',
  },
  
  // Other Services
  {
    name: 'EXA_API_KEY',
    required: false,
    description: 'Exa API key for search',
  },
  {
    name: 'SPORTSDB_KEY',
    required: false,
    description: 'TheSportsDB API key',
  },
  
  // Vercel Integrations
  {
    name: 'STATSIG_SERVER_API_KEY',
    required: false,
    description: 'Statsig server API key for A/B testing',
  },
  {
    name: 'RESEND_API_KEY',
    required: false,
    description: 'Resend API key for email alerts',
  },
  {
    name: 'RESEND_FROM_EMAIL',
    required: false,
    description: 'Resend from email address',
  },
  {
    name: 'AXIOM_TOKEN',
    required: false,
    description: 'Axiom API token for logging',
  },
  {
    name: 'AXIOM_DATASET',
    required: false,
    description: 'Axiom dataset name',
  },
  {
    name: 'AXIOM_ORG_ID',
    required: false,
    description: 'Axiom organization ID',
  },
  {
    name: 'UPSTASH_QSTASH_URL',
    required: false,
    description: 'Upstash QStash URL',
  },
  {
    name: 'UPSTASH_QSTASH_TOKEN',
    required: false,
    description: 'Upstash QStash token',
  },
  {
    name: 'CLERK_SECRET_KEY',
    required: false,
    description: 'Clerk secret key for authentication',
  },
  {
    name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    required: false,
    description: 'Clerk publishable key (public)',
  },
  {
    name: 'CLERK_WEBHOOK_SECRET',
    required: false,
    description: 'Clerk webhook secret',
  },
  {
    name: 'NEON_DATABASE_URL',
    required: false,
    description: 'Neon PostgreSQL connection string',
  },
  
  // Core Infrastructure (Edgeloop)
  {
    name: 'UPSTASH_REDIS_REST_URL',
    required: false,
    description: 'Upstash Redis REST URL for rate limiting and caching',
  },
  {
    name: 'UPSTASH_REDIS_REST_TOKEN',
    required: false,
    description: 'Upstash Redis REST token',
  },
  {
    name: 'CLICKHOUSE_HOST',
    required: false,
    description: 'ClickHouse server host',
  },
  {
    name: 'CLICKHOUSE_USER',
    required: false,
    description: 'ClickHouse username',
  },
  {
    name: 'CLICKHOUSE_PASSWORD',
    required: false,
    description: 'ClickHouse password',
  },
  {
    name: 'CLICKHOUSE_DATABASE',
    required: false,
    description: 'ClickHouse database name',
  },
  {
    name: 'CLICKHOUSE_PORT',
    required: false,
    description: 'ClickHouse HTTP port (default: 8123)',
  },
  {
    name: 'CLICKHOUSE_COMPRESSION',
    required: false,
    description: 'Enable HTTP compression for ClickHouse (default: true)',
  },
  {
    name: 'TRIGGER_API_KEY',
    required: false,
    description: 'Trigger.dev API key for background jobs',
  },
  {
    name: 'TRIGGER_PROJECT_ID',
    required: false,
    description: 'Trigger.dev project ID',
  },
  {
    name: 'RUST_ENGINE_URL',
    required: false,
    description: 'Rust backend URL for Apache Arrow IPC communication',
  },
  {
    name: 'RUST_ENGINE_TIMEOUT',
    required: false,
    description: 'Rust engine request timeout in milliseconds (default: 30000)',
  },
];

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
    const value = process.env[config.name];
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
    sportradar: 'SPORTRADAR_API_KEY',
    rapidapi: 'RAPIDAPI_KEY',
    odds: 'ODDS_API_KEY',
    weather: 'WEATHER_API_KEY',
    openai: 'AI_INTEGRATIONS_OPENAI_API_KEY',
    gemini: 'AI_INTEGRATIONS_GEMINI_API_KEY',
  };

  const envKey = serviceMap[serviceName.toLowerCase()];
  if (!envKey) return false;

  return !!process.env[envKey];
}
