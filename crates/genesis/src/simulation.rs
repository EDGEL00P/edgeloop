/**
 * Active Inference: Virtual Matchup Simulator
 * 
 * Simulates game logic using Free Energy Principle
 * Models two agents (coaches) minimizing surprise
 */

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub team_id: u64,
    pub strategy: Strategy,
    pub beliefs: PlayBeliefs,
    pub tendencies: PlayTendencies,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Strategy {
    Aggressive,   // High-risk, high-reward
    Conservative, // Safe, methodical
    Balanced,     // Adapts based on situation
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayBeliefs {
    pub run_success_rate: f64,    // 0.0 to 1.0
    pub pass_success_rate: f64,   // 0.0 to 1.0
    pub screen_success_rate: f64, // 0.0 to 1.0
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayTendencies {
    pub run_preference: f64,      // 0.0 (never run) to 1.0 (always run)
    pub pass_preference: f64,     // 0.0 to 1.0
    pub screen_preference: f64,   // 0.0 to 1.0
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameResult {
    pub home_score: u32,
    pub away_score: u32,
    pub home_yards: u32,
    pub away_yards: u32,
    pub time_of_possession_home: f64, // Minutes
    pub game_script: Vec<String>, // Description of game flow
}

impl Agent {
    pub fn new(team_id: u64, strategy: Strategy) -> Self {
        let (run_success, pass_success, screen_success) = match strategy {
            Strategy::Aggressive => (0.45, 0.55, 0.40),
            Strategy::Conservative => (0.50, 0.48, 0.45),
            Strategy::Balanced => (0.48, 0.52, 0.42),
        };

        let (run_pref, pass_pref, screen_pref) = match strategy {
            Strategy::Aggressive => (0.30, 0.60, 0.10),
            Strategy::Conservative => (0.55, 0.35, 0.10),
            Strategy::Balanced => (0.40, 0.50, 0.10),
        };

        Self {
            team_id,
            strategy,
            beliefs: PlayBeliefs {
                run_success_rate: run_success,
                pass_success_rate: pass_success,
                screen_success_rate: screen_success,
            },
            tendencies: PlayTendencies {
                run_preference: run_pref,
                pass_preference: pass_pref,
                screen_preference: screen_pref,
            },
        }
    }

    /// Select a play based on down/distance and current beliefs
    pub fn select_play(&self, down: u8, distance: u8, score_diff: i16) -> PlayType {
        let situation_factor = match (down, distance) {
            (4, d) if d > 2 => 0.8, // 4th and long -> prefer pass
            (1 | 2, d) if d <= 3 => 0.6, // Short yardage -> prefer run
            _ => 0.5,
        };

        // Adjust preferences based on score
        let run_adjust = if score_diff > 7 { -0.1 } else { 0.0 };
        let pass_adjust = if score_diff < -7 { 0.1 } else { 0.0 };

        let run_prob = (self.tendencies.run_preference + run_adjust) * situation_factor;
        let pass_prob = (self.tendencies.pass_preference + pass_adjust) * (1.0 - situation_factor);

        // Simple weighted random (simplified for Rust)
        if run_prob > pass_prob {
            PlayType::Run
        } else {
            PlayType::Pass
        }
    }

    /// Update beliefs after a play result
    pub fn update_beliefs(&mut self, play_type: PlayType, success: bool) {
        let learning_rate = 0.05;
        let update = if success { learning_rate } else { -learning_rate };

        match play_type {
            PlayType::Run => {
                self.beliefs.run_success_rate =
                    (self.beliefs.run_success_rate + update).max(0.0).min(1.0);
            }
            PlayType::Pass => {
                self.beliefs.pass_success_rate =
                    (self.beliefs.pass_success_rate + update).max(0.0).min(1.0);
            }
            PlayType::Screen => {
                self.beliefs.screen_success_rate =
                    (self.beliefs.screen_success_rate + update).max(0.0).min(1.0);
            }
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub enum PlayType {
    Run,
    Pass,
    Screen,
}

/// Simulate a matchup between two agents
pub fn simulate_matchup(home: &mut Agent, away: &mut Agent, num_plays: usize) -> GameResult {
    let mut home_score = 0u32;
    let mut away_score = 0u32;
    let mut home_yards = 0u32;
    let mut away_yards = 0u32;
    let mut home_time = 0.0;
    let mut away_time = 0.0;
    let mut game_script = Vec::new();

    let mut home_possession = true;
    let mut down = 1u8;
    let mut distance = 10u8;
    let mut yards_to_go = 10u8;

    for play_num in 0..num_plays {
        let current_agent = if home_possession { home } else { away };
        let score_diff = home_score as i16 - away_score as i16;
        let rel_score_diff = if home_possession { score_diff } else { -score_diff };

        // Agent selects play
        let play_type = current_agent.select_play(down, yards_to_go, rel_score_diff);

        // Determine success based on beliefs and randomness
        let success_rate = match play_type {
            PlayType::Run => current_agent.beliefs.run_success_rate,
            PlayType::Pass => current_agent.beliefs.pass_success_rate,
            PlayType::Screen => current_agent.beliefs.screen_success_rate,
        };

        // Simplified success determination (would use proper RNG in production)
        let success = (play_num as f64 * 0.618) % 1.0 < success_rate;
        
        let yards_gained = if success {
            (5.0 + (play_num as f64 * 0.1) % 15.0) as u32
        } else {
            (play_num as f64 * 0.3) % 3.0 as u32
        };

        // Update yards and time
        if home_possession {
            home_yards += yards_gained;
            home_time += 0.5; // ~30 seconds per play
        } else {
            away_yards += yards_gained;
            away_time += 0.5;
        }

        // Update agent beliefs
        if home_possession {
            home.update_beliefs(play_type, success);
        } else {
            away.update_beliefs(play_type, success);
        }

        // Update down/distance
        if yards_gained >= yards_to_go {
            // First down
            down = 1;
            distance = 10;
            yards_to_go = 10;
        } else {
            yards_to_go -= yards_gained as u8;
            down += 1;
            
            if down > 4 {
                // Turnover on downs
                home_possession = !home_possession;
                down = 1;
                distance = 10;
                yards_to_go = 10;
            }
        }

        // Scoring (simplified)
        if home_yards > 70 && play_num % 15 == 0 {
            if home_possession {
                home_score += 7;
                game_script.push(format!("Play {}: Home TD ({} - {})", play_num, home_score, away_score));
            }
        }
        if away_yards > 70 && play_num % 17 == 0 {
            if !home_possession {
                away_score += 7;
                game_script.push(format!("Play {}: Away TD ({} - {})", play_num, home_score, away_score));
            }
        }
    }

    GameResult {
        home_score,
        away_score,
        home_yards,
        away_yards,
        time_of_possession_home: home_time / (home_time + away_time),
        game_script,
    }
}
