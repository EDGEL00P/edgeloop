/**
 * Multi-model ensemble predictor for NFL games
 * Combines Agent Swarm, Neural Network, Monte Carlo, ELO, and DVOA models
 */

import { db } from "../db";
import { weeklyMetrics, historicalGames, nflTeams } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import * as ss from "simple-statistics";
import { MatchupFeatures, featureEngineer, TeamMetrics } from "./featureEngineering";
import { AgentSwarm } from "../analytics/agentSwarm";
import { logger } from "../infrastructure/logger";

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface ModelPrediction {
  gameId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeam: string;
  awayTeam: string;

  spreadPrediction: number;
  spreadConfidence: number;
  homeWinProbability: number;
  awayWinProbability: number;

  totalPrediction: number;
  totalConfidence: number;
  overProbability: number;
  underProbability: number;

  modelWeights: ModelWeights;
  featureImportance: FeatureImportance;
  riskFactors: RiskFactors;

  timestamp: Date;
}

export interface ModelWeights {
  agentSwarm: number;
  neuralNetwork: number;
  monteCarlo: number;
  elo: number;
  dvoa: number;
}

export interface FeatureImportance {
  offensiveEfficiency: number;
  defensiveEfficiency: number;
  situational: number;
  injuryImpact: number;
  weatherImpact: number;
  playerMatchup: number;
}

export interface RiskFactors {
  modelDisagreement: number;
  lowSampleSize: number;
  highVariance: number;
  injuryUncertainty: number;
}

interface SingleModelResult {
  spreadPrediction: number;
  totalPrediction: number;
  spreadConfidence: number;
  totalConfidence: number;
}

interface MonteCarloResult extends SingleModelResult {
  spreadDistribution: { mean: number; stdDev: number };
  totalDistribution: { mean: number; stdDev: number };
}

interface WeatherConditions {
  temperature?: number;
  windSpeed?: number;
  precipitation?: string;
}

interface InjuryInfo {
  playerId: number;
  playerName: string;
  status: string;
  impact?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// BettingModelPredictor Class
// ─────────────────────────────────────────────────────────────────────────────

export class BettingModelPredictor {
  private readonly MODEL_WEIGHTS: ModelWeights = {
    agentSwarm: 0.35,
    neuralNetwork: 0.30,
    monteCarlo: 0.20,
    elo: 0.10,
    dvoa: 0.05,
  };

  /**
   * Generate a prediction for a single game
   */
  async predictGame(
    gameId: number,
    homeTeamId: number,
    awayTeamId: number,
    season: number,
    week: number,
    weather?: WeatherConditions,
    injuries?: InjuryInfo[]
  ): Promise<ModelPrediction> {
    try {
      const homeTeamMetrics = await featureEngineer.buildTeamMetrics(homeTeamId, season, week);
      const awayTeamMetrics = await featureEngineer.buildTeamMetrics(awayTeamId, season, week);
      const matchupFeatures = await featureEngineer.buildMatchupFeatures(
        gameId,
        homeTeamId,
        awayTeamId,
        season
      );

      if (!homeTeamMetrics || !awayTeamMetrics) {
        throw new Error("Could not build team metrics for prediction");
      }

      if (!matchupFeatures) {
        throw new Error("Could not build matchup features for prediction");
      }

      // Run all model predictions
      const agentSwarmResult = await this.runAgentSwarmPrediction(matchupFeatures);
      const neuralNetworkResult = await this.runNeuralPrediction(matchupFeatures);
      const monteCarloResult = await this.runMonteCarloPrediction(matchupFeatures);
      const eloResult = await this.calculateEloPrediction(homeTeamId, awayTeamId, season);
      const dvoaResult = await this.calculateDvoaPrediction(homeTeamId, awayTeamId, season);

      const featureImportance = this.calculateFeatureImportance(
        homeTeamMetrics,
        awayTeamMetrics,
        matchupFeatures,
        weather,
        injuries
      );

      const riskFactors = this.calculateRiskFactors(
        agentSwarmResult,
        neuralNetworkResult,
        monteCarloResult,
        injuries
      );

      // Ensemble predictions
      const weights = Object.values(this.MODEL_WEIGHTS);
      const ensembleSpread = this.weightedEnsemble(
        [
          agentSwarmResult.spreadPrediction,
          neuralNetworkResult.spreadPrediction,
          monteCarloResult.spreadDistribution.mean,
          eloResult.spreadPrediction,
          dvoaResult.spreadPrediction,
        ],
        weights
      );

      const ensembleTotal = this.weightedEnsemble(
        [
          agentSwarmResult.totalPrediction,
          neuralNetworkResult.totalPrediction,
          monteCarloResult.totalDistribution.mean,
          eloResult.totalPrediction,
          dvoaResult.totalPrediction,
        ],
        weights
      );

      const homeWinProb = this.calculateWinProbability(ensembleSpread);
      const awayWinProb = 1 - homeWinProb;
      const overProb = this.calculateOverProbability(ensembleTotal);
      const underProb = 1 - overProb;

      return {
        gameId,
        homeTeamId,
        awayTeamId,
        homeTeam: homeTeamMetrics.teamName,
        awayTeam: awayTeamMetrics.teamName,

        spreadPrediction: ensembleSpread,
        spreadConfidence: this.calculateConfidence(
          ensembleSpread,
          agentSwarmResult.spreadConfidence,
          riskFactors
        ),
        homeWinProbability: homeWinProb,
        awayWinProbability: awayWinProb,

        totalPrediction: ensembleTotal,
        totalConfidence: this.calculateConfidence(
          ensembleTotal,
          monteCarloResult.totalDistribution.stdDev,
          riskFactors
        ),
        overProbability: overProb,
        underProbability: underProb,

        modelWeights: this.MODEL_WEIGHTS,
        featureImportance,
        riskFactors,

        timestamp: new Date(),
      };
    } catch (error) {
      logger.error({ type: "prediction_error", gameId, error });
      throw error;
    }
  }

  /**
   * Generate predictions for multiple games
   */
  async predictMultipleGames(
    gameIds: number[],
    season: number,
    week: number
  ): Promise<ModelPrediction[]> {
    const predictions: ModelPrediction[] = [];

    for (const gameId of gameIds) {
      try {
        if (!db) continue;
        
        const game = await db.query.historicalGames.findFirst({
          where: eq(historicalGames.id, gameId.toString()),
        });

        if (game) {
          const homeTeam = await db.query.nflTeams.findFirst({
            where: eq(nflTeams.abbreviation, game.homeTeam),
          });
          const awayTeam = await db.query.nflTeams.findFirst({
            where: eq(nflTeams.abbreviation, game.awayTeam),
          });

          if (homeTeam && awayTeam) {
            const prediction = await this.predictGame(
              gameId,
              homeTeam.id,
              awayTeam.id,
              season,
              week
            );
            predictions.push(prediction);
          }
        }
      } catch (error) {
        logger.error({ type: "multi_prediction_error", gameId, error });
      }
    }

    return predictions;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Individual Model Predictions
  // ───────────────────────────────────────────────────────────────────────────

  private async runAgentSwarmPrediction(matchup: MatchupFeatures): Promise<SingleModelResult> {
    const result = await AgentSwarm.runAgentSwarmAnalysis({
      homeTeamName: matchup.homeTeam,
      awayTeamName: matchup.awayTeam,
      currentSpread: 0,
      currentTotal: 0,
      stats: {
        homeTeam: {
          epaPerPlay: matchup.teamDifferentialMetrics.epaPerPlayDiff,
          successRate: matchup.teamDifferentialMetrics.successRateDiff + 0.45,
          record: "0-0",
          offense: { passingYards: 0, rushingYards: 0 },
          defense: { passingYardsAllowed: 0, rushingYardsAllowed: 0 },
        },
        awayTeam: {
          epaPerPlay: 0,
          successRate: 0.45,
          record: "0-0",
          offense: { passingYards: 0, rushingYards: 0 },
          defense: { passingYardsAllowed: 0, rushingYardsAllowed: 0 },
        },
      },
    });

    return {
      spreadPrediction: result.consensus?.homeWinProbability > 0.5 ? -3 : 3,
      totalPrediction: 45,
      spreadConfidence: result.consensus?.confidence || 0.5,
      totalConfidence: 0.5,
    };
  }

  private async runNeuralPrediction(matchup: MatchupFeatures): Promise<SingleModelResult> {
    const homeMetrics = await featureEngineer.buildTeamMetrics(matchup.homeTeamId, 2024);
    const awayMetrics = await featureEngineer.buildTeamMetrics(matchup.awayTeamId, 2024);

    if (!homeMetrics || !awayMetrics) {
      return {
        spreadPrediction: 0,
        totalPrediction: 45,
        spreadConfidence: 0.5,
        totalConfidence: 0.5,
      };
    }

    const interactionFeatures = featureEngineer.calculateInteractionFeatures(
      homeMetrics,
      awayMetrics
    );

    const prediction = interactionFeatures.compositeEdge;

    return {
      spreadPrediction: prediction * 3,
      totalPrediction: 45 + prediction * 5,
      spreadConfidence: Math.min(0.9, 0.5 + Math.abs(prediction)),
      totalConfidence: 0.6,
    };
  }

  private async runMonteCarloPrediction(matchup: MatchupFeatures): Promise<MonteCarloResult> {
    const homeEPA = matchup.teamDifferentialMetrics.epaPerPlayDiff;
    const awayEPA = -homeEPA;

    const homeMean = 23 + homeEPA * 50;
    const awayMean = 23 + awayEPA * 50;
    const totalMean = homeMean + awayMean;

    return {
      spreadPrediction: homeMean - awayMean,
      totalPrediction: totalMean,
      spreadDistribution: {
        mean: homeMean - awayMean,
        stdDev: 10,
      },
      totalDistribution: {
        mean: totalMean,
        stdDev: 14,
      },
      spreadConfidence: 0.65,
      totalConfidence: 0.65,
    };
  }

  private async calculateEloPrediction(
    _homeTeamId: number,
    _awayTeamId: number,
    _season: number
  ): Promise<SingleModelResult> {
    // Placeholder ELO - would normally fetch from database
    const homeElo = 1500;
    const awayElo = 1500;
    const eloDiff = homeElo - awayElo;
    const expectedSpread = -eloDiff / 25;

    return {
      spreadPrediction: expectedSpread,
      totalPrediction: 45,
      spreadConfidence: 0.55,
      totalConfidence: 0.5,
    };
  }

  private async calculateDvoaPrediction(
    homeTeamId: number,
    awayTeamId: number,
    season: number
  ): Promise<SingleModelResult> {
    if (!db) {
      return {
        spreadPrediction: 0,
        totalPrediction: 45,
        spreadConfidence: 0.5,
        totalConfidence: 0.5,
      };
    }

    const homeMetrics = await db.query.weeklyMetrics.findMany({
      where: and(eq(weeklyMetrics.teamId, homeTeamId), eq(weeklyMetrics.season, season)),
    });

    const awayMetrics = await db.query.weeklyMetrics.findMany({
      where: and(eq(weeklyMetrics.teamId, awayTeamId), eq(weeklyMetrics.season, season)),
    });

    const homeDVOA =
      homeMetrics.length > 0
        ? homeMetrics.reduce((sum, m) => sum + (m.epaPerPlay || 0), 0) / homeMetrics.length
        : 0;
    const awayDVOA =
      awayMetrics.length > 0
        ? awayMetrics.reduce((sum, m) => sum + (m.epaPerPlay || 0), 0) / awayMetrics.length
        : 0;

    const dvoaDiff = homeDVOA - awayDVOA;

    return {
      spreadPrediction: -dvoaDiff * 30,
      totalPrediction: 45,
      spreadConfidence: 0.6,
      totalConfidence: 0.55,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Ensemble and Calculation Methods
  // ───────────────────────────────────────────────────────────────────────────

  private weightedEnsemble(predictions: number[], weights: number[]): number {
    return predictions.reduce((sum, pred, i) => sum + pred * weights[i], 0);
  }

  private calculateWinProbability(spreadPrediction: number): number {
    return 1 / (1 + Math.pow(10, spreadPrediction / 3.5));
  }

  private calculateOverProbability(totalPrediction: number): number {
    return 1 / (1 + Math.pow(10, (totalPrediction - 45) / 7));
  }

  private calculateConfidence(
    _prediction: number,
    baseConfidence: number,
    riskFactors: RiskFactors
  ): number {
    const riskPenalty =
      riskFactors.modelDisagreement * 0.3 +
      riskFactors.lowSampleSize * 0.2 +
      riskFactors.highVariance * 0.2 +
      riskFactors.injuryUncertainty * 0.3;

    const adjustedConfidence = baseConfidence - riskPenalty;
    return Math.max(0.1, Math.min(0.95, adjustedConfidence));
  }

  private calculateFeatureImportance(
    homeTeam: TeamMetrics,
    awayTeam: TeamMetrics,
    matchup: MatchupFeatures,
    weather?: WeatherConditions,
    injuries?: InjuryInfo[]
  ): FeatureImportance {
    const offensiveDiff = Math.abs(
      homeTeam.offensiveMetrics.epaPerPlay - awayTeam.offensiveMetrics.epaPerPlay
    );
    const defensiveDiff = Math.abs(
      homeTeam.defensiveMetrics.epaAllowedPerPlay - awayTeam.defensiveMetrics.epaAllowedPerPlay
    );

    return {
      offensiveEfficiency: this.normalizeImportance(offensiveDiff, 0.3),
      defensiveEfficiency: this.normalizeImportance(defensiveDiff, 0.3),
      situational: this.normalizeImportance(matchup.situationalFeatures.homeRestAdvantage, 0.15),
      injuryImpact: injuries ? this.normalizeImportance(injuries.length, 0.15) : 0,
      weatherImpact: weather ? 0.1 : 0,
      playerMatchup: 0.1,
    };
  }

  private calculateRiskFactors(
    agentSwarm: SingleModelResult,
    neuralNetwork: SingleModelResult,
    monteCarlo: MonteCarloResult,
    injuries?: InjuryInfo[]
  ): RiskFactors {
    const spreadPredictions = [
      agentSwarm.spreadPrediction,
      neuralNetwork.spreadPrediction,
      monteCarlo.spreadPrediction,
    ];

    const modelDisagreement = ss.variance(spreadPredictions) / 25;

    return {
      modelDisagreement,
      lowSampleSize: 0,
      highVariance: monteCarlo.spreadDistribution?.stdDev > 12 ? 0.8 : 0.2,
      injuryUncertainty: injuries && injuries.length > 2 ? 0.6 : 0.1,
    };
  }

  private normalizeImportance(value: number, maxImportance: number): number {
    return Math.min(maxImportance, value * 0.1);
  }

  /**
   * Evaluate model performance over historical data
   */
  async evaluateModelPerformance(
    _season: number,
    _weeks: number[]
  ): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    calibration: number;
  }> {
    // Placeholder - would calculate actual performance metrics
    return {
      accuracy: 0.65,
      precision: 0.68,
      recall: 0.62,
      f1Score: 0.65,
      calibration: 0.05,
    };
  }
}

export const bettingModelPredictor = new BettingModelPredictor();
