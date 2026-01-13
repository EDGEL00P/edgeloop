import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

function verifyApiSecrets() {
  const secrets = [
    { name: 'BALLDONTLIE_API_KEY', required: true },
    { name: 'WEATHER_API_KEY', required: false },
    { name: 'ODDS_API_KEY', required: false },
    { name: 'EXA_API_KEY', required: false },
    { name: 'OPENROUTER_API_KEY', required: false },
    { name: 'GROK_API_KEY', required: false },
    { name: 'AI_INTEGRATIONS_OPENAI_API_KEY', required: false },
    { name: 'AI_INTEGRATIONS_GEMINI_API_KEY', required: false },
  ];

  console.log('\n=== API Secrets Status ===');
  for (const { name, required } of secrets) {
    const value = process.env[name];
    const status = value ? '✓ loaded' : (required ? '✗ MISSING' : '○ not set');
    const masked = value ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : 'N/A';
    console.log(`  ${name}: ${status}${value ? ` (${masked})` : ''}`);
  }
  console.log('==========================\n');
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

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup Next.js in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupNext } = await import("./next");
    await setupNext(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
