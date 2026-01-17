/**
 * Engine Core - Rust Service
 * 
 * High-performance betting engine using Axum.
 * 
 * Performance Targets:
 * - Kelly calculation: <1ms
 * - Odds comparison: <5ms
 * - ML inference: <10ms
 */

use axum::{
    extract::Path,
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

mod kelly;
mod arbitrage;

use kelly::KellyCalculator;
use arbitrage::ArbitrageDetector;

#[derive(Serialize, Deserialize)]
struct HealthResponse {
    status: String,
    timestamp: String,
}

#[derive(Serialize, Deserialize)]
struct KellyRequest {
    probability: f64,
    decimal_odds: f64,
    bankroll: f64,
}

#[derive(Serialize, Deserialize)]
struct KellyResponse {
    kelly_fraction: f64,
    recommended_stake: f64,
    edge: f64,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "engine_core=info".into()),
        )
        .init();

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/kelly", post(calculate_kelly))
        .route("/api/kelly/quarter", post(calculate_quarter_kelly))
        .route("/api/arbitrage/detect", post(detect_arbitrage))
        .layer(CorsLayer::permissive());

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("🚀 Engine Core starting on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

async fn calculate_kelly(Json(payload): Json<KellyRequest>) -> Result<Json<KellyResponse>, StatusCode> {
    let calculator = KellyCalculator::new();
    
    match calculator.calculate(payload.probability, payload.decimal_odds, payload.bankroll) {
        Ok(result) => Ok(Json(result)),
        Err(_) => Err(StatusCode::BAD_REQUEST),
    }
}

async fn calculate_quarter_kelly(Json(payload): Json<KellyRequest>) -> Result<Json<KellyResponse>, StatusCode> {
    let calculator = KellyCalculator::new();
    
    match calculator.calculate_quarter(payload.probability, payload.decimal_odds, payload.bankroll) {
        Ok(result) => Ok(Json(result)),
        Err(_) => Err(StatusCode::BAD_REQUEST),
    }
}

async fn detect_arbitrage() -> Json<serde_json::Value> {
    // TODO: Implement arbitrage detection
    Json(serde_json::json!({
        "status": "not_implemented",
        "message": "Arbitrage detection coming soon"
    }))
}
