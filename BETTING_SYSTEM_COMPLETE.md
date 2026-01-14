# Edgeloop NFL Betting & Analytics System - Complete Integration

## System Overview

Edgeloop is a comprehensive NFL sports analytics platform with advanced betting intelligence, combining predictive modeling, market analysis, and real-time data aggregation.

## Architecture

### Frontend (Next.js 13)
- **Apps**: `/apps/web` (main web app), `/apps/api` (backend API)
- **Client**: `/client` (React components, hooks, utilities)
- **Styling**: Tailwind CSS with shadcn/ui components
- **State**: Zustand + React Query

### Backend (Express + Python/FastAPI)
- **Server**: `/server` (TypeScript Express server)
- **Python Engine**: `/python_engine` (FastAPI + ML models)
- **Database**: PostgreSQL with Drizzle ORM
- **Caching**: In-memory + Redis (planned)

---

## New Singularity Betting System

### Overview
Advanced betting exploit detection and CLV tracking system that identifies market inefficiencies through data-driven analysis.

### Files Created

#### TypeScript (`/server/betting/`)

**1. `marketComparator.ts`**
- Compares model predictions to market odds
- Calculates edges for spread, total, moneyline
- Identifies opening line exploits
- Detects market overreactions
- Kelly Criterion calculations

**2. `clvTracker.ts`**
- Tracks all bets with timestamps
- Records opening and closing lines
- Calculates CLV (Closing Line Value) for each bet
- Generates performance metrics:
  - Total ROI
  - Average CLV
  - Win rates with/without CLV
  - Breakdown by bet type

**3. `kellyCalculator.ts`**
- Optimal bet sizing calculations
- Fractional Kelly implementation (25% default)
- Risk level assessment
- Bankroll management
- Stop-loss calculations

**4. `featureEngineering.ts`**
- Team metrics aggregation (EPA, success rates, situational)
- Matchup feature extraction
- Player vs. positional matchups
- Weather adjustments
- Injury impact quantification

**5. `modelPredictor.ts`**
- Ensemble model combining:
  - Agent Swarm (35% weight)
  - Neural Network (30% weight)
  - Monte Carlo (20% weight)
  - Elo Rating (10% weight)
  - DVOA (5% weight)
- Consensus scoring
- Model agreement detection
- Confidence intervals
- Risk factor calculation

**6. `bettingService.ts`**
- Main service orchestrating all betting components
- Game analysis pipeline
- Exploit identification
- Recommendation generation
- Bet placement and tracking
- Week-based batch analysis

#### Python (`/python_engine/`)

**`market_analyzer.py`**
- Market odds conversion utilities
- Probability calculations
- Edge detection algorithms
- Opening line exploit finder
- Market overreaction detector

### API Endpoints

#### Analysis & Prediction
```
GET  /api/betting/analyze/:gameId
POST /api/betting/predict
GET  /api/betting/edges
GET  /api/betting/exploits
GET  /api/betting/week/:season/:week
```

#### Betting Management
```
POST /api/betting/place
GET  /api/betting/history
GET  /api/betting/pending
POST /api/betting/settle
```

#### CLV & Performance
```
GET  /api/betting/clv
POST /api/betting/closing-lines
GET  /api/betting/kelly/:bankroll/:winProb/:odds
```

### Singularity Exploit Types

1. **Opening Line Exploit**
   - Model detects value in opening lines before market adjustment
   - Window: Immediately after line release
   - Edge: 3-7%

2. **Injury Exploit**
   - Rapid re-evaluation after injury reports
   - Quantifies player replacement impact
   - Edge: 4-8%

3. **Weather Exploit**
   - Weather impact modeling
   - Lines slow to adjust for extreme conditions
   - Edge: 3-5%

4. **Schematic Mismatch Exploit**
   - Unit vs. Unit analysis (e.g., O-Line vs. Pass Rush)
   - PFF grades integration
   - Edge: 3-6%

5. **Market Overreaction Exploit**
   - Post-blowout line movement detection
   - Fade overadjusted lines
   - Edge: 2-4%

### Model Weights

```
Agent Swarm:      35%
Neural Network:    30%
Monte Carlo:       20%
Elo Rating:       10%
DVOA:             5%
```

### Feature Importance

```
Offensive Efficiency:  25%
Defensive Efficiency:  25%
Situational:         15%
Injury Impact:       15%
Weather Impact:       10%
Player Matchup:      10%
```

---

## Multi-Source Stats Aggregation

### Overview
Aggregates statistics from 42 data sources across 5 major sports networks.

### Sources by Network

**NFL.com (11 sources)**
- Passing, Rushing, Receiving, Fumbles, Tackles, Interceptions
- Field Goals, Kickoffs, Kickoff Returns, Punting, Punt Returns

**NextGenStats (5 sources)**
- Passing, Rushing, Receiving (advanced metrics)
- Top Plays: Fastest Ball Carriers, Longest Rush, Longest Pass

**ESPN (9 sources)**
- Passing, Rushing, Receiving, Defense, Scoring, Returning
- Kicking, Punting

**Fox Sports (8 sources)**
- Passing, Rushing, Receiving, Defense, Kicking, Punting, Returning

**CBS Sports (9 sources)**
- Passing, Rushing, Receiving, Defense, Kicking, Punting
- Punt Returns, Kick Returns

**Total: 42 data sources**

### API Endpoints

```
GET  /api/stats/sources              # All sources grouped by category
GET  /api/stats/category/:category   # Sources by category
GET  /api/stats/player/:playerId   # Player aggregate stats
GET  /api/stats/passing            # All passing stats
GET  /api/stats/rushing            # All rushing stats
GET  /api/stats/receiving           # All receiving stats
GET  /api/stats/defense            # All defense stats
GET  /api/stats/special-teams       # All special teams stats
GET  /api/stats/nextgen            # All NextGen stats
POST /api/stats/refresh             # Refresh all from sources
```

---

## Singularity Configuration

### Enabled Signals (19)

#### Market Data (4)
- LINE_MOVEMENT_SHARP_BOOKS_PINNACLE_CIRCA
- REVERSE_LINE_MOVEMENT_PUBLIC_FADE
- STEAM_MOVE_CHASE_WITHIN_60_SECONDS
- SHARP_MONEY_PERCENTAGE_OVER_50

#### Weather (2)
- WEATHER_WIND_SPEED_OVER_15_MPH
- WEATHER_TEMP_BELOW_FREEZING_OR_OVER_90F

#### Game Factors (2)
- REFEREE_CREW_BIAS_OVER_60_PERCENT
- STADIUM_TURF_TYPE_IMPACT_FACTOR

#### Injuries (3)
- INJURY_OFFENSIVE_LINE_STARTER_OUT
- INJURY_DEFENSIVE_STAR_OUT
- LATE_SCRATCH_CONFIRMED_VIA_API

#### Betting (1)
- ARBITRAGE_OPPORTUNITY_POSITIVE_EV

#### Roster Moves (2)
- PRACTICE_SQUAD_ELEVATION_SIGNAL
- KEY_POSITION_DEPTH_CHART_CRITICAL_FAILURE

#### Analytics (1)
- MODEL_PROJECTION_VARIANCE_OVER_5_POINTS

#### Scheduling (3)
- REST_DISADVANTAGE_GREATER_THAN_48_HOURS
- TRAVEL_CROSS_COUNTRY_NO_REST
- DIVISIONAL_UNDERDOG_LATE_SEASON

#### Coaching (1)
- COACH_POST_BYE_WEEK_RECORD_OVER_70_PERCENT

### Disabled Noise Signals (17)

**Blocked:**
- Public opinion polls
- TV commentator analysis
- Social media hype videos
- Pre-season performance metrics
- Historical trends older than 3 years
- Team loyalty/fan bias
- Emotional hedging strategies
- Expert consensus without data
- Revenge game narratives without stats
- Prime time game myths
- Must-win narratives
- Trap game speculation
- Player interview quotes
- Unconfirmed rumors/leaks
- Crowd noise levels
- Jersey color trends
- Coin toss result correlations
- Garbage time stats

---

## Existing Analytics Engine

### OmniEngine (`/server/analytics/omniEngine.ts`)
- Comprehensive team metrics
- Weekly performance tracking
- Exploit signal generation

### PredictionEngine (`/server/analytics/predictionEngine.ts`)
- Historical data analysis
- ATS records, over/under records
- Home field advantage calculation
- Weather impact modeling
- Matchup analysis

### AgentSwarm (`/server/analytics/agentSwarm.ts`)
- Multi-agent consensus
- Monte Carlo simulation
- Kelly Criterion with uncertainty
- Swarm analysis inputs

### ExploitEngine (`/server/analytics/exploitEngine.ts`)
- Integrated with Singularity config
- 32 detectors for betting edges
- Signal filtering enabled
- Key number detection
- Weather elasticity
- Injury cascade detection
- Steam moves, reverse line moves

---

## Infrastructure

### Circuit Breaker (`/server/infrastructure/circuit-breaker.ts`)
- API failure protection
- Automatic recovery
- State tracking

### Rate Limiter (`/server/infrastructure/rate-limiter.ts`)
- Request throttling
- Per-endpoint limits
- Sliding window implementation

### Metrics (`/server/infrastructure/metrics.ts`)
- Performance tracking
- Request counting
- Error rate monitoring

### Cache (`/server/infrastructure/cache.ts`)
- In-memory caching
- TTL management
- Key invalidation

---

## Database Schema

### Core Tables (`/shared/schema.ts`)

#### Teams & Players
- `nfl_teams` - 32 NFL teams
- `nfl_players` - All player data
- `nfl_games` - Game schedules and results

#### Metrics
- `weekly_metrics` - EPA, success rates, team efficiency
- `exploit_signals` - Detected betting opportunities
- `line_movements` - Line tracking

#### Betting
- Models for tracking bets, CLV, and performance
- Authentication models (via Replit integration)

---

## Python ML Engine

### Models

**`neural_predictor.py`**
- MLPRegressor for score prediction
- MLPClassifier for win probability
- Feature extraction (EPA, CPOE, success rates)
- Model persistence with joblib

**`monte_carlo.py`**
- Bivariate normal distribution for game simulation
- 100K+ iterations default
- Confidence intervals (68%, 95%)
- Correlation modeling

**`correlation_matrix.py`**
- Feature correlation analysis
- Multi-collinearity detection
- Heatmap generation

**`id_mapper.py`**
- Player/team ID mapping across sources
- Cross-reference management

**`kelly_staking.py`**
- Original Kelly Criterion implementation
- Edge calculations
- Optimal stake sizing

### Configuration

**`config.py`**
- Environment variable management
- Model parameters
- API keys

**`singularity_config.py`**
- Signal enable/disable flags
- Category organization
- Filter functions

**`stats_sources.py`**
- 42 source definitions
- Category mapping
- Fetch utilities

---

## External Services Integration

### ESPN (`/server/services/espnService.ts`)
- Team stats
- Injury reports
- Depth charts
- Matchup data
- Auto-refresh capability

### Weather (`/server/services/weatherService.ts`)
- Venue-based weather
- Temperature, wind, precipitation
- Impact modeling

### Odds (`/server/services/oddsService.ts`)
- Live odds aggregation
- Line movement tracking
- Multiple sportsbooks

### News (`/server/services/newsService.ts`)
- NFL news aggregation
- Sentiment analysis (planned)

### Media (`/server/services/mediaService.ts`)
- Game broadcasts
- Podcasts
- TV networks
- Team radio

### AI Services
- `aiService.ts` - Generic AI integration
- `aiRouter.ts` - AI routing
- `geminiService.ts` - Google Gemini

---

## API Routes Summary

### Auth
```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### NFL Data
```
GET  /api/nfl/teams
POST /api/nfl/teams/refresh
GET  /api/nfl/players
POST /api/nfl/players/refresh
GET  /api/nfl/games
```

### Stats (42 sources)
```
GET  /api/stats/sources
GET  /api/stats/category/:category
GET  /api/stats/player/:playerId
GET  /api/stats/passing|rushing|receiving|defense|special-teams|nextgen
POST /api/stats/refresh
```

### Betting & Singularity
```
GET  /api/betting/analyze/:gameId
POST /api/betting/predict
GET  /api/betting/edges
GET  /api/betting/exploits
POST /api/betting/place
GET  /api/betting/history
GET  /api/betting/pending
POST /api/betting/settle
GET  /api/betting/clv
POST /api/betting/closing-lines
GET  /api/betting/week/:season/:week
GET  /api/betting/kelly/:bankroll/:winProb/:odds
```

### Analytics
```
GET  /api/exploits/:gameId
GET  /api/singularity/health
POST /api/singularity/simulate
POST /api/singularity/predict
POST /api/singularity/kelly
POST /api/singularity/correlation
POST /api/singularity/ev
POST /api/singularity/poisson
GET  /api/singularity/teams
```

### Services
```
GET  /api/odds/nfl
GET  /api/odds/game
GET  /api/weather/:venue
GET  /api/weather/game/:gameId
GET  /api/news/nfl
GET  /api/espn/stats/:teamId
GET  /api/espn/injuries/:teamId
GET  /api/espn/depth/:teamId
GET  /api/espn/matchup/:gameId
POST /api/espn/refresh
GET  /api/media/game/:gameId
GET  /api/media/podcasts
GET  /api/media/tv
GET  /api/media/radio/:teamAbbr
GET  /api/player-props/:gameId
GET  /api/picks/auto
GET  /api/espn/stats/:teamId
GET  /api/espn/injuries/:teamId
GET  /api/espn/depth/:teamId
GET  /api/espn/matchup/:gameId
```

---

## Frontend Architecture

### Components (`/apps/web/src/`)
- Features organized by domain (nfl/)
- Reusable UI components
- Hooks for data fetching

### Lib (`/client/src/`)
- API client
- Auth utilities
- State management (Zustand)
- React Query integration
- Utility functions

---

## Deployment

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Start
```bash
npm start
```

### Database
```bash
npm run db:push
```

### Type Checking
```bash
npm run check
```

### Linting
```bash
npm run lint
```

---

## Performance Optimization

### Caching Strategy
- Stats: 1-hour TTL
- Weather: 30-minute TTL
- Odds: 5-minute TTL (live)
- Model predictions: 15-minute TTL

### Parallel Processing
- All stats sources fetched concurrently
- Batch processing for season-wide data
- Async Python operations

### Rate Limiting
- Per-endpoint limits
- Global request limits
- Sliding window enforcement

---

## Security

### Authentication
- Replit Auth integration
- Session management
- Protected routes

### API Keys
- Environment variable management
- Key rotation support
- Secure storage

---

## Monitoring & Observability

### Metrics Tracked
- Request latency
- Error rates
- Cache hit rates
- Model prediction accuracy
- CLV performance

### Logging
- Structured JSON logging
- Error tracking
- Performance profiling

---

## Future Enhancements

### Planned
1. Real-time WebSocket for live odds
2. Automated bet execution
3. Advanced player props modeling
4. GraphQL API
5. Redis caching layer
6. Message queue for background jobs
7. Source reliability scoring
8. Historical data archiving
9. User preferences and alerts
10. Mobile app (React Native)

### Architecture Improvements
1. Microservices for scalability
2. Event-driven architecture
3. GraphQL gateway
4. CDN for static assets
5. Multi-region deployment

---

## System Status

| Component | Status | Version |
|-----------|--------|---------|
| Next.js Frontend | ✅ Active | 13.5.6 |
| Express Server | ✅ Active | Latest |
| Python Engine | ✅ Active | Latest |
| Database | ✅ Active | PostgreSQL |
| Singularity Config | ✅ Active | v1.0 |
| Stats Aggregation | ✅ Active | 42 sources |
| Betting System | ✅ Active | v1.0 |
| Analytics Engine | ✅ Active | Latest |
| CLV Tracker | ✅ Active | v1.0 |
| Kelly Calculator | ✅ Active | v1.0 |
| Model Predictor | ✅ Active | Ensemble |

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Setup Database
```bash
npm run db:push
```

### 4. Start Services
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Python Engine
cd python_engine
python run.py
```

### 5. Access Application
```
Frontend: http://localhost:3000
API: http://localhost:3000/api
```

---

## File Structure

```
edgeloop/
├── apps/
│   ├── web/                 # Next.js web app
│   └── api/                 # Backend API (FastAPI)
├── client/                   # React client library
├── server/
│   ├── analytics/            # Analytics engines
│   ├── betting/             # Singularity betting system (NEW)
│   ├── infrastructure/       # Circuit breaker, rate limiter, cache
│   ├── replit_integrations/  # Auth, chat
│   └── services/            # External APIs
├── python_engine/            # Python ML models (NEW)
├── shared/                  # Database schema
├── pages/                   # Next.js pages
├── public/                  # Static assets
└── docs/                   # Documentation

server/betting/ (NEW)
├── marketComparator.ts      # Market vs. model comparison
├── clvTracker.ts          # Closing line value tracking
├── kellyCalculator.ts      # Optimal bet sizing
├── featureEngineering.ts    # Feature extraction
├── modelPredictor.ts      # Ensemble predictions
└── bettingService.ts       # Main service

python_engine/ (ENHANCED)
├── neural_predictor.py      # MLP models
├── monte_carlo.py         # Simulations
├── correlation_matrix.py    # Correlation analysis
├── kelly_staking.py       # Kelly staking
├── id_mapper.py          # ID mapping
├── config.py             # Configuration (UPDATED)
├── singularity_config.py  # Signal config (NEW)
├── stats_sources.py      # Source config (NEW)
└── market_analyzer.py    # Market analysis (NEW)
```

---

## Support & Documentation

- **Main Docs**: `/README.md`
- **Singularity Integration**: `/SINGULARITY_INTEGRATION.md`
- **Stats Aggregation**: `/STATS_AGGREGATION.md`
- **System Summary**: `/SYSTEM_ENHANCEMENTS_SUMMARY.md`
- **This File**: `/BETTING_SYSTEM_COMPLETE.md`

---

**Last Updated**: 2025-01-14
**Version**: 2.0.0
