'use client'

import * as React from 'react'
import {
  ScoreBug,
  PlayClock,
  TeamSwitcher,
  RedZonePulse,
  type DriveEvent,
} from '@edgeloop/ui/nfl'

// Sample drive data
const sampleDrive: DriveEvent[] = [
  {
    type: 'pass',
    yards: 15,
    quarter: 1,
    clock: '12:45',
    desc: 'P.Mahomes pass deep right to T.Kelce for 15 yards',
    yardLine: 35,
  },
  {
    type: 'run',
    yards: 7,
    quarter: 1,
    clock: '12:10',
    desc: 'I.Pacheco rush left end for 7 yards',
    yardLine: 42,
  },
  {
    type: 'penalty',
    yards: -10,
    quarter: 1,
    clock: '11:55',
    desc: 'PENALTY on KC - Holding, 10 yards',
    yardLine: 32,
  },
  {
    type: 'pass',
    yards: 22,
    quarter: 1,
    clock: '11:30',
    desc: 'P.Mahomes pass short left to T.Hill for 22 yards',
    yardLine: 54,
  },
  {
    type: 'touchdown',
    yards: 20,
    quarter: 1,
    clock: '11:05',
    desc: 'P.Mahomes pass short left to T.Hill for 20 yards, TOUCHDOWN',
    yardLine: 74,
  },
]

export default function NFLExamplePage() {
  const [playClockSeconds, setPlayClockSeconds] = React.useState(40)
  const [isPlayClockRunning, setIsPlayClockRunning] = React.useState(false)
  const [inRedZone, setInRedZone] = React.useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Team Switcher */}
      <header className="border-b border-border p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">NFL Components Demo</h1>
          <TeamSwitcher variant="dropdown" />
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-8">
        {/* Score Bug Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Score Bug</h2>
          <div className="grid gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Broadcast Variant</p>
              <ScoreBug
                home={{ abbr: 'KC', name: 'Chiefs', score: 21, timeouts: 3 }}
                away={{ abbr: 'SF', name: '49ers', score: 17, timeouts: 2 }}
                quarter={3}
                clock="8:45"
                down={2}
                distance={7}
                yardLine={35}
                possession="home"
                variant="broadcast"
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Minimal Variant</p>
              <ScoreBug
                home={{ abbr: 'DAL', name: 'Cowboys', score: 24, timeouts: 1 }}
                away={{ abbr: 'PHI', name: 'Eagles', score: 20, timeouts: 2 }}
                quarter={4}
                clock="2:34"
                possession="away"
                variant="minimal"
              />
            </div>
          </div>
        </section>

        {/* Play Clock Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Play Clock</h2>
          <div className="flex gap-4 items-start">
            <PlayClock
              seconds={playClockSeconds}
              isRunning={isPlayClockRunning}
              size="lg"
            />
            <div className="space-y-2">
              <button
                onClick={() => setIsPlayClockRunning(!isPlayClockRunning)}
                className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90"
              >
                {isPlayClockRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={() => setPlayClockSeconds(40)}
                className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 block"
              >
                Reset to 40
              </button>
            </div>
          </div>
        </section>

        {/* Red Zone Indicator */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Red Zone Pulse</h2>
          <div className="relative h-64 rounded-xl bg-gradient-to-b from-[#2d5016] to-[#1a3010] overflow-hidden">
            <RedZonePulse active={inRedZone} intensity="medium" />
            <div className="relative z-10 flex items-center justify-center h-full">
              <button
                onClick={() => setInRedZone(!inRedZone)}
                className="px-6 py-3 bg-white/10 backdrop-blur text-white rounded-lg hover:bg-white/20"
              >
                {inRedZone ? 'Exit Red Zone' : 'Enter Red Zone'}
              </button>
            </div>
          </div>
        </section>

        {/* Drive Timeline List View */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Drive Timeline (List View)</h2>
          <div className="bg-card rounded-xl p-4 border border-border">
            {/* Temporarily using a simple list since 3D is having type issues */}
            <ol className="space-y-2">
              {sampleDrive.map((event, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      backgroundColor:
                        event.type === 'touchdown'
                          ? '#10B981'
                          : event.type === 'pass'
                          ? '#E31837'
                          : event.type === 'run'
                          ? '#0080C6'
                          : event.type === 'penalty'
                          ? '#FFB81C'
                          : '#869397',
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-muted-foreground">
                        {event.type}
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          event.yards > 0
                            ? 'text-confidence-high'
                            : event.yards < 0
                            ? 'text-confidence-low'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {event.yards > 0 ? `+${event.yards}` : event.yards} yds
                      </span>
                    </div>
                    <div className="text-sm text-foreground mt-1">
                      {event.desc}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>Q{event.quarter}</span>
                      <span>•</span>
                      <span>{event.clock}</span>
                      <span>•</span>
                      <span>Yard {event.yardLine}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Theme Switcher Grid */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Team Selector Grid</h2>
          <TeamSwitcher variant="grid" />
        </section>
      </main>
    </div>
  )
}
