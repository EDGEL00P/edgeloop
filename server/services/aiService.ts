import { GoogleGenAI } from "@google/genai";
import { eq, and, or } from "drizzle-orm";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export interface QuickAnalysisRequest {
  homeTeam: string;
  awayTeam: string;
  homeWinProb?: number;
  awayWinProb?: number;
  spread?: number;
  total?: number;
}

export interface TeamAnalysisRequest {
  teamName: string;
  conference: string;
  division: string;
  wins?: number;
  losses?: number;
  pointsFor?: number;
  pointsAgainst?: number;
  streak?: string;
  playoffStatus?: string;
}

export interface MatchupAnalysisRequest {
  homeTeam: string;
  awayTeam: string;
  homeRecord?: string;
  awayRecord?: string;
  spread?: number;
  total?: number;
  venue?: string;
}

export interface ExploitAnalysisRequest {
  homeTeam: string;
  awayTeam: string;
  spread: number;
  total: number;
  publicBetPercent?: number;
  lineMovement?: number;
  weather?: { temp: number; wind: number; condition: string };
}

async function generateContent(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text = response.text;
    return text || "Analysis unavailable";
  } catch (error) {
    console.error("AI generation error:", error);
    return "AI analysis temporarily unavailable";
  }
}

export async function getQuickGameAnalysis(request: QuickAnalysisRequest): Promise<string> {
  const prompt = `You are an NFL betting analyst. Give a quick 1-2 sentence insight about this game:

${request.awayTeam} @ ${request.homeTeam}
${request.spread ? `Spread: ${request.homeTeam} ${request.spread > 0 ? '+' : ''}${request.spread}` : ''}
${request.total ? `O/U: ${request.total}` : ''}
${request.homeWinProb ? `Home win probability: ${request.homeWinProb}%` : ''}

Focus on the key betting angle or matchup edge. Be concise and actionable. Do not use asterisks or formatting.`;

  return generateContent(prompt);
}

export async function getTeamAnalysis(request: TeamAnalysisRequest): Promise<string> {
  const prompt = `You are an NFL analyst providing a team breakdown. Analyze this team:

Team: ${request.teamName}
Conference: ${request.conference} | Division: ${request.division}
${request.wins !== undefined && request.losses !== undefined ? `Record: ${request.wins}-${request.losses}` : ''}
${request.pointsFor ? `Points For: ${request.pointsFor}` : ''} ${request.pointsAgainst ? `Points Against: ${request.pointsAgainst}` : ''}
${request.streak ? `Current Streak: ${request.streak}` : ''}
${request.playoffStatus ? `Playoff Status: ${request.playoffStatus}` : ''}

Provide a 3-4 sentence analysis covering:
1. Team's current form and trajectory
2. Key strengths and weaknesses
3. Betting implications (ATS, totals trends)

Be specific and insightful. Do not use asterisks or formatting.`;

  return generateContent(prompt);
}

export async function getMatchupAnalysis(request: MatchupAnalysisRequest): Promise<string> {
  const prompt = `You are an NFL betting analyst. Provide a detailed matchup breakdown:

${request.awayTeam} @ ${request.homeTeam}
${request.venue ? `Venue: ${request.venue}` : ''}
${request.homeRecord ? `${request.homeTeam} Record: ${request.homeRecord}` : ''}
${request.awayRecord ? `${request.awayTeam} Record: ${request.awayRecord}` : ''}
${request.spread ? `Spread: ${request.homeTeam} ${request.spread > 0 ? '+' : ''}${request.spread}` : ''}
${request.total ? `O/U: ${request.total}` : ''}

Provide 4-5 sentences covering:
1. Key matchup to watch
2. Game script prediction
3. Spread analysis with pick
4. Total analysis with pick
5. Any situational edges

Be specific with your analysis. Do not use asterisks or formatting.`;

  return generateContent(prompt);
}

export async function getExploitAnalysis(request: ExploitAnalysisRequest): Promise<string> {
  const prompt = `You are an NFL sharp betting analyst detecting exploit opportunities:

Game: ${request.awayTeam} @ ${request.homeTeam}
Spread: ${request.homeTeam} ${request.spread > 0 ? '+' : ''}${request.spread}
Total: ${request.total}
${request.publicBetPercent ? `Public bet %: ${request.publicBetPercent}% on favorite` : ''}
${request.lineMovement ? `Line movement: ${request.lineMovement > 0 ? '+' : ''}${request.lineMovement} pts` : ''}
${request.weather ? `Weather: ${request.weather.temp}°F, ${request.weather.wind} mph wind, ${request.weather.condition}` : ''}

Identify any exploit signals:
- Steam moves (sharp money)
- Trap lines (public overload)
- Weather impacts on totals
- Situational spots

Provide 2-3 sentences on any exploit opportunity detected, or indicate if none found. Be concise and actionable. Do not use asterisks or formatting.`;

  return generateContent(prompt);
}

export const AIService = {
  getQuickGameAnalysis,
  getTeamAnalysis,
  getMatchupAnalysis,
  getExploitAnalysis,
};
