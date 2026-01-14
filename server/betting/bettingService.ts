import { db } from "../db";
import { historicalGames, weeklyMetrics, nflTeams, nflPlayers } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";
import { marketComparator, MarketOdds, ModelProbability, BettingEdge } from "./marketComparator";
import { clvTracker, BetRecord, CLVMetrics } from "./clvTracker";
import { kellyCalculator, KellyResult } from "./kellyCalculator";
import { bettingModelPredictor, ModelPrediction } from "./modelPredictor";
import { featureEngineer, MatchupFeatures } from "./featureEngineering";

export interface SingularityExploit {
  gameId: number;
  exploitType: "opening_line" | "injury" | "weather" | "schematic" | "market_overreaction";
  selection: "home" | "away" | "over" | "under";
  edge: number;
  confidence: number;
  timestamp: Date;
  reason: string;
}

export interface BettingAnalysis {
  gameId: number;
  homeTeam: string;
  awayTeam: string;

  modelPrediction: ModelPrediction;
  marketComparison: BettingEdge[];
  recommendedBet?: BettingEdge;
  kellyResult?: KellyResult;
  clvProjection?: number;

  exploitOpportunities: SingularityExploit[];
  riskAssessment: {
    modelAgreement: number;
    injuryUncertainty: number;
    weatherVariance: number;
    sampleSize: number;
  };

  recommendation: {
    action: "bet" | "no_bet" | "pass";
    confidence: number;
    reason: string;
  };
}

export class BettingService {
  async analyzeGame(
    gameId: number,
    homeTeamId: number,
    awayTeamId: number,
    season: number,
    week: number,
    marketOdds: MarketOdds,
    weather?: any,
    injuries?: any[]
  ): Promise<BettingAnalysis> {
    try {
      const prediction = await bettingModelPredictor.predictGame(
        gameId,
        homeTeamId,
        awayTeamId,
        season,
        week,
        weather,
        injuries
      );

      const modelProbability: ModelProbability = {
        gameId: prediction.gameId,
        homeWinProbability: prediction.homeWinProbability,
        awayWinProbability: prediction.awayWinProbability,
        spreadPrediction: prediction.spreadPrediction,
        totalPrediction: prediction.totalPrediction,
        overProbability: prediction.overProbability,
        underProbability: prediction.underProbability,
        confidence: prediction.spreadConfidence,
        modelVersion: "v1.0"
      };

      const marketComparison = marketComparator.compareModelToMarket(
        modelProbability,
        marketOdds
      );

      const recommendedBets = marketComparison.filter(edge => edge.edge >= 0.03);

      const exploitOpportunities = await this.identifyExploits(
        gameId,
        prediction,
        marketOdds,
        weather,
        injuries
      );

      const riskAssessment = {
        modelAgreement: prediction.riskFactors.modelDisagreement,
        injuryUncertainty: prediction.riskFactors.injuryUncertainty,
        weatherVariance: weather ? (weather.windSpeed || 0) / 20 : 0,
        sampleSize: 0
      };

      const recommendation = this.generateRecommendation(
        recommendedBets,
        exploitOpportunities,
        prediction,
        riskAssessment
      );

      let kellyResult: KellyResult | undefined;
      if (recommendedBets.length > 0) {
        const bestBet = recommendedBets.sort((a, b) => b.edge - a.edge)[0];
        const bankroll = 10000;
        kellyResult = kellyCalculator.calculateKellyForEdge(
          bestBet,
          bankroll
        );
      }

      return {
        gameId,
        homeTeam: prediction.homeTeam,
        awayTeam: prediction.awayTeam,

        modelPrediction: prediction,
        marketComparison,
        recommendedBet: recommendedBets.length > 0
          ? recommendedBets.sort((a, b) => b.edge - a.edge)[0]
          : undefined,
        kellyResult,
        clvProjection: undefined,

        exploitOpportunities,
        riskAssessment,
        recommendation
      };
    } catch (error) {
      console.error(`Error analyzing game ${gameId}:`, error);
      throw error;
    }
  }

  private async identifyExploits(
    gameId: number,
    prediction: ModelPrediction,
    marketOdds: MarketOdds,
    weather?: any,
    injuries?: any[]
  ): Promise<SingularityExploit[]> {
    const exploits: SingularityExploit[] = [];

    const openingLineExploit = marketComparator.findOpeningLineExploits(
      {
        gameId: prediction.gameId,
        homeWinProbability: prediction.homeWinProbability,
        awayWinProbability: prediction.awayWinProbability,
        spreadPrediction: prediction.spreadPrediction,
        totalPrediction: prediction.totalPrediction,
        overProbability: prediction.overProbability,
        underProbability: prediction.underProbability,
        confidence: prediction.spreadConfidence,
        modelVersion: "v1.0"
      },
      marketOdds
    );

    for (const edge of openingLineExploit) {
      exploits.push({
        gameId,
        exploitType: "opening_line" as const,
        selection: edge.selection,
        edge: edge.edge,
        confidence: edge.confidence,
        timestamp: edge.timestamp,
        reason: edge.reason
      });
    }

    if (weather && (weather.windSpeed > 15 || weather.temperature < 32 || weather.temperature > 90)) {
      exploits.push({
        gameId,
        exploitType: "weather",
        selection: "under",
        edge: 0.04,
        confidence: 0.7,
        timestamp: new Date(),
        reason: `Extreme weather: ${weather.windSpeed}mph wind, ${weather.temperature}°F temp`
      });
    }

    if (injuries && injuries.length > 2) {
      exploits.push({
        gameId,
        exploitType: "injury",
        selection: marketOdds.currentSpread > 0 ? "away" : "home",
        edge: 0.05,
        confidence: 0.75,
        timestamp: new Date(),
        reason: `${injuries.length} key injuries detected`
      });
    }

    const matchupFeatures = await featureEngineer.buildMatchupFeatures(
      gameId,
      prediction.homeTeamId,
      prediction.awayTeamId,
      2024
    );

    if (matchupFeatures) {
      const epaDiff = Math.abs(
        matchupFeatures.teamDifferentialMetrics.epaPerPlayDiff
      );

      if (epaDiff > 0.2) {
        exploits.push({
          gameId,
          exploitType: "schematic",
          selection: prediction.homeWinProbability > 0.5 ? "home" : "away",
          edge: 0.035,
          confidence: 0.65,
          timestamp: new Date(),
          reason: `Significant EPA differential: ${epaDiff.toFixed(2)}`
        });
      }
    }

    const marketOverreaction = marketComparator.identifyMarketOverreaction(
      {
        gameId: prediction.gameId,
        homeWinProbability: prediction.homeWinProbability,
        awayWinProbability: prediction.awayWinProbability,
        spreadPrediction: prediction.spreadPrediction,
        totalPrediction: prediction.totalPrediction,
        overProbability: prediction.overProbability,
        underProbability: prediction.underProbability,
        confidence: prediction.spreadConfidence,
        modelVersion: "v1.0"
      },
      marketOdds,
      []
    );

    if (marketOverreaction) {
      exploits.push({
        gameId,
        exploitType: "market_overreaction" as const,
        selection: marketOverreaction.selection,
        edge: marketOverreaction.edge,
        confidence: marketOverreaction.confidence,
        timestamp: marketOverreaction.timestamp,
        reason: marketOverreaction.reason
      });
    }

    return exploits;
  }

  private generateRecommendation(
    recommendedBets: BettingEdge[],
    exploits: SingularityExploit[],
    prediction: ModelPrediction,
    riskAssessment: any
  ): any {
    if (exploits.length > 0 && exploits[0].confidence > 0.7) {
      const bestExploit = exploits.sort((a, b) => b.confidence - a.confidence)[0];

      return {
        action: "bet",
        confidence: bestExploit.confidence,
        reason: `Singularity exploit detected: ${bestExploit.reason}`
      };
    }

    if (recommendedBets.length > 0) {
      const bestBet = recommendedBets.sort((a, b) => b.edge - a.edge)[0];

      if (bestBet.confidence > 0.65 && riskAssessment.modelAgreement < 0.3) {
        return {
          action: "bet",
          confidence: bestBet.confidence,
          reason: `Strong model edge with high confidence: ${bestBet.reason}`
        };
      }
    }

    if (riskAssessment.modelAgreement > 0.4 || riskAssessment.injuryUncertainty > 0.6) {
      return {
        action: "pass",
        confidence: 0.5,
        reason: "High model disagreement or injury uncertainty"
      };
    }

    return {
      action: "no_bet",
      confidence: 0.4,
      reason: "No clear edge identified"
    };
  }

  placeBet(bet: Omit<BetRecord, "id" | "result">): BetRecord {
    return clvTracker.recordBet(bet);
  }

  updateBetResult(
    betId: string,
    result: "won" | "lost" | "push",
    amountWon?: number
  ): void {
    clvTracker.settleBet(betId, result, amountWon);
  }

  getCLVMetrics(): CLVMetrics {
    return clvTracker.calculateCLVMetrics();
  }

  getBetHistory(): BetRecord[] {
    return clvTracker.exportBets();
  }

  getPendingBets(): BetRecord[] {
    return clvTracker.getPendingBets();
  }

  async analyzeWeek(
    season: number,
    week: number
  ): Promise<BettingAnalysis[]> {
    const games = await this.getGamesForWeek(season, week);
    const analyses: BettingAnalysis[] = [];

    for (const game of games) {
      try {
        const analysis = await this.analyzeGame(
          game.id,
          game.homeTeamId!,
          game.visitorTeamId!,
          season,
          week,
          {
            gameId: game.id,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            openingSpread: game.openingSpread || 0,
            currentSpread: game.currentSpread || 0,
            openingTotal: game.openingTotal || 0,
            currentTotal: game.currentTotal || 0,
            openingHomeMoneyline: 0,
            openingAwayMoneyline: 0,
            currentHomeMoneyline: 0,
            currentAwayMoneyline: 0,
            sportsbook: "default",
            timestamp: new Date()
          }
        );
        analyses.push(analysis);
      } catch (error) {
        console.error(`Error analyzing game ${game.id}:`, error);
      }
    }

    return analyses;
  }

  private async getGamesForWeek(season: number, week: number): Promise<any[]> {
    try {
      const games = await db.query.historicalGames.findMany({
        where: and(
          eq(historicalGames.season, season),
          eq(historicalGames.week, week.toString())
        ),
        orderBy: [historicalGames.gameDate]
      });

      return games.map(game => ({
        id: game.id,
        homeTeam: game.homeTeam || "",
        awayTeam: game.awayTeam || "",
        openingSpread: game.spread || 0,
        currentSpread: game.spread || 0,
        openingTotal: game.overUnder || 0,
        currentTotal: game.overUnder || 0,
        gameDate: game.gameDate,
        season: game.season,
        week: game.week
      }));
    } catch (error) {
      console.error(`Error fetching games for week ${week}:`, error);
      return [];
    }
  }

  exportModelPredictions(predictions: ModelPrediction[]): string {
    const csv = "gameId,homeTeam,awayTeam,spreadPrediction,totalPrediction,homeWinProb,awayWinProb,confidence\n" +
      predictions.map(p =>
        `${p.gameId},${p.homeTeam},${p.awayTeam},${p.spreadPrediction.toFixed(2)},${p.totalPrediction.toFixed(2)},${p.homeWinProbability.toFixed(3)},${p.awayWinProbability.toFixed(3)},${p.spreadConfidence.toFixed(2)}`
      ).join("\n");

    return csv;
  }
}

export const bettingService = new BettingService();
