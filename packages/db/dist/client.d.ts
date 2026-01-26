import * as schema from './schema';
export declare function getDb(): import("drizzle-orm/neon-http").NeonHttpDatabase<typeof schema> & {
    $client: import("@neondatabase/serverless").NeonQueryFunction<false, false>;
};
export type Database = ReturnType<typeof getDb>;
export declare function createFreshDb(): import("drizzle-orm/neon-http").NeonHttpDatabase<typeof schema> & {
    $client: import("@neondatabase/serverless").NeonQueryFunction<false, false>;
};
//# sourceMappingURL=client.d.ts.map