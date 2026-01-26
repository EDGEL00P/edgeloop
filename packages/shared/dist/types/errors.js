export const errorCodes = [
    'bad_request',
    'unauthorized',
    'forbidden',
    'not_found',
    'method_not_allowed',
    'rate_limited',
    'internal_error',
    'service_unavailable',
];
export function errorEnvelope(code, message, requestId, details) {
    return {
        error: {
            code,
            message,
            requestId,
            ...(details && { details }),
        },
    };
}
export class AppError extends Error {
    code;
    statusCode;
    details;
    constructor(code, message, statusCode = 500, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'AppError';
    }
    static badRequest(message, details) {
        return new AppError('bad_request', message, 400, details);
    }
    static unauthorized(message = 'Unauthorized') {
        return new AppError('unauthorized', message, 401);
    }
    static forbidden(message = 'Forbidden') {
        return new AppError('forbidden', message, 403);
    }
    static notFound(message = 'Not found') {
        return new AppError('not_found', message, 404);
    }
    static rateLimited(message = 'Rate limit exceeded') {
        return new AppError('rate_limited', message, 429);
    }
    static internal(message = 'Internal server error') {
        return new AppError('internal_error', message, 500);
    }
}
//# sourceMappingURL=errors.js.map