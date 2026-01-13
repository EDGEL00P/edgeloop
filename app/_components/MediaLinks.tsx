'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/_components/ui/card';
import { Button } from '@/_components/ui/button';
import { Badge } from '@/_components/ui/badge';
import { Skeleton } from '@/_components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/_components/ui/tabs';
import {
  Radio,
  Tv,
  Podcast,
  Play,
  ExternalLink,
  Volume2,
  Headphones,
  Signal,
  Wifi
} from 'lucide-react';

interface MediaLink {
  id: string;
  type: 'radio' | 'tv' | 'podcast' | 'stream';
  name: string;
  description: string;
  url: string;
  icon: string;
  isLive: boolean;
  network?: string;
}

interface GameMediaLinks {
  gameId: number;
  homeTeam: string;
  awayTeam: string;
  gameDate: string;
  radioStreams: MediaLink[];
  tvBroadcasts: MediaLink[];
  podcasts: MediaLink[];
  officialStreams: MediaLink[];
}

function useGameMedia(gameId: number) {
  return useQuery({
    queryKey: ['game-media', gameId],
    queryFn: async () => {
      const response = await fetch(`/api/media/game/${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch media links');
      return response.json() as Promise<GameMediaLinks>;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!gameId,
  });
}

function getMediaIcon(type: string) {
  switch (type) {
    case 'radio':
      return <Radio className="w-4 h-4" />;
    case 'tv':
      return <Tv className="w-4 h-4" />;
    case 'podcast':
      return <Podcast className="w-4 h-4" />;
    case 'stream':
      return <Play className="w-4 h-4" />;
    default:
      return <Volume2 className="w-4 h-4" />;
  }
}

function MediaLinkCard({ link, index }: { link: MediaLink; index: number }) {
  const handleClick = () => {
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-lg border border-border/60 p-4 group cursor-pointer hover:border-border hover:shadow-lg transition-all duration-200"
      onClick={handleClick}
      data-testid={`media-link-${link.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          link.type === 'radio' ? 'bg-amber-500/10 text-amber-400' :
          link.type === 'tv' ? 'bg-blue-500/10 text-blue-400' :
          link.type === 'podcast' ? 'bg-purple-500/10 text-purple-400' :
          'bg-emerald-500/10 text-emerald-400'
        }`}>
          {getMediaIcon(link.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {link.name}
            </h4>
            {link.isLive && (
              <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-[10px] px-1.5 py-0">
                <Signal className="w-2.5 h-2.5 mr-0.5 animate-pulse" />
                LIVE
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {link.description}
          </p>
          {link.network && (
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
              {link.network}
            </span>
          )}
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          data-testid={`button-open-${link.id}`}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

function MediaSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

interface MediaLinksProps {
  gameId: number;
  compact?: boolean;
}

export default function MediaLinks({ gameId, compact = false }: MediaLinksProps) {
  const { data: media, isLoading, error } = useGameMedia(gameId);
  const [activeTab, setActiveTab] = useState('radio');

  if (isLoading) {
    return (
      <Card className="card-premium overflow-hidden" data-testid="media-links-loading">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Headphones className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-display text-lg font-semibold">Media & Broadcasts</h2>
          </div>
        </div>
        <div className="divide-y divide-border/30">
          <MediaSkeleton />
          <MediaSkeleton />
          <MediaSkeleton />
        </div>
      </Card>
    );
  }

  if (error || !media) {
    return (
      <Card className="card-premium overflow-hidden" data-testid="media-links-error">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Headphones className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-display text-lg font-semibold">Media & Broadcasts</h2>
          </div>
        </div>
        <div className="p-6 text-center text-muted-foreground">
          <p className="text-sm">Unable to load media links</p>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="card-premium overflow-hidden" data-testid="media-links-compact">
        <div className="p-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Listen/Watch</span>
          </div>
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          {media.radioStreams.slice(0, 2).map((link) => (
            <Button
              key={link.id}
              variant="outline"
              size="sm"
              className="justify-start gap-2 text-xs"
              onClick={() => window.open(link.url, '_blank')}
              data-testid={`button-compact-${link.id}`}
            >
              <Radio className="w-3 h-3" />
              {link.network?.split(' ')[0] || 'Radio'}
            </Button>
          ))}
          {media.tvBroadcasts.slice(0, 2).map((link) => (
            <Button
              key={link.id}
              variant="outline"
              size="sm"
              className="justify-start gap-2 text-xs"
              onClick={() => window.open(link.url, '_blank')}
              data-testid={`button-compact-${link.id}`}
            >
              <Tv className="w-3 h-3" />
              {link.network || 'TV'}
            </Button>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-premium overflow-hidden" data-testid="media-links-full">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Headphones className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Media & Broadcasts</h2>
              <p className="text-xs text-muted-foreground">
                {media.awayTeam} @ {media.homeTeam}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span>Live sources</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border/50 h-auto p-0 bg-transparent">
          <TabsTrigger
            value="radio"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            data-testid="tab-radio"
          >
            <Radio className="w-4 h-4 mr-2" />
            Radio
            <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">
              {media.radioStreams.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="tv"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            data-testid="tab-tv"
          >
            <Tv className="w-4 h-4 mr-2" />
            TV
            <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">
              {media.tvBroadcasts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="podcasts"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            data-testid="tab-podcasts"
          >
            <Podcast className="w-4 h-4 mr-2" />
            Podcasts
            <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">
              {media.podcasts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="streams"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            data-testid="tab-streams"
          >
            <Play className="w-4 h-4 mr-2" />
            Streams
            <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">
              {media.officialStreams.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="radio" className="m-0">
          <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
            {media.radioStreams.map((link, index) => (
              <MediaLinkCard key={link.id} link={link} index={index} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tv" className="m-0">
          <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
            {media.tvBroadcasts.map((link, index) => (
              <MediaLinkCard key={link.id} link={link} index={index} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="podcasts" className="m-0">
          <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
            {media.podcasts.map((link, index) => (
              <MediaLinkCard key={link.id} link={link} index={index} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="streams" className="m-0">
          <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
            {media.officialStreams.map((link, index) => (
              <MediaLinkCard key={link.id} link={link} index={index} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
