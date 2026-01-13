import { db } from "../db";
import { historicalGames } from "@shared/schema";
import { eq, and, or, sql, gte, lte } from "drizzle-orm";
import * as ss from "simple-statistics";

export interface PredictionResult {
  prediction: 'cover' | 'loss' | 'over' | 'under';
  confidence: number;
  historicalRecord: string;
  keyFactors: string[];
  sampleSize: number;
}

export interface AtsRecord {
  wins: number;
  losses: number;
  pushes: number;
  winPercentage: number;
  sampleSize: number;
}

export interface OverUnderRecord {
  overs: number;
  unders: number;
  pushes: number;
  overPercentage: number;
  sampleSize: number;
}

export interface HomeFieldResult {
  homeCoverRate: number;
  homeCoversAsFavorite: number;
  homeCoversAsUnderdog: number;
  sampleSize: number;
}

export interface WeatherImpactResult {
  averageTotal: number;
  overRate: number;
  underRate: number;
  sampleSize: number;
  recommendation: string;
}

export interface SpreadTrendResult {
  coverRate: number;
  pushRate: number;
  sampleSize: number;
  averageMargin: number;
}

export interface MatchupAnalysisResult {
  headToHead: {
    homeWins: number;
    awayWins: number;
    homeCovers: number;
    awayCovers: number;
    overs: number;
    unders: number;
    sampleSize: number;
  };
  homeTeamTrends: AtsRecord;
  awayTeamTrends: AtsRecord;
  averageTotalPoints: number;
  recommendation: string;
}

function calculateConfidence(sampleSize: number, consistency: number): number {
  const sampleFactor = Math.min(sampleSize / 50, 1) * 0.4;
  const consistencyFactor = consistency * 0.6;
  return Math.round((sampleFactor + consistencyFactor) * 100);
}

function formatRecord(wins: number, losses: number, pushes: number): string {
  const total = wins + losses;
  const pct = total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";
  return `${wins}-${losses}-${pushes} (${pct}%)`;
}

export async function getTeamAtsRecord(team: string, seasons?: number): Promise<AtsRecord> {
  const teamUpper = team.toUpperCase();
  
  let query = db.select().from(historicalGames).where(
    and(
      or(
        sql`UPPER(${historicalGames.homeTeam}) = ${teamUpper}`,
        sql`UPPER(${historicalGames.awayTeam}) = ${teamUpper}`
      ),
      sql`${historicalGames.spreadResult} IS NOT NULL`
    )
  );

  if (seasons) {
    const currentYear = new Date().getFullYear();
    const minSeason = currentYear - seasons;
    query = db.select().from(historicalGames).where(
      and(
        or(
          sql`UPPER(${historicalGames.homeTeam}) = ${teamUpper}`,
          sql`UPPER(${historicalGames.awayTeam}) = ${teamUpper}`
        ),
        sql`${historicalGames.spreadResult} IS NOT NULL`,
        gte(historicalGames.season, minSeason)
      )
    );
  }

  const games = await query;
  
  let wins = 0;
  let losses = 0;
  let pushes = 0;

  for (const game of games) {
    const isFavorite = game.favoriteTeam?.toUpperCase() === teamUpper;
    
    if (game.spreadResult === 'push') {
      pushes++;
    } else if (isFavorite) {
      if (game.spreadResult === 'cover') {
        wins++;
      } else {
        losses++;
      }
    } else {
      if (game.spreadResult === 'loss') {
        wins++;
      } else {
        losses++;
      }
    }
  }

  const total = wins + losses;
  return {
    wins,
    losses,
    pushes,
    winPercentage: total > 0 ? (wins / total) * 100 : 0,
    sampleSize: games.length
  };
}

export async function getTeamOverUnderRecord(team: string): Promise<OverUnderRecord> {
  const teamUpper = team.toUpperCase();
  
  const games = await db.select().from(historicalGames).where(
    and(
      or(
        sql`UPPER(${historicalGames.homeTeam}) = ${teamUpper}`,
        sql`UPPER(${historicalGames.awayTeam}) = ${teamUpper}`
      ),
      sql`${historicalGames.totalResult} IS NOT NULL`
    )
  );

  let overs = 0;
  let unders = 0;
  let pushes = 0;

  for (const game of games) {
    if (game.totalResult === 'over') {
      overs++;
    } else if (game.totalResult === 'under') {
      unders++;
    } else if (game.totalResult === 'push') {
      pushes++;
    }
  }

  const total = overs + unders;
  return {
    overs,
    unders,
    pushes,
    overPercentage: total > 0 ? (overs / total) * 100 : 0,
    sampleSize: games.length
  };
}

export async function getHomeFieldAdvantage(): Promise<HomeFieldResult> {
  const games = await db.select().from(historicalGames).where(
    and(
      sql`${historicalGames.spreadResult} IS NOT NULL`,
      eq(historicalGames.isNeutral, false)
    )
  );

  let homeCovers = 0;
  let homeCoversAsFavorite = 0;
  let homeCoversAsUnderdog = 0;
  let homeFavoriteGames = 0;
  let homeUnderdogGames = 0;

  for (const game of games) {
    const homeIsFavorite = game.homeTeam?.toUpperCase() === game.favoriteTeam?.toUpperCase();
    
    if (homeIsFavorite) {
      homeFavoriteGames++;
      if (game.spreadResult === 'cover') {
        homeCovers++;
        homeCoversAsFavorite++;
      }
    } else {
      homeUnderdogGames++;
      if (game.spreadResult === 'loss') {
        homeCovers++;
        homeCoversAsUnderdog++;
      }
    }
  }

  const totalGames = games.length;
  return {
    homeCoverRate: totalGames > 0 ? (homeCovers / totalGames) * 100 : 0,
    homeCoversAsFavorite: homeFavoriteGames > 0 ? (homeCoversAsFavorite / homeFavoriteGames) * 100 : 0,
    homeCoversAsUnderdog: homeUnderdogGames > 0 ? (homeCoversAsUnderdog / homeUnderdogGames) * 100 : 0,
    sampleSize: totalGames
  };
}

export async function getWeatherImpact(temp: number, wind: number): Promise<WeatherImpactResult> {
  const tempRange = 10;
  const windRange = 5;
  
  const games = await db.select().from(historicalGames).where(
    and(
      sql`${historicalGames.temperature} IS NOT NULL`,
      sql`${historicalGames.windMph} IS NOT NULL`,
      sql`${historicalGames.totalResult} IS NOT NULL`,
      sql`${historicalGames.totalPoints} IS NOT NULL`,
      gte(historicalGames.temperature, temp - tempRange),
      lte(historicalGames.temperature, temp + tempRange),
      gte(historicalGames.windMph, Math.max(0, wind - windRange)),
      lte(historicalGames.windMph, wind + windRange)
    )
  );

  let overs = 0;
  let unders = 0;
  const totals: number[] = [];

  for (const game of games) {
    if (game.totalPoints) {
      totals.push(game.totalPoints);
    }
    if (game.totalResult === 'over') {
      overs++;
    } else if (game.totalResult === 'under') {
      unders++;
    }
  }

  const averageTotal = totals.length > 0 ? ss.mean(totals) : 0;
  const total = overs + unders;
  const overRate = total > 0 ? (overs / total) * 100 : 50;
  const underRate = total > 0 ? (unders / total) * 100 : 50;

  let recommendation = "Normal conditions - no significant weather impact";
  if (temp < 32 && wind > 15) {
    recommendation = "Extreme cold + wind - strong under lean";
  } else if (wind > 20) {
    recommendation = "High winds - target unders, expect lower passing production";
  } else if (temp < 32) {
    recommendation = "Cold weather - slight under lean";
  } else if (temp > 85) {
    recommendation = "Hot conditions - monitor for fatigue, potential under";
  }

  return {
    averageTotal,
    overRate,
    underRate,
    sampleSize: games.length,
    recommendation
  };
}

export async function getSpreadTrends(spread: number): Promise<SpreadTrendResult> {
  const spreadRange = 0.5;
  
  const games = await db.select().from(historicalGames).where(
    and(
      sql`${historicalGames.spread} IS NOT NULL`,
      sql`${historicalGames.spreadResult} IS NOT NULL`,
      sql`${historicalGames.homeMargin} IS NOT NULL`,
      sql`ABS(${historicalGames.spread} - ${Math.abs(spread)}) <= ${spreadRange}`
    )
  );

  let covers = 0;
  let pushes = 0;
  const margins: number[] = [];

  for (const game of games) {
    if (game.homeMargin !== null) {
      margins.push(game.homeMargin);
    }
    if (game.spreadResult === 'cover') {
      covers++;
    } else if (game.spreadResult === 'push') {
      pushes++;
    }
  }

  const total = games.length;
  return {
    coverRate: total > 0 ? (covers / total) * 100 : 50,
    pushRate: total > 0 ? (pushes / total) * 100 : 0,
    sampleSize: total,
    averageMargin: margins.length > 0 ? ss.mean(margins) : 0
  };
}

export async function predictSpread(
  homeTeam: string,
  awayTeam: string,
  spread: number
): Promise<PredictionResult> {
  const [homeAts, awayAts, homeField, spreadTrends] = await Promise.all([
    getTeamAtsRecord(homeTeam, 3),
    getTeamAtsRecord(awayTeam, 3),
    getHomeFieldAdvantage(),
    getSpreadTrends(spread)
  ]);

  const keyFactors: string[] = [];
  let coverScore = 50;

  if (homeAts.winPercentage > 55) {
    coverScore += (homeAts.winPercentage - 50) * 0.3;
    keyFactors.push(`${homeTeam} strong ATS: ${formatRecord(homeAts.wins, homeAts.losses, homeAts.pushes)}`);
  } else if (homeAts.winPercentage < 45) {
    coverScore -= (50 - homeAts.winPercentage) * 0.3;
    keyFactors.push(`${homeTeam} weak ATS: ${formatRecord(homeAts.wins, homeAts.losses, homeAts.pushes)}`);
  }

  if (awayAts.winPercentage > 55) {
    coverScore -= (awayAts.winPercentage - 50) * 0.2;
    keyFactors.push(`${awayTeam} strong ATS: ${formatRecord(awayAts.wins, awayAts.losses, awayAts.pushes)}`);
  } else if (awayAts.winPercentage < 45) {
    coverScore += (50 - awayAts.winPercentage) * 0.2;
    keyFactors.push(`${awayTeam} weak ATS: ${formatRecord(awayAts.wins, awayAts.losses, awayAts.pushes)}`);
  }

  if (spread < 0) {
    coverScore += (homeField.homeCoverRate - 50) * 0.15;
    keyFactors.push(`Home field advantage: ${homeField.homeCoverRate.toFixed(1)}% cover rate`);
  }

  if (Math.abs(spread) === 3 || Math.abs(spread) === 7) {
    keyFactors.push(`Key number spread (${spread}) - higher push potential`);
  }

  const consistency = Math.abs(coverScore - 50) / 50;
  const totalSampleSize = homeAts.sampleSize + awayAts.sampleSize;
  const confidence = calculateConfidence(totalSampleSize, consistency);

  const prediction = coverScore >= 50 ? 'cover' : 'loss';

  return {
    prediction,
    confidence,
    historicalRecord: formatRecord(homeAts.wins, homeAts.losses, homeAts.pushes),
    keyFactors,
    sampleSize: totalSampleSize
  };
}

export async function predictTotal(
  homeTeam: string,
  awayTeam: string,
  total: number
): Promise<PredictionResult> {
  const [homeOU, awayOU] = await Promise.all([
    getTeamOverUnderRecord(homeTeam),
    getTeamOverUnderRecord(awayTeam)
  ]);

  const keyFactors: string[] = [];
  let overScore = 50;

  if (homeOU.overPercentage > 55) {
    overScore += (homeOU.overPercentage - 50) * 0.4;
    keyFactors.push(`${homeTeam} leans over: ${homeOU.overs}-${homeOU.unders} (${homeOU.overPercentage.toFixed(1)}%)`);
  } else if (homeOU.overPercentage < 45) {
    overScore -= (50 - homeOU.overPercentage) * 0.4;
    keyFactors.push(`${homeTeam} leans under: ${homeOU.overs}-${homeOU.unders} (${homeOU.overPercentage.toFixed(1)}%)`);
  }

  if (awayOU.overPercentage > 55) {
    overScore += (awayOU.overPercentage - 50) * 0.4;
    keyFactors.push(`${awayTeam} leans over: ${awayOU.overs}-${awayOU.unders} (${awayOU.overPercentage.toFixed(1)}%)`);
  } else if (awayOU.overPercentage < 45) {
    overScore -= (50 - awayOU.overPercentage) * 0.4;
    keyFactors.push(`${awayTeam} leans under: ${awayOU.overs}-${awayOU.unders} (${awayOU.overPercentage.toFixed(1)}%)`);
  }

  if (total > 50) {
    keyFactors.push(`High total (${total}) - historically slight under lean`);
    overScore -= 2;
  } else if (total < 40) {
    keyFactors.push(`Low total (${total}) - historically slight over lean`);
    overScore += 2;
  }

  const consistency = Math.abs(overScore - 50) / 50;
  const totalSampleSize = homeOU.sampleSize + awayOU.sampleSize;
  const confidence = calculateConfidence(totalSampleSize, consistency);

  const prediction = overScore >= 50 ? 'over' : 'under';

  return {
    prediction,
    confidence,
    historicalRecord: `O: ${homeOU.overs + awayOU.overs}, U: ${homeOU.unders + awayOU.unders}`,
    keyFactors,
    sampleSize: totalSampleSize
  };
}

export async function getMatchupAnalysis(
  homeTeam: string,
  awayTeam: string
): Promise<MatchupAnalysisResult> {
  const homeUpper = homeTeam.toUpperCase();
  const awayUpper = awayTeam.toUpperCase();

  const headToHeadGames = await db.select().from(historicalGames).where(
    or(
      and(
        sql`UPPER(${historicalGames.homeTeam}) = ${homeUpper}`,
        sql`UPPER(${historicalGames.awayTeam}) = ${awayUpper}`
      ),
      and(
        sql`UPPER(${historicalGames.homeTeam}) = ${awayUpper}`,
        sql`UPPER(${historicalGames.awayTeam}) = ${homeUpper}`
      )
    )
  );

  const [homeTeamTrends, awayTeamTrends] = await Promise.all([
    getTeamAtsRecord(homeTeam, 3),
    getTeamAtsRecord(awayTeam, 3)
  ]);

  let homeWins = 0;
  let awayWins = 0;
  let homeCovers = 0;
  let awayCovers = 0;
  let overs = 0;
  let unders = 0;
  const totalPointsList: number[] = [];

  for (const game of headToHeadGames) {
    const isCurrentHome = game.homeTeam?.toUpperCase() === homeUpper;
    
    if (game.homeScore !== null && game.awayScore !== null) {
      if (isCurrentHome) {
        if (game.homeScore > game.awayScore) homeWins++;
        else awayWins++;
      } else {
        if (game.awayScore > game.homeScore) homeWins++;
        else awayWins++;
      }
    }

    if (game.spreadResult) {
      const homeIsFavorite = game.favoriteTeam?.toUpperCase() === homeUpper;
      if (game.spreadResult === 'cover' && homeIsFavorite) {
        homeCovers++;
      } else if (game.spreadResult === 'loss' && !homeIsFavorite) {
        homeCovers++;
      } else if (game.spreadResult !== 'push') {
        awayCovers++;
      }
    }

    if (game.totalResult === 'over') overs++;
    else if (game.totalResult === 'under') unders++;

    if (game.totalPoints) totalPointsList.push(game.totalPoints);
  }

  const averageTotalPoints = totalPointsList.length > 0 ? ss.mean(totalPointsList) : 0;

  let recommendation = "";
  if (headToHeadGames.length < 3) {
    recommendation = "Limited head-to-head data - rely on individual team trends";
  } else if (homeCovers > awayCovers * 1.5) {
    recommendation = `${homeTeam} historically dominates ATS in this matchup`;
  } else if (awayCovers > homeCovers * 1.5) {
    recommendation = `${awayTeam} historically covers in this matchup`;
  } else if (overs > unders * 1.3) {
    recommendation = "This matchup trends over - consider over bets";
  } else if (unders > overs * 1.3) {
    recommendation = "This matchup trends under - consider under bets";
  } else {
    recommendation = "No significant historical edge in this matchup";
  }

  return {
    headToHead: {
      homeWins,
      awayWins,
      homeCovers,
      awayCovers,
      overs,
      unders,
      sampleSize: headToHeadGames.length
    },
    homeTeamTrends,
    awayTeamTrends,
    averageTotalPoints,
    recommendation
  };
}

export const PredictionEngine = {
  getTeamAtsRecord,
  getTeamOverUnderRecord,
  getHomeFieldAdvantage,
  getWeatherImpact,
  getSpreadTrends,
  predictSpread,
  predictTotal,
  getMatchupAnalysis
};
