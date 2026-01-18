"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  BarChart3,
  Gauge,
  Menu,
  Moon,
  Newspaper,
  Sun,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { ExploitSignal, HealthStatus, InjuryRecord, NewsItem } from "../page";

type StatusCard = { title: string; value: string; detail: string };
type ScoreboardCard = {
  away: string;
  home: string;
  status: string;
  time: string;
  spread: string;
  total: string;
  scoreAway?: number | null;
  scoreHome?: number | null;
};

const Charts = dynamic(() => import("./Charts"), {
  ssr: false,
  loading: () => <div className="h-44 rounded-2xl border border-border/60 bg-secondary/30" />,
});

type DashboardProps = {
  statusCards: StatusCard[];
  health: { ok: boolean; data?: HealthStatus; error?: string };
  newsItems: NewsItem[];
  oddsCount: number;
  scoreboard: ScoreboardCard[];
  tickerItems: string[];
  apiBase: string;
  season: number;
  week: number;
  newsError?: string;
  oddsError?: string;
  gamesError?: string;
  exploits: ExploitSignal[];
  injuries: InjuryRecord[];
  oddsTrend?: { label: string; value: number }[];
  teamStats?: { label: string; value: number }[];
  edgeRisk?: { label: string; edge: number; risk: number }[];
  exploitsError?: string;
  injuriesError?: string;
};

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

export default function DashboardClient({
  statusCards,
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
}: DashboardProps) {
  const { theme, setTheme } = useTheme();
  const [navOpen, setNavOpen] = useState(false);
  const [expandedNews, setExpandedNews] = useState<number | null>(null);
  const [newsPage, setNewsPage] = useState(0);
  const [tab, setTab] = useState<"weekly" | "monthly">("weekly");

  useEffect(() => {
    if (!apiBase) {
      toast.error("API base is not configured. Live data is offline.");
    }
    if (newsError) toast.error(`News feed error: ${newsError}`);
    if (oddsError) toast.error(`Odds feed error: ${oddsError}`);
    if (gamesError) toast.error(`Games feed error: ${gamesError}`);
    if (exploitsError) toast.error(`Exploit feed error: ${exploitsError}`);
    if (injuriesError) toast.error(`Injury feed error: ${injuriesError}`);
  }, [apiBase, newsError, oddsError, gamesError, exploitsError, injuriesError]);

  const pagedNews = useMemo(() => {
    const start = newsPage * 4;
    return newsItems.slice(start, start + 4);
  }, [newsItems, newsPage]);

  const pageCount = Math.max(1, Math.ceil(newsItems.length / 4));
  const isNewsLoading = !!apiBase && newsItems.length === 0 && !newsError;
  const isScoreboardLive = !!apiBase && !gamesError;
  const isMarketsLoading = !!apiBase && oddsCount === 0 && !oddsError;
  const exploitSignals = exploits.slice(0, 5);
  const injurySignals = injuries.slice(0, 5);

  const toggleTheme = () => {
    if (theme === "dark") return setTheme("light");
    if (theme === "light") return setTheme("high-contrast");
    return setTheme("dark");
  };

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
          aria-label="Primary navigation"
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20" />
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                NFL Analytics
              </div>
              <div className="text-lg font-semibold">Edgeloop Studio</div>
            </div>
          </div>
          <nav className="space-y-2">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary/50 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
          />
        )}

        <div className="flex-1 lg:ml-64">
          <header className="sticky top-0 z-20 border-b border-border/50 bg-background/75 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <button
                  className="rounded-lg border border-border/60 p-2 text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
                  onClick={() => setNavOpen((prev) => !prev)}
                  aria-label="Toggle navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Live Ready
                  </div>
                  <div className="text-lg font-semibold">Edgeloop Control Room</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-primary">
                  <span className={`h-2 w-2 rounded-full ${health.ok ? "bg-emerald-400" : "bg-red-400"}`} />
                  {health.ok ? "Online" : "Offline"}
                </span>
                <button
                  className="rounded-lg border border-border/60 p-2 text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={toggleTheme}
                  aria-label="Toggle theme (dark, light, high contrast)"
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
                  {[...tickerItems, ...tickerItems].map((item, index) => (
                    <span key={`${item}-${index}`} className="whitespace-nowrap">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="studio-desk studio-light-top studio-grid scanline" aria-labelledby="hero-title">
            <div className="relative mx-auto max-w-6xl px-6 py-12">
              <div className="absolute right-6 top-10 hidden h-40 w-40 rounded-full bg-primary/20 blur-3xl lg:block" />
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col gap-6"
              >
                <h1 id="hero-title" className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  <span className="holo-text">NFL Analytics</span> &amp; Betting Intelligence
                </h1>
                <p className="max-w-2xl text-lg text-muted-foreground">
                  Real-time scoreboard intelligence, exploit detection, and market
                  surveillance for the 2027 broadcast experience.
                </p>
                <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <span>Season {season}</span>
                  <span>Week {week}</span>
                  <span>Odds: {oddsCount}</span>
                </div>
              </motion.div>
            </div>
          </section>

          <section id="scoreboard" className="mx-auto max-w-6xl px-6 py-10" aria-labelledby="scoreboard-title">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 id="scoreboard-title" className="text-2xl font-semibold">Scoreboard</h2>
              <div className="flex items-center gap-2 rounded-full border border-border/60 p-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <button
                  className={`rounded-full px-4 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${tab === "weekly" ? "bg-primary/20 text-primary" : ""}`}
                  onClick={() => setTab("weekly")}
                >
                  Weekly
                </button>
                <button
                  className={`rounded-full px-4 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${tab === "monthly" ? "bg-primary/20 text-primary" : ""}`}
                  onClick={() => setTab("monthly")}
                >
                  Monthly
                </button>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(tab === "weekly" ? scoreboard : scoreboard).map((game) => (
                <motion.div
                  key={`${game.away}-${game.home}`}
                  whileHover={{ scale: 1.02 }}
                  className="group relative rounded-2xl p-5 transition glass-panel neon-border glow-ring"
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <span>{game.status}</span>
                    <span>{game.time}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <div className="text-xl font-semibold">{game.away}</div>
                      <div className="text-xs text-muted-foreground">Away</div>
                    </div>
                    <div className="text-lg text-muted-foreground">
                      {game.scoreAway !== null && game.scoreHome !== null ? (
                        <span className="text-sm text-muted-foreground">
                          {game.scoreAway} - {game.scoreHome}
                        </span>
                      ) : (
                        "@"
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold">{game.home}</div>
                      <div className="text-xs text-muted-foreground">Home</div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>{game.spread}</span>
                    <span>{game.total}</span>
                  </div>
                  <div className="pointer-events-none absolute bottom-4 right-4 hidden rounded-lg bg-secondary/90 px-3 py-1 text-xs text-foreground shadow-lg group-hover:block">
                    Live stats ready
                  </div>
                </motion.div>
              ))}
            </div>
            {!isScoreboardLive && (
              <div className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Live games offline — showing cached slate.
              </div>
            )}
          </section>

          <section id="markets" className="mx-auto max-w-6xl px-6 pb-8" aria-labelledby="markets-title">
            <div className="rounded-2xl p-8 glass-panel neon-border scanline">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 id="markets-title" className="text-xl font-semibold">Markets & Analytics</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Odds, team stats, and edge/risk visualizations update in real time.
              </p>
              <div className="mt-6">
                {isMarketsLoading ? (
                  <div className="grid gap-6 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="h-44 rounded-2xl bg-secondary/20" />
                    ))}
                  </div>
                ) : (
                  <Charts
                    oddsTrend={oddsTrend && oddsTrend.length ? oddsTrend : defaultOddsTrend}
                    teamStats={teamStats && teamStats.length ? teamStats : defaultTeamStats}
                    edgeRisk={edgeRisk && edgeRisk.length ? edgeRisk : defaultEdgeRisk}
                  />
                )}
              </div>
            </div>
          </section>

          <section id="exploits" className="mx-auto max-w-6xl px-6 pb-8" aria-labelledby="exploits-title">
            <div className="rounded-2xl p-8 glass-panel neon-border scanline">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-primary" />
                <h2 id="exploits-title" className="text-xl font-semibold">Exploit Signals</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Exploit engine is live. Connect the backend data feeds to populate
                high-edge flags and opportunity alerts.
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <span className="rounded-full bg-primary/20 px-3 py-1 text-primary">Edge High</span>
                <span className="rounded-full bg-red-500/20 px-3 py-1 text-red-200">Risk Alert</span>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {exploitSignals.length > 0 ? (
                  exploitSignals.map((signal, index) => (
                    <div key={`${signal.gameId}-${index}`} className="rounded-xl border border-border/60 p-4">
                      <div className="text-sm font-semibold">
                        {signal.signal || signal.category || "Exploit Signal"}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Edge {signal.edge ?? "—"} · Risk {signal.risk ?? "—"}
                      </div>
                      {signal.description && (
                        <div className="mt-2 text-xs text-muted-foreground">{signal.description}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-border/60 p-4 text-sm text-muted-foreground">
                    No exploit signals available yet.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 pb-8" aria-labelledby="injuries-title">
            <div className="rounded-2xl p-8 glass-panel neon-border scanline">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <h2 id="injuries-title" className="text-xl font-semibold">Injury Watch</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Live player injury updates from BallDontLie endpoints.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {injurySignals.length > 0 ? (
                  injurySignals.map((item, index) => (
                    <div key={`${item.player}-${index}`} className="rounded-xl border border-border/60 p-4">
                      <div className="text-sm font-semibold">{item.player || "Player"}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {item.team || "Team"} · {item.position || "Pos"} · {item.status || "Status"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-border/60 p-4 text-sm text-muted-foreground">
                    No injuries available yet.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section id="news" className="mx-auto max-w-6xl px-6 pb-16" aria-labelledby="news-title">
            <div className="studio-panel rounded-2xl p-8">
              <div className="flex items-center gap-3">
                <Newspaper className="h-5 w-5 text-primary" />
                <h2 id="news-title" className="text-xl font-semibold">Latest NFL News</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {newsItems.length > 0
                  ? "Streaming top headlines from configured feeds."
                  : "No news available yet. Ensure NEXT_PUBLIC_API_URL is set."}
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {isNewsLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-28 rounded-xl bg-secondary/20" />
                  ))
                ) : pagedNews.length > 0 ? (
                  pagedNews.map((item, index) => (
                    <motion.div
                      key={`${item.title}-${index}`}
                      className="rounded-xl border border-border/60 p-4"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">{item.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {item.source || "Source"} · {item.pubDate || "Today"}
                          </div>
                        </div>
                        <button
                          className="text-xs uppercase text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          onClick={() => setExpandedNews(expandedNews === index ? null : index)}
                          aria-expanded={expandedNews === index}
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
                              rel="noreferrer"
                              className="underline"
                            >
                              Open full article
                            </a>
                          ) : (
                            "Full article link unavailable."
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="rounded-xl border border-border/60 p-6 text-sm text-muted-foreground">
                    Waiting for headlines…
                  </div>
                )}
              </div>
              <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <button
                  className="rounded-full border border-border/60 px-4 py-1 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={() => setNewsPage((page) => Math.max(page - 1, 0))}
                  disabled={newsPage === 0}
                >
                  Prev
                </button>
                <span>
                  Page {newsPage + 1} / {pageCount}
                </span>
                <button
                  className="rounded-full border border-border/60 px-4 py-1 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={() => setNewsPage((page) => Math.min(page + 1, pageCount - 1))}
                  disabled={newsPage >= pageCount - 1}
                >
                  Next
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
