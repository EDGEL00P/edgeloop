/**
 * Round a number to 3 decimal places
 */
export function round3(n: number): number {
  return Math.round(n * 1000) / 1000
}
