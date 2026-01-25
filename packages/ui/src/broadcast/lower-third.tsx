'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../utils'

export interface LowerThirdProps {
  title: string
  subtitle?: string
  accent?: string
  isVisible?: boolean
  variant?: 'default' | 'alert' | 'prediction'
  className?: string
}

export function LowerThird({
  title,
  subtitle,
  accent,
  isVisible = true,
  variant = 'default',
  className,
}: LowerThirdProps) {
  const accentColors = {
    default: 'from-broadcast-red to-broadcast-gold',
    alert: 'from-broadcast-red to-broadcast-darkRed',
    prediction: 'from-broadcast-gold to-broadcast-red',
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn('fixed bottom-8 left-8 right-8 z-50', className)}
        >
          <div className="max-w-2xl">
            {/* Accent bar */}
            <div
              className={cn(
                'h-1 w-24 rounded-full bg-gradient-to-r mb-2',
                accentColors[variant]
              )}
            />

            {/* Main content */}
            <div className="bg-broadcast-navy/95 backdrop-blur-xl rounded-lg border border-broadcast-steel/30 shadow-2xl overflow-hidden">
              <div className="p-4">
                {accent && (
                  <div className="text-xs font-bold uppercase tracking-wider text-broadcast-gold mb-1">
                    {accent}
                  </div>
                )}
                <h3 className="text-xl font-bold text-broadcast-white">{title}</h3>
                {subtitle && (
                  <p className="text-sm text-broadcast-silver mt-1">{subtitle}</p>
                )}
              </div>

              {/* Bottom accent */}
              <div
                className={cn(
                  'h-0.5 bg-gradient-to-r',
                  accentColors[variant]
                )}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
