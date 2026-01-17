/**
 * Kelly Criterion Calculator
 * 
 * Zero-latency Kelly calculation for optimal bet sizing.
 * 
 * Performance: <1ms per calculation
 */

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KellyResult {
    pub kelly_fraction: f64,
    pub recommended_stake: f64,
    pub edge: f64,
    pub is_positive_edge: bool,
}

pub struct KellyCalculator;

impl KellyCalculator {
    pub fn new() -> Self {
        Self
    }

    /// Calculate full Kelly Criterion
    /// 
    /// Formula: f = (bp - q) / b
    /// where:
    /// - b = decimal_odds - 1
    /// - p = probability of winning
    /// - q = 1 - p
    pub fn calculate(
        &self,
        probability: f64,
        decimal_odds: f64,
        bankroll: f64,
    ) -> Result<KellyResult, String> {
        if !(0.0..=1.0).contains(&probability) {
            return Err("Probability must be between 0 and 1".to_string());
        }

        if decimal_odds <= 1.0 {
            return Err("Decimal odds must be greater than 1".to_string());
        }

        if bankroll <= 0.0 {
            return Err("Bankroll must be positive".to_string());
        }

        let b = decimal_odds - 1.0;
        let p = probability;
        let q = 1.0 - p;

        // Kelly fraction: (bp - q) / b
        let kelly_fraction = (b * p - q) / b;

        // Only bet if positive edge
        let kelly_fraction = kelly_fraction.max(0.0);

        let recommended_stake = kelly_fraction * bankroll;
        let edge = (p * decimal_odds) - 1.0;

        Ok(KellyResult {
            kelly_fraction,
            recommended_stake,
            edge,
            is_positive_edge: edge > 0.0,
        })
    }

    /// Calculate Quarter Kelly (more conservative, reduces volatility)
    pub fn calculate_quarter(
        &self,
        probability: f64,
        decimal_odds: f64,
        bankroll: f64,
    ) -> Result<KellyResult, String> {
        let full_kelly = self.calculate(probability, decimal_odds, bankroll)?;
        
        Ok(KellyResult {
            kelly_fraction: full_kelly.kelly_fraction * 0.25,
            recommended_stake: full_kelly.recommended_stake * 0.25,
            edge: full_kelly.edge,
            is_positive_edge: full_kelly.is_positive_edge,
        })
    }

    /// Calculate Half Kelly (moderate approach)
    pub fn calculate_half(
        &self,
        probability: f64,
        decimal_odds: f64,
        bankroll: f64,
    ) -> Result<KellyResult, String> {
        let full_kelly = self.calculate(probability, decimal_odds, bankroll)?;
        
        Ok(KellyResult {
            kelly_fraction: full_kelly.kelly_fraction * 0.5,
            recommended_stake: full_kelly.recommended_stake * 0.5,
            edge: full_kelly.edge,
            is_positive_edge: full_kelly.is_positive_edge,
        })
    }

    /// Convert American odds to decimal odds
    pub fn american_to_decimal(&self, american_odds: f64) -> f64 {
        if american_odds > 0.0 {
            (american_odds / 100.0) + 1.0
        } else {
            (100.0 / american_odds.abs()) + 1.0
        }
    }

    /// Convert decimal odds to American odds
    pub fn decimal_to_american(&self, decimal_odds: f64) -> f64 {
        if decimal_odds >= 2.0 {
            (decimal_odds - 1.0) * 100.0
        } else {
            -100.0 / (decimal_odds - 1.0)
        }
    }
}

impl Default for KellyCalculator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_kelly_positive_edge() {
        let calc = KellyCalculator::new();
        let result = calc.calculate(0.55, 1.91, 10000.0).unwrap();
        
        assert!(result.kelly_fraction > 0.0);
        assert!(result.recommended_stake > 0.0);
        assert!(result.is_positive_edge);
    }

    #[test]
    fn test_kelly_negative_edge() {
        let calc = KellyCalculator::new();
        let result = calc.calculate(0.45, 1.91, 10000.0).unwrap();
        
        assert_eq!(result.kelly_fraction, 0.0);
        assert_eq!(result.recommended_stake, 0.0);
        assert!(!result.is_positive_edge);
    }

    #[test]
    fn test_quarter_kelly() {
        let calc = KellyCalculator::new();
        let full = calc.calculate(0.55, 1.91, 10000.0).unwrap();
        let quarter = calc.calculate_quarter(0.55, 1.91, 10000.0).unwrap();
        
        assert_eq!(quarter.kelly_fraction, full.kelly_fraction * 0.25);
        assert_eq!(quarter.recommended_stake, full.recommended_stake * 0.25);
    }

    #[test]
    fn test_american_to_decimal() {
        let calc = KellyCalculator::new();
        assert_eq!(calc.american_to_decimal(-110), 1.9090909090909092);
        assert_eq!(calc.american_to_decimal(150), 2.5);
    }
}
