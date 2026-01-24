import Parser from "rss-parser";

export interface NewsItem {
  title?: string;
  source?: string;
  pubDate?: string;
  link?: string;
}

type FeedConfig = {
  source: string;
  url: string;
};

const DEFAULT_FEEDS: FeedConfig[] = [
  { source: "ESPN", url: "https://www.espn.com/espn/rss/nfl/news" },
  { source: "CBS Sports", url: "https://www.cbssports.com/rss/headlines/nfl/" },
  { source: "NFL.com", url: "https://www.nfl.com/news/rss.xml" },
];

const parser = new Parser({ timeout: 8000 });

function hostnameFromUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, "");
  } catch {
    return "Unknown";
  }
}

function coerceFeed(entry: unknown): FeedConfig | null {
  if (!entry) return null;

  if (typeof entry === "string") {
    const value = entry.trim();
    if (!value) return null;

    if (value.includes("|")) {
      const [source, url] = value.split("|").map((part) => part.trim());
      if (!url) return null;
      return { source: source || hostnameFromUrl(url), url };
    }

    return { source: hostnameFromUrl(value), url: value };
  }

  if (typeof entry === "object") {
    const maybe = entry as { source?: string; url?: string };
    if (!maybe.url) return null;
    return { source: maybe.source?.trim() || hostnameFromUrl(maybe.url), url: maybe.url };
  }

  return null;
}

function parseFeedConfig(raw: string | undefined): FeedConfig[] {
  if (!raw) return DEFAULT_FEEDS;

  try {
    if (raw.trim().startsWith("[")) {
      const parsed = JSON.parse(raw) as unknown[];
      const feeds = parsed.map(coerceFeed).filter(Boolean) as FeedConfig[];
      return feeds.length > 0 ? feeds : DEFAULT_FEEDS;
    }
  } catch {
    // fall through to token parsing
  }

  const tokens = raw
    .split(/[,\n]/)
    .map((token) => token.trim())
    .filter(Boolean);

  const feeds = tokens.map(coerceFeed).filter(Boolean) as FeedConfig[];
  return feeds.length > 0 ? feeds : DEFAULT_FEEDS;
}

function normalizeDate(pubDate?: string): string | undefined {
  if (!pubDate) return undefined;
  const time = Date.parse(pubDate);
  if (Number.isNaN(time)) return undefined;
  return new Date(time).toISOString();
}

async function fetchFeed(feed: FeedConfig): Promise<NewsItem[]> {
  try {
    const result = await parser.parseURL(feed.url);
    return (result.items || [])
      .map((item) => ({
        title: item.title ?? undefined,
        source: feed.source,
        pubDate: normalizeDate(item.pubDate ?? item.isoDate),
        link: item.link ?? item.guid ?? undefined,
      }))
      .filter((item) => item.title || item.link);
  } catch (error) {
    // Keep failures soft; return partial data from other feeds
    console.warn("rss_feed_error", { feed: feed.source, url: feed.url, error: String(error) });
    return [];
  }
}

export async function getNflNews(limit = 40): Promise<NewsItem[]> {
  const feeds = parseFeedConfig(process.env.NEWS_RSS_FEEDS);
  if (feeds.length === 0) return [];

  const results = await Promise.allSettled(feeds.map(fetchFeed));
  const combined = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));

  const deduped: NewsItem[] = [];
  const seen = new Set<string>();

  combined
    .sort((a, b) => {
      const aTime = a.pubDate ? Date.parse(a.pubDate) : 0;
      const bTime = b.pubDate ? Date.parse(b.pubDate) : 0;
      return bTime - aTime;
    })
    .forEach((item) => {
      const key = item.link || `${item.source}-${item.title}`;
      if (!key || seen.has(key)) return;
      seen.add(key);
      deduped.push(item);
    });

  return deduped.slice(0, limit);
}
