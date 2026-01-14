# NFL Multi-Source Stats Aggregation System

## Overview
The Edgeloop platform now aggregates player and team statistics from **42 different data sources** across **5 major sports networks**, providing comprehensive coverage for advanced analytics and prediction modeling.

## Data Sources

### NFL.com (11 Sources)
**Official League Statistics**
- Passing Stats
- Rushing Stats
- Receiving Stats
- Fumbles Stats
- Tackles Stats
- Interceptions Stats
- Field Goals Stats
- Kickoffs Stats
- Kickoff Returns Stats
- Punting Stats
- Punt Returns Stats

### NextGenStats.nfl.com (5 Sources)
**Advanced Analytics & Tracking Data**
- Passing Advanced Metrics (EPA, CPOE, Time to Throw)
- Rushing Advanced Metrics (Expected Rush Yards, Efficiency)
- Receiving Advanced Metrics (Separation, Target Share)
- Top Plays: Fastest Ball Carriers
- Top Plays: Longest Rush/Pass

### ESPN.com (9 Sources)
**Comprehensive Player Statistics**
- Passing Stats
- Rushing Stats
- Receiving Stats
- Defense Stats
- Scoring Stats
- Returning Stats
- Kicking Stats
- Punting Stats

### FoxSports.com (8 Sources)
**Additional Data Validation**
- Passing Stats
- Rushing Stats
- Receiving Stats
- Defense Stats
- Kicking Stats
- Punting Stats
- Returning Stats

### CBS Sports (9 Sources)
**Cross-Reference Statistics**
- Passing Stats
- Rushing Stats
- Receiving Stats
- Defense Stats
- Kicking Stats
- Punting Stats
- Punt Returns Stats
- Kick Returns Stats

## Architecture

### TypeScript Implementation

**Files:**
- `server/services/statsSources.ts` - Source configuration and URL management
- `server/services/statsAggregator.ts` - Data fetching and normalization
- `server/routes.ts` - API endpoints for stats access

**Key Classes:**
```typescript
class StatsAggregator {
  // Cache management (1-hour TTL)
  private cache: Map<string, { data: any; timestamp: number }>

  // Fetch methods
  fetchAllPassingStats(season?: number)
  fetchAllRushingStats(season?: number)
  fetchAllReceivingStats(season?: number)
  fetchAllDefenseStats(season?: number)
  fetchAllSpecialTeamsStats(season?: number)
  fetchNextGenStats(season?: number)

  // Aggregation
  aggregatePlayerStats(playerId, season, week?)
  refreshAllStats(season)
}
```

### Python Implementation

**File:**
- `python_engine/stats_sources.py` - Python mirror configuration

**Key Functions:**
```python
def get_stat_sources_by_category(category: StatCategory)
def get_enabled_stat_sources()
async def fetch_stat_source(source_key, filters)
```

## API Endpoints

### List All Sources
```
GET /api/stats/sources
```
Returns all enabled stat sources grouped by category.

**Response:**
```json
{
  "sources": [...],
  "categories": {
    "offense": [...],
    "defense": [...],
    "special_teams": [...],
    "advanced": [...]
  }
}
```

### Get Sources by Category
```
GET /api/stats/category/:category
```
Filter sources by stat category (offense, defense, special_teams, advanced).

### Get Player Stats
```
GET /api/stats/player/:playerId?season=2024&week=5
```
Get aggregated stats for a specific player.

**Response:**
```json
{
  "playerId": 12345,
  "playerName": "Patrick Mahomes",
  "team": "KC",
  "position": "QB",
  "passing": {
    "attempts": 450,
    "completions": 320,
    "yards": 4200,
    "touchdowns": 38,
    "interceptions": 12,
    "rating": 105.5,
    "epa": 0.35,
    "successRate": 0.52,
    "cpoe": 4.2
  },
  "advanced": {
    "expectedPointsAdded": 85.4,
    "completionPercentageOverExpected": 3.2,
    "airYards": 3200,
    "averageTimeToThrow": 2.65
  }
}
```

### Get Passing Stats
```
GET /api/stats/passing?season=2024
```
Aggregate passing statistics from all sources.

### Get Rushing Stats
```
GET /api/stats/rushing?season=2024
```
Aggregate rushing statistics from all sources.

### Get Receiving Stats
```
GET /api/stats/receiving?season=2024
```
Aggregate receiving statistics from all sources.

### Get Defense Stats
```
GET /api/stats/defense?season=2024
```
Aggregate defensive statistics from all sources.

### Get Special Teams Stats
```
GET /api/stats/special-teams?season=2024
```
Aggregate special teams statistics from all sources.

### Get NextGen Stats
```
GET /api/stats/nextgen?season=2024
```
Aggregate advanced NextGen Stats from all sources.

### Refresh All Stats
```
POST /api/stats/refresh
{
  "season": 2024
}
```
Manually trigger refresh of all statistics from all sources.

**Response:**
```json
{
  "success": true,
  "message": "Stats refresh completed",
  "season": 2024,
  "totalPlayers": 2850,
  "sources": [
    "NFL.com Passing",
    "NextGen Passing",
    "ESPN Passing",
    ...
  ],
  "errors": []
}
```

## Data Normalization

### Consistent Field Mapping

Each source's data is normalized to a consistent schema:

**Passing:**
- `attempts`, `completions`, `yards`, `touchdowns`, `interceptions`, `rating`
- `epa`, `successRate`, `cpoe` (advanced)

**Rushing:**
- `attempts`, `yards`, `touchdowns`, `yardsPerAttempt`
- `epa`, `successRate` (advanced)

**Receiving:**
- `targets`, `receptions`, `yards`, `touchdowns`, `yardsPerReception`
- `epa`, `successRate` (advanced)

**Defense:**
- `tackles`, `sacks`, `interceptions`, `passesDefended`, `forcedFumbles`, `tacklesForLoss`

**Special Teams:**
- `fieldGoalsMade`, `fieldGoalsAttempted`
- `extraPointsMade`, `extraPointsAttempted`
- `punts`, `puntAverage`
- `kickoffReturns`, `kickoffReturnYards`
- `puntReturns`, `puntReturnYards`

**NextGen Advanced:**
- `epa` (Expected Points Added)
- `cpoe` (Completion Percentage Over Expected)
- `successRate`
- `airYards`, `yardsAfterCatch`
- `topSpeed`, `longestRun`, `longestPass`
- `expectedCompletion`, `averageTimeToThrow`

## Caching Strategy

- **Duration**: 1 hour (60 * 60 * 1000 ms)
- **Key**: Combination of source name and filter parameters
- **Implementation**: In-memory Map with timestamp validation
- **Refresh**: Manual refresh endpoint bypasses cache

## Error Handling

### Source-Specific Errors
- Individual source failures don't stop aggregation
- Errors logged but don't break entire request
- Partial results returned with error list in refresh endpoint

### Normalization Errors
- Missing fields default to 0 or null
- Incompatible data types logged but don't cause failure
- Validation warnings logged for analysis

## Integration with Analytics

### Weekly Metrics Enhancement
The stats aggregator enhances existing weekly metrics by:

1. **Player-Level Data**: Adds individual player performance to team-level metrics
2. **Advanced Metrics**: NextGen Stats EPA/CPOE integration
3. **Cross-Validation**: Multiple source validation for accuracy

### Exploitation Engine
Stat sources feed into exploit detection:

- **Injury Impact**: Player performance changes post-injury
- **Depth Chart Analysis**: Starter vs. replacement performance delta
- **Trend Detection**: Week-over-week performance changes
- **Matchup Analysis**: Player vs. specific defense performance

### Prediction Engine
Aggregated stats improve predictions:

- **Neural Network**: EPA, success rate, CPOE as features
- **Monte Carlo**: Player performance variance distributions
- **Agent Swarm**: Multi-source consensus on player projections

## Performance Considerations

### Parallel Fetching
All sources fetched concurrently using Promise.all for TypeScript
or asyncio for Python.

### Batch Processing
Season-wide stats fetch in batches to reduce API calls
and improve response times.

### Rate Limiting
Each source respects rate limits:
- Request queuing for high-frequency sources
- Exponential backoff for failures
- Circuit breaker for repeated failures

## Future Enhancements

### Planned Features

1. **Real-Time Updates**: WebSocket streaming of live stats
2. **Historical Data**: Multi-year historical stat archiving
3. **Player Props**: Automated prop line analysis
4. **Comparative Analysis**: Player vs. Player, Team vs. Team
5. **Trend Visualization**: Performance trends over time
6. **Source Reliability Scoring**: Weighting sources by accuracy
7. **API Proxy**: Internal proxy for source APIs with caching
8. **Differential Updates**: Only fetch changed data

### Scalability Improvements

1. **Redis Cache**: Replace in-memory cache with Redis
2. **Message Queue**: Background job processing for heavy lifts
3. **Database Storage**: Persistent storage of aggregated stats
4. **CDN Integration**: Cache responses at CDN level
5. **GraphQL API**: Query-only needed fields

## Monitoring & Metrics

### Tracked Metrics

- Source success/failure rates
- Response times per source
- Cache hit rates
- Error frequency by source
- Data freshness (last update time)

### Health Checks

```
GET /api/stats/health
```

Returns overall system health and individual source status.

## Usage Examples

### Frontend Integration
```typescript
import { getEnabledStatSources, getStatSourcesByCategory } from './services/statsAggregator';

// Fetch all passing stats for current season
const passingStats = await fetch('/api/stats/passing?season=2024');

// Get specific player stats
const playerStats = await fetch('/api/stats/player/12345?season=2024&week=5');

// Refresh all stats manually
const refreshResult = await fetch('/api/stats/refresh', {
  method: 'POST',
  body: JSON.stringify({ season: 2024 })
});
```

### Python Analytics Integration
```python
from stats_sources import fetch_stat_source, get_stat_sources_by_category
from StatCategory import StatCategory

# Fetch passing stats from all sources
passing_sources = get_stat_sources_by_category(StatCategory.OFFENSE)
for source in passing_sources:
    if "passing" in source.name.lower():
        data = await fetch_stat_source(source.key)
        # Process data
```

## Benefits

1. **Comprehensive Coverage**: 42 data sources for maximum data availability
2. **Redundancy**: Multiple sources for critical stats ensure reliability
3. **Validation**: Cross-source validation improves accuracy
4. **Advanced Metrics**: NextGen Stats provide cutting-edge analytics
5. **Consistency**: Normalized schema across all sources
6. **Performance**: Caching and parallel fetching optimize speed
7. **Scalability**: Architecture supports adding new sources easily
8. **Flexibility**: Enable/disable sources dynamically
