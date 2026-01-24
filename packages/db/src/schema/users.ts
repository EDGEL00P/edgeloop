import { pgTable, uuid, varchar, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core'

export const userTier = ['free', 'pro', 'enterprise'] as const
export type UserTier = (typeof userTier)[number]

export type UserPreferences = {
  oddsFormat?: 'american' | 'decimal' | 'fractional'
  timezone?: string
  emailNotifications?: boolean
  pushNotifications?: boolean
  favoriteTeams?: string[]
}

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clerkId: varchar('clerk_id', { length: 100 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }),

    tier: varchar('tier', { length: 20 }).notNull().default('free').$type<UserTier>(),

    preferences: jsonb('preferences').$type<UserPreferences>(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('users_clerk_id_idx').on(table.clerkId), index('users_email_idx').on(table.email)]
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type ApiKeyPermissions = {
  read?: boolean
  write?: boolean
  admin?: boolean
}

export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),

    keyHash: varchar('key_hash', { length: 64 }).notNull().unique(),
    keyPrefix: varchar('key_prefix', { length: 10 }).notNull(),
    name: varchar('name', { length: 100 }),

    permissions: jsonb('permissions').$type<ApiKeyPermissions>(),
    rateLimit: integer('rate_limit').notNull().default(1000),

    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('api_keys_user_id_idx').on(table.userId), index('api_keys_key_hash_idx').on(table.keyHash)]
)

export type ApiKey = typeof apiKeys.$inferSelect
export type NewApiKey = typeof apiKeys.$inferInsert
