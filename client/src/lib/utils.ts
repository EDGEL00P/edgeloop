import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine Tailwind CSS classes with conflict resolution
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

interface Team {
  id: string;
  abbreviation: string;
  name: string;
}

interface GameFuture {
  homeTeamId: string;
  awayTeamId: string;
  [key: string]: unknown;
}

interface EnrichedGameFuture extends Omit<GameFuture, "homeTeamId" | "awayTeamId"> {
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: Team;
  awayTeam: Team;
}

/**
 * Enrich a game future with full team details
 */
export function enrichGameFuture(game: GameFuture, teams: Team[]): EnrichedGameFuture {
  const homeTeam = teams.find((t) => t.id === game.homeTeamId);
  const awayTeam = teams.find((t) => t.id === game.awayTeamId);

  return {
    ...game,
    homeTeam: homeTeam || {
      id: game.homeTeamId,
      abbreviation: game.homeTeamId.toUpperCase(),
      name: game.homeTeamId,
    },
    awayTeam: awayTeam || {
      id: game.awayTeamId,
      abbreviation: game.awayTeamId.toUpperCase(),
      name: game.awayTeamId,
    },
  };
}
