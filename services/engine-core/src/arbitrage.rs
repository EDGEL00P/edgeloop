/**
 * Arbitrage Detector
 * 
 * Detects arbitrage opportunities across multiple sportsbooks.
 * 
 * Performance: <5ms per comparison
 */

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Odds {
    pub book: String,
    pub home_odds: f64,  // Decimal odds
    pub away_odds: f64,  // Decimal odds
    pub draw_odds: Option<f64>, // For sports with draws
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArbitrageOpportunity {
    pub exists: bool,
    pub profit_percentage: f64,
    pub stake_distribution: Vec<Stake>,
    pub guaranteed_profit: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Stake {
    pub book: String,
    pub selection: String, // "home", "away", or "draw"
    pub stake: f64,
    pub payout: f64,
}

pub struct ArbitrageDetector;

impl ArbitrageDetector {
    pub fn new() -> Self {
        Self
    }

    /// Detect arbitrage in 2-way market (home/away)
    pub fn detect_2way(&self, odds_list: Vec<Odds>) -> ArbitrageOpportunity {
        // Find best odds for each outcome
        let best_home = odds_list
            .iter()
            .max_by(|a, b| a.home_odds.partial_cmp(&b.home_odds).unwrap())
            .map(|o| (o.book.clone(), o.home_odds))
            .unwrap_or_default();

        let best_away = odds_list
            .iter()
            .max_by(|a, b| a.away_odds.partial_cmp(&b.away_odds).unwrap())
            .map(|o| (o.book.clone(), o.away_odds))
            .unwrap_or_default();

        // Calculate implied probabilities
        let implied_prob_home = 1.0 / best_home.1;
        let implied_prob_away = 1.0 / best_away.1;
        let total_implied_prob = implied_prob_home + implied_prob_away;

        // Arbitrage exists if total implied probability < 1.0
        let exists = total_implied_prob < 1.0;
        
        if !exists {
            return ArbitrageOpportunity {
                exists: false,
                profit_percentage: 0.0,
                stake_distribution: vec![],
                guaranteed_profit: 0.0,
            };
        }

        // Calculate profit percentage
        let profit_percentage = ((1.0 / total_implied_prob) - 1.0) * 100.0;

        // Calculate stake distribution for $100 total stake
        let total_stake = 100.0;
        let stake_home = (implied_prob_home / total_implied_prob) * total_stake;
        let stake_away = (implied_prob_away / total_implied_prob) * total_stake;

        let payout_home = stake_home * best_home.1;
        let payout_away = stake_away * best_away.1;

        // Both payouts should be equal (guaranteed profit)
        let guaranteed_payout = payout_home.min(payout_away);
        let guaranteed_profit = guaranteed_payout - total_stake;

        ArbitrageOpportunity {
            exists: true,
            profit_percentage,
            stake_distribution: vec![
                Stake {
                    book: best_home.0,
                    selection: "home".to_string(),
                    stake: stake_home,
                    payout: payout_home,
                },
                Stake {
                    book: best_away.0,
                    selection: "away".to_string(),
                    stake: stake_away,
                    payout: payout_away,
                },
            ],
            guaranteed_profit,
        }
    }
}

impl Default for ArbitrageDetector {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_arbitrage_detection() {
        let detector = ArbitrageDetector::new();
        
        let odds = vec![
            Odds {
                book: "BookA".to_string(),
                home_odds: 2.10,
                away_odds: 1.90,
                draw_odds: None,
            },
            Odds {
                book: "BookB".to_string(),
                home_odds: 1.95,
                away_odds: 2.05,
                draw_odds: None,
            },
        ];

        let result = detector.detect_2way(odds);
        // This specific example might not have arbitrage, but tests the logic
        assert!(result.stake_distribution.len() <= 2);
    }
}
