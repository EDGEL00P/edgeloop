import { pgTable, uuid, varchar, integer, timestamp, jsonb, index, boolean } from 'drizzle-orm/pg-core'
import type { AdapterAccount } from '@auth/core/adapters'

export const userTier = ['free', 'pro', 'enterprise'] as const
export type UserTier = (typeof userTier)[number]

export const userRole = ['user', 'analyst', 'admin'] as const
export type UserRole = (typeof userRole)[number]

export type UserPreferences = {
  oddsFormat?: 'american' | 'decimal' | 'fractional'
  timezone?: string
  emailNotifications?: boolean
  pushNotifications?: boolean
  favoriteTeams?: string[]
  theme?: 'light' | 'dark' | 'contrast' | 'broadcast'
}

export const users = pgTable(
  'users',
  {
    id: varchar('id', { length: 255 }).primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }),
    image: varchar('image', { length: 500 }),
    passwordHash: varchar('password_hash', { length: 255 }),
    
    role: varchar('role', { length: 20 }).notNull().default('user').$type<UserRole>(),
    tier: varchar('tier', { length: 20 }).notNull().default('free').$type<UserTier>(),
    
    emailVerified: timestamp('email_verified', { withTimezone: true }),
    preferences: jsonb('preferences').$type<UserPreferences>(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('users_email_idx').on(table.email),
    index('users_role_idx').on(table.role),
  ]
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// NextAuth adapter tables
export const accounts = pgTable(
  'account',
  {
    userId: varchar('userId', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 255 }).$type<AdapterAccount['type']>().notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
    refresh_token: varchar('refresh_token', { length: 255 }),
    access_token: varchar('access_token', { length: 500 }),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 500 }),
    id_token: varchar('id_token', { length: 2048 }),
    session_state: varchar('session_state', { length: 255 }),
  },
  (account) => [
    {
      compoundKey: {
        columns: [account.provider, account.providerAccountId],
        name: 'account_provider_key',
      },
    },
    index('account_userId_idx').on(account.userId),
  ]
)

export type Account = typeof accounts.$inferSelect

export const sessions = pgTable(
  'session',
  {
    sessionToken: varchar('sessionToken', { length: 255 }).primaryKey(),
    userId: varchar('userId', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (session) => [index('session_userId_idx').on(session.userId)]
)

export type Session = typeof sessions.$inferSelect

export const verificationTokens = pgTable(
  'verificationToken',
  {
    email: varchar('email', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (vt) => [
    {
      compoundKey: {
        columns: [vt.email, vt.token],
        name: 'verificationToken_email_token_key',
      },
    },
  ]
)

export type VerificationToken = typeof verificationTokens.$inferSelect
