import { NextRequest } from 'next/server'

export const runtime = 'edge'

/**
 * SSE Endpoint for Real-Time Edge Feed
 * Clients connect and receive live edge updates via Server-Sent Events
 * 
 * In production, this would connect to Redis pub/sub (edges:new channel)
 * For now, it demonstrates the SSE pattern
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const gameId = searchParams.get('gameId')

  // Create a readable stream for SSE
  const encoder = new TextEncoder()
  const customReadable = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ ok: true, connected: true, timestamp: new Date().toISOString() })}\n\n`
        )
      )

      // In production, subscribe to Redis pub/sub here
      // const sub = await redisSub('edges:new')
      // sub.on('message', (_ch, msg) => {
      //   const edge = JSON.parse(msg)
      //   if (!gameId || edge.gameId === gameId) {
      //     controller.enqueue(encoder.encode(`data: ${msg}\n\n`))
      //   }
      // })

      // Send demo edge every 5 seconds
      const interval = setInterval(() => {
        const demoEdge = {
          id: Math.random().toString(36).substring(7),
          gameId: gameId || 'demo',
          game_home: 'KC',
          game_away: 'BUF',
          market: 'spread',
          ev: Math.random() * 0.1,
          bestBook: 'DraftKings',
          type: 'ev',
          timestamp: new Date().toISOString(),
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(demoEdge)}\n\n`)
        )
      }, 5000)

      // Cleanup on disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        // In production: sub.quit()
        controller.close()
      })
    },
  })

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
