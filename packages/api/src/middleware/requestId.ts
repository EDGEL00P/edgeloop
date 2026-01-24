import { createMiddleware } from 'hono/factory'
import { randomUUID } from 'crypto'

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string
  }
}

export const requestIdMiddleware = createMiddleware(async (c, next) => {
  const existingId = c.req.header('x-request-id')
  const requestId = existingId && isValidUUID(existingId) ? existingId : randomUUID()

  c.set('requestId', requestId)
  c.header('x-request-id', requestId)

  await next()
})

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}
