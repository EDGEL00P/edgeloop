import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function enrichGameFuture(game: any, teams: any[]) {
  const homeTeam = teams.find(t => t.id === game.homeTeamId);
  const awayTeam = teams.find(t => t.id === game.awayTeamId);
  
  return {
    ...game,
    homeTeam: homeTeam || { id: game.homeTeamId, abbreviation: game.homeTeamId.toUpperCase(), name: game.homeTeamId },
    awayTeam: awayTeam || { id: game.awayTeamId, abbreviation: game.awayTeamId.toUpperCase(), name: game.awayTeamId },
  };
}
