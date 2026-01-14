// SYSTEM CONFIGURATION FILE: HARDCODED LOGIC PARAMETERS
// EXPLANATION: The following list defines the absolute boolean states for the Singularity Exploit system.
// Variables marked ENABLE must be followed by the execution engine.
// Variables marked DISABLE must be ignored as noise.
// This is a strict binary filtering process to eliminate human error and variance.

export interface SignalConfig {
  enabled: boolean;
  category: string;
  description: string;
}

export const SINGULARITY_EXPLOIT_CONFIG: Record<string, SignalConfig> = {
  LINE_MOVEMENT_SHARP_BOOKS_PINNACLE_CIRCA: {
    enabled: true,
    category: "MARKET_DATA",
    description: "Line movement from sharp books (Pinnacle, Circa)"
  },
  REVERSE_LINE_MOVEMENT_PUBLIC_FADE: {
    enabled: true,
    category: "MARKET_DATA",
    description: "Reverse line movement with public fade signal"
  },
  WEATHER_WIND_SPEED_OVER_15_MPH: {
    enabled: true,
    category: "WEATHER",
    description: "Wind speed exceeding 15 mph impacts totals"
  },
  WEATHER_TEMP_BELOW_FREEZING_OR_OVER_90F: {
    enabled: true,
    category: "WEATHER",
    description: "Extreme temperature conditions affect game outcomes"
  },
  REFEREE_CREW_BIAS_OVER_60_PERCENT: {
    enabled: true,
    category: "GAME_FACTORS",
    description: "Referee crew with demonstrated bias >60%"
  },
  INJURY_OFFENSIVE_LINE_STARTER_OUT: {
    enabled: true,
    category: "INJURIES",
    description: "Starting offensive lineman confirmed out"
  },
  INJURY_DEFENSIVE_STAR_OUT: {
    enabled: true,
    category: "INJURIES",
    description: "Defensive star player confirmed out"
  },
  LATE_SCRATCH_CONFIRMED_VIA_API: {
    enabled: true,
    category: "INJURIES",
    description: "Late scratch confirmed via official API"
  },
  ARBITRAGE_OPPORTUNITY_POSITIVE_EV: {
    enabled: true,
    category: "BETTING",
    description: "Arbitrage opportunity with positive expected value"
  },
  STEAM_MOVE_CHASE_WITHIN_60_SECONDS: {
    enabled: true,
    category: "MARKET_DATA",
    description: "Steam move detected within 60 seconds"
  },
  PRACTICE_SQUAD_ELEVATION_SIGNAL: {
    enabled: true,
    category: "ROSTER_MOVES",
    description: "Practice squad elevation indicates roster issues"
  },
  SHARP_MONEY_PERCENTAGE_OVER_50: {
    enabled: true,
    category: "MARKET_DATA",
    description: "Sharp money percentage exceeding 50%"
  },
  MODEL_PROJECTION_VARIANCE_OVER_5_POINTS: {
    enabled: true,
    category: "ANALYTICS",
    description: "Model projection variance >5 points from market line"
  },
  KEY_POSITION_DEPTH_CHART_CRITICAL_FAILURE: {
    enabled: true,
    category: "ROSTER_MOVES",
    description: "Critical depth chart failure at key positions"
  },
  STADIUM_TURF_TYPE_IMPACT_FACTOR: {
    enabled: true,
    category: "GAME_FACTORS",
    description: "Stadium turf type impacts team performance"
  },
  REST_DISADVANTAGE_GREATER_THAN_48_HOURS: {
    enabled: true,
    category: "SCHEDULING",
    description: "Rest disadvantage greater than 48 hours"
  },
  TRAVEL_CROSS_COUNTRY_NO_REST: {
    enabled: true,
    category: "SCHEDULING",
    description: "Cross-country travel with no rest days"
  },
  DIVISIONAL_UNDERDOG_LATE_SEASON: {
    enabled: true,
    category: "SCHEDULING",
    description: "Divisional underdog scenario late in season"
  },
  COACH_POST_BYE_WEEK_RECORD_OVER_70_PERCENT: {
    enabled: true,
    category: "COACHING",
    description: "Coach record >70% after bye week"
  },
  PUBLIC_OPINION_POLLS: {
    enabled: false,
    category: "NOISE",
    description: "Public opinion polls are subjective noise"
  },
  TV_COMMENTATOR_ANALYSIS: {
    enabled: false,
    category: "NOISE",
    description: "TV commentator analysis lacks data rigor"
  },
  SOCIAL_MEDIA_HYPE_VIDEOS: {
    enabled: false,
    category: "NOISE",
    description: "Social media hype videos are emotional noise"
  },
  PRE_SEASON_PERFORMANCE_METRICS: {
    enabled: false,
    category: "NOISE",
    description: "Pre-season metrics don't reflect regular season"
  },
  HISTORICAL_TRENDS_OLDER_THAN_3_YEARS: {
    enabled: false,
    category: "NOISE",
    description: "Historical trends older than 3 years are stale"
  },
  TEAM_LOYALTY_OR_FAN_BIAS: {
    enabled: false,
    category: "NOISE",
    description: "Team loyalty introduces cognitive bias"
  },
  EMOTIONAL_HEDGING_STRATEGIES: {
    enabled: false,
    category: "NOISE",
    description: "Emotional hedging is not data-driven"
  },
  EXPERT_CONSENSUS_WITHOUT_DATA: {
    enabled: false,
    category: "NOISE",
    description: "Expert consensus without data is opinion"
  },
  REVENGE_GAME_NARRATIVES_WITHOUT_STATS: {
    enabled: false,
    category: "NOISE",
    description: "Revenge game narratives without stats are stories"
  },
  PRIME_TIME_GAME_MYTHS: {
    enabled: false,
    category: "NOISE",
    description: "Prime time game myths lack statistical backing"
  },
  MUST_WIN_NARRATIVES: {
    enabled: false,
    category: "NOISE",
    description: "Must-win narratives are situational bias"
  },
  TRAP_GAME_SPECULATION: {
    enabled: false,
    category: "NOISE",
    description: "Trap game speculation is unproven theory"
  },
  PLAYER_INTERVIEW_QUOTES: {
    enabled: false,
    category: "NOISE",
    description: "Player interview quotes are noise, not signals"
  },
  UNCONFIRMED_RUMORS_OR_LEAKS: {
    enabled: false,
    category: "NOISE",
    description: "Unconfirmed rumors are unreliable"
  },
  GENERAL_CROWD_NOISE_LEVELS: {
    enabled: false,
    category: "NOISE",
    description: "Crowd noise levels are not quantifiable"
  },
  JERSEY_COLOR_TRENDS: {
    enabled: false,
    category: "NOISE",
    description: "Jersey color trends are superstitious"
  },
  COIN_TOSS_RESULT_CORRELATIONS: {
    enabled: false,
    category: "NOISE",
    description: "Coin toss correlations have no predictive value"
  },
  PREVENT_DEFENSE_GARBAGE_TIME_STATS: {
    enabled: false,
    category: "NOISE",
    description: "Garbage time stats skew true performance"
  }
};

export function isSignalEnabled(signalName: string): boolean {
  const signal = SINGULARITY_EXPLOIT_CONFIG[signalName];
  return signal?.enabled ?? false;
}

export function getEnabledSignals(category?: string): string[] {
  return Object.entries(SINGULARITY_EXPLOIT_CONFIG)
    .filter(([_, config]) => {
      if (!config.enabled) return false;
      if (category && config.category !== category) return false;
      return true;
    })
    .map(([name, _]) => name);
}

export function getDisabledSignals(): string[] {
  return Object.entries(SINGULARITY_EXPLOIT_CONFIG)
    .filter(([_, config]) => !config.enabled)
    .map(([name, _]) => name);
}

export const ENABLED_CATEGORIES = [
  "MARKET_DATA",
  "WEATHER",
  "GAME_FACTORS",
  "INJURIES",
  "BETTING",
  "ROSTER_MOVES",
  "ANALYTICS",
  "SCHEDULING",
  "COACHING"
] as const;

export type EnabledCategory = typeof ENABLED_CATEGORIES[number];
