"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  Activity,
  Cpu,
  Gauge,
  Menu,
  Moon,
  Network,
  Newspaper,
  Sun,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { DashboardProps } from "../types/dashboard.types";
import ExploitCard from "./ExploitCard";
import { getTeamColors } from "../utils/nfl-team-colors";

const Charts = dynamic(() => import("./Charts"), {
  ssr: false,
  loading: () => <div className="h-44 rounded-2xl border border-border/60 bg-secondary/30" />,
});

const sidebarLinks = [
  { id: "scoreboard", label: "Scoreboard", icon: Gauge },
  { id: "exploits", label: "Exploits", icon: Zap },
  { id: "markets", label: "Markets", icon: BarChart3 },
  { id: "news", label: "News", icon: Newspaper },
];


const defaultOddsTrend = [
  { label: "W1", value: 42 },
  { label: "W2", value: 48 },
  { label: "W3", value: 41 },
  { label: "W4", value: 50 },
  { label: "W5", value: 47 },
];

const defaultTeamStats = [
  { label: "Off", value: 78 },
  { label: "Def", value: 65 },
  { label: "ST", value: 54 },
  { label: "Inj", value: 22 },
];

const defaultEdgeRisk = [
  { label: "Edge", edge: 70, risk: 45 },
  { label: "Risk", edge: 55, risk: 75 },
  { label: "Totals", edge: 64, risk: 40 },
];

/**
 * Dashboard Client Component
 * 
 * Main client-side dashboard component displaying NFL analytics, scoreboard,
 * exploits, injuries, and news feeds.
 * 
 * Features:
 * - Fixed sidebar navigation with mobile hamburger menu
 * - Live ticker for news updates
 * - Scoreboard with game data
 * - Analytics charts (odds trends, team stats, edge/risk)
 * - Exploit signals and injury watch
 * - News feed with pagination
 * - Theme toggle (dark/light/high-contrast)
 * 
 * @module app/components/DashboardClient
 */

import type React from "react";

export default function DashboardClient({
  health,
  newsItems,
  oddsCount,
  scoreboard,
  tickerItems,
  apiBase,
  season,
  week,
  newsError,
  oddsError,
  gamesError,
  exploits,
  injuries,
  oddsTrend,
  teamStats,
  edgeRisk,
  exploitsError,
  injuriesError,
}: DashboardProps): React.JSX.Element {
  const { theme, setTheme } = useTheme();
  const [navOpen, setNavOpen] = useState(false);
  const [expandedNews, setExpandedNews] = useState<number | null>(null);
  const [newsPage, setNewsPage] = useState(0);
  const [tab, setTab] = useState<"weekly" | "monthly">("weekly");

  useEffect(() => {
    if (!apiBase) {
      toast.warning("Edgeloop API not configured. Live data is offline. Configure NEXT_PUBLIC_API_URL to enable real-time features.", {
        duration: 5000,
      });
    }
  }, [apiBase]);

  useEffect(() => {
    if (newsError) {
      toast.error(`Edgeloop News Feed Error: ${newsError}`, { duration: 4000 });
    }
    if (oddsError) {
      toast.error(`Edgeloop Odds Feed Error: ${oddsError}`, { duration: 4000 });
    }
    if (gamesError) {
      toast.error(`Edgeloop Games Feed Error: ${gamesError}`, { duration: 4000 });
    }
    if (exploitsError) {
      toast.error(`Edgeloop Exploit Engine Error: ${exploitsError}`, { duration: 4000 });
    }
    if (injuriesError) {
      toast.error(`Edgeloop Injury Feed Error: ${injuriesError}`, { duration: 4000 });
    }
  }, [newsError, oddsError, gamesError, exploitsError, injuriesError]);

  // Handle mobile nav keyboard accessibility
  useEffect(() => {
    if (navOpen) {
      // Focus trap: prevent body scroll when nav is open
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [navOpen]);

  const pagedNews = useMemo(() => {
    const start = newsPage * 4;
    return newsItems.slice(start, start + 4);
  }, [newsItems, newsPage]);

  const pageCount = Math.max(1, Math.ceil(newsItems.length / 4));
  const isNewsLoading = !!apiBase && newsItems.length === 0 && !newsError;
  const isScoreboardLive = !!apiBase && !gamesError;
  const isMarketsLoading = !!apiBase && oddsCount === 0 && !oddsError;
  const exploitSignals = exploits.slice(0, 10);
  const injurySignals = injuries.slice(0, 5);
  
  // Calculate exploit summary
  const exploitSummary = {
    total: exploitSignals.length,
    highConfidence: exploitSignals.filter((e) => (e.confidence ?? 0) >= 70).length,
    highEdge: exploitSignals.filter((e) => (e.edge ?? 0) >= 60).length,
    categories: exploitSignals.reduce<Record<string, number>>((acc, e) => {
      const cat = e.category ?? "unknown";
      acc[cat] = (acc[cat] ?? 0) + 1;
      return acc;
    }, {}),
    avgEdge: exploitSignals.length > 0
      ? Math.round(exploitSignals.reduce((sum, e) => sum + (e.edge ?? 0), 0) / exploitSignals.length)
      : 0,
    avgRisk: exploitSignals.length > 0
      ? Math.round(exploitSignals.reduce((sum, e) => sum + (e.risk ?? 0), 0) / exploitSignals.length)
      : 0,
  };

  /**
   * Toggle theme between dark, light, and high-contrast
   */
  function toggleTheme(): void {
    if (theme === "dark") {
      setTheme("light");
      return;
    }
    if (theme === "light") {
      setTheme("high-contrast");
      return;
    }
    setTheme("dark");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="orbit absolute left-[-10%] top-[-8%] h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="orbit-delay absolute right-[-5%] top-[10%] h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />
      </div>
      <div className="flex">
        <aside
          className={`fixed left-0 top-0 z-30 h-full w-64 border-r border-border/50 bg-secondary/20 p-6 transition-transform lg:translate-x-0 ${
            navOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          id="primary-navigation"
          aria-label="Primary navigation"
          aria-hidden={navOpen ? false : undefined}
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20" />
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Edgeloop
              </div>
              <div className="text-lg font-semibold">Edge Intelligence</div>
            </div>
          </div>
          <nav className="space-y-2">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById(link.id);
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth", block: "start" });
                      // Close mobile nav after navigation
                      if (navOpen) {
                        setNavOpen(false);
                      }
                    }
                  }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary/50 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label={`Navigate to ${link.label} section`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {link.label}
                </a>
              );
            })}
          </nav>
        </aside>

        {navOpen && (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setNavOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setNavOpen(false);
              }
            }}
            aria-label="Close navigation overlay"
          />
        )}

        <div className="flex-1 lg:ml-64">
          <header className="sticky top-0 z-20 border-b border-border/50 bg-background/75 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-border/60 p-2 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
                  onClick={() => setNavOpen((prev) => !prev)}
                  aria-label={navOpen ? "Close navigation menu" : "Open navigation menu"}
                  aria-expanded={navOpen}
                  aria-controls="primary-navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Edgeloop Active
                  </div>
                  <div className="text-lg font-semibold">Edge Detection</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span 
                  className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-primary"
                  role="status"
                  aria-live="polite"
                  aria-label={`Edgeloop status: ${health.ok ? "Online" : "Offline"}`}
                >
                  <span 
                    className={`h-2 w-2 rounded-full animate-pulse ${health.ok ? "bg-emerald-400" : "bg-red-400"}`}
                    aria-hidden="true"
                  />
                  {health.ok ? "Online" : "Offline"}
                </span>
                <button
                  type="button"
                  className="rounded-lg border border-border/60 p-2 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={toggleTheme}
                  aria-label={`Switch to ${theme === "dark" ? "light" : theme === "light" ? "high contrast" : "dark"} theme`}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : theme === "light" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </header>

          <section className="border-b border-border/50 bg-black/20">
            <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <span className="rounded-full bg-primary/20 px-3 py-1 text-primary">
                Ticker
              </span>
              <div className="relative w-full overflow-hidden" aria-live="polite">
                <div className="ticker-marquee whitespace-nowrap">
                  {tickerItems.length > 0 ? (
                    [...tickerItems, ...tickerItems].map((item, index) => (
                      <span key={`ticker-${index}-${item.slice(0, 20)}`} className="whitespace-nowrap">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground">Edgeloop ticker ready — waiting for updates</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="studio-desk studio-light-top studio-grid scanline neural-network hologram relative overflow-hidden" aria-labelledby="hero-title">
            {/* Singularity background effects */}
            <div className="absolute inset-0">
              <div className="absolute right-6 top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl animate-pulse" />
              <div className="absolute left-10 bottom-10 h-60 w-60 rounded-full bg-purple-500/15 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
              <div className="absolute right-1/3 top-1/3 h-32 w-32 rounded-full bg-blue-500/15 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
            </div>
            
            {/* Data stream overlay */}
            <div className="data-stream absolute inset-0" />
            
            <div className="relative mx-auto max-w-6xl px-6 py-16 z-10">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col gap-6"
              >
                <h1 id="hero-title" className="text-4xl font-bold tracking-tight sm:text-6xl">
                  <span className="singularity-text">Edgeloop</span>
                  <br />
                  <span className="text-3xl sm:text-4xl font-semibold mt-2 block">Edge Intelligence Platform</span>
                </h1>
                <p className="max-w-2xl text-lg text-muted-foreground">
                  Real-time NFL exploit detection, market intelligence, and edge analysis
                  powered by Edgeloop's advanced analytics engine.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 border border-primary/20">
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">Edgeloop Engine Active</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-2 border border-purple-500/20">
                    <Activity className="h-4 w-4 text-purple-400" />
                    <span className="text-muted-foreground">{exploitSummary.total} Exploits Detected</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 border border-blue-500/20">
                    <Cpu className="h-4 w-4 text-blue-400" />
                    <span className="text-muted-foreground">Season {season} · Week {week}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          <section id="scoreboard" className="mx-auto max-w-6xl px-6 py-10" aria-labelledby="scoreboard-title">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 id="scoreboard-title" className="text-2xl font-semibold">Scoreboard</h2>
              <div className="flex items-center gap-2 rounded-full border border-border/60 p-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <button
                  type="button"
                  className={`rounded-full px-4 py-1 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${tab === "weekly" ? "bg-primary/20 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setTab("weekly")}
                  aria-label="View weekly scoreboard"
                  aria-pressed={tab === "weekly"}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-1 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${tab === "monthly" ? "bg-primary/20 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setTab("monthly")}
                  aria-label="View monthly scoreboard"
                  aria-pressed={tab === "monthly"}
                >
                  Monthly
                </button>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {scoreboard.map((game, gameIndex) => {
                const awayColors = getTeamColors(game.away);
                const homeColors = getTeamColors(game.home);
                return (
                  <motion.div
                    key={`${game.away}-${game.home}-${gameIndex}`}
                    whileHover={{ scale: 1.03, y: -4 }}
                    className="group relative rounded-2xl p-6 transition-all glass-singularity neon-border singularity-glow nfl-grid"
                  >
                    {/* Team color accents */}
                    <div
                      className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
                      style={{ background: awayColors.gradient.join(", ") }}
                    />
                    <div
                      className="absolute right-0 top-0 h-full w-1 rounded-r-2xl"
                      style={{ background: homeColors.gradient.join(", ") }}
                    />

                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
                      <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold">{game.status}</span>
                      <span>{game.time}</span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div
                          className="text-2xl font-bold"
                          style={{ color: awayColors.primary }}
                        >
                          {game.away}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Away</div>
                      </div>
                      <div className="mx-4 text-2xl font-bold text-foreground">
                        {game.scoreAway !== null && game.scoreHome !== null ? (
                          <span>
                            {game.scoreAway} - {game.scoreHome}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">@</span>
                        )}
                      </div>
                      <div className="flex-1 text-right">
                        <div
                          className="text-2xl font-bold"
                          style={{ color: homeColors.primary }}
                        >
                          {game.home}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Home</div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between rounded-lg bg-background/30 p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Spread:</span>
                        <span className="font-semibold text-foreground">{game.spread}</span>
                      </div>
                      <div className="h-4 w-px bg-border" />
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-semibold text-foreground">{game.total}</span>
                      </div>
                    </div>

                    {/* Neural network overlay */}
                    <div className="absolute inset-0 rounded-2xl neural-network opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    <div className="pointer-events-none absolute bottom-4 right-4 hidden rounded-lg bg-primary/90 px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg group-hover:block" role="tooltip">
                      <Network className="h-3 w-3 inline mr-1" aria-hidden="true" />
                      Edgeloop Analysis Active
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {!isScoreboardLive && scoreboard.length > 0 && (
              <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-yellow-400" role="alert">
                <span className="font-semibold">Note:</span> Live games offline — showing cached data. Configure NEXT_PUBLIC_API_URL for real-time updates.
              </div>
            )}
            {gamesError && (
              <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400" role="alert">
                <span className="font-semibold">Error:</span> Unable to load scoreboard data. {gamesError}
              </div>
            )}
            {scoreboard.length === 0 && !gamesError && (
              <div className="mt-6 rounded-lg border border-border/60 bg-secondary/20 p-8 text-center">
                <Gauge className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50 animate-pulse" aria-hidden="true" />
                <div className="text-sm font-semibold text-foreground mb-2">No scoreboard data available</div>
                <div className="text-xs text-muted-foreground">
                  {apiBase ? "Waiting for game data from Edgeloop API..." : "Configure NEXT_PUBLIC_API_URL to view live scores"}
                </div>
              </div>
            )}
          </section>

          <section id="markets" className="mx-auto max-w-6xl px-6 pb-8" aria-labelledby="markets-title">
            <div className="rounded-2xl p-8 glass-singularity neon-border scanline neural-network relative overflow-hidden">
              <div className="data-stream absolute inset-0" />
              <div className="relative z-10">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 id="markets-title" className="text-xl font-semibold">Edgeloop Markets & Analytics</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Edgeloop odds, team stats, and edge/risk visualizations update in real time.
              </p>
              <div className="mt-6">
                {isMarketsLoading && !oddsError && (
                  <>
                    <div className="grid gap-6 lg:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={`market-loading-${idx}`} className="h-44 rounded-2xl bg-secondary/20 animate-pulse" aria-hidden="true" />
                      ))}
                    </div>
                    <div className="sr-only" role="status" aria-live="polite">Loading market analytics</div>
                  </>
                )}
                {oddsError && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center" role="alert">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-red-400 opacity-50" aria-hidden="true" />
                    <div className="text-sm font-semibold text-red-400 mb-2">Unable to load market data</div>
                    <div className="text-xs text-muted-foreground">{oddsError}</div>
                  </div>
                )}
                {!isMarketsLoading && !oddsError && (
                  <Charts
                    oddsTrend={oddsTrend && oddsTrend.length ? oddsTrend : defaultOddsTrend}
                    teamStats={teamStats && teamStats.length ? teamStats : defaultTeamStats}
                    edgeRisk={edgeRisk && edgeRisk.length ? edgeRisk : defaultEdgeRisk}
                  />
                )}
              </div>
              </div>
            </div>
          </section>

          <section id="exploits" className="mx-auto max-w-6xl px-6 pb-8" aria-labelledby="exploits-title">
            <div className="rounded-2xl p-8 glass-singularity neon-border scanline neural-network relative overflow-hidden">
              {/* Data stream effect */}
              <div className="data-stream absolute inset-0" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/20 p-2">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 id="exploits-title" className="text-2xl font-bold singularity-text">
                        Edgeloop Exploits
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Edgeloop-powered anomaly detection & edge opportunities
                      </p>
                    </div>
                  </div>
                  
                  {/* Exploit summary stats */}
                  <div className="hidden md:flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{exploitSummary.total}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">Total</div>
                    </div>
                    <div className="h-10 w-px bg-border" />
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">{exploitSummary.highConfidence}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">High Conf</div>
                    </div>
                    <div className="h-10 w-px bg-border" />
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-400">{exploitSummary.highEdge}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">High Edge</div>
                    </div>
                  </div>
                </div>

                {/* Stats cards */}
                <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-background/50 p-3 border border-border/50">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Avg Edge</div>
                    <div className="text-xl font-bold text-green-400">{exploitSummary.avgEdge}%</div>
                  </div>
                  <div className="rounded-lg bg-background/50 p-3 border border-border/50">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Avg Risk</div>
                    <div className={`text-xl font-bold ${exploitSummary.avgRisk >= 60 ? "text-red-400" : exploitSummary.avgRisk >= 40 ? "text-yellow-400" : "text-green-400"}`}>
                      {exploitSummary.avgRisk}%
                    </div>
                  </div>
                  <div className="rounded-lg bg-background/50 p-3 border border-border/50">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Categories</div>
                    <div className="text-xl font-bold text-purple-400">{Object.keys(exploitSummary.categories).length}</div>
                  </div>
                  <div className="rounded-lg bg-background/50 p-3 border border-border/50">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Success Rate</div>
                    <div className="text-xl font-bold text-primary">
                      {exploitSummary.total > 0 ? Math.round((exploitSummary.highConfidence / exploitSummary.total) * 100) : 0}%
                    </div>
                  </div>
                </div>

                {/* Category badges */}
                {Object.keys(exploitSummary.categories).length > 0 && (
                  <div className="mb-6 flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Categories:</span>
                    {Object.entries(exploitSummary.categories).slice(0, 8).map(([category, count]) => (
                      <span
                        key={category}
                        className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {category} ({count})
                      </span>
                    ))}
                  </div>
                )}

                {/* Exploit cards grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {exploitsError ? (
                    <div className="col-span-full rounded-xl border border-red-500/20 bg-red-500/10 p-8 text-center" role="alert">
                      <Zap className="h-12 w-12 mx-auto mb-4 text-red-400 opacity-50" aria-hidden="true" />
                      <div className="text-sm font-semibold text-red-400 mb-2">Unable to load exploit signals</div>
                      <div className="text-xs text-muted-foreground">{exploitsError}</div>
                    </div>
                  ) : exploitSignals.length > 0 ? (
                    exploitSignals.map((signal, index) => {
                      const exploitKey = signal.id ?? (signal.gameId ? `exploit-${signal.gameId}-${index}` : `exploit-${signal.name ?? index}`);
                      return (
                        <ExploitCard key={exploitKey} signal={signal} index={index} />
                      );
                    })
                  ) : (
                    <div className="col-span-full rounded-xl border border-border/60 p-8 text-center glass-panel">
                      <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50 animate-pulse" aria-hidden="true" />
                      <div className="text-sm font-semibold text-foreground mb-2">No exploit signals detected</div>
                      <div className="text-xs text-muted-foreground">
                        {apiBase ? "Edgeloop engine is scanning for edge opportunities..." : "Configure NEXT_PUBLIC_API_URL to enable exploit detection"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 pb-8" aria-labelledby="injuries-title">
            <div className="rounded-2xl p-8 glass-singularity neon-border scanline neural-network relative overflow-hidden">
              <div className="data-stream absolute inset-0" />
              <div className="relative z-10">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <h2 id="injuries-title" className="text-xl font-semibold">Edgeloop Injury Watch</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Live player injury updates powered by Edgeloop data integration.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {injuriesError ? (
                  <div className="col-span-full rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center" role="alert">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-400 opacity-50" aria-hidden="true" />
                    <div className="text-sm font-semibold text-red-400 mb-2">Unable to load injury data</div>
                    <div className="text-xs text-muted-foreground">{injuriesError}</div>
                  </div>
                ) : injurySignals.length > 0 ? (
                  injurySignals.map((item, index) => (
                    <div key={`${item.player}-${index}`} className="rounded-xl border border-border/60 bg-secondary/20 p-4 transition-colors hover:bg-secondary/40">
                      <div className="text-sm font-semibold text-foreground">{item.player || "Player"}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        <span className="font-medium">{item.team || "Team"}</span> · <span>{item.position || "Pos"}</span> · <span className={`font-semibold ${item.status?.toLowerCase().includes("out") ? "text-red-400" : item.status?.toLowerCase().includes("questionable") ? "text-yellow-400" : "text-green-400"}`}>{item.status || "Status"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full rounded-xl border border-border/60 bg-secondary/20 p-8 text-center" role="status" aria-live="polite">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" aria-hidden="true" />
                    <div className="text-sm font-semibold text-foreground mb-2">No injuries reported</div>
                    <div className="text-xs text-muted-foreground">
                      {apiBase ? "All clear — no injury updates available." : "Configure NEXT_PUBLIC_API_URL to view injury reports"}
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>
          </section>

          <section id="news" className="mx-auto max-w-6xl px-6 pb-16" aria-labelledby="news-title">
            <div className="studio-panel rounded-2xl p-8 glass-singularity neural-network relative overflow-hidden">
              <div className="data-stream absolute inset-0" />
              <div className="relative z-10">
              <div className="flex items-center gap-3">
                <Newspaper className="h-5 w-5 text-primary" />
                <h2 id="news-title" className="text-xl font-semibold">Edgeloop News Feed</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {newsItems.length > 0
                  ? "Edgeloop streaming top NFL headlines from configured feeds."
                  : "Edgeloop news feed ready. Ensure NEXT_PUBLIC_API_URL is set."}
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {newsError ? (
                  <div className="col-span-full rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center" role="alert">
                    <Newspaper className="h-12 w-12 mx-auto mb-4 text-red-400 opacity-50" aria-hidden="true" />
                    <div className="text-sm font-semibold text-red-400 mb-2">Unable to load news feed</div>
                    <div className="text-xs text-muted-foreground">{newsError}</div>
                  </div>
                ) : isNewsLoading ? (
                  <>
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={`news-loading-${idx}`} className="h-28 rounded-xl bg-secondary/20 animate-pulse" aria-hidden="true" />
                    ))}
                    <div className="sr-only" role="status" aria-live="polite">Loading news feed</div>
                  </>
                ) : pagedNews.length > 0 ? (
                  pagedNews.map((item, index) => {
                    const newsKey = item.link ? `news-${item.link.slice(-20)}` : `news-${item.title?.slice(0, 20) ?? index}`;
                    return (
                    <motion.div
                      key={newsKey}
                      className="rounded-xl border border-border/60 bg-secondary/20 p-4 transition-colors hover:bg-secondary/40"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-foreground">{item.title || "Untitled Article"}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            <span className="font-medium">{item.source || "Source"}</span> · <span>{item.pubDate || "Today"}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 text-xs uppercase text-primary transition-colors hover:text-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          onClick={() => setExpandedNews(expandedNews === index ? null : index)}
                          aria-expanded={expandedNews === index}
                          aria-label={expandedNews === index ? "Collapse news article" : `Expand news article: ${item.title}`}
                        >
                          {expandedNews === index ? "Close" : "Read more"}
                        </button>
                      </div>
                      {expandedNews === index && (
                        <div className="mt-3 text-xs text-muted-foreground">
                          {item.link ? (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="underline transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                              aria-label={`Open full article: ${item.title} (opens in new tab)`}
                            >
                              Open full article
                            </a>
                          ) : (
                            "Full article link unavailable."
                          )}
                        </div>
                      )}
                    </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-full rounded-xl border border-border/60 bg-secondary/20 p-8 text-center" role="status" aria-live="polite">
                    <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" aria-hidden="true" />
                    <div className="text-sm font-semibold text-foreground mb-2">No news available</div>
                    <div className="text-xs text-muted-foreground">
                      {apiBase ? "Waiting for headlines from Edgeloop news feed..." : "Configure NEXT_PUBLIC_API_URL to view news"}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <button
                  type="button"
                  className="rounded-full border border-border/60 px-4 py-1 transition-all hover:bg-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={() => setNewsPage((page) => Math.max(page - 1, 0))}
                  disabled={newsPage === 0}
                  aria-label="Previous news page"
                >
                  Prev
                </button>
                <span aria-live="polite" aria-atomic="true">
                  Page {newsPage + 1} / {pageCount}
                </span>
                <button
                  type="button"
                  className="rounded-full border border-border/60 px-4 py-1 transition-all hover:bg-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={() => setNewsPage((page) => Math.min(page + 1, pageCount - 1))}
                  disabled={newsPage >= pageCount - 1}
                  aria-label="Next news page"
                >
                  Next
                </button>
              </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
