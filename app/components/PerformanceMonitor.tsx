/**
 * EDGELOOP PERFORMANCE MONITOR
 * R3F-Perf and Stats.gl integration for real-time performance monitoring
 */

'use client';

import { useEffect, useRef } from 'react';
// r3f-perf disabled due to encoding issues with font files
// import { Perf } from 'r3f-perf';
import Stats from 'stats-gl';

interface PerformanceMonitorProps {
  show?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function PerformanceMonitor({ 
  show = process.env.NODE_ENV === 'development',
  position = 'top-right' 
}: PerformanceMonitorProps) {
  const statsRef = useRef<Stats | null>(null);

  useEffect(() => {
    if (!show) return;

    // Initialize Stats.gl
    const stats = new Stats({
      logsPerSecond: 20,
      samplesLog: 100,
      samplesGraph: 10,
      precision: 2,
      horizontal: false,
      minimal: false,
      mode: 0,
    });

    statsRef.current = stats;
    
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      ${position.includes('top') ? 'top' : 'bottom'}: 0;
      ${position.includes('left') ? 'left' : 'right'}: 0;
      z-index: 9999;
      pointer-events: none;
    `;
    // @ts-ignore - Stats.gl dom property access
    container.appendChild(stats.dom);
    document.body.appendChild(container);

    const begin = () => stats.begin();
    const end = () => stats.end();

    const animate = () => {
      begin();
      end();
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
      // Stats cleanup handled automatically
    };
  }, [show, position]);

  return null;
}

// 3D Performance Monitor Component
// DISABLED: r3f-perf has encoding issues with font files in Next.js/Turbopack
// export function PerformanceMonitor3D({ show = process.env.NODE_ENV === 'development' }: { show?: boolean }) {
//   if (!show) return null;
//
//   return (
//     <Perf
//       position="top-left"
//       style={{
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         zIndex: 1000,
//       }}
//     />
//   );
// }

// Placeholder export to prevent import errors
export function PerformanceMonitor3D({ show = false }: { show?: boolean }) {
  return null;
}
