import { HTTPException } from 'hono/http-exception'
import type { ErrorHandler } from 'hono'
import type { StatusCode } from 'hono/utils/http-status'
import { AppError, errorEnvelope } from '@edgeloop/shared'
import { ZodError } from 'zod'

export const errorHandler: ErrorHandler = (err, c) => {
  const requestId = c.get('requestId') ?? 'unknown'
  const logger = c.get('logger')

  // Log the error
  logger?.error({
    msg: 'error_occurred',
    error: err.message,
    stack: err.stack,
  })

  // Handle AppError
  if (err instanceof AppError) {
    return c.json(errorEnvelope(err.code, err.message, requestId, err.details), err.statusCode as StatusCode)
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = {
      issues: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    }
    return c.json(errorEnvelope('bad_request', 'Validation error', requestId, details), 400)
  }

  // Handle Hono HTTPException
  if (err instanceof HTTPException) {
    const code = err.status === 404 ? 'not_found' : err.status === 405 ? 'method_not_allowed' : 'internal_error'
    return c.json(errorEnvelope(code, err.message, requestId), err.status)
  }

  // Unknown error
  const message = process.env['NODE_ENV'] === 'production' ? 'Internal server error' : err.message
  return c.json(errorEnvelope('internal_error', message, requestId), 500)
}
