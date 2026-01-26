import { errorEnvelope } from '@edgeloop/shared';
import { getOrCreateRequestId as getOrCreateReqId } from './requestId';
/**
 * Extract and validate request ID from Vercel request headers.
 */
export function getOrCreateRequestId(req) {
    return getOrCreateReqId(req.headers['x-request-id']);
}
/**
 * Apply security headers to HTTP response.
 */
export function setSecurityHeaders(res) {
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('referrer-policy', 'no-referrer');
    res.setHeader('x-frame-options', 'DENY');
    res.setHeader('permissions-policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('cross-origin-opener-policy', 'same-origin');
    res.setHeader('cross-origin-resource-policy', 'same-origin');
}
/**
 * Write JSON response with security headers and request ID.
 */
export function writeJson(res, statusCode, body, requestId) {
    const payload = JSON.stringify(body);
    res.statusCode = statusCode;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.setHeader('x-request-id', requestId);
    setSecurityHeaders(res);
    res.end(payload);
}
/**
 * Log error to stderr as structured JSON.
 */
export function logError(msg, requestId, err) {
    try {
        process.stderr.write(JSON.stringify({
            ts: new Date().toISOString(),
            level: 'error',
            msg,
            requestId,
            error: String(err),
        }) + '\n');
    }
    catch {
        // ignore
    }
}
/**
 * Create error envelope for consistent error responses.
 */
export { errorEnvelope };
//# sourceMappingURL=vercel-helpers.js.map