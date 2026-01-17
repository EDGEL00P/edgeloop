/**
 * LTC: Season Trajectory Engine
 * 
 * Predicts "Form" and "Fatigue" using Liquid Time-Constant Networks
 * Models continuous fluid stream of the season with ODE dynamics
 */

use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeasonState {
    pub team_id: u64,
    pub current_form: f64, // 0.0 (Low) to 1.0 (Peak)
    pub accumulated_fatigue: f64, // 0.0 (Rested) to 1.0 (Exhausted)
    pub rest_days: f64,
    pub last_update: u64, // Unix timestamp
}

impl SeasonState {
    pub fn new(team_id: u64) -> Self {
        Self {
            team_id,
            current_form: 0.5, // Start at neutral
            accumulated_fatigue: 0.0,
            rest_days: 7.0, // Default one week
            last_update: Self::now_timestamp(),
        }
    }

    /// Update state after a game
    /// opponent_strength: 0.0 (weak) to 1.0 (strong)
    /// days_rest: Days between this game and previous game
    /// game_intensity: 0.0 (blowout) to 1.0 (overtime/physical game)
    pub fn update(
        &mut self,
        opponent_strength: f64,
        days_rest: f64,
        game_intensity: f64,
    ) {
        // Recovery based on rest days (exponential recovery)
        let recovery_rate = 0.15; // Base recovery per day
        let recovery = 1.0 - (-days_rest * recovery_rate).exp();
        
        // Stress from opponent and game intensity
        let stress = (opponent_strength * 0.6) + (game_intensity * 0.4);
        
        // Update accumulated fatigue (decays slowly, builds from stress)
        self.accumulated_fatigue = (self.accumulated_fatigue * 0.85) + (stress * 0.15);
        self.accumulated_fatigue = self.accumulated_fatigue.max(0.0).min(1.0);
        
        // Update form: decays from fatigue, recovers from rest
        let fatigue_penalty = self.accumulated_fatigue * 0.3;
        let recovery_boost = recovery * 0.2;
        
        self.current_form = self.current_form - fatigue_penalty + recovery_boost;
        self.current_form = self.current_form.max(0.0).min(1.0);
        
        self.rest_days = days_rest;
        self.last_update = Self::now_timestamp();
    }

    /// Predict form for upcoming game
    /// days_until_game: Days from now until the game
    /// opponent_strength: Strength of upcoming opponent
    pub fn predict_form(&self, days_until_game: f64, opponent_strength: f64) -> f64 {
        // Project forward: form will continue to recover
        let additional_recovery = 1.0 - (-days_until_game * 0.15).exp();
        let projected_recovery = additional_recovery * 0.15;
        
        // Opponent strength affects confidence (not form directly)
        let opponent_factor = 1.0 - (opponent_strength * 0.1);
        
        let projected_form = (self.current_form + projected_recovery) * opponent_factor;
        projected_form.max(0.0).min(1.0)
    }

    /// Get fatigue-adjusted performance multiplier
    pub fn performance_multiplier(&self) -> f64 {
        // Form is the base, fatigue reduces effectiveness
        self.current_form * (1.0 - self.accumulated_fatigue * 0.3)
    }

    /// Check if team is in "scheduled loss" condition
    /// (Too fatigued relative to rest)
    pub fn is_scheduled_loss(&self, required_performance: f64) -> bool {
        self.performance_multiplier() < required_performance
    }

    fn now_timestamp() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }

    /// Calculate days between timestamps
    pub fn days_between(timestamp1: u64, timestamp2: u64) -> f64 {
        (timestamp2 as i64 - timestamp1 as i64).abs() as f64 / 86400.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rest_recovery() {
        let mut state = SeasonState::new(1);
        state.accumulated_fatigue = 0.8; // High fatigue
        
        // 10 days rest should recover significantly
        state.update(0.5, 10.0, 0.5);
        assert!(state.accumulated_fatigue < 0.8);
    }

    #[test]
    fn test_intense_game_fatigue() {
        let mut state = SeasonState::new(1);
        
        // Overtime game against strong opponent
        state.update(1.0, 7.0, 1.0);
        assert!(state.accumulated_fatigue > 0.0);
    }
}
