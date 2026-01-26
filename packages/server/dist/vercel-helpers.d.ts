import type { IncomingMessage, ServerResponse } from 'http';
import { errorEnvelope, type ErrorCode } from '@edgeloop/shared';
/**
 * Extract and validate request ID from Vercel request headers.
 */
export declare function getOrCreateRequestId(req: IncomingMessage): string;
/**
 * Apply security headers to HTTP response.
 */
export declare function setSecurityHeaders(res: ServerResponse): void;
/**
 * Write JSON response with security headers and request ID.
 */
export declare function writeJson(res: ServerResponse, statusCode: number, body: unknown, requestId: string): void;
/**
 * Log error to stderr as structured JSON.
 */
export declare function logError(msg: string, requestId: string, err: unknown): void;
/**
 * Create error envelope for consistent error responses.
 */
export { errorEnvelope, type ErrorCode };
//# sourceMappingURL=vercel-helpers.d.ts.map