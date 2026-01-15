import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  primaryColor: string;
  secondaryColor: string;
  offenseRating: number;
  defenseRating: number;
  pace: number;
  injuryImpact: number;
}

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  usageRate: number;
  targetsPerGame: number;
  carriesPerGame: number;
  epaContribution: number;
  propLean: string;
  propOdds: number;
  emergenceScore: number;
}

interface GameFuture {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  winProbHome: number;
  spread: number;
  spreadEdge: number;
  total: number;
  totalEdge: number;
  momentum: string;
  driveState: string;
  likelyScripts: string[];
  kickoff: string;
  week: number;
}

interface SGMLeg {
  id: string;
  gameId: string;
  description: string;
  odds: number;
  correlation: number;
  correlationNote: string;
  risk: string;
}

interface DataImport {
  id: string;
  filename: string;
  rows: number;
  columns: string[];
  lastUpdated: string;
  status: string;
}

// Teams
export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json() as Promise<Team[]>;
    },
  });
}

// Players
export function usePlayers() {
  return useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const response = await fetch('/api/players');
      if (!response.ok) throw new Error('Failed to fetch players');
      return response.json() as Promise<Player[]>;
    },
  });
}

// Game Futures
export function useGameFutures() {
  return useQuery({
    queryKey: ['game-futures'],
    queryFn: async () => {
      const response = await fetch('/api/game-futures');
      if (!response.ok) throw new Error('Failed to fetch game futures');
      return response.json() as Promise<GameFuture[]>;
    },
  });
}

// SGM Legs
export function useSGMLegs(gameId: string) {
  return useQuery({
    queryKey: ['sgm-legs', gameId],
    queryFn: async () => {
      const response = await fetch(`/api/sgm-legs/${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch SGM legs');
      return response.json() as Promise<SGMLeg[]>;
    },
  });
}

// Data Imports
export function useDataImports() {
  return useQuery({
    queryKey: ['data-imports'],
    queryFn: async () => {
      const response = await fetch('/api/data-imports');
      if (!response.ok) throw new Error('Failed to fetch data imports');
      return response.json() as Promise<DataImport[]>;
    },
  });
}

export function useCreateDataImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<DataImport, 'id' | 'lastUpdated'>) => {
      const response = await fetch('/api/data-imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id: `d${Date.now()}` }),
      });
      if (!response.ok) throw new Error('Failed to create data import');
      return response.json() as Promise<DataImport>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-imports'] });
    },
  });
}

export function useDeleteDataImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/data-imports/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete data import');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-imports'] });
    },
  });
}

interface WeeklyMetrics {
  id: string;
  week: number;
  season: number;
  teamId: number;
  epaPerPlay: number | null;
  successRate: number | null;
  cpoe: number | null;
  hdPressureRate: number | null;
  redZoneEpa: number | null;
  vigFreePercent: number | null;
  isLucky: boolean | null;
  injuryImpact: number | null;
  updatedAt: string;
}

interface ExploitSignal {
  id: string;
  week: number;
  season: number;
  gameId: number | null;
  signalType: string;
  description: string;
  confidence: number;
  status: string;
  thresholdMet: boolean | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface NflGame {
  id: number;
  date: string;
  season: number;
  week: number;
  status: string | null;
  homeTeamId: number;
  visitorTeamId: number;
  homeTeamScore: number | null;
  visitorTeamScore: number | null;
  venue: string | null;
  time: string | null;
  spread?: number;
  total?: number;
  isMock?: boolean;
}

interface NflTeam {
  id: number;
  conference: string;
  division: string;
  location: string;
  name: string;
  fullName: string;
  abbreviation: string;
}

export function useWeeklyMetrics(season: number, week: number) {
  return useQuery({
    queryKey: ['weekly-metrics', season, week],
    queryFn: async () => {
      const response = await fetch(`/api/metrics/${season}/${week}`);
      if (!response.ok) throw new Error('Failed to fetch weekly metrics');
      return response.json() as Promise<WeeklyMetrics[]>;
    },
  });
}

export function useExploitSignals(season: number, week: number) {
  return useQuery({
    queryKey: ['exploit-signals', season, week],
    queryFn: async () => {
      const response = await fetch(`/api/exploits/${season}/${week}`);
      if (!response.ok) throw new Error('Failed to fetch exploit signals');
      return response.json() as Promise<ExploitSignal[]>;
    },
  });
}

export function useNflGames(season: number, week: number) {
  return useQuery({
    queryKey: ['nfl-games', season, week],
    queryFn: async () => {
      const response = await fetch(`/api/nfl/games/week/${season}/${week}`);
      if (!response.ok) throw new Error('Failed to fetch NFL games');
      return response.json() as Promise<NflGame[]>;
    },
  });
}

export function useNflTeams() {
  return useQuery({
    queryKey: ['nfl-teams'],
    queryFn: async () => {
      const response = await fetch('/api/nfl/teams');
      if (!response.ok) throw new Error('Failed to fetch NFL teams');
      return response.json() as Promise<NflTeam[]>;
    },
  });
}

interface ChatMessage {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await fetch('/api/conversations');
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json() as Promise<Conversation[]>;
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title?: string) => {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || 'New Chat' }),
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      return response.json() as Promise<Conversation>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      onChunk,
    }: {
      conversationId: number;
      content: string;
      onChunk?: (chunk: string) => void;
    }) => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                onChunk?.(fullContent);
              }
              if (data.done) {
                return fullContent;
              }
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              // Skip non-JSON lines
            }
          }
        }
      }

      return fullContent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// AI Analysis Hooks
interface QuickAnalysisRequest {
  homeTeam: string;
  awayTeam: string;
  homeWinProb?: number;
  awayWinProb?: number;
  spread?: number;
  total?: number;
}

interface TeamAnalysisRequest {
  teamName: string;
  conference?: string;
  division?: string;
  wins?: number;
  losses?: number;
  pointsFor?: number;
  pointsAgainst?: number;
  streak?: string;
  playoffStatus?: string;
}

interface MatchupAnalysisRequest {
  homeTeam: string;
  awayTeam: string;
  homeRecord?: string;
  awayRecord?: string;
  spread?: number;
  total?: number;
  venue?: string;
}

export function useQuickAnalysis() {
  return useMutation({
    mutationFn: async (request: QuickAnalysisRequest) => {
      const response = await fetch('/api/ai/quick-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error('Failed to get quick analysis');
      return response.json() as Promise<{ analysis: string }>;
    },
  });
}

export function useTeamAnalysis() {
  return useMutation({
    mutationFn: async (request: TeamAnalysisRequest) => {
      const response = await fetch('/api/ai/team-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error('Failed to get team analysis');
      return response.json() as Promise<{ analysis: string }>;
    },
  });
}

export function useMatchupAnalysis() {
  return useMutation({
    mutationFn: async (request: MatchupAnalysisRequest) => {
      const response = await fetch('/api/ai/matchup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error('Failed to get matchup analysis');
      return response.json() as Promise<{ analysis: string }>;
    },
  });
}

// Singularity API hooks
interface SwarmAnalysisInput {
  homeTeam: string;
  awayTeam: string;
  spread: number;
  total: number;
}

interface AgentPrediction {
  agentName: string;
  predictedSpread: number;
  predictedTotal: number;
  homeWinProbability: number;
  confidence: number;
  reasoning: string;
  signals: Array<{
    type: string;
    description: string;
    confidence: number;
    recommendedAction: string;
    edge: number;
  }>;
}

interface MonteCarloResult {
  simulations: number;
  homeScoreDistribution: { mean: number; stdDev: number; min: number; max: number };
  awayScoreDistribution: { mean: number; stdDev: number; min: number; max: number };
  spreadDistribution: { mean: number; stdDev: number };
  totalDistribution: { mean: number; stdDev: number };
  homeWinProbability: number;
  spreadCoverProbability: number;
  overProbability: number;
  confidenceIntervals: {
    spread68: { lower: number; upper: number };
    spread95: { lower: number; upper: number };
    total68: { lower: number; upper: number };
    total95: { lower: number; upper: number };
  };
  uncertaintyBands: {
    spreadUncertainty: number;
    totalUncertainty: number;
    overallUncertainty: number;
  };
  scoreFrequencies: { home: number[]; away: number[] };
}

interface KellyRecommendation {
  betType: string;
  side: string;
  edge: number;
  impliedProbability: number;
  trueProbability: number;
  kellySizes: {
    quarter: number;
    half: number;
    full: number;
  };
  recommendedSize: string;
  recommendedUnits: number;
  evPerUnit: number;
  uncertaintyAdjustedEv: number;
  passesThreshold: boolean;
  reasoning: string;
}

interface ConsensusResult {
  predictedSpread: number;
  predictedTotal: number;
  homeWinProbability: number;
  spreadCoverProbability: number;
  overProbability: number;
  confidence: number;
  marketPrice: {
    fairSpread: number;
    fairTotal: number;
    spreadEdge: number;
    totalEdge: number;
  };
  agentWeights: Record<string, number>;
  agentContributions: AgentPrediction[];
}

interface SwarmAnalysisResult {
  homeTeam: string;
  awayTeam: string;
  timestamp: string;
  agents: AgentPrediction[];
  consensus: ConsensusResult;
  monteCarlo: MonteCarloResult;
  kellyRecommendations: KellyRecommendation[];
  exploitSignals: Array<{
    type: string;
    description: string;
    confidence: number;
    recommendedAction: string;
    edge: number;
  }>;
  overallConfidence: number;
  riskLevel: string;
}

export function useSwarmAnalysis() {
  return useMutation({
    mutationFn: async (input: SwarmAnalysisInput): Promise<SwarmAnalysisResult> => {
      const response = await fetch('/api/singularity/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to run swarm analysis');
      return response.json();
    },
  });
}

interface MonteCarloInput {
  homeExpectedPoints: number;
  awayExpectedPoints: number;
  spread: number;
  total: number;
  simulations?: number;
  variance?: number;
}

export function useMonteCarlo() {
  return useMutation({
    mutationFn: async (input: MonteCarloInput): Promise<MonteCarloResult> => {
      const response = await fetch('/api/singularity/monte-carlo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to run Monte Carlo simulation');
      return response.json();
    },
  });
}

interface KellyInput {
  trueProbability: number;
  odds: number;
  uncertainty?: number;
  bankroll?: number;
  uncertaintyThreshold?: number;
  betType?: string;
  side?: string;
}

export function useKellyCalculation() {
  return useMutation({
    mutationFn: async (input: KellyInput): Promise<KellyRecommendation> => {
      const response = await fetch('/api/singularity/kelly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to calculate Kelly criterion');
      return response.json();
    },
  });
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  windDirection: string;
  humidity: number;
  precipitation: number;
  condition: string;
  description: string;
  icon: string;
  isOutdoor: boolean;
  gameImpact: 'favorable' | 'moderate' | 'severe';
}

export interface BookmakerOdds {
  bookmaker: string;
  lastUpdate: string;
  markets: {
    spread?: { homeSpread: number; homePrice: number; awaySpread: number; awayPrice: number };
    totals?: { over: number; overPrice: number; under: number; underPrice: number };
    moneyline?: { homePrice: number; awayPrice: number };
  };
}

export interface GameOdds {
  gameId: string;
  sportKey: string;
  sportTitle: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  bookmakers: BookmakerOdds[];
  consensus: {
    spread: number;
    spreadPrice: number;
    total: number;
    totalPrice: number;
    homeMoneyline: number;
    awayMoneyline: number;
  } | null;
}

export interface OddsResponse {
  games: GameOdds[];
  remainingRequests: number | null;
  usedRequests: number | null;
}

export function useWeather(venue: string | null, enabled = true) {
  return useQuery({
    queryKey: ['weather', venue],
    queryFn: async () => {
      if (!venue) return null;
      const response = await fetch(`/api/weather/${encodeURIComponent(venue)}`);
      if (!response.ok) throw new Error('Failed to fetch weather');
      return response.json() as Promise<WeatherData>;
    },
    enabled: enabled && !!venue,
    staleTime: 60 * 60 * 1000,
  });
}

export function useGameWeather(gameId: number, enabled = true) {
  return useQuery({
    queryKey: ['game-weather', gameId],
    queryFn: async () => {
      const response = await fetch(`/api/weather/game/${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch game weather');
      return response.json() as Promise<WeatherData & { venue: string; gameId: number }>;
    },
    enabled,
    staleTime: 60 * 60 * 1000,
  });
}

export function useNflOdds(enabled = true) {
  return useQuery({
    queryKey: ['nfl-odds'],
    queryFn: async () => {
      const response = await fetch('/api/odds/nfl');
      if (!response.ok) throw new Error('Failed to fetch NFL odds');
      return response.json() as Promise<OddsResponse>;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGameOdds(homeTeam: string, awayTeam: string, enabled = true) {
  return useQuery({
    queryKey: ['game-odds', homeTeam, awayTeam],
    queryFn: async () => {
      const response = await fetch(`/api/odds/game?homeTeam=${encodeURIComponent(homeTeam)}&awayTeam=${encodeURIComponent(awayTeam)}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch game odds');
      }
      return response.json() as Promise<GameOdds>;
    },
    enabled: enabled && !!homeTeam && !!awayTeam,
    staleTime: 5 * 60 * 1000,
  });
}

export interface PlayerPropData {
  id: string;
  gameId: number;
  playerId: number;
  playerName: string;
  teamAbbreviation: string;
  position: string | null;
  propType: string;
  line: number;
  overOdds: number;
  underOdds: number;
  category: string;
}

export interface CorrelationLeg {
  id: string;
  description: string;
  player_id?: number;
  team?: string;
  stat_type: string;
  odds: number;
}

export interface CorrelationResult {
  is_positive_definite: boolean;
  sgm_adjustment: number;
  fair_odds_multiplier: number;
  leg_correlations: Array<{
    leg1: string;
    leg2: string;
    correlation: number;
  }>;
  eigenvalues: number[];
}

export interface KellyResult {
  full_kelly: number;
  half_kelly: number;
  quarter_kelly: number;
  recommended_stake: number;
  recommended_fraction: string;
  edge: number;
  edge_percent: string;
  implied_probability: number;
  true_probability: number;
  roi_expected: number;
  risk_of_ruin: number;
  is_approved: boolean;
  rejection_reason: string | null;
}

export function usePlayerProps(gameId: string) {
  return useQuery({
    queryKey: ['player-props', gameId],
    queryFn: async () => {
      const response = await fetch(`/api/player-props/${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch player props');
      return response.json() as Promise<PlayerPropData[]>;
    },
    enabled: !!gameId,
  });
}

export function useCorrelationAnalysis() {
  return useMutation({
    mutationFn: async (legs: CorrelationLeg[]): Promise<CorrelationResult> => {
      const response = await fetch('/api/singularity/correlation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legs }),
      });
      if (!response.ok) throw new Error('Failed to analyze correlation');
      return response.json();
    },
  });
}

export function useSGMKelly() {
  return useMutation({
    mutationFn: async (params: {
      true_probability: number;
      decimal_odds: number;
      confidence?: number;
      bankroll?: number;
    }): Promise<KellyResult> => {
      const response = await fetch('/api/singularity/kelly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          true_probability: params.true_probability,
          decimal_odds: params.decimal_odds,
          confidence: params.confidence ?? 0.7,
        }),
      });
      if (!response.ok) throw new Error('Failed to calculate Kelly');
      return response.json();
    },
  });
}
