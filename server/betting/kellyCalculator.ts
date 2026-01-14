import { BettingEdge } from "./marketComparator";
import { eq, and, or } from "drizzle-orm";

export interface KellyResult {
  optimalBetSize: number;
  edge: number;
  winProbability: number;
  decimalOdds: number;
  kellyFraction: number;
  recommendedStake: number;
  maxStake: number;
  riskLevel: "low" | "medium" | "high";
}

export interface BankrollManagement {
  currentBankroll: number;
  minBet: number;
  maxBet: number;
  targetWinRate: number;
  averageEdge: number;
  kellyFraction: number;
  stopLoss: number;
  dailyLossLimit: number;
}

export class KellyCalculator {
  private readonly FRACTIONAL_KELLY = 0.25;
  private readonly FULL_KELLY = 1.0;
  private readonly QUARTER_KELLY = 0.5;

  calculateKelly(
    winProbability: number,
    decimalOdds: number,
    bankroll: number,
    fractionalKelly: number = this.FRACTIONAL_KELLY
  ): KellyResult {
    if (winProbability <= 0 || winProbability >= 1) {
      throw new Error("Win probability must be between 0 and 1");
    }

    if (decimalOdds <= 1) {
      throw new Error("Decimal odds must be greater than 1");
    }

    const b = decimalOdds - 1;
    const p = winProbability;
    const q = 1 - p;

    const kellyFraction = (b * p - q) / b;
    const optimalBetSize = bankroll * kellyFraction * fractionalKelly;
    const edge = (p * decimalOdds) - 1;

    const riskLevel = this.assessRiskLevel(kellyFraction, winProbability);

    return {
      optimalBetSize,
      edge,
      winProbability: p,
      decimalOdds,
      kellyFraction: kellyFraction * fractionalKelly,
      recommendedStake: optimalBetSize,
      maxStake: bankroll * this.QUARTER_KELLY,
      riskLevel
    };
  }

  calculateKellyForEdge(
    edge: BettingEdge,
    bankroll: number,
    fractionalKelly: number = this.FRACTIONAL_KELLY
  ): KellyResult {
    const decimalOdds = edge.marketOdds;
    const winProbability = edge.modelProbability;

    return this.calculateKelly(
      winProbability,
      decimalOdds,
      bankroll,
      fractionalKelly
    );
  }

  assessRiskLevel(kellyFraction: number, winProbability: number): "low" | "medium" | "high" {
    const absoluteKelly = Math.abs(kellyFraction);

    if (absoluteKelly > 0.10 || winProbability < 0.55) {
      return "high";
    }

    if (absoluteKelly > 0.05 || winProbability < 0.60) {
      return "medium";
    }

    return "low";
  }

  calculateOptimalFractionalKelly(
    winProbability: number,
    historicalWinRate: number,
    sampleSize: number
  ): number {
    const confidenceInModel = this.calculateConfidenceInModel(
      winProbability,
      historicalWinRate,
      sampleSize
    );

    if (sampleSize < 20) {
      return 0.10;
    }

    if (sampleSize < 50) {
      return 0.20;
    }

    if (confidenceInModel < 0.8) {
      return 0.15;
    }

    if (winProbability > 0.70 && historicalWinRate > 0.65) {
      return this.FRACTIONAL_KELLY;
    }

    return 0.15;
  }

  private calculateConfidenceInModel(
    modelProbability: number,
    historicalWinRate: number,
    sampleSize: number
  ): number {
    if (sampleSize === 0) return 0;

    const modelProbPercent = modelProbability * 100;
    const variance = Math.abs(modelProbPercent - (historicalWinRate * 100));

    if (variance < 5) {
      return 0.95;
    }

    if (variance < 10) {
      return 0.85;
    }

    if (variance < 15) {
      return 0.75;
    }

    return 0.6;
  }

  calculateBankrollAllocation(
    edges: BettingEdge[],
    bankroll: number,
    maxConcurrentBets: number = 10
  ): Map<string, number> {
    const totalEdge = edges.reduce((sum, edge) => sum + edge.edge, 0);
    const allocations = new Map<string, number>();

    for (const edge of edges) {
      const weight = edge.edge / totalEdge;
      const kellyForEdge = this.calculateKellyForEdge(edge, bankroll);
      const fractionOfBankroll = weight * kellyForEdge.optimalBetSize;

      allocations.set(
        `${edge.gameId}-${edge.edgeType}-${edge.selection}`,
        Math.min(
          fractionOfBankroll,
          bankroll / maxConcurrentBets
        )
      );
    }

    return allocations;
  }

  calculateStopLoss(
    bankroll: number,
    winRate: number,
    averageBetSize: number
  ): number {
    const expectedWinLossPerBet = bankroll * 0.25 * (winRate - 0.5);

    if (expectedWinLossPerBet > 0) {
      return bankroll * 0.10;
    }

    const expectedLossPerBet = Math.abs(expectedWinLossPerBet);
    const maxExpectedLosses = Math.floor(bankroll / (expectedLossPerBet * 5));

    return Math.min(maxExpectedLosses * expectedLossPerBet, bankroll * 0.15);
  }

  validateBetSize(
    betSize: number,
    bankroll: number,
    maxBetPercentage: number = 0.05
  ): boolean {
    const maxAllowed = bankroll * maxBetPercentage;

    return betSize <= maxAllowed;
  }

  calculateUnitsStaking(
    edge: BettingEdge,
    bankroll: number,
    unitSize: number = 0.01
  ): number {
    const kellyResult = this.calculateKellyForEdge(edge, bankroll);
    const units = kellyResult.optimalBetSize / (bankroll * unitSize);

    return Math.max(0.5, Math.round(units * 10) / 10);
  }

  getBankrollManagementMetrics(
    edges: BettingEdge[],
    bankroll: number
  ): BankrollManagement {
    const avgWinProb = edges.reduce((sum, e) => sum + e.modelProbability, 0) / edges.length;
    const avgEdge = edges.reduce((sum, e) => sum + e.edge, 0) / edges.length;
    const winRate = avgWinProb * 100;

    const stopLoss = this.calculateStopLoss(
      bankroll,
      winRate / 100,
      bankroll * 0.02
    );

    return {
      currentBankroll: bankroll,
      minBet: bankroll * 0.005,
      maxBet: bankroll * 0.05,
      targetWinRate: 55,
      averageEdge: avgEdge,
      kellyFraction: this.FRACTIONAL_KELLY,
      stopLoss,
      dailyLossLimit: stopLoss * 0.5
    };
  }

  calculateKellyCriterion(
    p: number,
    b: number
  ): number {
    return (b * p - (1 - p)) / b;
  }
}

export const kellyCalculator = new KellyCalculator();
