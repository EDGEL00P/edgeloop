export type SourceId =
  | "sportradar"
  | "espn"
  | "balldontlie"
  | "rapidapi"
  | "sportsdb"
  | "odds"
  | "weather"
  | "news"
  | "ai";

export const sources: Record<SourceId, { weight: number }> = {
  sportradar: { weight: 1.0 },
  espn: { weight: 0.85 },
  balldontlie: { weight: 0.8 },
  rapidapi: { weight: 0.7 },
  sportsdb: { weight: 0.5 },
  odds: { weight: 0.9 },
  weather: { weight: 0.8 },
  news: { weight: 0.6 },
  ai: { weight: 0.6 },
};
