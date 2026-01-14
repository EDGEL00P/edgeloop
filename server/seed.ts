import { db } from "./storage";
import * as schema from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Seed teams
  const teams = [
    { id: 1, conference: 'AFC', division: 'West', location: 'Kansas City', name: 'Chiefs', fullName: 'Kansas City Chiefs', abbreviation: 'KC' },
    { id: 2, conference: 'NFC', division: 'West', location: 'San Francisco', name: '49ers', fullName: 'San Francisco 49ers', abbreviation: 'SF' },
    { id: 3, conference: 'NFC', division: 'East', location: 'Philadelphia', name: 'Eagles', fullName: 'Philadelphia Eagles', abbreviation: 'PHI' },
    { id: 4, conference: 'AFC', division: 'East', location: 'Buffalo', name: 'Bills', fullName: 'Buffalo Bills', abbreviation: 'BUF' },
    { id: 5, conference: 'NFC', division: 'North', location: 'Detroit', name: 'Lions', fullName: 'Detroit Lions', abbreviation: 'DET' },
    { id: 6, conference: 'NFC', division: 'East', location: 'Dallas', name: 'Cowboys', fullName: 'Dallas Cowboys', abbreviation: 'DAL' },
    { id: 7, conference: 'AFC', division: 'East', location: 'Miami', name: 'Dolphins', fullName: 'Miami Dolphins', abbreviation: 'MIA' },
    { id: 8, conference: 'AFC', division: 'North', location: 'Baltimore', name: 'Ravens', fullName: 'Baltimore Ravens', abbreviation: 'BAL' },
  ];

  await db.insert(schema.nflTeams).values(teams).onConflictDoNothing();
  console.log("✅ Teams seeded");

  // Seed players
  const players = [
    { id: 1, firstName: 'Patrick', lastName: 'Mahomes', teamId: 1, position: 'QB' },
    { id: 2, firstName: 'Travis', lastName: 'Kelce', teamId: 1, position: 'TE' },
    { id: 3, firstName: 'Josh', lastName: 'Allen', teamId: 4, position: 'QB' },
    { id: 4, firstName: 'Jahmyr', lastName: 'Gibbs', teamId: 5, position: 'RB' },
    { id: 5, firstName: "Ja'Marr", lastName: 'Chase', teamId: 0, position: 'WR' },
    { id: 6, firstName: 'Tyreek', lastName: 'Hill', teamId: 7, position: 'WR' },
    { id: 7, firstName: 'Brock', lastName: 'Purdy', teamId: 2, position: 'QB' },
    { id: 8, firstName: 'Christian', lastName: 'McCaffrey', teamId: 2, position: 'RB' },
    { id: 9, firstName: 'Lamar', lastName: 'Jackson', teamId: 8, position: 'QB' },
    { id: 10, firstName: 'AJ', lastName: 'Brown', teamId: 3, position: 'WR' },
  ];

  await db.insert(schema.nflPlayers).values(players).onConflictDoNothing();
  console.log("✅ Players seeded");

  console.log("🎉 Database seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
