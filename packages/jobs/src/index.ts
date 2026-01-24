import { Queue, Worker, type Job } from 'bullmq'
import IORedis from 'ioredis'

export type JobType = 'fetch-odds' | 'fetch-games' | 'update-predictions' | 'check-drift' | 'generate-alerts'

export type JobData = {
  'fetch-odds': { sport: string }
  'fetch-games': { sport: string }
  'update-predictions': { gameIds?: string[] }
  'check-drift': { modelVersion: string }
  'generate-alerts': { type: string }
}

let connection: IORedis | null = null

function getRedisConnection(): IORedis {
  if (connection) return connection

  const redisUrl = process.env['REDIS_URL']
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is required for jobs')
  }

  connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  })

  return connection
}

export function createQueue<T extends JobType>(name: T): Queue<JobData[T]> {
  return new Queue(name, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 1000,
    },
  })
}

export function createWorker<T extends JobType>(
  name: T,
  processor: (job: Job<JobData[T]>) => Promise<void>
): Worker<JobData[T]> {
  return new Worker(name, processor, {
    connection: getRedisConnection(),
    concurrency: 5,
  })
}

export async function scheduleRecurringJobs(): Promise<void> {
  const oddsQueue = createQueue('fetch-odds')
  const gamesQueue = createQueue('fetch-games')
  const driftQueue = createQueue('check-drift')

  // Fetch odds every 5 minutes
  await oddsQueue.upsertJobScheduler(
    'fetch-odds-recurring',
    { pattern: '*/5 * * * *' },
    {
      name: 'fetch-odds',
      data: { sport: 'nfl' },
    }
  )

  // Fetch games every hour
  await gamesQueue.upsertJobScheduler(
    'fetch-games-recurring',
    { pattern: '0 * * * *' },
    {
      name: 'fetch-games',
      data: { sport: 'nfl' },
    }
  )

  // Check drift every 6 hours
  await driftQueue.upsertJobScheduler(
    'check-drift-recurring',
    { pattern: '0 */6 * * *' },
    {
      name: 'check-drift',
      data: { modelVersion: 'current' },
    }
  )

  console.log('Scheduled recurring jobs')
}

export async function closeConnections(): Promise<void> {
  if (connection) {
    await connection.quit()
    connection = null
  }
}
