import { z } from 'zod';
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
}, {
    page?: number | undefined;
    pageSize?: number | undefined;
}>;
export type Pagination = z.infer<typeof paginationSchema>;
export declare const gameFiltersSchema: z.ZodObject<{
    season: z.ZodOptional<z.ZodNumber>;
    week: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["scheduled", "pregame", "in_progress", "halftime", "final", "postponed", "cancelled"]>>;
    team: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "scheduled" | "pregame" | "in_progress" | "halftime" | "final" | "postponed" | "cancelled" | undefined;
    season?: number | undefined;
    week?: number | undefined;
    team?: string | undefined;
}, {
    status?: "scheduled" | "pregame" | "in_progress" | "halftime" | "final" | "postponed" | "cancelled" | undefined;
    season?: number | undefined;
    week?: number | undefined;
    team?: string | undefined;
}>;
export type GameFilters = z.infer<typeof gameFiltersSchema>;
export declare const dateRangeSchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodDate>;
    to: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    from?: Date | undefined;
    to?: Date | undefined;
}, {
    from?: Date | undefined;
    to?: Date | undefined;
}>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export declare const uuidSchema: z.ZodString;
export declare const teamCodeSchema: z.ZodUnion<[z.ZodString, z.ZodString]>;
export declare const apiKeyPrefixSchema: z.ZodString;
export declare function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T;
export declare function safeValidateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: true;
    data: T;
} | {
    success: false;
    error: z.ZodError;
};
//# sourceMappingURL=validation.d.ts.map