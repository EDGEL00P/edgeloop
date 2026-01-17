/**
 * Risk Strip - Client Component
 * 
 * Event-driven risk display using Zustand emphasis store
 * Expands on injury events, collapses on stability
 */

'use client';

import { useEffect } from 'react';
import { useEmphasisStore } from '@/lib/stores/emphasis';
import { motion, AnimatePresence } from 'framer-motion';

export default function RiskStrip() {
  const {
    riskStripExpanded,
    riskStripPriority,
    marketVolatile,
    showMarketNoise,
  } = useEmphasisStore();

  // Only show if expanded or market volatile
  const shouldShow = riskStripExpanded || marketVolatile;

  if (!shouldShow && !showMarketNoise) {
    return null;
  }

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className={`studio-panel border-l-4 ${
            riskStripPriority === 'high' ? 'risk-high border-l-red-500' :
            riskStripPriority === 'medium' ? 'border-l-orange-500' :
            'border-l-yellow-500'
          }`}>
            <div className="broadcast-spacing">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold mb-1 text-white">
                    RISK INDICATOR
                  </div>
                  <div className="text-sm text-slate-300">
                    {riskStripPriority === 'high' && 'High-priority risk event detected'}
                    {riskStripPriority === 'medium' && 'Moderate risk factor identified'}
                    {riskStripPriority === 'low' && 'Low-level risk indicator'}
                    {marketVolatile && !riskStripPriority && 'Market volatility detected'}
                  </div>
                </div>
                {riskStripExpanded && (
                  <button
                    onClick={() => useEmphasisStore.getState().collapseRiskStrip()}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    DISMISS
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
