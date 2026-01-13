'use client';

import { motion } from 'framer-motion';
import { useSettings } from '@/lib/store';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Settings as SettingsIcon, 
  Sparkles, 
  Eye, 
  Palette,
  RotateCcw,
  Info,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { 
    reduceMotion, 
    setReduceMotion, 
    themeIntensity, 
    setThemeIntensity,
    setShowOnboarding,
    resetSettings
  } = useSettings();

  const intensityOptions: Array<{ value: 'low' | 'normal' | 'high'; label: string; description: string }> = [
    { value: 'low', label: 'Subtle', description: 'Muted colors, minimal glow' },
    { value: 'normal', label: 'Balanced', description: 'Default neon intensity' },
    { value: 'high', label: 'Intense', description: 'Maximum visual impact' },
  ];

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6"
        >
          <h1 className="font-display text-3xl tracking-wider text-glow-cyan mb-2">
            SETTINGS
          </h1>
          <p className="text-muted-foreground text-sm">
            Configure your NEXUS experience
          </p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 border border-border/50 space-y-6"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-border/50">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display tracking-wide">Accessibility</h2>
              <p className="text-xs text-muted-foreground">Motion and visual preferences</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="reduce-motion" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                Reduce Motion
              </Label>
              <p className="text-xs text-muted-foreground">
                Disable animations and transitions for better performance
              </p>
            </div>
            <Switch
              id="reduce-motion"
              checked={reduceMotion}
              onCheckedChange={setReduceMotion}
              data-testid="toggle-reduce-motion"
            />
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6 border border-border/50 space-y-6"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-border/50">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Palette className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h2 className="font-display tracking-wide">Theme Intensity</h2>
              <p className="text-xs text-muted-foreground">Control neon glow and color saturation</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {intensityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setThemeIntensity(option.value)}
                className={cn(
                  "p-4 rounded-xl border transition-all text-left",
                  themeIntensity === option.value
                    ? "bg-primary/20 border-primary/50 box-glow-cyan"
                    : "bg-muted/30 border-border/50 hover:border-muted-foreground/50"
                )}
                data-testid={`theme-intensity-${option.value}`}
              >
                <div className="font-display text-sm mb-1">{option.label}</div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </button>
            ))}
          </div>

          <div className="flex items-start gap-2 p-3 bg-muted/20 rounded-lg">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Higher intensity may impact battery life on mobile devices. 
              Reduce motion is recommended for sensitive users.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6 border border-border/50 space-y-6"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-border/50">
            <div className="w-10 h-10 rounded-xl bg-neon-violet/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-neon-violet" />
            </div>
            <div>
              <h2 className="font-display tracking-wide">Quick Actions</h2>
              <p className="text-xs text-muted-foreground">Manage your NEXUS experience</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowOnboarding(true)}
              data-testid="replay-onboarding"
            >
              <Eye className="w-4 h-4 mr-2" />
              Replay Onboarding Tour
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={resetSettings}
              data-testid="reset-settings"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset All Settings
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-muted-foreground py-4"
        >
          <p>NEXUS v1.0.0 • Trans-Dimensional NFL Analytics</p>
          <p className="mt-1">Built with post-singularity aesthetics</p>
        </motion.div>
      </div>
    </div>
  );
}
