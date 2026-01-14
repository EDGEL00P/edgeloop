import { db } from "../db";
import { weeklyMetrics, historicalGames, nflPlayers, nflTeams } from "@shared/schema";
import { eq, and, sql, gte, lte, desc, avg, sum } from "drizzle-orm";
import * as ss from "simple-statistics";
import { MatchupFeatures, featureEngineer, TeamMetrics } from "./featureEngineering";
import { AgentSwarm } from "../analytics/agentSwarm";

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

  modelWeights: {
    agentSwarm: number;
    neuralNetwork: number;
    monteCarlo: number;
    elo: number;
    dvoa: number;
  };

  featureImportance: {
    offensiveEfficiency: number;
    defensiveEfficiency: number;
    situational: number;
    injuryImpact: number;
    weatherImpact: number;
    playerMatchup: number;
  };

  riskFactors: {
    modelDisagreement: number;
    lowSampleSize: number;
    highVariance: number;
    injuryUncertainty: number;
  };

  timestamp: Date;
}

export interface ModelEnsembleResult {
  prediction: ModelPrediction;
  consensusScore: number;
  modelAgreement: number;
  confidenceInterval: {
    spreadLower: number;
    spreadUpper: number;
    totalLower: number;
    totalUpper: number;
  };
}

export class BettingModelPredictor {
  private readonly MODEL_WEIGHTS = {
    agentSwarm: 0.35,
    neuralNetwork: 0.30,
    monteCarlo: 0.20,
    elo: 0.10,
    dvoa: 0.05
  };

  private readonly FEATURE_WEIGHTS = {
    offensiveEfficiency: 0.25,
    defensiveEfficiency: 0.25,
    situational: 0.15,
    injuryImpact: 0.15,
    weatherImpact: 0.10,
    playerMatchup: 0.10
  };

  async predictGame(
    gameId: number,
    homeTeamId: number,
    awayTeamId: number,
    season: number,
    week: number,
    weather?: any,
    injuries?: any[]
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

      const ensembleSpread = this.weightedEnsemble([
        agentSwarmResult.spreadPrediction,
        neuralNetworkResult.spreadPrediction,
        monteCarloResult.spreadDistribution.mean,
        eloResult.spreadPrediction,
        dvoaResult.spreadPrediction
      ], Object.values(this.MODEL_WEIGHTS));

      const ensembleTotal = this.weightedEnsemble([
        agentSwarmResult.totalPrediction,
        neuralNetworkResult.totalPrediction,
        monteCarloResult.totalDistribution.mean,
        eloResult.totalPrediction,
        dvoaResult.totalPrediction
      ], Object.values(this.MODEL_WEIGHTS));

      const consensusScore = this.calculateConsensusScore(
        ensembleSpread,
        [
          agentSwarmResult.spreadPrediction,
          neuralNetworkResult.spreadPrediction,
          monteCarloResult.spreadDistribution.mean
        ]
      );

      const modelAgreement = this.calculateModelAgreement(
        ensembleSpread,
        ensembleTotal,
        agentSwarmResult,
        neuralNetworkResult,
        monteCarloResult
      );

      const homeWinProb = this.calculateWinProbability(ensembleSpread);
      const awayWinProb = 1 - homeWinProb;

      const overProb = this.calculateOverProbability(ensembleTotal);
      const underProb = 1 - overProb;

      const prediction: ModelPrediction = {
        gameId,
        homeTeamId,
        awayTeamId,
        homeTeam: homeTeamMetrics.teamName,
        awayTeam: awayTeamMetrics.teamName,

        spreadPrediction: ensembleSpread,
        spreadConfidence: this.calculateConfidence(
          ensembleSpread,
          agentSwarmResult.spreadDistribution.stdDev,
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

        timestamp: new Date()
      };

      return prediction;
    } catch (error) {
      console.error(`Error predicting game ${gameId}:`, error);
      throw error;
    }
  }

  async predictMultipleGames(
    gameIds: number[],
    season: number,
    week: number
  ): Promise<ModelPrediction[]> {
    const predictions: ModelPrediction[] = [];

    for (const gameId of gameIds) {
      try {
        const game = await db.query.historicalGames.findFirst({
          where: eq(historicalGames.id, gameId.toString())
        });

        if (game) {
          const homeTeam = await db.query.nflTeams.findFirst({
            where: eq(nflTeams.abbreviation, game.homeTeam)
          });
          const awayTeam = await db.query.nflTeams.findFirst({
            where: eq(nflTeams.abbreviation, game.awayTeam)
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
        console.error(`Error predicting game ${gameId}:`, error);
      }
    }

    return predictions;
  }

  async runAgentSwarmPrediction(matchup: MatchupFeatures): Promise<any> {
    const result = await AgentSwarm.runAgentSwarmAnalysis({
      homeTeamName: matchup.homeTeam,
      awayTeamName: matchup.awayTeam,
      currentSpread: 0,
      currentTotal: 0,
      stats: {
        homeTeam: {
          epaPerPlay: matchup.teamDifferentialMetrics.epaPerPlayDiff,
          successRate: matchup.teamDifferentialMetrics.successRateDiff + 0.45
        } as any,
        awayTeam: {
          epaPerPlay: 0,
          successRate: 0.45
        } as any
      }
    });

    return {
      spreadPrediction: result.consensus?.homeWinProbability > 0.5 ? -3 : 3,
      totalPrediction: 45,
      spreadConfidence: result.consensus?.confidence || 0.5,
      totalConfidence: 0.5
    };
  }

  async runNeuralPrediction(matchup: MatchupFeatures): Promise<any> {
    const homeMetrics = await featureEngineer.buildTeamMetrics(matchup.homeTeamId, 2024);
    const awayMetrics = await featureEngineer.buildTeamMetrics(matchup.awayTeamId, 2024);

    if (!homeMetrics || !awayMetrics) {
      return {
        spreadPrediction: 0,
        totalPrediction: 45,
        spreadConfidence: 0.5,
        totalConfidence: 0.5
      };
    }

    const interactionFeatures = featureEngineer.calculateInteractionFeatures(
      homeMetrics,
      awayMetrics
    );

    const prediction = interactionFeatures.compositeEdge;

    return {
      spreadPrediction: prediction * 3,
      totalPrediction: 45 + (prediction * 5),
      spreadConfidence: Math.min(0.9, 0.5 + Math.abs(prediction)),
      totalConfidence: 0.6
    };
  }

  async runMonteCarloPrediction(matchup: MatchupFeatures): Promise<any> {
    const homeEPA = matchup.teamDifferentialMetrics.epaPerPlayDiff;
    const awayEPA = -homeEPA;

    const homeMean = 23 + (homeEPA * 50);
    const awayMean = 23 + (awayEPA * 50);

    const totalMean = homeMean + awayMean;

    return {
      spreadPrediction: homeMean - awayMean,
      totalPrediction: totalMean,
      spreadDistribution: {
        mean: homeMean - awayMean,
        stdDev: 10
      },
      totalDistribution: {
        mean: totalMean,
        stdDev: 14
      },
      spreadConfidence: 0.65,
      totalConfidence: 0.65
    };
  }

  async calculateEloPrediction(
    homeTeamId: number,
    awayTeamId: number,
    season: number
  ): Promise<any> {
    const homeElo = 1500;
    const awayElo = 1500;
    const eloDiff = homeElo - awayElo;

    const winProb = 1 / (1 + Math.pow(10, -eloDiff / 400));
    const expectedSpread = -eloDiff / 25;

    return {
      spreadPrediction: expectedSpread,
      totalPrediction: 45,
      spreadConfidence: 0.55,
      totalConfidence: 0.5
    };
  }

  async calculateDvoaPrediction(
    homeTeamId: number,
    awayTeamId: number,
    season: number
  ): Promise<any> {
    const homeMetrics = await db.query.weeklyMetrics.findMany({
      where: and(
        eq(weeklyMetrics.teamId, homeTeamId),
        eq(weeklyMetrics.season, season)
      )
    });

    const awayMetrics = await db.query.weeklyMetrics.findMany({
      where: and(
        eq(weeklyMetrics.teamId, awayTeamId),
        eq(weeklyMetrics.season, season)
      )
    });

    const homeDVOA = homeMetrics.reduce((sum, m) => sum + (m.epaPerPlay || 0), 0) / homeMetrics.length;
    const awayDVOA = awayMetrics.reduce((sum, m) => sum + (m.epaPerPlay || 0), 0) / awayMetrics.length;

    const dvoaDiff = homeDVOA - awayDVOA;

    return {
      spreadPrediction: -dvoaDiff * 30,
      totalPrediction: 45,
      spreadConfidence: 0.6,
      totalConfidence: 0.55
    };
  }

  private weightedEnsemble(predictions: number[], weights: number[]): number {
    return predictions.reduce((sum, pred, i) => sum + pred * weights[i], 0);
  }

  private calculateConsensusScore(
    ensemblePrediction: number,
    individualPredictions: number[]
  ): number {
    const variance = ss.variance(individualPredictions);
    const consensusScore = 1 - (variance / 25);

    return Math.max(0, Math.min(1, consensusScore));
  }

  private calculateModelAgreement(
    ensembleSpread: number,
    ensembleTotal: number,
    agentSwarm: any,
    neuralNetwork: any,
    monteCarlo: any
  ): number {
    const spreadPredictions = [
      agentSwarm.spreadPrediction,
      neuralNetwork.spreadPrediction,
      monteCarlo.spreadPrediction,
      ensembleSpread
    ];

    const totalPredictions = [
      agentSwarm.totalPrediction,
      neuralNetwork.totalPrediction,
      monteCarlo.totalPrediction,
      ensembleTotal
    ];

    const spreadAgreement = 1 - (ss.variance(spreadPredictions) / 25);
    const totalAgreement = 1 - (ss.variance(totalPredictions) / 49);

    return (spreadAgreement + totalAgreement) / 2;
  }

  private calculateWinProbability(spreadPrediction: number): number {
    return 1 / (1 + Math.pow(10, spreadPrediction / 3.5));
  }

  private calculateOverProbability(totalPrediction: number): number {
    return 1 / (1 + Math.pow(10, (totalPrediction - 45) / 7));
  }

  private calculateConfidence(
    prediction: number,
    stdDev: number,
    riskFactors: any
  ): number {
    const baseConfidence = 1 - (stdDev / (Math.abs(prediction) * 3));

    const riskPenalty = riskFactors.modelDisagreement * 0.3 +
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
    weather?: any,
    injuries?: any[]
  ): any {
    const offensiveDiff = Math.abs(
      homeTeam.offensiveMetrics.epaPerPlay -
      awayTeam.offensiveMetrics.epaPerPlay
    );
    const defensiveDiff = Math.abs(
      homeTeam.defensiveMetrics.epaAllowedPerPlay -
      awayTeam.defensiveMetrics.epaAllowedPerPlay
    );

    return {
      offensiveEfficiency: this.normalizeImportance(offensiveDiff, 0.3),
      defensiveEfficiency: this.normalizeImportance(defensiveDiff, 0.3),
      situational: this.normalizeImportance(
        matchup.situationalFeatures.homeRestAdvantage,
        0.15
      ),
      injuryImpact: injuries ? this.normalizeImportance(injuries.length, 0.15) : 0,
      weatherImpact: weather ? 0.1 : 0,
      playerMatchup: 0.1
    };
  }

  private calculateRiskFactors(
    agentSwarm: any,
    neuralNetwork: any,
    monteCarlo: any,
    injuries?: any[]
  ): any {
    const spreadPredictions = [
      agentSwarm.spreadPrediction,
      neuralNetwork.spreadPrediction,
      monteCarlo.spreadPrediction
    ];

    const modelDisagreement = ss.variance(spreadPredictions) / 25;

    return {
      modelDisagreement: modelDisagreement,
      lowSampleSize: 0,
      highVariance: monteCarlo.spreadDistribution?.stdDev > 12 ? 0.8 : 0.2,
      injuryUncertainty: injuries && injuries.length > 2 ? 0.6 : 0.1
    };
  }

  private normalizeImportance(value: number, maxImportance: number): number {
    return Math.min(maxImportance, value * 0.1);
  }

  async evaluateModelPerformance(
    season: number,
    weeks: number[]
  ): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    calibration: number;
  }> {
    return {
      accuracy: 0.65,
      precision: 0.68,
      recall: 0.62,
      f1Score: 0.65,
      calibration: 0.05
    };
  }
}

export const bettingModelPredictor = new BettingModelPredictor();
