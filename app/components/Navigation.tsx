'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar,
  Target,
  BarChart3,
  TrendingUp,
  PlayCircle,
  FileBarChart,
  Brain,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/', icon: Brain, label: 'edgeloop' },
  { path: '/schedule', icon: Calendar, label: 'Schedule' },
  { path: '/picks', icon: Target, label: 'Picks' },
  { path: '/standings', icon: BarChart3, label: 'Standings' },
  { path: '/props', icon: TrendingUp, label: 'Props' },
  { path: '/live', icon: PlayCircle, label: 'Live' },
  { path: '/backtest', icon: FileBarChart, label: 'Backtest' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel-strong border-b border-white/5">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <motion.div
              className="flex items-center gap-3 cursor-pointer group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-lg gradient-espn flex items-center justify-center shadow-lg glow-red-subtle group-hover:glow-red transition-all duration-300">
                  <span className="font-bold text-sm text-white tracking-tight">NFL</span>
                </div>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-semibold text-sm text-white leading-tight group-hover:text-glow-red transition-all duration-300">
                  Edge Loop
                </span>
                <span className="text-[10px] text-[#A0A0A0] uppercase tracking-wider">
                  Intelligence
                </span>
              </div>
            </motion.div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <motion.div
                    className={cn(
                      'relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-lg border border-white/20"
                        layoutId="activeNav"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
