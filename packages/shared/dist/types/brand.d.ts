export type Brand<K, T extends string> = K & {
    readonly __brand: T;
};
export type IsoDateTimeString = Brand<string, 'IsoDateTimeString'>;
export declare function asIsoDateTimeString(value: string): IsoDateTimeString;
export declare function nowIso(): IsoDateTimeString;
export type GameId = Brand<string, 'GameId'>;
export type TeamCode = Brand<string, 'TeamCode'>;
export type UserId = Brand<string, 'UserId'>;
export type PredictionId = Brand<string, 'PredictionId'>;
export type AlertId = Brand<string, 'AlertId'>;
export type ModelVersionId = Brand<string, 'ModelVersionId'>;
//# sourceMappingURL=brand.d.ts.map