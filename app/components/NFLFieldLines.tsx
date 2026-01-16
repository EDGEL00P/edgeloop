/**
 * NFL FIELD LINES BACKGROUND
 * Subtle field yard lines for NFL aesthetic
 */

'use client';

export function NFLFieldLines() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]">
      <svg className="w-full h-full" preserveAspectRatio="none">
        {/* Yard lines */}
        {Array.from({ length: 20 }, (_, i) => (
          <line
            key={i}
            x1={`${(i + 1) * 5}%`}
            y1="0"
            x2={`${(i + 1) * 5}%`}
            y2="100%"
            stroke="#00F5FF"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}
        {/* Hash marks */}
        {Array.from({ length: 40 }, (_, i) => (
          <line
            key={`hash-${i}`}
            x1={`${(i + 0.5) * 2.5}%`}
            y1="0"
            x2={`${(i + 0.5) * 2.5}%`}
            y2="2%"
            stroke="#00F5FF"
            strokeWidth="0.5"
          />
        ))}
        {Array.from({ length: 40 }, (_, i) => (
          <line
            key={`hash-bottom-${i}`}
            x1={`${(i + 0.5) * 2.5}%`}
            y1="98%"
            x2={`${(i + 0.5) * 2.5}%`}
            y2="100%"
            stroke="#00F5FF"
            strokeWidth="0.5"
          />
        ))}
      </svg>
    </div>
  );
}
