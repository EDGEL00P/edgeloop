/**
 * Convert American odds to implied probability
 * Positive odds: +150 means win 150 on 100 stake
 * Negative odds: -150 means risk 150 to win 100
 */
export declare function impliedProbFromAmericanOdds(odds: number): number;
/**
 * Convert implied probability to American odds
 */
export declare function americanOddsFromProb(prob: number): number;
/**
 * Convert American odds to decimal odds
 */
export declare function decimalFromAmericanOdds(odds: number): number;
/**
 * Convert decimal odds to American odds
 */
export declare function americanFromDecimalOdds(decimal: number): number;
/**
 * Calculate betting edge (model probability vs implied probability)
 */
export declare function calculateEdge(modelProb: number, marketOdds: number): number;
/**
 * Calculate expected value of a bet
 * Returns the EV as a percentage of the stake
 */
export declare function calculateEV(modelProb: number, marketOdds: number): number;
/**
 * Calculate Kelly criterion bet size
 * Returns the fraction of bankroll to bet
 */
export declare function kellyBetSize(modelProb: number, marketOdds: number, kellyCriterion?: number): number;
/**
 * Format American odds as a string with + or - prefix
 */
export declare function formatAmericanOdds(odds: number): string;
/**
 * Remove vig/juice from a set of odds to get fair probabilities
 * Takes an array of American odds and returns fair probabilities
 */
export declare function removeVig(oddsList: number[]): number[];
//# sourceMappingURL=odds.d.ts.map