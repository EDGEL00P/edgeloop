import { z } from 'zod';
export declare const BdlTeam: z.ZodObject<{
    id: z.ZodNumber;
    conference: z.ZodNullable<z.ZodString>;
    division: z.ZodNullable<z.ZodString>;
    location: z.ZodString;
    name: z.ZodString;
    full_name: z.ZodString;
    abbreviation: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: number;
    conference: string | null;
    division: string | null;
    location: string;
    full_name: string;
    abbreviation: string;
}, {
    name: string;
    id: number;
    conference: string | null;
    division: string | null;
    location: string;
    full_name: string;
    abbreviation: string;
}>;
export declare const BdlGame: z.ZodObject<{
    id: z.ZodNumber;
    season: z.ZodNumber;
    week: z.ZodNumber;
    start_time: z.ZodString;
    home_team_id: z.ZodNumber;
    away_team_id: z.ZodNumber;
    status: z.ZodEnum<["scheduled", "in_progress", "final"]>;
}, "strip", z.ZodTypeAny, {
    status: "scheduled" | "in_progress" | "final";
    id: number;
    season: number;
    week: number;
    start_time: string;
    home_team_id: number;
    away_team_id: number;
}, {
    status: "scheduled" | "in_progress" | "final";
    id: number;
    season: number;
    week: number;
    start_time: string;
    home_team_id: number;
    away_team_id: number;
}>;
export declare const BdlOdds: z.ZodObject<{
    id: z.ZodNumber;
    game_id: z.ZodNumber;
    vendor: z.ZodString;
    spread_home_value: z.ZodNullable<z.ZodString>;
    spread_home_odds: z.ZodNullable<z.ZodNumber>;
    spread_away_value: z.ZodNullable<z.ZodString>;
    spread_away_odds: z.ZodNullable<z.ZodNumber>;
    moneyline_home_odds: z.ZodNullable<z.ZodNumber>;
    moneyline_away_odds: z.ZodNullable<z.ZodNumber>;
    total_value: z.ZodNullable<z.ZodString>;
    total_over_odds: z.ZodNullable<z.ZodNumber>;
    total_under_odds: z.ZodNullable<z.ZodNumber>;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    game_id: number;
    vendor: string;
    spread_home_value: string | null;
    spread_home_odds: number | null;
    spread_away_value: string | null;
    spread_away_odds: number | null;
    moneyline_home_odds: number | null;
    moneyline_away_odds: number | null;
    total_value: string | null;
    total_over_odds: number | null;
    total_under_odds: number | null;
    updated_at: string;
}, {
    id: number;
    game_id: number;
    vendor: string;
    spread_home_value: string | null;
    spread_home_odds: number | null;
    spread_away_value: string | null;
    spread_away_odds: number | null;
    moneyline_home_odds: number | null;
    moneyline_away_odds: number | null;
    total_value: string | null;
    total_over_odds: number | null;
    total_under_odds: number | null;
    updated_at: string;
}>;
export type BdlTeam = z.infer<typeof BdlTeam>;
export type BdlGame = z.infer<typeof BdlGame>;
export type BdlOdds = z.infer<typeof BdlOdds>;
export declare function bdl<T>(path: string, init?: RequestInit): Promise<T>;
export declare function paginate<T>(path: string, perPage?: number): AsyncGenerator<T, void, unknown>;
export declare function getAllTeams(): Promise<BdlTeam[]>;
export declare function getGames(params: {
    season?: number;
    week?: number;
    teamIds?: number[];
}): Promise<BdlGame[]>;
export declare function getInjuries(params: {
    team?: string;
    season?: number;
}): Promise<unknown[]>;
export declare function getRoster(params: {
    team?: string;
    season?: number;
}): Promise<unknown[]>;
export declare function getOdds(params: {
    season?: number;
    week?: number;
    gameIds?: number[];
}): Promise<BdlOdds[]>;
//# sourceMappingURL=client.d.ts.map