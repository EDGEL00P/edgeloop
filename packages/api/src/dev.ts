import { serve } from '@hono/node-server'
import { createApp } from './index'

const port = parseInt(process.env['PORT'] ?? '3000', 10)
const app = createApp()

console.log(`Starting EdgeLoop API server on port ${port}...`)

serve({
  fetch: app.fetch,
  port,
})

console.log(`EdgeLoop API running at http://localhost:${port}`)
console.log('Available endpoints:')
console.log('  GET  /healthz')
console.log('  GET  /readyz')
console.log('  GET  /api/games')
console.log('  GET  /api/games/:id')
console.log('  GET  /api/predictions')
console.log('  GET  /api/predictions/:gameId')
console.log('  GET  /api/odds/:gameId')
console.log('  GET  /api/model/status')
console.log('  GET  /api/alerts')
console.log('  GET  /api/users/me')
