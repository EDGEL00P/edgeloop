import 'dotenv/config'
import { createServer } from 'http'
import { serve } from '@hono/node-server'
import { createApp } from '@edgeloop/api'
import { createWebSocketServer } from '@edgeloop/ws'

const port = parseInt(process.env['PORT'] ?? '3000', 10)
const host = process.env['HOST'] ?? '0.0.0.0'
const shutdownGrace = parseInt(process.env['SHUTDOWN_GRACE_MS'] ?? '5000', 10)

async function main() {
  console.log('Starting EdgeLoop server...')

  // Create Hono app
  const app = createApp()

  // Create HTTP server
  const httpServer = createServer()

  // Attach Hono to HTTP server
  const honoServer = serve({
    fetch: app.fetch,
    port,
    hostname: host,
  })

  // Create WebSocket server attached to the same HTTP server
  // Note: For production, you may want to use a separate port or server
  const io = createWebSocketServer({
    httpServer: honoServer as any,
    corsOrigin: process.env['CORS_ORIGIN'] ?? '*',
  })

  console.log(`EdgeLoop server running at http://${host}:${port}`)
  console.log('WebSocket server running on the same port')
  console.log('')
  console.log('REST API endpoints:')
  console.log('  GET  /healthz           - Health check')
  console.log('  GET  /readyz            - Readiness check')
  console.log('  GET  /api/games         - List games')
  console.log('  GET  /api/games/:id     - Get game details')
  console.log('  GET  /api/predictions   - Get predictions')
  console.log('  GET  /api/odds/:gameId  - Get odds')
  console.log('  GET  /api/model/status  - Model status')
  console.log('  GET  /api/alerts        - Get alerts')
  console.log('  GET  /api/users/me      - User profile (auth required)')
  console.log('')
  console.log('WebSocket channels:')
  console.log('  games             - All game updates')
  console.log('  games:{gameId}    - Specific game updates')
  console.log('  predictions       - Prediction updates')
  console.log('  odds              - Odds changes')
  console.log('  alerts            - System alerts')

  // Graceful shutdown
  let isShuttingDown = false

  async function shutdown(signal: string) {
    if (isShuttingDown) return
    isShuttingDown = true

    console.log(`\nReceived ${signal}, starting graceful shutdown...`)

    // Close WebSocket connections
    io.close()
    console.log('WebSocket server closed')

    // Wait for grace period
    await new Promise((resolve) => setTimeout(resolve, shutdownGrace))

    // Close HTTP server
    httpServer.close(() => {
      console.log('HTTP server closed')
      process.exit(0)
    })

    // Force exit after timeout
    setTimeout(() => {
      console.error('Forced shutdown after timeout')
      process.exit(1)
    }, shutdownGrace + 1000)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

main().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
