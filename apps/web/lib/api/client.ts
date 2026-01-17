/**
 * API Client for Rust Backend (el-api)
 * 
 * Connects Next.js frontend to Rust HTTP server
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Health check
  async health() {
    return this.request<{ status: string; timestamp: string; version: string }>('/health');
  }

  // Kelly Calculator
  async calculateKelly(params: {
    probability: number;
    decimal_odds: number;
    bankroll: number;
  }) {
    return this.request<{
      kelly_fraction: number;
      recommended_stake: number;
      edge: number;
      is_positive_edge: boolean;
    }>('/api/v1/kelly', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async calculateQuarterKelly(params: {
    probability: number;
    decimal_odds: number;
    bankroll: number;
  }) {
    return this.request<{
      kelly_fraction: number;
      recommended_stake: number;
      edge: number;
      is_positive_edge: boolean;
    }>('/api/v1/kelly/quarter', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Predictions
  async getPrediction(gameId: string) {
    return this.request<{
      game_id: string;
      home_win_prob: number;
      predicted_spread: number;
      predicted_total: number;
      edge: number;
      confidence: number;
    }>(`/api/v1/predictions/${gameId}`);
  }

  async createPrediction(params: {
    game_id: string;
    home_team: string;
    away_team: string;
  }) {
    return this.request<{
      game_id: string;
      home_win_prob: number;
      predicted_spread: number;
      predicted_total: number;
      edge: number;
      confidence: number;
    }>('/api/v1/predictions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Genesis Prediction Engine
  async getGenesisPrediction(params: {
    home_team_id: number;
    away_team_id: number;
    season?: number;
    week?: number;
  }) {
    const query = new URLSearchParams();
    query.append('home_team_id', params.home_team_id.toString());
    query.append('away_team_id', params.away_team_id.toString());
    if (params.season) query.append('season', params.season.toString());
    if (params.week) query.append('week', params.week.toString());
    
    return this.request<{
      game_id: string;
      home_team_id: number;
      away_team_id: number;
      home_robustness: number;
      away_robustness: number;
      home_form: number;
      away_form: number;
      predicted_spread: number;
      confidence: number;
      recommendation: string;
      simulation: {
        home_score: number;
        away_score: number;
        home_yards: number;
        away_yards: number;
      };
      data_sources: {
        plays_analyzed: { home: number; away: number };
        games_analyzed: { home: number; away: number };
      };
    }>(`/api/v1/genesis/predict?${query.toString()}`);
  }

  // Odds Stream (SSE)
  subscribeToOdds(callback: (data: unknown) => void): EventSource {
    const eventSource = new EventSource(`${this.baseUrl}/api/v1/odds/stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error('Failed to parse odds update:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Odds stream error:', error);
    };

    return eventSource;
  }

  // BALLDONTLIE NFL API
  async getTeams(params?: { division?: string; conference?: string }) {
    const query = new URLSearchParams();
    if (params?.division) query.append('division', params.division);
    if (params?.conference) query.append('conference', params.conference);
    const queryString = query.toString();
    return this.request<{ data: any[]; meta?: any }>(
      `/api/v1/nfl/teams${queryString ? `?${queryString}` : ''}`
    );
  }

  async getTeam(teamId: number) {
    return this.request<{ data: any }>(`/api/v1/nfl/teams/${teamId}`);
  }

  async getPlayers(params?: {
    cursor?: number;
    per_page?: number;
    search?: string;
    team_ids?: number[];
  }) {
    const query = new URLSearchParams();
    if (params?.cursor) query.append('cursor', params.cursor.toString());
    if (params?.per_page) query.append('per_page', params.per_page.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.team_ids) query.append('team_ids', params.team_ids.join(','));
    const queryString = query.toString();
    return this.request<{ data: any[]; meta?: any }>(
      `/api/v1/nfl/players${queryString ? `?${queryString}` : ''}`
    );
  }

  async getGames(params?: {
    season?: number;
    week?: number;
    team_ids?: number[];
    cursor?: number;
    per_page?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.season) query.append('season', params.season.toString());
    if (params?.week) query.append('week', params.week.toString());
    if (params?.team_ids) query.append('team_ids', params.team_ids.join(','));
    if (params?.cursor) query.append('cursor', params.cursor.toString());
    if (params?.per_page) query.append('per_page', params.per_page.toString());
    const queryString = query.toString();
    return this.request<{ data: any[]; meta?: any }>(
      `/api/v1/nfl/games${queryString ? `?${queryString}` : ''}`
    );
  }

  async getOdds(params?: {
    season?: number;
    week?: number;
    game_ids?: number[];
  }) {
    const query = new URLSearchParams();
    if (params?.season) query.append('season', params.season.toString());
    if (params?.week) query.append('week', params.week.toString());
    if (params?.game_ids) query.append('game_ids', params.game_ids.join(','));
    const queryString = query.toString();
    return this.request<{ data: any[]; meta?: any }>(
      `/api/v1/nfl/odds${queryString ? `?${queryString}` : ''}`
    );
  }

  // Tinybird Odds API (via Next.js route)
  async getOddsViaTinybird(params: {
    game_id: string;
    book?: string;
  }) {
    const query = new URLSearchParams();
    query.append('game_id', params.game_id);
    if (params.book) query.append('book', params.book);
    
    // Call Next.js API route (which proxies to Tinybird)
    const response = await fetch(`/api/odds/tinybird?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`Tinybird odds request failed: ${response.statusText}`);
    }
    return response.json() as Promise<{ data: any[]; cached: boolean }>;
  }

  // Genesis Prediction with A/B Testing (via Next.js route)
  async getGenesisPredictionWithABTest(params: {
    home_team_id: number;
    away_team_id: number;
    season?: number;
    week?: number;
    user_id?: string;
  }) {
    const query = new URLSearchParams();
    query.append('home_team_id', params.home_team_id.toString());
    query.append('away_team_id', params.away_team_id.toString());
    if (params.season) query.append('season', params.season.toString());
    if (params.week) query.append('week', params.week.toString());
    if (params.user_id) query.append('user_id', params.user_id);
    
    const response = await fetch(`/api/predictions/genesis?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`Genesis prediction request failed: ${response.statusText}`);
    }
    return response.json() as Promise<{
      game_id: string;
      home_team_id: number;
      away_team_id: number;
      predicted_spread: number;
      confidence: number;
      recommendation: string;
      algorithm: string;
      cached: boolean;
    }>;
  }

  // Send Prediction Alert
  async sendPredictionAlert(params: {
    email: string;
    gameInfo: {
      homeTeam: string;
      awayTeam: string;
      prediction: string;
      confidence: number;
      edge: number;
    };
  }) {
    const response = await fetch('/api/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error(`Alert request failed: ${response.statusText}`);
    }
    return response.json() as Promise<{ success: boolean; messageId?: string }>;
  }
}

// Singleton instance
export const apiClient = new ApiClient();
