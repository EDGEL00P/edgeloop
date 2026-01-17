/**
 * Hono Routes Adapter
 * Converts existing Express-style routes to Hono handlers
 */
import type { Hono } from 'hono';
import { logger } from './infrastructure/logger';
import { registerChatRoutes } from './chat';
import { registerAuthRoutes } from './auth';

/**
 * Register all API routes for Hono
 */
export function registerApiRoutes(app: Hono) {
  // API base path
  const api = app.basePath('/api');

  // Health check
  api.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth routes
  registerAuthRoutes(api);

  // Chat routes  
  registerChatRoutes(api);

  // TODO: Migrate remaining routes from server/routes.ts
  // This will be done incrementally to maintain stability

  logger.info({ type: 'hono_routes_registered', message: 'Hono API routes initialized' });
}
