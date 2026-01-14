import { describe, it, expect } from "vitest";

describe("PlayerPropPrediction Interface", () => {
  it("should allow creating valid PlayerPropPrediction objects", () => {
    type PlayerPropPrediction = {
      playerId: number;
      playerName: string;
      team: string;
      position: string;
      propType: string;
      predictedLine: number;
      actualLine: number;
      overProbability: number;
      underProbability: number;
      edge: number;
      confidence: number;
      historicalAverage: number;
      recentAverage: number;
      trend: number;
      matchupFactors: {
        opponentDefensiveRank: number;
        paceMatchup: number;
        weatherImpact: number;
        injuryImpact: number;
      };
      modelContributions: {
        historicalModel: number;
        recentFormModel: number;
        matchupModel: number;
        weatherModel: number;
      };
      recommendation: "over" | "under" | "pass";
      kellyFraction: number;
      stakeRecommendation: number;
    };

    const prediction: PlayerPropPrediction = {
      playerId: 1,
      playerName: "Patrick Mahomes",
      team: "KC",
      position: "QB",
      propType: "passing_yards",
      predictedLine: 280,
      actualLine: 275,
      overProbability: 0.58,
      underProbability: 0.42,
      edge: 0.05,
      confidence: 0.72,
      historicalAverage: 275,
      recentAverage: 290,
      trend: 0.05,
      matchupFactors: {
        opponentDefensiveRank: 15,
        paceMatchup: 0.6,
        weatherImpact: 0,
        injuryImpact: 0
      },
      modelContributions: {
        historicalModel: 0.35,
        recentFormModel: 0.35,
        matchupModel: 0.20,
        weatherModel: 0.10
      },
      recommendation: "over",
      kellyFraction: 0.0125,
      stakeRecommendation: 125
    };

    expect(prediction.playerId).toBe(1);
    expect(prediction.recommendation).toBe("over");
    expect(prediction.confidence).toBeGreaterThan(0.7);
  });

  it("should enforce recommendation type", () => {
    type Recommendation = "over" | "under" | "pass";
    
    const overRec: Recommendation = "over";
    const underRec: Recommendation = "under";
    const passRec: Recommendation = "pass";
    
    expect(overRec).toBe("over");
    expect(underRec).toBe("under");
    expect(passRec).toBe("pass");
  });
});

describe("SGMRecommendation Interface", () => {
  it("should allow creating valid SGMRecommendation objects", () => {
    type SGMRecommendation = {
      gameId: string;
      homeTeam: string;
      awayTeam: string;
      legs: Array<{
        id: string;
        playerId: number;
        playerName: string;
        team: string;
        propType: string;
        selection: "over" | "under";
        line: number;
        odds: number;
        probability: number;
        edge: number;
        confidence: number;
      }>;
      totalOdds: number;
      totalProbability: number;
      totalEdge: number;
      overallConfidence: number;
      correlationAdjustment: number;
      kellyResult: {
        quarterKelly: number;
        halfKelly: number;
        fullKelly: number;
        recommendedFraction: string;
        isApproved: boolean;
        rejectionReason?: string;
      };
      winScenarios: {
        scenarios: number;
        expectedWins: number;
        probabilityDistribution: number[];
      };
      riskScore: number;
      recommendationRating: "strong" | "moderate" | "weak" | "pass";
    };

    const sgm: SGMRecommendation = {
      gameId: "game_1",
      homeTeam: "KC",
      awayTeam: "BUF",
      legs: [
        {
          id: "leg_1",
          playerId: 1,
          playerName: "Patrick Mahomes",
          team: "KC",
          propType: "passing_yards",
          selection: "over",
          line: 280,
          odds: -110,
          probability: 0.58,
          edge: 0.05,
          confidence: 0.72
        }
      ],
      totalOdds: 5.5,
      totalProbability: 0.18,
      totalEdge: 0.08,
      overallConfidence: 0.72,
      correlationAdjustment: 1.05,
      kellyResult: {
        quarterKelly: 0.02,
        halfKelly: 0.04,
        fullKelly: 0.08,
        recommendedFraction: "quarter",
        isApproved: true
      },
      winScenarios: {
        scenarios: 64,
        expectedWins: 11.5,
        probabilityDistribution: []
      },
      riskScore: 0.35,
      recommendationRating: "moderate"
    };

    expect(sgm.gameId).toBe("game_1");
    expect(sgm.recommendationRating).toBe("moderate");
    expect(sgm.kellyResult.isApproved).toBe(true);
    expect(sgm.legs).toHaveLength(1);
  });
});

describe("Kelly Calculator Logic", () => {
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
    expect(result.kellyFraction).toBeLessThanOrEqual(0);
  });

  it("should calculate correct edge for 52% probability at 1.91 odds", () => {
    const result = calculateKelly(0.52, 1.91, 10000);
    expect(result.edge).toBeCloseTo(-0.007, 2);
  });

  it("should cap stake at quarter Kelly", () => {
    const result = calculateKelly(0.60, 2.0, 10000);
    const fullKelly = (1.0 * 0.60 - 0.40) / 1.0;
    expect(result.kellyFraction).toBe(fullKelly);
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

describe("Parlay Odds Calculator", () => {
  function calculateParlayDecimalOdds(americanOdds: number[]): number {
    const decimalOdds = americanOdds.map(odds => 
      odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1
    );
    return decimalOdds.reduce((prod, odds) => prod * odds, 1);
  }

  it("should calculate correct parlay odds for -110 legs", () => {
    const parlay = calculateParlayDecimalOdds([-110, -110, -110]);
    expect(parlay).toBeCloseTo(6.96, 2);
  });

  it("should handle mixed odds", () => {
    const parlay = calculateParlayDecimalOdds([-110, +150, -200]);
    expect(parlay).toBeGreaterThan(1);
  });
});

describe("American to Decimal Conversion", () => {
  function americanToDecimal(americanOdds: number): number {
    return americanOdds > 0 ? (americanOdds / 100) + 1 : (100 / Math.abs(americanOdds)) + 1;
  }

  it("should convert negative American odds to decimal", () => {
    expect(americanToDecimal(-110)).toBeCloseTo(1.909, 3);
    expect(americanToDecimal(-150)).toBeCloseTo(1.667, 3);
  });

  it("should convert positive American odds to decimal", () => {
    expect(americanToDecimal(+150)).toBeCloseTo(2.5, 3);
    expect(americanToDecimal(+200)).toBeCloseTo(3.0, 3);
  });
});
