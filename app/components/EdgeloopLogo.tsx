/**
 * ESPN EDGELOOP LOGO
 * 3D Shield-style logo with neon accents
 */

'use client';

import { motion } from 'framer-motion';

interface EdgeloopLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

export function EdgeloopLogo({ size = 'md', className = '', animated = true }: EdgeloopLogoProps) {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64',
  };

  const textSizes = {
    sm: { espn: 'text-[6px]', edgeloop: 'text-[10px]' },
    md: { espn: 'text-[8px]', edgeloop: 'text-[14px]' },
    lg: { espn: 'text-[12px]', edgeloop: 'text-[20px]' },
    xl: { espn: 'text-[16px]', edgeloop: 'text-[28px]' },
  };

  const textSize = textSizes[size];

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} ${className}`}
      initial={animated ? { scale: 0.9, opacity: 0 } : {}}
      animate={animated ? { scale: 1, opacity: 1 } : {}}
      transition={{ duration: 0.5 }}
      whileHover={animated ? { scale: 1.05 } : {}}
    >
      <svg
        viewBox="0 0 200 240"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Neon glow filters */}
          <filter id="neonBlue">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="neonRed">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Gradient for EDGELOOP text */}
          <linearGradient id="textGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F0F0F0" />
            <stop offset="50%" stopColor="#FF6B1A" />
            <stop offset="100%" stopColor="#FF4D00" />
          </linearGradient>
          {/* 3D shadow effect */}
          <filter id="shadow3d">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Shield base - Dark blue */}
        <path
          d="M 20 20 L 180 20 L 200 80 L 200 180 L 100 220 L 0 180 L 0 80 Z"
          fill="#0A1A2E"
          stroke="#00F5FF"
          strokeWidth="3"
          filter="url(#neonBlue)"
          opacity="0.9"
        />

        {/* Inner shield layer for depth */}
        <path
          d="M 25 25 L 175 25 L 190 75 L 190 175 L 100 210 L 10 175 L 10 75 Z"
          fill="#152B47"
          stroke="#00F5FF"
          strokeWidth="1.5"
          opacity="0.6"
        />

        {/* Top angular corners - Neon blue */}
        <path
          d="M 20 20 L 40 20 L 20 40 Z"
          fill="#00F5FF"
          filter="url(#neonBlue)"
          opacity="0.8"
        />
        <path
          d="M 180 20 L 200 20 L 200 40 L 180 20 Z"
          fill="#00F5FF"
          filter="url(#neonBlue)"
          opacity="0.8"
        />

        {/* ESPN Text - Red with glow */}
        <text
          x="100"
          y="45"
          textAnchor="middle"
          fontSize="16"
          fontWeight="900"
          fill="#FF4D00"
          fontFamily="Arial, sans-serif"
          filter="url(#neonRed)"
          style={{ textShadow: '0 0 10px #FF4D00' }}
        >
          ESPN
        </text>

        {/* Lightning bolt divider - Red neon */}
        <path
          d="M 30 60 L 50 55 L 60 70 L 70 55 L 90 60 L 110 55 L 120 70 L 130 55 L 150 60 L 170 55 L 180 70 L 170 75 L 150 70 L 130 75 L 120 60 L 110 75 L 90 70 L 70 75 L 60 60 L 50 75 L 30 70 Z"
          fill="#FF4D00"
          filter="url(#neonRed)"
          opacity="0.9"
        />

        {/* EDGELOOP Text - White with metallic orange/gold 3D effect */}
        <text
          x="100"
          y="120"
          textAnchor="middle"
          fontSize="28"
          fontWeight="900"
          fill="url(#textGradient)"
          fontFamily="Arial, sans-serif"
          letterSpacing="2"
          filter="url(#shadow3d)"
          style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(255, 77, 0, 0.5)',
          }}
        >
          EDGELOOP
        </text>
        {/* 3D side effect for EDGELOOP */}
        <text
          x="102"
          y="122"
          textAnchor="middle"
          fontSize="28"
          fontWeight="900"
          fill="#FF6B1A"
          fontFamily="Arial, sans-serif"
          letterSpacing="2"
          opacity="0.4"
        >
          EDGELOOP
        </text>

        {/* Bottom V-pattern - Complex neon lines */}
        {/* Outer blue lines */}
        <path
          d="M 60 160 L 100 200 L 140 160"
          stroke="#00F5FF"
          strokeWidth="2"
          fill="none"
          filter="url(#neonBlue)"
          opacity="0.8"
        />
        <path
          d="M 70 170 L 100 195 L 130 170"
          stroke="#00F5FF"
          strokeWidth="1.5"
          fill="none"
          filter="url(#neonBlue)"
          opacity="0.6"
        />

        {/* Inner red lines */}
        <path
          d="M 75 175 L 100 190 L 125 175"
          stroke="#FF4D00"
          strokeWidth="2"
          fill="none"
          filter="url(#neonRed)"
          opacity="0.9"
        />
        <path
          d="M 80 180 L 100 185 L 120 180"
          stroke="#FF4D00"
          strokeWidth="1.5"
          fill="none"
          filter="url(#neonRed)"
          opacity="0.7"
        />

        {/* Additional angular accents */}
        <path
          d="M 50 150 L 60 160 L 50 170 Z"
          fill="#00F5FF"
          filter="url(#neonBlue)"
          opacity="0.6"
        />
        <path
          d="M 150 150 L 160 160 L 150 170 Z"
          fill="#00F5FF"
          filter="url(#neonBlue)"
          opacity="0.6"
        />
        <path
          d="M 45 155 L 55 165 L 45 175 Z"
          fill="#FF4D00"
          filter="url(#neonRed)"
          opacity="0.5"
        />
        <path
          d="M 155 155 L 165 165 L 155 175 Z"
          fill="#FF4D00"
          filter="url(#neonRed)"
          opacity="0.5"
        />
      </svg>
    </motion.div>
  );
}
