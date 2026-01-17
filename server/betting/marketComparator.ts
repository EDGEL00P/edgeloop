import { db } from "../db";
import { weeklyMetrics, historicalGames } from "@shared/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import * as ss from "simple-statistics";

export interface MarketOdds {
  gameId: number;
  homeTeam: string;
  awayTeam: string;
  openingSpread: number;
  currentSpread: number;
  openingTotal: number;
  currentTotal: number;
  openingHomeMoneyline: number;
  openingAwayMoneyline: number;
  currentHomeMoneyline: number;
  currentAwayMoneyline: number;
  sportsbook: string;
  timestamp: Date;
}

export interface ModelProbability {
  gameId: number;
  homeWinProbability: number;
  awayWinProbability: number;
  spreadPrediction: number;
  totalPrediction: number;
  overProbability: number;
  underProbability: number;
  confidence: number;
  modelVersion: string;
}

export interface BettingEdge {
  gameId: number;
  edgeType: "spread" | "total" | "moneyline" | "over" | "under";
  selection: "home" | "away" | "over" | "under";
  modelProbability: number;
  marketProbability: number;
  fairOdds: number;
  marketOdds: number;
  edge: number;
  kellyFraction: number;
  confidence: number;
  reason: string;
  timestamp: Date;
}

export class MarketComparator {
  private readonly VIG_JUICE = 0.048;

  convertAmericanToDecimal(americanOdds: number): number {
    if (americanOdds > 0) {
      return (americanOdds / 100) + 1;
    }
    return (100 / Math.abs(americanOdds)) + 1;
  }

  convertDecimalToProbability(decimalOdds: number): number {
    return 1 / decimalOdds;
  }

  convertAmericanToProbability(americanOdds: number): number {
    return this.convertDecimalToProbability(this.convertAmericanToDecimal(americanOdds));
  }

  calculateMarketProbability(americanOdds: number): number {
    const probability = this.convertAmericanToProbability(americanOdds);
    return probability;
  }

  calculateFairOdds(modelProbability: number): number {
    if (modelProbability <= 0 || modelProbability >= 1) {
      throw new Error("Model probability must be between 0 and 1");
    }
    return 1 / modelProbability;
  }

  calculateEdge(marketOdds: number, fairOdds: number): number {
    return (marketOdds / fairOdds) - 1;
  }

  calculateEdgeModelVsMarket(modelProbability: number, marketProbability: number): number {
    const fairOdds = this.calculateFairOdds(modelProbability);
    const marketOdds = 1 / marketProbability;
    return this.calculateEdge(marketOdds, fairOdds);
  }

  compareModelToMarket(
    model: ModelProbability,
    market: MarketOdds,
    kellyFraction: number = 0.25
  ): BettingEdge[] {
    const edges: BettingEdge[] = [];

    const homeMarketProb = this.calculateMarketProbability(market.currentHomeMoneyline);
    const awayMarketProb = this.calculateMarketProbability(market.currentAwayMoneyline);

    const spreadEdge = this.compareSpread(model, market, kellyFraction);
    if (spreadEdge) edges.push(spreadEdge);

    const totalEdge = this.compareTotal(model, market, kellyFraction);
    if (totalEdge) edges.push(totalEdge);

    const homeMLEdge = this.compareMoneyline(
      model,
      market,
      "home",
      homeMarketProb,
      kellyFraction
    );
    if (homeMLEdge) edges.push(homeMLEdge);

    const awayMLEdge = this.compareMoneyline(
      model,
      market,
      "away",
      awayMarketProb,
      kellyFraction
    );
    if (awayMLEdge) edges.push(awayMLEdge);

    return edges;
  }

  private compareSpread(
    model: ModelProbability,
    market: MarketOdds,
    kellyFraction: number
  ): BettingEdge | null {
    const modelSpread = model.spreadPrediction;
    const marketSpread = market.currentSpread;
    const spreadDiff = modelSpread - marketSpread;

    if (Math.abs(spreadDiff) < 0.5) return null;

    const selection: "home" | "away" = spreadDiff > 0 ? "away" : "home";
    const edgeProbability = model.homeWinProbability > model.awayWinProbability
      ? model.homeWinProbability
      : model.awayWinProbability;

    const marketImpliedProb = 0.5 - (marketSpread * 0.02);
    const fairOdds = this.calculateFairOdds(edgeProbability);
    const marketOdds = this.convertAmericanToDecimal(spreadDiff > 0 ? market.currentAwayMoneyline : market.currentHomeMoneyline);

    const edge = this.calculateEdgeModelVsMarket(edgeProbability, marketImpliedProb);

    if (edge < 0.03) return null;

    return {
      gameId: model.gameId,
      edgeType: "spread",
      selection,
      modelProbability: edgeProbability,
      marketProbability: marketImpliedProb,
      fairOdds,
      marketOdds,
      edge,
      kellyFraction,
      confidence: model.confidence,
      reason: `Model spread (${modelSpread.toFixed(1)}) differs from market (${marketSpread.toFixed(1)}) by ${spreadDiff.toFixed(1)} points`,
      timestamp: new Date()
    };
  }

  private compareTotal(
    model: ModelProbability,
    market: MarketOdds,
    kellyFraction: number
  ): BettingEdge | null {
    const modelTotal = model.totalPrediction;
    const marketTotal = market.currentTotal;
    const totalDiff = modelTotal - marketTotal;

    if (Math.abs(totalDiff) < 1.5) return null;

    const selection: "over" | "under" = totalDiff > 0 ? "over" : "under";
    const edgeProbability = selection === "over" ? model.overProbability : model.underProbability;

    const marketImpliedProb = 0.5 - (totalDiff * 0.015);
    const fairOdds = this.calculateFairOdds(edgeProbability);
    const marketOdds = 1 / marketImpliedProb;

    const edge = this.calculateEdgeModelVsMarket(edgeProbability, marketImpliedProb);

    if (edge < 0.03) return null;

    return {
      gameId: model.gameId,
      edgeType: "total",
      selection,
      modelProbability: edgeProbability,
      marketProbability: marketImpliedProb,
      fairOdds,
      marketOdds,
      edge,
      kellyFraction,
      confidence: model.confidence,
      reason: `Model total (${modelTotal.toFixed(1)}) differs from market (${marketTotal.toFixed(1)}) by ${totalDiff.toFixed(1)} points`,
      timestamp: new Date()
    };
  }

  private compareMoneyline(
    model: ModelProbability,
    market: MarketOdds,
    selection: "home" | "away",
    marketProbability: number,
    kellyFraction: number
  ): BettingEdge | null {
    const modelProbability = selection === "home"
      ? model.homeWinProbability
      : model.awayWinProbability;

    const fairOdds = this.calculateFairOdds(modelProbability);
    const marketOdds = this.convertAmericanToDecimal(
      selection === "home" ? market.currentHomeMoneyline : market.currentAwayMoneyline
    );

    const edge = this.calculateEdgeModelVsMarket(modelProbability, marketProbability);

    if (edge < 0.03) return null;

    return {
      gameId: model.gameId,
      edgeType: "moneyline",
      selection,
      modelProbability,
      marketProbability,
      fairOdds,
      marketOdds,
      edge,
      kellyFraction,
      confidence: model.confidence,
      reason: `Model ${selection} win prob (${(modelProbability * 100).toFixed(1)}%) > market (${(marketProbability * 100).toFixed(1)}%)`,
      timestamp: new Date()
    };
  }

  findOpeningLineExploits(
    model: ModelProbability,
    market: MarketOdds,
    kellyFraction: number = 0.25
  ): BettingEdge[] {
    const edges: BettingEdge[] = [];

    const openingHomeProb = this.calculateMarketProbability(market.openingHomeMoneyline);
    const openingAwayProb = this.calculateMarketProbability(market.openingAwayMoneyline);

    const openingMLEdgeHome = this.compareMoneyline(
      model,
      market,
      "home",
      openingHomeProb,
      kellyFraction
    );
    if (openingMLEdgeHome) {
      openingMLEdgeHome.reason = "OPENING LINE EXPLOIT: " + openingMLEdgeHome.reason;
      edges.push(openingMLEdgeHome);
    }

    const openingMLEdgeAway = this.compareMoneyline(
      model,
      market,
      "away",
      openingAwayProb,
      kellyFraction
    );
    if (openingMLEdgeAway) {
      openingMLEdgeAway.reason = "OPENING LINE EXPLOIT: " + openingMLEdgeAway.reason;
      edges.push(openingMLEdgeAway);
    }

    return edges;
  }

  identifyMarketOverreaction(
    model: ModelProbability,
    market: MarketOdds,
    previousGames: { homeTeamScore: number; awayTeamScore: number }[]
  ): BettingEdge | null {
    if (previousGames.length === 0) return null;

    const lastGame = previousGames[0];
    const pointDifferential = Math.abs(lastGame.homeTeamScore - lastGame.awayTeamScore);

    if (pointDifferential < 21) return null;

    const lineMovement = Math.abs(market.currentSpread - market.openingSpread);

    if (lineMovement < 0.5) return null;

    const teamAdjusted = market.currentSpread > market.openingSpread ? "home" : "away";
    const modelWinProb = teamAdjusted === "home"
      ? model.homeWinProbability
      : model.awayWinProbability;

    const fairOdds = this.calculateFairOdds(modelWinProb);
    const marketOdds = this.convertAmericanToDecimal(
      teamAdjusted === "home" ? market.currentHomeMoneyline : market.currentAwayMoneyline
    );

    const edge = this.calculateEdgeModelVsMarket(modelWinProb, 0.5);

    if (edge > 0.02) {
      return {
        gameId: model.gameId,
        edgeType: "moneyline",
        selection: teamAdjusted,
        modelProbability: modelWinProb,
        marketProbability: 0.5,
        fairOdds,
        marketOdds,
        edge,
        kellyFraction: 0.25,
        confidence: model.confidence * 0.8,
        reason: `MARKET OVERREACTION: ${pointDifferential} point blowout in last game, line moved ${lineMovement.toFixed(1)} points`,
        timestamp: new Date()
      };
    }

    return null;
  }
}

export const marketComparator = new MarketComparator();
