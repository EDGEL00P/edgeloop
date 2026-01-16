'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const MOCK_SCHEDULE = [
  {
    week: 20,
    weekLabel: 'Divisional Round',
    games: [
      {
        id: '1',
        date: '2024-01-20',
        time: '4:30 PM',
        homeTeam: { abbreviation: 'KC', name: 'Chiefs', record: '14-3' },
        awayTeam: { abbreviation: 'BUF', name: 'Bills', record: '13-4' },
        venue: 'Arrowhead Stadium',
        status: 'scheduled',
      },
      {
        id: '2',
        date: '2024-01-20',
        time: '8:15 PM',
        homeTeam: { abbreviation: 'DET', name: 'Lions', record: '15-2' },
        awayTeam: { abbreviation: 'SF', name: '49ers', record: '12-5' },
        venue: 'Ford Field',
        status: 'scheduled',
      },
      {
        id: '3',
        date: '2024-01-21',
        time: '3:00 PM',
        homeTeam: { abbreviation: 'BAL', name: 'Ravens', record: '14-3' },
        awayTeam: { abbreviation: 'HOU', name: 'Texans', record: '10-7' },
        venue: 'M&T Bank Stadium',
        status: 'scheduled',
      },
      {
        id: '4',
        date: '2024-01-21',
        time: '6:30 PM',
        homeTeam: { abbreviation: 'SF', name: '49ers', record: '12-5' },
        awayTeam: { abbreviation: 'GB', name: 'Packers', record: '12-5' },
        venue: 'Levi\'s Stadium',
        status: 'scheduled',
      },
    ],
  },
  {
    week: 21,
    weekLabel: 'Conference Championships',
    games: [
      {
        id: '5',
        date: '2024-01-28',
        time: '3:00 PM',
        homeTeam: { abbreviation: 'BAL', name: 'Ravens', record: '14-3' },
        awayTeam: { abbreviation: 'KC', name: 'Chiefs', record: '14-3' },
        venue: 'M&T Bank Stadium',
        status: 'scheduled',
      },
      {
        id: '6',
        date: '2024-01-28',
        time: '6:30 PM',
        homeTeam: { abbreviation: 'SF', name: '49ers', record: '12-5' },
        awayTeam: { abbreviation: 'DET', name: 'Lions', record: '15-2' },
        venue: 'Levi\'s Stadium',
        status: 'scheduled',
      },
    ],
  },
  {
    week: 22,
    weekLabel: 'Super Bowl LVIII',
    games: [
      {
        id: '7',
        date: '2024-02-11',
        time: '6:30 PM',
        homeTeam: { abbreviation: 'TBD', name: 'AFC Champion', record: '' },
        awayTeam: { abbreviation: 'TBD', name: 'NFC Champion', record: '' },
        venue: 'Allegiant Stadium',
        status: 'scheduled',
      },
    ],
  },
];

export default function SchedulePage() {
  const [selectedWeek, setSelectedWeek] = useState(20);
  const weeks = Array.from({ length: 22 }, (_, i) => i + 1);

  const currentWeekData = MOCK_SCHEDULE.find((w) => w.week === selectedWeek) || {
    week: selectedWeek,
    weekLabel: `Week ${selectedWeek}`,
    games: [],
  };

  const weekIndex = weeks.indexOf(selectedWeek);
  const canGoPrev = weekIndex > 0;
  const canGoNext = weekIndex < weeks.length - 1;

  return (
    <div className="min-h-screen bg-[hsl(220_20%_4%)] pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-[hsl(185_100%_60%)]" />
            <h1 className="text-4xl font-bold">NFL Schedule</h1>
          </div>
          <p className="text-white/50">2024 Season • All Games</p>
        </div>

        {/* Week Selector */}
        <div className="card-edgeloop p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => canGoPrev && setSelectedWeek(weeks[weekIndex - 1])}
              disabled={!canGoPrev}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:border-[hsl(185_100%_50%/0.5)]"
              >
                {weeks.map((week) => (
                  <option key={week} value={week}>
                    {week <= 18
                      ? `Week ${week}`
                      : week === 19
                      ? 'Wild Card'
                      : week === 20
                      ? 'Divisional'
                      : week === 21
                      ? 'Conference Championship'
                      : 'Super Bowl'}
                  </option>
                ))}
              </select>
              <div className="text-lg font-bold">{currentWeekData.weekLabel}</div>
            </div>

            <button
              onClick={() => canGoNext && setSelectedWeek(weeks[weekIndex + 1])}
              disabled={!canGoNext}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Games List */}
        <div className="space-y-4">
          {currentWeekData.games.length > 0 ? (
            currentWeekData.games.map((game) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-edgeloop p-6 hover:border-[hsl(185_100%_50%/0.3)] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-sm text-white/50">
                        {new Date(game.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/50">
                        <Clock className="w-4 h-4" />
                        {game.time}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/50">
                        <MapPin className="w-4 h-4" />
                        {game.venue}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="text-right">
                        <div className="font-bold text-xl">{game.awayTeam.abbreviation}</div>
                        <div className="text-sm text-white/50">{game.awayTeam.name}</div>
                        {game.awayTeam.record && (
                          <div className="text-xs text-white/40 mt-1">{game.awayTeam.record}</div>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-mono font-bold">@</div>
                        <div className="text-xs text-white/50 mt-1 capitalize">{game.status}</div>
                      </div>
                      <div>
                        <div className="font-bold text-xl">{game.homeTeam.abbreviation}</div>
                        <div className="text-sm text-white/50">{game.homeTeam.name}</div>
                        {game.homeTeam.record && (
                          <div className="text-xs text-white/40 mt-1">{game.homeTeam.record}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/game/${game.id}`}
                    className="ml-6 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[hsl(185_100%_50%/0.3)] transition-all text-sm"
                  >
                    View →
                  </Link>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="card-edgeloop p-12 text-center">
              <Calendar className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Games Scheduled</h3>
              <p className="text-white/50">No games found for this week</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
