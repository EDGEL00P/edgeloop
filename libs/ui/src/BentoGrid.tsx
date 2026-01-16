'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface BentoGridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children, cols = 3, className = '' }) => {
  const colsMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${colsMap[cols]} gap-4 w-full ${className}`}>
      {children}
    </div>
  );
};

export interface BentoGridItemProps {
  title?: string;
  description?: string;
  className?: string;
  children?: ReactNode;
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2 | 3;
}

export const BentoGridItem: React.FC<BentoGridItemProps> = ({
  title,
  description,
  className = '',
  children,
  colSpan = 1,
  rowSpan = 1,
}) => {
  const colSpanMap = {
    1: 'md:col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-3',
    4: 'md:col-span-4',
  };

  const rowSpanMap = {
    1: 'md:row-span-1',
    2: 'md:row-span-2',
    3: 'md:row-span-3',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative p-6 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md hover:border-white/20 transition-colors ${colSpanMap[colSpan]} ${rowSpanMap[rowSpan]} ${className}`}
    >
      {title && <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>}
      {description && <p className="text-sm text-white/70 mb-4">{description}</p>}
      {children}
    </motion.div>
  );
};

export default BentoGrid;
