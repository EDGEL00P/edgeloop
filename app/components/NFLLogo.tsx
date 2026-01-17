/**
 * NFL LOGO COMPONENT - edgeloop
 * Subtle NFL logo watermark/decoration
 */

'use client';

import { motion } from 'framer-motion';

export function NFLLogo({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 0.05, scale: 1 }}
      transition={{ duration: 1 }}
    >
      {/* NFL Shield SVG */}
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        className="text-[#00F5FF]"
        fill="currentColor"
      >
        {/* Shield shape */}
        <path
          d="M100 20 L180 60 L180 140 L100 180 L20 140 L20 60 Z"
          fill="currentColor"
          opacity="0.1"
        />
        {/* NFL text */}
        <text
          x="100"
          y="110"
          textAnchor="middle"
          fontSize="60"
          fontWeight="900"
          fill="currentColor"
          opacity="0.2"
          fontFamily="Arial, sans-serif"
        >
          NFL
        </text>
      </svg>
    </motion.div>
  );
}
