'use client'

import * as React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { cn } from '../utils'

export interface MomentumPoint {
  timestamp: number
  momentum: number // -1 to 1, negative = away, positive = home
  quarter: number
}

export interface MomentumChartProps {
  data: MomentumPoint[]
  homeTeamName: string
  awayTeamName: string
  homeTeamColor?: string
  awayTeamColor?: string
  className?: string
}

export function MomentumChart({
  data,
  homeTeamName,
  awayTeamName,
  homeTeamColor = '#D00000',
  awayTeamColor = '#0D1B2A',
  className,
}: MomentumChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Game Momentum</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Home</span>
            <span className="font-medium">{homeTeamName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Away</span>
            <span className="font-medium">{awayTeamName}</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="momentumPositive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={homeTeamColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={homeTeamColor} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="momentumNegative" x1="0" y1="1" x2="0" y2="0">
              <stop offset="5%" stopColor={awayTeamColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={awayTeamColor} stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />

          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) => `${Math.floor(value / 60)}'`}
            stroke="#666"
            fontSize={12}
          />

          <YAxis
            domain={[-1, 1]}
            tickFormatter={(value) => {
              if (value === 0) return '0'
              if (value > 0) return `+${(value * 100).toFixed(0)}`
              return `${(value * 100).toFixed(0)}`
            }}
            stroke="#666"
            fontSize={12}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#1B263B',
              border: '1px solid #415A77',
              borderRadius: '8px',
            }}
            labelFormatter={(value) => `${Math.floor(Number(value) / 60)} min`}
            formatter={(value: number) => [
              `${value > 0 ? homeTeamName : awayTeamName}: ${Math.abs(value * 100).toFixed(0)}%`,
              'Momentum',
            ]}
          />

          <ReferenceLine y={0} stroke="#FFB81C" strokeDasharray="3 3" />

          <Area
            type="monotone"
            dataKey="momentum"
            stroke={homeTeamColor}
            fill="url(#momentumPositive)"
            fillOpacity={1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
