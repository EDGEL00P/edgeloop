export type EnvScope = "server" | "web" | "trigger" | "ops" | "infra" | "build";

export type EnvVar = {
  name: string;
  description: string;
  scopes: EnvScope[];
  required?: boolean;
  requiredInProduction?: boolean;
  public?: boolean;
  aliases?: string[];
  managed?: boolean;
  deprecated?: boolean;
};

export const envRegistry: EnvVar[] = [
  // Core application
  {
    name: "NODE_ENV",
    description: "Runtime environment mode",
    scopes: ["server", "web", "trigger", "build"],
    managed: true,
  },
  {
    name: "NEXT_PHASE",
    description: "Next.js build/runtime phase",
    scopes: ["build"],
    managed: true,
  },

  // Database
  {
    name: "DATABASE_URL",
    description: "Primary PostgreSQL connection string",
    scopes: ["server", "infra"],
    required: true,
  },
  {
    name: "POSTGRES_URL",
    description: "Alternate Postgres connection string",
    scopes: ["server", "infra"],
  },
  {
    name: "POSTGRES_PRISMA_URL",
    description: "Prisma-compatible Postgres URL",
    scopes: ["server", "infra"],
  },
  {
    name: "POSTGRES_URL_NON_POOLING",
    description: "Non-pooled Postgres URL",
    scopes: ["server", "infra"],
  },
  {
    name: "POSTGRES_CONNECTION_STRING",
    description: "Alternate Postgres connection string",
    scopes: ["server", "infra"],
  },
  {
    name: "PG_CONNECTION_STRING",
    description: "Alternate Postgres connection string",
    scopes: ["server", "infra"],
  },
  {
    name: "RAILWAY_DATABASE_URL",
    description: "Railway-managed database URL",
    scopes: ["server", "infra"],
    managed: true,
  },
  {
    name: "RENDER_DATABASE_URL",
    description: "Render-managed database URL",
    scopes: ["server", "infra"],
    managed: true,
  },
  {
    name: "HEROKU_POSTGRESQL_URL",
    description: "Heroku-managed database URL",
    scopes: ["server", "infra"],
    managed: true,
  },
  {
    name: "FLY_POSTGRES_URL",
    description: "Fly.io managed database URL",
    scopes: ["server", "infra"],
    managed: true,
  },
  {
    name: "SUPABASE_DB_URL",
    description: "Supabase database URL",
    scopes: ["server", "infra"],
  },
  {
    name: "NEON_DATABASE_URL",
    description: "Neon database URL",
    scopes: ["server", "infra"],
  },

  // Server runtime + networking
  {
    name: "SESSION_SECRET",
    description: "Session encryption secret",
    scopes: ["server"],
    requiredInProduction: true,
  },
  {
    name: "LOG_LEVEL",
    description: "Logger verbosity level (debug|info|warn|error)",
    scopes: ["server"],
  },
  {
    name: "METRICS_MODE",
    description: "Metrics backend mode (memory|redis|disabled)",
    scopes: ["server"],
  },
  {
    name: "CORS_ALLOWED_ORIGINS",
    description: "Comma-separated CORS allowlist",
    scopes: ["server"],
  },
  {
    name: "PORT",
    description: "Server port override",
    scopes: ["server", "infra"],
    managed: true,
  },
  {
    name: "VERCEL_PORT",
    description: "Vercel serverless port",
    scopes: ["server", "infra"],
    managed: true,
  },
  {
    name: "RAILWAY_PORT",
    description: "Railway runtime port",
    scopes: ["server", "infra"],
    managed: true,
  },
  {
    name: "HOSTNAME",
    description: "Server host override",
    scopes: ["server", "infra"],
    managed: true,
  },
  {
    name: "HOST",
    description: "Server host override",
    scopes: ["server", "infra"],
    managed: true,
  },

  // Platform detection
  {
    name: "VERCEL",
    description: "Vercel runtime indicator",
    scopes: ["server", "build"],
    managed: true,
  },
  {
    name: "VERCEL_ENV",
    description: "Vercel environment name",
    scopes: ["server", "build"],
    managed: true,
  },
  {
    name: "VERCEL_URL",
    description: "Vercel deployment URL",
    scopes: ["server", "build"],
    managed: true,
  },
  {
    name: "VERCEL_PROJECT_PRODUCTION_URL",
    description: "Vercel production URL",
    scopes: ["server", "build"],
    managed: true,
  },
  {
    name: "VERCEL_DEPLOYMENT_ID",
    description: "Vercel deployment ID",
    scopes: ["server", "build"],
    managed: true,
  },
  {
    name: "RAILWAY_ENVIRONMENT",
    description: "Railway environment indicator",
    scopes: ["server", "build"],
    managed: true,
  },
  {
    name: "RAILWAY_PUBLIC_DOMAIN",
    description: "Railway public domain",
    scopes: ["server", "build"],
    managed: true,
  },
  {
    name: "RENDER",
    description: "Render environment indicator",
    scopes: ["server"],
    managed: true,
  },
  {
    name: "FLY_APP_NAME",
    description: "Fly.io application name",
    scopes: ["server"],
    managed: true,
  },
  {
    name: "HEROKU_APP_NAME",
    description: "Heroku application name",
    scopes: ["server"],
    managed: true,
  },
  {
    name: "DOCKER",
    description: "Docker runtime indicator",
    scopes: ["server"],
    managed: true,
  },
  {
    name: "ENV_VALIDATE_SCOPES",
    description: "Comma-separated env scopes to validate in scripts",
    scopes: ["infra", "build"],
  },

  // Web (Next.js public)
  {
    name: "NEXT_PUBLIC_APP_URL",
    description: "Public app URL for UI fetches",
    scopes: ["web"],
    public: true,
  },
  {
    name: "NEXT_PUBLIC_API_URL",
    description: "Public API base URL for UI",
    scopes: ["web"],
    public: true,
  },
  {
    name: "NEXT_PUBLIC_VERCEL_URL",
    description: "Vercel deployment URL override for the web app",
    scopes: ["web"],
    public: true,
    managed: true,
  },
  {
    name: "NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID",
    description: "Vercel deployment ID exposed to the web app",
    scopes: ["web"],
    public: true,
    managed: true,
  },
  {
    name: "NEXT_PUBLIC_NFL_SEASON",
    description: "Override NFL season in UI",
    scopes: ["web"],
    public: true,
  },
  {
    name: "NEXT_PUBLIC_NFL_WEEK",
    description: "Override NFL week in UI",
    scopes: ["web"],
    public: true,
  },
  {
    name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    description: "Clerk publishable key",
    scopes: ["web"],
    public: true,
  },
  {
    name: "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
    description: "Clerk sign-in page URL",
    scopes: ["web"],
    public: true,
  },
  {
    name: "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
    description: "Clerk sign-up page URL",
    scopes: ["web"],
    public: true,
  },
  {
    name: "NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL",
    description: "Clerk sign-in fallback redirect URL",
    scopes: ["web"],
    public: true,
  },
  {
    name: "NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL",
    description: "Clerk sign-up fallback redirect URL",
    scopes: ["web"],
    public: true,
  },

  // Data providers
  {
    name: "BALLDONTLIE_API_KEY",
    description: "BallDontLie API key for NFL data",
    scopes: ["server"],
    required: true,
  },
  {
    name: "SPORTSRADAR_API_KEY",
    description: "SportRadar API key (preferred)",
    scopes: ["server"],
  },
  {
    name: "SPORTRADAR_API_KEY",
    description: "SportRadar API key (legacy alias)",
    scopes: ["server"],
    aliases: ["SPORTSRADAR_API_KEY"],
    deprecated: true,
  },
  {
    name: "SPORTRADAR_BASE_URL",
    description: "Sportradar base URL override",
    scopes: ["server"],
  },
  {
    name: "SPORTRADAR_LANG",
    description: "Sportradar language override",
    scopes: ["server"],
  },
  {
    name: "RAPIDAPI_KEY",
    description: "RapidAPI key",
    scopes: ["server"],
    aliases: ["RAPIDAPI_API_KEY"],
  },
  {
    name: "RAPIDAPI_BASE_URL",
    description: "RapidAPI base URL override",
    scopes: ["server"],
  },
  {
    name: "RAPIDAPI_HOST",
    description: "RapidAPI host override",
    scopes: ["server"],
  },
  {
    name: "SPORTSDB_KEY",
    description: "TheSportsDB API key",
    scopes: ["server"],
  },
  {
    name: "ODDS_API_KEY",
    description: "The Odds API key",
    scopes: ["server"],
    required: true,
  },
  {
    name: "WEATHER_API_KEY",
    description: "OpenWeatherMap API key",
    scopes: ["server"],
    required: true,
  },
  {
    name: "NEWS_RSS_FEEDS",
    description: "Additional NFL news RSS feeds (JSON array or Source|URL list)",
    scopes: ["server"],
  },

  // AI providers
  {
    name: "AI_INTEGRATIONS_OPENAI_API_KEY",
    description: "OpenAI API key",
    scopes: ["server"],
    aliases: ["OPENAI_API_KEY"],
  },
  {
    name: "AI_INTEGRATIONS_OPENAI_BASE_URL",
    description: "OpenAI base URL override",
    scopes: ["server"],
  },
  {
    name: "AI_INTEGRATIONS_GEMINI_API_KEY",
    description: "Gemini API key",
    scopes: ["server"],
    aliases: ["GEMINI_API_KEY"],
  },
  {
    name: "AI_INTEGRATIONS_GEMINI_BASE_URL",
    description: "Gemini base URL override",
    scopes: ["server"],
  },
  {
    name: "AI_INTEGRATIONS_ANTHROPIC_API_KEY",
    description: "Anthropic API key",
    scopes: ["server"],
  },
  {
    name: "AI_INTEGRATIONS_ANTHROPIC_BASE_URL",
    description: "Anthropic base URL override",
    scopes: ["server"],
  },
  {
    name: "AI_INTEGRATIONS_OPENROUTER_API_KEY",
    description: "OpenRouter API key",
    scopes: ["server"],
  },
  {
    name: "AI_INTEGRATIONS_OPENROUTER_BASE_URL",
    description: "OpenRouter base URL override",
    scopes: ["server"],
  },
  {
    name: "OPENROUTER_API_KEY",
    description: "OpenRouter API key (legacy)",
    scopes: ["server"],
    aliases: ["AI_INTEGRATIONS_OPENROUTER_API_KEY"],
  },
  {
    name: "AI_MODEL_OPENAI",
    description: "OpenAI model override",
    scopes: ["server"],
  },
  {
    name: "AI_MODEL_GEMINI",
    description: "Gemini model override",
    scopes: ["server"],
  },
  {
    name: "AI_MODEL_ANTHROPIC",
    description: "Anthropic model override",
    scopes: ["server"],
  },
  {
    name: "AI_MODEL_OPENROUTER",
    description: "OpenRouter model override",
    scopes: ["server"],
  },
  {
    name: "AI_CHAT_MODEL_GEMINI",
    description: "Gemini chat model override",
    scopes: ["server"],
  },
  {
    name: "AI_CHAT_MODEL_OPENAI",
    description: "OpenAI chat model override",
    scopes: ["server"],
  },
  {
    name: "AI_MAX_TOKENS_QUICK",
    description: "Max tokens for quick tasks",
    scopes: ["server"],
  },
  {
    name: "AI_MAX_TOKENS_ANALYSIS",
    description: "Max tokens for analysis tasks",
    scopes: ["server"],
  },
  {
    name: "AI_MAX_TOKENS_COMPLEX",
    description: "Max tokens for complex tasks",
    scopes: ["server"],
  },
  {
    name: "AI_MAX_TOKENS_CREATIVE",
    description: "Max tokens for creative tasks",
    scopes: ["server"],
  },
  {
    name: "AI_TEMPERATURE_QUICK",
    description: "Temperature for quick tasks",
    scopes: ["server"],
  },
  {
    name: "AI_TEMPERATURE_ANALYSIS",
    description: "Temperature for analysis tasks",
    scopes: ["server"],
  },
  {
    name: "AI_TEMPERATURE_COMPLEX",
    description: "Temperature for complex tasks",
    scopes: ["server"],
  },
  {
    name: "AI_TEMPERATURE_CREATIVE",
    description: "Temperature for creative tasks",
    scopes: ["server"],
  },
  {
    name: "AI_RPM_OPENAI",
    description: "OpenAI RPM override",
    scopes: ["server"],
  },
  {
    name: "AI_RPM_GEMINI",
    description: "Gemini RPM override",
    scopes: ["server"],
  },
  {
    name: "AI_RPM_ANTHROPIC",
    description: "Anthropic RPM override",
    scopes: ["server"],
  },
  {
    name: "AI_RPM_OPENROUTER",
    description: "OpenRouter RPM override",
    scopes: ["server"],
  },
  {
    name: "AI_BURST_OPENAI",
    description: "OpenAI burst override",
    scopes: ["server"],
  },
  {
    name: "AI_BURST_GEMINI",
    description: "Gemini burst override",
    scopes: ["server"],
  },
  {
    name: "AI_BURST_ANTHROPIC",
    description: "Anthropic burst override",
    scopes: ["server"],
  },
  {
    name: "AI_BURST_OPENROUTER",
    description: "OpenRouter burst override",
    scopes: ["server"],
  },
  {
    name: "GROK_API_KEY",
    description: "Grok API key (future use)",
    scopes: ["server"],
  },
  {
    name: "EXA_API_KEY",
    description: "Exa search API key",
    scopes: ["server"],
  },

  // Auth + integrations
  {
    name: "CLERK_SECRET_KEY",
    description: "Clerk secret key",
    scopes: ["server"],
  },
  {
    name: "CLERK_WEBHOOK_SECRET",
    description: "Clerk webhook secret",
    scopes: ["server"],
  },
  {
    name: "RESEND_API_KEY",
    description: "Resend API key",
    scopes: ["server"],
  },
  {
    name: "RESEND_FROM_EMAIL",
    description: "Resend from email",
    scopes: ["server"],
  },
  {
    name: "STATSIG_SERVER_API_KEY",
    description: "Statsig server API key",
    scopes: ["server"],
  },

  // Cache and queues
  {
    name: "REDIS_URL",
    description: "Redis connection URL",
    scopes: ["server", "infra"],
  },
  {
    name: "UPSTASH_REDIS_REST_URL",
    description: "Upstash Redis REST URL",
    scopes: ["server", "infra"],
  },
  {
    name: "UPSTASH_REDIS_REST_TOKEN",
    description: "Upstash Redis REST token",
    scopes: ["server", "infra"],
  },
  {
    name: "UPSTASH_QSTASH_URL",
    description: "Upstash QStash URL",
    scopes: ["server", "infra"],
  },
  {
    name: "UPSTASH_QSTASH_TOKEN",
    description: "Upstash QStash token",
    scopes: ["server", "infra"],
  },

  // Observability
  {
    name: "AXIOM_TOKEN",
    description: "Axiom API token",
    scopes: ["server", "infra"],
  },
  {
    name: "AXIOM_DATASET",
    description: "Axiom dataset name",
    scopes: ["server", "infra"],
  },
  {
    name: "AXIOM_ORG_ID",
    description: "Axiom organization ID",
    scopes: ["server", "infra"],
  },

  // Trigger.dev
  {
    name: "TRIGGER_API_KEY",
    description: "Trigger.dev API key",
    scopes: ["trigger", "infra"],
  },
  {
    name: "TRIGGER_PROJECT_ID",
    description: "Trigger.dev project ID",
    scopes: ["trigger", "infra"],
  },

  // Rust engine
  {
    name: "RUST_ENGINE_URL",
    description: "Rust engine base URL",
    scopes: ["server", "trigger"],
  },
  {
    name: "RUST_ENGINE_TIMEOUT",
    description: "Rust engine timeout in ms",
    scopes: ["server", "trigger"],
  },

  // Vercel ops
  {
    name: "VERCEL_TOKEN",
    description: "Vercel API token",
    scopes: ["ops"],
    required: true,
  },
  {
    name: "VERCEL_TEAM_ID",
    description: "Vercel team ID",
    scopes: ["ops"],
  },
  {
    name: "VERCEL_TEAM_SLUG",
    description: "Vercel team slug",
    scopes: ["ops"],
  },
  {
    name: "VERCEL_PROJECT",
    description: "Vercel project name",
    scopes: ["ops"],
  },
  {
    name: "VERCEL_PROJECT_ID",
    description: "Vercel project ID",
    scopes: ["ops"],
  },
  {
    name: "VERCEL_DEPLOYMENT",
    description: "Vercel deployment ID or URL",
    scopes: ["ops"],
  },
  {
    name: "VERCEL_ACCESS_GROUP",
    description: "Vercel access group ID or name",
    scopes: ["ops"],
  },
  {
    name: "VERCEL_FIREWALL_CONFIG_VERSION",
    description: "Vercel firewall config version",
    scopes: ["ops"],
  },
  {
    name: "VERCEL_INTEGRATIONS_VIEW",
    description: "Vercel integrations view (account|project)",
    scopes: ["ops"],
  },
];
