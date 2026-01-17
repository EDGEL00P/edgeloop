use axum::{
    extract::Path,
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct Prediction {
    pub game_id: String,
    pub home_win_prob: f64,
    pub predicted_spread: f64,
    pub predicted_total: f64,
    pub edge: f64,
    pub confidence: f64,
}

#[derive(Deserialize)]
pub struct PredictionRequest {
    pub game_id: String,
    pub home_team: String,
    pub away_team: String,
}

// TODO: Integrate with el-brain (Burn ML) for actual predictions
pub async fn get_prediction(
    Path(game_id): Path<String>,
) -> Result<Json<Prediction>, StatusCode> {
    // Placeholder - will use Burn model inference
    Ok(Json(Prediction {
        game_id,
        home_win_prob: 0.55,
        predicted_spread: -3.5,
        predicted_total: 45.5,
        edge: 0.03,
        confidence: 0.72,
    }))
}

pub async fn create_prediction(
    Json(payload): Json<PredictionRequest>,
) -> Result<Json<Prediction>, StatusCode> {
    // Placeholder - will trigger Burn model inference
    Ok(Json(Prediction {
        game_id: payload.game_id,
        home_win_prob: 0.55,
        predicted_spread: -3.5,
        predicted_total: 45.5,
        edge: 0.03,
        confidence: 0.72,
    }))
}
