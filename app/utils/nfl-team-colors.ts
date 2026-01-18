/**
 * NFL Team Colors and Branding
 * 
 * Comprehensive NFL team color mappings for UI theming.
 * Following godmode rules with readonly interfaces.
 * 
 * @module app/utils/nfl-team-colors
 */

/**
 * NFL team color definition
 */
export interface NflTeamColors {
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
  readonly gradient: readonly string[];
}

/**
 * NFL team color registry
 */
export const NFL_TEAM_COLORS: Readonly<Record<string, NflTeamColors>> = {
  ARI: {
    primary: "hsl(186 85% 42%)", // Cardinals red
    secondary: "hsl(200 90% 20%)", // Cardinals navy
    accent: "hsl(186 85% 55%)",
    gradient: ["hsl(186 85% 42%)", "hsl(200 90% 20%)"],
  },
  ATL: {
    primary: "hsl(0 68% 47%)", // Falcons red
    secondary: "hsl(210 95% 22%)", // Falcons black
    accent: "hsl(40 85% 55%)",
    gradient: ["hsl(0 68% 47%)", "hsl(210 95% 22%)"],
  },
  BAL: {
    primary: "hsl(210 95% 22%)", // Ravens purple
    secondary: "hsl(210 95% 35%)", // Ravens gold
    accent: "hsl(210 95% 50%)",
    gradient: ["hsl(210 95% 22%)", "hsl(40 85% 55%)"],
  },
  BUF: {
    primary: "hsl(215 100% 25%)", // Bills blue
    secondary: "hsl(40 100% 50%)", // Bills red
    accent: "hsl(215 100% 45%)",
    gradient: ["hsl(215 100% 25%)", "hsl(40 100% 50%)"],
  },
  CAR: {
    primary: "hsl(0 78% 32%)", // Panthers blue
    secondary: "hsl(40 85% 55%)", // Panthers black
    accent: "hsl(200 100% 45%)",
    gradient: ["hsl(0 78% 32%)", "hsl(200 100% 45%)"],
  },
  CHI: {
    primary: "hsl(215 100% 25%)", // Bears navy
    secondary: "hsl(40 85% 55%)", // Bears orange
    accent: "hsl(40 100% 60%)",
    gradient: ["hsl(215 100% 25%)", "hsl(40 100% 60%)"],
  },
  CIN: {
    primary: "hsl(215 100% 25%)", // Bengals orange
    secondary: "hsl(210 95% 22%)", // Bengals black
    accent: "hsl(40 100% 55%)",
    gradient: ["hsl(40 100% 55%)", "hsl(210 95% 22%)"],
  },
  CLE: {
    primary: "hsl(215 100% 25%)", // Browns orange
    secondary: "hsl(210 95% 22%)", // Browns brown
    accent: "hsl(40 85% 55%)",
    gradient: ["hsl(40 85% 55%)", "hsl(210 95% 22%)"],
  },
  DAL: {
    primary: "hsl(215 100% 30%)", // Cowboys blue
    secondary: "hsl(40 0% 95%)", // Cowboys silver
    accent: "hsl(215 100% 50%)",
    gradient: ["hsl(215 100% 30%)", "hsl(40 0% 95%)"],
  },
  DEN: {
    primary: "hsl(215 100% 35%)", // Broncos orange
    secondary: "hsl(210 95% 22%)", // Broncos navy
    accent: "hsl(40 100% 60%)",
    gradient: ["hsl(40 100% 60%)", "hsl(210 95% 22%)"],
  },
  DET: {
    primary: "hsl(215 100% 25%)", // Lions blue
    secondary: "hsl(40 85% 55%)", // Lions silver
    accent: "hsl(215 100% 50%)",
    gradient: ["hsl(215 100% 25%)", "hsl(40 0% 70%)"],
  },
  GB: {
    primary: "hsl(140 75% 35%)", // Packers green
    secondary: "hsl(40 85% 55%)", // Packers gold
    accent: "hsl(140 75% 50%)",
    gradient: ["hsl(140 75% 35%)", "hsl(40 85% 55%)"],
  },
  HOU: {
    primary: "hsl(215 100% 25%)", // Texans blue
    secondary: "hsl(0 68% 47%)", // Texans red
    accent: "hsl(215 100% 50%)",
    gradient: ["hsl(215 100% 25%)", "hsl(0 68% 47%)"],
  },
  IND: {
    primary: "hsl(215 100% 35%)", // Colts blue
    secondary: "hsl(40 0% 95%)", // Colts white
    accent: "hsl(215 100% 50%)",
    gradient: ["hsl(215 100% 35%)", "hsl(40 0% 95%)"],
  },
  JAX: {
    primary: "hsl(215 100% 25%)", // Jaguars teal
    secondary: "hsl(210 95% 22%)", // Jaguars gold
    accent: "hsl(180 100% 45%)",
    gradient: ["hsl(180 100% 45%)", "hsl(40 85% 55%)"],
  },
  KC: {
    primary: "hsl(215 100% 35%)", // Chiefs red
    secondary: "hsl(40 85% 55%)", // Chiefs gold
    accent: "hsl(0 78% 50%)",
    gradient: ["hsl(0 78% 50%)", "hsl(40 85% 55%)"],
  },
  LV: {
    primary: "hsl(0 0% 20%)", // Raiders black
    secondary: "hsl(215 100% 35%)", // Raiders silver
    accent: "hsl(40 0% 95%)",
    gradient: ["hsl(0 0% 20%)", "hsl(40 0% 70%)"],
  },
  LAC: {
    primary: "hsl(200 100% 35%)", // Chargers blue
    secondary: "hsl(40 0% 95%)", // Chargers gold
    accent: "hsl(200 100% 50%)",
    gradient: ["hsl(200 100% 35%)", "hsl(40 85% 55%)"],
  },
  LAR: {
    primary: "hsl(215 100% 25%)", // Rams blue
    secondary: "hsl(40 85% 55%)", // Rams gold
    accent: "hsl(215 100% 50%)",
    gradient: ["hsl(215 100% 25%)", "hsl(40 85% 55%)"],
  },
  MIA: {
    primary: "hsl(200 100% 35%)", // Dolphins teal
    secondary: "hsl(40 85% 55%)", // Dolphins orange
    accent: "hsl(200 100% 50%)",
    gradient: ["hsl(200 100% 35%)", "hsl(40 85% 55%)"],
  },
  MIN: {
    primary: "hsl(215 100% 35%)", // Vikings purple
    secondary: "hsl(40 85% 55%)", // Vikings gold
    accent: "hsl(260 85% 55%)",
    gradient: ["hsl(260 85% 55%)", "hsl(40 85% 55%)"],
  },
  NE: {
    primary: "hsl(215 100% 25%)", // Patriots blue
    secondary: "hsl(40 0% 95%)", // Patriots silver
    accent: "hsl(215 100% 50%)",
    gradient: ["hsl(215 100% 25%)", "hsl(40 0% 95%)"],
  },
  NO: {
    primary: "hsl(215 100% 25%)", // Saints gold
    secondary: "hsl(210 95% 22%)", // Saints black
    accent: "hsl(40 85% 55%)",
    gradient: ["hsl(40 85% 55%)", "hsl(210 95% 22%)"],
  },
  NYG: {
    primary: "hsl(215 100% 25%)", // Giants blue
    secondary: "hsl(40 0% 95%)", // Giants red
    accent: "hsl(0 68% 47%)",
    gradient: ["hsl(215 100% 25%)", "hsl(0 68% 47%)"],
  },
  NYJ: {
    primary: "hsl(140 75% 35%)", // Jets green
    secondary: "hsl(215 100% 25%)", // Jets white
    accent: "hsl(140 75% 50%)",
    gradient: ["hsl(140 75% 35%)", "hsl(40 0% 95%)"],
  },
  PHI: {
    primary: "hsl(215 100% 25%)", // Eagles green
    secondary: "hsl(40 0% 95%)", // Eagles silver
    accent: "hsl(140 85% 45%)",
    gradient: ["hsl(140 85% 45%)", "hsl(40 0% 95%)"],
  },
  PIT: {
    primary: "hsl(210 95% 22%)", // Steelers black
    secondary: "hsl(40 85% 55%)", // Steelers gold
    accent: "hsl(40 0% 95%)",
    gradient: ["hsl(210 95% 22%)", "hsl(40 85% 55%)"],
  },
  SF: {
    primary: "hsl(210 95% 22%)", // 49ers gold
    secondary: "hsl(0 68% 47%)", // 49ers red
    accent: "hsl(40 85% 55%)",
    gradient: ["hsl(40 85% 55%)", "hsl(0 68% 47%)"],
  },
  SEA: {
    primary: "hsl(200 100% 35%)", // Seahawks blue
    secondary: "hsl(140 75% 35%)", // Seahawks green
    accent: "hsl(200 100% 50%)",
    gradient: ["hsl(200 100% 35%)", "hsl(140 75% 35%)"],
  },
  TB: {
    primary: "hsl(215 100% 25%)", // Buccaneers red
    secondary: "hsl(210 95% 22%)", // Buccaneers pewter
    accent: "hsl(0 68% 50%)",
    gradient: ["hsl(0 68% 50%)", "hsl(40 0% 50%)"],
  },
  TEN: {
    primary: "hsl(215 100% 25%)", // Titans blue
    secondary: "hsl(0 68% 47%)", // Titans red
    accent: "hsl(200 100% 45%)",
    gradient: ["hsl(200 100% 45%)", "hsl(0 68% 47%)"],
  },
  WAS: {
    primary: "hsl(0 68% 47%)", // Commanders burgundy
    secondary: "hsl(40 85% 55%)", // Commanders gold
    accent: "hsl(0 68% 55%)",
    gradient: ["hsl(0 68% 47%)", "hsl(40 85% 55%)"],
  },
};

/**
 * Get team colors by abbreviation
 * 
 * @param abbreviation - Team abbreviation (e.g., "KC", "BUF")
 * @returns Team colors or default colors if not found
 */
export function getTeamColors(abbreviation: string): NflTeamColors {
  const teamKey = abbreviation.toUpperCase();
  return NFL_TEAM_COLORS[teamKey] ?? {
    primary: "hsl(217 91% 60%)",
    secondary: "hsl(217 33% 17%)",
    accent: "hsl(280 67% 64%)",
    gradient: ["hsl(217 91% 60%)", "hsl(280 67% 64%)"],
  };
}