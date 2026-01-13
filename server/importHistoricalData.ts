import fs from "fs";
import path from "path";
import { db } from "./db";
import { historicalGames } from "@shared/schema";

interface CsvRow {
  schedule_date: string;
  schedule_season: string;
  schedule_week: string;
  schedule_playoff: string;
  team_home: string;
  score_home: string;
  score_away: string;
  team_away: string;
  team_favorite_id: string;
  spread_favorite: string;
  over_under_line: string;
  stadium: string;
  stadium_neutral: string;
  weather_temperature: string;
  weather_wind_mph: string;
  weather_humidity: string;
  weather_detail: string;
}

const TEAM_ABBREV_TO_NAME: Record<string, string[]> = {
  ARI: ["Arizona Cardinals", "Phoenix Cardinals", "St. Louis Cardinals"],
  ATL: ["Atlanta Falcons"],
  BAL: ["Baltimore Ravens"],
  BUF: ["Buffalo Bills"],
  CAR: ["Carolina Panthers"],
  CHI: ["Chicago Bears"],
  CIN: ["Cincinnati Bengals"],
  CLE: ["Cleveland Browns"],
  DAL: ["Dallas Cowboys"],
  DEN: ["Denver Broncos"],
  DET: ["Detroit Lions"],
  GB: ["Green Bay Packers"],
  HOU: ["Houston Texans"],
  IND: ["Indianapolis Colts", "Baltimore Colts"],
  JAX: ["Jacksonville Jaguars"],
  KC: ["Kansas City Chiefs"],
  LAC: ["Los Angeles Chargers", "San Diego Chargers"],
  LAR: ["Los Angeles Rams", "St. Louis Rams"],
  LVR: ["Las Vegas Raiders", "Oakland Raiders", "Los Angeles Raiders"],
  MIA: ["Miami Dolphins"],
  MIN: ["Minnesota Vikings"],
  NE: ["New England Patriots", "Boston Patriots"],
  NO: ["New Orleans Saints"],
  NYG: ["New York Giants"],
  NYJ: ["New York Jets"],
  PHI: ["Philadelphia Eagles"],
  PIT: ["Pittsburgh Steelers"],
  SEA: ["Seattle Seahawks"],
  SF: ["San Francisco 49ers"],
  TB: ["Tampa Bay Buccaneers"],
  TEN: ["Tennessee Titans", "Houston Oilers"],
  WAS: ["Washington Commanders", "Washington Redskins", "Washington Football Team"],
};

function teamMatchesAbbrev(teamName: string, abbrev: string): boolean {
  const names = TEAM_ABBREV_TO_NAME[abbrev];
  if (names) {
    return names.some(name => name === teamName);
  }
  return false;
}

function parseNumber(value: string): number | null {
  if (!value || value.trim() === "") return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function parseBoolean(value: string): boolean {
  return value?.toUpperCase() === "TRUE";
}

function calculateSpreadResult(
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number,
  favoriteId: string,
  spread: number
): string | null {
  if (favoriteId === "PICK") return null;
  
  const homeMargin = homeScore - awayScore;
  const isHomeFavorite = teamMatchesAbbrev(homeTeam, favoriteId);
  
  const favoriteMargin = isHomeFavorite ? homeMargin : -homeMargin;
  const spreadAbs = Math.abs(spread);
  
  if (favoriteMargin > spreadAbs) return "cover";
  if (favoriteMargin === spreadAbs) return "push";
  return "loss";
}

function calculateTotalResult(
  homeScore: number,
  awayScore: number,
  overUnder: number
): string {
  const total = homeScore + awayScore;
  if (total > overUnder) return "over";
  if (total === overUnder) return "push";
  return "under";
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",");
  
  return lines.slice(1).map(line => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || "";
    });
    
    return row as unknown as CsvRow;
  });
}

async function importHistoricalData() {
  console.log("Starting historical data import...");
  
  const csvPath = path.join(process.cwd(), "attached_assets/extracted/spreadspoke_scores.csv");
  
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCsv(content);
  
  console.log(`Parsed ${rows.length} total rows from CSV`);
  
  const validRows = rows.filter(row => {
    const season = parseInt(row.schedule_season);
    if (isNaN(season) || season < 2000) return false;
    
    const homeScore = parseNumber(row.score_home);
    const awayScore = parseNumber(row.score_away);
    if (homeScore === null || awayScore === null) return false;
    
    const spread = parseNumber(row.spread_favorite);
    if (spread === null && row.team_favorite_id !== "PICK") return false;
    
    return true;
  });
  
  console.log(`Filtered to ${validRows.length} valid rows (2000+ with scores and spread data)`);
  
  const batchSize = 500;
  let imported = 0;
  
  for (let i = 0; i < validRows.length; i += batchSize) {
    const batch = validRows.slice(i, i + batchSize);
    
    const records = batch.map(row => {
      const homeScore = parseNumber(row.score_home)!;
      const awayScore = parseNumber(row.score_away)!;
      const spread = parseNumber(row.spread_favorite);
      const overUnder = parseNumber(row.over_under_line);
      const homeMargin = homeScore - awayScore;
      const totalPoints = homeScore + awayScore;
      
      let spreadResult: string | null = null;
      if (spread !== null && row.team_favorite_id && row.team_favorite_id !== "PICK") {
        spreadResult = calculateSpreadResult(
          row.team_home,
          row.team_away,
          homeScore,
          awayScore,
          row.team_favorite_id,
          spread
        );
      }
      
      let totalResult: string | null = null;
      if (overUnder !== null) {
        totalResult = calculateTotalResult(homeScore, awayScore, overUnder);
      }
      
      return {
        gameDate: row.schedule_date,
        season: parseInt(row.schedule_season),
        week: row.schedule_week,
        isPlayoff: parseBoolean(row.schedule_playoff),
        homeTeam: row.team_home,
        awayTeam: row.team_away,
        homeScore,
        awayScore,
        favoriteTeam: row.team_favorite_id || null,
        spread: spread,
        overUnder: overUnder,
        stadium: row.stadium || null,
        isNeutral: parseBoolean(row.stadium_neutral),
        temperature: parseNumber(row.weather_temperature),
        windMph: parseNumber(row.weather_wind_mph),
        humidity: parseNumber(row.weather_humidity),
        weatherDetail: row.weather_detail || null,
        spreadResult,
        totalResult,
        homeMargin,
        totalPoints,
      };
    });
    
    await db.insert(historicalGames).values(records).onConflictDoNothing();
    imported += records.length;
    console.log(`Imported ${imported}/${validRows.length} records...`);
  }
  
  console.log(`\nImport complete! Total records imported: ${imported}`);
  process.exit(0);
}

importHistoricalData().catch(err => {
  console.error("Import failed:", err);
  process.exit(1);
});
