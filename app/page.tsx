const integrations = [
  {
    title: "Core Data",
    items: ["BALLDONTLIE_API_KEY", "DATABASE_URL", "SESSION_SECRET"],
  },
  {
    title: "Betting & Weather",
    items: ["ODDS_API_KEY", "WEATHER_API_KEY"],
  },
  {
    title: "Performance",
    items: ["REDIS_URL", "AXIOM_TOKEN", "AXIOM_DATASET"],
  },
  {
    title: "AI Providers",
    items: [
      "AI_INTEGRATIONS_OPENAI_API_KEY",
      "AI_INTEGRATIONS_GEMINI_API_KEY",
      "AI_INTEGRATIONS_ANTHROPIC_API_KEY",
      "AI_INTEGRATIONS_OPENROUTER_API_KEY",
    ],
  },
];

const statusCards = [
  {
    title: "Health",
    value: "/api/health",
    detail: "Live readiness probe",
  },
  {
    title: "Deployment",
    value: "Vercel + Railway",
    detail: "Edge + service build targets",
  },
  {
    title: "Architecture",
    value: "Platform + Domain",
    detail: "Contract-first, single engine boundary",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="studio-desk studio-light-top">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Live Ready
            </span>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Edgeloop
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              NFL Analytics &amp; Betting Intelligence Platform. High-velocity
              data, exploit detection, and AI-driven forecasts—now built for
              production scale.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-blue-500/20"
                href="/api/health"
              >
                Check Health
              </a>
              <a
                className="rounded-lg border border-border px-5 py-2 text-sm font-semibold text-foreground/80"
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noreferrer"
              >
                Open Vercel
              </a>
              <a
                className="rounded-lg border border-border px-5 py-2 text-sm font-semibold text-foreground/80"
                href="https://railway.app/dashboard"
                target="_blank"
                rel="noreferrer"
              >
                Open Railway
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-3">
        {statusCards.map((card) => (
          <div key={card.title} className="studio-panel rounded-2xl p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {card.title}
            </p>
            <h3 className="mt-3 text-2xl font-semibold">{card.value}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{card.detail}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="studio-panel rounded-2xl p-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold">Integration Checklist</h2>
            <p className="text-sm text-muted-foreground">
              Configure these integrations to unlock full platform capabilities.
              All required keys must be set for production.
            </p>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {integrations.map((group) => (
              <div key={group.title} className="rounded-xl border border-border/60 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {group.title}
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-foreground/80">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-secondary/40 p-4 text-sm text-muted-foreground">
            Need help? Open the Vercel or Railway dashboards and paste the env
            list above. Once set, redeploy to activate all services.
          </div>
        </div>
      </section>
    </main>
  );
}
