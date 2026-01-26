import { z } from 'zod';
const BASE = process.env.BALLDONTLIE_API_BASE ?? 'https://api.balldontlie.io';
const KEY = process.env.BALLDONTLIE_API_KEY;
// DTOs based on actual API response structure
export const BdlTeam = z.object({
    id: z.number(),
    conference: z.string().nullable(),
    division: z.string().nullable(),
    location: z.string(),
    name: z.string(),
    full_name: z.string(),
    abbreviation: z.string(),
});
export const BdlGame = z.object({
    id: z.number(),
    season: z.number(),
    week: z.number(),
    start_time: z.string(),
    home_team_id: z.number(),
    away_team_id: z.number(),
    status: z.enum(['scheduled', 'in_progress', 'final']),
});
export const BdlOdds = z.object({
    id: z.number(),
    game_id: z.number(),
    vendor: z.string(),
    spread_home_value: z.string().nullable(),
    spread_home_odds: z.number().nullable(),
    spread_away_value: z.string().nullable(),
    spread_away_odds: z.number().nullable(),
    moneyline_home_odds: z.number().nullable(),
    moneyline_away_odds: z.number().nullable(),
    total_value: z.string().nullable(),
    total_over_odds: z.number().nullable(),
    total_under_odds: z.number().nullable(),
    updated_at: z.string(),
});
export async function bdl(path, init = {}) {
    const res = await fetch(`${BASE}${path}`, {
        ...init,
        headers: {
            ...(init.headers || {}),
            Authorization: KEY,
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) {
        throw new Error(`BDL ${res.status}: ${res.statusText}`);
    }
    return res.json();
}
export async function* paginate(path, perPage = 100) {
    let cursor = null;
    let hasMore = true;
    while (hasMore) {
        const url = new URL(`${BASE}${path}`);
        if (cursor !== null)
            url.searchParams.set('cursor', String(cursor));
        url.searchParams.set('per_page', String(Math.min(perPage, 100))); // Max 100 per API
        const res = await fetch(url, {
            headers: {
                Authorization: KEY,
                'Content-Type': 'application/json',
            },
        });
        if (!res.ok) {
            throw new Error(`BDL ${res.status}: ${res.statusText}`);
        }
        const data = (await res.json());
        for (const row of data.data) {
            yield row;
        }
        cursor = data.meta?.next_cursor ?? null;
        hasMore = cursor !== null && data.data.length > 0;
    }
}
// Convenience methods using correct API paths
export async function getAllTeams() {
    const teams = [];
    for await (const team of paginate('/nfl/v1/teams')) {
        teams.push(BdlTeam.parse(team));
    }
    return teams;
}
export async function getGames(params) {
    const url = new URL(`${BASE}/nfl/v1/games`);
    if (params.season)
        url.searchParams.set('season', String(params.season));
    if (params.week)
        url.searchParams.set('week', String(params.week));
    if (params.teamIds?.length) {
        params.teamIds.forEach((id) => url.searchParams.append('team_ids[]', String(id)));
    }
    url.searchParams.set('per_page', '100');
    const res = await fetch(url, {
        headers: {
            Authorization: KEY,
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) {
        throw new Error(`BDL games ${res.status}`);
    }
    const data = (await res.json());
    return data.data.map((g) => BdlGame.parse(g));
}
export async function getInjuries(params) {
    const url = new URL(`${BASE}/nfl/v1/injuries`);
    if (params.team)
        url.searchParams.set('team', params.team);
    if (params.season)
        url.searchParams.set('season', String(params.season));
    url.searchParams.set('per_page', '100');
    const res = await fetch(url, {
        headers: {
            Authorization: KEY,
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) {
        throw new Error(`BDL injuries ${res.status}`);
    }
    const data = (await res.json());
    return data.data;
}
export async function getRoster(params) {
    const url = new URL(`${BASE}/nfl/v1/rosters`);
    if (params.team)
        url.searchParams.set('team', params.team);
    if (params.season)
        url.searchParams.set('season', String(params.season));
    url.searchParams.set('per_page', '100');
    const res = await fetch(url, {
        headers: {
            Authorization: KEY,
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) {
        throw new Error(`BDL roster ${res.status}`);
    }
    const data = (await res.json());
    return data.data;
}
export async function getOdds(params) {
    const url = new URL(`${BASE}/nfl/v1/odds`);
    if (params.season)
        url.searchParams.set('season', String(params.season));
    if (params.week)
        url.searchParams.set('week', String(params.week));
    if (params.gameIds?.length) {
        params.gameIds.forEach((id) => url.searchParams.append('game_ids[]', String(id)));
    }
    url.searchParams.set('per_page', '100');
    const res = await fetch(url, {
        headers: {
            Authorization: KEY,
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) {
        throw new Error(`BDL odds ${res.status}`);
    }
    const data = (await res.json());
    return data.data.map((o) => BdlOdds.parse(o));
}
