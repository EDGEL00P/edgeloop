import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/_components/ui/card';
import { Skeleton } from '@/_components/ui/skeleton';
import { Newspaper, ExternalLink, Clock } from 'lucide-react';

interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function useNflNews() {
  return useQuery({
    queryKey: ['nfl-news'],
    queryFn: async () => {
      const response = await fetch('/api/news/nfl');
      if (!response.ok) throw new Error('Failed to fetch news');
      return response.json() as Promise<NewsItem[]>;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

function NewsItemSkeleton() {
  return (
    <div className="p-4 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

export default function NewsSection() {
  const { data: news = [], isLoading, error } = useNflNews();

  return (
    <Card className="card-premium overflow-hidden" data-testid="news-section">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Newspaper className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-display text-lg font-semibold">Latest NFL Intel</h2>
        </div>
      </div>

      <div className="divide-y divide-border/30">
        {isLoading ? (
          <>
            <NewsItemSkeleton />
            <NewsItemSkeleton />
            <NewsItemSkeleton />
            <NewsItemSkeleton />
            <NewsItemSkeleton />
          </>
        ) : error ? (
          <div className="p-6 text-center text-muted-foreground">
            <p className="text-sm">Unable to load news</p>
          </div>
        ) : news.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <p className="text-sm">No news available</p>
          </div>
        ) : (
          news.slice(0, 6).map((item, index) => (
            <motion.a
              key={`${item.link}-${index}`}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="block p-4 hover:bg-muted/30 transition-colors group"
              data-testid={`news-item-${index}`}
            >
              <div className="space-y-2">
                <h3 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                  <ExternalLink className="inline-block ml-1 w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                </h3>
                
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-muted/50 font-medium">
                    {item.source}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(item.pubDate)}
                  </span>
                </div>
              </div>
            </motion.a>
          ))
        )}
      </div>
    </Card>
  );
}
