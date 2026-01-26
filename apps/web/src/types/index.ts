export type Team = {
  id: string;
  name: string;
  abbreviation: string;
  color: string;
};

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type ExploitType = 'value' | 'arbitrage' | 'middle' | 'line';

export type Prediction = {
  id: string;
  gameId: string;
  homeTeam: Team;
  awayTeam: Team;
  predictedSpread: number;
  predictedTotal: number;
  confidence: ConfidenceLevel;
  modelWinProbability: {
    home: number;
    away: number;
  };
  gameTime: string;
};

export type Exploit = {
  id: string;
  type: ExploitType;
  gameId: string;
  homeTeam: Team;
  awayTeam: Team;
  description: string;
  expectedValue: number;
  bookmaker?: string;
  line?: number;
  odds?: number;
  confidence: ConfidenceLevel;
};

export type Stats = {
  totalPredictions: number;
  activeExploits: number;
  averageEV: number;
  winRate: number;
};
