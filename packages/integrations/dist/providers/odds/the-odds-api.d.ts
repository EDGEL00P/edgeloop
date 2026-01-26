import type { OddsProvider, OddsData, GameData } from './base';
export declare class TheOddsApiProvider implements OddsProvider {
    name: string;
    private apiKey;
    constructor(apiKey: string);
    fetchOdds(sport: string): Promise<OddsData[]>;
    fetchGames(sport: string): Promise<GameData[]>;
    private extractOdds;
}
//# sourceMappingURL=the-odds-api.d.ts.map