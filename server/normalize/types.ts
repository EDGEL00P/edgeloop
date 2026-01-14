export type NormalizedGame = {
  key: string; // derived matchup key
  sourceGameId?: string;
  source: string;
  season: number;
  week: number;
  scheduled?: string; // ISO
  homeAbbr?: string;
  awayAbbr?: string;
  homeName?: string;
  awayName?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status?: string;
};
