import { z } from 'zod';
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export const gameFiltersSchema = z.object({
    season: z.coerce.number().int().min(2020).max(2030).optional(),
    week: z.coerce.number().int().min(1).max(22).optional(),
    status: z.enum(['scheduled', 'pregame', 'in_progress', 'halftime', 'final', 'postponed', 'cancelled']).optional(),
    team: z.string().min(2).max(3).optional(),
});
export const dateRangeSchema = z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
});
export const uuidSchema = z.string().uuid();
export const teamCodeSchema = z.string().length(2).or(z.string().length(3));
export const apiKeyPrefixSchema = z.string().regex(/^el_[a-zA-Z0-9]{8}$/);
export function validateRequest(schema, data) {
    return schema.parse(data);
}
export function safeValidateRequest(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
}
//# sourceMappingURL=validation.js.map