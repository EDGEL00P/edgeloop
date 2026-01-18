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
    name: 'SPORTSRADAR_API_KEY',
    required: false,
    description: 'SportRadar API key for additional NFL data (Vercel format - also accepts SPORTRADAR_API_KEY)',
  },
  {
    name: 'SPORTRADAR_API_KEY',
    required: false,
    description: 'SportRadar API key (legacy name - use SPORTSRADAR_API_KEY)',
  },
  {
    name: 'RAPIDAPI_KEY',
    required: false,
    description: 'RapidAPI key for NFL data services',
  },
  {
    name: 'ODDS_API_KEY',
    required: true,
    description: 'The Odds API key for betting odds',
  },
  {
    name: 'WEATHER_API_KEY',
    required: true,
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
    description: 'OpenRouter API key for AI models (also accepts AI_INTEGRATIONS_OPENROUTER_API_KEY)',
  },
  {
    name: 'AI_INTEGRATIONS_OPENROUTER_API_KEY',
    required: false,
    description: 'OpenRouter API key for AI models (preferred)',
  },
  {
    name: 'AI_INTEGRATIONS_ANTHROPIC_API_KEY',
    required: false,
    description: 'Anthropic Claude API key for AI analysis',
  },
  // AI Model Overrides (Optional)
  {
    name: 'AI_MODEL_OPENAI',
    required: false,
    description: 'Override OpenAI model used by AI router',
  },
  {
    name: 'AI_MODEL_GEMINI',
    required: false,
    description: 'Override Gemini model used by AI router',
  },
  {
    name: 'AI_MODEL_ANTHROPIC',
    required: false,
    description: 'Override Anthropic model used by AI router',
  },
  {
    name: 'AI_MODEL_OPENROUTER',
    required: false,
    description: 'Override OpenRouter model used by AI router',
  },
  {
    name: 'AI_CHAT_MODEL_GEMINI',
    required: false,
    description: 'Override Gemini model used for chat streaming',
  },
  {
    name: 'AI_CHAT_MODEL_OPENAI',
    required: false,
    description: 'Override OpenAI model used for chat streaming',
  },
  // AI Limits (Optional)
  {
    name: 'AI_MAX_TOKENS_QUICK',
    required: false,
    description: 'Max tokens for quick AI tasks (default 1024)',
  },
  {
    name: 'AI_MAX_TOKENS_ANALYSIS',
    required: false,
    description: 'Max tokens for analysis tasks (default 4096)',
  },
  {
    name: 'AI_MAX_TOKENS_COMPLEX',
    required: false,
    description: 'Max tokens for complex tasks (default 8192)',
  },
  {
    name: 'AI_MAX_TOKENS_CREATIVE',
    required: false,
    description: 'Max tokens for creative tasks (default 4096)',
  },
  {
    name: 'AI_TEMPERATURE_QUICK',
    required: false,
    description: 'Temperature for quick tasks (default 0.2)',
  },
  {
    name: 'AI_TEMPERATURE_ANALYSIS',
    required: false,
    description: 'Temperature for analysis tasks (default 0.3)',
  },
  {
    name: 'AI_TEMPERATURE_COMPLEX',
    required: false,
    description: 'Temperature for complex tasks (default 0.5)',
  },
  {
    name: 'AI_TEMPERATURE_CREATIVE',
    required: false,
    description: 'Temperature for creative tasks (default 0.8)',
  },
  {
    name: 'AI_RPM_OPENAI',
    required: false,
    description: 'Override OpenAI requests per minute (default 40)',
  },
  {
    name: 'AI_RPM_GEMINI',
    required: false,
    description: 'Override Gemini requests per minute (default 60)',
  },
  {
    name: 'AI_RPM_ANTHROPIC',
    required: false,
    description: 'Override Anthropic requests per minute (default 30)',
  },
  {
    name: 'AI_RPM_OPENROUTER',
    required: false,
    description: 'Override OpenRouter requests per minute (default 40)',
  },
  {
    name: 'AI_BURST_OPENAI',
    required: false,
    description: 'Override OpenAI burst allowance (default 10)',
  },
  {
    name: 'AI_BURST_GEMINI',
    required: false,
    description: 'Override Gemini burst allowance (default 15)',
  },
  {
    name: 'AI_BURST_ANTHROPIC',
    required: false,
    description: 'Override Anthropic burst allowance (default 8)',
  },
  {
    name: 'AI_BURST_OPENROUTER',
    required: false,
    description: 'Override OpenRouter burst allowance (default 10)',
  },
  {
    name: 'GROK_API_KEY',
    required: false,
    description: 'Grok API key for AI analysis (not yet implemented)',
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
  
  // Auth & Security
  {
    name: 'SESSION_SECRET',
    required: process.env.NODE_ENV === 'production',
    description: 'Secret key for session encryption (required in production)',
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
    sportradar: 'SPORTSRADAR_API_KEY',
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
