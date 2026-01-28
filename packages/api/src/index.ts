import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  requestIdMiddleware,
  loggerMiddleware,
  securityMiddleware,
  errorHandler,
  rateLimitMiddleware,
  authMiddleware,
} from './middleware'
import { healthRoutes, gameRoutes, predictionRoutes, oddsRoutes, modelRoutes, alertRoutes, userRoutes } from './routes'

/**
 * Parse allowed origins from environment variable.
 * Supports comma-separated list of origins.
 * Falls back to localhost for development if not configured.
 */
function getAllowedOrigins(): string[] {
  const corsOrigin = process.env['CORS_ORIGIN']
  if (corsOrigin) {
    return corsOrigin.split(',').map((origin) => origin.trim())
  }
  // Default to localhost for development
  return ['http://localhost:3000', 'http://localhost:3001']
}

export function createApp() {
  const app = new Hono()

  const allowedOrigins = getAllowedOrigins()

  // Global middleware with secure CORS configuration
  app.use(
    '*',
    cors({
      origin: (origin) => {
        // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
        if (!origin) return origin
        // Check if the origin is in the allowed list
        if (allowedOrigins.includes(origin)) return origin
        // In production, reject unknown origins by returning undefined (falsy)
        // This causes Hono's CORS middleware to not set Access-Control-Allow-Origin
        if (process.env['NODE_ENV'] === 'production') return undefined
        // In development, allow all origins
        return origin
      },
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      exposeHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
      maxAge: 600,
      credentials: true,
    })
  )
  app.use('*', requestIdMiddleware)
  app.use('*', loggerMiddleware)
  app.use('*', securityMiddleware)

  // Error handling
  app.onError(errorHandler)

  // Health routes (no auth, no rate limit)
  app.route('/', healthRoutes)

  // Apply rate limiting to API routes
  app.use('/api/*', rateLimitMiddleware)

  // Apply optional auth to API routes
  app.use('/api/*', authMiddleware)

  // API routes
  app.route('/api/games', gameRoutes)
  app.route('/api/predictions', predictionRoutes)
  app.route('/api/odds', oddsRoutes)
  app.route('/api/model', modelRoutes)
  app.route('/api/alerts', alertRoutes)
  app.route('/api/users', userRoutes)

  // Legacy routes (for backwards compatibility)
  app.get('/alerts', async (c) => {
    const response = await alertRoutes.fetch(new Request('http://localhost/'), c.env)
    return response
  })

  // 404 handler
  app.notFound((c) => {
    const requestId = c.get('requestId') ?? 'unknown'
    return c.json(
      {
        error: {
          code: 'not_found',
          message: 'Not found',
          requestId,
        },
      },
      404
    )
  })

  return app
}

export { createApp as default }
export * from './middleware'
export * from './routes'
