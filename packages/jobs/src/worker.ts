import { startOddsWorker } from './workers/odds-worker'
import { closeConnections } from './index'

console.log('Starting EdgeLoop job workers...')

const workers = [startOddsWorker()].filter(Boolean)

console.log(`Started ${workers.length} workers`)

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down workers...')

  for (const worker of workers) {
    if (worker) {
      await worker.close()
    }
  }

  await closeConnections()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down workers...')

  for (const worker of workers) {
    if (worker) {
      await worker.close()
    }
  }

  await closeConnections()
  process.exit(0)
})
