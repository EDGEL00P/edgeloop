use axum::{
    extract::{Query, Path},
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};
use el_feed::BallDontLieClient;
use std::collections::HashMap;

#[derive(Deserialize)]
pub struct TeamsQuery {
    division: Option<String>,
    conference: Option<String>,
}

#[derive(Deserialize)]
pub struct PlayersQuery {
    cursor: Option<u64>,
    per_page: Option<u64>,
    search: Option<String>,
    team_ids: Option<String>, // Comma-separated
}

#[derive(Deserialize)]
pub struct GamesQuery {
    season: Option<u64>,
    week: Option<u64>,
    team_ids: Option<String>, // Comma-separated
    cursor: Option<u64>,
    per_page: Option<u64>,
}

#[derive(Deserialize)]
pub struct OddsQuery {
    season: Option<u64>,
    week: Option<u64>,
    game_ids: Option<String>, // Comma-separated
}

/// Get API key from environment or use placeholder
fn get_api_key() -> String {
    std::env::var("BALLDONTLIE_API_KEY")
        .unwrap_or_else(|_| "YOUR_API_KEY".to_string())
}

/// Get all teams
pub async fn get_teams(
    Query(params): Query<TeamsQuery>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let client = BallDontLieClient::new(get_api_key());
    
    let result = client
        .get_teams(
            params.division.as_deref(),
            params.conference.as_deref(),
        )
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::to_value(result).unwrap()))
}

/// Get a specific team
pub async fn get_team(
    Path(team_id): Path<u64>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let client = BallDontLieClient::new(get_api_key());
    
    let result = client
        .get_team(team_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::to_value(result).unwrap()))
}

/// Get all players
pub async fn get_players(
    Query(params): Query<PlayersQuery>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let client = BallDontLieClient::new(get_api_key());
    
    let team_ids = params.team_ids.as_ref()
        .map(|s| s.split(',').filter_map(|x| x.parse::<u64>().ok()).collect::<Vec<_>>());
    
    let team_ids_ref = team_ids.as_ref().map(|v| v.as_slice());
    
    let result = client
        .get_players(
            params.cursor,
            params.per_page,
            params.search.as_deref(),
            team_ids_ref,
        )
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::to_value(result).unwrap()))
}

/// Get all games
pub async fn get_games(
    Query(params): Query<GamesQuery>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let client = BallDontLieClient::new(get_api_key());
    
    let team_ids = params.team_ids.as_ref()
        .map(|s| s.split(',').filter_map(|x| x.parse::<u64>().ok()).collect::<Vec<_>>());
    
    let team_ids_ref = team_ids.as_ref().map(|v| v.as_slice());
    
    let result = client
        .get_games(
            params.season,
            params.week,
            team_ids_ref,
            params.cursor,
            params.per_page,
        )
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::to_value(result).unwrap()))
}

/// Get betting odds
pub async fn get_odds(
    Query(params): Query<OddsQuery>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let client = BallDontLieClient::new(get_api_key());
    
    let game_ids = params.game_ids.as_ref()
        .map(|s| s.split(',').filter_map(|x| x.parse::<u64>().ok()).collect::<Vec<_>>());
    
    let game_ids_ref = game_ids.as_ref().map(|v| v.as_slice());
    
    let result = client
        .get_odds(
            params.season,
            params.week,
            game_ids_ref,
        )
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::to_value(result).unwrap()))
}
