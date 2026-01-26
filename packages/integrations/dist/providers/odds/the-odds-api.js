import { z } from 'zod';
const THE_ODDS_API_BASE = 'https://api.the-odds-api.com/v4';
const outcomeSchema = z.object({
    name: z.string(),
    price: z.number(),
    point: z.number().optional(),
});
const marketSchema = z.object({
    key: z.string(),
    outcomes: z.array(outcomeSchema),
});
const bookmakerSchema = z.object({
    key: z.string(),
    title: z.string(),
    markets: z.array(marketSchema),
});
const gameSchema = z.object({
    id: z.string(),
    sport_key: z.string(),
    sport_title: z.string(),
    commence_time: z.string(),
    home_team: z.string(),
    away_team: z.string(),
    bookmakers: z.array(bookmakerSchema).optional(),
});
const oddsResponseSchema = z.array(gameSchema);
// Team name to code mapping for NFL
const NFL_TEAM_CODES = {
    'Arizona Cardinals': 'ARI',
    'Atlanta Falcons': 'ATL',
    'Baltimore Ravens': 'BAL',
    'Buffalo Bills': 'BUF',
    'Carolina Panthers': 'CAR',
    'Chicago Bears': 'CHI',
    'Cincinnati Bengals': 'CIN',
    'Cleveland Browns': 'CLE',
    'Dallas Cowboys': 'DAL',
    'Denver Broncos': 'DEN',
    'Detroit Lions': 'DET',
    'Green Bay Packers': 'GB',
    'Houston Texans': 'HOU',
    'Indianapolis Colts': 'IND',
    'Jacksonville Jaguars': 'JAX',
    'Kansas City Chiefs': 'KC',
    'Las Vegas Raiders': 'LV',
    'Los Angeles Chargers': 'LAC',
    'Los Angeles Rams': 'LAR',
    'Miami Dolphins': 'MIA',
    'Minnesota Vikings': 'MIN',
    'New England Patriots': 'NE',
    'New Orleans Saints': 'NO',
    'New York Giants': 'NYG',
    'New York Jets': 'NYJ',
    'Philadelphia Eagles': 'PHI',
    'Pittsburgh Steelers': 'PIT',
    'San Francisco 49ers': 'SF',
    'Seattle Seahawks': 'SEA',
    'Tampa Bay Buccaneers': 'TB',
    'Tennessee Titans': 'TEN',
    'Washington Commanders': 'WAS',
};
export class TheOddsApiProvider {
    name = 'the-odds-api';
    apiKey;
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    async fetchOdds(sport) {
        const sportKey = sport === 'nfl' ? 'americanfootball_nfl' : sport;
        const url = new URL(`${THE_ODDS_API_BASE}/sports/${sportKey}/odds`);
        url.searchParams.set('apiKey', this.apiKey);
        url.searchParams.set('regions', 'us');
        url.searchParams.set('markets', 'h2h,spreads,totals');
        url.searchParams.set('oddsFormat', 'american');
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`The Odds API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const games = oddsResponseSchema.parse(data);
        const oddsData = [];
        for (const game of games) {
            if (!game.bookmakers || game.bookmakers.length === 0)
                continue;
            for (const bookmaker of game.bookmakers) {
                const odds = this.extractOdds(game.id, bookmaker);
                if (odds) {
                    oddsData.push(odds);
                }
            }
        }
        return oddsData;
    }
    async fetchGames(sport) {
        const sportKey = sport === 'nfl' ? 'americanfootball_nfl' : sport;
        const url = new URL(`${THE_ODDS_API_BASE}/sports/${sportKey}/events`);
        url.searchParams.set('apiKey', this.apiKey);
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`The Odds API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const games = oddsResponseSchema.parse(data);
        return games.map((game) => ({
            externalId: game.id,
            homeTeamCode: NFL_TEAM_CODES[game.home_team] ?? game.home_team,
            awayTeamCode: NFL_TEAM_CODES[game.away_team] ?? game.away_team,
            scheduledAt: new Date(game.commence_time),
        }));
    }
    extractOdds(gameId, bookmaker) {
        const result = {
            gameExternalId: gameId,
            provider: bookmaker.key,
            moneylineHome: null,
            moneylineAway: null,
            spreadHome: null,
            spreadHomeOdds: null,
            spreadAwayOdds: null,
            totalPoints: null,
            overOdds: null,
            underOdds: null,
            fetchedAt: new Date(),
        };
        for (const market of bookmaker.markets) {
            if (market.key === 'h2h') {
                // Moneyline
                for (const outcome of market.outcomes) {
                    if (outcome.name === 'home') {
                        result.moneylineHome = outcome.price;
                    }
                    else {
                        result.moneylineAway = outcome.price;
                    }
                }
            }
            else if (market.key === 'spreads') {
                // Point spread
                for (const outcome of market.outcomes) {
                    if (outcome.point !== undefined) {
                        // Assume first is home team
                        if (result.spreadHome === null) {
                            result.spreadHome = outcome.point;
                            result.spreadHomeOdds = outcome.price;
                        }
                        else {
                            result.spreadAwayOdds = outcome.price;
                        }
                    }
                }
            }
            else if (market.key === 'totals') {
                // Over/Under
                for (const outcome of market.outcomes) {
                    if (outcome.name.toLowerCase() === 'over') {
                        result.totalPoints = outcome.point ?? null;
                        result.overOdds = outcome.price;
                    }
                    else if (outcome.name.toLowerCase() === 'under') {
                        result.underOdds = outcome.price;
                    }
                }
            }
        }
        return result;
    }
}
