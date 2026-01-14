import { GoogleGenAI } from "@google/genai";
import { eq, and, or } from "drizzle-orm";
import { apiLimiters } from "../infrastructure/rate-limiter";
import { CircuitBreaker, circuitBreakerManager } from "../infrastructure/circuit-breaker";
import { cache, CacheTTL, CacheService } from "../infrastructure/cache";
import { logger } from "../infrastructure/logger";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const geminiCircuitBreaker = circuitBreakerManager.create("gemini", {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 30000,
});

type ModelType = "flash" | "pro";

const MODELS = {
  flash: "gemini-2.0-flash",
  pro: "gemini-1.5-pro",
};

export interface BettingValueAnalysis {
  valueRating: number;
  recommendedSide: "home" | "away" | "none";
  confidence: number;
  reasoning: string;
  keyFactors: string[];
  expectedValue?: number;
  edgePercentage?: number;
}

export interface GamePrediction {
  homeScore: number;
  awayScore: number;
  totalPoints: number;
  spreadPrediction: number;
  homeWinProbability: number;
  awayWinProbability: number;
  confidence: number;
  reasoning: string;
  keyFactors: string[];
}

export interface InjuryImpactAnalysis {
  totalPointsDrop: number;
  homePointsDrop: number;
  awayPointsDrop: number;
  spreadAdjustment: number;
  impactLevel: "minimal" | "moderate" | "significant" | "severe";
  affectedAreas: string[];
  reasoning: string;
}

export interface PicksNarrative {
  summary: string;
  bestBets: Array<{
    pick: string;
    confidence: number;
    rationale: string;
  }>;
  avoidList: string[];
  marketInsights: string;
}

export interface GameInput {
  homeTeam: string;
  awayTeam: string;
  spread?: number;
  total?: number;
  homeOdds?: number;
  awayOdds?: number;
  venue?: string;
  weather?: { temp: number; wind: number; condition: string };
}

export interface HistoricalStats {
  homeRecord?: string;
  awayRecord?: string;
  homeAtsRecord?: string;
  awayAtsRecord?: string;
  homeOverUnderRecord?: string;
  awayOverUnderRecord?: string;
  homePointsPerGame?: number;
  awayPointsPerGame?: number;
  homePointsAllowed?: number;
  awayPointsAllowed?: number;
  headToHead?: { home: number; away: number; draws: number };
}

export interface InjuryInfo {
  playerName: string;
  team: "home" | "away";
  position: string;
  status: "out" | "doubtful" | "questionable" | "probable";
  impact?: string;
}

export interface PickInfo {
  game: string;
  pick: string;
  odds: number;
  confidence: number;
  analysis?: string;
}

function determineComplexity(
  inputSize: number,
  requiresDeepAnalysis: boolean
): ModelType {
  if (requiresDeepAnalysis || inputSize > 1000) {
    return "pro";
  }
  return "flash";
}

function generateCacheKey(operation: string, input: any): string {
  const inputHash = JSON.stringify(input)
    .split("")
    .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
    .toString(16);
  return `gemini:${operation}:${inputHash}`;
}

async function executeWithResilience<T>(
  operation: string,
  fn: () => Promise<T>,
  cacheKey?: string,
  cacheTtl: number = CacheTTL.MEDIUM
): Promise<T> {
  if (cacheKey) {
    const cached = await cache.get<T>(cacheKey);
    if (cached !== null) {
      logger.info({ type: "cache_hit", operation, key: cacheKey });
      return cached;
    }
  }

  const canProceed = await apiLimiters.gemini.acquire();
  if (!canProceed) {
    throw new Error("Rate limit exceeded for Gemini API");
  }

  const result = await geminiCircuitBreaker.execute(fn);

  if (cacheKey) {
    await cache.set(cacheKey, result, cacheTtl);
  }

  return result;
}

async function generateStructuredContent<T>(
  prompt: string,
  modelType: ModelType,
  parseResponse: (text: string) => T
): Promise<T> {
  const model = MODELS[modelType];
  
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text = response.text || "";
  
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
                    text.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    const jsonStr = jsonMatch[1] || jsonMatch[0];
    try {
      return JSON.parse(jsonStr) as T;
    } catch {
      return parseResponse(text);
    }
  }
  
  return parseResponse(text);
}

export async function analyzeBettingValue(
  game: GameInput,
  historicalStats: HistoricalStats
): Promise<BettingValueAnalysis> {
  const inputSize = JSON.stringify({ game, historicalStats }).length;
  const modelType = determineComplexity(inputSize, true);
  const cacheKey = generateCacheKey("betting_value", { game, historicalStats });

  const prompt = `You are an expert NFL betting analyst. Analyze this game for betting value opportunities.

GAME DATA:
- Matchup: ${game.awayTeam} @ ${game.homeTeam}
${game.spread !== undefined ? `- Spread: ${game.homeTeam} ${game.spread > 0 ? "+" : ""}${game.spread}` : ""}
${game.total !== undefined ? `- Total: ${game.total}` : ""}
${game.homeOdds ? `- Home ML: ${game.homeOdds}` : ""}
${game.awayOdds ? `- Away ML: ${game.awayOdds}` : ""}
${game.venue ? `- Venue: ${game.venue}` : ""}
${game.weather ? `- Weather: ${game.weather.temp}°F, ${game.weather.wind} mph wind, ${game.weather.condition}` : ""}

HISTORICAL STATS:
${historicalStats.homeRecord ? `- ${game.homeTeam} Record: ${historicalStats.homeRecord}` : ""}
${historicalStats.awayRecord ? `- ${game.awayTeam} Record: ${historicalStats.awayRecord}` : ""}
${historicalStats.homeAtsRecord ? `- ${game.homeTeam} ATS: ${historicalStats.homeAtsRecord}` : ""}
${historicalStats.awayAtsRecord ? `- ${game.awayTeam} ATS: ${historicalStats.awayAtsRecord}` : ""}
${historicalStats.homeOverUnderRecord ? `- ${game.homeTeam} O/U: ${historicalStats.homeOverUnderRecord}` : ""}
${historicalStats.awayOverUnderRecord ? `- ${game.awayTeam} O/U: ${historicalStats.awayOverUnderRecord}` : ""}
${historicalStats.homePointsPerGame ? `- ${game.homeTeam} PPG: ${historicalStats.homePointsPerGame}` : ""}
${historicalStats.awayPointsPerGame ? `- ${game.awayTeam} PPG: ${historicalStats.awayPointsPerGame}` : ""}
${historicalStats.homePointsAllowed ? `- ${game.homeTeam} PA/G: ${historicalStats.homePointsAllowed}` : ""}
${historicalStats.awayPointsAllowed ? `- ${game.awayTeam} PA/G: ${historicalStats.awayPointsAllowed}` : ""}
${historicalStats.headToHead ? `- H2H: ${game.homeTeam} ${historicalStats.headToHead.home}-${historicalStats.headToHead.away}` : ""}

Respond with ONLY a JSON object in this exact format:
{
  "valueRating": <0-100 integer>,
  "recommendedSide": "<home|away|none>",
  "confidence": <0-1 decimal>,
  "reasoning": "<2-3 sentence analysis>",
  "keyFactors": ["<factor1>", "<factor2>", "<factor3>"],
  "expectedValue": <percentage as decimal>,
  "edgePercentage": <edge over market as decimal>
}`;

  return executeWithResilience(
    "analyzeBettingValue",
    () => generateStructuredContent<BettingValueAnalysis>(
      prompt,
      modelType,
      (text) => ({
        valueRating: 50,
        recommendedSide: "none",
        confidence: 0.5,
        reasoning: text.slice(0, 200),
        keyFactors: ["Analysis pending"],
      })
    ),
    cacheKey,
    CacheTTL.MEDIUM
  );
}

export async function predictGameOutcome(
  homeTeam: string,
  awayTeam: string,
  stats: HistoricalStats
): Promise<GamePrediction> {
  const inputSize = JSON.stringify({ homeTeam, awayTeam, stats }).length;
  const modelType = determineComplexity(inputSize, true);
  const cacheKey = generateCacheKey("predict_outcome", { homeTeam, awayTeam, stats });

  const prompt = `You are an NFL prediction model. Generate a score prediction for this game.

MATCHUP: ${awayTeam} @ ${homeTeam}

STATS:
${stats.homeRecord ? `- ${homeTeam} Record: ${stats.homeRecord}` : ""}
${stats.awayRecord ? `- ${awayTeam} Record: ${stats.awayRecord}` : ""}
${stats.homePointsPerGame ? `- ${homeTeam} PPG: ${stats.homePointsPerGame}` : ""}
${stats.awayPointsPerGame ? `- ${awayTeam} PPG: ${stats.awayPointsPerGame}` : ""}
${stats.homePointsAllowed ? `- ${homeTeam} Points Allowed: ${stats.homePointsAllowed}` : ""}
${stats.awayPointsAllowed ? `- ${awayTeam} Points Allowed: ${stats.awayPointsAllowed}` : ""}
${stats.headToHead ? `- Head to Head: ${homeTeam} ${stats.headToHead.home}-${stats.headToHead.away}` : ""}

Respond with ONLY a JSON object in this exact format:
{
  "homeScore": <integer>,
  "awayScore": <integer>,
  "totalPoints": <integer>,
  "spreadPrediction": <decimal, positive favors home>,
  "homeWinProbability": <0-1 decimal>,
  "awayWinProbability": <0-1 decimal>,
  "confidence": <0-1 decimal>,
  "reasoning": "<2-3 sentence explanation>",
  "keyFactors": ["<factor1>", "<factor2>", "<factor3>"]
}`;

  return executeWithResilience(
    "predictGameOutcome",
    () => generateStructuredContent<GamePrediction>(
      prompt,
      modelType,
      (text) => ({
        homeScore: 24,
        awayScore: 21,
        totalPoints: 45,
        spreadPrediction: 3,
        homeWinProbability: 0.55,
        awayWinProbability: 0.45,
        confidence: 0.5,
        reasoning: text.slice(0, 200),
        keyFactors: ["Prediction pending"],
      })
    ),
    cacheKey,
    CacheTTL.MEDIUM
  );
}

export async function analyzeInjuryImpact(
  injuries: InjuryInfo[]
): Promise<InjuryImpactAnalysis> {
  const modelType = injuries.length > 5 ? "pro" : "flash";
  const cacheKey = generateCacheKey("injury_impact", injuries);

  const injuryList = injuries
    .map(
      (i) =>
        `- ${i.playerName} (${i.team === "home" ? "Home" : "Away"} ${i.position}): ${i.status}${i.impact ? ` - ${i.impact}` : ""}`
    )
    .join("\n");

  const prompt = `You are an NFL injury analyst. Assess the impact of these injuries on game outcomes.

INJURIES:
${injuryList || "No injuries reported"}

Analyze the combined impact on:
1. Total points adjustment
2. Spread adjustment
3. Which team is more affected

Respond with ONLY a JSON object in this exact format:
{
  "totalPointsDrop": <decimal, points reduction in total>,
  "homePointsDrop": <decimal>,
  "awayPointsDrop": <decimal>,
  "spreadAdjustment": <decimal, positive favors home>,
  "impactLevel": "<minimal|moderate|significant|severe>",
  "affectedAreas": ["<area1>", "<area2>"],
  "reasoning": "<2-3 sentence analysis>"
}`;

  return executeWithResilience(
    "analyzeInjuryImpact",
    () => generateStructuredContent<InjuryImpactAnalysis>(
      prompt,
      modelType,
      (text) => ({
        totalPointsDrop: 0,
        homePointsDrop: 0,
        awayPointsDrop: 0,
        spreadAdjustment: 0,
        impactLevel: "minimal",
        affectedAreas: [],
        reasoning: text.slice(0, 200),
      })
    ),
    cacheKey,
    CacheTTL.SHORT
  );
}

export async function generatePicksNarrative(
  picks: PickInfo[]
): Promise<PicksNarrative> {
  const modelType = picks.length > 3 ? "pro" : "flash";
  const cacheKey = generateCacheKey("picks_narrative", picks);

  const picksList = picks
    .map(
      (p) =>
        `- ${p.game}: ${p.pick} at ${p.odds > 0 ? "+" : ""}${p.odds} (Confidence: ${(p.confidence * 100).toFixed(0)}%)${p.analysis ? ` - ${p.analysis}` : ""}`
    )
    .join("\n");

  const prompt = `You are an NFL betting expert creating a narrative summary of betting picks.

PICKS:
${picksList || "No picks available"}

Create a compelling, human-readable betting recommendation narrative.

Respond with ONLY a JSON object in this exact format:
{
  "summary": "<2-3 sentence executive summary of the picks>",
  "bestBets": [
    {
      "pick": "<pick description>",
      "confidence": <0-1 decimal>,
      "rationale": "<why this is a best bet>"
    }
  ],
  "avoidList": ["<game/bet to avoid>"],
  "marketInsights": "<1-2 sentences on market conditions or trends>"
}`;

  return executeWithResilience(
    "generatePicksNarrative",
    () => generateStructuredContent<PicksNarrative>(
      prompt,
      modelType,
      (text) => ({
        summary: text.slice(0, 200),
        bestBets: [],
        avoidList: [],
        marketInsights: "Market analysis pending",
      })
    ),
    cacheKey,
    CacheTTL.SHORT
  );
}

export async function quickAnalysis(
  homeTeam: string,
  awayTeam: string,
  context?: string
): Promise<string> {
  const cacheKey = generateCacheKey("quick_analysis", { homeTeam, awayTeam, context });

  const prompt = `Quick NFL betting insight for ${awayTeam} @ ${homeTeam}${context ? `. Context: ${context}` : ""}. 
Give a 1-2 sentence actionable betting angle. No formatting.`;

  return executeWithResilience(
    "quickAnalysis",
    async () => {
      const response = await ai.models.generateContent({
        model: MODELS.flash,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      return response.text || "Analysis unavailable";
    },
    cacheKey,
    CacheTTL.SHORT
  );
}

export function getServiceHealth() {
  return {
    circuitBreaker: geminiCircuitBreaker.getStats(),
    rateLimiter: {
      available: apiLimiters.gemini.getAvailableTokens(),
      waitTime: apiLimiters.gemini.getWaitTime(),
    },
    cache: cache.getStats(),
  };
}

export const GeminiService = {
  analyzeBettingValue,
  predictGameOutcome,
  analyzeInjuryImpact,
  generatePicksNarrative,
  quickAnalysis,
  getServiceHealth,
};
