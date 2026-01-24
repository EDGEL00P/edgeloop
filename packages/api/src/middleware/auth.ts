import { createMiddleware } from 'hono/factory'
import { verifyToken } from '@clerk/backend'
import { AppError } from '@edgeloop/shared'
import { getDb, apiKeys, users } from '@edgeloop/db'
import { eq } from 'drizzle-orm'
import { createHash } from 'crypto'

declare module 'hono' {
  interface ContextVariableMap {
    userId: string | null
    userEmail: string | null
    isAuthenticated: boolean
  }
}

const clerkSecretKey = process.env['CLERK_SECRET_KEY']

export const authMiddleware = createMiddleware(async (c, next) => {
  c.set('userId', null)
  c.set('userEmail', null)
  c.set('isAuthenticated', false)

  // Try Bearer token first (Clerk JWT)
  const authHeader = c.req.header('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)

    if (clerkSecretKey) {
      try {
        const payload = await verifyToken(token, {
          secretKey: clerkSecretKey,
        })
        if (payload.sub) {
          c.set('userId', payload.sub)
          c.set('isAuthenticated', true)

          // Try to get user email from DB
          const db = getDb()
          const user = await db.query.users.findFirst({
            where: eq(users.clerkId, payload.sub),
            columns: { email: true },
          })
          if (user) {
            c.set('userEmail', user.email)
          }
        }
      } catch {
        // Invalid token, continue as unauthenticated
      }
    }
  }

  // Try API key
  const apiKey = c.req.header('x-api-key')
  if (apiKey && !c.get('isAuthenticated')) {
    const keyHash = createHash('sha256').update(apiKey).digest('hex')

    const db = getDb()
    const key = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.keyHash, keyHash),
    })

    if (key && (!key.expiresAt || key.expiresAt > new Date())) {
      c.set('userId', key.userId)
      c.set('isAuthenticated', true)

      // Update last used
      await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, key.id))
    }
  }

  await next()
})

export const requireAuth = createMiddleware(async (c, next) => {
  if (!c.get('isAuthenticated')) {
    throw AppError.unauthorized('Authentication required')
  }
  await next()
})

export const optionalAuth = authMiddleware
