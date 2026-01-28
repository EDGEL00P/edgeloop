import { createMiddleware } from 'hono/factory'
import { verifyToken } from '@clerk/backend'
import { AppError } from '@edgeloop/shared'
import { getDb, users } from '@edgeloop/db'
import { eq } from 'drizzle-orm'
import { upsertUserFromClerk } from '../auth'

declare module 'hono' {
  interface ContextVariableMap {
    userId: string | null
    userEmail: string | null
    isAuthenticated: boolean
  }
}

const clerkSecretKey = process.env['CLERK_SECRET_KEY']

if (!clerkSecretKey && process.env.NODE_ENV !== 'test') {
  console.error('Missing CLERK_SECRET_KEY - authentication will not work')
}

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

          // Ensure the Clerk user exists in our database
          const db = getDb()
          let user = await db.query.users.findFirst({
            where: eq(users.id, payload.sub),
          })

          if (!user) {
            const email =
              (payload as any).email ??
              (payload as any).email_address ??
              ((payload as any).email_addresses?.[0]?.email_address as string | undefined) ??
              ((payload as any).email_addresses?.[0] as string | undefined)

            if (email) {
              try {
                user = await upsertUserFromClerk({
                  clerkId: payload.sub,
                  email,
                  name: (payload as any).name ?? (payload as any).full_name ?? undefined,
                  image: (payload as any).image_url ?? undefined,
                })
              } catch (err) {
                console.error('Failed to sync Clerk user to database', err)
              }
            } else {
              console.error('Unable to sync Clerk user - email missing from token payload')
            }
          }

          if (user?.email) {
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
