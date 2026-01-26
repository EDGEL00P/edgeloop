/**
 * Clerk Authentication Helpers
 * 
 * The project uses Clerk for authentication. This module provides
 * helper functions for working with Clerk in API routes.
 * 
 * @see https://clerk.com/docs
 */

import { getDb } from '@edgeloop/db'
import { users } from '@edgeloop/db/schema'
import { eq } from 'drizzle-orm'
import type { User, UserRole } from '@edgeloop/db/schema'

/**
 * Get user by their Clerk ID
 */
export async function getUserByClerkId(clerkId: string): Promise<User | undefined> {
  const db = getDb()
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, clerkId))
    .limit(1)
  
  return result[0]
}

/**
 * Create or update user from Clerk webhook
 */
export async function upsertUserFromClerk(userData: {
  clerkId: string
  email: string
  name?: string
  image?: string
}): Promise<User> {
  const db = getDb()
  const { clerkId, email, name, image } = userData
  
  const existingUser = await getUserByClerkId(clerkId)
  
  if (existingUser) {
    const result = await db
      .update(users)
      .set({
        email,
        name,
        image,
        updatedAt: new Date(),
      })
      .where(eq(users.id, clerkId))
      .returning()
    
    return result[0]
  }
  
  const result = await db
    .insert(users)
    .values({
      id: clerkId,
      email,
      name,
      image,
      role: 'user',
      tier: 'free',
    })
    .returning()
  
  return result[0]
}

/**
 * Delete user by Clerk ID (for Clerk webhook)
 */
export async function deleteUserByClerkId(clerkId: string): Promise<void> {
  const db = getDb()
  await db.delete(users).where(eq(users.id, clerkId))
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: User | undefined, requiredRole: UserRole): boolean {
  if (!user) return false
  
  const roleHierarchy: Record<UserRole, number> = {
    user: 0,
    analyst: 1,
    admin: 2,
  }
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}

/**
 * Check if user is admin
 */
export function isAdmin(user: User | undefined): boolean {
  return hasRole(user, 'admin')
}

/**
 * Check if user is analyst or higher
 */
export function isAnalyst(user: User | undefined): boolean {
  return hasRole(user, 'analyst')
}
