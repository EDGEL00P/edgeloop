import OpenAI from "openai";
import { eq, and, or } from "drizzle-orm";
import * as ss from "simple-statistics";
import * as math from "mathjs";
import _ from "lodash";
import { getOpenAiApiKey } from "../infrastructure/env";

const openai = new OpenAI({
  apiKey: getOpenAiApiKey(),
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface TeamMetrics {
  teamId: number;
  teamName: string;
  epaPerPlay: number;
  successRate: number;
  cpoe: number;
  hdPressureRate: number;
  redZoneEpa: number;
  vigFreePercent: number;
}

export interface GamePrediction {
  homeTeamId: number;
  visitorTeamId: number;
  predictedHomeScore: number;
  predictedVisitorScore: number;
  spreadPrediction: number;
  totalPrediction: number;
  homeWinProbability: number;
  confidence: number;
}

export interface ExploitSignal {
  type: "steam" | "trap" | "sharp" | "weather" | "injury" | "godmode";
  description: string;
  confidence: number;
  recommendedAction: string;
  edge: number;
}

/**
 * Poisson probability distribution for NFL scoring
 */
export function poissonProbability(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / math.factorial(k);
}

/**
 * Generate score probability matrix for two teams
 */
export function generateScoreMatrix(
  homeExpectedPoints: number,
  awayExpectedPoints: number,
  maxScore: number = 50
): number[][] {
  const matrix: number[][] = [];
  for (let homeScore = 0; homeScore <= maxScore; homeScore++) {
    matrix[homeScore] = [];
    for (let awayScore = 0; awayScore <= maxScore; awayScore++) {
      matrix[homeScore][awayScore] =
        poissonProbability(homeExpectedPoints, homeScore) *
        poissonProbability(awayExpectedPoints, awayScore);
    }
  }
  return matrix;
}

/**
 * Calculate win/loss/push probabilities from score matrix
 */
export function calculateOutcomeProbabilities(
  matrix: number[][],
  spread: number = 0
): { homeWin: number; awayWin: number; push: number } {
  let homeWin = 0;
  let awayWin = 0;
  let push = 0;

  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      const margin = h - a + spread;
      if (margin > 0) homeWin += matrix[h][a];
      else if (margin < 0) awayWin += matrix[h][a];
      else push += matrix[h][a];
    }
  }

  return { homeWin, awayWin, push };
}

/**
 * Calculate Expected Value for a bet
 */
export function calculateEV(
  odds: number,
  trueProbability: number,
  stake: number = 100
): { ev: number; impliedProb: number; edge: number } {
  const impliedProb = odds > 0 ? 100 / (odds + 100) : -odds / (-odds + 100);
  const edge = trueProbability - impliedProb;
  const decimalOdds = odds > 0 ? odds / 100 + 1 : 100 / -odds + 1;
  const ev = trueProbability * (stake * (decimalOdds - 1)) - (1 - trueProbability) * stake;
  return { ev, impliedProb, edge };
}

/**
 * Kelly Criterion for optimal bet sizing
 */
export function kellyBetSize(
  edge: number,
  bankroll: number,
  odds: number
): { fullKelly: number; halfKelly: number; quarterKelly: number } {
  const decimalOdds = odds > 0 ? odds / 100 + 1 : 100 / -odds + 1;
  const b = decimalOdds - 1;
  const p = edge + (odds > 0 ? 100 / (odds + 100) : -odds / (-odds + 100));
  const q = 1 - p;

  const kelly = Math.max(0, (b * p - q) / b);
  return {
    fullKelly: kelly * bankroll,
    halfKelly: kelly * 0.5 * bankroll,
    quarterKelly: kelly * 0.25 * bankroll,
  };
}

/**
 * Detect line movement anomalies (steam moves, trap lines)
 */
export function detectLineAnomalies(
  openingLine: number,
  currentLine: number,
  publicBetPercent: number
): { isSteam: boolean; isTrap: boolean; isReverseLineMove: boolean } {
  const lineMove = Math.abs(currentLine - openingLine);
  const isSteam = lineMove >= 1.5 && publicBetPercent < 50;
  const isTrap = lineMove >= 1.0 && publicBetPercent > 70;
  const isReverseLineMove = lineMove >= 0.5 && publicBetPercent > 65;

  return { isSteam, isTrap, isReverseLineMove };
}

/**
 * Calculate regression metrics for performance trends
 */
export function calculateTrend(dataPoints: number[]): {
  slope: number;
  direction: "improving" | "declining" | "stable";
  r2: number;
} {
  if (dataPoints.length < 2) {
    return { slope: 0, direction: "stable", r2: 0 };
  }

  const x = dataPoints.map((_, i) => i);
  const regression = ss.linearRegression(x.map((xi, i) => [xi, dataPoints[i]]));
  const slope = regression.m;
  const r2 = ss.rSquared(
    x.map((xi, i) => [xi, dataPoints[i]]),
    (x) => regression.m * x + regression.b
  );

  let direction: "improving" | "declining" | "stable" = "stable";
  if (Math.abs(slope) > 0.05) {
    direction = slope > 0 ? "improving" : "declining";
  }

  return { slope, direction, r2 };
}

/**
 * Godmode detection - identifies when metrics are exceptional
 */
export function detectGodmode(metrics: TeamMetrics): ExploitSignal[] {
  const signals: ExploitSignal[] = [];

  if (metrics.cpoe > 5.0) {
    signals.push({
      type: "godmode",
      description: `${metrics.teamName} QB in GODMODE - CPOE at ${metrics.cpoe.toFixed(1)}`,
      confidence: 0.85,
      recommendedAction: "Fade opponent, target overs",
      edge: 0.08,
    });
  }

  if (metrics.hdPressureRate > 0.30) {
    signals.push({
      type: "godmode",
      description: `${metrics.teamName} defense elite pressure - H-D Rate ${(metrics.hdPressureRate * 100).toFixed(1)}%`,
      confidence: 0.82,
      recommendedAction: "Target unders, bet on turnovers",
      edge: 0.06,
    });
  }

  if (metrics.redZoneEpa > 0.4) {
    signals.push({
      type: "godmode",
      description: `${metrics.teamName} red zone efficiency exceptional - EPA ${metrics.redZoneEpa.toFixed(2)}`,
      confidence: 0.78,
      recommendedAction: "Back team spreads, team totals over",
      edge: 0.05,
    });
  }

  return signals;
}

/**
 * AI-powered game analysis using GPT
 */
export async function analyzeGameWithAI(
  homeTeam: string,
  awayTeam: string,
  homeMetrics: TeamMetrics,
  awayMetrics: TeamMetrics,
  spread: number,
  total: number
): Promise<string> {
  const prompt = `You are an NFL betting analyst for the Singularity Intelligence platform. Analyze this matchup:

${awayTeam} @ ${homeTeam}
Line: ${homeTeam} ${spread > 0 ? "+" : ""}${spread} | O/U ${total}

Home Team Metrics:
- EPA/Play: ${homeMetrics.epaPerPlay.toFixed(3)}
- Success Rate: ${(homeMetrics.successRate * 100).toFixed(1)}%
- CPOE: ${homeMetrics.cpoe.toFixed(1)}
- H-D Pressure Rate: ${(homeMetrics.hdPressureRate * 100).toFixed(1)}%
- Red Zone EPA: ${homeMetrics.redZoneEpa.toFixed(2)}

Away Team Metrics:
- EPA/Play: ${awayMetrics.epaPerPlay.toFixed(3)}
- Success Rate: ${(awayMetrics.successRate * 100).toFixed(1)}%
- CPOE: ${awayMetrics.cpoe.toFixed(1)}
- H-D Pressure Rate: ${(awayMetrics.hdPressureRate * 100).toFixed(1)}%
- Red Zone EPA: ${awayMetrics.redZoneEpa.toFixed(2)}

Provide a concise analysis (3-4 sentences) identifying any exploit opportunities, key matchup edges, and a recommended betting angle if one exists. Focus on actionable insights.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content || "Analysis unavailable";
  } catch (error) {
    console.error("AI analysis error:", error);
    return "AI analysis temporarily unavailable";
  }
}

/**
 * Calculate injury cascade impact
 */
export function calculateInjuryCascade(
  injuries: { position: string; pointDrop: number }[]
): { totalImpact: number; clusterAlert: boolean; recommendation: string } {
  const oLinePositions = ["LT", "LG", "C", "RG", "RT"];
  const oLineInjuries = injuries.filter((i) => oLinePositions.includes(i.position));
  const totalImpact = injuries.reduce((sum, i) => sum + i.pointDrop, 0);
  const clusterAlert = oLineInjuries.length >= 2;

  let recommendation = "";
  if (clusterAlert) {
    recommendation = `O-Line cluster detected (${oLineInjuries.length} injured). Target UNDER -${(totalImpact * 0.7).toFixed(1)} adjustment.`;
  } else if (totalImpact > 3) {
    recommendation = `Significant injury impact (-${totalImpact.toFixed(1)} pts). Consider fade/under.`;
  } else {
    recommendation = "Injury impact minimal. Standard analysis applies.";
  }

  return { totalImpact, clusterAlert, recommendation };
}

/**
 * Weather impact on passing game
 */
export function calculateWeatherImpact(
  windSpeed: number,
  temperature: number,
  precipitation: boolean
): { passingDecay: number; recommendation: string } {
  let decay = 0;

  if (windSpeed > 20) decay += 0.15;
  else if (windSpeed > 15) decay += 0.08;

  if (temperature < 32) decay += 0.05;
  if (precipitation) decay += 0.10;

  const recommendation =
    decay > 0.15
      ? "Heavy weather impact - target unders and rush props"
      : decay > 0.08
        ? "Moderate weather impact - slight under lean"
        : "Weather conditions favorable for passing";

  return { passingDecay: decay, recommendation };
}

export const OmniEngine = {
  poissonProbability,
  generateScoreMatrix,
  calculateOutcomeProbabilities,
  calculateEV,
  kellyBetSize,
  detectLineAnomalies,
  calculateTrend,
  detectGodmode,
  analyzeGameWithAI,
  calculateInjuryCascade,
  calculateWeatherImpact,
};
