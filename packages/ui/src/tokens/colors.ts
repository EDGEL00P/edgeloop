/**
 * Color tokens for the EdgeLoop NFL predictions platform
 * Includes team colors, status colors, and semantic colors for betting edges
 */

export const colors = {
  // Brand colors
  brand: {
    primary: '#0066FF',      // Electric blue
    secondary: '#1A1F2E',    // Dark navy
    accent: '#00FF88',       // Neon green for positive EV
  },

  // NFL Team primary colors (sample - can be expanded)
  teams: {
    chiefs: '#E31837',
    eagles: '#004C54',
    cowboys: '#041E42',
    packers: '#203731',
    niners: '#AA0000',
    bills: '#00338D',
    bengals: '#FB4F14',
    ravens: '#241773',
  },

  // Prediction confidence levels
  confidence: {
    high: '#00FF88',         // Neon green
    medium: '#FFB800',       // Amber
    low: '#FF4757',          // Red
  },

  // Exploit types
  exploit: {
    value: '#00FF88',        // Positive EV - green
    arbitrage: '#0066FF',    // Arbitrage - blue
    middle: '#B33FFF',       // Middle - purple
    line: '#FFB800',         // Line value - amber
  },

  // Semantic colors
  semantic: {
    success: '#00FF88',
    warning: '#FFB800',
    error: '#FF4757',
    info: '#0066FF',
  },

  // UI colors
  background: {
    primary: '#0A0E1A',      // Deep dark blue
    secondary: '#1A1F2E',    // Lighter dark blue
    tertiary: '#252B3D',     // Card background
    hover: '#2D3548',        // Hover state
  },

  text: {
    primary: '#FFFFFF',
    secondary: '#A0AEC0',
    tertiary: '#718096',
    muted: '#4A5568',
  },

  border: {
    default: '#2D3548',
    light: '#3D4558',
    heavy: '#4D5568',
  },
} as const;

export type Colors = typeof colors;
