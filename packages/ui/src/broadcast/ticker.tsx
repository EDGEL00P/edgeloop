'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../utils'

export interface TickerItem {
  id: string
  type: 'score' | 'alert' | 'prediction' | 'news'
  content: string
  highlight?: boolean
}

export interface TickerProps {
  items: TickerItem[]
  speed?: number
  className?: string
}

export function Ticker({ items, speed = 40, className }: TickerProps) {
  const [isPaused, setIsPaused] = React.useState(false)

  const duplicatedItems = [...items, ...items]

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-broadcast-navy border-y border-broadcast-steel/30',
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <motion.div
        className="flex whitespace-nowrap py-2"
        animate={{
          x: isPaused ? 0 : '-50%',
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: items.length * (60 / speed),
            ease: 'linear',
          },
        }}
      >
        {duplicatedItems.map((item, index) => (
          <TickerItemDisplay key={`${item.id}-${index}`} item={item} />
        ))}
      </motion.div>
    </div>
  )
}

function TickerItemDisplay({ item }: { item: TickerItem }) {
  const typeStyles = {
    score: 'text-broadcast-white',
    alert: 'text-broadcast-red',
    prediction: 'text-broadcast-gold',
    news: 'text-broadcast-silver',
  }

  const typeLabels = {
    score: 'SCORE',
    alert: 'ALERT',
    prediction: 'PREDICTION',
    news: 'NEWS',
  }

  return (
    <div className="flex items-center gap-4 px-6">
      <span
        className={cn(
          'text-xs font-bold uppercase tracking-wider',
          typeStyles[item.type]
        )}
      >
        {typeLabels[item.type]}
      </span>
      <span className={cn('text-sm', item.highlight ? 'text-broadcast-gold font-semibold' : 'text-broadcast-white')}>
        {item.content}
      </span>
      <span className="text-broadcast-steel">|</span>
    </div>
  )
}
