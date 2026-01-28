import { Server as SocketIOServer } from 'socket.io'
import type { Server as HttpServer } from 'http'
import type { ClientMessage, ServerMessage, Channel } from '@edgeloop/shared'
import { verifyToken } from '@clerk/backend'

const clerkSecretKey = process.env['CLERK_SECRET_KEY']

if (!clerkSecretKey && process.env.NODE_ENV !== 'test') {
  console.error('Missing CLERK_SECRET_KEY - WebSocket authentication will not work')
}

export type WebSocketServerOptions = {
  httpServer: HttpServer
  corsOrigin?: string | string[]
}

/**
 * Parse allowed origins from environment variable or options.
 * Supports comma-separated list of origins.
 * Falls back to localhost for development if not configured.
 */
function getAllowedOrigins(optionOrigin?: string | string[]): string[] {
  if (optionOrigin) {
    return Array.isArray(optionOrigin) ? optionOrigin : [optionOrigin]
  }
  const corsOrigin = process.env['CORS_ORIGIN']
  if (corsOrigin && corsOrigin !== '*') {
    return corsOrigin.split(',').map((origin) => origin.trim())
  }
  // Default to localhost for development
  return ['http://localhost:3000', 'http://localhost:3001']
}

export function createWebSocketServer(options: WebSocketServerOptions): SocketIOServer {
  const allowedOrigins = getAllowedOrigins(options.corsOrigin)
  const isProduction = process.env['NODE_ENV'] === 'production'

  const io = new SocketIOServer(options.httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g., mobile apps)
        if (!origin) {
          callback(null, true)
          return
        }
        // Check if the origin is in the allowed list
        if (allowedOrigins.includes(origin)) {
          callback(null, true)
          return
        }
        // In production, reject unknown origins
        if (isProduction) {
          callback(new Error('Not allowed by CORS'), false)
          return
        }
        // In development, allow all origins
        callback(null, true)
      },
      methods: ['GET', 'POST'],
      credentials: true,
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
      if (!clerkSecretKey) {
        const response: ServerMessage = {
          type: 'auth_error',
          code: 'missing_secret',
          message: 'Server missing CLERK_SECRET_KEY',
        }
        socket.emit('message', response)
        socket.disconnect()
        return
      }

      if (!data.token) {
        const response: ServerMessage = {
          type: 'auth_error',
          code: 'missing_token',
          message: 'Authentication token is required',
        }
        socket.emit('message', response)
        socket.disconnect()
        return
      }

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
        const response: ServerMessage = {
          type: 'auth_error',
          code: 'invalid_token',
          message: 'Invalid authentication token',
        }
        socket.emit('message', response)
        socket.disconnect()
        return
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
