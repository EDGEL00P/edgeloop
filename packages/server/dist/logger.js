function emit(level, message, fields) {
    const payload = {
        ts: new Date().toISOString(),
        level,
        msg: message,
        ...fields,
    };
    // Intentionally JSON for downstream aggregation.
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload));
}
export function createLogger() {
    return {
        info: (message, fields) => emit('info', message, fields),
        error: (message, fields) => emit('error', message, fields),
    };
}
//# sourceMappingURL=logger.js.map