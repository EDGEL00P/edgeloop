export function americanToDecimal(american: number): number {
  if (american > 0) {
    return (american / 100) + 1;
  } else {
    return (100 / Math.abs(american)) + 1;
  }
}

export function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  } else {
    return Math.round(-100 / (decimal - 1));
  }
}

export function formatDecimalOdds(decimal: number): string {
  return decimal.toFixed(2);
}

export function calculatePayout(stake: number, decimalOdds: number): number {
  return stake * decimalOdds;
}

export function calculateReturns(stake: number, decimalOdds: number): number {
  return stake * (decimalOdds - 1);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function calculateParlayDecimalOdds(americanOdds: number[]): number {
  let decimal = 1;
  americanOdds.forEach(american => {
    decimal *= americanToDecimal(american);
  });
  return decimal;
}

export const BETTING_GLOSSARY: Record<string, string> = {
  'stake': 'The amount of money placed on a selection',
  'returns': 'Total amount received if the selection wins (stake × odds)',
  'price': 'The odds offered on a selection, representing implied probability',
  'selection': 'A specific outcome chosen for wagering',
  'strong_selection': 'A highly confident selection based on analysis',
  'parlay': 'A combination of multiple selections into one wager',
  'decimal_odds': 'European odds format showing total return per unit stake',
  'implied_probability': 'The probability of an outcome derived from the odds',
  'expected_value': 'The average expected profit or loss per unit staked',
  'kelly_criterion': 'A formula for optimal stake sizing based on edge and bankroll',
};
