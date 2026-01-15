import { db } from "../db";
import { weeklyMetrics, historicalGames, nflPlayers, nflTeams } from "@shared/schema";
import { eq, and, or, sql, gte, lte, desc, avg, sum } from "drizzle-orm";
import * as ss from "simple-statistics";

export interface TeamMetrics {
  teamId: number;
  teamName: string;
  season: number;
  week: number;

  offensiveMetrics: {
    epaPerPlay: number;
    successRate: number;
    epaPerPass: number;
    epaPerRun: number;
    passSuccessRate: number;
    runSuccessRate: number;
    redZoneEfficiency: number;
    thirdDownConversion: number;
  };

  defensiveMetrics: {
    epaAllowedPerPlay: number;
    successRateAllowed: number;
    epaAllowedPerPass: number;
    epaAllowedPerRun: number;
    passSuccessAllowed: number;
    runSuccessAllowed: number;
    redZoneDefense: number;
    thirdDownDefense: number;
    pressureRate: number;
  };

  situationalMetrics: {
    homeFieldAdvantage: number;
    restDays: number;
    divisionalRecord: number;
    afterByeWeek: number;
    shortWeek: boolean;
    crossCountryTravel: boolean;
  };

  matchupSpecific: {
    vsOpponentRecord: number;
    vsOpponentEPA: number;
    weatherAdjustedEPA: number;
  };
}

export interface PlayerMetrics {
  playerId: number;
  playerName: string;
  position: string;
  team: string;
  season: number;

  passingMetrics?: {
    attempts: number;
    completions: number;
    yards: number;
    touchdowns: number;
    interceptions: number;
    rating: number;
    epaPerPlay: number;
    cpoe: number;
    airYards: number;
    timeToThrow: number;
    redZoneRating: number;
  };

  rushingMetrics?: {
    attempts: number;
    yards: number;
    touchdowns: number;
    yardsPerAttempt: number;
    epaPerPlay: number;
    successRate: number;
    brokenTackles: number;
    yardsAfterContact: number;
  };

  receivingMetrics?: {
    targets: number;
    receptions: number;
    yards: number;
    touchdowns: number;
    yardsPerReception: number;
    epaPerTarget: number;
    catchRate: number;
    yardsAfterCatch: number;
    targetShare: number;
    separation: number;
  };

  defenseMetrics?: {
    tackles: number;
    sacks: number;
    interceptions: number;
    passesDefended: number;
    forcedFumbles: number;
    tacklesForLoss: number;
    pressures: number;
    coverageRating: number;
    runStopRate: number;
  };
}

export interface MatchupFeatures {
  gameId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeTeam: string;
  awayTeam: string;

  teamDifferentialMetrics: {
    epaPerPlayDiff: number;
    successRateDiff: number;
    pressureRateDiff: number;
    redZoneEfficiencyDiff: number;
    thirdDownConversionDiff: number;
  };

  situationalFeatures: {
    homeRestAdvantage: number;
    travelDisadvantage: number;
    domeFactor: number;
    weatherFactor: number;
    divisionalGame: boolean;
  };

  playerMatchupFeatures: {
    qbVsPassDefense: number;
    rbVsRunDefense: number;
    olVsPassRush: number;
    wrVsCoverage: number;
    teVsLinebacker: number;
  };
}

export class FeatureEngineer {
  async buildTeamMetrics(
    teamId: number,
    season: number,
    week?: number,
    gamesToInclude: number = 5
  ): Promise<TeamMetrics | null> {
    try {
      const team = await db.query.nflTeams.findFirst({
        where: eq(nflTeams.id, teamId)
      });

      if (!team) return null;

      const metrics = await db.query.weeklyMetrics.findMany({
        where: and(
          eq(weeklyMetrics.teamId, teamId),
          eq(weeklyMetrics.season, season),
          week ? lte(weeklyMetrics.week, week) : undefined
        ),
        orderBy: desc(weeklyMetrics.week),
        limit: gamesToInclude
      });

      const recentMetrics = metrics.slice(0, Math.min(gamesToInclude, metrics.length));

      const offensiveMetrics = this.calculateOffensiveMetrics(recentMetrics);
      const defensiveMetrics = this.calculateDefensiveMetrics(recentMetrics);
      const situationalMetrics = await this.calculateSituationalMetrics(teamId, season, week);

      const opponentMetrics = await this.calculateMatchupSpecific(teamId, season);

      return {
        teamId,
        teamName: team.fullName,
        season,
        week: week || 0,
        offensiveMetrics,
        defensiveMetrics,
        situationalMetrics,
        matchupSpecific: opponentMetrics
      };
    } catch (error) {
      console.error(`Error building team metrics for team ${teamId}:`, error);
      return null;
    }
  }

  async buildMatchupFeatures(
    gameId: number,
    homeTeamId: number,
    awayTeamId: number,
    season: number
  ): Promise<MatchupFeatures | null> {
    try {
      const homeTeam = await this.buildTeamMetrics(homeTeamId, season);
      const awayTeam = await this.buildTeamMetrics(awayTeamId, season);

      if (!homeTeam || !awayTeam) return null;

      const teamDifferentialMetrics = {
        epaPerPlayDiff: homeTeam.offensiveMetrics.epaPerPlay - awayTeam.offensiveMetrics.epaPerPlay,
        successRateDiff: homeTeam.offensiveMetrics.successRate - awayTeam.offensiveMetrics.successRate,
        pressureRateDiff: homeTeam.defensiveMetrics.pressureRate - awayTeam.defensiveMetrics.pressureRate,
        redZoneEfficiencyDiff: homeTeam.offensiveMetrics.redZoneEfficiency - awayTeam.offensiveMetrics.redZoneEfficiency,
        thirdDownConversionDiff: homeTeam.offensiveMetrics.thirdDownConversion - awayTeam.offensiveMetrics.thirdDownConversion
      };

      const situationalFeatures = {
        homeRestAdvantage: homeTeam.situationalMetrics.restDays - awayTeam.situationalMetrics.restDays,
        travelDisadvantage: awayTeam.situationalMetrics.crossCountryTravel ? 1 : 0,
        domeFactor: 0,
        weatherFactor: 0,
        divisionalGame: homeTeam.situationalMetrics.divisionalRecord > 0
      };

      const playerMatchupFeatures = await this.calculatePlayerMatchups(homeTeamId, awayTeamId, season);

      return {
        gameId,
        homeTeamId,
        awayTeamId,
        homeTeam: homeTeam.teamName,
        awayTeam: awayTeam.teamName,
        teamDifferentialMetrics,
        situationalFeatures,
        playerMatchupFeatures: playerMatchupFeatures
      };
    } catch (error) {
      console.error(`Error building matchup features for game ${gameId}:`, error);
      return null;
    }
  }

  private calculateOffensiveMetrics(metrics: { epaPerPlay?: number; successRate?: number }[]) {
    if (metrics.length === 0) {
      return {
        epaPerPlay: 0,
        successRate: 0.45,
        epaPerPass: 0,
        epaPerRun: 0,
        passSuccessRate: 0.45,
        runSuccessRate: 0.45,
        redZoneEfficiency: 0.55,
        thirdDownConversion: 0.40
      };
    }

    const epaPerPlays = metrics.map(m => m.epaPerPlay || 0);
    const successRates = metrics.map(m => m.successRate || 0.45);

    return {
      epaPerPlay: ss.mean(epaPerPlays),
      successRate: ss.mean(successRates),
      epaPerPass: ss.mean(epaPerPlays),
      epaPerRun: ss.mean(epaPerPlays),
      passSuccessRate: ss.mean(successRates),
      runSuccessRate: ss.mean(successRates),
      redZoneEfficiency: 0.55 + (ss.mean(epaPerPlays) * 2),
      thirdDownConversion: 0.40 + (ss.mean(successRates) * 0.2)
    };
  }

  private calculateDefensiveMetrics(metrics: any[]) {
    if (metrics.length === 0) {
      return {
        epaAllowedPerPlay: 0,
        successRateAllowed: 0.45,
        epaAllowedPerPass: 0,
        epaAllowedPerRun: 0,
        passSuccessAllowed: 0.45,
        runSuccessAllowed: 0.45,
        redZoneDefense: 0.55,
        thirdDownDefense: 0.40,
        pressureRate: 0.25
      };
    }

    const epaPerPlays = metrics.map(m => -(m.epaPerPlay || 0));
    const successRates = metrics.map(m => m.successRate || 0.45);
    const pressureRates = metrics.map(m => m.hdPressureRate || 0.25);

    return {
      epaAllowedPerPlay: ss.mean(epaPerPlays),
      successRateAllowed: ss.mean(successRates),
      epaAllowedPerPass: ss.mean(epaPerPlays),
      epaAllowedPerRun: ss.mean(epaPerPlays),
      passSuccessAllowed: ss.mean(successRates),
      runSuccessAllowed: ss.mean(successRates),
      redZoneDefense: 0.55 - (ss.mean(epaPerPlays) * 2),
      thirdDownDefense: 0.40 - (ss.mean(successRates) * 0.2),
      pressureRate: ss.mean(pressureRates)
    };
  }

  private async calculateSituationalMetrics(teamId: number, season: number, week?: number) {
    const team = await db.query.nflTeams.findFirst({
      where: eq(nflTeams.id, teamId)
    });
    
    if (!team) {
      return {
        homeFieldAdvantage: 0,
        restDays: 7,
        divisionalRecord: 0,
        afterByeWeek: 0,
        shortWeek: false,
        crossCountryTravel: false
      };
    }

    const teamAbbrev = team.abbreviation;

    const games = await db.query.historicalGames.findMany({
      where: and(
        eq(historicalGames.season, season),
        or(
          eq(historicalGames.homeTeam, teamAbbrev),
          eq(historicalGames.awayTeam, teamAbbrev)
        )
      ),
      orderBy: [desc(historicalGames.gameDate)]
    });

    const homeGames = games.filter(g => g.homeTeam === teamAbbrev);
    const homeWins = homeGames.filter(g =>
      (g.homeScore || 0) > (g.awayScore || 0)
    ).length;
    const homeFieldAdvantage = homeGames.length > 0 ? homeWins / homeGames.length : 0;

    return {
      homeFieldAdvantage,
      restDays: 7,
      divisionalRecord: 0,
      afterByeWeek: 0,
      shortWeek: false,
      crossCountryTravel: false
    };
  }

  private async calculateMatchupSpecific(teamId: number, season: number) {
    return {
      vsOpponentRecord: 0,
      vsOpponentEPA: 0,
      weatherAdjustedEPA: 0
    };
  }

  private async calculatePlayerMatchups(
    homeTeamId: number,
    awayTeamId: number,
    season: number
  ) {
    return {
      qbVsPassDefense: 0,
      rbVsRunDefense: 0,
      olVsPassRush: 0,
      wrVsCoverage: 0,
      teVsLinebacker: 0
    };
  }

  calculateInteractionFeatures(
    teamA: TeamMetrics,
    teamB: TeamMetrics
  ): Record<string, number> {
    const features: Record<string, number> = {};

    features.offensiveDifferential = teamA.offensiveMetrics.epaPerPlay -
                                  teamB.defensiveMetrics.epaAllowedPerPlay;
    features.defensiveDifferential = teamA.defensiveMetrics.epaAllowedPerPlay -
                                  teamB.offensiveMetrics.epaPerPlay;

    features.pressureDifferential = teamA.defensiveMetrics.pressureRate -
                                  teamB.offensiveMetrics.successRate;

    features.redZoneDifferential = teamA.offensiveMetrics.redZoneEfficiency -
                                  teamB.defensiveMetrics.redZoneDefense;

    features.situationalScore = teamA.situationalMetrics.homeFieldAdvantage * 0.1 +
                             teamA.situationalMetrics.restDays * 0.05;

    features.compositeEdge = features.offensiveDifferential * 0.4 +
                           features.defensiveDifferential * 0.3 +
                           features.pressureDifferential * 0.2 +
                           features.situationalScore;

    return features;
  }

  calculateRollingMetrics(
    teamId: number,
    season: number,
    week: number,
    window: number = 3
  ): Record<string, number> {
    const rollingFeatures: Record<string, number> = {
      rollingEPA: 0,
      rollingSuccessRate: 0.45,
      epaTrend: 0,
      successRateTrend: 0,
      momentumScore: 0
    };

    return rollingFeatures;
  }

  calculateWeatherAdjustedMetrics(
    teamMetrics: TeamMetrics,
    temperature: number,
    windSpeed: number,
    precipitation: boolean
  ): TeamMetrics {
    const adjusted = { ...teamMetrics };

    if (temperature < 32) {
      adjusted.offensiveMetrics.epaPerPlay *= 0.95;
      adjusted.offensiveMetrics.successRate *= 0.95;
    }

    if (windSpeed > 15) {
      adjusted.offensiveMetrics.passSuccessRate *= 0.92;
      adjusted.offensiveMetrics.redZoneEfficiency *= 0.90;
    }

    if (precipitation) {
      adjusted.offensiveMetrics.runSuccessRate *= 0.97;
      adjusted.defensiveMetrics.epaAllowedPerPlay *= 1.02;
    }

    return adjusted;
  }

  calculateInjuryImpact(
    baseMetrics: TeamMetrics,
    injuries: Array<{ position: string; impactScore: number }>
  ): TeamMetrics {
    const adjusted = JSON.parse(JSON.stringify(baseMetrics));

    for (const injury of injuries) {
      switch (injury.position) {
        case "QB":
          adjusted.offensiveMetrics.epaPerPlay -= injury.impactScore * 0.05;
          adjusted.offensiveMetrics.successRate -= injury.impactScore * 0.03;
          break;
        case "WR":
          adjusted.offensiveMetrics.epaPerPlay -= injury.impactScore * 0.03;
          adjusted.offensiveMetrics.successRate -= injury.impactScore * 0.02;
          break;
        case "LT":
        case "RT":
        case "LG":
        case "RG":
        case "C":
          adjusted.offensiveMetrics.epaPerPass -= injury.impactScore * 0.04;
          adjusted.offensiveMetrics.pressureRate += injury.impactScore * 0.02;
          break;
        case "DE":
        case "DT":
        case "LB":
          adjusted.defensiveMetrics.pressureRate -= injury.impactScore * 0.02;
          adjusted.defensiveMetrics.successRateAllowed += injury.impactScore * 0.02;
          break;
      }
    }

    return adjusted;
  }
}

export const featureEngineer = new FeatureEngineer();
