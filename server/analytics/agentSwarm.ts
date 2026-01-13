import * as ss from "simple-statistics";
import * as math from "mathjs";
import _ from "lodash";
import { OmniEngine, TeamMetrics, ExploitSignal } from "./omniEngine";

export interface AgentPrediction {
  agentName: string;
  predictedSpread: number;
  predictedTotal: number;
  homeWinProbability: number;
  confidence: number;
  reasoning: string;
  signals: ExploitSignal[];
}

export interface StatsInput {
  homeTeam: TeamMetrics;
  awayTeam: TeamMetrics;
}

export interface MarketInput {
  openingSpread: number;
  currentSpread: number;
  openingTotal: number;
  currentTotal: number;
  publicBetPercentSpread: number;
  publicBetPercentTotal: number;
  sharpMoneyIndicator?: "home" | "away" | "over" | "under" | null;
}

export interface WeatherInput {
  temperature: number;
  windSpeed: number;
  precipitation: boolean;
  isDome: boolean;
}

export interface InjuryInput {
  homeInjuries: { position: string; player: string; pointDrop: number }[];
  awayInjuries: { position: string; player: string; pointDrop: number }[];
}

export interface TrendInput {
  homeRecentResults: number[];
  awayRecentResults: number[];
  homeAtsRecord: { wins: number; losses: number; pushes: number };
  awayAtsRecord: { wins: number; losses: number; pushes: number };
  homeStreak: number;
  awayStreak: number;
}

export interface SwarmAnalysisInput {
  homeTeamName: string;
  awayTeamName: string;
  currentSpread: number;
  currentTotal: number;
  stats?: StatsInput;
  market?: MarketInput;
  weather?: WeatherInput;
  injuries?: InjuryInput;
  trends?: TrendInput;
}

export interface MonteCarloResult {
  simulations: number;
  homeScoreDistribution: { mean: number; stdDev: number; min: number; max: number };
  awayScoreDistribution: { mean: number; stdDev: number; min: number; max: number };
  spreadDistribution: { mean: number; stdDev: number };
  totalDistribution: { mean: number; stdDev: number };
  homeWinProbability: number;
  spreadCoverProbability: number;
  overProbability: number;
  confidenceIntervals: {
    spread68: { lower: number; upper: number };
    spread95: { lower: number; upper: number };
    total68: { lower: number; upper: number };
    total95: { lower: number; upper: number };
  };
  uncertaintyBands: {
    spreadUncertainty: number;
    totalUncertainty: number;
    overallUncertainty: number;
  };
  scoreFrequencies: { home: number[]; away: number[] };
}

export interface ConsensusResult {
  predictedSpread: number;
  predictedTotal: number;
  homeWinProbability: number;
  spreadCoverProbability: number;
  overProbability: number;
  confidence: number;
  marketPrice: {
    fairSpread: number;
    fairTotal: number;
    spreadEdge: number;
    totalEdge: number;
  };
  agentWeights: Record<string, number>;
  agentContributions: AgentPrediction[];
}

export interface KellyRecommendation {
  betType: "spread" | "total" | "moneyline";
  side: string;
  edge: number;
  impliedProbability: number;
  trueProbability: number;
  kellySizes: {
    quarter: number;
    half: number;
    full: number;
  };
  recommendedSize: "quarter" | "half" | "full" | "no_bet";
  recommendedUnits: number;
  evPerUnit: number;
  uncertaintyAdjustedEv: number;
  passesThreshold: boolean;
  reasoning: string;
}

export interface SwarmAnalysisResult {
  homeTeam: string;
  awayTeam: string;
  timestamp: string;
  agents: AgentPrediction[];
  consensus: ConsensusResult;
  monteCarlo: MonteCarloResult;
  kellyRecommendations: KellyRecommendation[];
  exploitSignals: ExploitSignal[];
  overallConfidence: number;
  riskLevel: "low" | "medium" | "high";
}

function poissonRandom(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

function normalRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * stdDev;
}

export class StatsAgent {
  analyze(stats: StatsInput, currentSpread: number, currentTotal: number): AgentPrediction {
    const { homeTeam, awayTeam } = stats;
    const signals: ExploitSignal[] = [];

    const epaDiff = homeTeam.epaPerPlay - awayTeam.epaPerPlay;
    const successRateDiff = homeTeam.successRate - awayTeam.successRate;
    const cpoeDiff = homeTeam.cpoe - awayTeam.cpoe;
    const pressureDiff = homeTeam.hdPressureRate - awayTeam.hdPressureRate;
    const redZoneDiff = homeTeam.redZoneEpa - awayTeam.redZoneEpa;

    const predictedMargin = (epaDiff * 14) + (successRateDiff * 7) + (cpoeDiff * 0.5) + (redZoneDiff * 3);
    const homeAdvantage = 2.5;
    const adjustedMargin = predictedMargin + homeAdvantage;

    const homeExpectedPoints = 22 + (homeTeam.epaPerPlay * 10) + (homeTeam.redZoneEpa * 3);
    const awayExpectedPoints = 22 + (awayTeam.epaPerPlay * 10) + (awayTeam.redZoneEpa * 3);
    const predictedTotal = homeExpectedPoints + awayExpectedPoints;

    const predictedSpread = -adjustedMargin;
    const homeWinProbability = 1 / (1 + Math.exp(-adjustedMargin / 7));

    let confidence = 0.6;
    if (Math.abs(epaDiff) > 0.1) confidence += 0.1;
    if (Math.abs(cpoeDiff) > 3) confidence += 0.1;
    if (Math.abs(pressureDiff) > 0.1) confidence += 0.1;
    confidence = Math.min(0.95, confidence);

    signals.push(...OmniEngine.detectGodmode(homeTeam));
    signals.push(...OmniEngine.detectGodmode(awayTeam));

    if (Math.abs(epaDiff) > 0.15) {
      signals.push({
        type: "sharp",
        description: `Significant EPA differential: ${epaDiff > 0 ? homeTeam.teamName : awayTeam.teamName} +${Math.abs(epaDiff).toFixed(3)} EPA/play`,
        confidence: 0.75,
        recommendedAction: epaDiff > 0 ? "Back home team" : "Back away team",
        edge: Math.abs(epaDiff) * 0.3,
      });
    }

    return {
      agentName: "StatsAgent",
      predictedSpread,
      predictedTotal,
      homeWinProbability,
      confidence,
      reasoning: `EPA differential ${epaDiff.toFixed(3)}, Success rate diff ${(successRateDiff * 100).toFixed(1)}%, CPOE diff ${cpoeDiff.toFixed(1)}`,
      signals,
    };
  }
}

export class MarketAgent {
  analyze(market: MarketInput, currentSpread: number, currentTotal: number): AgentPrediction {
    const signals: ExploitSignal[] = [];

    const spreadMove = currentSpread - market.openingSpread;
    const totalMove = currentTotal - market.openingTotal;
    const anomalies = OmniEngine.detectLineAnomalies(
      market.openingSpread,
      currentSpread,
      market.publicBetPercentSpread
    );

    let predictedSpread = currentSpread;
    let predictedTotal = currentTotal;
    let confidence = 0.65;

    if (anomalies.isSteam) {
      predictedSpread = currentSpread + (spreadMove > 0 ? 1 : -1);
      confidence += 0.15;
      signals.push({
        type: "steam",
        description: `Steam move detected: ${Math.abs(spreadMove).toFixed(1)} point move against ${market.publicBetPercentSpread.toFixed(0)}% public`,
        confidence: 0.85,
        recommendedAction: spreadMove > 0 ? "Fade public, take home" : "Fade public, take away",
        edge: 0.08,
      });
    }

    if (anomalies.isTrap) {
      confidence += 0.1;
      signals.push({
        type: "trap",
        description: `Trap line alert: ${market.publicBetPercentSpread.toFixed(0)}% public side but line moving against them`,
        confidence: 0.80,
        recommendedAction: "Consider fading the public",
        edge: 0.06,
      });
    }

    if (anomalies.isReverseLineMove) {
      signals.push({
        type: "sharp",
        description: `Reverse line movement: Sharp money on opposite side of public`,
        confidence: 0.75,
        recommendedAction: "Follow the sharp money",
        edge: 0.05,
      });
    }

    if (market.sharpMoneyIndicator) {
      confidence += 0.1;
      const sharpSide = market.sharpMoneyIndicator;
      if (sharpSide === "home" || sharpSide === "away") {
        predictedSpread += sharpSide === "home" ? -1.5 : 1.5;
      } else {
        predictedTotal += sharpSide === "over" ? 2 : -2;
      }
      signals.push({
        type: "sharp",
        description: `Sharp money indicator on ${sharpSide}`,
        confidence: 0.82,
        recommendedAction: `Consider ${sharpSide}`,
        edge: 0.07,
      });
    }

    const homeWinProbability = 0.5 + (currentSpread / 14);

    return {
      agentName: "MarketAgent",
      predictedSpread,
      predictedTotal,
      homeWinProbability: Math.max(0.1, Math.min(0.9, homeWinProbability)),
      confidence: Math.min(0.9, confidence),
      reasoning: `Line moved ${spreadMove.toFixed(1)} pts, Public: ${market.publicBetPercentSpread.toFixed(0)}%, ${anomalies.isSteam ? "STEAM" : anomalies.isTrap ? "TRAP" : "Normal"}`,
      signals,
    };
  }
}

export class WeatherAgent {
  analyze(weather: WeatherInput, currentSpread: number, currentTotal: number): AgentPrediction {
    const signals: ExploitSignal[] = [];

    if (weather.isDome) {
      return {
        agentName: "WeatherAgent",
        predictedSpread: currentSpread,
        predictedTotal: currentTotal,
        homeWinProbability: 0.5,
        confidence: 0.5,
        reasoning: "Indoor game - no weather impact",
        signals: [],
      };
    }

    const impact = OmniEngine.calculateWeatherImpact(
      weather.windSpeed,
      weather.temperature,
      weather.precipitation
    );

    let totalAdjustment = 0;
    let confidence = 0.6;

    if (weather.windSpeed > 20) {
      totalAdjustment -= 6;
      confidence += 0.15;
      signals.push({
        type: "weather",
        description: `High winds (${weather.windSpeed} mph) - significant passing game impact`,
        confidence: 0.85,
        recommendedAction: "Strong under lean, target rushing props",
        edge: 0.08,
      });
    } else if (weather.windSpeed > 15) {
      totalAdjustment -= 3;
      confidence += 0.1;
    }

    if (weather.temperature < 32) {
      totalAdjustment -= 2;
      confidence += 0.05;
      signals.push({
        type: "weather",
        description: `Freezing conditions (${weather.temperature}°F) - affects ball handling and kicking`,
        confidence: 0.75,
        recommendedAction: "Under lean, potential for turnovers",
        edge: 0.05,
      });
    }

    if (weather.precipitation) {
      totalAdjustment -= 4;
      confidence += 0.1;
      signals.push({
        type: "weather",
        description: "Precipitation expected - sloppy conditions",
        confidence: 0.80,
        recommendedAction: "Strong under lean, rushing focus",
        edge: 0.07,
      });
    }

    const predictedTotal = currentTotal + totalAdjustment;

    return {
      agentName: "WeatherAgent",
      predictedSpread: currentSpread,
      predictedTotal,
      homeWinProbability: 0.52,
      confidence: Math.min(0.85, confidence),
      reasoning: `${impact.recommendation}. Passing decay: ${(impact.passingDecay * 100).toFixed(0)}%`,
      signals,
    };
  }
}

export class InjuryAgent {
  analyze(injuries: InjuryInput, currentSpread: number, currentTotal: number): AgentPrediction {
    const signals: ExploitSignal[] = [];

    const homeImpact = OmniEngine.calculateInjuryCascade(injuries.homeInjuries);
    const awayImpact = OmniEngine.calculateInjuryCascade(injuries.awayInjuries);

    const netInjuryImpact = homeImpact.totalImpact - awayImpact.totalImpact;
    const spreadAdjustment = netInjuryImpact * 0.8;
    const totalAdjustment = -(homeImpact.totalImpact + awayImpact.totalImpact) * 0.5;

    let confidence = 0.55;

    if (homeImpact.clusterAlert) {
      confidence += 0.15;
      signals.push({
        type: "injury",
        description: `Home team O-Line cluster injury (${injuries.homeInjuries.filter(i => ["LT", "LG", "C", "RG", "RT"].includes(i.position)).length} starters out)`,
        confidence: 0.85,
        recommendedAction: "Fade home team, target under",
        edge: 0.09,
      });
    }

    if (awayImpact.clusterAlert) {
      confidence += 0.15;
      signals.push({
        type: "injury",
        description: `Away team O-Line cluster injury`,
        confidence: 0.85,
        recommendedAction: "Back home team, target under",
        edge: 0.09,
      });
    }

    const qbInjuries = [...injuries.homeInjuries, ...injuries.awayInjuries].filter(
      i => i.position === "QB"
    );
    if (qbInjuries.length > 0) {
      confidence += 0.2;
      for (const qb of qbInjuries) {
        const isHome = injuries.homeInjuries.some(i => i.player === qb.player);
        signals.push({
          type: "injury",
          description: `QB ${qb.player} out - ${qb.pointDrop} point impact`,
          confidence: 0.90,
          recommendedAction: isHome ? "Fade home team" : "Back home team",
          edge: qb.pointDrop / 20,
        });
      }
    }

    if (Math.abs(netInjuryImpact) > 3) {
      signals.push({
        type: "injury",
        description: `Significant injury disparity: ${netInjuryImpact > 0 ? "Home" : "Away"} team more affected by ${Math.abs(netInjuryImpact).toFixed(1)} points`,
        confidence: 0.78,
        recommendedAction: netInjuryImpact > 0 ? "Fade home team" : "Back home team",
        edge: Math.abs(netInjuryImpact) / 25,
      });
    }

    return {
      agentName: "InjuryAgent",
      predictedSpread: currentSpread + spreadAdjustment,
      predictedTotal: currentTotal + totalAdjustment,
      homeWinProbability: 0.5 - (netInjuryImpact / 20),
      confidence: Math.min(0.9, confidence),
      reasoning: `${homeImpact.recommendation} | ${awayImpact.recommendation}`,
      signals,
    };
  }
}

export class TrendAgent {
  analyze(trends: TrendInput, currentSpread: number, currentTotal: number): AgentPrediction {
    const signals: ExploitSignal[] = [];

    const homeTrend = OmniEngine.calculateTrend(trends.homeRecentResults);
    const awayTrend = OmniEngine.calculateTrend(trends.awayRecentResults);

    const homeAtsWinPct = trends.homeAtsRecord.wins /
      (trends.homeAtsRecord.wins + trends.homeAtsRecord.losses || 1);
    const awayAtsWinPct = trends.awayAtsRecord.wins /
      (trends.awayAtsRecord.wins + trends.awayAtsRecord.losses || 1);

    let spreadAdjustment = 0;
    let confidence = 0.55;

    if (homeTrend.direction === "improving" && homeTrend.r2 > 0.5) {
      spreadAdjustment -= 1;
      confidence += 0.1;
      signals.push({
        type: "sharp",
        description: `Home team trending up (slope: ${homeTrend.slope.toFixed(2)}, R²: ${homeTrend.r2.toFixed(2)})`,
        confidence: 0.72,
        recommendedAction: "Consider home team momentum play",
        edge: 0.04,
      });
    } else if (homeTrend.direction === "declining" && homeTrend.r2 > 0.5) {
      spreadAdjustment += 1;
      confidence += 0.1;
    }

    if (awayTrend.direction === "improving" && awayTrend.r2 > 0.5) {
      spreadAdjustment += 1;
      confidence += 0.1;
    } else if (awayTrend.direction === "declining" && awayTrend.r2 > 0.5) {
      spreadAdjustment -= 1;
      confidence += 0.1;
    }

    if (homeAtsWinPct > 0.60) {
      confidence += 0.08;
      signals.push({
        type: "sharp",
        description: `Home team strong ATS: ${(homeAtsWinPct * 100).toFixed(0)}%`,
        confidence: 0.70,
        recommendedAction: "Consider home spread",
        edge: (homeAtsWinPct - 0.52) * 0.3,
      });
    }

    if (awayAtsWinPct > 0.60) {
      confidence += 0.08;
      signals.push({
        type: "sharp",
        description: `Away team strong ATS: ${(awayAtsWinPct * 100).toFixed(0)}%`,
        confidence: 0.70,
        recommendedAction: "Consider away spread",
        edge: (awayAtsWinPct - 0.52) * 0.3,
      });
    }

    if (Math.abs(trends.homeStreak) >= 3) {
      const isWinStreak = trends.homeStreak > 0;
      signals.push({
        type: isWinStreak ? "sharp" : "trap",
        description: `Home team on ${Math.abs(trends.homeStreak)} game ${isWinStreak ? "win" : "losing"} streak`,
        confidence: 0.65,
        recommendedAction: isWinStreak ? "Momentum play" : "Potential bounce-back",
        edge: 0.03,
      });
    }

    if (Math.abs(trends.awayStreak) >= 3) {
      const isWinStreak = trends.awayStreak > 0;
      signals.push({
        type: isWinStreak ? "sharp" : "trap",
        description: `Away team on ${Math.abs(trends.awayStreak)} game ${isWinStreak ? "win" : "losing"} streak`,
        confidence: 0.65,
        recommendedAction: isWinStreak ? "Momentum play" : "Potential bounce-back",
        edge: 0.03,
      });
    }

    const homeWinProbability = 0.5 + (homeAtsWinPct - awayAtsWinPct) * 0.3 +
      (homeTrend.slope - awayTrend.slope) * 0.1;

    return {
      agentName: "TrendAgent",
      predictedSpread: currentSpread + spreadAdjustment,
      predictedTotal: currentTotal,
      homeWinProbability: Math.max(0.2, Math.min(0.8, homeWinProbability)),
      confidence: Math.min(0.85, confidence),
      reasoning: `Home trend: ${homeTrend.direction}, Away trend: ${awayTrend.direction}. Home ATS: ${(homeAtsWinPct * 100).toFixed(0)}%, Away ATS: ${(awayAtsWinPct * 100).toFixed(0)}%`,
      signals,
    };
  }
}

export function runMonteCarloSimulation(
  homeExpectedPoints: number,
  awayExpectedPoints: number,
  spread: number,
  total: number,
  simulations: number = 10000,
  variance: number = 10
): MonteCarloResult {
  const homeScores: number[] = [];
  const awayScores: number[] = [];
  let homeWins = 0;
  let spreadCovers = 0;
  let overs = 0;

  for (let i = 0; i < simulations; i++) {
    const homeVariance = normalRandom(0, variance * 0.3);
    const awayVariance = normalRandom(0, variance * 0.3);

    const adjustedHomeLambda = Math.max(10, homeExpectedPoints + homeVariance);
    const adjustedAwayLambda = Math.max(10, awayExpectedPoints + awayVariance);

    const homeScore = poissonRandom(adjustedHomeLambda);
    const awayScore = poissonRandom(adjustedAwayLambda);

    homeScores.push(homeScore);
    awayScores.push(awayScore);

    if (homeScore > awayScore) homeWins++;
    if (homeScore + spread > awayScore) spreadCovers++;
    if (homeScore + awayScore > total) overs++;
  }

  const spreads = homeScores.map((h, i) => h - awayScores[i]);
  const totals = homeScores.map((h, i) => h + awayScores[i]);

  const homeMean = ss.mean(homeScores);
  const homeStdDev = ss.standardDeviation(homeScores);
  const awayMean = ss.mean(awayScores);
  const awayStdDev = ss.standardDeviation(awayScores);
  const spreadMean = ss.mean(spreads);
  const spreadStdDev = ss.standardDeviation(spreads);
  const totalMean = ss.mean(totals);
  const totalStdDev = ss.standardDeviation(totals);

  const sortedSpreads = [...spreads].sort((a, b) => a - b);
  const sortedTotals = [...totals].sort((a, b) => a - b);

  const spread68Lower = sortedSpreads[Math.floor(simulations * 0.16)];
  const spread68Upper = sortedSpreads[Math.floor(simulations * 0.84)];
  const spread95Lower = sortedSpreads[Math.floor(simulations * 0.025)];
  const spread95Upper = sortedSpreads[Math.floor(simulations * 0.975)];

  const total68Lower = sortedTotals[Math.floor(simulations * 0.16)];
  const total68Upper = sortedTotals[Math.floor(simulations * 0.84)];
  const total95Lower = sortedTotals[Math.floor(simulations * 0.025)];
  const total95Upper = sortedTotals[Math.floor(simulations * 0.975)];

  const homeFreq = new Array(71).fill(0);
  const awayFreq = new Array(71).fill(0);
  for (const score of homeScores) {
    if (score <= 70) homeFreq[score]++;
  }
  for (const score of awayScores) {
    if (score <= 70) awayFreq[score]++;
  }

  return {
    simulations,
    homeScoreDistribution: {
      mean: homeMean,
      stdDev: homeStdDev,
      min: Math.min(...homeScores),
      max: Math.max(...homeScores),
    },
    awayScoreDistribution: {
      mean: awayMean,
      stdDev: awayStdDev,
      min: Math.min(...awayScores),
      max: Math.max(...awayScores),
    },
    spreadDistribution: { mean: spreadMean, stdDev: spreadStdDev },
    totalDistribution: { mean: totalMean, stdDev: totalStdDev },
    homeWinProbability: homeWins / simulations,
    spreadCoverProbability: spreadCovers / simulations,
    overProbability: overs / simulations,
    confidenceIntervals: {
      spread68: { lower: spread68Lower, upper: spread68Upper },
      spread95: { lower: spread95Lower, upper: spread95Upper },
      total68: { lower: total68Lower, upper: total68Upper },
      total95: { lower: total95Lower, upper: total95Upper },
    },
    uncertaintyBands: {
      spreadUncertainty: spreadStdDev / Math.abs(spreadMean || 1),
      totalUncertainty: totalStdDev / totalMean,
      overallUncertainty: (spreadStdDev + totalStdDev) / 2,
    },
    scoreFrequencies: { home: homeFreq, away: awayFreq },
  };
}

export function calculateConsensus(agents: AgentPrediction[]): ConsensusResult {
  const baseWeights: Record<string, number> = {
    StatsAgent: 0.30,
    MarketAgent: 0.25,
    WeatherAgent: 0.15,
    InjuryAgent: 0.15,
    TrendAgent: 0.15,
  };

  const adjustedWeights: Record<string, number> = {};
  let totalWeight = 0;

  for (const agent of agents) {
    const baseWeight = baseWeights[agent.agentName] || 0.1;
    const confidenceBoost = (agent.confidence - 0.5) * 0.5;
    adjustedWeights[agent.agentName] = Math.max(0.05, baseWeight + confidenceBoost);
    totalWeight += adjustedWeights[agent.agentName];
  }

  for (const key of Object.keys(adjustedWeights)) {
    adjustedWeights[key] /= totalWeight;
  }

  let predictedSpread = 0;
  let predictedTotal = 0;
  let homeWinProbability = 0;
  let totalConfidence = 0;

  for (const agent of agents) {
    const weight = adjustedWeights[agent.agentName];
    predictedSpread += agent.predictedSpread * weight;
    predictedTotal += agent.predictedTotal * weight;
    homeWinProbability += agent.homeWinProbability * weight;
    totalConfidence += agent.confidence * weight;
  }

  const spreadVariance = agents.reduce((sum, agent) => {
    const weight = adjustedWeights[agent.agentName];
    return sum + weight * Math.pow(agent.predictedSpread - predictedSpread, 2);
  }, 0);
  const spreadStdDev = Math.sqrt(spreadVariance);

  const equilibriumAdjustment = spreadStdDev > 3 ? 0 : spreadStdDev > 1.5 ? 0.5 : 1;
  const fairSpread = predictedSpread * equilibriumAdjustment;

  const spreadCoverProbability = 1 / (1 + Math.exp((fairSpread) / 4));
  const overProbability = 0.5;

  return {
    predictedSpread,
    predictedTotal,
    homeWinProbability,
    spreadCoverProbability,
    overProbability,
    confidence: totalConfidence,
    marketPrice: {
      fairSpread,
      fairTotal: predictedTotal,
      spreadEdge: 0,
      totalEdge: 0,
    },
    agentWeights: adjustedWeights,
    agentContributions: agents,
  };
}

export function calculateKellyWithUncertainty(
  trueProbability: number,
  odds: number,
  uncertainty: number,
  bankroll: number = 1000,
  uncertaintyThreshold: number = 0.03
): KellyRecommendation {
  const impliedProbability = odds > 0 ? 100 / (odds + 100) : -odds / (-odds + 100);
  const edge = trueProbability - impliedProbability;
  const decimalOdds = odds > 0 ? odds / 100 + 1 : 100 / -odds + 1;
  const b = decimalOdds - 1;

  const adjustedTrueProbability = trueProbability - (uncertainty * 0.5);
  const adjustedEdge = adjustedTrueProbability - impliedProbability;

  const kelly = Math.max(0, (b * adjustedTrueProbability - (1 - adjustedTrueProbability)) / b);

  const fullKelly = kelly * bankroll;
  const halfKelly = fullKelly * 0.5;
  const quarterKelly = fullKelly * 0.25;

  const ev = trueProbability * b - (1 - trueProbability);
  const uncertaintyAdjustedEv = adjustedTrueProbability * b - (1 - adjustedTrueProbability);

  const passesThreshold = adjustedEdge > uncertaintyThreshold && uncertainty < 0.3;

  let recommendedSize: "quarter" | "half" | "full" | "no_bet" = "no_bet";
  let recommendedUnits = 0;

  if (passesThreshold) {
    if (adjustedEdge > 0.08 && uncertainty < 0.15) {
      recommendedSize = "full";
      recommendedUnits = fullKelly;
    } else if (adjustedEdge > 0.05 && uncertainty < 0.2) {
      recommendedSize = "half";
      recommendedUnits = halfKelly;
    } else if (adjustedEdge > 0.03) {
      recommendedSize = "quarter";
      recommendedUnits = quarterKelly;
    }
  }

  let reasoning = "";
  if (!passesThreshold) {
    if (adjustedEdge <= uncertaintyThreshold) {
      reasoning = `Edge (${(adjustedEdge * 100).toFixed(1)}%) below threshold (${(uncertaintyThreshold * 100).toFixed(1)}%)`;
    } else {
      reasoning = `Uncertainty (${(uncertainty * 100).toFixed(1)}%) too high for confident bet`;
    }
  } else {
    reasoning = `${recommendedSize.toUpperCase()} Kelly recommended. Edge: ${(adjustedEdge * 100).toFixed(1)}%, Uncertainty: ${(uncertainty * 100).toFixed(1)}%`;
  }

  return {
    betType: "spread",
    side: trueProbability > 0.5 ? "home" : "away",
    edge: adjustedEdge,
    impliedProbability,
    trueProbability: adjustedTrueProbability,
    kellySizes: {
      quarter: quarterKelly,
      half: halfKelly,
      full: fullKelly,
    },
    recommendedSize,
    recommendedUnits,
    evPerUnit: ev * 100,
    uncertaintyAdjustedEv: uncertaintyAdjustedEv * 100,
    passesThreshold,
    reasoning,
  };
}

export async function runAgentSwarmAnalysis(input: SwarmAnalysisInput): Promise<SwarmAnalysisResult> {
  const agents: AgentPrediction[] = [];
  const allSignals: ExploitSignal[] = [];

  const defaultHomeMetrics: TeamMetrics = {
    teamId: 0,
    teamName: input.homeTeamName,
    epaPerPlay: 0.05,
    successRate: 0.45,
    cpoe: 1.0,
    hdPressureRate: 0.25,
    redZoneEpa: 0.1,
    vigFreePercent: 0.52,
  };

  const defaultAwayMetrics: TeamMetrics = {
    teamId: 0,
    teamName: input.awayTeamName,
    epaPerPlay: 0.03,
    successRate: 0.43,
    cpoe: 0.5,
    hdPressureRate: 0.22,
    redZoneEpa: 0.05,
    vigFreePercent: 0.50,
  };

  if (input.stats) {
    const statsAgent = new StatsAgent();
    const statsPrediction = statsAgent.analyze(input.stats, input.currentSpread, input.currentTotal);
    agents.push(statsPrediction);
    allSignals.push(...statsPrediction.signals);
  } else {
    const statsAgent = new StatsAgent();
    const statsPrediction = statsAgent.analyze(
      { homeTeam: defaultHomeMetrics, awayTeam: defaultAwayMetrics },
      input.currentSpread,
      input.currentTotal
    );
    agents.push(statsPrediction);
  }

  if (input.market) {
    const marketAgent = new MarketAgent();
    const marketPrediction = marketAgent.analyze(input.market, input.currentSpread, input.currentTotal);
    agents.push(marketPrediction);
    allSignals.push(...marketPrediction.signals);
  } else {
    agents.push({
      agentName: "MarketAgent",
      predictedSpread: input.currentSpread,
      predictedTotal: input.currentTotal,
      homeWinProbability: 0.5,
      confidence: 0.5,
      reasoning: "No market data provided - using current line as baseline",
      signals: [],
    });
  }

  if (input.weather) {
    const weatherAgent = new WeatherAgent();
    const weatherPrediction = weatherAgent.analyze(input.weather, input.currentSpread, input.currentTotal);
    agents.push(weatherPrediction);
    allSignals.push(...weatherPrediction.signals);
  } else {
    agents.push({
      agentName: "WeatherAgent",
      predictedSpread: input.currentSpread,
      predictedTotal: input.currentTotal,
      homeWinProbability: 0.5,
      confidence: 0.5,
      reasoning: "No weather data provided - assuming neutral conditions",
      signals: [],
    });
  }

  if (input.injuries) {
    const injuryAgent = new InjuryAgent();
    const injuryPrediction = injuryAgent.analyze(input.injuries, input.currentSpread, input.currentTotal);
    agents.push(injuryPrediction);
    allSignals.push(...injuryPrediction.signals);
  } else {
    agents.push({
      agentName: "InjuryAgent",
      predictedSpread: input.currentSpread,
      predictedTotal: input.currentTotal,
      homeWinProbability: 0.5,
      confidence: 0.5,
      reasoning: "No injury data provided - assuming full strength",
      signals: [],
    });
  }

  if (input.trends) {
    const trendAgent = new TrendAgent();
    const trendPrediction = trendAgent.analyze(input.trends, input.currentSpread, input.currentTotal);
    agents.push(trendPrediction);
    allSignals.push(...trendPrediction.signals);
  } else {
    agents.push({
      agentName: "TrendAgent",
      predictedSpread: input.currentSpread,
      predictedTotal: input.currentTotal,
      homeWinProbability: 0.5,
      confidence: 0.5,
      reasoning: "No trend data provided - neutral assessment",
      signals: [],
    });
  }

  const consensus = calculateConsensus(agents);

  const homeExpected = (input.currentTotal / 2) + (consensus.predictedSpread / 2);
  const awayExpected = (input.currentTotal / 2) - (consensus.predictedSpread / 2);
  const monteCarlo = runMonteCarloSimulation(
    Math.max(14, homeExpected),
    Math.max(14, awayExpected),
    input.currentSpread,
    input.currentTotal,
    10000
  );

  consensus.marketPrice.spreadEdge = (monteCarlo.spreadCoverProbability - 0.52) * 2;
  consensus.marketPrice.totalEdge = Math.abs(monteCarlo.overProbability - 0.5) * 2;
  consensus.spreadCoverProbability = monteCarlo.spreadCoverProbability;
  consensus.overProbability = monteCarlo.overProbability;

  const kellyRecommendations: KellyRecommendation[] = [];

  const spreadKelly = calculateKellyWithUncertainty(
    monteCarlo.spreadCoverProbability,
    -110,
    monteCarlo.uncertaintyBands.spreadUncertainty,
    1000
  );
  spreadKelly.betType = "spread";
  spreadKelly.side = monteCarlo.spreadCoverProbability > 0.5 ? "home" : "away";
  kellyRecommendations.push(spreadKelly);

  const overKelly = calculateKellyWithUncertainty(
    monteCarlo.overProbability,
    -110,
    monteCarlo.uncertaintyBands.totalUncertainty,
    1000
  );
  overKelly.betType = "total";
  overKelly.side = monteCarlo.overProbability > 0.5 ? "over" : "under";
  kellyRecommendations.push(overKelly);

  const mlKelly = calculateKellyWithUncertainty(
    monteCarlo.homeWinProbability,
    input.currentSpread < 0 ? Math.round(-150 - (input.currentSpread * 10)) : Math.round(130 - (input.currentSpread * 10)),
    monteCarlo.uncertaintyBands.overallUncertainty,
    1000
  );
  mlKelly.betType = "moneyline";
  mlKelly.side = monteCarlo.homeWinProbability > 0.5 ? "home" : "away";
  kellyRecommendations.push(mlKelly);

  const overallConfidence = consensus.confidence * (1 - monteCarlo.uncertaintyBands.overallUncertainty * 0.5);

  let riskLevel: "low" | "medium" | "high" = "medium";
  if (monteCarlo.uncertaintyBands.overallUncertainty < 0.15 && consensus.confidence > 0.7) {
    riskLevel = "low";
  } else if (monteCarlo.uncertaintyBands.overallUncertainty > 0.3 || consensus.confidence < 0.5) {
    riskLevel = "high";
  }

  return {
    homeTeam: input.homeTeamName,
    awayTeam: input.awayTeamName,
    timestamp: new Date().toISOString(),
    agents,
    consensus,
    monteCarlo,
    kellyRecommendations,
    exploitSignals: allSignals,
    overallConfidence,
    riskLevel,
  };
}

export const AgentSwarm = {
  StatsAgent,
  MarketAgent,
  WeatherAgent,
  InjuryAgent,
  TrendAgent,
  runMonteCarloSimulation,
  calculateConsensus,
  calculateKellyWithUncertainty,
  runAgentSwarmAnalysis,
};
