// Odds utility functions
export function americanToDecimal(american: number): number {
  if (american > 0) {
    return american / 100 + 1;
  } else {
    return 100 / Math.abs(american) + 1;
  }
}

export function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) {
    return (decimal - 1) * 100;
  } else {
    return -100 / (decimal - 1);
  }
}

export function formatDecimalOdds(decimal: number): string {
  return decimal.toFixed(2);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export const BETTING_GLOSSARY: Record<string, string> = {
  spread: 'Point spread',
  moneyline: 'Moneyline bet',
  over: 'Over total points',
  under: 'Under total points',
  parlay: 'Multiple selections',
};
