"""
NFL Unified Data Engine - God Tier Integration
===============================================
Combines nflverse (historical analytics) with BallDontLie (real-time data)
into a single, cohesive data pipeline.

This is the master orchestrator for all NFL data acquisition.
"""

import os
import logging
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime, timedelta
from pathlib import Path
from dataclasses import dataclass, field

import polars as pl

from .nflverse_connector import NFLVerseConnector, get_nflverse, calculate_team_epa, calculate_player_epa
from .balldontlie_connector import BallDontLieConnector, get_balldontlie, NFLTeam, NFLGame, NFLPlayer

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# DATA VECTOR DEFINITIONS
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class VectorConfig:
    """Configuration for a data vector."""
    name: str
    description: str
    sources: List[str]
    refresh_interval_hours: int
    priority: int  # 1 = highest


VECTOR_CONFIGS = {
    "physics": VectorConfig(
        name="Physics (Next Gen Stats)",
        description="XY tracking, separation, cushion, time to throw, completion probability",
        sources=["nflverse_ngs"],
        refresh_interval_hours=24,
        priority=1,
    ),
    "schematic": VectorConfig(
        name="Schematic (Play-Calling DNA)",
        description="Personnel groupings, formations, motion rates, coverage shells",
        sources=["nflverse_pbp"],
        refresh_interval_hours=24,
        priority=2,
    ),
    "efficiency": VectorConfig(
        name="Efficiency (Advanced Metrics)",
        description="EPA, CPOE, DVOA, Success Rate, Air Yards, YAC",
        sources=["nflverse_pbp", "nflverse_player_stats"],
        refresh_interval_hours=12,
        priority=1,
    ),
    "trench": VectorConfig(
        name="Trench (OL/DL Warfare)",
        description="PBWR, PRWR, Double Team Rate, Run Block Grade",
        sources=["nflverse_pfr"],
        refresh_interval_hours=24,
        priority=2,
    ),
    "context": VectorConfig(
        name="Context (Invisible Variables)",
        description="Referee tendencies, weather, surface, rest differential",
        sources=["nflverse_schedules", "external_weather"],
        refresh_interval_hours=6,
        priority=2,
    ),
    "market": VectorConfig(
        name="Market (Game Theory)",
        description="Opening/closing lines, ticket %, money %, implied totals",
        sources=["external_odds"],
        refresh_interval_hours=1,
        priority=1,
    ),
    "realtime": VectorConfig(
        name="Real-Time (Live Data)",
        description="Current games, scores, rosters, injuries",
        sources=["balldontlie"],
        refresh_interval_hours=0,  # Always fresh
        priority=1,
    ),
}


@dataclass
class TeamAnalytics:
    """Comprehensive team analytics combining all vectors."""
    team_id: int
    team_abbr: str
    team_name: str
    season: int
    week: Optional[int] = None
    
    # Efficiency metrics (Vector 3)
    epa_per_play: float = 0.0
    pass_epa: float = 0.0
    rush_epa: float = 0.0
    def_epa_allowed: float = 0.0
    success_rate: float = 0.0
    cpoe: float = 0.0
    
    # Trench metrics (Vector 4)
    pass_block_win_rate: Optional[float] = None
    pass_rush_win_rate: Optional[float] = None
    
    # Context (Vector 5)
    rest_days: int = 7
    is_home: bool = False
    
    # Record
    wins: int = 0
    losses: int = 0
    point_differential: int = 0


@dataclass
class PlayerAnalytics:
    """Comprehensive player analytics."""
    player_id: int
    player_name: str
    team_abbr: str
    position: str
    season: int
    
    # Efficiency metrics
    epa_per_play: float = 0.0
    total_epa: float = 0.0
    
    # Position-specific
    cpoe: Optional[float] = None  # QB only
    yards_per_attempt: Optional[float] = None
    success_rate: Optional[float] = None
    
    # Usage
    snap_percentage: Optional[float] = None
    target_share: Optional[float] = None
    carry_share: Optional[float] = None


@dataclass
class GameAnalytics:
    """Comprehensive game analytics for prediction."""
    game_id: int
    season: int
    week: int
    home_team: TeamAnalytics
    away_team: TeamAnalytics
    
    # Predictions
    predicted_spread: Optional[float] = None
    predicted_total: Optional[float] = None
    home_win_probability: Optional[float] = None
    
    # Market data
    current_spread: Optional[float] = None
    current_total: Optional[float] = None
    spread_edge: Optional[float] = None
    total_edge: Optional[float] = None
    
    # Context
    weather: Optional[Dict[str, Any]] = None
    referee_crew: Optional[str] = None


class UnifiedDataEngine:
    """
    The God Tier data engine that unifies all NFL data sources.
    
    Combines:
    - nflverse: Historical play-by-play, EPA, CPOE, Next Gen Stats
    - BallDontLie: Real-time games, teams, players, standings
    
    Provides a single interface for all data needs.
    """
    
    def __init__(self, cache_dir: str = "python_engine/data"):
        """
        Initialize the unified data engine.
        
        Args:
            cache_dir: Directory for cached data
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize connectors
        self.nflverse = get_nflverse()
        self.balldontlie = get_balldontlie()
        
        # Cache for computed analytics
        self._team_analytics_cache: Dict[str, TeamAnalytics] = {}
        self._pbp_cache: Dict[int, pl.DataFrame] = {}
        
        logger.info("UnifiedDataEngine initialized")
    
    # ─────────────────────────────────────────────────────────────────────────
    # REAL-TIME DATA (BallDontLie)
    # ─────────────────────────────────────────────────────────────────────────
    
    def get_current_week_games(self, season: int, week: int) -> List[NFLGame]:
        """Get games for the current week."""
        return self.balldontlie.get_games_by_week(season, week)
    
    def get_teams(self) -> List[NFLTeam]:
        """Get all NFL teams."""
        return self.balldontlie.get_teams()
    
    def get_team_roster(self, team_id: int) -> pl.DataFrame:
        """Get current roster for a team."""
        return self.balldontlie.get_players_df(team_ids=[team_id])
    
    def get_standings(self, season: int) -> pl.DataFrame:
        """Get current standings."""
        return self.balldontlie.get_standings(season)
    
    def search_player(self, query: str) -> List[NFLPlayer]:
        """Search for a player by name."""
        return self.balldontlie.search_players(query)
    
    # ─────────────────────────────────────────────────────────────────────────
    # HISTORICAL DATA (nflverse)
    # ─────────────────────────────────────────────────────────────────────────
    
    def get_play_by_play(self, season: int, force_refresh: bool = False) -> Optional[pl.DataFrame]:
        """
        Get play-by-play data for a season.
        
        This is the core dataset for EPA, CPOE, and advanced metrics.
        """
        if season in self._pbp_cache and not force_refresh:
            return self._pbp_cache[season]
        
        pbp = self.nflverse.fetch_play_by_play(season, force_refresh)
        if pbp is not None:
            self._pbp_cache[season] = pbp
        return pbp
    
    def get_next_gen_stats(
        self, 
        stat_type: Literal["passing", "rushing", "receiving"] = "passing"
    ) -> Optional[pl.DataFrame]:
        """Get Next Gen Stats tracking data."""
        return self.nflverse.fetch_next_gen_stats(stat_type)
    
    def get_pfr_advanced_stats(
        self,
        stat_type: Literal["passing", "rushing", "receiving", "defense"] = "passing"
    ) -> Optional[pl.DataFrame]:
        """Get Pro Football Reference advanced stats."""
        return self.nflverse.fetch_pfr_advanced(stat_type)
    
    def get_injuries(self, season: int) -> Optional[pl.DataFrame]:
        """Get injury report data."""
        return self.nflverse.fetch_injuries(season)
    
    def get_snap_counts(self, season: int) -> Optional[pl.DataFrame]:
        """Get snap count data."""
        return self.nflverse.fetch_snap_counts(season)
    
    # ─────────────────────────────────────────────────────────────────────────
    # UNIFIED ANALYTICS
    # ─────────────────────────────────────────────────────────────────────────
    
    def build_team_analytics(
        self,
        team_abbr: str,
        season: int,
        week: Optional[int] = None,
        force_refresh: bool = False,
    ) -> Optional[TeamAnalytics]:
        """
        Build comprehensive team analytics combining all vectors.
        
        Args:
            team_abbr: Team abbreviation (e.g., 'KC')
            season: NFL season year
            week: Optional week (None for season totals)
            force_refresh: Bypass cache
            
        Returns:
            TeamAnalytics object with all metrics
        """
        cache_key = f"{team_abbr}_{season}_{week or 'full'}"
        
        if cache_key in self._team_analytics_cache and not force_refresh:
            return self._team_analytics_cache[cache_key]
        
        # Get team info from BallDontLie
        team = self.balldontlie.get_team_by_abbreviation(team_abbr)
        if not team:
            logger.error(f"Team not found: {team_abbr}")
            return None
        
        # Get play-by-play for EPA calculations
        pbp = self.get_play_by_play(season)
        if pbp is None:
            logger.warning(f"No PBP data for {season}")
            # Return basic analytics without EPA
            analytics = TeamAnalytics(
                team_id=team.id,
                team_abbr=team.abbreviation,
                team_name=team.full_name,
                season=season,
                week=week,
            )
        else:
            # Calculate EPA metrics
            team_epa = calculate_team_epa(pbp, season, week)
            team_row = team_epa.filter(pl.col("team") == team_abbr)
            
            if team_row.height == 0:
                logger.warning(f"No EPA data for {team_abbr} in {season}")
                analytics = TeamAnalytics(
                    team_id=team.id,
                    team_abbr=team.abbreviation,
                    team_name=team.full_name,
                    season=season,
                    week=week,
                )
            else:
                row = team_row.row(0, named=True)
                analytics = TeamAnalytics(
                    team_id=team.id,
                    team_abbr=team.abbreviation,
                    team_name=team.full_name,
                    season=season,
                    week=week,
                    epa_per_play=row.get("epa_per_play", 0.0) or 0.0,
                    pass_epa=row.get("pass_epa", 0.0) or 0.0,
                    rush_epa=row.get("rush_epa", 0.0) or 0.0,
                    def_epa_allowed=row.get("def_epa_allowed", 0.0) or 0.0,
                    success_rate=row.get("success_rate", 0.0) or 0.0,
                    cpoe=row.get("cpoe", 0.0) or 0.0,
                )
        
        # Add standings data
        standings = self.get_standings(season)
        if standings.height > 0:
            team_standing = standings.filter(pl.col("team_abbreviation") == team_abbr)
            if team_standing.height > 0:
                row = team_standing.row(0, named=True)
                analytics.wins = row.get("wins", 0) or 0
                analytics.losses = row.get("losses", 0) or 0
                analytics.point_differential = row.get("point_differential", 0) or 0
        
        self._team_analytics_cache[cache_key] = analytics
        return analytics
    
    def build_game_analytics(
        self,
        game_id: int,
        season: int,
        week: int,
    ) -> Optional[GameAnalytics]:
        """
        Build comprehensive game analytics for prediction.
        
        Args:
            game_id: BallDontLie game ID
            season: NFL season year
            week: Week number
            
        Returns:
            GameAnalytics object with team comparisons and predictions
        """
        # Get game info
        game = self.balldontlie.get_game_by_id(game_id)
        if not game:
            logger.error(f"Game not found: {game_id}")
            return None
        
        # Build team analytics for both teams
        home_analytics = self.build_team_analytics(
            game.home_team.abbreviation, season, week
        )
        away_analytics = self.build_team_analytics(
            game.visitor_team.abbreviation, season, week
        )
        
        if not home_analytics or not away_analytics:
            return None
        
        home_analytics.is_home = True
        
        # Calculate predictions based on EPA differential
        epa_diff = home_analytics.epa_per_play - away_analytics.epa_per_play
        home_advantage = 2.5  # Points for home field
        
        predicted_spread = -(epa_diff * 14 + home_advantage)  # Rough conversion
        predicted_total = 45 + (home_analytics.epa_per_play + away_analytics.epa_per_play) * 20
        
        # Win probability using logistic function
        import math
        home_win_prob = 1 / (1 + math.exp(-predicted_spread / 3.5))
        
        return GameAnalytics(
            game_id=game_id,
            season=season,
            week=week,
            home_team=home_analytics,
            away_team=away_analytics,
            predicted_spread=round(predicted_spread, 1),
            predicted_total=round(predicted_total, 1),
            home_win_probability=round(home_win_prob * 100, 1),
        )
    
    def build_player_analytics(
        self,
        player_name: str,
        season: int,
        position_group: Literal["QB", "RB", "WR", "TE"] = "QB",
    ) -> Optional[PlayerAnalytics]:
        """
        Build comprehensive player analytics.
        
        Args:
            player_name: Player name to search
            season: NFL season year
            position_group: Position group
            
        Returns:
            PlayerAnalytics object
        """
        # Search for player
        players = self.search_player(player_name)
        if not players:
            logger.warning(f"Player not found: {player_name}")
            return None
        
        player = players[0]
        
        # Get EPA data
        pbp = self.get_play_by_play(season)
        if pbp is None:
            return PlayerAnalytics(
                player_id=player.id,
                player_name=f"{player.first_name} {player.last_name}",
                team_abbr=player.team.abbreviation if player.team else "",
                position=player.position,
                season=season,
            )
        
        player_epa = calculate_player_epa(pbp, season, position_group)
        
        # Find this player in the EPA data
        player_row = player_epa.filter(
            pl.col(f"{position_group.lower()}_player_name".replace("qb", "passer").replace("rb", "rusher").replace("wr", "receiver").replace("te", "receiver"))
            .str.contains(player.last_name)
        )
        
        if player_row.height == 0:
            return PlayerAnalytics(
                player_id=player.id,
                player_name=f"{player.first_name} {player.last_name}",
                team_abbr=player.team.abbreviation if player.team else "",
                position=player.position,
                season=season,
            )
        
        row = player_row.row(0, named=True)
        
        return PlayerAnalytics(
            player_id=player.id,
            player_name=f"{player.first_name} {player.last_name}",
            team_abbr=player.team.abbreviation if player.team else "",
            position=player.position,
            season=season,
            epa_per_play=row.get("epa_per_dropback", row.get("epa_per_carry", row.get("epa_per_target", 0.0))) or 0.0,
            total_epa=row.get("total_epa", 0.0) or 0.0,
            cpoe=row.get("cpoe") if position_group == "QB" else None,
        )
    
    # ─────────────────────────────────────────────────────────────────────────
    # BULK DATA OPERATIONS
    # ─────────────────────────────────────────────────────────────────────────
    
    def fetch_historical_data(
        self,
        start_season: int = 2020,
        end_season: int = 2025,
    ) -> Dict[str, bool]:
        """
        Fetch and cache historical data for multiple seasons.
        
        Args:
            start_season: First season to fetch
            end_season: Last season to fetch
            
        Returns:
            Dict mapping season to success status
        """
        results = {}
        
        for season in range(start_season, end_season + 1):
            logger.info(f"Fetching historical data for {season}...")
            
            try:
                # Play-by-play (most important)
                pbp = self.get_play_by_play(season)
                results[f"{season}_pbp"] = pbp is not None
                
                # Injuries
                injuries = self.get_injuries(season)
                results[f"{season}_injuries"] = injuries is not None
                
                # Snap counts
                snaps = self.get_snap_counts(season)
                results[f"{season}_snaps"] = snaps is not None
                
            except Exception as e:
                logger.error(f"Error fetching {season}: {e}")
                results[f"{season}_error"] = str(e)
        
        # Fetch non-season-specific data
        for stat_type in ["passing", "rushing", "receiving"]:
            ngs = self.get_next_gen_stats(stat_type)
            results[f"ngs_{stat_type}"] = ngs is not None
        
        for stat_type in ["passing", "rushing", "receiving", "defense"]:
            pfr = self.get_pfr_advanced_stats(stat_type)
            results[f"pfr_{stat_type}"] = pfr is not None
        
        logger.info(f"Historical data fetch complete: {sum(1 for v in results.values() if v is True)}/{len(results)} successful")
        return results
    
    def get_week_preview(self, season: int, week: int) -> List[GameAnalytics]:
        """
        Generate analytics for all games in a week.
        
        Args:
            season: NFL season year
            week: Week number
            
        Returns:
            List of GameAnalytics for each game
        """
        games = self.get_current_week_games(season, week)
        previews = []
        
        for game in games:
            analytics = self.build_game_analytics(game.id, season, week)
            if analytics:
                previews.append(analytics)
        
        return previews
    
    def close(self):
        """Clean up resources."""
        self.nflverse.close()
        self.balldontlie.close()


# ─────────────────────────────────────────────────────────────────────────────
# SINGLETON INSTANCE
# ─────────────────────────────────────────────────────────────────────────────

_engine: Optional[UnifiedDataEngine] = None


def get_data_engine() -> UnifiedDataEngine:
    """Get the singleton UnifiedDataEngine instance."""
    global _engine
    if _engine is None:
        _engine = UnifiedDataEngine()
    return _engine
