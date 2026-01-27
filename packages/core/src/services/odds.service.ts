import { eq, and, desc, gte } from 'drizzle-orm'
import { getDb, oddsSnapshots, type OddsSnapshot, type NewOddsSnapshot } from '@edgeloop/db'

export async function getLatestOddsForGame(gameId: string): Promise<OddsSnapshot[]> {
  const db = getDb()

  // Get latest odds from each provider
  const result = await db.query.oddsSnapshots.findMany({
    where: eq(oddsSnapshots.gameId, gameId),
    orderBy: [desc(oddsSnapshots.fetchedAt)],
  })

  // Deduplicate to get latest per provider
  const latestByProvider = new Map<string, OddsSnapshot>()
  for (const odds of result) {
    if (!latestByProvider.has(odds.provider)) {
      latestByProvider.set(odds.provider, odds)
    }
  }

  return Array.from(latestByProvider.values())
}

/**
 * Efficiently fetch latest odds for multiple games in a single query
 * Returns a Map of gameId -> odds snapshots
 */
export async function getLatestOddsForGames(gameIds: string[]): Promise<Map<string, OddsSnapshot[]>> {
  if (gameIds.length === 0) {
    return new Map()
  }

  const db = getDb()

  // Fetch all odds for the given games
  const allOdds = await db.query.oddsSnapshots.findMany({
    where: (oddsSnapshots, { inArray }) => inArray(oddsSnapshots.gameId, gameIds),
    orderBy: [desc(oddsSnapshots.fetchedAt)],
  })

  // Group by gameId and deduplicate per provider
  const oddsMap = new Map<string, OddsSnapshot[]>()

  for (const gameId of gameIds) {
    const gameOdds = allOdds.filter(o => o.gameId === gameId)
    const latestByProvider = new Map<string, OddsSnapshot>()
    
    for (const odds of gameOdds) {
      if (!latestByProvider.has(odds.provider)) {
        latestByProvider.set(odds.provider, odds)
      }
    }

    oddsMap.set(gameId, Array.from(latestByProvider.values()))
  }

  return oddsMap
}

export async function getOddsHistory(
  gameId: string,
  provider?: string,
  since?: Date
): Promise<OddsSnapshot[]> {
  const db = getDb()

  const conditions = [eq(oddsSnapshots.gameId, gameId)]

  if (provider) {
    conditions.push(eq(oddsSnapshots.provider, provider))
  }

  if (since) {
    conditions.push(gte(oddsSnapshots.fetchedAt, since))
  }

  const result = await db.query.oddsSnapshots.findMany({
    where: and(...conditions),
    orderBy: [desc(oddsSnapshots.fetchedAt)],
  })

  return result
}

export async function saveOddsSnapshot(data: NewOddsSnapshot): Promise<OddsSnapshot> {
  const db = getDb()

  const [snapshot] = await db.insert(oddsSnapshots).values(data).returning()

  if (!snapshot) {
    throw new Error('Failed to save odds snapshot')
  }

  return snapshot
}

export async function saveBulkOddsSnapshots(data: NewOddsSnapshot[]): Promise<OddsSnapshot[]> {
  const db = getDb()

  if (data.length === 0) {
    return []
  }

  const snapshots = await db.insert(oddsSnapshots).values(data).returning()

  return snapshots
}

export function detectOddsMovement(
  previous: OddsSnapshot | null,
  current: OddsSnapshot
): { hasSignificantMovement: boolean; details: Record<string, { from: number; to: number }> } {
  if (!previous) {
    return { hasSignificantMovement: false, details: {} }
  }

  const details: Record<string, { from: number; to: number }> = {}
  let hasSignificantMovement = false

  // Check moneyline movement (significant if > 20 points)
  if (previous.moneylineHome && current.moneylineHome) {
    const diff = Math.abs(previous.moneylineHome - current.moneylineHome)
    if (diff >= 20) {
      hasSignificantMovement = true
      details['moneylineHome'] = { from: previous.moneylineHome, to: current.moneylineHome }
    }
  }

  // Check spread movement (significant if > 0.5 points)
  if (previous.spreadHome && current.spreadHome) {
    const prevSpread = parseFloat(previous.spreadHome)
    const currSpread = parseFloat(current.spreadHome)
    if (Math.abs(prevSpread - currSpread) >= 0.5) {
      hasSignificantMovement = true
      details['spreadHome'] = { from: prevSpread, to: currSpread }
    }
  }

  // Check total movement (significant if > 0.5 points)
  if (previous.totalPoints && current.totalPoints) {
    const prevTotal = parseFloat(previous.totalPoints)
    const currTotal = parseFloat(current.totalPoints)
    if (Math.abs(prevTotal - currTotal) >= 0.5) {
      hasSignificantMovement = true
      details['total'] = { from: prevTotal, to: currTotal }
    }
  }

  return { hasSignificantMovement, details }
}
