export type LogLevel = 'info' | 'error';
export type Logger = {
    info: (message: string, fields?: Record<string, unknown>) => void;
    error: (message: string, fields?: Record<string, unknown>) => void;
};
export declare function createLogger(): Logger;
//# sourceMappingURL=logger.d.ts.map