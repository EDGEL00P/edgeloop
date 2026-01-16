/**
 * NFL HUD OVERLAY - edgeloop
 * Fighter jet cockpit-style HUD elements
 */

'use client';

import { motion } from 'framer-motion';

export function NFLHUDOverlay() {
  return (
    <>
      {/* Corner brackets - Top Left */}
      <div className="fixed top-4 left-4 z-50 pointer-events-none">
        <div className="relative w-20 h-20">
          <div className="absolute top-0 left-0 w-8 h-1 bg-[#00F5FF] opacity-30 shadow-[0_0_8px_rgba(0,245,255,0.3)]" />
          <div className="absolute top-0 left-0 w-1 h-8 bg-[#00F5FF] opacity-30 shadow-[0_0_8px_rgba(0,245,255,0.3)]" />
        </div>
      </div>

      {/* Corner brackets - Top Right */}
      <div className="fixed top-4 right-4 z-50 pointer-events-none">
        <div className="relative w-20 h-20">
          <div className="absolute top-0 right-0 w-8 h-1 bg-[#00F5FF] shadow-[0_0_10px_rgba(0,245,255,0.5)]" />
          <div className="absolute top-0 right-0 w-1 h-8 bg-[#00F5FF] shadow-[0_0_10px_rgba(0,245,255,0.5)]" />
        </div>
      </div>

      {/* Corner brackets - Bottom Left */}
      <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
        <div className="relative w-20 h-20">
          <div className="absolute bottom-0 left-0 w-8 h-1 bg-[#00F5FF] shadow-[0_0_10px_rgba(0,245,255,0.5)]" />
          <div className="absolute bottom-0 left-0 w-1 h-8 bg-[#00F5FF] shadow-[0_0_10px_rgba(0,245,255,0.5)]" />
        </div>
      </div>

      {/* Corner brackets - Bottom Right */}
      <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
        <div className="relative w-20 h-20">
          <div className="absolute bottom-0 right-0 w-8 h-1 bg-[#00F5FF] shadow-[0_0_10px_rgba(0,245,255,0.5)]" />
          <div className="absolute bottom-0 right-0 w-1 h-8 bg-[#00F5FF] shadow-[0_0_10px_rgba(0,245,255,0.5)]" />
        </div>
      </div>

      {/* Center crosshair - Subtle */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none opacity-[0.02]">
        <div className="w-1 h-20 bg-[#00F5FF]" />
        <div className="w-20 h-1 bg-[#00F5FF] -mt-10 -ml-10" />
      </div>
    </>
  );
}
