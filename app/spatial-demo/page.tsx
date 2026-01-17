'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SpatialCard } from '../../libs/ui/src/SpatialCard';
import { Sparkles, Zap, TrendingUp, BarChart3 } from 'lucide-react';

export default function SpatialDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071015] via-[#0d1620] to-[#1a1a1a] pt-32 pb-20">
      {/* Spatial Cards Section */}
      <section className="max-w-7xl mx-auto px-4 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Spatial Cards</h2>
          <p className="text-white/70 text-lg">3D perspective cards that respond to mouse movement</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          <SpatialCard
            title="PHASE 10"
            subtitle="Spatial Architecture v1.0"
            accentColor="blue"
            icon={<Sparkles className="w-6 h-6" />}
          />
          <SpatialCard
            title="PREDICTIONS"
            subtitle="Real-time AI Analysis"
            accentColor="red"
            icon={<Zap className="w-6 h-6" />}
          />
          <SpatialCard
            title="EDGE METRICS"
            subtitle="Live Performance Data"
            accentColor="purple"
            icon={<TrendingUp className="w-6 h-6" />}
          />
        </div>
      </section>

    </div>
  );
}
