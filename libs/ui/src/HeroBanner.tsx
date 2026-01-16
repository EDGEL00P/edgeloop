import React from 'react';
import { Button } from './Button';

export const HeroBanner: React.FC<{ title?: string; subtitle?: string }> = ({
  title = 'Singularity — Predictions and Edge',
  subtitle = 'Real-time predictions, broadcast-style presentation, and crisp visualizations',
}) => {
  return (
    <div className="espn-hero w-full py-16 bg-[linear-gradient(90deg,#071015,rgba(7,16,21,0.6))] border-b border-white/5" role="region" aria-label="Hero banner">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{title}</h1>
          <p className="mt-4 text-lg text-white/70 max-w-xl">{subtitle}</p>
          <div className="mt-6 flex items-center gap-3">
            <Button variant="primary" className="px-4 py-2">Explore Predictions</Button>
            <Button variant="secondary" className="px-4 py-2">Backtests</Button>
          </div>
        </div>
        <div className="hidden md:block w-80 h-40 bg-[url('/banner-stadium.jpg')] bg-cover rounded-md shadow-lg" aria-hidden />
      </div>
    </div>
  );
};

export default HeroBanner;
