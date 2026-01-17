/**
 * Virtual Prediction Desk - 3D ESPN Studio
 * 
 * Dark matte desk surface with slight depth
 * Hard edges, sharp corners
 * White typography projected onto planes
 */

'use client';

import { ReactNode } from 'react';

interface VirtualDeskProps {
  children: ReactNode;
}

export default function VirtualDesk({ children }: VirtualDeskProps) {
  return (
    <div 
      className="studio-desk min-h-screen"
      style={{
        background: 'linear-gradient(180deg, hsl(222 47% 8%) 0%, hsl(222 47% 11%) 50%, hsl(222 47% 8%) 100%)',
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      {/* 3D Field Lines - Behind desk */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 49px,
              hsl(217 33% 20%) 50px,
              hsl(217 33% 20%) 51px
            )
          `,
          transform: 'perspective(800px) rotateX(85deg) translateZ(-200px)',
        }}
      />
      
      {/* Main desk surface */}
      <div 
        className="relative z-10"
        style={{
          transform: 'translateZ(0)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
