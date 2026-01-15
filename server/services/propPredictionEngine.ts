import { db } from "../db";
import { nflPlayers, nflTeams, weeklyMetrics, historicalGames } from "@shared/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { CacheService, CacheKeys, CacheTTL } from "../infrastructure/redis";
import * as ss from "simple-statistics";

export interface PlayerPropPrediction {
  playerId: number;
  playerName: string;
  team: string;
  position: string;
  propType: string;
  
  predictedLine: number;
  actualLine: number;
  overProbability: number;
  underProbability: number;
  edge: number;
  confidence: number;
  
  historicalAverage: number;
  recentAverage: number;
  trend: number;
  
  matchupFactors: {
    opponentDefensiveRank: number;
    paceMatchup: number;
    weatherImpact: number;
    injuryImpact: number;
  };
  
  modelContributions: {
    historicalModel: number;
    recentFormModel: number;
    matchupModel: number;
    weatherModel: number;
  };
  
  recommendation: "over" | "under" | "pass";
  kellyFraction: number;
  stakeRecommendation: number;
}

export interface SGMLeg {
  id: string;
  playerId: number;
  playerName: string;
  team: string;
  propType: string;
  selection: "over" | "under";
  line: number;
  odds: number;
  probability: number;
  edge: number;
  confidence: number;
}

export interface SGMRecommendation {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  legs: SGMLeg[];
  totalOdds: number;
  totalProbability: number;
  totalEdge: number;
  overallConfidence: number;
  correlationAdjustment: number;
  
  kellyResult: {
    quarterKelly: number;
    halfKelly: number;
    fullKelly: number;
    recommendedFraction: string;
    isApproved: boolean;
    rejectionReason?: string;
  };
  
  winScenarios: {
    scenarios: number;
    expectedWins: number;
    probabilityDistribution: number[];
  };
  
  riskScore: number;
  recommendationRating: "strong" | "moderate" | "weak" | "pass";
}

interface HistoricalProjection {
  average: number;
  stdDev: number;
  samples: number;
}

interface RecentForm {
  average: number;
  trend: number;
}

interface MatchupFactors {
  opponentDefensiveRank: number;
  paceMatchup: number;
  weatherImpact: number;
  injuryImpact: number;
  trend: number;
}

interface WeatherImpact {
  value: number;
  direction: number;
}

interface WeeklyMetricLike {
  epaPerPlay?: number | null;
}

interface PlayerLike {
  id: number;
  teamId?: number | null;
}

export class PropPredictionEngine {
  private readonly PROP_TYPES = {
    passing_yards: { baseLine: 275, stdDev: 45 },
    passing_tds: { baseLine: 1.5, stdDev: 0.8 },
    completions: { baseLine: 22, stdDev: 5 },
    interceptions: { baseLine: 0.5, stdDev: 0.4 },
    rushing_yards: { baseLine: 65, stdDev: 35 },
    rushing_tds: { baseLine: 0.5, stdDev: 0.4 },
    receiving_yards: { baseLine: 75, stdDev: 40 },
    receptions: { baseLine: 5.5, stdDev: 3 },
    receiving_tds: { baseLine: 0.5, stdDev: 0.4 },
    touchdowns: { baseLine: 0.5, stdDev: 0.4 },
    tackles: { baseLine: 5, stdDev: 3 },
    sacks: { baseLine: 0.5, stdDev: 0.4 },
    assists: { baseLine: 3, stdDev: 2 },
  };

  async predictPlayerProp(
    playerId: number,
    propType: string,
    season: number = 2024
  ): Promise<PlayerPropPrediction> {
    const cacheKey = CacheKeys.playerStats(`${playerId}:${propType}`, season);
    
    return CacheService.getOrSet(cacheKey, async () => {
      const player = await db.query.nflPlayers.findFirst({
        where: eq(nflPlayers.id, playerId)
      });
      
      if (!player) throw new Error(`Player ${playerId} not found`);
      
      const playerTeam = await db.query.nflTeams.findFirst({
        where: eq(nflTeams.id, player.teamId || 0)
      });
      
      const metrics = await db.query.weeklyMetrics.findMany({
        where: and(
          eq(weeklyMetrics.teamId, player.teamId || 0),
          eq(weeklyMetrics.season, season)
        ),
        orderBy: [desc(weeklyMetrics.week)],
        limit: 8
      });
      
      const propConfig = this.PROP_TYPES[propType as keyof typeof this.PROP_TYPES];
      if (!propConfig) throw new Error(`Unknown prop type: ${propType}`);
      
      const historicalData = this.getHistoricalProjection(playerId, propType, propConfig);
      const recentForm = this.calculateRecentForm(metrics);
      const matchupFactors = await this.calculateMatchupFactors(player, propType);
      const weatherImpact = await this.getWeatherImpact(playerTeam?.id || 0);
      
      const prediction = this.combineModels(
        historicalData,
        recentForm,
        matchupFactors,
        weatherImpact
      );
      
      const edge = this.calculateEdge(prediction.probability, -110);
      const confidence = this.calculateConfidence(
        historicalData,
        recentForm,
        matchupFactors
      );
      
      return {
        playerId,
        playerName: `${player.firstName} ${player.lastName}`,
        team: playerTeam?.abbreviation || "UNK",
        position: player.position || "UNK",
        propType,
        predictedLine: prediction.predictedLine,
        actualLine: propConfig.baseLine,
        overProbability: prediction.probability,
        underProbability: 1 - prediction.probability,
        edge,
        confidence,
        historicalAverage: historicalData.average,
        recentAverage: recentForm.average,
        trend: recentForm.trend,
        matchupFactors,
        modelContributions: {
          historicalModel: 0.35,
          recentFormModel: 0.35,
          matchupModel: 0.20,
          weatherModel: 0.10
        },
        recommendation: edge > 0.02 ? "over" : edge < -0.02 ? "under" : "pass",
        kellyFraction: Math.max(0, edge * 0.25),
        stakeRecommendation: 0
      };
    }, CacheTTL.HOUR);
  }

  async generateSGMRecommendations(
    gameId: string,
    season: number,
    week: number
  ): Promise<SGMRecommendation[]> {
    const cacheKey = CacheKeys.sgmOptimizer(gameId);
    
    const result = await CacheService.getOrSet(cacheKey, async () => {
      const game = await db.query.historicalGames.findFirst({
        where: eq(historicalGames.id, gameId)
      });
      
      if (!game) throw new Error(`Game ${gameId} not found`);
      
      const homeTeam = await db.query.nflTeams.findFirst({
        where: eq(nflTeams.abbreviation, game.homeTeam)
      });
      
      const awayTeam = await db.query.nflTeams.findFirst({
        where: eq(nflTeams.abbreviation, game.awayTeam)
      });
      
      const players = await db.query.nflPlayers.findMany({
        where: sql`${nflPlayers.teamId} IN (${homeTeam?.id}, ${awayTeam?.id})`
      });
      
      const propPredictions = await Promise.all(
        players.slice(0, 20).map(player => 
          this.predictPlayerProp(player.id, "passing_yards", season).catch(() => null)
        )
      );
      
      const validPredictions = propPredictions.filter((p): p is PlayerPropPrediction => p !== null);
      
      const recommendedLegs = validPredictions
        .filter(p => p.confidence > 0.60 && p.edge > 0)
        .sort((a, b) => b.edge - a.edge)
        .slice(0, 6);
      
      const legs: SGMLeg[] = recommendedLegs.map((pred, idx) => ({
        id: `${gameId}-leg-${idx}`,
        playerId: pred.playerId,
        playerName: pred.playerName,
        team: pred.team,
        propType: pred.propType,
        selection: pred.recommendation as "over" | "under",
        line: pred.predictedLine,
        odds: -110,
        probability: pred.overProbability,
        edge: pred.edge,
        confidence: pred.confidence
      }));
      
      const totalOdds = this.calculateParlayOdds(legs.map(l => l.odds));
      const totalProbability = legs.reduce((prod, l) => prod * l.probability, 1);
      const totalEdge = this.calculateParlayEdge(totalProbability, totalOdds);
      
      const correlationAdjustment = this.calculateCorrelationAdjustment(legs);
      const kellyResult = this.calculateKelly(totalProbability, totalOdds);
      
      const overallConfidence = legs.reduce((sum, l) => sum + l.confidence, 0) / legs.length;
      const riskScore = this.calculateRiskScore(legs, correlationAdjustment);
      
      const recommendationRating = this.getRecommendationRating(
        totalEdge,
        overallConfidence,
        riskScore,
        legs.length
      );
      
      return {
        gameId,
        homeTeam: homeTeam?.abbreviation || "UNK",
        awayTeam: awayTeam?.abbreviation || "UNK",
        legs,
        totalOdds,
        totalProbability,
        totalEdge,
        overallConfidence,
        correlationAdjustment,
        kellyResult,
        winScenarios: {
          scenarios: Math.pow(2, legs.length),
          expectedWins: legs.reduce((sum, l) => sum + l.probability, 0),
          probabilityDistribution: this.getProbabilityDistribution(legs)
        },
        riskScore,
        recommendationRating
      };
    }, CacheTTL.HOUR);

    return result ? [result] : [];
  }

  async getWeeklyAutoPicks(season: number, week: number): Promise<{
    singleProps: PlayerPropPrediction[];
    sgmRecommendations: SGMRecommendation[];
    summary: {
      totalAnalyzed: number;
      highConfidenceHits: number;
      recommendedBets: number;
      expectedValue: number;
    };
  }> {
    const cacheKey = CacheKeys.weeklyRecs(season, week);
    
    return CacheService.getOrSet(cacheKey, async () => {
      const games = await db.query.historicalGames.findMany({
        where: and(
          eq(historicalGames.season, season),
          eq(historicalGames.week, week.toString())
        )
      });
      
      const allProps: PlayerPropPrediction[] = [];
      const allSGMs: SGMRecommendation[] = [];
      
      for (const game of games.slice(0, 5)) {
        try {
          const sgms = await this.generateSGMRecommendations(game.id, season, week);
          allSGMs.push(...sgms);
        } catch (e) {
          console.error(`Error generating SGM for ${game.id}:`, e);
        }
      }
      
      const singleProps = allSGMs
        .flatMap(sgm => sgm.legs)
        .map(leg => ({
          playerId: leg.playerId,
          playerName: leg.playerName,
          team: leg.team,
          position: "WR",
          propType: leg.propType,
          predictedLine: leg.line,
          actualLine: leg.line,
          overProbability: leg.probability,
          underProbability: 1 - leg.probability,
          edge: leg.edge,
          confidence: leg.confidence,
          historicalAverage: leg.line,
          recentAverage: leg.line,
          trend: 0,
          matchupFactors: {
            opponentDefensiveRank: 16,
            paceMatchup: 0.5,
            weatherImpact: 0,
            injuryImpact: 0
          },
          modelContributions: {
            historicalModel: 0.33,
            recentFormModel: 0.33,
            matchupModel: 0.34,
            weatherModel: 0
          },
          recommendation: (leg.edge > 0 ? "over" : "under") as "over" | "under" | "pass",
          kellyFraction: leg.edge * 0.25,
          stakeRecommendation: 0
        }))
        .filter(p => p.confidence > 0.65 && p.edge > 0.01)
        .sort((a, b) => b.edge - a.edge);
      
      const highConfidenceHits = singleProps.filter(p => p.confidence > 0.70).length;
      const recommendedBets = singleProps.length;
      const expectedValue = singleProps.reduce((sum, p) => sum + p.edge, 0);
      
      return {
        singleProps,
        sgmRecommendations: allSGMs,
        summary: {
          totalAnalyzed: allProps.length,
          highConfidenceHits,
          recommendedBets,
          expectedValue
        }
      };
    }, CacheTTL.DAY);
  }

  private getHistoricalProjection(playerId: number, propType: string, config: { baseLine: number; stdDev: number }) {
    return {
      average: config.baseLine + (Math.random() - 0.5) * 20,
      stdDev: config.stdDev,
      samples: 8 + Math.floor(Math.random() * 8)
    };
  }

  private calculateRecentForm(metrics: WeeklyMetricLike[]): RecentForm {
    if (metrics.length === 0) {
      return { average: 65, trend: 0 };
    }
    
    const values = metrics.map(m => (m.epaPerPlay || 0) * 100 + 50);
    const recent = values.slice(0, 4);
    const older = values.slice(4);
    
    const recentAvg = recent.length > 0 ? ss.mean(recent) : 65;
    const olderAvg = older.length > 0 ? ss.mean(older) : 65;
    
    return {
      average: recentAvg,
      trend: (recentAvg - olderAvg) / olderAvg
    };
  }

  private async calculateMatchupFactors(_player: PlayerLike, _propType: string): Promise<MatchupFactors> {
    return {
      opponentDefensiveRank: 10 + Math.floor(Math.random() * 20),
      paceMatchup: 0.3 + Math.random() * 0.4,
      weatherImpact: 0,
      injuryImpact: 0,
      trend: 0,
    };
  }

  private async getWeatherImpact(_teamId: number): Promise<WeatherImpact> {
    return { value: 0, direction: 1 };
  }

  private combineModels(
    historical: HistoricalProjection,
    recent: RecentForm,
    matchup: MatchupFactors,
    weather: WeatherImpact
  ) {
    const predictedLine = historical.average * 0.35 + 
                          recent.average * 0.35 + 
                          historical.average * (1 + matchup.trend) * 0.20 +
                          historical.average * weather.value * 0.10;
    
    const rawProb = 0.5 + (predictedLine - historical.average) / (historical.stdDev * 2);
    const probability = Math.max(0.25, Math.min(0.75, rawProb));
    
    return { predictedLine, probability };
  }

  private calculateEdge(probability: number, odds: number) {
    const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
    return (probability * decimalOdds) - 1;
  }

  private calculateConfidence(
    historical: HistoricalProjection,
    recent: RecentForm,
    matchup: MatchupFactors
  ) {
    const sampleBonus = Math.min(historical.samples / 16, 0.15);
    const trendBonus = Math.abs(recent.trend) * 0.1;
    const base = 0.50;
    
    return Math.min(0.90, base + sampleBonus + trendBonus + matchup.paceMatchup * 0.1);
  }

  private calculateParlayOdds(americanOdds: number[]): number {
    const decimalOdds = americanOdds.map(odds => 
      odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1
    );
    return decimalOdds.reduce((prod, odds) => prod * odds, 1);
  }

  private calculateParlayEdge(probability: number, decimalOdds: number): number {
    return (probability * decimalOdds) - 1;
  }

  private calculateCorrelationAdjustment(legs: SGMLeg[]): number {
    if (legs.length < 2) return 1.0;
    
    const positiveCorrelations = legs.filter(l => 
      l.propType.includes("passing") || l.propType.includes("receiving")
    ).length;
    
    const negativeCorrelations = legs.filter(l => 
      l.propType.includes("rushing") || l.propType.includes("defense")
    ).length;
    
    if (positiveCorrelations > 1 && negativeCorrelations === 0) {
      return 1.15;
    }
    if (negativeCorrelations > 1 && positiveCorrelations === 0) {
      return 0.90;
    }
    
    return 1.05;
  }

  private calculateKelly(probability: number, decimalOdds: number) {
    const b = decimalOdds - 1;
    const p = probability;
    const q = 1 - p;
    const kellyFraction = (b * p - q) / b;
    const quarterKelly = Math.max(0, kellyFraction * 0.25);
    const halfKelly = Math.max(0, kellyFraction * 0.50);
    const fullKelly = Math.max(0, kellyFraction);
    
    const isApproved = kellyFraction > 0 && kellyFraction < 0.25;
    const rejectionReason = !isApproved 
      ? kellyFraction <= 0 
        ? "Negative expected value"
        : "Kelly fraction exceeds maximum recommendation (25%)"
      : undefined;
    
    return {
      quarterKelly,
      halfKelly,
      fullKelly,
      recommendedFraction: kellyFraction > 0.15 ? "quarter" : kellyFraction > 0.08 ? "half" : "full",
      isApproved,
      rejectionReason
    };
  }

  private getProbabilityDistribution(legs: SGMLeg[]): number[] {
    const distribution: number[] = [];
    const totalScenarios = Math.pow(2, legs.length);
    
    for (let wins = 0; wins <= legs.length; wins++) {
      let probability = 0;
      
      for (const combo of this.getCombinations(legs.length, wins)) {
        let prob = 1;
        for (let i = 0; i < legs.length; i++) {
          prob *= combo[i] ? legs[i].probability : (1 - legs[i].probability);
        }
        probability += prob;
      }
      
      distribution.push(probability);
    }
    
    return distribution;
  }

  private getCombinations(n: number, k: number): boolean[][] {
    const result: boolean[][] = [];
    const indices = this.getIndices(n, k);
    
    for (const idx of indices) {
      const combo: boolean[] = Array(n).fill(false);
      for (const i of idx) {
        combo[i] = true;
      }
      result.push(combo);
    }
    
    return result;
  }

  private getIndices(n: number, k: number): number[][] {
    if (k === 0) return [[]];
    if (k === n) return [Array.from({length: n}, (_, i) => i)];
    
    const result: number[][] = [];
    const first = this.getIndices(n - 1, k - 1);
    const rest = this.getIndices(n - 1, k);
    
    for (const idx of first) {
      result.push([n - 1, ...idx]);
    }
    for (const idx of rest) {
      result.push(idx);
    }
    
    return result;
  }

  private calculateRiskScore(legs: SGMLeg[], correlationAdjustment: number): number {
    const edgeVariance = ss.variance(legs.map(l => l.edge));
    const avgConfidence = legs.reduce((sum, l) => sum + l.confidence, 0) / legs.length;
    const correlationPenalty = correlationAdjustment > 1.1 ? 0.2 : 0;
    
    return Math.min(1, (1 - avgConfidence) * 0.5 + edgeVariance * 2 + correlationPenalty);
  }

  private getRecommendationRating(
    edge: number,
    confidence: number,
    risk: number,
    legCount: number
  ): "strong" | "moderate" | "weak" | "pass" {
    const score = edge * 2 + confidence * 0.5 - risk * 0.3;
    
    if (legCount > 4 && edge > 0.15 && confidence > 0.75 && risk < 0.4) return "strong";
    if (edge > 0.08 && confidence > 0.65 && risk < 0.6) return "moderate";
    if (edge > 0 && confidence > 0.55) return "weak";
    return "pass";
  }
}

export const propPredictionEngine = new PropPredictionEngine();
