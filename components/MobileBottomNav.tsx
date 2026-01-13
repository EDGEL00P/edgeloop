import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Home, Brain, Zap, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/lib/store';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/singularity', icon: Brain, label: 'Edge Loop' },
  { path: '/predictions', icon: Zap, label: 'Predictions' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function MobileBottomNav() {
  const [location] = useLocation();
  const { reduceMotion } = useSettings();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 glass-strong mobile-bottom-nav md:hidden"
      data-testid="mobile-bottom-nav"
    >
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <motion.div
                whileTap={reduceMotion ? {} : { scale: 0.9 }}
                className={cn(
                  "mobile-nav-item",
                  isActive && "mobile-nav-item-active"
                )}
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              >
                <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                <span className={cn(
                  "text-xs font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
                {isActive && !reduceMotion && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
