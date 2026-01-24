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

export function createApp() {
  const app = new Hono()

  // Global middleware
  app.use('*', cors())
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
