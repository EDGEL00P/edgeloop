use axum::{extract::Json, http::StatusCode, response::Json as ResponseJson};
use serde::{Deserialize, Serialize};
use el_core::kelly::{KellyCalculator, KellyResult};

#[derive(Deserialize)]
pub struct KellyRequest {
    pub probability: f64,
    pub decimal_odds: f64,
    pub bankroll: f64,
}

#[derive(Serialize)]
pub struct KellyResponse {
    pub kelly_fraction: f64,
    pub recommended_stake: f64,
    pub edge: f64,
    pub is_positive_edge: bool,
}

impl From<KellyResult> for KellyResponse {
    fn from(result: KellyResult) -> Self {
        Self {
            kelly_fraction: result.kelly_fraction,
            recommended_stake: result.recommended_stake,
            edge: result.edge,
            is_positive_edge: result.is_positive_edge,
        }
    }
}

pub async fn calculate_kelly(
    Json(payload): Json<KellyRequest>,
) -> Result<ResponseJson<KellyResponse>, StatusCode> {
    let calculator = KellyCalculator::new();
    
    match calculator.calculate(payload.probability, payload.decimal_odds, payload.bankroll) {
        Ok(result) => Ok(ResponseJson(result.into())),
        Err(_) => Err(StatusCode::BAD_REQUEST),
    }
}

pub async fn calculate_quarter_kelly(
    Json(payload): Json<KellyRequest>,
) -> Result<ResponseJson<KellyResponse>, StatusCode> {
    let calculator = KellyCalculator::new();
    
    match calculator.calculate_quarter(payload.probability, payload.decimal_odds, payload.bankroll) {
        Ok(result) => Ok(ResponseJson(result.into())),
        Err(_) => Err(StatusCode::BAD_REQUEST),
    }
}
