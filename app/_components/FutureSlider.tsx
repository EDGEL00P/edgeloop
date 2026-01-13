import { motion } from 'framer-motion';
import { Slider } from '@/_components/ui/slider';
import { useSettings } from '@/lib/store';
import { Clock, Zap, TrendingUp } from 'lucide-react';

export function FutureSlider() {
  const { futureSlider, setFutureSlider, reduceMotion } = useSettings();

  const getScenarioLabel = (value: number) => {
    if (value < 25) return 'Conservative';
    if (value < 50) return 'Base Case';
    if (value < 75) return 'Optimistic';
    return 'Aggressive';
  };

  const getScenarioColor = (value: number) => {
    if (value < 25) return 'text-blue-400';
    if (value < 50) return 'text-neon-cyan';
    if (value < 75) return 'text-neon-violet';
    return 'text-neon-magenta';
  };

  return (
    <motion.div
      initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4 border border-border/50"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-neon-cyan" />
          <span className="font-display text-sm tracking-wide">FUTURE SLIDER</span>
        </div>
        <div className={`flex items-center gap-1 ${getScenarioColor(futureSlider)}`}>
          <Zap className="w-3 h-3" />
          <span className="text-xs font-medium">{getScenarioLabel(futureSlider)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <Slider
          value={[futureSlider]}
          onValueChange={([value]) => setFutureSlider(value)}
          max={100}
          step={1}
          className="cursor-pointer"
          data-testid="future-slider"
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Past Trends</span>
          <span>Projection: {futureSlider}%</span>
          <span>Future States</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <TrendingUp className="w-3 h-3" />
          <span>Adjusting projections based on {getScenarioLabel(futureSlider).toLowerCase()} assumptions</span>
        </div>
      </div>
    </motion.div>
  );
}
