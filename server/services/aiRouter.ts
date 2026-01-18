import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { circuitBreakerManager, CircuitBreaker, CircuitState } from "../infrastructure/circuit-breaker";
import { rateLimiterManager, TokenBucketRateLimiter } from "../infrastructure/rate-limiter";
import { cache, CacheTTL } from "../infrastructure/cache";
import { logger } from "../infrastructure/logger";
import { getGeminiApiKey, getOpenAiApiKey } from "../infrastructure/env";

export type TaskType = "quick" | "analysis" | "complex" | "creative";

export type ProviderName = "openai" | "gemini" | "anthropic" | "openrouter";

interface ProviderConfig {
  name: ProviderName;
  model: string;
  circuitBreaker: CircuitBreaker;
  rateLimiter: TokenBucketRateLimiter;
  isHealthy: () => boolean;
  complete: (prompt: string, taskType: TaskType) => Promise<string>;
}

const ROUTING_MATRIX: Record<TaskType, ProviderName[]> = {
  quick: ["gemini", "openai", "openrouter", "anthropic"],
  analysis: ["openai", "anthropic", "gemini", "openrouter"],
  complex: ["anthropic", "openai", "gemini", "openrouter"],
  creative: ["openrouter", "anthropic", "openai", "gemini"],
};

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envModel(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

const MODELS: Record<ProviderName, string> = {
  gemini: envModel("AI_MODEL_GEMINI", "gemini-2.5-flash"),
  openai: envModel("AI_MODEL_OPENAI", "gpt-4.1"),
  anthropic: envModel("AI_MODEL_ANTHROPIC", "claude-sonnet-4-20250514"),
  openrouter: envModel("AI_MODEL_OPENROUTER", "meta-llama/llama-3.3-70b-instruct"),
};

const MAX_TOKENS_BY_TASK: Record<TaskType, number> = {
  quick: parseNumber(process.env.AI_MAX_TOKENS_QUICK, 1024),
  analysis: parseNumber(process.env.AI_MAX_TOKENS_ANALYSIS, 4096),
  complex: parseNumber(process.env.AI_MAX_TOKENS_COMPLEX, 8192),
  creative: parseNumber(process.env.AI_MAX_TOKENS_CREATIVE, 4096),
};

const TEMPERATURE_BY_TASK: Record<TaskType, number> = {
  quick: parseNumber(process.env.AI_TEMPERATURE_QUICK, 0.2),
  analysis: parseNumber(process.env.AI_TEMPERATURE_ANALYSIS, 0.3),
  complex: parseNumber(process.env.AI_TEMPERATURE_COMPLEX, 0.5),
  creative: parseNumber(process.env.AI_TEMPERATURE_CREATIVE, 0.8),
};

const openaiClient = new OpenAI({
  apiKey: getOpenAiApiKey(),
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const geminiClient = new GoogleGenAI({
  apiKey: getGeminiApiKey(),
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const anthropicClient = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const openrouterClient = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
});

const circuitBreakers = {
  openai: circuitBreakerManager.create("aiRouter_openai", {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 30000,
  }),
  gemini: circuitBreakerManager.create("aiRouter_gemini", {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 30000,
  }),
  anthropic: circuitBreakerManager.create("aiRouter_anthropic", {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 30000,
  }),
  openrouter: circuitBreakerManager.create("aiRouter_openrouter", {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 30000,
  }),
};

function rateLimit(provider: ProviderName, rpm: number, burst: number) {
  const rpmValue = parseNumber(process.env[`AI_RPM_${provider.toUpperCase()}`], rpm);
  const burstValue = parseNumber(process.env[`AI_BURST_${provider.toUpperCase()}`], burst);
  return rateLimiterManager.create(`aiRouter_${provider}`, {
    requestsPerMinute: rpmValue,
    burstAllowance: burstValue,
  });
}

const rateLimiters = {
  openai: rateLimit("openai", 40, 10),
  gemini: rateLimit("gemini", 60, 15),
  anthropic: rateLimit("anthropic", 30, 8),
  openrouter: rateLimit("openrouter", 40, 10),
};

async function completeWithOpenAI(prompt: string, taskType: TaskType): Promise<string> {
  const response = await openaiClient.chat.completions.create({
    model: MODELS.openai,
    messages: [{ role: "user", content: prompt }],
    max_tokens: MAX_TOKENS_BY_TASK[taskType],
    temperature: TEMPERATURE_BY_TASK[taskType],
  });
  return response.choices[0]?.message?.content || "";
}

async function completeWithGemini(prompt: string, taskType: TaskType): Promise<string> {
  const response = await geminiClient.models.generateContent({
    model: MODELS.gemini,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: MAX_TOKENS_BY_TASK[taskType],
      temperature: TEMPERATURE_BY_TASK[taskType],
    },
  });
  return response.text || "";
}

async function completeWithAnthropic(prompt: string, taskType: TaskType): Promise<string> {
  const response = await anthropicClient.chat.completions.create({
    model: MODELS.anthropic,
    messages: [{ role: "user", content: prompt }],
    max_tokens: MAX_TOKENS_BY_TASK[taskType],
    temperature: TEMPERATURE_BY_TASK[taskType],
  });
  return response.choices[0]?.message?.content || "";
}

async function completeWithOpenRouter(prompt: string, taskType: TaskType): Promise<string> {
  const response = await openrouterClient.chat.completions.create({
    model: MODELS.openrouter,
    messages: [{ role: "user", content: prompt }],
    max_tokens: MAX_TOKENS_BY_TASK[taskType],
    temperature: TEMPERATURE_BY_TASK[taskType],
  });
  return response.choices[0]?.message?.content || "";
}

function isProviderHealthy(provider: ProviderName): boolean {
  const cb = circuitBreakers[provider];
  return cb.getState() !== CircuitState.OPEN;
}

const providers: Record<ProviderName, ProviderConfig> = {
  openai: {
    name: "openai",
    model: MODELS.openai,
    circuitBreaker: circuitBreakers.openai,
    rateLimiter: rateLimiters.openai,
    isHealthy: () => isProviderHealthy("openai"),
    complete: completeWithOpenAI,
  },
  gemini: {
    name: "gemini",
    model: MODELS.gemini,
    circuitBreaker: circuitBreakers.gemini,
    rateLimiter: rateLimiters.gemini,
    isHealthy: () => isProviderHealthy("gemini"),
    complete: completeWithGemini,
  },
  anthropic: {
    name: "anthropic",
    model: MODELS.anthropic,
    circuitBreaker: circuitBreakers.anthropic,
    rateLimiter: rateLimiters.anthropic,
    isHealthy: () => isProviderHealthy("anthropic"),
    complete: completeWithAnthropic,
  },
  openrouter: {
    name: "openrouter",
    model: MODELS.openrouter,
    circuitBreaker: circuitBreakers.openrouter,
    rateLimiter: rateLimiters.openrouter,
    isHealthy: () => isProviderHealthy("openrouter"),
    complete: completeWithOpenRouter,
  },
};

function generateCacheKey(prompt: string, taskType: TaskType): string {
  const promptHash = prompt
    .split("")
    .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
    .toString(16);
  return `aiRouter:${taskType}:${promptHash}`;
}

async function executeWithProvider(
  provider: ProviderConfig,
  prompt: string,
  taskType: TaskType
): Promise<string> {
  const canProceed = await provider.rateLimiter.acquire();
  if (!canProceed) {
    throw new Error(`Rate limit exceeded for ${provider.name}`);
  }

  return provider.circuitBreaker.execute(() => provider.complete(prompt, taskType));
}

export async function complete(
  prompt: string,
  taskType: TaskType
): Promise<string> {
  const cacheKey = generateCacheKey(prompt, taskType);
  
  const cached = await cache.get<string>(cacheKey);
  if (cached !== null) {
    logger.info({ type: "ai_router_cache_hit", taskType, key: cacheKey });
    return cached;
  }

  const providerOrder = ROUTING_MATRIX[taskType];
  const errors: Array<{ provider: ProviderName; error: string }> = [];

  for (const providerName of providerOrder) {
    const provider = providers[providerName];

    if (!provider.isHealthy()) {
      logger.warn({ 
        type: "ai_router_provider_unhealthy", 
        provider: providerName, 
        taskType 
      });
      errors.push({ provider: providerName, error: "Circuit breaker open" });
      continue;
    }

    // Check if rate limiter would block - try next provider first
    if (provider.rateLimiter.getAvailableTokens() <= 0) {
      logger.warn({
        type: "ai_router_provider_rate_limited",
        provider: providerName,
        taskType,
      });
      errors.push({ provider: providerName, error: "Rate limit reached" });
      continue;
    }

    try {
      logger.info({ 
        type: "ai_router_attempt", 
        provider: providerName, 
        model: provider.model,
        taskType 
      });

      const result = await executeWithProvider(provider, prompt, taskType);

      await cache.set(cacheKey, result, CacheTTL.MEDIUM);
      
      logger.info({ 
        type: "ai_router_success", 
        provider: providerName, 
        taskType,
        resultLength: result.length 
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({ provider: providerName, error: errorMessage });
      
      logger.error({ 
        type: "ai_router_provider_error", 
        provider: providerName, 
        taskType,
        error: errorMessage 
      });
    }
  }

  const errorSummary = errors
    .map((e) => `${e.provider}: ${e.error}`)
    .join("; ");
  throw new Error(`All providers failed for task type '${taskType}'. Errors: ${errorSummary}`);
}

export async function healthCheck(): Promise<Record<ProviderName, {
  healthy: boolean;
  circuitState: CircuitState;
  availableTokens: number;
}>> {
  const results: Record<ProviderName, {
    healthy: boolean;
    circuitState: CircuitState;
    availableTokens: number;
  }> = {} as Record<ProviderName, {
    healthy: boolean;
    circuitState: CircuitState;
    availableTokens: number;
  }>;

  const providerEntries = Object.entries(providers) as Array<[ProviderName, ProviderConfig]>;
  for (const [name, provider] of providerEntries) {
    results[name] = {
      healthy: provider.isHealthy(),
      circuitState: provider.circuitBreaker.getState(),
      availableTokens: provider.rateLimiter.getAvailableTokens(),
    };
  }

  return results;
}

export async function pingProvider(providerName: ProviderName): Promise<{
  success: boolean;
  latencyMs: number;
  error?: string;
}> {
  const provider = providers[providerName];
  const startTime = Date.now();
  
  try {
    await provider.complete("Say 'OK' in one word.", "quick");
    return {
      success: true,
      latencyMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function getProviderStats(): Record<ProviderName, {
  circuitBreaker: ReturnType<CircuitBreaker["getStats"]>;
  rateLimiter: { available: number; waitTime: number };
}> {
  const stats: Record<ProviderName, {
    circuitBreaker: ReturnType<CircuitBreaker["getStats"]>;
    rateLimiter: { available: number; waitTime: number };
  }> = {} as Record<ProviderName, {
    circuitBreaker: ReturnType<CircuitBreaker["getStats"]>;
    rateLimiter: { available: number; waitTime: number };
  }>;

  const providerEntries = Object.entries(providers) as Array<[ProviderName, ProviderConfig]>;
  for (const [name, provider] of providerEntries) {
    stats[name] = {
      circuitBreaker: provider.circuitBreaker.getStats(),
      rateLimiter: {
        available: provider.rateLimiter.getAvailableTokens(),
        waitTime: provider.rateLimiter.getWaitTime(),
      },
    };
  }

  return stats;
}

export function getRoutingMatrix(): Record<TaskType, ProviderName[]> {
  return { ...ROUTING_MATRIX };
}

export function getAvailableProviders(): ProviderName[] {
  return Object.entries(providers)
    .filter(([_, provider]) => provider.isHealthy())
    .map(([name]) => name as ProviderName);
}

export const aiRouter = {
  complete,
  healthCheck,
  pingProvider,
  getProviderStats,
  getRoutingMatrix,
  getAvailableProviders,
};

export default aiRouter;
