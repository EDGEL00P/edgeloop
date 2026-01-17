/**
 * El-API - Rust HTTP Server
 * 
 * Exposes Rust backend services to Next.js via REST API.
 * 
 * Performance: Microsecond latency for all endpoints
 */

use axum::{
    extract::Path,
    http::StatusCode,
    response::{Json, Sse},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::convert::Infallible;
use tower_http::cors::CorsLayer;
use tracing::info;

mod handlers;

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    timestamp: String,
    version: String,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "el_api=info,tower_http=debug".into()),
        )
        .init();

    let app = Router::new()
        .route("/health", get(health_check))
        // Kelly calculator
        .route("/api/v1/kelly", post(handlers::kelly::calculate_kelly))
        .route("/api/v1/kelly/quarter", post(handlers::kelly::calculate_quarter_kelly))
        // Predictions
        .route("/api/v1/odds/stream", get(handlers::odds::stream_odds))
        .route("/api/v1/predictions/:game_id", get(handlers::predictions::get_prediction))
        .route("/api/v1/predictions", post(handlers::predictions::create_prediction))
        // BALLDONTLIE NFL API
        .route("/api/v1/nfl/teams", get(handlers::nfl::get_teams))
        .route("/api/v1/nfl/teams/:id", get(handlers::nfl::get_team))
        .route("/api/v1/nfl/players", get(handlers::nfl::get_players))
        .route("/api/v1/nfl/games", get(handlers::nfl::get_games))
        .route("/api/v1/nfl/odds", get(handlers::nfl::get_odds))
        .route("/api/v1/nfl/odds/player_props", get(handlers::nfl_goat::get_player_props))
        .route("/api/v1/nfl/season_stats", get(handlers::nfl_goat::get_season_stats))
        .route("/api/v1/nfl/standings", get(handlers::nfl_goat::get_standings))
        .route("/api/v1/nfl/advanced_stats/rushing", get(handlers::nfl_goat::get_advanced_rushing_stats))
        .route("/api/v1/nfl/advanced_stats/passing", get(handlers::nfl_goat::get_advanced_passing_stats))
        .route("/api/v1/nfl/advanced_stats/receiving", get(handlers::nfl_goat::get_advanced_receiving_stats))
        .route("/api/v1/nfl/plays", get(handlers::nfl_goat::get_plays))
        .route("/api/v1/nfl/teams/:id/roster", get(handlers::nfl_goat::get_team_roster))
        // Genesis Prediction Engine
        .route("/api/v1/genesis/predict", get(handlers::genesis::generate_prediction))
        .layer(CorsLayer::permissive());

    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    info!("🚀 El-API server starting on {}", addr);
    info!("📡 Ready to serve Next.js frontend");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}
