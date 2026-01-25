'use client'

import { useState } from 'react'
import { Activity } from 'lucide-react'
import {
  GameCard,
  Badge,
  Button,
  ScoreBug,
  Ticker,
  type TickerItem,
} from '@edgeloop/ui'
import { trpc } from '@/lib/trpc'

const tickerItems: TickerItem[] = [
  { id: '1', type: 'score', content: 'KC 24 - BUF 21 | Q4 5:42' },
  { id: '2', type: 'prediction', content: 'SF predicted to win vs DAL with 72% confidence', highlight: true },
  { id: '3', type: 'alert', content: 'Key injury update: Star QB questionable' },
  { id: '4', type: 'news', content: 'Model accuracy at 94.7% over last 100 games' },
]

export default function GamesPage() {
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'final'>('all')
  const { data: games, isLoading } = trpc.games.list.useQuery()

  const filteredGames = games?.filter((game) => {
    if (filter === 'all') return true
    if (filter === 'live') return game.status === 'live'
    if (filter === 'upcoming') return game.status === 'scheduled'
    if (filter === 'final') return game.status === 'final'
    return true
  })

  const liveGame = games?.find((g) => g.status === 'live')

  return (
    <div className="space-y-6">
      {/* Ticker */}
      <Ticker items={tickerItems} className="rounded-lg" />

      {/* Featured Live Game */}
      {liveGame && (
        <div className="broadcast-panel p-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="live">LIVE</Badge>
            <span className="text-sm text-muted-foreground">Featured Game</span>
          </div>
          <div className="flex justify-center">
            <ScoreBug
              homeTeam={liveGame.homeTeam}
              awayTeam={liveGame.awayTeam}
              homeScore={liveGame.homeScore}
              awayScore={liveGame.awayScore}
              quarter={liveGame.quarter}
              timeRemaining={liveGame.timeRemaining}
              status={liveGame.status}
              possession="home"
            />
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-broadcast-red" />
            Games
          </h1>
          <p className="text-muted-foreground mt-1">
            Live and upcoming games with AI predictions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'live' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('live')}
          >
            Live
          </Button>
          <Button
            variant={filter === 'upcoming' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </Button>
          <Button
            variant={filter === 'final' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('final')}
          >
            Final
          </Button>
        </div>
      </div>

      {/* Games Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-card border border-border rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGames?.map((game) => (
            <GameCard
              key={game.id}
              {...game}
              prediction={{
                predictedWinner: 'home',
                confidence: 0.72,
              }}
              onClick={() => {
                // Navigate to game detail
              }}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredGames?.length === 0 && (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No games found</h3>
          <p className="text-muted-foreground">
            {filter === 'live'
              ? 'No live games at the moment.'
              : filter === 'upcoming'
                ? 'No upcoming games scheduled.'
                : 'No games match your filter.'}
          </p>
        </div>
      )}
    </div>
  )
}
