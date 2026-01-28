import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type Pagination = z.infer<typeof paginationSchema>

export const gameFiltersSchema = z.object({
  season: z.coerce.number().int().min(2020).max(2030).optional(),
  week: z.coerce.number().int().min(1).max(22).optional(),
  status: z.enum(['scheduled', 'pregame', 'in_progress', 'halftime', 'final', 'postponed', 'cancelled']).optional(),
  team: z.string().min(2).max(3).optional(),
})

export type GameFilters = z.infer<typeof gameFiltersSchema>

export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
})

export type DateRange = z.infer<typeof dateRangeSchema>

export const uuidSchema = z.string().uuid()

export const teamCodeSchema = z.string().length(2).or(z.string().length(3))

export const apiKeyPrefixSchema = z.string().regex(/^el_[a-zA-Z0-9]{8}$/)

/**
 * Validates that a string is a valid UUID.
 * Useful for route parameter validation.
 * @param value - The string to validate
 * @param fieldName - The name of the field for error messages
 * @returns The validated UUID string
 * @throws Error with descriptive message if validation fails
 */
export function validateUuid(value: string, fieldName = 'id'): string {
  const result = uuidSchema.safeParse(value)
  if (!result.success) {
    throw new Error(`Invalid ${fieldName}: must be a valid UUID`)
  }
  return result.data
}

/**
 * Checks if a string is a valid UUID without throwing.
 * @param value - The string to validate
 * @returns true if the string is a valid UUID, false otherwise
 */
export function isValidUuid(value: string): boolean {
  return uuidSchema.safeParse(value).success
}

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

export function safeValidateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}
