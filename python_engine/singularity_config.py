"""SYSTEM CONFIGURATION FILE: HARDCODED LOGIC PARAMETERS
EXPLANATION: The following list defines the absolute boolean states for the Singularity Exploit system.
Variables marked ENABLE must be followed by the execution engine.
Variables marked DISABLE must be ignored as noise.
This is a strict binary filtering process to eliminate human error and variance.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional

@dataclass
class SignalConfig:
    enabled: bool
    category: str
    description: str

SINGULARITY_EXPLOIT_CONFIG: Dict[str, SignalConfig] = {
    "LINE_MOVEMENT_SHARP_BOOKS_PINNACLE_CIRCA": SignalConfig(
        enabled=True,
        category="MARKET_DATA",
        description="Line movement from sharp books (Pinnacle, Circa)"
    ),
    "REVERSE_LINE_MOVEMENT_PUBLIC_FADE": SignalConfig(
        enabled=True,
        category="MARKET_DATA",
        description="Reverse line movement with public fade signal"
    ),
    "WEATHER_WIND_SPEED_OVER_15_MPH": SignalConfig(
        enabled=True,
        category="WEATHER",
        description="Wind speed exceeding 15 mph impacts totals"
    ),
    "WEATHER_TEMP_BELOW_FREEZING_OR_OVER_90F": SignalConfig(
        enabled=True,
        category="WEATHER",
        description="Extreme temperature conditions affect game outcomes"
    ),
    "REFEREE_CREW_BIAS_OVER_60_PERCENT": SignalConfig(
        enabled=True,
        category="GAME_FACTORS",
        description="Referee crew with demonstrated bias >60%"
    ),
    "INJURY_OFFENSIVE_LINE_STARTER_OUT": SignalConfig(
        enabled=True,
        category="INJURIES",
        description="Starting offensive lineman confirmed out"
    ),
    "INJURY_DEFENSIVE_STAR_OUT": SignalConfig(
        enabled=True,
        category="INJURIES",
        description="Defensive star player confirmed out"
    ),
    "LATE_SCRATCH_CONFIRMED_VIA_API": SignalConfig(
        enabled=True,
        category="INJURIES",
        description="Late scratch confirmed via official API"
    ),
    "ARBITRAGE_OPPORTUNITY_POSITIVE_EV": SignalConfig(
        enabled=True,
        category="BETTING",
        description="Arbitrage opportunity with positive expected value"
    ),
    "STEAM_MOVE_CHASE_WITHIN_60_SECONDS": SignalConfig(
        enabled=True,
        category="MARKET_DATA",
        description="Steam move detected within 60 seconds"
    ),
    "PRACTICE_SQUAD_ELEVATION_SIGNAL": SignalConfig(
        enabled=True,
        category="ROSTER_MOVES",
        description="Practice squad elevation indicates roster issues"
    ),
    "SHARP_MONEY_PERCENTAGE_OVER_50": SignalConfig(
        enabled=True,
        category="MARKET_DATA",
        description="Sharp money percentage exceeding 50%"
    ),
    "MODEL_PROJECTION_VARIANCE_OVER_5_POINTS": SignalConfig(
        enabled=True,
        category="ANALYTICS",
        description="Model projection variance >5 points from market line"
    ),
    "KEY_POSITION_DEPTH_CHART_CRITICAL_FAILURE": SignalConfig(
        enabled=True,
        category="ROSTER_MOVES",
        description="Critical depth chart failure at key positions"
    ),
    "STADIUM_TURF_TYPE_IMPACT_FACTOR": SignalConfig(
        enabled=True,
        category="GAME_FACTORS",
        description="Stadium turf type impacts team performance"
    ),
    "REST_DISADVANTAGE_GREATER_THAN_48_HOURS": SignalConfig(
        enabled=True,
        category="SCHEDULING",
        description="Rest disadvantage greater than 48 hours"
    ),
    "TRAVEL_CROSS_COUNTRY_NO_REST": SignalConfig(
        enabled=True,
        category="SCHEDULING",
        description="Cross-country travel with no rest days"
    ),
    "DIVISIONAL_UNDERDOG_LATE_SEASON": SignalConfig(
        enabled=True,
        category="SCHEDULING",
        description="Divisional underdog scenario late in season"
    ),
    "COACH_POST_BYE_WEEK_RECORD_OVER_70_PERCENT": SignalConfig(
        enabled=True,
        category="COACHING",
        description="Coach record >70% after bye week"
    ),
    "PUBLIC_OPINION_POLLS": SignalConfig(
        enabled=False,
        category="NOISE",
        description="Public opinion polls are subjective noise"
    ),
    "TV_COMMENTATOR_ANALYSIS": SignalConfig(
        enabled=False,
        category="NOISE",
        description="TV commentator analysis lacks data rigor"
    ),
    "SOCIAL_MEDIA_HYPE_VIDEOS": SignalConfig(
        enabled=False,
        category="NOISE",
        description="Social media hype videos are emotional noise"
    ),
    "PRE_SEASON_PERFORMANCE_METRICS": SignalConfig(
        enabled=False,
        category="NOISE",
        description="Pre-season metrics don't reflect regular season"
    ),
    "HISTORICAL_TRENDS_OLDER_THAN_3_YEARS": SignalConfig(
        enabled=False,
        category="NOISE",
        description="Historical trends older than 3 years are stale"
    ),
    "TEAM_LOYALTY_OR_FAN_BIAS": SignalConfig(
        enabled=False,
        category="NOISE",
        description="Team loyalty introduces cognitive bias"
    ),
    "EMOTIONAL_HEDGING_STRATEGIES": SignalConfig(
        enabled=False,
        category="NOISE",
        description="Emotional hedging is not data-driven"
    ),
    "EXPERT_CONSENSUS_WITHOUT_DATA": SignalConfig(
        enabled=False,
        category="NOISE",
        description="Expert consensus without data is opinion"
    ),
    "REVENGE_GAME_NARRATIVES_WITHOUT_STATS": SignalConfig(
        enabled=False,
        category="NOISE",
        description="Revenge game narratives without stats are stories"
    ),
    "PRIME_TIME_GAME_MYTHS": SignalConfig(
        enabled=False,
        category="NOISE",
        description="Prime time game myths lack statistical backing"
    ),
    "MUST_WIN_NARRATIVES": SignalConfig(
        enabled=False,
        category="NOISE",
        description="Must-win narratives are situational bias"
    ),
    "TRAP_GAME_SPECULATION": SignalConfig(
        enabled=False,
        category="NOISE",
        description="Trap game speculation is unproven theory"
    ),
    "PLAYER_INTERVIEW_QUOTES": SignalConfig(
        enabled=False,
        category="NOISE",
        description="Player interview quotes are noise, not signals"
    ),
    "UNCONFIRMED_RUMORS_OR_LEAKS": SignalConfig(
        enabled=False,
        category="NOISE",
        description="Unconfirmed rumors are unreliable"
    ),
    "GENERAL_CROWD_NOISE_LEVELS": SignalConfig(
        enabled=False,
        category="NOISE",
        description="Crowd noise levels are not quantifiable"
    ),
    "JERSEY_COLOR_TRENDS": SignalConfig(
        enabled=False,
        category="NOISE",
        description="Jersey color trends are superstitious"
    ),
    "COIN_TOSS_RESULT_CORRELATIONS": SignalConfig(
        enabled=False,
        category="NOISE",
        description="Coin toss correlations have no predictive value"
    ),
    "PREVENT_DEFENSE_GARBAGE_TIME_STATS": SignalConfig(
        enabled=False,
        category="NOISE",
        description="Garbage time stats skew true performance"
    )
}

def is_signal_enabled(signal_name: str) -> bool:
    """Check if a signal is enabled in the Singularity configuration."""
    signal = SINGULARITY_EXPLOIT_CONFIG.get(signal_name)
    return signal.enabled if signal else False

def get_enabled_signals(category: Optional[str] = None) -> List[str]:
    """Get list of enabled signal names, optionally filtered by category."""
    enabled = []
    for name, config in SINGULARITY_EXPLOIT_CONFIG.items():
        if config.enabled:
            if category is None or config.category == category:
                enabled.append(name)
    return enabled

def get_disabled_signals() -> List[str]:
    """Get list of disabled signal names."""
    return [
        name for name, config in SINGULARITY_EXPLOIT_CONFIG.items()
        if not config.enabled
    ]

ENABLED_CATEGORIES = [
    "MARKET_DATA",
    "WEATHER",
    "GAME_FACTORS",
    "INJURIES",
    "BETTING",
    "ROSTER_MOVES",
    "ANALYTICS",
    "SCHEDULING",
    "COACHING"
]
