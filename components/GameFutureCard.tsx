import { motion } from 'framer-motion';
import { GameFuture } from '@/lib/data';
import { useSettings } from '@/lib/store';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Clock, 
  Zap,
  ChevronRight
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface GameFutureCardProps {
  game: GameFuture;
  index: number;
  onClick?: () => void;
}

export function GameFutureCard({ game, index, onClick }: GameFutureCardProps) {
  const { scanMode, reduceMotion, futureSlider } = useSettings();

  const adjustedWinProb = Math.min(0.95, Math.max(0.05, 
    game.winProbHome + (futureSlider - 50) * 0.002 * (game.momentum === 'home' ? 1 : -1)
  ));

  const getMomentumIcon = () => {
    switch (game.momentum) {
      case 'home': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'away': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getEdgeColor = (edge: number) => {
    if (edge > 1.5) return 'text-green-400';
    if (edge < -1.5) return 'text-red-400';
    return 'text-yellow-400';
  };

  if (scanMode) {
    return (
      <motion.div
        initial={reduceMotion ? {} : { opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="glass rounded-lg p-3 border border-border/50 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
        onClick={onClick}
        data-testid={`game-card-scan-${game.id}`}
      >
        <div className="flex items-center gap-3">
          <div className="font-display text-sm">
            <span className="text-primary">{game.awayTeam.abbreviation}</span>
            <span className="text-muted-foreground mx-1">@</span>
            <span className="text-secondary">{game.homeTeam.abbreviation}</span>
          </div>
          {getMomentumIcon()}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-mono">{(adjustedWinProb * 100).toFixed(0)}%</span>
          <span className={cn("font-mono", getEdgeColor(game.spreadEdge))}>
            {game.spreadEdge > 0 ? '+' : ''}{game.spreadEdge.toFixed(1)}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={reduceMotion ? {} : { scale: 1.02, y: -4 }}
      className="glass rounded-xl p-5 border border-border/50 hover:border-primary/50 transition-all cursor-pointer noise relative overflow-hidden group"
      onClick={onClick}
      data-testid={`game-card-${game.id}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-neon-violet/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{game.kickoff}</span>
            <span className="px-2 py-0.5 rounded-full bg-muted text-xs">Week {game.week}</span>
          </div>
          {getMomentumIcon()}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-center flex-1">
            <div className="font-display text-lg tracking-wide">{game.awayTeam.abbreviation}</div>
            <div className="text-xs text-muted-foreground mt-1">{(1 - adjustedWinProb) * 100 | 0}%</div>
          </div>
          <div className="px-4">
            <div className="text-xs text-muted-foreground">vs</div>
          </div>
          <div className="text-center flex-1">
            <div className="font-display text-lg tracking-wide text-glow-cyan">{game.homeTeam.abbreviation}</div>
            <div className="text-xs text-primary mt-1">{(adjustedWinProb * 100).toFixed(0)}%</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1">Spread</div>
                <div className="font-mono text-sm">{game.spread > 0 ? '+' : ''}{game.spread}</div>
                <div className={cn("text-xs mt-1", getEdgeColor(game.spreadEdge))}>
                  Edge: {game.spreadEdge > 0 ? '+' : ''}{game.spreadEdge.toFixed(1)}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Market spread vs predicted edge</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1">Total</div>
                <div className="font-mono text-sm">{game.total}</div>
                <div className={cn("text-xs mt-1", getEdgeColor(game.totalEdge))}>
                  Edge: {game.totalEdge > 0 ? '+' : ''}{game.totalEdge.toFixed(1)}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Over/under projection</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="mb-4 p-2 bg-muted/20 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Drive State
          </div>
          <div className="font-mono text-xs text-primary">{game.driveState}</div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Most Likely Scripts:</div>
          {game.likelyScripts.slice(0, 2).map((script, idx) => (
            <motion.div
              key={idx}
              initial={reduceMotion ? {} : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="flex items-start gap-2 text-xs"
            >
              <span className="text-primary">→</span>
              <span className="text-muted-foreground leading-relaxed">{script}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
