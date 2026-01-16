import { db } from "../db";
import { weeklyMetrics, historicalGames } from "@shared/schema";
import { eq, and, sql, gte, lte, desc } from "drizzle-orm";

export interface BetRecord {
  id: string;
  gameId: number;
  homeTeam: string;
  awayTeam: string;
  edgeType: "spread" | "total" | "moneyline" | "over" | "under";
  selection: "home" | "away" | "over" | "under";
  oddsTaken: number;
  openingSpread?: number;
  openingTotal?: number;
  openingHomeMoneyline?: number;
  openingAwayMoneyline?: number;
  closingSpread?: number;
  closingTotal?: number;
  closingHomeMoneyline?: number;
  closingAwayMoneyline?: number;
  amountWagered: number;
  amountWon?: number;
  result?: "won" | "lost" | "push" | "pending";
  timestamp: Date;
}

export interface CLVMetrics {
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  roi: number;
  averageClv: number;
  positiveClvBets: number;
  negativeClvBets: number;
  clvWinRate: number;
  noClvWinRate: number;
  byEdgeType: Record<string, {
    count: number;
    wagered: number;
    won: number;
    roi: number;
  }>;
}

interface ClosingLineData {
  spread?: number;
  total?: number;
  homeMoneyline?: number;
  awayMoneyline?: number;
}

export class CLVTracker {
  private bets: Map<string, BetRecord> = new Map();
  private closingLines: Map<number, ClosingLineData> = new Map();

  recordBet(bet: Omit<BetRecord, "id">): BetRecord {
    const id = `${bet.gameId}-${bet.edgeType}-${bet.selection}-${Date.now()}`;
    const betRecord: BetRecord = {
      ...bet,
      id,
      result: "pending"
    };

    this.bets.set(id, betRecord);
    return betRecord;
  }

  updateClosingLines(gameId: number, closingData: {
    spread?: number;
    total?: number;
    homeMoneyline?: number;
    awayMoneyline?: number;
  }): void {
    this.closingLines.set(gameId, closingData);

    for (const [betId, bet] of this.bets) {
      if (bet.gameId === gameId && bet.result === "pending") {
        if (closingData.spread && !bet.closingSpread) {
          bet.closingSpread = closingData.spread;
        }
        if (closingData.total && !bet.closingTotal) {
          bet.closingTotal = closingData.total;
        }
        if (closingData.homeMoneyline && !bet.closingHomeMoneyline) {
          bet.closingHomeMoneyline = closingData.homeMoneyline;
        }
        if (closingData.awayMoneyline && !bet.closingAwayMoneyline) {
          bet.closingAwayMoneyline = closingData.awayMoneyline;
        }
      }
    }
  }

  settleBet(
    betId: string,
    result: "won" | "lost" | "push",
    amountWon?: number
  ): void {
    const bet = this.bets.get(betId);
    if (!bet) return;

    bet.result = result;
    if (amountWon !== undefined) {
      bet.amountWon = amountWon;
    }
  }

  calculateCLVForBet(bet: BetRecord): number | null {
    if (bet.result === "pending") return null;

    let clv = 0;

    switch (bet.edgeType) {
      case "spread":
        if (bet.closingSpread && bet.openingSpread) {
          const movement = bet.closingSpread - bet.openingSpread;
          clv = Math.abs(movement) * 0.02;
        }
        break;
      case "total":
        if (bet.closingTotal && bet.openingTotal) {
          const movement = bet.closingTotal - bet.openingTotal;
          clv = Math.abs(movement) * 0.02;
        }
        break;
      case "moneyline":
        if (bet.closingHomeMoneyline && bet.openingHomeMoneyline && bet.closingAwayMoneyline && bet.openingAwayMoneyline) {
          const takenProb = bet.selection === "home"
            ? this.americanToProbability(bet.oddsTaken)
            : this.americanToProbability(-bet.oddsTaken);
          const closingProb = bet.selection === "home"
            ? this.americanToProbability(bet.closingHomeMoneyline!)
            : this.americanToProbability(bet.closingAwayMoneyline!);
          clv = closingProb - takenProb;
        }
        break;
      case "over":
      case "under":
        if (bet.closingTotal && bet.openingTotal) {
          const movement = bet.closingTotal - bet.openingTotal;
          clv = Math.abs(movement) * 0.015;
        }
        break;
    }

    return clv;
  }

  private americanToProbability(americanOdds: number): number {
    if (americanOdds > 0) {
      return 100 / (americanOdds + 100);
    }
    return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  }

  calculateCLVMetrics(): CLVMetrics {
    const settledBets = Array.from(this.bets.values()).filter(b => b.result !== "pending");

    if (settledBets.length === 0) {
      return {
        totalBets: 0,
        totalWagered: 0,
        totalWon: 0,
        roi: 0,
        averageClv: 0,
        positiveClvBets: 0,
        negativeClvBets: 0,
        clvWinRate: 0,
        noClvWinRate: 0,
        byEdgeType: {}
      };
    }

    let totalWagered = 0;
    let totalWon = 0;
    let totalClv = 0;
    let positiveClvCount = 0;
    let negativeClvCount = 0;
    let positiveClvWins = 0;
    let negativeClvWins = 0;
    let positiveClvTotal = 0;
    let negativeClvTotal = 0;

    const byEdgeType: Record<string, { count: number; wagered: number; won: number }> = {};

    for (const bet of settledBets) {
      totalWagered += bet.amountWagered;
      if (bet.amountWon) {
        totalWon += bet.amountWon;
      }

      const clv = this.calculateCLVForBet(bet);
      if (clv !== null) {
        totalClv += clv;
        if (clv > 0) {
          positiveClvCount++;
          positiveClvTotal += clv;
          if (bet.result === "won") {
            positiveClvWins++;
          }
        } else if (clv < 0) {
          negativeClvCount++;
          negativeClvTotal += Math.abs(clv);
          if (bet.result === "won") {
            negativeClvWins++;
          }
        }
      }

      if (!byEdgeType[bet.edgeType]) {
        byEdgeType[bet.edgeType] = { count: 0, wagered: 0, won: 0 };
      }
      byEdgeType[bet.edgeType].count++;
      byEdgeType[bet.edgeType].wagered += bet.amountWagered;
      if (bet.amountWon) {
        byEdgeType[bet.edgeType].won += bet.amountWon;
      }
    }

    const roi = totalWagered > 0 ? ((totalWon - totalWagered) / totalWagered) * 100 : 0;
    const averageClv = settledBets.length > 0 ? totalClv / settledBets.length : 0;
    const clvWinRate = positiveClvCount > 0 ? (positiveClvWins / positiveClvCount) * 100 : 0;
    const noClvWinRate = negativeClvCount > 0 ? (negativeClvWins / negativeClvCount) * 100 : 0;

    const byEdgeTypeWithRoi: CLVMetrics['byEdgeType'] = {};
    for (const [edgeType, data] of Object.entries(byEdgeType)) {
      byEdgeTypeWithRoi[edgeType] = {
        count: data.count,
        wagered: data.wagered,
        won: data.won,
        roi: data.wagered > 0 ? ((data.won - data.wagered) / data.wagered) * 100 : 0
      };
    }

    return {
      totalBets: settledBets.length,
      totalWagered,
      totalWon,
      roi,
      averageClv,
      positiveClvBets: positiveClvCount,
      negativeClvBets: negativeClvCount,
      clvWinRate,
      noClvWinRate,
      byEdgeType: byEdgeTypeWithRoi
    };
  }

  getBetsByGameId(gameId: number): BetRecord[] {
    return Array.from(this.bets.values()).filter(b => b.gameId === gameId);
  }

  getBetsByEdgeType(edgeType: string): BetRecord[] {
    return Array.from(this.bets.values()).filter(b => b.edgeType === edgeType);
  }

  getPendingBets(): BetRecord[] {
    return Array.from(this.bets.values()).filter(b => b.result === "pending");
  }

  getSettledBets(): BetRecord[] {
    return Array.from(this.bets.values()).filter(b => b.result !== "pending");
  }

  exportBets(): BetRecord[] {
    return Array.from(this.bets.values()).sort((a, b) =>
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }
}

export const clvTracker = new CLVTracker();
