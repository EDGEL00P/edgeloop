use axum::{
    extract::{Query, Path},
    http::StatusCode,
    response::Json,
};
use serde::Deserialize;
use el_feed::BallDontLieClient;

fn get_api_key() -> String {
    std::env::var("BALLDONTLIE_API_KEY")
        .unwrap_or_else(|_| "YOUR_API_KEY".to_string())
}

#[derive(Deserialize)]
pub struct PlayerPropsQuery {
    game_id: u64,
    player_id: Option<u64>,
    prop_type: Option<String>,
    vendors: Option<String>,
}

#[derive(Deserialize)]
pub struct SeasonStatsQuery {
    season: u64,
    player_ids: Option<String>,
    team_id: Option<u64>,
    postseason: Option<bool>,
    sort_by: Option<String>,
    sort_order: Option<String>,
}

#[derive(Deserialize)]
pub struct StandingsQuery {
    season: u64,
}

#[derive(Deserialize)]
pub struct AdvancedStatsQuery {
    season: u64,
    player_id: Option<u64>,
    postseason: Option<bool>,
    week: Option<u64>,
}

#[derive(Deserialize)]
pub struct PlaysQuery {
    game_id: u64,
    cursor: Option<u64>,
    per_page: Option<u64>,
}

#[derive(Deserialize)]
pub struct RosterQuery {
    season: Option<u64>,
}

pub async fn get_player_props(
    Query(params): Query<PlayerPropsQuery>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let client = BallDontLieClient::new(get_api_key());
    
    let vendors = params.vendors.as_ref()
        .map(|s| s.split(',').collect::<Vec<_>>());
    
    let vendors_ref = vendors.as_ref().map(|v| v.iter().map(|s| s.as_str()).collect::<Vec<_>>());
    
    let result = client
        .get_player_props(
            params.game_id,
            params.player_id,
            params.prop_type.as_deref(),
            vendors_ref.as_ref().map(|v| v.as_slice()),
        )
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::to_value(result).unwrap()))
}

pub async fn get_season_stats(
    Query(params): Query<SeasonStatsQuery>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let client = BallDontLieClient::new(get_api_key());
    
    let player_ids = params.player_ids.as_ref()
        .map(|s| s.split(',').filter_map(|x| x.parse::<u64>().ok()).collect::<Vec<_>>());
    
    let result = client
        .get_season_stats(
            params.season,
            player_ids.as_ref().map(|v| v.as_slice()),
            params.team_id,
            params.postseason,
            params.sort_by.as_deref(),
            params.sort_order.as_deref(),
        )
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::to_value(result).unwrap()))
}

pub async fn get_standings(
    Query(params): Query<StandingsQuery>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let client = BallDontLieClient::new(get_api_key());
    
    let result = client
        .get_standings(params.season)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::to_value(result).unwrap()))
}

pub async fn get_advanced_rushing_stats(
    Query(params): Query<AdvancedStatsQuery>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let client = BallDontLieClient::new(get_api_key());
    
    let result = client
        .get_advanced_rushing_stats(
            params.season,
            params.player_id,
            params.postseason,
            params.week,
        )
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::to_value(result).unwrap()))
}

pub async fn get_advanced_passing_stats(
    Query(params): Query<AdvancedStatsQuery>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let client = BallDontLieClient::new(get_api_key());
    
    let result = client
        .get_advanced_passing_stats(
            params.season,
            params.player_id,
            params.postseason,
            params.week,
        )
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::to_value(result).unwrap()))
}

pub async fn get_advanced_receiving_stats(
    Query(params): Query<AdvancedStatsQuery>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let client = BallDontLieClient::new(get_api_key());
    
    let result = client
        .get_advanced_receiving_stats(
            params.season,
            params.player_id,
            params.postseason,
            params.week,
        )
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::to_value(result).unwrap()))
}

pub async fn get_plays(
    Query(params): Query<PlaysQuery>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let client = BallDontLieClient::new(get_api_key());
    
    let result = client
        .get_plays(
            params.game_id,
            params.cursor,
            params.per_page,
        )
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::to_value(result).unwrap()))
}

pub async fn get_team_roster(
    Path(team_id): Path<u64>,
    Query(params): Query<RosterQuery>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let client = BallDontLieClient::new(get_api_key());
    
    let result = client
        .get_team_roster(team_id, params.season)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(serde_json::to_value(result).unwrap()))
}
