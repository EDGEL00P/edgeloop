import { Server as SocketIOServer } from 'socket.io'
import type { Server as HttpServer } from 'http'
import type { ClientMessage, ServerMessage, Channel } from '@edgeloop/shared'
import { verifyToken } from '@clerk/backend'

const clerkSecretKey = process.env['CLERK_SECRET_KEY']

export type WebSocketServerOptions = {
  httpServer: HttpServer
  corsOrigin?: string | string[]
}

export function createWebSocketServer(options: WebSocketServerOptions): SocketIOServer {
  const io = new SocketIOServer(options.httpServer, {
    cors: {
      origin: options.corsOrigin ?? '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  })

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`)

    // Handle authentication
    socket.on('auth', async (data: { token: string }) => {
      let userId = 'anonymous'
      let permissions: string[] = ['read']

      // Validate input data structure
      if (!data || typeof data !== 'object') {
        console.warn('WebSocket auth received invalid data structure')
        const response: ServerMessage = {
          type: 'auth_success',
          userId,
          permissions,
        }
        socket.data.userId = userId
        socket.data.authenticated = false
        socket.emit('message', response)
        return
      }

      // Validate token with Clerk if secret key and token are available
      if (data.token && clerkSecretKey) {
        try {
          const payload = await verifyToken(data.token, {
            secretKey: clerkSecretKey,
            // Note: audience and issuer validation can be added here if needed
            // audience: 'websocket-service',
            // issuer: process.env.CLERK_ISSUER
          })
          if (payload.sub) {
            userId = payload.sub
            permissions = ['read', 'write']
          }
        } catch (err) {
          console.warn(`WebSocket auth validation failed: ${err instanceof Error ? err.message : String(err)}`)
          // Fall through to anonymous access
        }
      }

      socket.data.userId = userId
      socket.data.authenticated = userId !== 'anonymous'

      const response: ServerMessage = {
        type: 'auth_success',
        userId,
        permissions,
      }
      socket.emit('message', response)
    })

    // Handle channel subscriptions
    socket.on('subscribe', (channels: string[]) => {
      for (const channel of channels) {
        if (isValidChannel(channel)) {
          socket.join(channel)
          console.log(`Client ${socket.id} subscribed to ${channel}`)
        }
      }

      const response: ServerMessage = {
        type: 'subscribed',
        channels,
      }
      socket.emit('message', response)
    })

    socket.on('unsubscribe', (channels: string[]) => {
      for (const channel of channels) {
        socket.leave(channel)
        console.log(`Client ${socket.id} unsubscribed from ${channel}`)
      }

      const response: ServerMessage = {
        type: 'unsubscribed',
        channels,
      }
      socket.emit('message', response)
    })

    // Handle ping/pong
    socket.on('ping', () => {
      const response: ServerMessage = { type: 'pong' }
      socket.emit('message', response)
    })

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`)
    })
  })

  return io
}

function isValidChannel(channel: string): channel is Channel {
  const validPrefixes = ['games', 'predictions', 'odds', 'alerts']
  return validPrefixes.some((prefix) => channel === prefix || channel.startsWith(`${prefix}:`))
}

export function broadcastToChannel(io: SocketIOServer, channel: Channel, event: any): void {
  const message: ServerMessage = {
    type: 'event',
    channel,
    event,
  }
  io.to(channel).emit('message', message)
}

export function broadcastGameUpdate(
  io: SocketIOServer,
  gameId: string,
  event: { homeScore: number; awayScore: number; quarter?: number; timeRemaining?: string }
): void {
  const gameEvent = {
    eventType: 'score_update' as const,
    gameId,
    timestamp: new Date().toISOString(),
    data: event,
  }

  broadcastToChannel(io, 'games', gameEvent)
  broadcastToChannel(io, `games:${gameId}` as Channel, gameEvent)
}

export function broadcastPredictionUpdate(
  io: SocketIOServer,
  gameId: string,
  event: { modelVersion: string; winProbHome: number; winProbAway: number; confidence: number; edges: Record<string, number> }
): void {
  const predEvent = {
    eventType: 'prediction_updated' as const,
    gameId,
    timestamp: new Date().toISOString(),
    data: event,
  }

  broadcastToChannel(io, 'predictions', predEvent)
  broadcastToChannel(io, `predictions:${gameId}` as Channel, predEvent)
}

export function broadcastOddsChange(
  io: SocketIOServer,
  gameId: string,
  event: { provider: string; previous: any; current: any }
): void {
  const oddsEvent = {
    eventType: 'odds_changed' as const,
    gameId,
    timestamp: new Date().toISOString(),
    data: event,
  }

  broadcastToChannel(io, 'odds', oddsEvent)
  broadcastToChannel(io, `odds:${gameId}` as Channel, oddsEvent)
}

export function broadcastAlert(
  io: SocketIOServer,
  event: { alertId: string; severity: 'info' | 'warn' | 'crit'; type: string; title: string; gameId?: string }
): void {
  const alertEvent = {
    eventType: 'alert_created' as const,
    alertId: event.alertId,
    timestamp: new Date().toISOString(),
    data: {
      severity: event.severity,
      type: event.type,
      title: event.title,
      gameId: event.gameId,
    },
  }

  broadcastToChannel(io, 'alerts', alertEvent)
}
