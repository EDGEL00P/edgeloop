/**
 * Quantitative NFL Betting System
 * 
 * Implements "singularity" approach: treat betting like quantitative trading
 * - Better information, modeling, execution, risk control
 * - Probabilistic + simulation-based
 * - CLV tracking and calibration
 * 
 * @module server/betting/quantitativeSystem
 */

import { logger } from "../infrastructure/logger";

// ----------------------------
// Odds / Probability utilities
// ----------------------------

export function americanToDecimal(american: number): number {
  if (american === 0) {
    throw new Error("American odds cannot be 0");
  }
  if (american > 0) {
    return 1.0 + american / 100.0;
  }
  return 1.0 + 100.0 / Math.abs(american);
}

export function decimalToImpliedProb(decimalOdds: number): number {
  if (decimalOdds <= 1.0) {
    throw new Error("Decimal odds must be > 1.0");
  }
  return 1.0 / decimalOdds;
}

export function americanToImpliedProb(american: number): number {
  return decimalToImpliedProb(americanToDecimal(american));
}

export function removeVigTwoWay(p1: number, p2: number): [number, number] {
  const s = p1 + p2;
  if (s <= 0) {
    throw new Error("Invalid implied probabilities");
  }
  return [p1 / s, p2 / s];
}

export function expectedValue(fairP: number, american: number): number {
  const dec = americanToDecimal(american);
  return fairP * (dec - 1.0) - (1.0 - fairP);
}

export function fractionalKelly(
  fairP: number,
  american: number,
  fraction: number = 0.25
): number {
  const dec = americanToDecimal(american);
  const b = dec - 1.0;
  const q = 1.0 - fairP;
  const fStar = (b * fairP - q) / b;
  return Math.max(0.0, fraction * fStar);
}

// ----------------------------
// Bet Signal
// ----------------------------

export interface BetSignal {
  gameId: string;
  market: string; // e.g., "moneyline_home", "spread_home_-2.5", "total_over_44.5"
  book: string;
  timestamp: string;
  priceAmerican: number;
  fairProb: number;
  ev: number;
  kellyFrac: number;
  confidence: number;
  closingLineValue?: number;
}

// ----------------------------
// Distributional Score Model
// ----------------------------

export interface ScoreDistribution {
  mean: number;
  stdDev: number;
  quantiles: {
    q10: number;
    q25: number;
    q50: number;
    q75: number;
    q90: number;
  };
}

export interface GameSimulation {
  homeScore: number;
  awayScore: number;
  margin: number;
  total: number;
  homeWin: boolean;
  coverSpread: boolean;
  overTotal: boolean;
}

/**
 * Simulate game outcomes from score distributions
 */
export function simulateGame(
  homeDist: ScoreDistribution,
  awayDist: ScoreDistribution,
  nSimulations: number = 50000
): GameSimulation[] {
  const simulations: GameSimulation[] = [];
  
  for (let i = 0; i < nSimulations; i++) {
    // Sample from normal distributions (can be extended to mixture models)
    const homeScore = Math.max(0, Math.round(
      homeDist.mean + (Math.random() * 2 - 1) * homeDist.stdDev * 2
    ));
    const awayScore = Math.max(0, Math.round(
      awayDist.mean + (Math.random() * 2 - 1) * awayDist.stdDev * 2
    ));
    
    const margin = homeScore - awayScore;
    const total = homeScore + awayScore;
    
    simulations.push({
      homeScore,
      awayScore,
      margin,
      total,
      homeWin: margin > 0,
      coverSpread: false, // Will be set based on spread
      overTotal: false, // Will be set based on total
    });
  }
  
  return simulations;
}

/**
 * Price markets from simulations
 */
export function priceMarketsFromSimulations(
  simulations: GameSimulation[],
  spread: number,
  total: number
): {
  homeWinProb: number;
  awayWinProb: number;
  homeCoverProb: number;
  awayCoverProb: number;
  overProb: number;
  underProb: number;
} {
  const n = simulations.length;
  
  // Mark spread and total outcomes
  const marked = simulations.map(sim => ({
    ...sim,
    coverSpread: sim.margin > spread,
    overTotal: sim.total > total,
  }));
  
  const homeWins = marked.filter(s => s.homeWin).length;
  const homeCovers = marked.filter(s => s.coverSpread).length;
  const overs = marked.filter(s => s.overTotal).length;
  
  return {
    homeWinProb: homeWins / n,
    awayWinProb: 1 - homeWinProb,
    homeCoverProb: homeCovers / n,
    awayCoverProb: 1 - homeCoverProb,
    overProb: overs / n,
    underProb: 1 - overProb,
  };
}

// ----------------------------
// Hierarchical Bayesian Team Ratings
// ----------------------------

export interface TeamRating {
  teamId: string;
  offense: number;
  defense: number;
  specialTeams: number;
  pace: number; // plays per game
  homeAdvantage: number;
  uncertainty: number; // rating uncertainty
  lastUpdated: Date;
}

export interface GameFeatures {
  gameId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeRating: TeamRating;
  awayRating: TeamRating;
  homeRestDays: number;
  awayRestDays: number;
  homeInjuryImpact: number; // 0-1 scale
  awayInjuryImpact: number;
  weatherImpact: number; // 0-1 scale
  divisionalGame: boolean;
  primetime: boolean;
  homeEPA: number; // Expected Points Added per play
  awayEPA: number;
  homeSuccessRate: number;
  awaySuccessRate: number;
}

/**
 * Predict score distributions from game features
 */
export function predictScoreDistributions(
  features: GameFeatures
): {
  home: ScoreDistribution;
  away: ScoreDistribution;
} {
  // Base scoring rate
  const homeBaseRate = features.homeRating.offense - features.awayRating.defense;
  const awayBaseRate = features.awayRating.offense - features.homeRating.defense;
  
  // Adjust for pace
  const homePlays = features.homeRating.pace * (1 + features.homeRestDays * 0.02);
  const awayPlays = features.awayRating.pace * (1 + features.awayRestDays * 0.02);
  
  // Adjust for injuries
  const homeAdj = homeBaseRate * (1 - features.homeInjuryImpact * 0.15);
  const awayAdj = awayBaseRate * (1 - features.awayInjuryImpact * 0.15);
  
  // Adjust for weather
  const homeWeatherAdj = homeAdj * (1 - features.weatherImpact * 0.1);
  const awayWeatherAdj = awayAdj * (1 - features.weatherImpact * 0.1);
  
  // Home field advantage
  const homeFinal = homeWeatherAdj + features.homeRating.homeAdvantage;
  const awayFinal = awayWeatherAdj;
  
  // Convert to points per game (rough approximation)
  const homeMean = Math.max(0, Math.min(50, homeFinal * 0.7 + 20));
  const awayMean = Math.max(0, Math.min(50, awayFinal * 0.7 + 20));
  
  // Standard deviation (NFL scoring is roughly 10-12 points std dev)
  const homeStd = 10 + features.homeRating.uncertainty * 3;
  const awayStd = 10 + features.awayRating.uncertainty * 3;
  
  return {
    home: {
      mean: homeMean,
      stdDev: homeStd,
      quantiles: {
        q10: homeMean - 1.28 * homeStd,
        q25: homeMean - 0.67 * homeStd,
        q50: homeMean,
        q75: homeMean + 0.67 * homeStd,
        q90: homeMean + 1.28 * homeStd,
      },
    },
    away: {
      mean: awayMean,
      stdDev: awayStd,
      quantiles: {
        q10: awayMean - 1.28 * awayStd,
        q25: awayMean - 0.67 * awayStd,
        q50: awayMean,
        q75: awayMean + 0.67 * awayStd,
        q90: awayMean + 1.28 * awayStd,
      },
    },
  };
}

// ----------------------------
// Signal Generation
// ----------------------------

export interface MarketOdds {
  gameId: string;
  book: string;
  timestamp: string;
  homeML: number;
  awayML: number;
  spread: number;
  spreadPrice: number; // -110 typically
  total: number;
  totalPrice: number;
}

export function generateBetSignals(
  features: GameFeatures,
  odds: MarketOdds[],
  minEV: number = 0.01,
  kellyFraction: number = 0.25
): BetSignal[] {
  const signals: BetSignal[] = [];
  
  // Predict score distributions
  const dists = predictScoreDistributions(features);
  
  // Simulate games
  const simulations = simulateGame(dists.home, dists.away, 50000);
  
  for (const marketOdds of odds) {
    // Price all markets from simulations
    const probs = priceMarketsFromSimulations(
      simulations,
      marketOdds.spread,
      marketOdds.total
    );
    
    // Moneyline signals
    const homeEV = expectedValue(probs.homeWinProb, marketOdds.homeML);
    if (homeEV >= minEV) {
      signals.push({
        gameId: features.gameId,
        market: "moneyline_home",
        book: marketOdds.book,
        timestamp: marketOdds.timestamp,
        priceAmerican: marketOdds.homeML,
        fairProb: probs.homeWinProb,
        ev: homeEV,
        kellyFrac: fractionalKelly(probs.homeWinProb, marketOdds.homeML, kellyFraction),
        confidence: Math.min(1, Math.abs(homeEV) * 10),
      });
    }
    
    const awayEV = expectedValue(probs.awayWinProb, marketOdds.awayML);
    if (awayEV >= minEV) {
      signals.push({
        gameId: features.gameId,
        market: "moneyline_away",
        book: marketOdds.book,
        timestamp: marketOdds.timestamp,
        priceAmerican: marketOdds.awayML,
        fairProb: probs.awayWinProb,
        ev: awayEV,
        kellyFrac: fractionalKelly(probs.awayWinProb, marketOdds.awayML, kellyFraction),
        confidence: Math.min(1, Math.abs(awayEV) * 10),
      });
    }
    
    // Spread signals
    const homeCoverEV = expectedValue(probs.homeCoverProb, marketOdds.spreadPrice);
    if (homeCoverEV >= minEV) {
      signals.push({
        gameId: features.gameId,
        market: `spread_home_${marketOdds.spread}`,
        book: marketOdds.book,
        timestamp: marketOdds.timestamp,
        priceAmerican: marketOdds.spreadPrice,
        fairProb: probs.homeCoverProb,
        ev: homeCoverEV,
        kellyFrac: fractionalKelly(probs.homeCoverProb, marketOdds.spreadPrice, kellyFraction),
        confidence: Math.min(1, Math.abs(homeCoverEV) * 10),
      });
    }
    
    // Total signals
    const overEV = expectedValue(probs.overProb, marketOdds.totalPrice);
    if (overEV >= minEV) {
      signals.push({
        gameId: features.gameId,
        market: `total_over_${marketOdds.total}`,
        book: marketOdds.book,
        timestamp: marketOdds.timestamp,
        priceAmerican: marketOdds.totalPrice,
        fairProb: probs.overProb,
        ev: overEV,
        kellyFrac: fractionalKelly(probs.overProb, marketOdds.totalPrice, kellyFraction),
        confidence: Math.min(1, Math.abs(overEV) * 10),
      });
    }
  }
  
  // Sort by EV then Kelly fraction
  return signals.sort((a, b) => {
    if (Math.abs(b.ev - a.ev) > 0.001) {
      return b.ev - a.ev;
    }
    return b.kellyFrac - a.kellyFrac;
  });
}

// ----------------------------
// CLV Tracking
// ----------------------------

export interface CLVRecord {
  betId: string;
  gameId: string;
  market: string;
  betTime: string;
  betPrice: number;
  closingPrice?: number;
  closingTime?: string;
  clv?: number; // Closing Line Value
  result?: "win" | "loss" | "push";
  profit?: number;
}

export function calculateCLV(
  betPrice: number,
  closingPrice: number
): number {
  const betProb = americanToImpliedProb(betPrice);
  const closingProb = americanToImpliedProb(closingPrice);
  return betProb - closingProb; // Positive = got better price
}

// ----------------------------
// Risk Control
// ----------------------------

export interface BankrollState {
  currentBankroll: number;
  targetKellyFraction: number;
  maxBetSize: number;
  correlationMatrix: Map<string, Map<string, number>>; // game-market correlations
}

export function calculateBetSize(
  signal: BetSignal,
  bankroll: BankrollState
): number {
  const kellyStake = signal.kellyFrac * bankroll.currentBankroll;
  const maxStake = bankroll.maxBetSize;
  
  // Apply correlation penalty if needed
  // (simplified - in practice would check against existing positions)
  
  return Math.min(kellyStake, maxStake);
}
