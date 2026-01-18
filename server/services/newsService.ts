import Parser from 'rss-parser';
import { logger } from "../infrastructure/logger";

export interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
}

interface RSSFeedConfig {
  url: string;
  source: string;
}

const DEFAULT_RSS_FEEDS: RSSFeedConfig[] = [
  { url: 'https://www.espn.com/espn/rss/nfl/news', source: 'ESPN' },
  { url: 'https://www.nfl.com/rss/rsslanding?searchString=home', source: 'NFL.com' },
  { url: 'https://profootballtalk.nbcsports.com/feed/', source: 'Pro Football Talk' },
  { url: 'https://sports.yahoo.com/nfl/rss.xml', source: 'Yahoo Sports' },
  { url: 'https://bleacherreport.com/rss/NFL.rss', source: 'Bleacher Report' },
];

function parseFeedList(raw: string | undefined): RSSFeedConfig[] {
  if (!raw) return [];

  const parsed = safeParseFeedJson(raw);
  if (parsed) {
    return parsed
      .filter((entry) => entry?.url && entry?.source)
      .map((entry) => ({
        url: String(entry.url),
        source: String(entry.source),
      }));
  }

  return raw
    .split(/\r?\n|;/g)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [source, url] = line.split("|").map((value) => value.trim());
      if (!source || !url) return null;
      return { source, url };
    })
    .filter((entry): entry is RSSFeedConfig => !!entry);
}

function safeParseFeedJson(raw: string): Array<{ url?: string; source?: string }> | null {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    logger.warn({
      type: "news_feed_parse_failed",
      message: "Failed to parse NEWS_RSS_FEEDS",
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

const EXTRA_RSS_FEEDS = parseFeedList(process.env.NEWS_RSS_FEEDS);
const RSS_FEEDS: RSSFeedConfig[] = [...DEFAULT_RSS_FEEDS, ...EXTRA_RSS_FEEDS];

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; NFLIntelBot/1.0)',
  },
});

let newsCache: { items: NewsItem[]; timestamp: number } | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000;

function cleanDescription(desc: string | undefined): string {
  if (!desc) return '';
  return desc
    .replaceAll(/<[^>]*>/g, '')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .trim()
    .slice(0, 200);
}

function formatPubDate(dateStr: string | undefined): string {
  if (!dateStr) return new Date().toISOString();
  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replaceAll(/[^\w\s]/g, '')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

function calculateTitleSimilarity(title1: string, title2: string): number {
  const normalized1 = normalizeTitle(title1);
  const normalized2 = normalizeTitle(title2);
  
  if (normalized1 === normalized2) return 1;
  
  const words1 = new Set(normalized1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(normalized2.split(' ').filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let intersection = 0;
  Array.from(words1).forEach(word => {
    if (words2.has(word)) intersection++;
  });
  
  const union = words1.size + words2.size - intersection;
  return intersection / union;
}

function deduplicateByTitleSimilarity(items: NewsItem[], threshold = 0.6): NewsItem[] {
  const unique: NewsItem[] = [];
  
  for (const item of items) {
    const isDuplicate = unique.some(
      existing => calculateTitleSimilarity(existing.title, item.title) >= threshold
    );
    
    if (!isDuplicate) {
      unique.push(item);
    }
  }
  
  return unique;
}

async function fetchFeed(config: RSSFeedConfig): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(config.url);
    const items = (feed.items || []).slice(0, 10).map(item => ({
      title: item.title || 'Untitled',
      description: cleanDescription(item.contentSnippet || item.content || item.summary),
      link: item.link || '',
      pubDate: formatPubDate(item.pubDate || item.isoDate),
      source: config.source,
    }));
    // Successfully fetched items
    return items;
  } catch (error) {
    logger.warn({
      type: "news_feed_fetch_failed",
      source: config.source,
      url: config.url,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function getNflNews(forceRefresh = false): Promise<NewsItem[]> {
  const now = Date.now();
  
  if (!forceRefresh && newsCache && (now - newsCache.timestamp) < CACHE_DURATION_MS) {
    // Returning cached NFL news
    return newsCache.items;
  }
  
  // Fetching NFL news from RSS feeds
  
  const feedPromises = RSS_FEEDS.map(feed => fetchFeed(feed));
  const results = await Promise.allSettled(feedPromises);
  
  const allItems: NewsItem[] = [];
  let successCount = 0;
  let failCount = 0;
  
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
      if (result.value.length > 0) successCount++;
    } else {
      failCount++;
      // Feed fetch rejected (non-critical)
    }
  }
  
  // Fetched from multiple sources
  
  allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  
  const uniqueItems = deduplicateByTitleSimilarity(allItems);
  
  const items = uniqueItems.slice(0, 20);
  
  newsCache = { items, timestamp: now };
  // Cached unique NFL news items
  
  return items;
}

export const NewsService = {
  getNflNews,
};
