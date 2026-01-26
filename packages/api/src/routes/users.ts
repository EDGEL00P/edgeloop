import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { getDb, users } from '@edgeloop/db'
import { eq } from 'drizzle-orm'
import { nowIso, AppError } from '@edgeloop/shared'
import { requireAuth } from '../middleware/auth'

export const userRoutes = new Hono()

// All user routes require authentication
userRoutes.use('/*', requireAuth)

userRoutes.get('/me', async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    throw AppError.unauthorized()
  }

  const db = getDb()
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (!user) {
    throw AppError.notFound('User not found')
  }

  return c.json({
    asOfIso: nowIso(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier,
      preferences: user.preferences,
      createdAt: user.createdAt.toISOString(),
    },
  })
})

const updatePreferencesSchema = z.object({
  name: z.string().max(255).optional(),
  preferences: z
    .object({
      oddsFormat: z.enum(['american', 'decimal', 'fractional']).optional(),
      timezone: z.string().optional(),
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      favoriteTeams: z.array(z.string()).optional(),
      theme: z.enum(['light', 'dark', 'contrast', 'broadcast']).optional(),
    })
    .optional(),
})

userRoutes.patch(
  '/me',
  zValidator('json', updatePreferencesSchema),
  async (c) => {
    const userId = c.get('userId')

    if (!userId) {
      throw AppError.unauthorized()
    }

    const body = c.req.valid('json')
    const db = getDb()

    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!existingUser) {
      throw AppError.notFound('User not found')
    }

    const updatedUser = await db
      .update(users)
      .set({
        name: body.name ?? existingUser.name,
        preferences: body.preferences
          ? { ...existingUser.preferences, ...body.preferences }
          : existingUser.preferences,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning()

    return c.json({
      asOfIso: nowIso(),
      user: {
        id: updatedUser[0].id,
        email: updatedUser[0].email,
        name: updatedUser[0].name,
        tier: updatedUser[0].tier,
        preferences: updatedUser[0].preferences,
        updatedAt: updatedUser[0].updatedAt.toISOString(),
      },
    })
  }
)
