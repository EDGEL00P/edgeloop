"""
NFL Data Acquisition Engine - BallDontLie Integration
======================================================
Real-time NFL data from the BallDontLie API.
Provides games, teams, players, and live stats.

API Docs: https://docs.balldontlie.io
"""

import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from dataclasses import dataclass, asdict

import httpx
import polars as pl

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# API CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

BALLDONTLIE_BASE_URL = "https://api.balldontlie.io/nfl/v1"


@dataclass
class NFLTeam:
    """NFL Team data model."""
    id: int
    conference: str
    division: str
    location: str
    name: str
    full_name: str
    abbreviation: str


@dataclass
class NFLPlayer:
    """NFL Player data model."""
    id: int
    first_name: str
    last_name: str
    position: str
    position_abbreviation: str
    height: str
    weight: str
    jersey_number: Optional[str]
    college: str
    experience: str
    age: int
    team: Optional[NFLTeam]


@dataclass
class NFLGame:
    """NFL Game data model."""
    id: int
    date: str
    season: int
    week: int
    status: str
    home_team: NFLTeam
    visitor_team: NFLTeam
    home_team_score: Optional[int]
    visitor_team_score: Optional[int]
    venue: Optional[str]
    time: Optional[str]


@dataclass
class PlayerStats:
    """Player game statistics."""
    player_id: int
    game_id: int
    team_id: int
    # Passing
    passing_attempts: int = 0
    passing_completions: int = 0
    passing_yards: int = 0
    passing_touchdowns: int = 0
    interceptions: int = 0
    # Rushing
    rushing_attempts: int = 0
    rushing_yards: int = 0
    rushing_touchdowns: int = 0
    # Receiving
    receptions: int = 0
    receiving_yards: int = 0
    receiving_touchdowns: int = 0
    targets: int = 0


class BallDontLieConnector:
    """
    Connector for BallDontLie NFL API.
    Provides real-time access to games, teams, players, and stats.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the connector.
        
        Args:
            api_key: BallDontLie API key (falls back to env var)
        """
        self.api_key = api_key or os.getenv("BALLDONTLIE_API_KEY", "")
        if not self.api_key:
            logger.warning("BALLDONTLIE_API_KEY not set - API calls may fail")
        
        self.client = httpx.Client(
            base_url=BALLDONTLIE_BASE_URL,
            timeout=30.0,
            headers={"Authorization": self.api_key} if self.api_key else {}
        )
        self._teams_cache: Optional[List[NFLTeam]] = None
        logger.info("BallDontLieConnector initialized")
    
    def _request(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make an API request."""
        try:
            response = self.client.get(endpoint, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"API request failed: {endpoint} - {e}")
            raise
    
    def _parse_team(self, data: Dict[str, Any]) -> NFLTeam:
        """Parse team data from API response."""
        return NFLTeam(
            id=data.get("id", 0),
            conference=data.get("conference", ""),
            division=data.get("division", ""),
            location=data.get("location", ""),
            name=data.get("name", ""),
            full_name=data.get("full_name", ""),
            abbreviation=data.get("abbreviation", ""),
        )
    
    def _parse_player(self, data: Dict[str, Any]) -> NFLPlayer:
        """Parse player data from API response."""
        team_data = data.get("team")
        return NFLPlayer(
            id=data.get("id", 0),
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            position=data.get("position", ""),
            position_abbreviation=data.get("position_abbreviation", ""),
            height=data.get("height", ""),
            weight=data.get("weight", ""),
            jersey_number=data.get("jersey_number"),
            college=data.get("college", ""),
            experience=data.get("experience", ""),
            age=data.get("age", 0),
            team=self._parse_team(team_data) if team_data else None,
        )
    
    def _parse_game(self, data: Dict[str, Any]) -> NFLGame:
        """Parse game data from API response."""
        return NFLGame(
            id=data.get("id", 0),
            date=data.get("date", ""),
            season=data.get("season", 0),
            week=data.get("week", 0),
            status=data.get("status", ""),
            home_team=self._parse_team(data.get("home_team", {})),
            visitor_team=self._parse_team(data.get("visitor_team", {})),
            home_team_score=data.get("home_team_score"),
            visitor_team_score=data.get("visitor_team_score"),
            venue=data.get("venue"),
            time=data.get("time"),
        )
    
    # ─────────────────────────────────────────────────────────────────────────
    # TEAMS
    # ─────────────────────────────────────────────────────────────────────────
    
    def get_teams(self, force_refresh: bool = False) -> List[NFLTeam]:
        """
        Get all NFL teams.
        
        Args:
            force_refresh: Bypass cache
            
        Returns:
            List of NFLTeam objects
        """
        if self._teams_cache and not force_refresh:
            return self._teams_cache
        
        data = self._request("/teams")
        teams = [self._parse_team(t) for t in data.get("data", [])]
        self._teams_cache = teams
        logger.info(f"Fetched {len(teams)} teams")
        return teams
    
    def get_teams_df(self) -> pl.DataFrame:
        """Get teams as a Polars DataFrame."""
        teams = self.get_teams()
        return pl.DataFrame([asdict(t) for t in teams])
    
    def get_team_by_id(self, team_id: int) -> Optional[NFLTeam]:
        """Get a single team by ID."""
        data = self._request(f"/teams/{team_id}")
        if "data" in data:
            return self._parse_team(data["data"])
        return None
    
    def get_team_by_abbreviation(self, abbr: str) -> Optional[NFLTeam]:
        """Get a team by abbreviation (e.g., 'KC', 'BUF')."""
        teams = self.get_teams()
        for team in teams:
            if team.abbreviation.upper() == abbr.upper():
                return team
        return None
    
    # ─────────────────────────────────────────────────────────────────────────
    # PLAYERS
    # ─────────────────────────────────────────────────────────────────────────
    
    def get_players(
        self,
        team_ids: Optional[List[int]] = None,
        search: Optional[str] = None,
        per_page: int = 100,
        cursor: Optional[int] = None,
    ) -> tuple[List[NFLPlayer], Optional[int]]:
        """
        Get NFL players with optional filters.
        
        Args:
            team_ids: Filter by team IDs
            search: Search by player name
            per_page: Results per page
            cursor: Pagination cursor
            
        Returns:
            Tuple of (players list, next cursor)
        """
        params: Dict[str, Any] = {"per_page": per_page}
        if team_ids:
            params["team_ids[]"] = team_ids
        if search:
            params["search"] = search
        if cursor:
            params["cursor"] = cursor
        
        data = self._request("/players", params)
        players = [self._parse_player(p) for p in data.get("data", [])]
        next_cursor = data.get("meta", {}).get("next_cursor")
        
        logger.info(f"Fetched {len(players)} players")
        return players, next_cursor
    
    def get_all_players(self, team_ids: Optional[List[int]] = None) -> List[NFLPlayer]:
        """Get all players (handles pagination)."""
        all_players: List[NFLPlayer] = []
        cursor: Optional[int] = None
        
        while True:
            players, next_cursor = self.get_players(
                team_ids=team_ids, 
                per_page=100, 
                cursor=cursor
            )
            all_players.extend(players)
            
            if not next_cursor:
                break
            cursor = next_cursor
        
        return all_players
    
    def get_players_df(self, team_ids: Optional[List[int]] = None) -> pl.DataFrame:
        """Get players as a Polars DataFrame."""
        players = self.get_all_players(team_ids)
        records = []
        for p in players:
            record = asdict(p)
            # Flatten team data
            if p.team:
                record["team_id"] = p.team.id
                record["team_abbreviation"] = p.team.abbreviation
                record["team_name"] = p.team.full_name
            else:
                record["team_id"] = None
                record["team_abbreviation"] = None
                record["team_name"] = None
            del record["team"]
            records.append(record)
        return pl.DataFrame(records)
    
    def get_player_by_id(self, player_id: int) -> Optional[NFLPlayer]:
        """Get a single player by ID."""
        data = self._request(f"/players/{player_id}")
        if "data" in data:
            return self._parse_player(data["data"])
        return None
    
    def search_players(self, query: str) -> List[NFLPlayer]:
        """Search for players by name."""
        players, _ = self.get_players(search=query, per_page=25)
        return players
    
    # ─────────────────────────────────────────────────────────────────────────
    # GAMES
    # ─────────────────────────────────────────────────────────────────────────
    
    def get_games(
        self,
        seasons: Optional[List[int]] = None,
        weeks: Optional[List[int]] = None,
        team_ids: Optional[List[int]] = None,
        dates: Optional[List[str]] = None,
        per_page: int = 100,
        cursor: Optional[int] = None,
    ) -> tuple[List[NFLGame], Optional[int]]:
        """
        Get NFL games with optional filters.
        
        Args:
            seasons: Filter by seasons (e.g., [2024, 2025])
            weeks: Filter by weeks (e.g., [1, 2, 3])
            team_ids: Filter by team IDs
            dates: Filter by dates (YYYY-MM-DD)
            per_page: Results per page
            cursor: Pagination cursor
            
        Returns:
            Tuple of (games list, next cursor)
        """
        params: Dict[str, Any] = {"per_page": per_page}
        if seasons:
            params["seasons[]"] = seasons
        if weeks:
            params["weeks[]"] = weeks
        if team_ids:
            params["team_ids[]"] = team_ids
        if dates:
            params["dates[]"] = dates
        if cursor:
            params["cursor"] = cursor
        
        data = self._request("/games", params)
        games = [self._parse_game(g) for g in data.get("data", [])]
        next_cursor = data.get("meta", {}).get("next_cursor")
        
        logger.info(f"Fetched {len(games)} games")
        return games, next_cursor
    
    def get_games_by_week(self, season: int, week: int) -> List[NFLGame]:
        """Get all games for a specific week."""
        games, _ = self.get_games(seasons=[season], weeks=[week], per_page=100)
        return games
    
    def get_games_df(
        self,
        seasons: Optional[List[int]] = None,
        weeks: Optional[List[int]] = None,
    ) -> pl.DataFrame:
        """Get games as a Polars DataFrame."""
        all_games: List[NFLGame] = []
        cursor: Optional[int] = None
        
        while True:
            games, next_cursor = self.get_games(
                seasons=seasons,
                weeks=weeks,
                per_page=100,
                cursor=cursor,
            )
            all_games.extend(games)
            if not next_cursor:
                break
            cursor = next_cursor
        
        records = []
        for g in all_games:
            records.append({
                "id": g.id,
                "date": g.date,
                "season": g.season,
                "week": g.week,
                "status": g.status,
                "home_team_id": g.home_team.id,
                "home_team_abbr": g.home_team.abbreviation,
                "home_team_name": g.home_team.full_name,
                "visitor_team_id": g.visitor_team.id,
                "visitor_team_abbr": g.visitor_team.abbreviation,
                "visitor_team_name": g.visitor_team.full_name,
                "home_team_score": g.home_team_score,
                "visitor_team_score": g.visitor_team_score,
                "venue": g.venue,
                "time": g.time,
            })
        
        return pl.DataFrame(records)
    
    def get_game_by_id(self, game_id: int) -> Optional[NFLGame]:
        """Get a single game by ID."""
        data = self._request(f"/games/{game_id}")
        if "data" in data:
            return self._parse_game(data["data"])
        return None
    
    # ─────────────────────────────────────────────────────────────────────────
    # PLAYER STATS
    # ─────────────────────────────────────────────────────────────────────────
    
    def get_player_season_stats(
        self,
        season: int,
        player_ids: Optional[List[int]] = None,
        team_ids: Optional[List[int]] = None,
        per_page: int = 100,
    ) -> pl.DataFrame:
        """
        Get player season statistics.
        
        Args:
            season: NFL season year
            player_ids: Filter by player IDs
            team_ids: Filter by team IDs
            per_page: Results per page
            
        Returns:
            Polars DataFrame with player stats
        """
        params: Dict[str, Any] = {
            "season": season,
            "per_page": per_page,
        }
        if player_ids:
            params["player_ids[]"] = player_ids
        if team_ids:
            params["team_ids[]"] = team_ids
        
        data = self._request("/season_stats", params)
        stats = data.get("data", [])
        
        if not stats:
            return pl.DataFrame()
        
        return pl.DataFrame(stats)
    
    def get_player_game_stats(
        self,
        game_ids: Optional[List[int]] = None,
        player_ids: Optional[List[int]] = None,
        per_page: int = 100,
    ) -> pl.DataFrame:
        """
        Get player game-by-game statistics.
        
        Args:
            game_ids: Filter by game IDs
            player_ids: Filter by player IDs
            per_page: Results per page
            
        Returns:
            Polars DataFrame with player game stats
        """
        params: Dict[str, Any] = {"per_page": per_page}
        if game_ids:
            params["game_ids[]"] = game_ids
        if player_ids:
            params["player_ids[]"] = player_ids
        
        data = self._request("/stats", params)
        stats = data.get("data", [])
        
        if not stats:
            return pl.DataFrame()
        
        return pl.DataFrame(stats)
    
    # ─────────────────────────────────────────────────────────────────────────
    # STANDINGS
    # ─────────────────────────────────────────────────────────────────────────
    
    def get_standings(self, season: int) -> pl.DataFrame:
        """
        Get current standings for a season.
        
        Args:
            season: NFL season year
            
        Returns:
            Polars DataFrame with standings
        """
        data = self._request("/standings", {"season": season})
        standings = data.get("data", [])
        
        if not standings:
            return pl.DataFrame()
        
        records = []
        for s in standings:
            team = s.get("team", {})
            records.append({
                "team_id": team.get("id"),
                "team_abbreviation": team.get("abbreviation"),
                "team_name": team.get("full_name"),
                "conference": s.get("conference"),
                "division": s.get("division"),
                "wins": s.get("wins", 0),
                "losses": s.get("losses", 0),
                "ties": s.get("ties", 0),
                "win_pct": s.get("win_pct", 0),
                "points_for": s.get("points_for", 0),
                "points_against": s.get("points_against", 0),
                "point_differential": s.get("point_differential", 0),
                "division_wins": s.get("division_wins", 0),
                "division_losses": s.get("division_losses", 0),
                "conference_wins": s.get("conference_wins", 0),
                "conference_losses": s.get("conference_losses", 0),
                "home_wins": s.get("home_wins", 0),
                "home_losses": s.get("home_losses", 0),
                "away_wins": s.get("away_wins", 0),
                "away_losses": s.get("away_losses", 0),
                "streak": s.get("streak"),
            })
        
        return pl.DataFrame(records)
    
    def close(self):
        """Close the HTTP client."""
        self.client.close()


# ─────────────────────────────────────────────────────────────────────────────
# SINGLETON INSTANCE
# ─────────────────────────────────────────────────────────────────────────────

_connector: Optional[BallDontLieConnector] = None


def get_balldontlie() -> BallDontLieConnector:
    """Get the singleton BallDontLieConnector instance."""
    global _connector
    if _connector is None:
        _connector = BallDontLieConnector()
    return _connector
