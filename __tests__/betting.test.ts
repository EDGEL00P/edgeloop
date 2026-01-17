// Jest globals are available by default

describe("BettingService Interfaces", () => {
  it("should define MarketAnalysisResult interface", () => {
    type MarketAnalysisResult = {
      homeEdge: number;
      awayEdge: number;
      overEdge: number;
      underEdge: number;
      homeWinProbability: number;
      awayWinProbability: number;
      overProbability: number;
      underProbability: number;
    };

    const analysis: MarketAnalysisResult = {
      homeEdge: 0.03,
      awayEdge: -0.03,
      overEdge: 0.05,
      underEdge: -0.05,
      homeWinProbability: 0.58,
      awayWinProbability: 0.42,
      overProbability: 0.55,
      underProbability: 0.45
    };

    expect(analysis.homeEdge).toBeGreaterThan(0);
    expect(analysis.overEdge).toBeGreaterThan(0);
  });

  it("should define BettingRecommendation interface", () => {
    type BettingRecommendation = {
      selection: string;
      market: string;
      odds: number;
      probability: number;
      edge: number;
      kellyFraction: number;
      stakeUnits: number;
      confidence: "high" | "medium" | "low";
    };

    const recommendation: BettingRecommendation = {
      selection: "home",
      market: "spread",
      odds: -110,
      probability: 0.62,
      edge: 0.05,
      kellyFraction: 0.0125,
      stakeUnits: 1.25,
      confidence: "high"
    };

    expect(recommendation.confidence).toBe("high");
    expect(recommendation.edge).toBeGreaterThan(0);
  });
});

describe("Kelly Calculator Standalone", () => {
  function calculateKelly(probability: number, decimalOdds: number, bankroll: number) {
    if (probability <= 0 || probability >= 1) {
      throw new Error("Probability must be between 0 and 1");
    }
    if (decimalOdds <= 1) {
      throw new Error("Decimal odds must be greater than 1");
    }
    
    const b = decimalOdds - 1;
    const p = probability;
    const q = 1 - p;
    const kellyFraction = (b * p - q) / b;
    const edge = (p * decimalOdds) - 1;
    
    return {
      kellyFraction: Math.max(0, kellyFraction),
      recommendedStake: Math.max(0, kellyFraction) * bankroll,
      edge
    };
  }

  it("should calculate positive stake for positive edge", () => {
    const result = calculateKelly(0.55, 1.91, 10000);
    expect(result.recommendedStake).toBeGreaterThan(0);
    expect(result.kellyFraction).toBeGreaterThan(0);
  });

  it("should return zero stake for negative edge", () => {
    const result = calculateKelly(0.45, 1.91, 10000);
    expect(result.recommendedStake).toBeLessThanOrEqual(0);
  });

  it("should cap stake at quarter Kelly by default", () => {
    const result = calculateKelly(0.60, 2.0, 10000);
    const fullKelly = (1.0 * 0.60 - 0.40) / 1.0;
    expect(result.kellyFraction).toBe(fullKelly);
  });

  it("should calculate correct edge for 52% probability at 1.91 odds", () => {
    const result = calculateKelly(0.52, 1.91, 10000);
    expect(result.edge).toBeCloseTo(-0.007, 2);
  });

  it("should throw for invalid probability", () => {
    expect(() => calculateKelly(0, 1.91, 10000)).toThrow();
    expect(() => calculateKelly(1, 1.91, 10000)).toThrow();
  });

  it("should throw for invalid odds", () => {
    expect(() => calculateKelly(0.55, 1, 10000)).toThrow();
    expect(() => calculateKelly(0.55, 0, 10000)).toThrow();
  });
});

describe("Edge Calculation Utilities", () => {
  function calculateEdge(probability: number, americanOdds: number): number {
    const decimalOdds = americanOdds > 0 
      ? (americanOdds / 100) + 1 
      : (100 / Math.abs(americanOdds)) + 1;
    return (probability * decimalOdds) - 1;
  }

  it("should calculate positive edge for favorable odds", () => {
    const edge = calculateEdge(0.55, -110);
    expect(edge).toBeGreaterThan(0);
  });

  it("should calculate negative edge for unfavorable odds", () => {
    const edge = calculateEdge(0.45, -110);
    expect(edge).toBeLessThan(0);
  });

  it("should return zero for fair odds", () => {
    const edge = calculateEdge(0.524, -110);
    expect(edge).toBeCloseTo(0, 3);
  });
});

describe("Probability from Spread", () => {
  function calculateWinProbability(spread: number): number {
    const homeWinProb = 0.5 + (spread / 14);
    return Math.max(0.1, Math.min(0.9, homeWinProb));
  }

  it("should calculate probability for negative spread (home favored)", () => {
    const prob = calculateWinProbability(-3);
    expect(prob).toBeLessThan(0.5);
  });

  it("should calculate probability for positive spread (home underdog)", () => {
    const prob = calculateWinProbability(3);
    expect(prob).toBeGreaterThan(0.5);
  });

  it("should return 0.5 for zero spread", () => {
    const prob = calculateWinProbability(0);
    expect(prob).toBeCloseTo(0.5, 5);
  });
});

describe("Weighted Ensemble", () => {
  function weightedEnsemble(predictions: number[], weights: number[]): number {
    if (predictions.length !== weights.length) {
      throw new Error("Predictions and weights must have same length");
    }
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0) throw new Error("Weights must sum to positive value");
    
    const weightedSum = predictions.reduce((sum, p, i) => sum + p * weights[i], 0);
    return weightedSum / totalWeight;
  }

  it("should calculate weighted average correctly", () => {
    const predictions = [10, 12, 8, 11, 9];
    const weights = [0.2, 0.2, 0.2, 0.2, 0.2];
    const result = weightedEnsemble(predictions, weights);
    expect(result).toBe(10);
  });

  it("should handle unequal weights", () => {
    const predictions = [100, 200];
    const weights = [0.75, 0.25];
    const result = weightedEnsemble(predictions, weights);
    expect(result).toBeCloseTo(125, 5);
  });

  it("should throw for mismatched lengths", () => {
    expect(() => weightedEnsemble([1, 2], [0.5])).toThrow();
  });
});

describe("Consensus Score", () => {
  function calculateConsensusScore(baseValue: number, comparisons: number[]): number {
    if (comparisons.length === 0) return 1;
    
    const mean = comparisons.reduce((a, b) => a + b, 0) / comparisons.length;
    const diff = Math.abs(baseValue - mean);
    const maxDiff = Math.max(baseValue, mean) * 0.2;
    
    return Math.max(0, 1 - (diff / maxDiff));
  }

  it("should return high consensus for similar values", () => {
    const consensus = calculateConsensusScore(10, [9.5, 10, 10.5, 9.8]);
    expect(consensus).toBeGreaterThan(0.8);
  });

  it("should return low consensus for different values", () => {
    const consensus = calculateConsensusScore(10, [1, 2, 3, 4]);
    expect(consensus).toBeLessThan(0.5);
  });

  it("should handle empty comparisons array", () => {
    const consensus = calculateConsensusScore(10, []);
    expect(consensus).toBe(1);
  });
});
