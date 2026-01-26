export declare const errorCodes: readonly ["bad_request", "unauthorized", "forbidden", "not_found", "method_not_allowed", "rate_limited", "internal_error", "service_unavailable"];
export type ErrorCode = (typeof errorCodes)[number];
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | {
    [key: string]: JsonValue;
};
export type ErrorEnvelope = {
    error: {
        code: ErrorCode;
        message: string;
        requestId: string;
        details?: Record<string, JsonValue>;
    };
};
export declare function errorEnvelope(code: ErrorCode, message: string, requestId: string, details?: Record<string, JsonValue>): ErrorEnvelope;
export declare class AppError extends Error {
    readonly code: ErrorCode;
    readonly statusCode: number;
    readonly details?: Record<string, JsonValue> | undefined;
    constructor(code: ErrorCode, message: string, statusCode?: number, details?: Record<string, JsonValue> | undefined);
    static badRequest(message: string, details?: Record<string, JsonValue>): AppError;
    static unauthorized(message?: string): AppError;
    static forbidden(message?: string): AppError;
    static notFound(message?: string): AppError;
    static rateLimited(message?: string): AppError;
    static internal(message?: string): AppError;
}
export {};
//# sourceMappingURL=errors.d.ts.map