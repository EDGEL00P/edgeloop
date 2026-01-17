/**
 * TDA: Team Topology Engine
 * 
 * Determines if a team is "Fragile" or "Robust" using Topological Data Analysis
 * High β₁ (Betti-1) = Robust (multiple ways to win)
 * Low β₁ = Fragile (linear strategy, collapses under pressure)
 */

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamTopology {
    pub team_id: u64,
    pub plays: Vec<f32>, // EPA per play distribution
    pub robustness_score: f64, // 0.0 (Fragile) to 1.0 (Robust)
}

impl TeamTopology {
    pub fn new(team_id: u64, plays: Vec<f32>) -> Self {
        let robustness_score = Self::calculate_robustness(&plays);
        Self {
            team_id,
            plays,
            robustness_score,
        }
    }

    /// Calculate Robustness using Shannon Entropy as a proxy for β₁
    /// High Entropy = Diverse Playbook (Robust)
    /// Low Entropy = Predictable Playbook (Fragile)
    pub fn calculate_robustness(plays: &[f32]) -> f64 {
        if plays.is_empty() {
            return 0.0;
        }

        // Normalize plays to probabilities (0-1 range)
        let min = plays.iter().fold(f32::INFINITY, |a, &b| a.min(b));
        let max = plays.iter().fold(f32::NEG_INFINITY, |a, &b| a.max(b));
        
        if max == min {
            return 0.5; // Uniform distribution
        }

        let normalized: Vec<f64> = plays
            .iter()
            .map(|&p| {
                let norm = (p - min) / (max - min);
                norm.max(0.0).min(1.0) as f64
            })
            .collect();

        // Bin the normalized values into buckets for entropy calculation
        let num_bins = 20.min(normalized.len());
        let mut bins = vec![0; num_bins];

        for &value in &normalized {
            let bin_index = ((value * num_bins as f64).floor() as usize)
                .min(num_bins - 1);
            bins[bin_index] += 1;
        }

        // Calculate Shannon Entropy
        let total = normalized.len() as f64;
        let entropy: f64 = bins
            .iter()
            .filter(|&&count| count > 0)
            .map(|&count| {
                let probability = count as f64 / total;
                -probability * probability.ln()
            })
            .sum();

        // Normalize entropy to 0-1 range (max entropy = ln(num_bins))
        let max_entropy = (num_bins as f64).ln();
        let normalized_entropy = if max_entropy > 0.0 {
            entropy / max_entropy
        } else {
            0.0
        };

        // Additional factor: Variance of the distribution
        let variance = Self::calculate_variance(&normalized);
        
        // Combine entropy and variance for robustness score
        (normalized_entropy * 0.7 + variance * 0.3).min(1.0).max(0.0)
    }

    fn calculate_variance(values: &[f64]) -> f64 {
        if values.is_empty() {
            return 0.0;
        }

        let mean = values.iter().sum::<f64>() / values.len() as f64;
        let variance = values
            .iter()
            .map(|&x| (x - mean).powi(2))
            .sum::<f64>() / values.len() as f64;

        // Normalize variance (assuming max variance of 0.25 for uniform dist)
        (variance / 0.25).min(1.0).max(0.0)
    }

    /// Load from CSV play-by-play data
    pub fn from_plays(team_id: u64, epa_values: Vec<f32>) -> Self {
        Self::new(team_id, epa_values)
    }

    /// Get fragility score (inverse of robustness)
    pub fn fragility_score(&self) -> f64 {
        1.0 - self.robustness_score
    }

    /// Determine if team is robust (> 0.6) or fragile (< 0.4)
    pub fn is_robust(&self) -> bool {
        self.robustness_score > 0.6
    }

    pub fn is_fragile(&self) -> bool {
        self.robustness_score < 0.4
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_diverse_plays_high_robustness() {
        // Diverse play distribution (robust)
        let plays = vec![1.0, 2.0, 3.0, 4.0, 5.0, 1.5, 2.5, 3.5, 4.5, 1.2];
        let topology = TeamTopology::new(1, plays);
        assert!(topology.robustness_score > 0.5);
    }

    #[test]
    fn test_uniform_plays_low_robustness() {
        // Uniform plays (predictable, fragile)
        let plays = vec![3.0, 3.0, 3.0, 3.0, 3.0];
        let topology = TeamTopology::new(1, plays);
        assert!(topology.robustness_score < 0.6);
    }
}
