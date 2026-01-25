import { createMiddleware } from 'hono/factory'
import pino from 'pino'

const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

declare module 'hono' {
  interface ContextVariableMap {
    logger: pino.Logger
  }
}

export const loggerMiddleware = createMiddleware(async (c, next) => {
  const start = Date.now()
  const requestId = c.get('requestId') ?? 'unknown'

  const childLogger = logger.child({ requestId })
  c.set('logger', childLogger)

  childLogger.info({
    msg: 'request_started',
    method: c.req.method,
    path: c.req.path,
    query: c.req.query(),
    userAgent: c.req.header('user-agent'),
  })

  await next()

  const duration = Date.now() - start

  childLogger.info({
    msg: 'request_completed',
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration,
  })
})

export { logger }
