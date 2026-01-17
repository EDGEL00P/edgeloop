/**
 * Line Movement Timeline - 3D ESPN Style
 * 
 * Timeline sits on recessed track
 * Line extrudes slightly upward
 * Key events pop forward
 * Still flat colors - depth from geometry
 */

'use client';

import { use, useTransition } from 'react';
import { useEmphasisStore } from '@/lib/stores/emphasis';
import { motion } from 'framer-motion';

interface LineMovementData {
  events: Array<{
    time: string;
    line: number;
    movement: number;
    keyEvent?: boolean;
  }>;
}

export default function LineMovementTimeline({
  dataPromise,
}: {
  dataPromise: Promise<LineMovementData>;
}) {
  // React 19: use() for streamed data
  const data = use(dataPromise);
  const [isPending, startTransition] = useTransition();
  const { lineMovementActive, lineMovementKeyEvents } = useEmphasisStore();

  if (!lineMovementActive || !data.events.length) {
    return null;
  }

  return (
    <div className="studio-panel broadcast-spacing">
      <div className="text-xs uppercase tracking-wider text-slate-400 mb-4 font-mono">
        LINE MOVEMENT
      </div>
      
      {/* Recessed track */}
      <div 
        className="relative h-24 bg-slate-900/50 rounded overflow-hidden"
        style={{
          transform: 'perspective(1000px) rotateX(2deg)',
        }}
      >
        {/* Timeline line */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <motion.polyline
            points={data.events
              .map((e, i) => `${(i / (data.events.length - 1)) * 100},${50 - e.movement * 10}`)
              .join(' ')}
            fill="none"
            stroke="hsl(217 91% 60%)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />
        </svg>
        
        {/* Key events */}
        {data.events
          .filter((e) => e.keyEvent || Math.abs(e.movement) > 1)
          .map((event, index) => (
            <motion.div
              key={index}
              className="absolute"
              style={{
                left: `${(index / (data.events.length - 1)) * 100}%`,
                bottom: `${50 - event.movement * 10}%`,
                transform: 'translateZ(20px)', // Pop forward
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="w-2 h-2 bg-blue-400 rounded-full border-2 border-white" />
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-xs text-white whitespace-nowrap">
                {event.line}
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  );
}
