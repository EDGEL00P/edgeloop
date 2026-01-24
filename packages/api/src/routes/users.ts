import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { getDb, users, apiKeys } from '@edgeloop/db'
import { eq } from 'drizzle-orm'
import { randomBytes, createHash } from 'crypto'
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
    })
    .optional(),
})

userRoutes.patch('/me', zValidator('json', updatePreferencesSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  if (!userId) {
    throw AppError.unauthorized()
  }

  const db = getDb()

  const [updated] = await db
    .update(users)
    .set({
      name: data.name,
      preferences: data.preferences,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning()

  if (!updated) {
    throw AppError.notFound('User not found')
  }

  return c.json({
    asOfIso: nowIso(),
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      tier: updated.tier,
      preferences: updated.preferences,
      updatedAt: updated.updatedAt.toISOString(),
    },
  })
})

userRoutes.get('/me/keys', async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    throw AppError.unauthorized()
  }

  const db = getDb()
  const keys = await db.query.apiKeys.findMany({
    where: eq(apiKeys.userId, userId),
    columns: {
      id: true,
      keyPrefix: true,
      name: true,
      permissions: true,
      rateLimit: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  })

  return c.json({
    asOfIso: nowIso(),
    keys: keys.map((k) => ({
      id: k.id,
      keyPrefix: k.keyPrefix,
      name: k.name,
      permissions: k.permissions,
      rateLimit: k.rateLimit,
      lastUsedAt: k.lastUsedAt?.toISOString(),
      expiresAt: k.expiresAt?.toISOString(),
      createdAt: k.createdAt.toISOString(),
    })),
  })
})

const createKeySchema = z.object({
  name: z.string().max(100).optional(),
  permissions: z
    .object({
      read: z.boolean().optional(),
      write: z.boolean().optional(),
    })
    .optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
})

userRoutes.post('/me/keys', zValidator('json', createKeySchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  if (!userId) {
    throw AppError.unauthorized()
  }

  // Generate API key
  const rawKey = `el_${randomBytes(32).toString('base64url')}`
  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  const keyPrefix = rawKey.slice(0, 10)

  const expiresAt = data.expiresInDays ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000) : null

  const db = getDb()
  const [key] = await db
    .insert(apiKeys)
    .values({
      userId,
      keyHash,
      keyPrefix,
      name: data.name,
      permissions: data.permissions ?? { read: true, write: false },
      expiresAt,
    })
    .returning()

  if (!key) {
    throw AppError.internal('Failed to create API key')
  }

  return c.json(
    {
      asOfIso: nowIso(),
      key: {
        id: key.id,
        keyPrefix: key.keyPrefix,
        name: key.name,
        permissions: key.permissions,
        expiresAt: key.expiresAt?.toISOString(),
        createdAt: key.createdAt.toISOString(),
      },
      // Only return the raw key once!
      rawKey,
    },
    201
  )
})

userRoutes.delete('/me/keys/:keyId', async (c) => {
  const userId = c.get('userId')
  const keyId = c.req.param('keyId')

  if (!userId) {
    throw AppError.unauthorized()
  }

  const db = getDb()

  // Verify the key belongs to the user
  const key = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.id, keyId),
  })

  if (!key || key.userId !== userId) {
    throw AppError.notFound('API key not found')
  }

  await db.delete(apiKeys).where(eq(apiKeys.id, keyId))

  return c.json({
    asOfIso: nowIso(),
    deleted: true,
  })
})
