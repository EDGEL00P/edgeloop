import { createMiddleware } from 'hono/factory'
import { verifyToken } from '@clerk/backend'
import { AppError } from '@edgeloop/shared'
import { getDb, users } from '@edgeloop/db'
import { eq } from 'drizzle-orm'

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

  // Try Bearer token (Clerk JWT)
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
          // The user ID in Clerk is stored directly as the user's ID in our database
          const db = getDb()
          const user = await db.query.users.findFirst({
            where: eq(users.id, payload.sub),
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

  await next()
})

export const requireAuth = createMiddleware(async (c, next) => {
  if (!c.get('isAuthenticated')) {
    throw AppError.unauthorized('Authentication required')
  }
  await next()
})

export const optionalAuth = authMiddleware
