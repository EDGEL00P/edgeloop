/**
 * NFL Media Service
 * 
 * Aggregates news, podcasts, and media content
 * Uses free APIs and RSS feeds
 */

import { logger } from "../infrastructure/logger";
import { getNflNews } from "./newsService";

export interface Podcast {
  id: string;
  title: string;
  description: string;
  url: string;
  audioUrl: string;
  publishedAt: string;
  duration?: number;
  source: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  url: string;
  publishedAt: string;
  source: string;
  imageUrl?: string;
  author?: string;
}

/**
 * Get NFL podcasts from free sources
 */
export async function getNflPodcasts(): Promise<Podcast[]> {
  const podcasts: Podcast[] = [];
  
  try {
    // ESPN NFL podcasts (RSS feed)
    const espnRss = "https://www.espn.com/espn/rss/nfl/news";
    // Parse RSS feed (would need RSS parser)
    
    // NFL.com podcasts
    podcasts.push({
      id: "nfl-gameday",
      title: "NFL GameDay",
      description: "Official NFL podcast",
      url: "https://www.nfl.com/podcasts",
      audioUrl: "https://www.nfl.com/podcasts/nfl-gameday",
      publishedAt: new Date().toISOString(),
      source: "NFL.com",
    });
    
    // The Ringer NFL Show
    podcasts.push({
      id: "ringer-nfl",
      title: "The Ringer NFL Show",
      description: "NFL analysis and discussion",
      url: "https://www.theringer.com/nfl",
      audioUrl: "https://www.theringer.com/podcasts/nfl-show",
      publishedAt: new Date().toISOString(),
      source: "The Ringer",
    });
    
    // Around the NFL (free podcast)
    podcasts.push({
      id: "around-nfl",
      title: "Around the NFL",
      description: "NFL.com's Around the NFL podcast",
      url: "https://www.nfl.com/podcasts/around-the-nfl",
      audioUrl: "https://www.nfl.com/podcasts/around-the-nfl",
      publishedAt: new Date().toISOString(),
      source: "NFL.com",
    });
    
  } catch (error) {
    logger.error({ type: "podcast_fetch_error", error: String(error) });
  }
  
  return podcasts;
}

/**
 * Get comprehensive NFL news
 */
export async function getComprehensiveNflNews(): Promise<NewsArticle[]> {
  const articles: NewsArticle[] = [];
  
  try {
    // Use existing news service
    const nflNews = await getNflNews();
    
    // Convert to NewsArticle format
    for (const item of nflNews) {
      articles.push({
        id: item.link || `news-${Date.now()}`,
        title: item.title || "NFL News",
        content: item.description || "",
        url: item.link || "",
        publishedAt: item.pubDate || new Date().toISOString(),
        source: item.source || "NFL",
      });
    }
    
    // Add ESPN news
    // Add NFL.com news
    // Add The Athletic (if API available)
    // Add local team news
    
  } catch (error) {
    logger.error({ type: "news_fetch_error", error: String(error) });
  }
  
  return articles;
}

/**
 * Get team-specific news
 */
export async function getTeamNews(teamAbbr: string): Promise<NewsArticle[]> {
  const allNews = await getComprehensiveNflNews();
  return allNews.filter(article => 
    article.title.toLowerCase().includes(teamAbbr.toLowerCase()) ||
    article.content.toLowerCase().includes(teamAbbr.toLowerCase())
  );
}
