import { OmniEngine, calculateEV, calculateWeatherImpact, detectLineAnomalies, calculateInjuryCascade } from "../analytics/omniEngine";
import { eq, and, or } from "drizzle-orm";
import { getNflOdds, GameOdds } from "./oddsService";
import { getWeatherForVenue, WeatherData } from "./weatherService";
import { getTeamInjuries, PlayerInjury } from "./espnService";
import { storage } from "../storage";
import { logger } from "../infrastructure/logger";

export interface AutoPick {
  gameId: number;
  pickType: 'spread' | 'total' | 'moneyline';
  selection: string;
  line: number;
  odds: number;
  confidence: number;
  grade: 'A+' | 'A' | 'B+' | 'SKIP';
  reasoning: string[];
  edgePercent: number;
  riskLevel: 'low' | 'medium' | 'high';
  homeTeam?: string;
  awayTeam?: string;
  gameTime?: string;
}

interface PickAnalysis {
  evScore: number;
  lineMovementScore: number;
  weatherScore: number;
  injuryScore: number;
  trendScore: number;
  reasons: string[];
}

const POSITION_IMPACT: Record<string, number> = {
  'QB': 4.5,
  'LT': 2.0,
  'LG': 1.5,
  'C': 1.5,
  'RG': 1.5,
  'RT': 2.0,
  'WR': 1.8,
  'TE': 1.2,
  'RB': 1.5,
  'DE': 1.3,
  'DT': 1.0,
  'LB': 1.2,
  'CB': 1.5,
  'S': 1.0,
  'K': 0.8,
  'P': 0.3,
};

function getGrade(confidence: number): 'A+' | 'A' | 'B+' | 'SKIP' {
  if (confidence >= 90) return 'A+';
  if (confidence >= 80) return 'A';
  if (confidence >= 70) return 'B+';
  return 'SKIP';
}

function getRiskLevel(edgePercent: number, confidence: number): 'low' | 'medium' | 'high' {
  if (edgePercent > 5 && confidence >= 85) return 'low';
  if (edgePercent > 2 && confidence >= 70) return 'medium';
  return 'high';
}

function calculateInjuryImpact(injuries: PlayerInjury[]): { impact: number; reasons: string[] } {
  const reasons: string[] = [];
  let totalImpact = 0;

  const outPlayers = injuries.filter(i => i.status === 'Out' || i.status === 'IR');
  const doubtfulPlayers = injuries.filter(i => i.status === 'Doubtful');
  const questionablePlayers = injuries.filter(i => i.status === 'Questionable');

  for (const player of outPlayers) {
    const positionImpact = POSITION_IMPACT[player.position] || 0.5;
    totalImpact += positionImpact;
    if (positionImpact >= 2.0) {
      reasons.push(`${player.playerName} (${player.position}) OUT - high impact`);
    }
  }

  for (const player of doubtfulPlayers) {
    const positionImpact = (POSITION_IMPACT[player.position] || 0.5) * 0.7;
    totalImpact += positionImpact;
  }

  for (const player of questionablePlayers) {
    const positionImpact = (POSITION_IMPACT[player.position] || 0.5) * 0.3;
    totalImpact += positionImpact;
  }

  const oLinePositions = ['LT', 'LG', 'C', 'RG', 'RT'];
  const oLineOut = outPlayers.filter(p => oLinePositions.includes(p.position));
  if (oLineOut.length >= 2) {
    reasons.push(`O-Line cluster injury (${oLineOut.length} starters OUT)`);
    totalImpact += 2.0;
  }

  return { impact: totalImpact, reasons };
}

function analyzeSpreadPick(
  game: GameOdds,
  weather: WeatherData | null,
  homeInjuries: PlayerInjury[],
  awayInjuries: PlayerInjury[],
  lineMovement: { openingSpread: number; currentSpread: number; publicBetPercent: number } | null
): { pick: AutoPick | null; analysis: PickAnalysis } {
  const analysis: PickAnalysis = {
    evScore: 0,
    lineMovementScore: 0,
    weatherScore: 0,
    injuryScore: 0,
    trendScore: 0,
    reasons: [],
  };

  if (!game.consensus?.spread) {
    return { pick: null, analysis };
  }

  const spread = game.consensus.spread;
  const spreadPrice = game.consensus.spreadPrice || -110;

  const trueProbability = 0.50 + (Math.abs(spread) * 0.015);
  const adjustedTrueProb = spread < 0 ? trueProbability : 1 - trueProbability;
  
  const evResult = calculateEV(spreadPrice, adjustedTrueProb);
  analysis.evScore = Math.min(30, Math.max(0, evResult.edge * 200));
  
  if (evResult.edge > 0.02) {
    analysis.reasons.push(`+EV detected: ${(evResult.edge * 100).toFixed(1)}% edge`);
  }

  if (lineMovement) {
    const lineAnomalies = detectLineAnomalies(
      lineMovement.openingSpread,
      lineMovement.currentSpread,
      lineMovement.publicBetPercent
    );

    if (lineAnomalies.isSteam) {
      analysis.lineMovementScore += 20;
      analysis.reasons.push('Steam move detected - sharp money action');
    }
    if (lineAnomalies.isReverseLineMove) {
      analysis.lineMovementScore += 15;
      analysis.reasons.push('Reverse line movement - contrarian signal');
    }
    if (lineAnomalies.isTrap) {
      analysis.lineMovementScore -= 10;
      analysis.reasons.push('Potential trap line - exercise caution');
    }
  } else {
    analysis.lineMovementScore = 10;
  }

  const homeInjuryImpact = calculateInjuryImpact(homeInjuries);
  const awayInjuryImpact = calculateInjuryImpact(awayInjuries);
  
  const injuryDifferential = awayInjuryImpact.impact - homeInjuryImpact.impact;
  analysis.injuryScore = Math.min(20, Math.max(-10, injuryDifferential * 3));
  
  analysis.reasons.push(...homeInjuryImpact.reasons.map(r => `Home: ${r}`));
  analysis.reasons.push(...awayInjuryImpact.reasons.map(r => `Away: ${r}`));

  if (weather && weather.isOutdoor) {
    const weatherImpact = calculateWeatherImpact(
      weather.windSpeed,
      weather.temperature,
      weather.precipitation > 0
    );
    
    if (weatherImpact.passingDecay > 0.10) {
      analysis.weatherScore = 5;
      analysis.reasons.push(weatherImpact.recommendation);
    }
  }

  analysis.trendScore = 15;

  const totalScore = 
    analysis.evScore + 
    analysis.lineMovementScore + 
    analysis.weatherScore + 
    analysis.injuryScore + 
    analysis.trendScore + 
    20;

  const confidence = Math.min(100, Math.max(0, totalScore));
  const grade = getGrade(confidence);
  
  const selection = spread < 0 
    ? `${game.homeTeam} ${spread}` 
    : `${game.awayTeam} ${-spread}`;

  const pick: AutoPick = {
    gameId: parseInt(game.gameId) || 0,
    pickType: 'spread',
    selection,
    line: spread,
    odds: spreadPrice,
    confidence,
    grade,
    reasoning: analysis.reasons.filter(r => r.length > 0),
    edgePercent: evResult.edge * 100,
    riskLevel: getRiskLevel(evResult.edge * 100, confidence),
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    gameTime: game.commenceTime,
  };

  return { pick, analysis };
}

function analyzeTotalPick(
  game: GameOdds,
  weather: WeatherData | null,
  homeInjuries: PlayerInjury[],
  awayInjuries: PlayerInjury[]
): { pick: AutoPick | null; analysis: PickAnalysis } {
  const analysis: PickAnalysis = {
    evScore: 0,
    lineMovementScore: 0,
    weatherScore: 0,
    injuryScore: 0,
    trendScore: 0,
    reasons: [],
  };

  if (!game.consensus?.total) {
    return { pick: null, analysis };
  }

  const total = game.consensus.total;
  const totalPrice = game.consensus.totalPrice || -110;

  let weatherAdjustment = 0;
  let recommendUnder = false;

  if (weather && weather.isOutdoor) {
    const weatherImpact = calculateWeatherImpact(
      weather.windSpeed,
      weather.temperature,
      weather.precipitation > 0
    );
    
    weatherAdjustment = weatherImpact.passingDecay * total;
    
    if (weatherImpact.passingDecay > 0.08) {
      recommendUnder = true;
      analysis.weatherScore = 15;
      analysis.reasons.push(`Weather impact: -${(weatherAdjustment).toFixed(1)} pts expected. ${weatherImpact.recommendation}`);
    }
  }

  const homeInjuryImpact = calculateInjuryImpact(homeInjuries);
  const awayInjuryImpact = calculateInjuryImpact(awayInjuries);
  
  const totalInjuryImpact = homeInjuryImpact.impact + awayInjuryImpact.impact;
  
  if (totalInjuryImpact > 5) {
    recommendUnder = true;
    analysis.injuryScore = 10;
    analysis.reasons.push(`Significant injuries both sides: -${totalInjuryImpact.toFixed(1)} combined impact`);
  }

  const trueProbability = recommendUnder ? 0.55 : 0.50;
  const evResult = calculateEV(totalPrice, trueProbability);
  analysis.evScore = Math.min(25, Math.max(0, evResult.edge * 180));

  if (evResult.edge > 0.02) {
    analysis.reasons.push(`+EV on ${recommendUnder ? 'UNDER' : 'OVER'}: ${(evResult.edge * 100).toFixed(1)}% edge`);
  }

  analysis.lineMovementScore = 10;
  analysis.trendScore = 15;

  const totalScore = 
    analysis.evScore + 
    analysis.lineMovementScore + 
    analysis.weatherScore + 
    analysis.injuryScore + 
    analysis.trendScore + 
    15;

  const confidence = Math.min(100, Math.max(0, totalScore));
  const grade = getGrade(confidence);
  
  const selection = recommendUnder ? `UNDER ${total}` : `OVER ${total}`;

  const pick: AutoPick = {
    gameId: parseInt(game.gameId) || 0,
    pickType: 'total',
    selection,
    line: total,
    odds: totalPrice,
    confidence,
    grade,
    reasoning: analysis.reasons.filter(r => r.length > 0),
    edgePercent: evResult.edge * 100,
    riskLevel: getRiskLevel(evResult.edge * 100, confidence),
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    gameTime: game.commenceTime,
  };

  return { pick, analysis };
}

function analyzeMoneylinePick(
  game: GameOdds,
  homeInjuries: PlayerInjury[],
  awayInjuries: PlayerInjury[]
): { pick: AutoPick | null; analysis: PickAnalysis } {
  const analysis: PickAnalysis = {
    evScore: 0,
    lineMovementScore: 0,
    weatherScore: 0,
    injuryScore: 0,
    trendScore: 0,
    reasons: [],
  };

  if (!game.consensus?.homeMoneyline || !game.consensus?.awayMoneyline) {
    return { pick: null, analysis };
  }

  const homeML = game.consensus.homeMoneyline;
  const awayML = game.consensus.awayMoneyline;

  const homeImplied = homeML > 0 ? 100 / (homeML + 100) : -homeML / (-homeML + 100);
  const awayImplied = awayML > 0 ? 100 / (awayML + 100) : -awayML / (-awayML + 100);

  const homeInjuryImpact = calculateInjuryImpact(homeInjuries);
  const awayInjuryImpact = calculateInjuryImpact(awayInjuries);
  
  const injuryAdjustment = (awayInjuryImpact.impact - homeInjuryImpact.impact) * 0.02;
  
  const adjustedHomeProb = Math.min(0.95, Math.max(0.05, homeImplied + injuryAdjustment));
  const adjustedAwayProb = 1 - adjustedHomeProb;

  const homeEvResult = calculateEV(homeML, adjustedHomeProb);
  const awayEvResult = calculateEV(awayML, adjustedAwayProb);

  let bestSide: 'home' | 'away';
  let bestML: number;
  let bestEdge: number;
  let bestTrueProb: number;

  if (homeEvResult.edge > awayEvResult.edge) {
    bestSide = 'home';
    bestML = homeML;
    bestEdge = homeEvResult.edge;
    bestTrueProb = adjustedHomeProb;
  } else {
    bestSide = 'away';
    bestML = awayML;
    bestEdge = awayEvResult.edge;
    bestTrueProb = adjustedAwayProb;
  }

  const isUnderdog = bestML > 0;
  if (isUnderdog && bestEdge > 0.03) {
    analysis.evScore = Math.min(30, bestEdge * 250);
    analysis.reasons.push(`Underdog value: ${(bestEdge * 100).toFixed(1)}% edge on ${bestSide === 'home' ? game.homeTeam : game.awayTeam}`);
  } else if (!isUnderdog && bestEdge > 0.05) {
    analysis.evScore = Math.min(25, bestEdge * 200);
    analysis.reasons.push(`Favorite value: ${(bestEdge * 100).toFixed(1)}% edge`);
  } else {
    analysis.evScore = Math.max(0, bestEdge * 150);
  }

  if (Math.abs(injuryAdjustment) > 0.03) {
    analysis.injuryScore = 10;
    analysis.reasons.push(`Injury edge to ${injuryAdjustment > 0 ? game.homeTeam : game.awayTeam}`);
  }

  analysis.lineMovementScore = 10;
  analysis.trendScore = 10;

  const totalScore = 
    analysis.evScore + 
    analysis.lineMovementScore + 
    analysis.injuryScore + 
    analysis.trendScore + 
    10;

  const confidence = Math.min(100, Math.max(0, totalScore));
  const grade = getGrade(confidence);
  
  const selection = bestSide === 'home' 
    ? `${game.homeTeam} ML (${bestML > 0 ? '+' : ''}${bestML})`
    : `${game.awayTeam} ML (${bestML > 0 ? '+' : ''}${bestML})`;

  const pick: AutoPick = {
    gameId: parseInt(game.gameId) || 0,
    pickType: 'moneyline',
    selection,
    line: 0,
    odds: bestML,
    confidence,
    grade,
    reasoning: analysis.reasons.filter(r => r.length > 0),
    edgePercent: bestEdge * 100,
    riskLevel: getRiskLevel(bestEdge * 100, confidence),
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    gameTime: game.commenceTime,
  };

  return { pick, analysis };
}

const ESPN_TEAM_ID_MAP: Record<string, string> = {
  "Arizona Cardinals": "22", "Atlanta Falcons": "1", "Baltimore Ravens": "33", "Buffalo Bills": "2",
  "Carolina Panthers": "29", "Chicago Bears": "3", "Cincinnati Bengals": "4", "Cleveland Browns": "5",
  "Dallas Cowboys": "6", "Denver Broncos": "7", "Detroit Lions": "8", "Green Bay Packers": "9",
  "Houston Texans": "34", "Indianapolis Colts": "11", "Jacksonville Jaguars": "30", "Kansas City Chiefs": "12",
  "Los Angeles Chargers": "24", "Los Angeles Rams": "14", "Las Vegas Raiders": "13", "Miami Dolphins": "15",
  "Minnesota Vikings": "16", "New England Patriots": "17", "New Orleans Saints": "18", "New York Giants": "19",
  "New York Jets": "20", "Philadelphia Eagles": "21", "Pittsburgh Steelers": "23", "San Francisco 49ers": "25",
  "Seattle Seahawks": "26", "Tampa Bay Buccaneers": "27", "Tennessee Titans": "10", "Washington Commanders": "28",
};

function getEspnTeamId(teamName: string): string {
  return ESPN_TEAM_ID_MAP[teamName] || '0';
}

export async function generateAutoPicks(): Promise<AutoPick[]> {
  const picks: AutoPick[] = [];

  try {
    logger.info({ type: "auto_picks", message: "Starting auto picks generation" });

    const oddsData = await getNflOdds();
    
    if (!oddsData.games || oddsData.games.length === 0) {
      logger.warn({ type: "auto_picks", message: "No games with odds available" });
      return [];
    }

    for (const game of oddsData.games) {
      try {
        const [weather, homeInjuries, awayInjuries] = await Promise.all([
          getWeatherForVenue(null).catch(() => null),
          getTeamInjuries(getEspnTeamId(game.homeTeam)).catch(() => []),
          getTeamInjuries(getEspnTeamId(game.awayTeam)).catch(() => []),
        ]);

        const lineMovement = await storage.getLineMovement(parseInt(game.gameId) || 0).catch(() => null);
        
        const lineMovementData = lineMovement ? {
          openingSpread: lineMovement.openingSpread || 0,
          currentSpread: lineMovement.currentSpread || 0,
          publicBetPercent: 50,
        } : null;

        const spreadResult = analyzeSpreadPick(
          game,
          weather,
          homeInjuries || [],
          awayInjuries || [],
          lineMovementData
        );
        if (spreadResult.pick) {
          picks.push(spreadResult.pick);
        }

        const totalResult = analyzeTotalPick(
          game,
          weather,
          homeInjuries || [],
          awayInjuries || []
        );
        if (totalResult.pick) {
          picks.push(totalResult.pick);
        }

        const moneylineResult = analyzeMoneylinePick(
          game,
          homeInjuries || [],
          awayInjuries || []
        );
        if (moneylineResult.pick) {
          picks.push(moneylineResult.pick);
        }

      } catch (gameError) {
        logger.error({ 
          type: "auto_picks_game_error", 
          gameId: game.gameId,
          error: (gameError as Error).message 
        });
      }
    }

    picks.sort((a, b) => b.confidence - a.confidence);

    logger.info({ 
      type: "auto_picks", 
      message: `Generated ${picks.length} auto picks`,
      topPicks: picks.filter(p => p.grade !== 'SKIP').length
    });

    return picks;

  } catch (error) {
    logger.error({ 
      type: "auto_picks_error", 
      error: (error as Error).message 
    });
    throw error;
  }
}

export async function getTopPicks(minGrade: 'A+' | 'A' | 'B+' = 'B+'): Promise<AutoPick[]> {
  const allPicks = await generateAutoPicks();
  
  const gradeOrder = { 'A+': 0, 'A': 1, 'B+': 2, 'SKIP': 3 };
  const minGradeOrder = gradeOrder[minGrade];
  
  return allPicks.filter(pick => gradeOrder[pick.grade] <= minGradeOrder);
}

export const AutoPicksService = {
  generateAutoPicks,
  getTopPicks,
};
