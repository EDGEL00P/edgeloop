import { randomBytes, randomUUID } from 'crypto';
const MAX_LEN = 128;
const SAFE_RE = /^[a-zA-Z0-9._-]+$/;
function safeRandomId() {
    try {
        return randomUUID();
    }
    catch {
        // randomUUID may not exist in some Node runtimes; fall back.
        return randomBytes(16).toString('hex');
    }
}
export function getOrCreateRequestId(input) {
    if (typeof input === 'string') {
        const trimmed = input.trim();
        if (trimmed.length > 0 && trimmed.length <= MAX_LEN && SAFE_RE.test(trimmed)) {
            return trimmed;
        }
    }
    return safeRandomId();
}
//# sourceMappingURL=requestId.js.map