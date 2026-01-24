export const errorCodes = [
  'bad_request',
  'unauthorized',
  'forbidden',
  'not_found',
  'method_not_allowed',
  'rate_limited',
  'internal_error',
  'service_unavailable',
] as const

export type ErrorCode = (typeof errorCodes)[number]

export type ErrorEnvelope = {
  error: {
    code: ErrorCode
    message: string
    requestId: string
    details?: Record<string, unknown>
  }
}

export function errorEnvelope(
  code: ErrorCode,
  message: string,
  requestId: string,
  details?: Record<string, unknown>
): ErrorEnvelope {
  return {
    error: {
      code,
      message,
      requestId,
      ...(details && { details }),
    },
  }
}

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }

  static badRequest(message: string, details?: Record<string, unknown>): AppError {
    return new AppError('bad_request', message, 400, details)
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError('unauthorized', message, 401)
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError('forbidden', message, 403)
  }

  static notFound(message = 'Not found'): AppError {
    return new AppError('not_found', message, 404)
  }

  static rateLimited(message = 'Rate limit exceeded'): AppError {
    return new AppError('rate_limited', message, 429)
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError('internal_error', message, 500)
  }
}
