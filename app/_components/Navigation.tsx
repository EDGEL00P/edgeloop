'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  Target,
  Layers,
  BarChart3,
  Newspaper,
  Menu,
  X,
  Settings,
  LogOut
} from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '@/lib/store';
import { cn } from '@/lib/utils';
import { DataSyncStatus } from './DataSyncStatus';

const primaryNavItems = [
  { path: '/', icon: Calendar, label: 'Games' },
  { path: '/predictions', icon: Target, label: 'Picks' },
  { path: '/sgm', icon: Layers, label: 'SGM Builder' },
  { path: '/singularity', icon: BarChart3, label: 'Analytics' },
  { path: '/weekly', icon: Newspaper, label: 'News' },
];

const secondaryNavItems = [
  { path: '/teams', label: 'Teams' },
  { path: '/players', label: 'Players' },
  { path: '/betting', label: 'Betting' },
  { path: '/simulator', label: 'Simulator' },
  { path: '/injuries', label: 'Injuries' },
  { path: '/data', label: 'Data' },
];


export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { reduceMotion } = useSettings();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel-strong border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <motion.div 
                className="flex items-center gap-3 cursor-pointer group"
                whileHover={reduceMotion ? {} : { scale: 1.02 }}
                whileTap={reduceMotion ? {} : { scale: 0.98 }}
                data-testid="nav-logo"
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
              {primaryNavItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <motion.div
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all duration-300",
                        isActive 
                          ? "gradient-espn text-white nav-glow-active" 
                          : "text-[#A0A0A0] hover:text-white hover:bg-white/5"
                      )}
                      whileHover={reduceMotion ? {} : { scale: 1.02 }}
                      whileTap={reduceMotion ? {} : { scale: 0.97 }}
                      data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:block">
                <DataSyncStatus />
              </div>

              <Link href="/settings">
                <motion.div
                  className={cn(
                    "p-2 rounded-lg cursor-pointer transition-all duration-300",
                    location === '/settings'
                      ? "bg-[#CD1141]/20 text-[#CD1141] glow-red-subtle"
                      : "text-[#A0A0A0] hover:text-white hover:bg-white/5"
                  )}
                  whileHover={reduceMotion ? {} : { scale: 1.1 }}
                  whileTap={reduceMotion ? {} : { scale: 0.95 }}
                  data-testid="nav-settings"
                >
                  <Settings className="w-5 h-5" />
                </motion.div>
              </Link>

              <a href="/api/logout">
                <motion.div
                  className="p-2 rounded-lg cursor-pointer transition-all duration-300 text-[#A0A0A0] hover:text-red-400 hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  whileHover={reduceMotion ? {} : { scale: 1.1 }}
                  whileTap={reduceMotion ? {} : { scale: 0.95 }}
                  data-testid="nav-signout"
                >
                  <LogOut className="w-5 h-5" />
                </motion.div>
              </a>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-lg text-[#A0A0A0] hover:text-white hover:bg-white/5 transition-all duration-300"
                data-testid="mobile-menu-toggle"
              >
                <AnimatePresence mode="wait">
                  {mobileOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="fixed top-16 left-0 right-0 z-50 glass-panel-strong border-b border-white/5 lg:hidden max-h-[80vh] overflow-y-auto"
            >
              <div className="p-4 space-y-4">
                <div className="flex justify-center pb-3 border-b border-white/10">
                  <DataSyncStatus />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#A0A0A0] uppercase tracking-wider px-3 mb-2">Main</p>
                  {primaryNavItems.map((item, index) => {
                    const isActive = pathname === item.path;
                    return (
                      <motion.div
                        key={item.path}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link href={item.path}>
                          <div
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-300",
                              isActive 
                                ? "gradient-espn text-white nav-glow-active" 
                                : "text-[#A0A0A0] hover:text-white hover:bg-white/5"
                            )}
                            data-testid={`mobile-nav-${item.label.toLowerCase().replace(' ', '-')}`}
                          >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="space-y-1 pt-2 border-t border-white/10">
                  <p className="text-xs font-medium text-[#A0A0A0] uppercase tracking-wider px-3 mb-2">More</p>
                  <div className="grid grid-cols-2 gap-1">
                    {secondaryNavItems.map((item, index) => {
                      const isActive = pathname === item.path;
                      return (
                        <motion.div
                          key={item.path}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (primaryNavItems.length + index) * 0.03 }}
                        >
                          <Link href={item.path}>
                            <div
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                "px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-300 text-center",
                                isActive 
                                  ? "bg-[#CD1141]/20 text-[#CD1141] glow-red-subtle" 
                                  : "text-[#A0A0A0] hover:text-white hover:bg-white/5"
                              )}
                              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                            >
                              <span className="font-medium text-sm">{item.label}</span>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <a 
                    href="/api/logout"
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all duration-300"
                    data-testid="mobile-nav-signout"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="h-16" />
    </>
  );
}
