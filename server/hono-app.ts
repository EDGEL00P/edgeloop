/**
 * Hono Application - 2027 Architecture
 * Replaces Express for better performance and edge compatibility
 */
/**
 * Hono Application - 2027 Architecture Bridge
 * 
 * This is an INTERIM solution while we migrate to Rust (Axum).
 * Hono provides:
 * - Better performance than Express
 * - Edge runtime compatibility
 * - Type-safe routing
 * - Easy migration path to Rust backend
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from './infrastructure/logger';
import { registerApiRoutes } from './hono-routes';

export const app = new Hono();

// Global middleware
app.use('*', cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  credentials: true,
}));

// Request logging middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  
  logger.info({
    type: 'api_request',
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration,
  });
});

// Register all API routes
registerApiRoutes(app);

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  logger.error({
    type: 'api_error',
    error: err.message,
    stack: err.stack,
    path: c.req.path,
  });
  
  return c.json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  }, 500);
});
