"""NFL Stats Sources Configuration
Multi-source statistics aggregation from NFL.com, NextGenStats, ESPN, Fox Sports, CBS Sports
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
import requests
from enum import Enum

class StatCategory(Enum):
    OFFENSE = "offense"
    DEFENSE = "defense"
    SPECIAL_TEAMS = "special_teams"
    ADVANCED = "advanced"
    TURNOVERS = "turnovers"
    SCORING = "scoring"

@dataclass
class StatSource:
    name: str
    base_url: str
    category: StatCategory
    enabled: bool
    description: str

NFL_STATS_SOURCES: Dict[str, StatSource] = {
    # NFL.com Stats
    "NFL_PASSING": StatSource(
        name="NFL.com Passing",
        base_url="https://nfl.com/stats/player-stats/category/passing",
        category=StatCategory.OFFENSE,
        enabled=True,
        description="Official NFL passing statistics"
    ),
    "NFL_RUSHING": StatSource(
        name="NFL.com Rushing",
        base_url="https://nfl.com/stats/player-stats/category/rushing",
        category=StatCategory.OFFENSE,
        enabled=True,
        description="Official NFL rushing statistics"
    ),
    "NFL_RECEIVING": StatSource(
        name="NFL.com Receiving",
        base_url="https://nfl.com/stats/player-stats/category/receiving",
        category=StatCategory.OFFENSE,
        enabled=True,
        description="Official NFL receiving statistics"
    ),
    "NFL_FUMBLES": StatSource(
        name="NFL.com Fumbles",
        base_url="https://nfl.com/stats/player-stats/category/fumbles",
        category=StatCategory.TURNOVERS,
        enabled=True,
        description="Official NFL fumble statistics"
    ),
    "NFL_TACKLES": StatSource(
        name="NFL.com Tackles",
        base_url="https://nfl.com/stats/player-stats/category/tackles",
        category=StatCategory.DEFENSE,
        enabled=True,
        description="Official NFL tackle statistics"
    ),
    "NFL_INTERCEPTIONS": StatSource(
        name="NFL.com Interceptions",
        base_url="https://nfl.com/stats/player-stats/category/interceptions",
        category=StatCategory.DEFENSE,
        enabled=True,
        description="Official NFL interception statistics"
    ),
    "NFL_FIELD_GOALS": StatSource(
        name="NFL.com Field Goals",
        base_url="https://nfl.com/stats/player-stats/category/field-goals",
        category=StatCategory.SPECIAL_TEAMS,
        enabled=True,
        description="Official NFL field goal statistics"
    ),
    "NFL_KICKOFFS": StatSource(
        name="NFL.com Kickoffs",
        base_url="https://nfl.com/stats/player-stats/category/kickoffs",
        category=StatCategory.SPECIAL_TEAMS,
        enabled=True,
        description="Official NFL kickoff statistics"
    ),
    "NFL_KICKOFF_RETURNS": StatSource(
        name="NFL.com Kickoff Returns",
        base_url="https://nfl.com/stats/player-stats/category/kickoff-returns",
        category=StatCategory.SPECIAL_TEAMS,
        enabled=True,
        description="Official NFL kickoff return statistics"
    ),
    "NFL_PUNTING": StatSource(
        name="NFL.com Punting",
        base_url="https://nfl.com/stats/player-stats/category/punting",
        category=StatCategory.SPECIAL_TEAMS,
        enabled=True,
        description="Official NFL punting statistics"
    ),
    "NFL_PUNT_RETURNS": StatSource(
        name="NFL.com Punt Returns",
        base_url="https://nfl.com/stats/player-stats/category/punt-returns",
        category=StatCategory.SPECIAL_TEAMS,
        enabled=True,
        description="Official NFL punt return statistics"
    ),
    # NextGen Stats
    "NEXTGEN_PASSING": StatSource(
        name="NextGen Passing",
        base_url="https://nextgenstats.nfl.com/stats/passing",
        category=StatCategory.ADVANCED,
        enabled=True,
        description="NextGen Stats passing advanced metrics"
    ),
    "NEXTGEN_RUSHING": StatSource(
        name="NextGen Rushing",
        base_url="https://nextgenstats.nfl.com/stats/rushing",
        category=StatCategory.ADVANCED,
        enabled=True,
        description="NextGen Stats rushing advanced metrics"
    ),
    "NEXTGEN_RECEIVING": StatSource(
        name="NextGen Receiving",
        base_url="https://nextgenstats.nfl.com/stats/receiving",
        category=StatCategory.ADVANCED,
        enabled=True,
        description="NextGen Stats receiving advanced metrics"
    ),
    "NEXTGEN_FASTEST_BALL_CARRIERS": StatSource(
        name="NextGen Fastest Ball Carriers",
        base_url="https://nextgenstats.nfl.com/stats/top-plays/fastest-ball-carriers",
        category=StatCategory.ADVANCED,
        enabled=True,
        description="Top plays - fastest ball carriers"
    ),
    "NEXTGEN_LONGEST_RUSH": StatSource(
        name="NextGen Longest Rush",
        base_url="https://nextgenstats.nfl.com/stats/top-plays/longest-rush",
        category=StatCategory.ADVANCED,
        enabled=True,
        description="Top plays - longest rushes"
    ),
    "NEXTGEN_LONGEST_PASS": StatSource(
        name="NextGen Longest Pass",
        base_url="https://nextgenstats.nfl.com/stats/top-plays/longest-pass",
        category=StatCategory.ADVANCED,
        enabled=True,
        description="Top plays - longest passes"
    ),
    # ESPN Stats
    "ESPN_PASSING": StatSource(
        name="ESPN Passing",
        base_url="https://espn.com/nfl/stats/player/_/stat/passing",
        category=StatCategory.OFFENSE,
        enabled=True,
        description="ESPN passing statistics"
    ),
    "ESPN_RUSHING": StatSource(
        name="ESPN Rushing",
        base_url="https://espn.com/nfl/stats/player/_/stat/rushing",
        category=StatCategory.OFFENSE,
        enabled=True,
        description="ESPN rushing statistics"
    ),
    "ESPN_RECEIVING": StatSource(
        name="ESPN Receiving",
        base_url="https://espn.com/nfl/stats/player/_/stat/receiving",
        category=StatCategory.OFFENSE,
        enabled=True,
        description="ESPN receiving statistics"
    ),
    "ESPN_DEFENSE": StatSource(
        name="ESPN Defense",
        base_url="https://espn.com/nfl/stats/player/_/stat/defense",
        category=StatCategory.DEFENSE,
        enabled=True,
        description="ESPN defensive statistics"
    ),
    "ESPN_SCORING": StatSource(
        name="ESPN Scoring",
        base_url="https://espn.com/nfl/stats/player/_/stat/scoring",
        category=StatCategory.SCORING,
        enabled=True,
        description="ESPN scoring statistics"
    ),
    "ESPN_RETURNING": StatSource(
        name="ESPN Returning",
        base_url="https://espn.com/nfl/stats/player/_/stat/returning",
        category=StatCategory.SPECIAL_TEAMS,
        enabled=True,
        description="ESPN return statistics"
    ),
    "ESPN_KICKING": StatSource(
        name="ESPN Kicking",
        base_url="https://espn.com/nfl/stats/player/_/stat/kicking",
        category=StatCategory.SPECIAL_TEAMS,
        enabled=True,
        description="ESPN kicking statistics"
    ),
    "ESPN_PUNTING": StatSource(
        name="ESPN Punting",
        base_url="https://espn.com/nfl/stats/player/_/stat/punting",
        category=StatCategory.SPECIAL_TEAMS,
        enabled=True,
        description="ESPN punting statistics"
    ),
    # Fox Sports Stats
    "FOX_PASSING": StatSource(
        name="Fox Sports Passing",
        base_url="https://foxsports.com/nfl/stats?category=passing",
        category=StatCategory.OFFENSE,
        enabled=True,
        description="Fox Sports passing statistics"
    ),
    "FOX_RUSHING": StatSource(
        name="Fox Sports Rushing",
        base_url="https://foxsports.com/nfl/stats?category=rushing",
        category=StatCategory.OFFENSE,
        enabled=True,
        description="Fox Sports rushing statistics"
    ),
    "FOX_RECEIVING": StatSource(
        name="Fox Sports Receiving",
        base_url="https://foxsports.com/nfl/stats?category=receiving",
        category=StatCategory.OFFENSE,
        enabled=True,
        description="Fox Sports receiving statistics"
    ),
    "FOX_DEFENSE": StatSource(
        name="Fox Sports Defense",
        base_url="https://foxsports.com/nfl/stats?category=defense",
        category=StatCategory.DEFENSE,
        enabled=True,
        description="Fox Sports defensive statistics"
    ),
    "FOX_KICKING": StatSource(
        name="Fox Sports Kicking",
        base_url="https://foxsports.com/nfl/stats?category=kicking",
        category=StatCategory.SPECIAL_TEAMS,
        enabled=True,
        description="Fox Sports kicking statistics"
    ),
    "FOX_PUNTING": StatSource(
        name="Fox Sports Punting",
        base_url="https://foxsports.com/nfl/stats?category=punting",
        category=StatCategory.SPECIAL_TEAMS,
        enabled=True,
        description="Fox Sports punting statistics"
    ),
    "FOX_RETURNING": StatSource(
        name="Fox Sports Returning",
        base_url="https://foxsports.com/nfl/stats?category=returning",
        category=StatCategory.SPECIAL_TEAMS,
        enabled=True,
        description="Fox Sports return statistics"
    ),
    # CBS Sports Stats
    "CBS_PASSING": StatSource(
        name="CBS Sports Passing",
        base_url="https://cbssports.com/nfl/stats/player/passing",
        category=StatCategory.OFFENSE,
        enabled=True,
        description="CBS Sports passing statistics"
    ),
    "CBS_RUSHING": StatSource(
        name="CBS Sports Rushing",
        base_url="https://cbssports.com/nfl/stats/player/rushing",
        category=StatCategory.OFFENSE,
        enabled=True,
        description="CBS Sports rushing statistics"
    ),
    "CBS_RECEIVING": StatSource(
        name="CBS Sports Receiving",
        base_url="https://cbssports.com/nfl/stats/player/receiving",
        category=StatCategory.OFFENSE,
        enabled=True,
        description="CBS Sports receiving statistics"
    ),
    "CBS_DEFENSE": StatSource(
        name="CBS Sports Defense",
        base_url="https://cbssports.com/nfl/stats/player/defense",
        category=StatCategory.DEFENSE,
        enabled=True,
        description="CBS Sports defensive statistics"
    ),
    "CBS_KICKING": StatSource(
        name="CBS Sports Kicking",
        base_url="https://cbssports.com/nfl/stats/player/kicking",
        category=StatCategory.SPECIAL_TEAMS,
        enabled=True,
        description="CBS Sports kicking statistics"
    ),
    "CBS_PUNTING": StatSource(
        name="CBS Sports Punting",
        base_url="https://cbssports.com/nfl/stats/player/punting",
        category=StatCategory.SPECIAL_TEAMS,
        enabled=True,
        description="CBS Sports punting statistics"
    ),
    "CBS_PUNT_RETURNS": StatSource(
        name="CBS Sports Punt Returns",
        base_url="https://cbssports.com/nfl/stats/player/punt-returns",
        category=StatCategory.SPECIAL_TEAMS,
        enabled=True,
        description="CBS Sports punt return statistics"
    ),
    "CBS_KICK_RETURNS": StatSource(
        name="CBS Sports Kick Returns",
        base_url="https://cbssports.com/nfl/stats/player/kick-returns",
        category=StatCategory.SPECIAL_TEAMS,
        enabled=True,
        description="CBS Sports kick return statistics"
    ),
}

def get_stat_sources_by_category(category: StatCategory) -> List[StatSource]:
    """Get all enabled stat sources for a given category."""
    return [
        source for source in NFL_STATS_SOURCES.values()
        if source.category == category and source.enabled
    ]

def get_enabled_stat_sources() -> List[StatSource]:
    """Get all enabled stat sources."""
    return [source for source in NFL_STATS_SOURCES.values() if source.enabled]

def get_stat_source_url(source_key: str) -> Optional[str]:
    """Get URL for a stat source key."""
    source = NFL_STATS_SOURCES.get(source_key)
    if source and source.enabled:
        return source.base_url
    return None

async def fetch_stat_source(source_key: str, filters: Optional[Dict[str, str]] = None):
    """Fetch data from a stat source."""
    source = NFL_STATS_SOURCES.get(source_key)
    if not source or not source.enabled:
        raise ValueError(f"Stat source {source_key} is not enabled")

    params = filters or {}
    try:
        response = requests.get(source.base_url, params=params, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching stats from {source.name}: {e}")
        raise
