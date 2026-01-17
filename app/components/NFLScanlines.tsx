/**
 * NFL SCANLINES EFFECT
 * Broadcast-style scanlines for HUD aesthetic
 */

'use client';

export function NFLScanlines() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[100] opacity-[0.02]"
      style={{
        backgroundImage: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0, 245, 255, 0.1) 2px,
          rgba(0, 245, 255, 0.1) 4px
        )`,
      }}
    />
  );
}
