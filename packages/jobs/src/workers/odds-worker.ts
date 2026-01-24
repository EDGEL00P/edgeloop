import { createWorker } from '../index'
import { TheOddsApiProvider } from '@edgeloop/integrations'
import { saveBulkOddsSnapshots } from '@edgeloop/core'
import type { NewOddsSnapshot } from '@edgeloop/db'

export function startOddsWorker() {
  const apiKey = process.env['ODDS_API_KEY']

  if (!apiKey) {
    console.warn('ODDS_API_KEY not set, odds worker will not function')
    return null
  }

  const provider = new TheOddsApiProvider(apiKey)

  const worker = createWorker('fetch-odds', async (job) => {
    console.log(`Processing fetch-odds job: ${job.id}`)

    const { sport } = job.data

    try {
      const oddsData = await provider.fetchOdds(sport)

      console.log(`Fetched ${oddsData.length} odds records`)

      // Transform to DB format
      // Note: We need to map external game IDs to our internal game IDs
      // For now, we'll skip this and just log
      const snapshots: NewOddsSnapshot[] = oddsData.map((odds) => ({
        gameId: odds.gameExternalId, // This would need to be mapped to internal ID
        provider: odds.provider,
        moneylineHome: odds.moneylineHome,
        moneylineAway: odds.moneylineAway,
        spreadHome: odds.spreadHome?.toString(),
        spreadHomeOdds: odds.spreadHomeOdds,
        spreadAwayOdds: odds.spreadAwayOdds,
        totalPoints: odds.totalPoints?.toString(),
        overOdds: odds.overOdds,
        underOdds: odds.underOdds,
        fetchedAt: odds.fetchedAt,
      }))

      // For now, just log the data
      console.log(`Would save ${snapshots.length} odds snapshots`)

      // When game ID mapping is implemented:
      // await saveBulkOddsSnapshots(snapshots)

      console.log(`Completed fetch-odds job: ${job.id}`)
    } catch (error) {
      console.error(`Error in fetch-odds job: ${job.id}`, error)
      throw error
    }
  })

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`)
  })

  worker.on('failed', (job, error) => {
    console.error(`Job ${job?.id} failed:`, error)
  })

  return worker
}
