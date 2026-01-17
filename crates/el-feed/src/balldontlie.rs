/**
 * BALLDONTLIE NFL API Client
 * 
 * Connects to balldontlie.io for NFL data (teams, players, games, stats, odds)
 * Reference: https://nfl.balldontlie.io/
 */

use serde::{Deserialize, Serialize};
use anyhow::Result;

const BASE_URL: &str = "https://api.balldontlie.io/nfl/v1";

#[derive(Clone)]
pub struct BallDontLieClient {
    api_key: String,
    client: reqwest::Client,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub data: T,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub meta: Option<Meta>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Meta {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_cursor: Option<u64>,
    pub per_page: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Team {
    pub id: u64,
    pub conference: String,
    pub division: String,
    pub location: String,
    pub name: String,
    #[serde(rename = "full_name")]
    pub full_name: String,
    pub abbreviation: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Player {
    pub id: u64,
    #[serde(rename = "first_name")]
    pub first_name: String,
    #[serde(rename = "last_name")]
    pub last_name: String,
    pub position: String,
    #[serde(rename = "position_abbreviation")]
    pub position_abbreviation: String,
    pub height: String,
    pub weight: String,
    #[serde(rename = "jersey_number")]
    pub jersey_number: Option<String>,
    pub college: Option<String>,
    pub experience: Option<String>,
    pub age: Option<u64>,
    pub team: Option<Team>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Game {
    pub id: u64,
    #[serde(rename = "visitor_team")]
    pub visitor_team: Team,
    #[serde(rename = "home_team")]
    pub home_team: Team,
    pub summary: Option<String>,
    pub venue: String,
    pub week: u64,
    pub date: String,
    pub season: u64,
    pub postseason: bool,
    pub status: String,
    #[serde(rename = "home_team_score")]
    pub home_team_score: Option<u64>,
    #[serde(rename = "visitor_team_score")]
    pub visitor_team_score: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Play {
    pub id: String,
    #[serde(rename = "game_id")]
    pub game_id: u64,
    #[serde(rename = "type_slug")]
    pub type_slug: Option<String>,
    #[serde(rename = "type_text")]
    pub type_text: Option<String>,
    pub text: Option<String>,
    #[serde(rename = "stat_yardage")]
    pub stat_yardage: Option<f64>,
    #[serde(rename = "home_win_probability")]
    pub home_win_probability: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Stat {
    pub player: Option<Player>,
    pub team: Option<Team>,
    pub game: Option<Game>,
    #[serde(rename = "passing_yards")]
    pub passing_yards: Option<f64>,
    #[serde(rename = "rushing_yards")]
    pub rushing_yards: Option<f64>,
    #[serde(rename = "receiving_yards")]
    pub receiving_yards: Option<f64>,
    #[serde(rename = "passing_touchdowns")]
    pub passing_touchdowns: Option<u64>,
    #[serde(rename = "rushing_touchdowns")]
    pub rushing_touchdowns: Option<u64>,
    #[serde(rename = "receiving_touchdowns")]
    pub receiving_touchdowns: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BettingOdds {
    pub id: u64,
    #[serde(rename = "game_id")]
    pub game_id: u64,
    pub vendor: String,
    #[serde(rename = "spread_home_value")]
    pub spread_home_value: Option<String>,
    #[serde(rename = "spread_home_odds")]
    pub spread_home_odds: Option<i64>,
    #[serde(rename = "spread_away_value")]
    pub spread_away_value: Option<String>,
    #[serde(rename = "spread_away_odds")]
    pub spread_away_odds: Option<i64>,
    #[serde(rename = "moneyline_home_odds")]
    pub moneyline_home_odds: Option<i64>,
    #[serde(rename = "moneyline_away_odds")]
    pub moneyline_away_odds: Option<i64>,
    #[serde(rename = "total_value")]
    pub total_value: Option<String>,
    #[serde(rename = "total_over_odds")]
    pub total_over_odds: Option<i64>,
    #[serde(rename = "total_under_odds")]
    pub total_under_odds: Option<i64>,
    #[serde(rename = "updated_at")]
    pub updated_at: String,
}

impl BallDontLieClient {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            client: reqwest::Client::new(),
        }
    }

    fn auth_header(&self) -> String {
        // BALLDONTLIE uses Authorization: API_KEY (not Bearer token)
        self.api_key.clone()
    }

    /// Get all teams
    pub async fn get_teams(
        &self,
        division: Option<&str>,
        conference: Option<&str>,
    ) -> Result<ApiResponse<Vec<Team>>> {
        let mut url = format!("{}/teams", BASE_URL);
        let mut query_params = vec![];
        
        if let Some(div) = division {
            query_params.push(("division", div));
        }
        if let Some(conf) = conference {
            query_params.push(("conference", conf));
        }

        let response = self
            .client
            .get(&url)
            .query(&query_params)
            .header("Authorization", self.auth_header())
            .send()
            .await?;

        let data: ApiResponse<Vec<Team>> = response.json().await?;
        Ok(data)
    }

    /// Get a specific team
    pub async fn get_team(&self, team_id: u64) -> Result<ApiResponse<Team>> {
        let url = format!("{}/teams/{}", BASE_URL, team_id);
        
        let response = self
            .client
            .get(&url)
            .header("Authorization", self.auth_header())
            .send()
            .await?;

        let data: ApiResponse<Team> = response.json().await?;
        Ok(data)
    }

    /// Get all players
    pub async fn get_players(
        &self,
        cursor: Option<u64>,
        per_page: Option<u64>,
        search: Option<&str>,
        team_ids: Option<&[u64]>,
    ) -> Result<ApiResponse<Vec<Player>>> {
        let mut url = format!("{}/players", BASE_URL);
        let mut query_params = vec![];
        
        if let Some(c) = cursor {
            query_params.push(("cursor", c.to_string()));
        }
        if let Some(pp) = per_page {
            query_params.push(("per_page", pp.to_string()));
        }
        if let Some(s) = search {
            query_params.push(("search", s.to_string()));
        }
        if let Some(ids) = team_ids {
            for id in ids {
                query_params.push(("team_ids[]", id.to_string()));
            }
        }

        let response = self
            .client
            .get(&url)
            .query(&query_params)
            .header("Authorization", self.auth_header())
            .send()
            .await?;

        let data: ApiResponse<Vec<Player>> = response.json().await?;
        Ok(data)
    }

    /// Get all games
    pub async fn get_games(
        &self,
        season: Option<u64>,
        week: Option<u64>,
        team_ids: Option<&[u64]>,
        cursor: Option<u64>,
        per_page: Option<u64>,
    ) -> Result<ApiResponse<Vec<Game>>> {
        let mut url = format!("{}/games", BASE_URL);
        let mut query_params = vec![];
        
        if let Some(s) = season {
            query_params.push(("seasons[]", s.to_string()));
        }
        if let Some(w) = week {
            query_params.push(("weeks[]", w.to_string()));
        }
        if let Some(ids) = team_ids {
            for id in ids {
                query_params.push(("team_ids[]", id.to_string()));
            }
        }
        if let Some(c) = cursor {
            query_params.push(("cursor", c.to_string()));
        }
        if let Some(pp) = per_page {
            query_params.push(("per_page", pp.to_string()));
        }

        let response = self
            .client
            .get(&url)
            .query(&query_params)
            .header("Authorization", self.auth_header())
            .send()
            .await?;

        let data: ApiResponse<Vec<Game>> = response.json().await?;
        Ok(data)
    }

    /// Get betting odds
    pub async fn get_odds(
        &self,
        season: Option<u64>,
        week: Option<u64>,
        game_ids: Option<&[u64]>,
    ) -> Result<ApiResponse<Vec<BettingOdds>>> {
        let mut url = format!("{}/odds", BASE_URL);
        let mut query_params = vec![];
        
        if let Some(s) = season {
            query_params.push(("season", s.to_string()));
        }
        if let Some(w) = week {
            query_params.push(("week", w.to_string()));
        }
        if let Some(ids) = game_ids {
            for id in ids {
                query_params.push(("game_ids[]", id.to_string()));
            }
        }

        let response = self
            .client
            .get(&url)
            .query(&query_params)
            .header("Authorization", self.auth_header())
            .send()
            .await?;

        let data: ApiResponse<Vec<BettingOdds>> = response.json().await?;
        Ok(data)
    }

    /// Get play-by-play data (GOAT tier) - Returns plays for topology analysis
    pub async fn get_plays(
        &self,
        game_id: u64,
        cursor: Option<u64>,
        per_page: Option<u64>,
    ) -> Result<ApiResponse<Vec<Play>>> {
        let mut url = format!("{}/plays", BASE_URL);
        let mut query_params = vec![("game_id", game_id.to_string())];
        
        if let Some(c) = cursor {
            query_params.push(("cursor", c.to_string()));
        }
        if let Some(pp) = per_page {
            query_params.push(("per_page", pp.to_string()));
        }

        let response = self
            .client
            .get(&url)
            .query(&query_params)
            .header("Authorization", self.auth_header())
            .send()
            .await?;

        let data: ApiResponse<Vec<Play>> = response.json().await?;
        Ok(data)
    }

    /// Get all stats (for calculating EPA values for topology)
    pub async fn get_stats(
        &self,
        game_ids: Option<&[u64]>,
        player_ids: Option<&[u64]>,
        seasons: Option<&[u64]>,
        cursor: Option<u64>,
        per_page: Option<u64>,
    ) -> Result<ApiResponse<Vec<Stat>>> {
        let mut url = format!("{}/stats", BASE_URL);
        let mut query_params = vec![];
        
        if let Some(gids) = game_ids {
            for id in gids {
                query_params.push(("game_ids[]", id.to_string()));
            }
        }
        if let Some(pids) = player_ids {
            for id in pids {
                query_params.push(("player_ids[]", id.to_string()));
            }
        }
        if let Some(seasons_list) = seasons {
            for s in seasons_list {
                query_params.push(("seasons[]", s.to_string()));
            }
        }
        if let Some(c) = cursor {
            query_params.push(("cursor", c.to_string()));
        }
        if let Some(pp) = per_page {
            query_params.push(("per_page", pp.to_string()));
        }

        let response = self
            .client
            .get(&url)
            .query(&query_params)
            .header("Authorization", self.auth_header())
            .send()
            .await?;

        let data: ApiResponse<Vec<Stat>> = response.json().await?;
        Ok(data)
    }

    /// Get season stats (for team performance data)
    pub async fn get_season_stats(
        &self,
        season: u64,
        player_ids: Option<&[u64]>,
        team_id: Option<u64>,
        postseason: Option<bool>,
        sort_by: Option<&str>,
        sort_order: Option<&str>,
    ) -> Result<ApiResponse<Vec<serde_json::Value>>> {
        let mut url = format!("{}/season_stats", BASE_URL);
        let mut query_params = vec![("season", season.to_string())];
        
        if let Some(ids) = player_ids {
            for id in ids {
                query_params.push(("player_ids[]", id.to_string()));
            }
        }
        if let Some(tid) = team_id {
            query_params.push(("team_id", tid.to_string()));
        }
        if let Some(post) = postseason {
            query_params.push(("postseason", post.to_string()));
        }
        if let Some(sb) = sort_by {
            query_params.push(("sort_by", sb.to_string()));
        }
        if let Some(so) = sort_order {
            query_params.push(("sort_order", so.to_string()));
        }

        let response = self
            .client
            .get(&url)
            .query(&query_params)
            .header("Authorization", self.auth_header())
            .send()
            .await?;

        let data: ApiResponse<Vec<serde_json::Value>> = response.json().await?;
        Ok(data)
    }

    /// Get team standings (for opponent strength calculations)
    pub async fn get_standings(&self, season: u64) -> Result<ApiResponse<Vec<serde_json::Value>>> {
        let url = format!("{}/standings?season={}", BASE_URL, season);

        let response = self
            .client
            .get(&url)
            .header("Authorization", self.auth_header())
            .send()
            .await?;

        let data: ApiResponse<Vec<serde_json::Value>> = response.json().await?;
        Ok(data)
    }

    /// Get player props (GOAT tier)
    pub async fn get_player_props(
        &self,
        game_id: u64,
        player_id: Option<u64>,
        prop_type: Option<&str>,
        vendors: Option<&[&str]>,
    ) -> Result<ApiResponse<Vec<serde_json::Value>>> {
        let mut url = format!("{}/odds/player_props", BASE_URL);
        let mut query_params = vec![("game_id", game_id.to_string())];
        
        if let Some(pid) = player_id {
            query_params.push(("player_id", pid.to_string()));
        }
        if let Some(pt) = prop_type {
            query_params.push(("prop_type", pt.to_string()));
        }
        if let Some(vendors_list) = vendors {
            for v in vendors_list {
                query_params.push(("vendors[]", v.to_string()));
            }
        }

        let response = self
            .client
            .get(&url)
            .query(&query_params)
            .header("Authorization", self.auth_header())
            .send()
            .await?;

        let data: ApiResponse<Vec<serde_json::Value>> = response.json().await?;
        Ok(data)
    }

    /// Get advanced rushing stats (GOAT tier)
    pub async fn get_advanced_rushing_stats(
        &self,
        season: u64,
        player_id: Option<u64>,
        postseason: Option<bool>,
        week: Option<u64>,
    ) -> Result<ApiResponse<Vec<serde_json::Value>>> {
        let mut url = format!("{}/advanced_stats/rushing", BASE_URL);
        let mut query_params = vec![("season", season.to_string())];
        
        if let Some(pid) = player_id {
            query_params.push(("player_id", pid.to_string()));
        }
        if let Some(post) = postseason {
            query_params.push(("postseason", post.to_string()));
        }
        if let Some(w) = week {
            query_params.push(("week", w.to_string()));
        }

        let response = self
            .client
            .get(&url)
            .query(&query_params)
            .header("Authorization", self.auth_header())
            .send()
            .await?;

        let data: ApiResponse<Vec<serde_json::Value>> = response.json().await?;
        Ok(data)
    }

    /// Get advanced passing stats (GOAT tier)
    pub async fn get_advanced_passing_stats(
        &self,
        season: u64,
        player_id: Option<u64>,
        postseason: Option<bool>,
        week: Option<u64>,
    ) -> Result<ApiResponse<Vec<serde_json::Value>>> {
        let mut url = format!("{}/advanced_stats/passing", BASE_URL);
        let mut query_params = vec![("season", season.to_string())];
        
        if let Some(pid) = player_id {
            query_params.push(("player_id", pid.to_string()));
        }
        if let Some(post) = postseason {
            query_params.push(("postseason", post.to_string()));
        }
        if let Some(w) = week {
            query_params.push(("week", w.to_string()));
        }

        let response = self
            .client
            .get(&url)
            .query(&query_params)
            .header("Authorization", self.auth_header())
            .send()
            .await?;

        let data: ApiResponse<Vec<serde_json::Value>> = response.json().await?;
        Ok(data)
    }

    /// Get advanced receiving stats (GOAT tier)
    pub async fn get_advanced_receiving_stats(
        &self,
        season: u64,
        player_id: Option<u64>,
        postseason: Option<bool>,
        week: Option<u64>,
    ) -> Result<ApiResponse<Vec<serde_json::Value>>> {
        let mut url = format!("{}/advanced_stats/receiving", BASE_URL);
        let mut query_params = vec![("season", season.to_string())];
        
        if let Some(pid) = player_id {
            query_params.push(("player_id", pid.to_string()));
        }
        if let Some(post) = postseason {
            query_params.push(("postseason", post.to_string()));
        }
        if let Some(w) = week {
            query_params.push(("week", w.to_string()));
        }

        let response = self
            .client
            .get(&url)
            .query(&query_params)
            .header("Authorization", self.auth_header())
            .send()
            .await?;

        let data: ApiResponse<Vec<serde_json::Value>> = response.json().await?;
        Ok(data)
    }

    /// Get team roster (GOAT tier)
    pub async fn get_team_roster(
        &self,
        team_id: u64,
        season: Option<u64>,
    ) -> Result<ApiResponse<Vec<serde_json::Value>>> {
        let mut url = format!("{}/teams/{}/roster", BASE_URL, team_id);
        let mut query_params = vec![];
        
        if let Some(s) = season {
            query_params.push(("season", s.to_string()));
        }

        let response = self
            .client
            .get(&url)
            .query(&query_params)
            .header("Authorization", self.auth_header())
            .send()
            .await?;

        let data: ApiResponse<Vec<serde_json::Value>> = response.json().await?;
        Ok(data)
    }
}
