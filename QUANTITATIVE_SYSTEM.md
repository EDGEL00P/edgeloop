# Quantitative NFL Betting System

## Overview

This system implements a "singularity, highest-ceiling" approach to NFL betting analysis, treating betting like quantitative trading with focus on:
1. Better information
2. Better modeling  
3. Better execution
4. Better risk control

## Core Philosophy

**Beat the market, don't predict games** - Find mispriced probabilities relative to market prices.

## Key Components

### 1. Probabilistic Modeling
- **Distributional Score Models**: Predict team points as distributions, not just point estimates
- **Hierarchical Bayesian Ratings**: Team strength evolves through season (offense/defense/QB/coaching)
- **Simulation-Based Pricing**: 50k-500k simulations per game to price all markets consistently

### 2. Advanced Features
- **EPA/play, success rate, early-down pass rate**
- **Pace, neutral situation splits, red zone efficiency**
- **Injury/QB status as structured variables with uncertainty**
- **Weather impacts, rest days, home field advantage**

### 3. Calibration & Ensemble
- Multiple models (Bayesian ratings + GBM + Elo baseline)
- Probability calibration (isotonic/Platt scaling)
- Ensembling for robustness

### 4. Expected Value & Kelly Criterion
- Convert odds → implied probability
- Remove vig (normalize)
- Calculate EV vs fair probability
- Fractional Kelly sizing (typically 0.25 Kelly)

### 5. Closing Line Value (CLV) Tracking
- Track bet price vs closing line
- Measure if consistently getting CLV
- Use as truth serum for model performance

### 6. Execution Edge
- Line shopping across books
- Steam chasing avoidance
- Latency-aware ingestion
- Stale line detection

### 7. Risk Control
- Fractional Kelly (0.25 typical)
- Correlation control
- Stop-loss rules
- Bankroll management

## Implementation

### Files Created

1. **`server/betting/quantitativeSystem.ts`**
   - Core betting algorithm
   - EV calculation, Kelly sizing
   - Score distribution modeling
   - Simulation-based pricing
   - CLV tracking

2. **`server/services/nflRadioService.ts`**
   - Live radio streams for NFL games
   - Team radio networks
   - NFL Game Pass integration

3. **`server/services/nflMediaService.ts`**
   - News aggregation
   - Podcast feeds
   - Comprehensive media content

4. **`server/services/nflverseService.ts`**
   - nflverse Python package integration
   - Game data, player stats, team info
   - Schedule data

## API Endpoints

- `GET /api/betting/signals/:gameId` - Generate betting signals
- `GET /api/radio/game/:gameId` - Get radio streams for game
- `GET /api/media/podcasts` - Get NFL podcasts
- `GET /api/media/news` - Get comprehensive NFL news
- `GET /api/insights/:season/:week` - Matchup insights (renamed from exploits)

## Data Sources

- **nflverse**: Comprehensive NFL data
- **ESPN API**: Team stats, injuries, depth charts
- **BallDontLie**: NFL game data
- **Free Radio**: Team radio networks, NFL Game Pass
- **News Feeds**: RSS feeds, ESPN, NFL.com
- **Podcasts**: NFL.com, The Ringer, Around the NFL

## Usage

The system generates bet signals by:
1. Loading game features and team ratings
2. Predicting score distributions
3. Simulating 50k+ game outcomes
4. Pricing all markets from simulations
5. Comparing to market odds
6. Generating signals with EV > threshold
7. Sizing bets using fractional Kelly

## Next Steps

1. **Data Pipeline**: Play-by-play → weekly team metrics
2. **Injury Model**: QB value, OL/DL clusters
3. **Odds Snapshots**: Per-book with timestamps
4. **CLV Dashboard**: Track performance over time
5. **Automated Execution**: Best price selection, outlier detection

## Notes

This is a theoretical/hypothetical system for analysis purposes. Actual betting involves legal, financial, and ethical considerations.
