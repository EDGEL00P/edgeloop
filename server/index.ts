import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import { logger } from "./infrastructure/logger";

const app = express();
const httpServer = createServer(app);

function verifyApiSecrets() {
  const secrets = [
    { name: 'BALLDONTLIE_API_KEY', required: true },
    { name: 'SPORTRADAR_API_KEY', required: false },
    { name: 'RAPIDAPI_KEY', required: false },
    { name: 'SPORTSDB_KEY', required: false },
    { name: 'WEATHER_API_KEY', required: false },
    { name: 'ODDS_API_KEY', required: false },
    { name: 'EXA_API_KEY', required: false },
    { name: 'OPENROUTER_API_KEY', required: false },
    { name: 'GROK_API_KEY', required: false },
    { name: 'AI_INTEGRATIONS_OPENAI_API_KEY', required: false },
    { name: 'AI_INTEGRATIONS_GEMINI_API_KEY', required: false },
  ];

  logger.info({ type: "secrets_check_start", message: "API secrets status" });
  for (const { name, required } of secrets) {
    const value = process.env[name];
    const status = value ? '✓ loaded' : (required ? '✗ MISSING' : '○ not set');
    const masked = value ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : 'N/A';
    if (required && !value) {
      logger.warn({
        type: "secret_status",
        name,
        required,
        status,
        masked: value ? masked : "N/A",
      });
      continue;
    }
    logger.info({
      type: "secret_status",
      name,
      required,
      status,
      masked: value ? masked : "N/A",
    });
  }
  logger.info({ type: "secrets_check_complete", message: "API secrets status complete" });
}

verifyApiSecrets();

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: unknown = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const logEntry: Record<string, unknown> = {
        type: "http_request",
        method: req.method,
        path,
        statusCode: res.statusCode,
        durationMs: duration,
      };
      if (capturedJsonResponse !== undefined) {
        try {
          logEntry.response = capturedJsonResponse;
        } catch {
          logEntry.response = "[unserializable]";
        }
      }
      logger.info(logEntry);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    const error = err instanceof Error ? err : new Error(String(err));
    const status = (err as { status?: number; statusCode?: number }).status ||
      (err as { statusCode?: number }).statusCode ||
      500;

    logger.error({
      type: "http_error",
      message: error.message,
      status,
      stack: error.stack,
    });

    res.status(status).json({ message: error.message });
  });

  // Next.js handles static files in production and development
  // Routes are already registered above

  // Universal port detection - works on any platform automatically
  // Platforms set PORT automatically: Vercel, Railway, Render, Fly.io, Heroku, etc.
  const port = parseInt(
    process.env.PORT || 
    process.env.VERCEL_PORT || 
    process.env.RAILWAY_PORT ||
    "3000",
    10
  );
  
  // Host configuration - 0.0.0.0 works everywhere (Docker, Railway, Render, etc.)
  // localhost works for Vercel serverless (but they handle it differently)
  const host = process.env.HOSTNAME || 
               process.env.HOST || 
               (process.env.VERCEL ? "0.0.0.0" : "0.0.0.0");
  
  httpServer.listen(port, host, () => {
    logger.info({
      type: "server_start",
      host,
      port,
      env: process.env.NODE_ENV || "development",
      platform: detectPlatform(),
    });
  });
  
  // Universal graceful shutdown - works on all platforms
  const shutdown = (signal: string) => {
    logger.warn({ type: "server_shutdown", signal });
    httpServer.close(() => {
      process.exit(0);
    });
    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error({ type: "server_shutdown_forced", message: "Forced shutdown after timeout" });
      process.exit(1);
    }, 10000);
  };
  
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  
  // Platform detection helper
  function detectPlatform(): string {
    if (process.env.VERCEL) return "Vercel";
    if (process.env.RAILWAY_ENVIRONMENT) return "Railway";
    if (process.env.RENDER) return "Render";
    if (process.env.FLY_APP_NAME) return "Fly.io";
    if (process.env.HEROKU_APP_NAME) return "Heroku";
    if (process.env.REPLIT_DEV_DOMAIN) return "Replit";
    if (process.env.DOCKER) return "Docker";
    return "Local/Unknown";
  }
})();
