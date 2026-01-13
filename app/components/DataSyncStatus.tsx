'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock,
  Database,
  TrendingUp,
  Heart,
  Cloud,
  Newspaper
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSettings } from '@/lib/store';

interface SystemStatus {
  status: 'healthy' | 'degraded' | 'offline';
  lastSync: {
    games: string | null;
    odds: string | null;
    injuries: string | null;
    weather: string | null;
    news: string | null;
  };
  nextRefresh: string;
  apiQuotaRemaining: number;
  autoRefresh?: {
    isRunning: boolean;
    jobs: Record<string, { lastRun: string; nextRun: string; isRunning: boolean }>;
  };
}

type SyncStatus = 'fresh' | 'stale' | 'outdated' | 'unknown';

function getTimeSinceSync(timestamp: string | null): { minutes: number; status: SyncStatus } {
  if (!timestamp) return { minutes: -1, status: 'unknown' };
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 5) return { minutes, status: 'fresh' };
  if (minutes < 15) return { minutes, status: 'stale' };
  return { minutes, status: 'outdated' };
}

function formatTimeAgo(timestamp: string | null): string {
  if (!timestamp) return 'Never';
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return 'Over a day ago';
}

function getOverallStatus(lastSync: SystemStatus['lastSync']): SyncStatus {
  const statuses = Object.values(lastSync).map(time => getTimeSinceSync(time).status);
  if (statuses.every(s => s === 'unknown')) return 'unknown';
  if (statuses.some(s => s === 'outdated')) return 'outdated';
  if (statuses.some(s => s === 'stale')) return 'stale';
  if (statuses.some(s => s === 'fresh')) return 'fresh';
  return 'unknown';
}

const statusColors = {
  fresh: 'bg-emerald-500',
  stale: 'bg-amber-500',
  outdated: 'bg-red-500',
  unknown: 'bg-gray-500',
};

const statusBorderColors = {
  fresh: 'border-emerald-500/50',
  stale: 'border-amber-500/50',
  outdated: 'border-red-500/50',
  unknown: 'border-gray-500/50',
};

const statusLabels = {
  fresh: 'All data fresh',
  stale: 'Some data stale',
  outdated: 'Data outdated',
  unknown: 'No data yet',
};

const dataSourceIcons = {
  games: Database,
  odds: TrendingUp,
  injuries: Heart,
  weather: Cloud,
  news: Newspaper,
};

const dataSourceLabels = {
  games: 'Games',
  odds: 'Odds',
  injuries: 'Injuries',
  weather: 'Weather',
  news: 'News',
};

export function DataSyncStatus() {
  const { reduceMotion } = useSettings();
  const [countdown, setCountdown] = useState<number>(60);
  
  const { data: status, isLoading, isFetching, refetch } = useQuery<SystemStatus>({
    queryKey: ['/api/system/status'],
    refetchInterval: 10000,
    staleTime: 5000,
  });

  useEffect(() => {
    if (!status?.nextRefresh) return;
    
    const updateCountdown = () => {
      const nextRefreshTime = new Date(status.nextRefresh).getTime();
      const remaining = Math.max(0, Math.floor((nextRefreshTime - Date.now()) / 1000));
      setCountdown(remaining);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [status?.nextRefresh]);

  const overallStatus = status ? getOverallStatus(status.lastSync) : 'unknown';
  const isRefreshing = isFetching || (status?.autoRefresh?.jobs && 
    Object.values(status.autoRefresh.jobs).some(job => job.isRunning));

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
        <RefreshCw className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
        <span className="text-xs font-medium text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div 
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border cursor-pointer transition-colors hover:bg-muted/70",
              statusBorderColors[overallStatus]
            )}
            whileHover={reduceMotion ? {} : { scale: 1.02 }}
            whileTap={reduceMotion ? {} : { scale: 0.98 }}
            onClick={() => refetch()}
            data-testid="data-sync-indicator"
          >
            <div className="relative flex items-center justify-center">
              <AnimatePresence mode="wait">
                {isRefreshing ? (
                  <motion.div
                    key="refreshing"
                    initial={{ opacity: 0, rotate: -180 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 180 }}
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
                  </motion.div>
                ) : status?.status === 'offline' ? (
                  <motion.div
                    key="offline"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="online"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative"
                  >
                    <Wifi className={cn(
                      "w-3.5 h-3.5",
                      overallStatus === 'fresh' && "text-emerald-400",
                      overallStatus === 'stale' && "text-amber-400",
                      overallStatus === 'outdated' && "text-red-400",
                      overallStatus === 'unknown' && "text-gray-400"
                    )} />
                    {overallStatus === 'fresh' && (
                      <span className={cn(
                        "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full",
                        statusColors[overallStatus],
                        !reduceMotion && "animate-pulse"
                      )} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {isRefreshing ? 'Syncing...' : statusLabels[overallStatus]}
              </span>
              
              {!isRefreshing && countdown > 0 && countdown < 120 && (
                <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground/70">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{countdown}s</span>
                </div>
              )}
            </div>
          </motion.div>
        </TooltipTrigger>
        
        <TooltipContent side="bottom" className="w-72 p-0" data-testid="sync-status-tooltip">
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">Data Sync Status</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                status?.status === 'healthy' && "bg-emerald-500/20 text-emerald-400",
                status?.status === 'degraded' && "bg-amber-500/20 text-amber-400",
                status?.status === 'offline' && "bg-red-500/20 text-red-400"
              )}>
                {status?.status || 'Unknown'}
              </span>
            </div>
            
            <div className="space-y-2">
              {status?.lastSync && Object.entries(status.lastSync).map(([source, time]) => {
                const { status: syncStatus, minutes } = getTimeSinceSync(time);
                const Icon = dataSourceIcons[source as keyof typeof dataSourceIcons];
                
                return (
                  <div 
                    key={source} 
                    className="flex items-center justify-between text-xs"
                    data-testid={`sync-source-${source}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {dataSourceLabels[source as keyof typeof dataSourceLabels]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground/80">
                        {formatTimeAgo(time)}
                      </span>
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        statusColors[syncStatus]
                      )} />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {status?.nextRefresh && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Next refresh</span>
                  <span className="text-foreground/80">
                    {countdown > 0 ? `${countdown}s` : 'Now'}
                  </span>
                </div>
              </div>
            )}
            
            {status?.apiQuotaRemaining !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">API quota remaining</span>
                <span className="text-foreground/80">{status.apiQuotaRemaining}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function DataSyncStatusCompact() {
  const { reduceMotion } = useSettings();
  
  const { data: status, isFetching } = useQuery<SystemStatus>({
    queryKey: ['/api/system/status'],
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const overallStatus = status ? getOverallStatus(status.lastSync) : 'unknown';

  return (
    <div 
      className="flex items-center gap-1"
      data-testid="data-sync-compact"
    >
      <div className="relative">
        {isFetching ? (
          <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
        ) : (
          <>
            <div className={cn(
              "w-2.5 h-2.5 rounded-full",
              statusColors[overallStatus],
              overallStatus === 'fresh' && !reduceMotion && "animate-pulse"
            )} />
          </>
        )}
      </div>
    </div>
  );
}
