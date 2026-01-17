"""
NFL Data Acquisition Engine - nflverse Integration
===================================================
Connects to the nflverse data repository for historical play-by-play data,
EPA metrics, CPOE, and advanced analytics.

Data Source: https://github.com/nflverse/nflverse-data
"""

import os
import logging
from typing import Optional, Literal
from pathlib import Path
from datetime import datetime

import polars as pl
import httpx

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# NFLVERSE DATA URLS
# ─────────────────────────────────────────────────────────────────────────────

NFLVERSE_BASE = "https://github.com/nflverse/nflverse-data/releases/download"

NFLVERSE_URLS = {
    # Play-by-play data (the holy grail)
    "pbp": f"{NFLVERSE_BASE}/pbp/play_by_play_{{season}}.parquet",
    
    # Player stats
    "player_stats": f"{NFLVERSE_BASE}/player_stats/player_stats_{{season}}.parquet",
    "player_stats_weekly": f"{NFLVERSE_BASE}/player_stats/player_stats.parquet",
    
    # Roster data
    "rosters": f"{NFLVERSE_BASE}/rosters/roster_{{season}}.parquet",
    "rosters_weekly": f"{NFLVERSE_BASE}/weekly_rosters/roster_weekly_{{season}}.parquet",
    
    # Schedule and games
    "schedules": f"{NFLVERSE_BASE}/schedules/schedules.parquet",
    
    # Next Gen Stats
    "ngs_passing": f"{NFLVERSE_BASE}/nextgen_stats/ngs_passing.parquet",
    "ngs_rushing": f"{NFLVERSE_BASE}/nextgen_stats/ngs_rushing.parquet",
    "ngs_receiving": f"{NFLVERSE_BASE}/nextgen_stats/ngs_receiving.parquet",
    
    # PFR (Pro Football Reference) data
    "pfr_passing": f"{NFLVERSE_BASE}/pfr_advstats/advstats_season_pass.parquet",
    "pfr_rushing": f"{NFLVERSE_BASE}/pfr_advstats/advstats_season_rush.parquet",
    "pfr_receiving": f"{NFLVERSE_BASE}/pfr_advstats/advstats_season_rec.parquet",
    "pfr_defense": f"{NFLVERSE_BASE}/pfr_advstats/advstats_season_def.parquet",
    
    # Injuries
    "injuries": f"{NFLVERSE_BASE}/injuries/injuries_{{season}}.parquet",
    
    # Combine data
    "combine": f"{NFLVERSE_BASE}/combine/combine.parquet",
    
    # Draft picks
    "draft_picks": f"{NFLVERSE_BASE}/draft_picks/draft_picks.parquet",
    
    # Teams
    "teams": f"{NFLVERSE_BASE}/teams/teams.parquet",
    
    # Contracts
    "contracts": f"{NFLVERSE_BASE}/contracts/contracts.parquet",
    
    # Snap counts
    "snap_counts": f"{NFLVERSE_BASE}/snap_counts/snap_counts_{{season}}.parquet",
    
    # QB EPA (aggregated)
    "qb_season": f"{NFLVERSE_BASE}/player_stats/player_stats.parquet",
}


class NFLVerseConnector:
    """
    Connector for nflverse data repository.
    Provides access to historical play-by-play data, EPA, CPOE, and advanced metrics.
    """
    
    def __init__(self, cache_dir: str = "python_engine/data/nflverse"):
        """
        Initialize the connector.
        
        Args:
            cache_dir: Directory to cache downloaded data
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.client = httpx.Client(timeout=120.0, follow_redirects=True)
        logger.info(f"NFLVerseConnector initialized with cache: {self.cache_dir}")
    
    def _get_cache_path(self, dataset: str, season: Optional[int] = None) -> Path:
        """Get the cache file path for a dataset."""
        if season:
            return self.cache_dir / f"{dataset}_{season}.parquet"
        return self.cache_dir / f"{dataset}.parquet"
    
    def _download_file(self, url: str, dest: Path) -> bool:
        """Download a file from URL to destination."""
        try:
            logger.info(f"Downloading: {url}")
            response = self.client.get(url)
            response.raise_for_status()
            dest.write_bytes(response.content)
            logger.info(f"Downloaded: {dest} ({len(response.content) / 1024 / 1024:.1f} MB)")
            return True
        except httpx.HTTPError as e:
            logger.error(f"Failed to download {url}: {e}")
            return False
    
    def fetch_play_by_play(
        self, 
        season: int,
        force_refresh: bool = False
    ) -> Optional[pl.DataFrame]:
        """
        Fetch play-by-play data for a season.
        
        This is the core dataset containing:
        - EPA (Expected Points Added) per play
        - WPA (Win Probability Added)
        - CPOE (Completion Percentage Over Expected)
        - Air yards, YAC
        - Success rate metrics
        - Down, distance, field position
        
        Args:
            season: NFL season year (e.g., 2024)
            force_refresh: Force re-download even if cached
            
        Returns:
            Polars DataFrame with play-by-play data
        """
        cache_path = self._get_cache_path("pbp", season)
        
        if cache_path.exists() and not force_refresh:
            logger.info(f"Loading cached PBP data for {season}")
            return pl.read_parquet(cache_path)
        
        url = NFLVERSE_URLS["pbp"].format(season=season)
        if self._download_file(url, cache_path):
            return pl.read_parquet(cache_path)
        return None
    
    def fetch_player_stats(
        self,
        season: Optional[int] = None,
        stat_type: Literal["passing", "rushing", "receiving"] = "passing",
        force_refresh: bool = False
    ) -> Optional[pl.DataFrame]:
        """
        Fetch aggregated player statistics.
        
        Args:
            season: NFL season year (None for all seasons)
            stat_type: Type of stats to filter
            force_refresh: Force re-download
            
        Returns:
            Polars DataFrame with player stats
        """
        if season:
            cache_path = self._get_cache_path("player_stats", season)
            url = NFLVERSE_URLS["player_stats"].format(season=season)
        else:
            cache_path = self._get_cache_path("player_stats_all")
            url = NFLVERSE_URLS["player_stats_weekly"]
        
        if cache_path.exists() and not force_refresh:
            df = pl.read_parquet(cache_path)
        else:
            if not self._download_file(url, cache_path):
                return None
            df = pl.read_parquet(cache_path)
        
        # Filter by position based on stat type
        position_map = {
            "passing": ["QB"],
            "rushing": ["RB", "FB", "QB"],
            "receiving": ["WR", "TE", "RB"],
        }
        
        if "position" in df.columns:
            return df.filter(pl.col("position").is_in(position_map.get(stat_type, [])))
        return df
    
    def fetch_next_gen_stats(
        self,
        stat_type: Literal["passing", "rushing", "receiving"] = "passing",
        force_refresh: bool = False
    ) -> Optional[pl.DataFrame]:
        """
        Fetch Next Gen Stats tracking data.
        
        Contains:
        - Separation, cushion metrics (receiving)
        - Time to throw, pressure metrics (passing)
        - Efficiency metrics (rushing)
        
        Args:
            stat_type: Type of NGS data
            force_refresh: Force re-download
            
        Returns:
            Polars DataFrame with NGS data
        """
        url_key = f"ngs_{stat_type}"
        cache_path = self._get_cache_path(url_key)
        
        if cache_path.exists() and not force_refresh:
            return pl.read_parquet(cache_path)
        
        url = NFLVERSE_URLS.get(url_key)
        if not url:
            logger.error(f"Unknown NGS stat type: {stat_type}")
            return None
        
        if self._download_file(url, cache_path):
            return pl.read_parquet(cache_path)
        return None
    
    def fetch_rosters(
        self,
        season: int,
        force_refresh: bool = False
    ) -> Optional[pl.DataFrame]:
        """
        Fetch roster data for a season.
        
        Args:
            season: NFL season year
            force_refresh: Force re-download
            
        Returns:
            Polars DataFrame with roster data
        """
        cache_path = self._get_cache_path("rosters", season)
        
        if cache_path.exists() and not force_refresh:
            return pl.read_parquet(cache_path)
        
        url = NFLVERSE_URLS["rosters"].format(season=season)
        if self._download_file(url, cache_path):
            return pl.read_parquet(cache_path)
        return None
    
    def fetch_schedules(self, force_refresh: bool = False) -> Optional[pl.DataFrame]:
        """
        Fetch full schedule data (all seasons).
        
        Returns:
            Polars DataFrame with schedule data
        """
        cache_path = self._get_cache_path("schedules")
        
        if cache_path.exists() and not force_refresh:
            return pl.read_parquet(cache_path)
        
        if self._download_file(NFLVERSE_URLS["schedules"], cache_path):
            return pl.read_parquet(cache_path)
        return None
    
    def fetch_injuries(
        self,
        season: int,
        force_refresh: bool = False
    ) -> Optional[pl.DataFrame]:
        """
        Fetch injury report data.
        
        Args:
            season: NFL season year
            force_refresh: Force re-download
            
        Returns:
            Polars DataFrame with injury data
        """
        cache_path = self._get_cache_path("injuries", season)
        
        if cache_path.exists() and not force_refresh:
            return pl.read_parquet(cache_path)
        
        url = NFLVERSE_URLS["injuries"].format(season=season)
        if self._download_file(url, cache_path):
            return pl.read_parquet(cache_path)
        return None
    
    def fetch_snap_counts(
        self,
        season: int,
        force_refresh: bool = False
    ) -> Optional[pl.DataFrame]:
        """
        Fetch snap count data.
        
        Args:
            season: NFL season year
            force_refresh: Force re-download
            
        Returns:
            Polars DataFrame with snap count data
        """
        cache_path = self._get_cache_path("snap_counts", season)
        
        if cache_path.exists() and not force_refresh:
            return pl.read_parquet(cache_path)
        
        url = NFLVERSE_URLS["snap_counts"].format(season=season)
        if self._download_file(url, cache_path):
            return pl.read_parquet(cache_path)
        return None
    
    def fetch_pfr_advanced(
        self,
        stat_type: Literal["passing", "rushing", "receiving", "defense"] = "passing",
        force_refresh: bool = False
    ) -> Optional[pl.DataFrame]:
        """
        Fetch Pro Football Reference advanced stats.
        
        Contains:
        - Pressure rate, blitz rate (passing)
        - Yards before/after contact (rushing)
        - Target share, air yards share (receiving)
        
        Args:
            stat_type: Type of advanced stats
            force_refresh: Force re-download
            
        Returns:
            Polars DataFrame with PFR advanced stats
        """
        url_key = f"pfr_{stat_type}"
        cache_path = self._get_cache_path(url_key)
        
        if cache_path.exists() and not force_refresh:
            return pl.read_parquet(cache_path)
        
        url = NFLVERSE_URLS.get(url_key)
        if not url:
            logger.error(f"Unknown PFR stat type: {stat_type}")
            return None
        
        if self._download_file(url, cache_path):
            return pl.read_parquet(cache_path)
        return None
    
    def fetch_teams(self, force_refresh: bool = False) -> Optional[pl.DataFrame]:
        """Fetch team data."""
        cache_path = self._get_cache_path("teams")
        
        if cache_path.exists() and not force_refresh:
            return pl.read_parquet(cache_path)
        
        if self._download_file(NFLVERSE_URLS["teams"], cache_path):
            return pl.read_parquet(cache_path)
        return None
    
    def close(self):
        """Close the HTTP client."""
        self.client.close()


# ─────────────────────────────────────────────────────────────────────────────
# EPA CALCULATIONS
# ─────────────────────────────────────────────────────────────────────────────

def calculate_team_epa(pbp_df: pl.DataFrame, season: int, week: Optional[int] = None) -> pl.DataFrame:
    """
    Calculate team-level EPA metrics from play-by-play data.
    
    Args:
        pbp_df: Play-by-play DataFrame
        season: Season to filter
        week: Optional week to filter (None for full season)
        
    Returns:
        DataFrame with team EPA metrics
    """
    # Filter data
    df = pbp_df.filter(pl.col("season") == season)
    if week:
        df = df.filter(pl.col("week") == week)
    
    # Calculate offensive EPA
    offense_epa = (
        df.filter(pl.col("play_type").is_in(["pass", "run"]))
        .group_by("posteam")
        .agg([
            pl.col("epa").mean().alias("epa_per_play"),
            pl.col("epa").filter(pl.col("play_type") == "pass").mean().alias("pass_epa"),
            pl.col("epa").filter(pl.col("play_type") == "run").mean().alias("rush_epa"),
            pl.col("success").mean().alias("success_rate"),
            pl.col("cpoe").mean().alias("cpoe"),
            pl.len().alias("total_plays"),
        ])
        .rename({"posteam": "team"})
    )
    
    # Calculate defensive EPA (allowed)
    defense_epa = (
        df.filter(pl.col("play_type").is_in(["pass", "run"]))
        .group_by("defteam")
        .agg([
            pl.col("epa").mean().alias("def_epa_allowed"),
            pl.col("epa").filter(pl.col("play_type") == "pass").mean().alias("def_pass_epa_allowed"),
            pl.col("epa").filter(pl.col("play_type") == "run").mean().alias("def_rush_epa_allowed"),
            pl.col("success").mean().alias("def_success_rate_allowed"),
        ])
        .rename({"defteam": "team"})
    )
    
    # Join offense and defense
    return offense_epa.join(defense_epa, on="team", how="outer")


def calculate_player_epa(
    pbp_df: pl.DataFrame, 
    season: int, 
    position_group: Literal["QB", "RB", "WR", "TE"] = "QB"
) -> pl.DataFrame:
    """
    Calculate player-level EPA metrics.
    
    Args:
        pbp_df: Play-by-play DataFrame
        season: Season to filter
        position_group: Position group to analyze
        
    Returns:
        DataFrame with player EPA metrics
    """
    df = pbp_df.filter(pl.col("season") == season)
    
    if position_group == "QB":
        return (
            df.filter(pl.col("play_type") == "pass")
            .group_by(["passer_player_id", "passer_player_name"])
            .agg([
                pl.col("epa").mean().alias("epa_per_dropback"),
                pl.col("cpoe").mean().alias("cpoe"),
                pl.col("air_yards").mean().alias("avg_air_yards"),
                pl.col("yards_after_catch").mean().alias("avg_yac"),
                pl.col("complete_pass").mean().alias("comp_pct"),
                pl.len().alias("attempts"),
                pl.col("epa").sum().alias("total_epa"),
            ])
            .filter(pl.col("attempts") >= 100)
            .sort("epa_per_dropback", descending=True)
        )
    
    elif position_group == "RB":
        return (
            df.filter(
                (pl.col("play_type") == "run") & 
                (pl.col("rusher_player_id").is_not_null())
            )
            .group_by(["rusher_player_id", "rusher_player_name"])
            .agg([
                pl.col("epa").mean().alias("epa_per_carry"),
                pl.col("rushing_yards").mean().alias("avg_yards"),
                pl.col("success").mean().alias("success_rate"),
                pl.len().alias("carries"),
                pl.col("epa").sum().alias("total_epa"),
            ])
            .filter(pl.col("carries") >= 50)
            .sort("epa_per_carry", descending=True)
        )
    
    else:  # WR/TE
        return (
            df.filter(
                (pl.col("play_type") == "pass") & 
                (pl.col("receiver_player_id").is_not_null())
            )
            .group_by(["receiver_player_id", "receiver_player_name"])
            .agg([
                pl.col("epa").mean().alias("epa_per_target"),
                pl.col("air_yards").mean().alias("avg_depth_of_target"),
                pl.col("yards_after_catch").mean().alias("avg_yac"),
                pl.col("complete_pass").mean().alias("catch_rate"),
                pl.len().alias("targets"),
                pl.col("epa").sum().alias("total_epa"),
            ])
            .filter(pl.col("targets") >= 30)
            .sort("epa_per_target", descending=True)
        )


# ─────────────────────────────────────────────────────────────────────────────
# SINGLETON INSTANCE
# ─────────────────────────────────────────────────────────────────────────────

_connector: Optional[NFLVerseConnector] = None

def get_nflverse() -> NFLVerseConnector:
    """Get the singleton NFLVerseConnector instance."""
    global _connector
    if _connector is None:
        _connector = NFLVerseConnector()
    return _connector
