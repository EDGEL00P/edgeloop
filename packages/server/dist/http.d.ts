import type { ServerResponse } from 'http';
import type { Logger } from './logger';
export type ServerContext = {
    startedAtIso: string;
    logger: Logger;
};
export declare function createBroadcastHttpServer(ctx: ServerContext): import("http").Server<typeof import("http").IncomingMessage, typeof ServerResponse>;
//# sourceMappingURL=http.d.ts.map