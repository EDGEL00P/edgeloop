import { SINGULARITY_EXPLOIT_CONFIG, getEnabledSignals, isSignalEnabled } from "../singularity-config";
import { eq, and, or } from "drizzle-orm";

export interface StatSource {
  name: string;
  baseUrl: string;
  category: string;
  enabled: boolean;
  description: string;
}

export const NFL_STATS_SOURCES: Record<string, StatSource> = {
  NFL_PASSING: {
    name: "NFL.com Passing",
    baseUrl: "https://nfl.com/stats/player-stats/category/passing",
    category: "offense",
    enabled: true,
    description: "Official NFL passing statistics"
  },
  NFL_RUSHING: {
    name: "NFL.com Rushing",
    baseUrl: "https://nfl.com/stats/player-stats/category/rushing",
    category: "offense",
    enabled: true,
    description: "Official NFL rushing statistics"
  },
  NFL_RECEIVING: {
    name: "NFL.com Receiving",
    baseUrl: "https://nfl.com/stats/player-stats/category/receiving",
    category: "offense",
    enabled: true,
    description: "Official NFL receiving statistics"
  },
  NFL_FUMBLES: {
    name: "NFL.com Fumbles",
    baseUrl: "https://nfl.com/stats/player-stats/category/fumbles",
    category: "turnovers",
    enabled: true,
    description: "Official NFL fumble statistics"
  },
  NFL_TACKLES: {
    name: "NFL.com Tackles",
    baseUrl: "https://nfl.com/stats/player-stats/category/tackles",
    category: "defense",
    enabled: true,
    description: "Official NFL tackle statistics"
  },
  NFL_INTERCEPTIONS: {
    name: "NFL.com Interceptions",
    baseUrl: "https://nfl.com/stats/player-stats/category/interceptions",
    category: "defense",
    enabled: true,
    description: "Official NFL interception statistics"
  },
  NFL_FIELD_GOALS: {
    name: "NFL.com Field Goals",
    baseUrl: "https://nfl.com/stats/player-stats/category/field-goals",
    category: "special_teams",
    enabled: true,
    description: "Official NFL field goal statistics"
  },
  NFL_KICKOFFS: {
    name: "NFL.com Kickoffs",
    baseUrl: "https://nfl.com/stats/player-stats/category/kickoffs",
    category: "special_teams",
    enabled: true,
    description: "Official NFL kickoff statistics"
  },
  NFL_KICKOFF_RETURNS: {
    name: "NFL.com Kickoff Returns",
    baseUrl: "https://nfl.com/stats/player-stats/category/kickoff-returns",
    category: "special_teams",
    enabled: true,
    description: "Official NFL kickoff return statistics"
  },
  NFL_PUNTING: {
    name: "NFL.com Punting",
    baseUrl: "https://nfl.com/stats/player-stats/category/punting",
    category: "special_teams",
    enabled: true,
    description: "Official NFL punting statistics"
  },
  NFL_PUNT_RETURNS: {
    name: "NFL.com Punt Returns",
    baseUrl: "https://nfl.com/stats/player-stats/category/punt-returns",
    category: "special_teams",
    enabled: true,
    description: "Official NFL punt return statistics"
  },
  NEXTGEN_PASSING: {
    name: "NextGen Passing",
    baseUrl: "https://nextgenstats.nfl.com/stats/passing",
    category: "advanced",
    enabled: true,
    description: "NextGen Stats passing advanced metrics"
  },
  NEXTGEN_RUSHING: {
    name: "NextGen Rushing",
    baseUrl: "https://nextgenstats.nfl.com/stats/rushing",
    category: "advanced",
    enabled: true,
    description: "NextGen Stats rushing advanced metrics"
  },
  NEXTGEN_RECEIVING: {
    name: "NextGen Receiving",
    baseUrl: "https://nextgenstats.nfl.com/stats/receiving",
    category: "advanced",
    enabled: true,
    description: "NextGen Stats receiving advanced metrics"
  },
  NEXTGEN_FASTEST_BALL_CARRIERS: {
    name: "NextGen Fastest Ball Carriers",
    baseUrl: "https://nextgenstats.nfl.com/stats/top-plays/fastest-ball-carriers",
    category: "advanced",
    enabled: true,
    description: "Top plays - fastest ball carriers"
  },
  NEXTGEN_LONGEST_RUSH: {
    name: "NextGen Longest Rush",
    baseUrl: "https://nextgenstats.nfl.com/stats/top-plays/longest-rush",
    category: "advanced",
    enabled: true,
    description: "Top plays - longest rushes"
  },
  NEXTGEN_LONGEST_PASS: {
    name: "NextGen Longest Pass",
    baseUrl: "https://nextgenstats.nfl.com/stats/top-plays/longest-pass",
    category: "advanced",
    enabled: true,
    description: "Top plays - longest passes"
  },
  ESPN_PASSING: {
    name: "ESPN Passing",
    baseUrl: "https://espn.com/nfl/stats/player/_/stat/passing",
    category: "offense",
    enabled: true,
    description: "ESPN passing statistics"
  },
  ESPN_RUSHING: {
    name: "ESPN Rushing",
    baseUrl: "https://espn.com/nfl/stats/player/_/stat/rushing",
    category: "offense",
    enabled: true,
    description: "ESPN rushing statistics"
  },
  ESPN_RECEIVING: {
    name: "ESPN Receiving",
    baseUrl: "https://espn.com/nfl/stats/player/_/stat/receiving",
    category: "offense",
    enabled: true,
    description: "ESPN receiving statistics"
  },
  ESPN_DEFENSE: {
    name: "ESPN Defense",
    baseUrl: "https://espn.com/nfl/stats/player/_/stat/defense",
    category: "defense",
    enabled: true,
    description: "ESPN defensive statistics"
  },
  ESPN_SCORING: {
    name: "ESPN Scoring",
    baseUrl: "https://espn.com/nfl/stats/player/_/stat/scoring",
    category: "scoring",
    enabled: true,
    description: "ESPN scoring statistics"
  },
  ESPN_RETURNING: {
    name: "ESPN Returning",
    baseUrl: "https://espn.com/nfl/stats/player/_/stat/returning",
    category: "special_teams",
    enabled: true,
    description: "ESPN return statistics"
  },
  ESPN_KICKING: {
    name: "ESPN Kicking",
    baseUrl: "https://espn.com/nfl/stats/player/_/stat/kicking",
    category: "special_teams",
    enabled: true,
    description: "ESPN kicking statistics"
  },
  ESPN_PUNTING: {
    name: "ESPN Punting",
    baseUrl: "https://espn.com/nfl/stats/player/_/stat/punting",
    category: "special_teams",
    enabled: true,
    description: "ESPN punting statistics"
  },
  FOX_PASSING: {
    name: "Fox Sports Passing",
    baseUrl: "https://foxsports.com/nfl/stats?category=passing",
    category: "offense",
    enabled: true,
    description: "Fox Sports passing statistics"
  },
  FOX_RUSHING: {
    name: "Fox Sports Rushing",
    baseUrl: "https://foxsports.com/nfl/stats?category=rushing",
    category: "offense",
    enabled: true,
    description: "Fox Sports rushing statistics"
  },
  FOX_RECEIVING: {
    name: "Fox Sports Receiving",
    baseUrl: "https://foxsports.com/nfl/stats?category=receiving",
    category: "offense",
    enabled: true,
    description: "Fox Sports receiving statistics"
  },
  FOX_DEFENSE: {
    name: "Fox Sports Defense",
    baseUrl: "https://foxsports.com/nfl/stats?category=defense",
    category: "defense",
    enabled: true,
    description: "Fox Sports defensive statistics"
  },
  FOX_KICKING: {
    name: "Fox Sports Kicking",
    baseUrl: "https://foxsports.com/nfl/stats?category=kicking",
    category: "special_teams",
    enabled: true,
    description: "Fox Sports kicking statistics"
  },
  FOX_PUNTING: {
    name: "Fox Sports Punting",
    baseUrl: "https://foxsports.com/nfl/stats?category=punting",
    category: "special_teams",
    enabled: true,
    description: "Fox Sports punting statistics"
  },
  FOX_RETURNING: {
    name: "Fox Sports Returning",
    baseUrl: "https://foxsports.com/nfl/stats?category=returning",
    category: "special_teams",
    enabled: true,
    description: "Fox Sports return statistics"
  },
  CBS_PASSING: {
    name: "CBS Sports Passing",
    baseUrl: "https://cbssports.com/nfl/stats/player/passing",
    category: "offense",
    enabled: true,
    description: "CBS Sports passing statistics"
  },
  CBS_RUSHING: {
    name: "CBS Sports Rushing",
    baseUrl: "https://cbssports.com/nfl/stats/player/rushing",
    category: "offense",
    enabled: true,
    description: "CBS Sports rushing statistics"
  },
  CBS_RECEIVING: {
    name: "CBS Sports Receiving",
    baseUrl: "https://cbssports.com/nfl/stats/player/receiving",
    category: "offense",
    enabled: true,
    description: "CBS Sports receiving statistics"
  },
  CBS_DEFENSE: {
    name: "CBS Sports Defense",
    baseUrl: "https://cbssports.com/nfl/stats/player/defense",
    category: "defense",
    enabled: true,
    description: "CBS Sports defensive statistics"
  },
  CBS_KICKING: {
    name: "CBS Sports Kicking",
    baseUrl: "https://cbssports.com/nfl/stats/player/kicking",
    category: "special_teams",
    enabled: true,
    description: "CBS Sports kicking statistics"
  },
  CBS_PUNTING: {
    name: "CBS Sports Punting",
    baseUrl: "https://cbssports.com/nfl/stats/player/punting",
    category: "special_teams",
    enabled: true,
    description: "CBS Sports punting statistics"
  },
  CBS_PUNT_RETURNS: {
    name: "CBS Sports Punt Returns",
    baseUrl: "https://cbssports.com/nfl/stats/player/punt-returns",
    category: "special_teams",
    enabled: true,
    description: "CBS Sports punt return statistics"
  },
  CBS_KICK_RETURNS: {
    name: "CBS Sports Kick Returns",
    baseUrl: "https://cbssports.com/nfl/stats/player/kick-returns",
    category: "special_teams",
    enabled: true,
    description: "CBS Sports kick return statistics"
  }
};

export const STAT_CATEGORIES = {
  OFFENSE: ["passing", "rushing", "receiving"],
  DEFENSE: ["tackles", "interceptions", "defense"],
  SPECIAL_TEAMS: ["field-goals", "kickoffs", "kickoff-returns", "punting", "punt-returns", "kicking", "returning"],
  ADVANCED: ["passing", "rushing", "receiving", "fastest-ball-carriers", "longest-rush", "longest-pass"],
  TURNOVERS: ["fumbles"],
  SCORING: ["scoring"]
} as const;

export type StatCategory = typeof STAT_CATEGORIES[keyof typeof STAT_CATEGORIES][number];

export function getStatSourcesByCategory(category: string): StatSource[] {
  return Object.values(NFL_STATS_SOURCES).filter(
    source => source.category === category && source.enabled
  );
}

export function getEnabledStatSources(): StatSource[] {
  return Object.values(NFL_STATS_SOURCES).filter(source => source.enabled);
}

export function getStatSourceUrl(sourceKey: string): string | null {
  const source = NFL_STATS_SOURCES[sourceKey];
  return source?.enabled ? source.baseUrl : null;
}

export async function fetchStatSource(
  sourceKey: string,
  filters?: Record<string, string>
): Promise<any> {
  const source = NFL_STATS_SOURCES[sourceKey];
  if (!source || !source.enabled) {
    throw new Error(`Stat source ${sourceKey} is not enabled`);
  }

  const url = new URL(source.baseUrl);
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching stats from ${source.name}:`, error);
    throw error;
  }
}
