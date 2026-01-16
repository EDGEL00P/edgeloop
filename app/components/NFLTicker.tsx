/**
 * NFL TICKER - edgeloop HUD
 * ESPN-style scrolling ticker for live updates
 */

'use client';

import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

interface TickerItem {
  id: string;
  text: string;
  type: 'score' | 'update' | 'alert';
}

interface NFLTickerProps {
  items?: TickerItem[];
  className?: string;
}

const DEFAULT_ITEMS: TickerItem[] = [
  { id: '1', text: 'KC 24 - BUF 17 | Q3 8:45', type: 'score' },
  { id: '2', text: 'DET 31 - SF 28 | Q4 2:15', type: 'score' },
  { id: '3', text: 'PHI 14 - BAL 21 | Q2 5:30', type: 'score' },
  { id: '4', text: 'LIVE: Mahomes TD pass to Kelce', type: 'update' },
  { id: '5', text: 'ALERT: High edge detected on KC -3.5', type: 'alert' },
];

export function NFLTicker({ items = DEFAULT_ITEMS, className = '' }: NFLTickerProps) {
  // Duplicate items for seamless loop
  const tickerItems = [...items, ...items];

  return (
    <div className={`relative overflow-hidden bg-[#2C2F33]/90 backdrop-blur-xl border-b border-white/5 ${className}`}>
      <div className="flex items-center">
        {/* Live indicator */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#FF4D00] text-[#080808] font-bold uppercase tracking-widest text-xs">
          <Activity className="w-3 h-3 animate-pulse" />
          LIVE
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden">
          <motion.div
            className="flex whitespace-nowrap"
            animate={{
              x: ['0%', '-50%'],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: 30,
                ease: 'linear',
              },
            }}
          >
            {tickerItems.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className={`
                  inline-block px-6 text-sm font-mono
                  ${item.type === 'alert' ? 'text-[#FF4D00]' : 'text-[#F0F0F0]'}
                  ${item.type === 'score' ? 'text-[#00F5FF]' : ''}
                `}
              >
                {item.text}
                <span className="mx-4 text-[#2C2F33]">•</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
