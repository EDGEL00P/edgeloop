import type { Team, Prediction, Exploit, Stats } from '@/types';

// Helper function to create dates relative to today
function getDaysFromNow(days: number, hour: number = 18): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export const teams: Record<string, Team> = {
  KC: { id: 'KC', name: 'Kansas City Chiefs', abbreviation: 'KC', color: '#E31837' },
  PHI: { id: 'PHI', name: 'Philadelphia Eagles', abbreviation: 'PHI', color: '#004C54' },
  DAL: { id: 'DAL', name: 'Dallas Cowboys', abbreviation: 'DAL', color: '#041E42' },
  GB: { id: 'GB', name: 'Green Bay Packers', abbreviation: 'GB', color: '#203731' },
  SF: { id: 'SF', name: 'San Francisco 49ers', abbreviation: 'SF', color: '#AA0000' },
  BUF: { id: 'BUF', name: 'Buffalo Bills', abbreviation: 'BUF', color: '#00338D' },
  CIN: { id: 'CIN', name: 'Cincinnati Bengals', abbreviation: 'CIN', color: '#FB4F14' },
  BAL: { id: 'BAL', name: 'Baltimore Ravens', abbreviation: 'BAL', color: '#241773' },
};

export const mockPredictions: Prediction[] = [
  {
    id: '1',
    gameId: 'game-1',
    homeTeam: teams.KC,
    awayTeam: teams.BUF,
    predictedSpread: -3.5,
    predictedTotal: 51.5,
    confidence: 'high',
    modelWinProbability: {
      home: 62.5,
      away: 37.5,
    },
    gameTime: getDaysFromNow(0, 18), // Today at 6 PM
  },
  {
    id: '2',
    gameId: 'game-2',
    homeTeam: teams.PHI,
    awayTeam: teams.SF,
    predictedSpread: -6.5,
    predictedTotal: 47.0,
    confidence: 'high',
    modelWinProbability: {
      home: 68.2,
      away: 31.8,
    },
    gameTime: getDaysFromNow(0, 21), // Today at 9 PM
  },
  {
    id: '3',
    gameId: 'game-3',
    homeTeam: teams.BAL,
    awayTeam: teams.CIN,
    predictedSpread: -2.0,
    predictedTotal: 49.5,
    confidence: 'medium',
    modelWinProbability: {
      home: 55.3,
      away: 44.7,
    },
    gameTime: getDaysFromNow(1, 13), // Tomorrow at 1 PM
  },
  {
    id: '4',
    gameId: 'game-4',
    homeTeam: teams.DAL,
    awayTeam: teams.GB,
    predictedSpread: -1.0,
    predictedTotal: 44.0,
    confidence: 'low',
    modelWinProbability: {
      home: 52.1,
      away: 47.9,
    },
    gameTime: getDaysFromNow(1, 16), // Tomorrow at 4 PM
  },
];

export const mockExploits: Exploit[] = [
  {
    id: '1',
    type: 'value',
    gameId: 'game-1',
    homeTeam: teams.KC,
    awayTeam: teams.BUF,
    description: 'KC -3.5 showing positive EV vs model prediction',
    expectedValue: 12.5,
    bookmaker: 'DraftKings',
    line: -3.5,
    odds: -110,
    confidence: 'high',
  },
  {
    id: '2',
    type: 'arbitrage',
    gameId: 'game-2',
    homeTeam: teams.PHI,
    awayTeam: teams.SF,
    description: 'Arbitrage opportunity on SF spread across books',
    expectedValue: 8.3,
    bookmaker: 'FanDuel vs BetMGM',
    line: 6.5,
    odds: 105,
    confidence: 'high',
  },
  {
    id: '3',
    type: 'middle',
    gameId: 'game-3',
    homeTeam: teams.BAL,
    awayTeam: teams.CIN,
    description: 'Middle opportunity on total (under 49.5 / over 47.5)',
    expectedValue: 15.2,
    bookmaker: 'Multiple',
    confidence: 'medium',
  },
  {
    id: '4',
    type: 'line',
    gameId: 'game-4',
    homeTeam: teams.DAL,
    awayTeam: teams.GB,
    description: 'Line movement suggests value on DAL',
    expectedValue: 6.1,
    bookmaker: 'Caesars',
    line: -1.0,
    odds: -105,
    confidence: 'medium',
  },
];

export const mockStats: Stats = {
  totalPredictions: 16,
  activeExploits: 12,
  averageEV: 9.7,
  winRate: 62.3,
};
