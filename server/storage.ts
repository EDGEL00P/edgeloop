import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";
import * as schema from "@shared/schema";
import type {
  User,
  InsertUser,
  NflTeam,
  InsertNflTeam,
  NflPlayer,
  InsertNflPlayer,
  NflGame,
  InsertNflGame,
  WeeklyMetrics,
  InsertWeeklyMetrics,
  ExploitSignal,
  InsertExploitSignal,
  LineMovement,
  InsertLineMovement,
  WeatherCondition,
  InsertWeatherCondition,
  DataImport,
  InsertDataImport,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getAllNflTeams(): Promise<NflTeam[]>;
  getNflTeam(id: number): Promise<NflTeam | undefined>;
  upsertNflTeam(team: InsertNflTeam): Promise<NflTeam>;

  getAllNflPlayers(): Promise<NflPlayer[]>;
  getNflPlayer(id: number): Promise<NflPlayer | undefined>;
  upsertNflPlayer(player: InsertNflPlayer): Promise<NflPlayer>;
  getPlayersByTeam(teamId: number): Promise<NflPlayer[]>;

  getAllNflGames(): Promise<NflGame[]>;
  getNflGame(id: number): Promise<NflGame | undefined>;
  upsertNflGame(game: InsertNflGame): Promise<NflGame>;
  getGamesByWeek(season: number, week: number): Promise<NflGame[]>;

  getWeeklyMetrics(season: number, week: number): Promise<WeeklyMetrics[]>;
  getTeamMetrics(teamId: number, season: number): Promise<WeeklyMetrics[]>;
  upsertWeeklyMetrics(metrics: InsertWeeklyMetrics): Promise<WeeklyMetrics>;

  getExploitSignals(season: number, week: number): Promise<ExploitSignal[]>;
  createExploitSignal(signal: InsertExploitSignal): Promise<ExploitSignal>;

  getLineMovement(gameId: number): Promise<LineMovement | undefined>;
  upsertLineMovement(movement: InsertLineMovement): Promise<LineMovement>;

  getWeatherCondition(gameId: number): Promise<WeatherCondition | undefined>;
  upsertWeatherCondition(weather: InsertWeatherCondition): Promise<WeatherCondition>;

  getAllDataImports(): Promise<DataImport[]>;
  createDataImport(dataImport: InsertDataImport): Promise<DataImport>;
  deleteDataImport(id: string): Promise<boolean>;
}

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(insertUser).returning();
    return result[0];
  }

  async getAllNflTeams(): Promise<NflTeam[]> {
    return await db.select().from(schema.nflTeams);
  }

  async getNflTeam(id: number): Promise<NflTeam | undefined> {
    const result = await db.select().from(schema.nflTeams).where(eq(schema.nflTeams.id, id));
    return result[0];
  }

  async upsertNflTeam(team: InsertNflTeam): Promise<NflTeam> {
    const result = await db.insert(schema.nflTeams).values(team)
      .onConflictDoUpdate({ target: schema.nflTeams.id, set: team })
      .returning();
    return result[0];
  }

  async getAllNflPlayers(): Promise<NflPlayer[]> {
    return await db.select().from(schema.nflPlayers);
  }

  async getNflPlayer(id: number): Promise<NflPlayer | undefined> {
    const result = await db.select().from(schema.nflPlayers).where(eq(schema.nflPlayers.id, id));
    return result[0];
  }

  async upsertNflPlayer(player: InsertNflPlayer): Promise<NflPlayer> {
    const result = await db.insert(schema.nflPlayers).values(player)
      .onConflictDoUpdate({ target: schema.nflPlayers.id, set: player })
      .returning();
    return result[0];
  }

  async getPlayersByTeam(teamId: number): Promise<NflPlayer[]> {
    return await db.select().from(schema.nflPlayers).where(eq(schema.nflPlayers.teamId, teamId));
  }

  async getAllNflGames(): Promise<NflGame[]> {
    return await db.select().from(schema.nflGames);
  }

  async getNflGame(id: number): Promise<NflGame | undefined> {
    const result = await db.select().from(schema.nflGames).where(eq(schema.nflGames.id, id));
    return result[0];
  }

  async upsertNflGame(game: InsertNflGame): Promise<NflGame> {
    const result = await db.insert(schema.nflGames).values(game)
      .onConflictDoUpdate({ target: schema.nflGames.id, set: game })
      .returning();
    return result[0];
  }

  async getGamesByWeek(season: number, week: number): Promise<NflGame[]> {
    return await db.select().from(schema.nflGames)
      .where(and(eq(schema.nflGames.season, season), eq(schema.nflGames.week, week)));
  }

  async getWeeklyMetrics(season: number, week: number): Promise<WeeklyMetrics[]> {
    return await db.select().from(schema.weeklyMetrics)
      .where(and(eq(schema.weeklyMetrics.season, season), eq(schema.weeklyMetrics.week, week)));
  }

  async getTeamMetrics(teamId: number, season: number): Promise<WeeklyMetrics[]> {
    return await db.select().from(schema.weeklyMetrics)
      .where(and(eq(schema.weeklyMetrics.teamId, teamId), eq(schema.weeklyMetrics.season, season)));
  }

  async upsertWeeklyMetrics(metrics: InsertWeeklyMetrics): Promise<WeeklyMetrics> {
    const result = await db.insert(schema.weeklyMetrics).values(metrics)
      .onConflictDoUpdate({ target: schema.weeklyMetrics.id, set: metrics })
      .returning();
    return result[0];
  }

  async getExploitSignals(season: number, week: number): Promise<ExploitSignal[]> {
    return await db.select().from(schema.exploitSignals)
      .where(and(eq(schema.exploitSignals.season, season), eq(schema.exploitSignals.week, week)));
  }

  async createExploitSignal(signal: InsertExploitSignal): Promise<ExploitSignal> {
    const result = await db.insert(schema.exploitSignals).values(signal).returning();
    return result[0];
  }

  async getLineMovement(gameId: number): Promise<LineMovement | undefined> {
    const result = await db.select().from(schema.lineMovements).where(eq(schema.lineMovements.gameId, gameId));
    return result[0];
  }

  async upsertLineMovement(movement: InsertLineMovement): Promise<LineMovement> {
    const result = await db.insert(schema.lineMovements).values(movement)
      .onConflictDoUpdate({ target: schema.lineMovements.id, set: movement })
      .returning();
    return result[0];
  }

  async getWeatherCondition(gameId: number): Promise<WeatherCondition | undefined> {
    const result = await db.select().from(schema.weatherConditions).where(eq(schema.weatherConditions.gameId, gameId));
    return result[0];
  }

  async upsertWeatherCondition(weather: InsertWeatherCondition): Promise<WeatherCondition> {
    const result = await db.insert(schema.weatherConditions).values(weather)
      .onConflictDoUpdate({ target: schema.weatherConditions.id, set: weather })
      .returning();
    return result[0];
  }

  async getAllDataImports(): Promise<DataImport[]> {
    return await db.select().from(schema.dataImports);
  }

  async createDataImport(dataImport: InsertDataImport): Promise<DataImport> {
    const result = await db.insert(schema.dataImports).values(dataImport).returning();
    return result[0];
  }

  async deleteDataImport(id: string): Promise<boolean> {
    const result = await db.delete(schema.dataImports).where(eq(schema.dataImports.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
