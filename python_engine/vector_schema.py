"""
NFL Data Vector Schema Definitions
==================================
Database schema for storing all 6 data vectors in PostgreSQL.
These tables form the foundation of the God Tier analytics engine.
"""

from typing import Optional, List
from datetime import datetime
from dataclasses import dataclass

# ─────────────────────────────────────────────────────────────────────────────
# VECTOR 1: PHYSICS (Next Gen Stats)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class PhysicsPassingPlay:
    """Next Gen Stats for a passing play."""
    play_id: str
    game_id: int
    season: int
    week: int
    
    # Timing
    time_to_throw: float  # Seconds from snap to release
    time_in_pocket: float
    time_to_pressure: Optional[float]
    
    # Target metrics
    air_yards: float
    air_yards_differential: float  # vs expected
    completion_probability: float  # 0-100
    
    # Receiver metrics
    separation: float  # Yards from nearest defender at target
    cushion: float  # Yards between WR and DB at snap
    
    # QB metrics
    aggressiveness: float  # % of passes into tight windows
    max_air_distance: float


@dataclass
class PhysicsRushingPlay:
    """Next Gen Stats for a rushing play."""
    play_id: str
    game_id: int
    season: int
    week: int
    
    # Speed metrics
    rush_yards: float
    yards_after_contact: float
    time_behind_los: float  # Seconds behind line of scrimmage
    
    # Efficiency
    efficiency: float  # Yards over expected
    
    # Blocking
    eight_plus_defenders: bool  # Stacked box


@dataclass
class PhysicsReceivingPlay:
    """Next Gen Stats for receiving."""
    play_id: str
    game_id: int
    season: int
    week: int
    
    target_id: str
    receiver_id: str
    
    # Route metrics
    cushion: float
    separation: float
    intended_air_yards: float
    
    # Catch metrics
    catch_probability: float
    yards_after_catch: float
    yac_over_expected: float


# ─────────────────────────────────────────────────────────────────────────────
# VECTOR 2: SCHEMATIC (Play-Calling DNA)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class TeamPersonnelTendencies:
    """Personnel grouping frequencies for a team."""
    team_id: int
    season: int
    week: Optional[int]
    
    # Offensive personnel (11 = 1RB 1TE, 12 = 1RB 2TE, etc.)
    personnel_11_rate: float
    personnel_12_rate: float
    personnel_13_rate: float
    personnel_21_rate: float
    personnel_22_rate: float
    
    # Formation tendencies
    shotgun_rate: float
    under_center_rate: float
    empty_backfield_rate: float
    
    # Motion tendencies
    motion_at_snap_rate: float
    pre_snap_motion_rate: float
    
    total_plays: int


@dataclass
class TeamCoverageTendencies:
    """Defensive coverage shell frequencies."""
    team_id: int
    season: int
    week: Optional[int]
    
    # Coverage rates
    cover_0_rate: float  # No deep safety
    cover_1_rate: float  # Man with single high
    cover_2_rate: float  # Two deep
    cover_3_rate: float  # Three deep
    cover_4_rate: float  # Quarters
    cover_6_rate: float  # Quarter-quarter-half
    
    # Blitz tendencies
    blitz_rate: float
    pressure_rate: float
    disguised_coverage_rate: float
    
    total_snaps: int


@dataclass
class TeamRunConcepts:
    """Run scheme tendencies."""
    team_id: int
    season: int
    week: Optional[int]
    
    # Zone schemes
    inside_zone_rate: float
    outside_zone_rate: float
    
    # Gap schemes
    power_rate: float
    counter_rate: float
    
    # Other
    draw_rate: float
    screen_rate: float
    
    zone_epa: float
    gap_epa: float


# ─────────────────────────────────────────────────────────────────────────────
# VECTOR 3: EFFICIENCY (Advanced Metrics)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class TeamEfficiency:
    """Team-level efficiency metrics."""
    team_id: int
    season: int
    week: Optional[int]
    
    # EPA metrics
    epa_per_play: float
    pass_epa_per_play: float
    rush_epa_per_play: float
    
    # Defensive EPA (allowed)
    def_epa_per_play: float
    def_pass_epa_per_play: float
    def_rush_epa_per_play: float
    
    # Success rate
    success_rate: float
    def_success_rate_allowed: float
    
    # CPOE (team passing)
    cpoe: float
    
    # DVOA (if available)
    total_dvoa: Optional[float]
    pass_dvoa: Optional[float]
    rush_dvoa: Optional[float]
    
    # Air yards
    intended_air_yards_per_attempt: float
    completed_air_yards_per_attempt: float
    
    # YAC
    yac_per_completion: float
    yac_over_expected: float


@dataclass
class PlayerEfficiency:
    """Player-level efficiency metrics."""
    player_id: int
    season: int
    week: Optional[int]
    position: str
    
    # EPA
    epa_per_play: float
    total_epa: float
    
    # QB-specific
    cpoe: Optional[float]
    air_yards_per_attempt: Optional[float]
    
    # RB-specific
    yards_per_carry: Optional[float]
    yards_after_contact: Optional[float]
    
    # WR/TE-specific
    yards_per_target: Optional[float]
    yac_per_reception: Optional[float]
    target_share: Optional[float]
    
    # Usage
    snap_percentage: float
    opportunity_share: float


# ─────────────────────────────────────────────────────────────────────────────
# VECTOR 4: TRENCH (OL/DL Warfare)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class OLineMetrics:
    """Offensive line metrics."""
    team_id: int
    season: int
    week: Optional[int]
    
    # Pass blocking
    pass_block_win_rate: float  # % blocks held > 2.5 seconds
    pressure_rate_allowed: float
    sacks_allowed: int
    
    # Run blocking
    run_block_grade: float
    yards_before_contact_per_carry: float
    
    # Individual (aggregated)
    avg_pff_pass_block_grade: Optional[float]
    avg_pff_run_block_grade: Optional[float]


@dataclass
class DLineMetrics:
    """Defensive line metrics."""
    team_id: int
    season: int
    week: Optional[int]
    
    # Pass rush
    pass_rush_win_rate: float  # % beats block < 2.5 seconds
    pressure_rate: float
    sacks: int
    
    # Run defense
    run_stop_rate: float
    tackles_for_loss: int
    
    # Disruption
    double_team_rate: float  # % of snaps commanding double teams
    
    # Individual (aggregated)
    avg_pff_pass_rush_grade: Optional[float]
    avg_pff_run_defense_grade: Optional[float]


# ─────────────────────────────────────────────────────────────────────────────
# VECTOR 5: CONTEXT (Invisible Variables)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class RefereeCrew:
    """Referee crew tendencies."""
    crew_id: str
    referee_name: str
    season: int
    
    # Penalty tendencies
    penalties_per_game: float
    holding_calls_per_game: float
    pass_interference_calls_per_game: float
    
    # Bias metrics
    home_team_penalty_rate: float
    away_team_penalty_rate: float
    home_bias_percentage: float  # (home_calls - away_calls) / total
    
    games_officiated: int


@dataclass
class GameWeather:
    """Weather conditions for a game."""
    game_id: int
    venue: str
    
    # Temperature
    temperature: float  # Fahrenheit
    feels_like: float
    
    # Wind
    wind_speed: float  # MPH
    wind_direction: str  # N, NE, E, etc.
    wind_gust: Optional[float]
    
    # Precipitation
    precipitation_type: Optional[str]  # Rain, Snow, None
    precipitation_probability: float
    
    # Other
    humidity: float
    visibility: float
    is_dome: bool


@dataclass
class GameContext:
    """Contextual factors for a game."""
    game_id: int
    season: int
    week: int
    
    # Rest
    home_rest_days: int
    away_rest_days: int
    rest_advantage: int  # home - away
    
    # Travel
    away_travel_distance: float  # Miles
    away_timezone_change: int  # Hours
    
    # Surface
    surface: str  # Grass, Turf
    
    # Referee
    referee_crew_id: Optional[str]
    
    # Primetime
    is_primetime: bool
    is_divisional: bool


# ─────────────────────────────────────────────────────────────────────────────
# VECTOR 6: MARKET (Game Theory)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class LineMovement:
    """Betting line movement tracking."""
    game_id: int
    timestamp: datetime
    source: str  # Sportsbook name
    
    # Spread
    spread: float
    spread_home_odds: int
    spread_away_odds: int
    
    # Total
    total: float
    over_odds: int
    under_odds: int
    
    # Moneyline
    home_moneyline: int
    away_moneyline: int


@dataclass
class MarketAnalysis:
    """Market analysis for a game."""
    game_id: int
    timestamp: datetime
    
    # Opening vs Current
    opening_spread: float
    current_spread: float
    spread_movement: float
    
    opening_total: float
    current_total: float
    total_movement: float
    
    # Ticket/Money splits (if available)
    spread_ticket_home_pct: Optional[float]
    spread_money_home_pct: Optional[float]
    
    total_ticket_over_pct: Optional[float]
    total_money_over_pct: Optional[float]
    
    # Sharp indicators
    is_steam_move: bool  # Sharp money movement
    is_reverse_line_movement: bool  # Line moves opposite to tickets
    
    # Implied probabilities
    implied_home_win_prob: float
    implied_total: float


@dataclass
class BettingSignal:
    """Derived betting signal from market analysis."""
    game_id: int
    signal_type: str  # STEAM, TRAP, RLM, WEATHER, VALUE
    
    side: str  # HOME_SPREAD, AWAY_SPREAD, OVER, UNDER
    confidence: float  # 0-100
    
    description: str
    
    # Model projections
    model_spread: float
    market_spread: float
    edge: float
    
    model_total: float
    market_total: float
    total_edge: float
    
    # Kelly criterion
    kelly_fraction: float
    recommended_units: float
    
    created_at: datetime


# ─────────────────────────────────────────────────────────────────────────────
# SQL TABLE DEFINITIONS (for reference)
# ─────────────────────────────────────────────────────────────────────────────

SQL_TABLES = """
-- Vector 3: Team Efficiency (most commonly used)
CREATE TABLE IF NOT EXISTS team_efficiency (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL,
    season INTEGER NOT NULL,
    week INTEGER,
    epa_per_play REAL,
    pass_epa_per_play REAL,
    rush_epa_per_play REAL,
    def_epa_per_play REAL,
    success_rate REAL,
    cpoe REAL,
    total_dvoa REAL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, season, week)
);

-- Vector 6: Line Movements
CREATE TABLE IF NOT EXISTS line_movements (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    source VARCHAR(50),
    spread REAL,
    spread_home_odds INTEGER,
    spread_away_odds INTEGER,
    total REAL,
    over_odds INTEGER,
    under_odds INTEGER,
    home_moneyline INTEGER,
    away_moneyline INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vector 6: Betting Signals
CREATE TABLE IF NOT EXISTS betting_signals (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL,
    signal_type VARCHAR(20) NOT NULL,
    side VARCHAR(20) NOT NULL,
    confidence REAL,
    description TEXT,
    model_spread REAL,
    market_spread REAL,
    edge REAL,
    kelly_fraction REAL,
    recommended_units REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vector 5: Game Context
CREATE TABLE IF NOT EXISTS game_context (
    id SERIAL PRIMARY KEY,
    game_id INTEGER UNIQUE NOT NULL,
    season INTEGER NOT NULL,
    week INTEGER NOT NULL,
    home_rest_days INTEGER,
    away_rest_days INTEGER,
    surface VARCHAR(20),
    is_primetime BOOLEAN,
    is_divisional BOOLEAN,
    referee_crew_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vector 5: Weather
CREATE TABLE IF NOT EXISTS game_weather (
    id SERIAL PRIMARY KEY,
    game_id INTEGER UNIQUE NOT NULL,
    venue VARCHAR(100),
    temperature REAL,
    wind_speed REAL,
    wind_direction VARCHAR(10),
    precipitation_type VARCHAR(20),
    is_dome BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""
