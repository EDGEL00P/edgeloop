import { db } from "./storage";
import * as schema from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Seed teams
  const teams = [
    { id: 'kc', name: 'Kansas City Chiefs', abbreviation: 'KC', primaryColor: '#E31837', secondaryColor: '#FFB612', offenseRating: 94, defenseRating: 78, pace: 62, injuryImpact: -3 },
    { id: 'sf', name: 'San Francisco 49ers', abbreviation: 'SF', primaryColor: '#AA0000', secondaryColor: '#B3995D', offenseRating: 91, defenseRating: 88, pace: 58, injuryImpact: -8 },
    { id: 'phi', name: 'Philadelphia Eagles', abbreviation: 'PHI', primaryColor: '#004C54', secondaryColor: '#A5ACAF', offenseRating: 89, defenseRating: 85, pace: 55, injuryImpact: -2 },
    { id: 'buf', name: 'Buffalo Bills', abbreviation: 'BUF', primaryColor: '#00338D', secondaryColor: '#C60C30', offenseRating: 92, defenseRating: 82, pace: 64, injuryImpact: -1 },
    { id: 'det', name: 'Detroit Lions', abbreviation: 'DET', primaryColor: '#0076B6', secondaryColor: '#B0B7BC', offenseRating: 88, defenseRating: 76, pace: 67, injuryImpact: -5 },
    { id: 'dal', name: 'Dallas Cowboys', abbreviation: 'DAL', primaryColor: '#003594', secondaryColor: '#869397', offenseRating: 85, defenseRating: 80, pace: 60, injuryImpact: -4 },
    { id: 'mia', name: 'Miami Dolphins', abbreviation: 'MIA', primaryColor: '#008E97', secondaryColor: '#FC4C02', offenseRating: 90, defenseRating: 72, pace: 70, injuryImpact: -12 },
    { id: 'bal', name: 'Baltimore Ravens', abbreviation: 'BAL', primaryColor: '#241773', secondaryColor: '#9E7C0C', offenseRating: 93, defenseRating: 84, pace: 56, injuryImpact: -2 },
  ];

  await db.insert(schema.teams).values(teams).onConflictDoNothing();
  console.log("✅ Teams seeded");

  // Seed players
  const players = [
    { id: 'p1', name: 'Patrick Mahomes', team: 'KC', position: 'QB', usageRate: 100, targetsPerGame: 0, carriesPerGame: 2.3, epaContribution: 0.42, propLean: 'Over 285.5 Pass Yds', propOdds: -110, emergenceScore: 98 },
    { id: 'p2', name: 'Travis Kelce', team: 'KC', position: 'TE', usageRate: 28, targetsPerGame: 8.2, carriesPerGame: 0, epaContribution: 0.18, propLean: 'Over 72.5 Rec Yds', propOdds: -115, emergenceScore: 92 },
    { id: 'p3', name: 'Josh Allen', team: 'BUF', position: 'QB', usageRate: 100, targetsPerGame: 0, carriesPerGame: 7.1, epaContribution: 0.48, propLean: 'Over 42.5 Rush Yds', propOdds: -105, emergenceScore: 96 },
    { id: 'p4', name: 'Jahmyr Gibbs', team: 'DET', position: 'RB', usageRate: 52, targetsPerGame: 4.8, carriesPerGame: 14.2, epaContribution: 0.22, propLean: 'Over 95.5 Rush Yds', propOdds: 105, emergenceScore: 89 },
    { id: 'p5', name: "Ja'Marr Chase", team: 'CIN', position: 'WR', usageRate: 32, targetsPerGame: 10.4, carriesPerGame: 0.2, epaContribution: 0.28, propLean: 'Over 88.5 Rec Yds', propOdds: -120, emergenceScore: 94 },
    { id: 'p6', name: 'Tyreek Hill', team: 'MIA', position: 'WR', usageRate: 30, targetsPerGame: 11.1, carriesPerGame: 0.5, epaContribution: 0.31, propLean: 'Over 92.5 Rec Yds', propOdds: -105, emergenceScore: 91 },
    { id: 'p7', name: 'Brock Purdy', team: 'SF', position: 'QB', usageRate: 100, targetsPerGame: 0, carriesPerGame: 2.1, epaContribution: 0.35, propLean: 'Over 265.5 Pass Yds', propOdds: -115, emergenceScore: 88 },
    { id: 'p8', name: 'Christian McCaffrey', team: 'SF', position: 'RB', usageRate: 48, targetsPerGame: 5.5, carriesPerGame: 18.2, epaContribution: 0.38, propLean: 'Over 105.5 Rush Yds', propOdds: -110, emergenceScore: 95 },
    { id: 'p9', name: 'Lamar Jackson', team: 'BAL', position: 'QB', usageRate: 100, targetsPerGame: 0, carriesPerGame: 12.4, epaContribution: 0.52, propLean: 'Over 68.5 Rush Yds', propOdds: -115, emergenceScore: 97 },
    { id: 'p10', name: 'AJ Brown', team: 'PHI', position: 'WR', usageRate: 28, targetsPerGame: 9.8, carriesPerGame: 0.1, epaContribution: 0.25, propLean: 'Over 82.5 Rec Yds', propOdds: -110, emergenceScore: 90 },
  ];

  await db.insert(schema.players).values(players).onConflictDoNothing();
  console.log("✅ Players seeded");

  // Seed game futures
  const gameFutures = [
    {
      id: 'g1',
      homeTeamId: 'kc',
      awayTeamId: 'buf',
      winProbHome: 0.58,
      spread: -3.5,
      spreadEdge: 2.1,
      total: 52.5,
      totalEdge: -1.5,
      momentum: 'home',
      driveState: 'KC 2nd & 7 at BUF 35',
      likelyScripts: [
        'KC controls tempo with short passes, Kelce dominates intermediate',
        'BUF falls behind early, Allen airs it out in garbage time',
        'Defensive slugfest, under hits easily'
      ],
      kickoff: 'Sun 4:25 PM',
      week: 18
    },
    {
      id: 'g2',
      homeTeamId: 'sf',
      awayTeamId: 'det',
      winProbHome: 0.62,
      spread: -4.5,
      spreadEdge: 0.8,
      total: 49.5,
      totalEdge: 3.2,
      momentum: 'away',
      driveState: 'DET 1st & 10 at SF 45',
      likelyScripts: [
        'High-scoring shootout, both offenses clicking',
        'SF run game dominates, clock control wins',
        'DET Gibbs breaks out, Lions cover'
      ],
      kickoff: 'Sun 8:20 PM',
      week: 18
    },
    {
      id: 'g3',
      homeTeamId: 'phi',
      awayTeamId: 'dal',
      winProbHome: 0.55,
      spread: -2.5,
      spreadEdge: -0.5,
      total: 45.5,
      totalEdge: 1.8,
      momentum: 'neutral',
      driveState: 'Kickoff pending',
      likelyScripts: [
        'PHI run-heavy, dominates time of possession',
        'DAL secondary struggles, AJ Brown goes off',
        'Low-scoring defensive battle, under'
      ],
      kickoff: 'Mon 8:15 PM',
      week: 18
    },
    {
      id: 'g4',
      homeTeamId: 'mia',
      awayTeamId: 'bal',
      winProbHome: 0.42,
      spread: 2.5,
      spreadEdge: 1.2,
      total: 51.0,
      totalEdge: -0.8,
      momentum: 'away',
      driveState: 'BAL 3rd & 2 at MIA 12',
      likelyScripts: [
        'BAL Lamar rushing TDs, Ravens cover easily',
        'MIA speed causes problems, Tyreek explosive plays',
        'Weather affects passing, run game decides'
      ],
      kickoff: 'Thu 8:20 PM',
      week: 18
    },
  ];

  await db.insert(schema.gameFutures).values(gameFutures).onConflictDoNothing();
  console.log("✅ Game futures seeded");

  // Seed SGM legs
  const sgmLegs = [
    { id: 'l1', gameId: 'g1', description: 'KC -3.5', odds: -110, correlation: 0, correlationNote: 'Base outcome', risk: 'medium' },
    { id: 'l2', gameId: 'g1', description: 'Mahomes Over 285.5 Pass Yds', odds: -110, correlation: 0.65, correlationNote: 'High correlation with KC win', risk: 'low' },
    { id: 'l3', gameId: 'g1', description: 'Kelce Over 72.5 Rec Yds', odds: -115, correlation: 0.72, correlationNote: 'Mahomes targets Kelce heavily when ahead', risk: 'low' },
    { id: 'l4', gameId: 'g1', description: 'Kelce Anytime TD', odds: 110, correlation: 0.58, correlationNote: 'Red zone target leader', risk: 'medium' },
    { id: 'l5', gameId: 'g1', description: 'Over 52.5 Total', odds: -110, correlation: 0.45, correlationNote: 'Both offenses elite', risk: 'medium' },
    { id: 'l6', gameId: 'g1', description: 'Allen Over 42.5 Rush Yds', odds: -105, correlation: -0.35, correlationNote: 'Negative correlation - BUF rushing when behind', risk: 'high' },
  ];

  await db.insert(schema.sgmLegs).values(sgmLegs).onConflictDoNothing();
  console.log("✅ SGM legs seeded");

  // Seed data imports
  const dataImports = [
    { id: 'd1', filename: 'player_stats_2024.csv', rows: 1842, columns: ['player_id', 'name', 'team', 'position', 'yards', 'tds', 'epa'], status: 'loaded' },
    { id: 'd2', filename: 'game_outcomes.json', rows: 272, columns: ['game_id', 'home_team', 'away_team', 'score', 'spread_result'], status: 'loaded' },
    { id: 'd3', filename: 'injury_report.csv', rows: 156, columns: ['player_id', 'status', 'injury_type', 'estimated_return'], status: 'loaded' },
  ];

  await db.insert(schema.dataImports).values(dataImports).onConflictDoNothing();
  console.log("✅ Data imports seeded");

  console.log("🎉 Database seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
