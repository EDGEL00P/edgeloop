/**
 * TIME-CONE PREDICTION VISUALIZATION
 * Shows safe path (Cyan) vs chaos zone (Toxic Orange)
 */

'use client';

import { motion } from 'framer-motion';

interface TimeConeProps {
  predictedSpread: number;
  currentSpread: number;
  confidence: number; // 0-1
  variance: number; // Standard deviation
  className?: string;
}

export function TimeCone({
  predictedSpread,
  currentSpread,
  confidence,
  variance,
  className = '',
}: TimeConeProps) {
  const coneWidth = 400;
  const coneHeight = 200;
  const centerY = coneHeight / 2;

  // Calculate cone boundaries
  const safeZone = variance * 1.5; // 1.5 standard deviations
  const chaosZone = variance * 2.5; // 2.5 standard deviations

  // Check if current line is in chaos zone
  const lineOffset = currentSpread - predictedSpread;
  const isInChaos = Math.abs(lineOffset) > safeZone;
  const isCritical = Math.abs(lineOffset) > chaosZone;

  // Normalize for visualization
  const normalize = (value: number) => {
    const max = chaosZone * 2;
    return ((value + chaosZone) / max) * coneWidth;
  };

  const predictedX = normalize(0);
  const currentX = normalize(lineOffset);
  const safeLeft = normalize(-safeZone);
  const safeRight = normalize(safeZone);
  const chaosLeft = normalize(-chaosZone);
  const chaosRight = normalize(chaosZone);

  return (
    <div className={`relative ${className}`}>
      {/* Anomaly Alert */}
      {isCritical && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="px-4 py-2 rounded-lg bg-[#FF4D00] text-[#080808] font-bold text-sm uppercase tracking-wider animate-pulse-toxic">
            ⚠️ ANOMALY DETECTED
          </div>
        </motion.div>
      )}

      <svg width={coneWidth} height={coneHeight} className="overflow-visible">
        {/* Chaos Zone (Toxic Orange) */}
        <defs>
          <linearGradient id="chaosGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 77, 0, 0.1)" />
            <stop offset="50%" stopColor="rgba(255, 77, 0, 0.05)" />
            <stop offset="100%" stopColor="rgba(255, 77, 0, 0.1)" />
          </linearGradient>
          <linearGradient id="safeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0, 245, 255, 0.2)" />
            <stop offset="50%" stopColor="rgba(0, 245, 255, 0.3)" />
            <stop offset="100%" stopColor="rgba(0, 245, 255, 0.2)" />
          </linearGradient>
        </defs>

        {/* Left Chaos Zone */}
        <polygon
          points={`0,0 ${chaosLeft},0 ${safeLeft},${centerY} 0,${centerY}`}
          fill="url(#chaosGradient)"
          opacity={0.3}
        />
        <polygon
          points={`0,${centerY} ${safeLeft},${centerY} ${chaosLeft},${coneHeight} 0,${coneHeight}`}
          fill="url(#chaosGradient)"
          opacity={0.3}
        />

        {/* Right Chaos Zone */}
        <polygon
          points={`${chaosRight},0 ${coneWidth},0 ${coneWidth},${centerY} ${safeRight},${centerY}`}
          fill="url(#chaosGradient)"
          opacity={0.3}
        />
        <polygon
          points={`${safeRight},${centerY} ${coneWidth},${centerY} ${coneWidth},${coneHeight} ${chaosRight},${coneHeight}`}
          fill="url(#chaosGradient)"
          opacity={0.3}
        />

        {/* Safe Zone (Electric Cyan) */}
        <polygon
          points={`${safeLeft},0 ${safeRight},0 ${safeRight},${centerY} ${safeLeft},${centerY}`}
          fill="url(#safeGradient)"
        />
        <polygon
          points={`${safeLeft},${centerY} ${safeRight},${centerY} ${safeRight},${coneHeight} ${safeLeft},${coneHeight}`}
          fill="url(#safeGradient)"
        />

        {/* Predicted Line (Center) */}
        <line
          x1={predictedX}
          y1={0}
          x2={predictedX}
          y2={coneHeight}
          stroke="#00F5FF"
          strokeWidth={2}
          strokeDasharray="4 4"
          opacity={0.6}
        />

        {/* Current Line Indicator */}
        <motion.line
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          x1={currentX}
          y1={0}
          x2={currentX}
          y2={coneHeight}
          stroke={isInChaos ? '#FF4D00' : '#00F5FF'}
          strokeWidth={3}
          className={isCritical ? 'animate-pulse-toxic' : ''}
        />

        {/* Current Line Marker */}
        <motion.circle
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          cx={currentX}
          cy={centerY}
          r={8}
          fill={isInChaos ? '#FF4D00' : '#00F5FF'}
          className={isCritical ? 'animate-pulse-toxic' : ''}
          style={{
            filter: isInChaos
              ? 'drop-shadow(0 0 10px rgba(255, 77, 0, 0.8))'
              : 'drop-shadow(0 0 10px rgba(0, 245, 255, 0.6))',
          }}
        />

        {/* Labels */}
        <text
          x={safeLeft}
          y={coneHeight + 20}
          fill="#00F5FF"
          fontSize={10}
          textAnchor="middle"
        >
          Safe Zone
        </text>
        <text
          x={predictedX}
          y={coneHeight + 20}
          fill="#00F5FF"
          fontSize={10}
          textAnchor="middle"
          fontWeight="bold"
        >
          Model: {predictedSpread > 0 ? '+' : ''}
          {predictedSpread.toFixed(1)}
        </text>
        <text
          x={currentX}
          y={-10}
          fill={isInChaos ? '#FF4D00' : '#00F5FF'}
          fontSize={11}
          textAnchor="middle"
          fontWeight="bold"
        >
          Market: {currentSpread > 0 ? '+' : ''}
          {currentSpread.toFixed(1)}
        </text>
      </svg>

      {/* Confidence Indicator */}
      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1 h-2 bg-[#2C2F33] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full ${
              confidence > 0.7
                ? 'bg-[#00F5FF]'
                : confidence > 0.5
                ? 'bg-[#FF4D00]'
                : 'bg-[#2C2F33]'
            }`}
            style={{
              boxShadow:
                confidence > 0.7
                  ? '0 0 10px rgba(0, 245, 255, 0.5)'
                  : '0 0 10px rgba(255, 77, 0, 0.5)',
            }}
          />
        </div>
        <span className="text-xs text-[#F0F0F0] font-mono">
          {Math.round(confidence * 100)}%
        </span>
      </div>
    </div>
  );
}
