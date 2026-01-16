/**
 * AI QUICK ANALYSIS API ROUTE
 * Generates instant game analysis using AI
 */

import { NextRequest, NextResponse } from 'next/server';

interface AnalysisRequest {
  homeTeam: string;
  awayTeam: string;
  spread: number;
  total: number;
}

// Simulated AI analysis - in production, call Gemini/OpenAI
function generateAnalysis(data: AnalysisRequest): string {
  const { homeTeam, awayTeam, spread, total } = data;
  
  const favorite = spread < 0 ? homeTeam : awayTeam;
  const underdog = spread < 0 ? awayTeam : homeTeam;
  const spreadAbs = Math.abs(spread);
  
  const analyses = [
    `Model projects ${favorite} to cover the ${spreadAbs}-point spread with 58% confidence. Key edge: ${favorite}'s red zone efficiency (72%) vs ${underdog}'s struggling secondary. The total of ${total} leans OVER given both teams' pace metrics.`,
    
    `Sharp money has moved the line from ${spreadAbs - 0.5} to ${spreadAbs}, indicating professional confidence in ${favorite}. However, reverse line movement detected — public on ${favorite} but line moving toward ${underdog}. Proceed with caution.`,
    
    `Weather analysis: Wind at 12mph creates slight UNDER pressure. ${awayTeam}'s passing game efficiency drops 8% in similar conditions. Consider live betting once wind direction confirmed.`,
    
    `Situational spot alert: ${underdog} is 7-2 ATS as an underdog of 3+ points following a loss. ${favorite} is 4-6 ATS as a home favorite in divisional games. Edge: ${underdog} +${spreadAbs}.`,
    
    `5-Vector Analysis complete. Physics: ${Math.floor(Math.random() * 20 + 60)}/100 | Geometry: ${Math.floor(Math.random() * 20 + 55)}/100 | Market: ${Math.floor(Math.random() * 20 + 50)}/100. Composite suggests ${Math.random() > 0.5 ? 'value on ' + underdog : 'hold on ' + favorite}.`,
  ];
  
  return analyses[Math.floor(Math.random() * analyses.length)];
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    
    if (!body.homeTeam || !body.awayTeam) {
      return NextResponse.json(
        { error: 'Missing required fields: homeTeam, awayTeam' },
        { status: 400 }
      );
    }
    
    const analysis = generateAnalysis(body);
    
    // Simulate slight delay for realism
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    return NextResponse.json({ 
      analysis,
      timestamp: new Date().toISOString(),
      confidence: Math.random() * 0.3 + 0.5, // 50-80% confidence
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}
