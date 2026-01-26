export type OddsData = {
    gameExternalId: string;
    provider: string;
    moneylineHome: number | null;
    moneylineAway: number | null;
    spreadHome: number | null;
    spreadHomeOdds: number | null;
    spreadAwayOdds: number | null;
    totalPoints: number | null;
    overOdds: number | null;
    underOdds: number | null;
    fetchedAt: Date;
};
export type GameData = {
    externalId: string;
    homeTeamCode: string;
    awayTeamCode: string;
    scheduledAt: Date;
    venue?: string;
};
export interface OddsProvider {
    name: string;
    fetchOdds(sport: string): Promise<OddsData[]>;
    fetchGames(sport: string): Promise<GameData[]>;
}
//# sourceMappingURL=base.d.ts.map