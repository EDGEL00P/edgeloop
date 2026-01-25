'use client'

import * as React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts'
import { cn } from '../utils'

export interface WinProbabilityPoint {
  timestamp: number
  homeWinProb: number
  awayWinProb: number
  quarter: number
  event?: string
}

export interface WinProbabilityChartProps {
  data: WinProbabilityPoint[]
  homeTeamName: string
  awayTeamName: string
  homeTeamColor?: string
  awayTeamColor?: string
  showQuarterLines?: boolean
  className?: string
}

export function WinProbabilityChart({
  data,
  homeTeamName,
  awayTeamName,
  homeTeamColor = '#D00000',
  awayTeamColor = '#0D1B2A',
  showQuarterLines = true,
  className,
}: WinProbabilityChartProps) {
  const quarterPositions = [15, 30, 45].map((q) => q * 60)

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Win Probability</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: homeTeamColor }} />
            <span>{homeTeamName}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: awayTeamColor }} />
            <span>{awayTeamName}</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="homeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={homeTeamColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={homeTeamColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />

          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) => {
              const minutes = Math.floor(value / 60)
              return `${minutes}'`
            }}
            stroke="#666"
            fontSize={12}
          />

          <YAxis
            domain={[0, 1]}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            stroke="#666"
            fontSize={12}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#1B263B',
              border: '1px solid #415A77',
              borderRadius: '8px',
            }}
            labelFormatter={(value) => {
              const minutes = Math.floor(Number(value) / 60)
              const quarter = Math.floor(minutes / 15) + 1
              return `Q${quarter} - ${minutes % 15}:00`
            }}
            formatter={(value: number, name: string) => [
              `${(value * 100).toFixed(1)}%`,
              name === 'homeWinProb' ? homeTeamName : awayTeamName,
            ]}
          />

          {showQuarterLines &&
            quarterPositions.map((pos) => (
              <ReferenceLine
                key={pos}
                x={pos}
                stroke="#666"
                strokeDasharray="5 5"
                label={{
                  value: `Q${Math.floor(pos / 60 / 15) + 1}`,
                  position: 'top',
                  fill: '#666',
                  fontSize: 10,
                }}
              />
            ))}

          <ReferenceLine y={0.5} stroke="#FFB81C" strokeDasharray="3 3" opacity={0.5} />

          <Area
            type="monotone"
            dataKey="homeWinProb"
            stroke="none"
            fill="url(#homeGradient)"
          />

          <Line
            type="monotone"
            dataKey="homeWinProb"
            stroke={homeTeamColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />

          <Line
            type="monotone"
            dataKey="awayWinProb"
            stroke={awayTeamColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
