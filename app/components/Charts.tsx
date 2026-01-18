/**
 * Charts Component
 * 
 * Displays analytics charts using Recharts: odds trends, team stats, and edge/risk heatmap.
 * Lazy-loaded for performance optimization.
 * 
 * @module app/components/Charts
 */

"use client";

import type React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import type { ChartProps } from "../types/dashboard.types";

export default function Charts({ oddsTrend, teamStats, edgeRisk }: ChartProps): React.JSX.Element {
  // Guard clauses: return empty state if no data
  if (!oddsTrend || oddsTrend.length === 0) {
    return (
      <div className="col-span-full rounded-xl border border-border/60 bg-secondary/20 p-8 text-center" role="status">
        <div className="text-sm text-muted-foreground">No odds trend data available</div>
      </div>
    );
  }

  if (!teamStats || teamStats.length === 0) {
    return (
      <div className="col-span-full rounded-xl border border-border/60 bg-secondary/20 p-8 text-center" role="status">
        <div className="text-sm text-muted-foreground">No team stats data available</div>
      </div>
    );
  }

  if (!edgeRisk || edgeRisk.length === 0) {
    return (
      <div className="col-span-full rounded-xl border border-border/60 bg-secondary/20 p-8 text-center" role="status">
        <div className="text-sm text-muted-foreground">No edge/risk data available</div>
      </div>
    );
  }

  // Convert readonly arrays to mutable for Recharts (which expects mutable arrays)
  const oddsTrendData = [...oddsTrend];
  const teamStatsData = [...teamStats];
  const edgeRiskData = [...edgeRisk];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-2xl border border-border/60 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Odds Trend
        </h3>
        <div className="mt-4 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={oddsTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(222 47% 11%)", border: "1px solid hsl(217 33% 17%)" }} />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Team Stats
        </h3>
        <div className="mt-4 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamStatsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(222 47% 11%)", border: "1px solid hsl(217 33% 17%)" }} />
              <Bar dataKey="value" fill="hsl(var(--accent))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Edge / Risk Heatmap
        </h3>
        <div className="mt-4 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={edgeRiskData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(222 47% 11%)", border: "1px solid hsl(217 33% 17%)" }} />
              <Bar dataKey="edge" fill="hsl(var(--edge-high))" />
              <Bar dataKey="risk" fill="hsl(var(--risk-medium))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
