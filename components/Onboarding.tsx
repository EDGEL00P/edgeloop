import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Layers, 
  Eye, 
  Sliders, 
  ArrowRight, 
  X,
  Zap,
  Brain
} from 'lucide-react';

const steps = [
  {
    icon: Brain,
    title: 'Welcome to NEXUS',
    description: 'A trans-dimensional NFL analytics interface manifesting emergent insights through computationally-creative visualizations.',
    color: 'neon-cyan'
  },
  {
    icon: Sparkles,
    title: 'Game-State Futures',
    description: 'Explore probabilistic outcomes, spread edges, and momentum states for every matchup. Each card reveals likely game scripts.',
    color: 'neon-violet'
  },
  {
    icon: Layers,
    title: 'SGM Builder',
    description: 'Build same-game parlays with correlated legs. See correlation scores and risk assessments for optimal betting strategies.',
    color: 'neon-magenta'
  },
  {
    icon: Eye,
    title: 'Scan Mode',
    description: 'Toggle scan mode to condense insights into quick-read format. Perfect for rapid decision-making.',
    color: 'neon-green'
  },
  {
    icon: Sliders,
    title: 'Future Slider',
    description: 'Adjust projection scenarios from conservative to aggressive. Watch visualizations evolve based on your assumptions.',
    color: 'neon-orange'
  }
];

export function Onboarding() {
  const { showOnboarding, setOnboardingComplete, reduceMotion } = useSettings();
  const [currentStep, setCurrentStep] = useState(0);

  if (!showOnboarding) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setOnboardingComplete(true);
    }
  };

  const handleSkip = () => {
    setOnboardingComplete(true);
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        <div 
          className="absolute inset-0 bg-background/90 backdrop-blur-xl"
          onClick={handleSkip}
        />

        <motion.div
          initial={reduceMotion ? {} : { scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative glass-strong rounded-2xl border border-border/50 p-8 max-w-md w-full noise"
        >
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            data-testid="onboarding-skip"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-center mb-6">
            <motion.div
              key={currentStep}
              initial={reduceMotion ? {} : { scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={`w-20 h-20 rounded-2xl bg-${step.color}/20 flex items-center justify-center box-glow-${step.color.split('-')[1] || 'cyan'}`}
            >
              <Icon className={`w-10 h-10 text-${step.color}`} />
            </motion.div>
          </div>

          <motion.div
            key={`content-${currentStep}`}
            initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="font-display text-2xl tracking-wide mb-3 text-glow-cyan">
              {step.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {step.description}
            </p>
          </motion.div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {steps.map((_, idx) => (
                <motion.div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                  animate={idx === currentStep ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="gap-2 bg-gradient-to-r from-neon-cyan to-neon-violet hover:opacity-90"
              data-testid="onboarding-next"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Zap className="w-4 h-4" />
                  Enter Nexus
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
