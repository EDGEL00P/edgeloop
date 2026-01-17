'use client';

/**
 * MOMENTUM STRIP — Drive-by-drive momentum visualization
 * NFL Next Gen Stats-style horizontal timeline showing game flow
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, ArrowRight, ArrowDown, Circle } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface DriveData {
  id: string;
  team: string;
  quarter: number;
  startTime: string;
  endTime: string;
  plays: number;
  yards: number;
  result: 'touchdown' | 'field_goal' | 'punt' | 'turnover' | 'downs' | 'end_half' | 'in_progress';
  pointsScored: number;
  epa?: number;
}

interface MomentumStripProps {
  drives: DriveData[];
  homeTeam: string;
  awayTeam: string;
  homeColor?: string;
  awayColor?: string;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESULT ICONS & COLORS
// ═══════════════════════════════════════════════════════════════════════════

const RESULT_CONFIG = {
  touchdown: { 
    icon: '🏈', 
    color: 'hsl(145, 80%, 55%)', 
    bgColor: 'hsl(145, 80%, 55%, 0.2)',
    label: 'TD' 
  },
  field_goal: { 
    icon: '🥅', 
    color: 'hsl(45, 100%, 60%)', 
    bgColor: 'hsl(45, 100%, 60%, 0.2)',
    label: 'FG' 
  },
  punt: { 
    icon: '👟', 
    color: 'hsl(0, 0%, 60%)', 
    bgColor: 'hsl(0, 0%, 60%, 0.1)',
    label: 'PUNT' 
  },
  turnover: { 
    icon: '💔', 
    color: 'hsl(348, 100%, 60%)', 
    bgColor: 'hsl(348, 100%, 60%, 0.2)',
    label: 'TO' 
  },
  downs: { 
    icon: '✋', 
    color: 'hsl(30, 100%, 50%)', 
    bgColor: 'hsl(30, 100%, 50%, 0.2)',
    label: 'DOWNS' 
  },
  end_half: { 
    icon: '⏱️', 
    color: 'hsl(0, 0%, 50%)', 
    bgColor: 'hsl(0, 0%, 50%, 0.1)',
    label: 'END' 
  },
  in_progress: { 
    icon: '▶️', 
    color: 'hsl(185, 100%, 50%)', 
    bgColor: 'hsl(185, 100%, 50%, 0.2)',
    label: 'LIVE' 
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// DRIVE BLOCK COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface DriveBlockProps {
  drive: DriveData;
  isHome: boolean;
  homeColor: string;
  awayColor: string;
  index: number;
}

function DriveBlock({ drive, isHome, homeColor, awayColor, index }: DriveBlockProps) {
  const config = RESULT_CONFIG[drive.result];
  const teamColor = isHome ? homeColor : awayColor;
  
  // Width based on yards gained (min 40px, max 120px)
  const width = Math.max(40, Math.min(120, 40 + (drive.yards / 100) * 80));
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="relative flex flex-col items-center"
      style={{ width }}
    >
      {/* Team indicator bar */}
      <div 
        className={`w-full h-1 rounded-full ${isHome ? 'mt-auto' : 'mb-auto'}`}
        style={{ backgroundColor: teamColor }}
      />
      
      {/* Drive block */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`
          relative w-full py-2 px-1 rounded-lg cursor-pointer
          flex flex-col items-center justify-center gap-1
          border transition-all
          ${isHome ? '-mt-0.5' : '-mb-0.5'}
        `}
        style={{ 
          backgroundColor: config.bgColor,
          borderColor: `${config.color}40`,
        }}
      >
        {/* Result indicator */}
        <span className="text-base">{config.icon}</span>
        
        {/* Yards */}
        <span className="text-xs font-mono font-bold" style={{ color: config.color }}>
          {drive.yards}y
        </span>
        
        {/* Points if scored */}
        {drive.pointsScored > 0 && (
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[hsl(145_80%_55%)] 
                         flex items-center justify-center text-xs font-bold text-black">
            {drive.pointsScored}
          </span>
        )}
        
        {/* EPA indicator */}
        {drive.epa !== undefined && (
          <div className={`text-[9px] font-mono ${drive.epa > 0 ? 'text-[hsl(145_80%_55%)]' : 'text-[hsl(348_100%_60%)]'}`}>
            {drive.epa > 0 ? '+' : ''}{drive.epa.toFixed(1)} EPA
          </div>
        )}
      </motion.div>
      
      {/* Tooltip on hover (using CSS) */}
      <div className="absolute top-full mt-1 z-10 opacity-0 hover:opacity-100 pointer-events-none
                    bg-[hsl(220_18%_8%)] border border-white/10 rounded-lg p-2 text-xs whitespace-nowrap
                    shadow-xl transition-opacity">
        <div className="font-bold">{drive.team} Drive</div>
        <div className="text-white/60">Q{drive.quarter} • {drive.plays} plays • {drive.yards} yards</div>
        <div style={{ color: config.color }}>{config.label}</div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// QUARTER MARKER
// ═══════════════════════════════════════════════════════════════════════════

function QuarterMarker({ quarter }: { quarter: number }) {
  return (
    <div className="flex flex-col items-center justify-center px-2">
      <div className="h-full w-px bg-white/10" />
      <div className="py-1 px-2 rounded bg-white/5 text-[10px] font-bold text-white/40">
        Q{quarter}
      </div>
      <div className="h-full w-px bg-white/10" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function MomentumStrip({
  drives,
  homeTeam,
  awayTeam,
  homeColor = 'hsl(145, 80%, 55%)',
  awayColor = 'hsl(348, 100%, 60%)',
  className = '',
}: MomentumStripProps) {
  // Calculate summary stats
  const stats = useMemo(() => {
    const homeStats = { 
      drives: 0, 
      yards: 0, 
      points: 0, 
      turnovers: 0, 
      epa: 0 
    };
    const awayStats = { 
      drives: 0, 
      yards: 0, 
      points: 0, 
      turnovers: 0, 
      epa: 0 
    };
    
    drives.forEach((d) => {
      const target = d.team === homeTeam ? homeStats : awayStats;
      target.drives++;
      target.yards += d.yards;
      target.points += d.pointsScored;
      if (d.result === 'turnover') target.turnovers++;
      if (d.epa) target.epa += d.epa;
    });
    
    return { home: homeStats, away: awayStats };
  }, [drives, homeTeam]);

  // Group drives by quarter
  const drivesByQuarter = useMemo(() => {
    const grouped: { quarter: number; drives: DriveData[] }[] = [];
    let currentQuarter = 0;
    
    drives.forEach((drive) => {
      if (drive.quarter !== currentQuarter) {
        currentQuarter = drive.quarter;
        grouped.push({ quarter: currentQuarter, drives: [] });
      }
      grouped[grouped.length - 1]?.drives.push(drive);
    });
    
    return grouped;
  }, [drives]);

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[hsl(185_100%_60%)]" />
          <h3 className="font-bold">Game Flow</h3>
        </div>
        
        {/* Quick stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: awayColor }} />
            <span>{awayTeam}</span>
            <span className="font-mono font-bold">{stats.away.points}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: homeColor }} />
            <span>{homeTeam}</span>
            <span className="font-mono font-bold">{stats.home.points}</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative overflow-x-auto pb-4">
        <div className="flex items-center gap-1 min-w-max">
          {/* Center line */}
          <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10 -translate-y-1/2" />
          
          {drivesByQuarter.map((qData, qIndex) => (
            <div key={qData.quarter} className="flex items-center">
              {/* Quarter marker */}
              {qIndex > 0 && <QuarterMarker quarter={qData.quarter} />}
              
              {/* Drives */}
              <div className="flex items-center gap-1">
                {qData.drives.map((drive, dIndex) => {
                  const isHome = drive.team === homeTeam;
                  const globalIndex = drives.findIndex((d) => d.id === drive.id);
                  
                  return (
                    <div
                      key={drive.id}
                      className={`flex flex-col ${isHome ? 'flex-col' : 'flex-col-reverse'}`}
                    >
                      <DriveBlock
                        drive={drive}
                        isHome={isHome}
                        homeColor={homeColor}
                        awayColor={awayColor}
                        index={globalIndex}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2">
        {Object.entries(RESULT_CONFIG).slice(0, 4).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1 text-[10px] text-white/50">
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </div>
        ))}
      </div>

      {/* Summary bar */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-white/[0.03] space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: awayColor }} />
            <span className="text-sm font-bold">{awayTeam}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-white/50">Drives</div>
              <div className="font-mono font-bold">{stats.away.drives}</div>
            </div>
            <div>
              <div className="text-white/50">Yards</div>
              <div className="font-mono font-bold">{stats.away.yards}</div>
            </div>
            <div>
              <div className="text-white/50">EPA</div>
              <div className={`font-mono font-bold ${stats.away.epa > 0 ? 'text-[hsl(145_80%_55%)]' : 'text-[hsl(348_100%_60%)]'}`}>
                {stats.away.epa > 0 ? '+' : ''}{stats.away.epa.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-3 rounded-lg bg-white/[0.03] space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: homeColor }} />
            <span className="text-sm font-bold">{homeTeam}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-white/50">Drives</div>
              <div className="font-mono font-bold">{stats.home.drives}</div>
            </div>
            <div>
              <div className="text-white/50">Yards</div>
              <div className="font-mono font-bold">{stats.home.yards}</div>
            </div>
            <div>
              <div className="text-white/50">EPA</div>
              <div className={`font-mono font-bold ${stats.home.epa > 0 ? 'text-[hsl(145_80%_55%)]' : 'text-[hsl(348_100%_60%)]'}`}>
                {stats.home.epa > 0 ? '+' : ''}{stats.home.epa.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

export function generateMockDriveData(
  homeTeam: string,
  awayTeam: string
): DriveData[] {
  const drives: DriveData[] = [];
  const results: DriveData['result'][] = ['touchdown', 'field_goal', 'punt', 'turnover', 'downs'];
  const weights = [0.2, 0.15, 0.4, 0.15, 0.1];
  
  let driveId = 1;
  let possession = Math.random() > 0.5 ? homeTeam : awayTeam;
  
  for (let quarter = 1; quarter <= 4; quarter++) {
    const drivesPerQuarter = 3 + Math.floor(Math.random() * 3);
    
    for (let d = 0; d < drivesPerQuarter; d++) {
      // Random result based on weights
      const rand = Math.random();
      let cumulative = 0;
      let result: DriveData['result'] = 'punt';
      for (let i = 0; i < results.length; i++) {
        cumulative += weights[i];
        if (rand < cumulative) {
          result = results[i];
          break;
        }
      }
      
      const yards = result === 'touchdown' ? 40 + Math.floor(Math.random() * 40) :
                   result === 'field_goal' ? 30 + Math.floor(Math.random() * 30) :
                   Math.floor(Math.random() * 40);
      
      const points = result === 'touchdown' ? 7 : result === 'field_goal' ? 3 : 0;
      
      drives.push({
        id: `drive-${driveId++}`,
        team: possession,
        quarter,
        startTime: `${12 - d * 4}:00`,
        endTime: `${10 - d * 4}:00`,
        plays: 4 + Math.floor(Math.random() * 8),
        yards,
        result,
        pointsScored: points,
        epa: (Math.random() - 0.3) * 6,
      });
      
      // Switch possession
      possession = possession === homeTeam ? awayTeam : homeTeam;
    }
  }
  
  return drives;
}
