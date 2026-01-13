# Edge Loop - NFL Betting Intelligence

## Overview

This is a comprehensive NFL betting analytics platform called "Edge Loop" featuring the "Omni-Weekly Exploit Engine" framework with 30+ automated exploit detectors. It provides advanced betting analytics including EPA metrics, line movements, weather factors, Poisson simulations, and exploit signals for NFL games. The platform integrates AI-powered analysis via OpenAI/Gemini, includes features like same-game parlay (SGM) building, team/player analytics, injury intelligence, betting strategy tools, and Replit Auth login gate.

## Recent Changes

- **January 2026**: **MULTI-PROVIDER AI ROUTER** - Intelligent AI task routing:
  - 4 providers: OpenAI GPT-4.1, Gemini Flash, Anthropic Claude, OpenRouter Llama
  - Task-based routing: quick→Gemini, analysis→OpenAI, complex→Anthropic, creative→OpenRouter
  - Graceful fallback with circuit breakers and rate limiters per provider
  - Located at server/services/aiRouter.ts
- **January 2026**: **ESPN VISUAL OVERHAUL** - Premium 2026-style design:
  - ESPN red color scheme (#CD1141) with gold accents (#FFD700)
  - Glassmorphism panels with backdrop-blur effects
  - Glow effects, animated gradients, premium shadows
  - CSS utilities: .glass-panel, .glow-red, .gradient-mesh, .btn-espn, .animate-float
- **January 2026**: **EDGE LOOP REBRAND** - Complete platform rebrand:
  - Renamed from "Singularity NFL Intelligence" to "Edge Loop"
  - ESPN-style red color scheme (#CD1141)
  - Updated all pages, components, navigation, and meta tags
  - Replit Auth login gate with split-screen landing page (stealth/professional branding)
  - Sessions and users tables for authentication
  - Landing page uses subtle wording: "Professional Sports Analytics", "Signal Patterns", "Smart Insights"
- **January 2026**: **30+ EXPLOIT DETECTORS** - Full exploit engine at server/analytics/exploitEngine.ts:
  - Key Numbers (3, 7, 10, 14, 17, 21), Weather Elastic, Injury Cascade
  - Steam Move, Reverse Line Move, Primetime Bias, Rest Advantage
  - Travel Mismatch, Divisional Under, Home Dog Value, Lookahead Trap
  - Revenge Game, Bye Week Edge, Ref Tendency, Public Fade
  - Turnover Regression, Red Zone Regression, Altitude Impact, and more
  - API endpoint: GET /api/exploits/:gameId
- **January 2026**: **MAJOR UI/UX OVERHAUL** - Professional ESPN-style redesign:
  - Clean navigation bar with mobile hamburger menu and live data status indicator
  - Home page redesigned as Command Hub with quick picks panel, games grid, sidebar
  - Singularity page streamlined with progressive disclosure and collapsible sections
  - Auto A+ Picks Engine with composite scoring (EV, line movement, weather, injuries)
  - Real-time data sync indicators showing freshness for all data sources
  - Live media integration with podcast/radio links for games
  - News expanded to 5 RSS sources (ESPN, Pro Football Talk, Yahoo Sports, NFL.com, Bleacher Report)
  - Mobile-optimized with 44px touch targets and responsive grid layouts
- **January 2026**: **PRODUCTION INFRASTRUCTURE DEPLOYED** - Enterprise-grade reliability:
  - Circuit breakers with exponential backoff for all external APIs
  - Token bucket rate limiters (5 req/min BallDontLie, 10 req/min ESPN, 60 req/min Odds API)
  - Multi-level caching: browser (5s) → server (5min) → database (historical)
  - Auto-refresh system with 4 background jobs (teams, games, odds, cache cleanup)
  - Data router with smart fallback (BallDontLie → ESPN → TypeScript fallback)
  - Structured logging with winston and metrics collection
- **January 2026**: **SGM BUILDER COMPLETE** - Full same-game parlay builder with:
  - Player props selection (passing/rushing/receiving yards, TDs, receptions)
  - Correlation heatmap visualization showing leg relationships
  - Kelly criterion integration with quarter/half/full Kelly recommendations
  - TypeScript fallbacks for Kelly and correlation when Python engine unavailable
- **January 2026**: **ADAPTIVE GEMINI AI SERVICE** - Smart model switching:
  - Flash model for simple queries, Pro model for complex analysis
  - Betting value analysis with exploit detection
  - Injury impact assessment for lineup changes
  - Game prediction with confidence intervals
- **January 2026**: **ESPN SCRAPER SERVICE** - Real-time data with caching:
  - Team stats with 5-minute TTL
  - Injury reports with 10-minute TTL
  - Depth charts with 1-hour TTL
- **January 2026**: **DEPLOYED PYTHON SINGULARITY SUPERCOMPUTER** - High-performance ML engine with:
  - Monte Carlo simulator (100,000 iterations) with parallelized execution
  - Neural Network Predictor using MLP (128, 64, 32) architecture
  - Cholesky Decomposition for SGM correlation analysis
  - Multi-dimensional Kelly Criterion staking engine
  - Rosetta Stone ID mapper (BDL <-> GSIS <-> Sleeper <-> ESPN)
- **January 2026**: Integrated all API secrets (Weather API, Odds API, Exa API, Grok API, OpenRouter API)
- **January 2026**: Added Singularity Multi-Agent System with 5 specialized agents (Stats, Market, Weather, Injury, Trend)
- **January 2026**: Implemented Monte Carlo simulation (10,000 iterations) with uncertainty bands and confidence intervals
- **January 2026**: Added consensus mechanism for aggregating agent predictions with weighted voting
- **January 2026**: Integrated Fractional-Kelly staking calculator with uncertainty-aware EV thresholds
- **January 2026**: Created mobile-responsive Singularity Dashboard at /singularity
- **January 2026**: Expanded to full "Singularity NFL Intelligence" platform
- **January 2026**: Added OpenAI integration for AI-powered game analysis
- **January 2026**: Added Omni Analytics Engine with Poisson simulator, EV calculator, Kelly criterion
- **January 2026**: Created Injury Intelligence page with cascade detection
- **January 2026**: Created Betting Strategy Portal with EV/Kelly calculators and line value analysis
- **January 2026**: Created Backtest & Poisson Simulator page with probability matrix
- **January 2026**: Created Silas Vex Liability Room for sportsbook pattern analysis
- **January 2026**: Enhanced Player Profiles with trend charts and position-specific stats
- **January 2026**: Enhanced Teams page with standings, division rankings, and head-to-head matchups
- **January 2026**: Added AI Chat assistant accessible from all pages

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom plugins for Replit integration
- **Routing**: Wouter (lightweight React router)
- **State Management**: Zustand with persistence middleware for user settings
- **Data Fetching**: TanStack React Query for server state management
- **Styling**: Tailwind CSS v4 with ESPN-themed custom variables and shadcn/ui components
- **Theme**: Dark theme with Edge Loop blue (#3B82F6) accents
- **Charts**: Recharts for data visualization

### Backend Architecture
- **Runtime**: Node.js with Express + Python 3.11 ML Engine
- **Language**: TypeScript (server) + Python (ML engine)
- **API Pattern**: REST endpoints under `/api` prefix with Python proxy at `/api/singularity/*`
- **AI Integration**: OpenAI/Gemini via Replit AI Integrations
- **Analytics Engine**: Custom Omni Analytics Engine (TypeScript) + Python ML Engine
- **Build**: esbuild for production bundling

### Python Singularity Supercomputer (`python_engine/`)
High-performance ML engine running on port 8000:
- **Monte Carlo** (`monte_carlo.py`): 100,000 iteration game simulations with correlated bivariate normal distributions
- **Neural Predictor** (`neural_predictor.py`): MLP (128, 64, 32) for score/win predictions using EPA, CPOE, red zone metrics
- **Correlation Matrix** (`correlation_matrix.py`): Cholesky decomposition for SGM leg correlation analysis
- **Kelly Staking** (`kelly_staking.py`): Multi-dimensional optimal bet sizing with risk-of-ruin calculations
- **ID Mapper** (`id_mapper.py`): Rosetta Stone for cross-source player/team ID translation
- **API Server** (`api.py`): HTTP endpoints proxied through Node.js

### Python Engine API Endpoints
- `POST /api/singularity/simulate` - Monte Carlo game simulation
- `POST /api/singularity/predict` - Neural network prediction
- `POST /api/singularity/kelly` - Kelly criterion calculation
- `POST /api/singularity/correlation` - SGM correlation matrix
- `POST /api/singularity/ev` - Expected value calculation
- `POST /api/singularity/poisson` - Poisson probability matrix
- `GET /api/singularity/health` - Engine health check

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Tables**: nfl_teams, nfl_players, nfl_games, weekly_metrics, exploit_signals, line_movements, weather_conditions, data_imports, users, conversations, messages
- **Connection**: postgres-js driver with connection via DATABASE_URL environment variable

### Key Pages
- **/** - Games dashboard showing this week's NFL games
- **/singularity** - Multi-Agent Prediction Dashboard with 5 AI agents, Monte Carlo simulation, Kelly calculator
- **/weekly** - Weekly Control Center with Omni-Metric Dashboard and exploit signals
- **/teams** - Team analytics with standings, division rankings, head-to-head matchups
- **/players** - Player profiles with trend charts and position-specific stats
- **/injuries** - Injury Intelligence Center with cascade detection and lineup impact
- **/betting** - Betting Strategy Portal with EV/Kelly calculators and line value analysis
- **/simulator** - Backtest & Poisson Simulator with probability matrix
- **/silas** - Silas Vex Liability Room for sportsbook pattern analysis
- **/sgm** - Same Game Parlay builder
- **/data** - Data imports management
- **/settings** - User settings

### Key Design Patterns
- **Monorepo Structure**: Client (`client/`), server (`server/`), and shared code (`shared/`) in one repository
- **Path Aliases**: `@/` for client source, `@shared/` for shared modules
- **Type Safety**: Drizzle-zod for schema validation, shared types between frontend and backend
- **Mock Data Fallback**: Backend provides mock NFL data when external APIs unavailable
- **AI Chat**: SSE streaming for real-time AI responses

### Omni Analytics Engine

Located at `server/analytics/omniEngine.ts`, provides:
- **Poisson Distribution**: Score probability matrix and outcome calculations
- **EV Calculator**: Expected value with implied probability and edge detection
- **Kelly Criterion**: Optimal bet sizing (full, half, quarter Kelly)
- **Line Analysis**: Steam move, trap line, and reverse line move detection
- **Weather Impact**: Passing decay calculations based on conditions
- **Injury Cascade**: O-line cluster alerts and point drop metrics
- **Trend Analysis**: Statistical regression for performance trends
- **Godmode Detection**: Identifies exceptional metric thresholds
- **AI Game Analysis**: GPT-powered matchup analysis

### API Analytics Endpoints
- `POST /api/analytics/poisson` - Poisson probability calculations
- `POST /api/analytics/ev` - Expected value calculations
- `POST /api/analytics/kelly` - Kelly criterion bet sizing
- `POST /api/analytics/line-check` - Line movement anomaly detection
- `POST /api/analytics/weather` - Weather impact analysis
- `POST /api/analytics/injury-cascade` - Injury cascade impact
- `POST /api/analytics/ai-analysis` - AI-powered game analysis

### Omni-Weekly Exploit Engine Framework

The Weekly Control Center implements:
- **Monday (Rating Reset)**: Update EPA/Play and Success Rate rolling averages
- **Wednesday (Injury Pivot)**: Calculate Point-Drop Metric for offensive line clusters
- **Friday (Steam Signal)**: Compare opening lines to sharp prices for steam/trap detection
- **Sunday AM (Weather/Ref Singularity)**: Check weather conditions for passing decay

### Omni-Metric Dashboard
- **CPOE**: Completion % Over Expected (Godmode if > +5.0)
- **H-D Pressure**: High-Danger Pressure Rate (predicts turnovers)
- **Red Zone EPA**: Efficiency inside the 20 (identifies fake offenses)
- **Vig-Free %**: Implied Probability (must be 3% higher than bookie odds)

## External Dependencies

### AI Integrations (Replit AI Integrations - No API Key Required)
- **OpenAI**: GPT-4o-mini for game analysis and chat (via AI_INTEGRATIONS_OPENAI_API_KEY)
- **Gemini**: For advanced AI features (via AI_INTEGRATIONS_GEMINI_API_KEY)

### Database
- **PostgreSQL**: Primary database accessed via `DATABASE_URL` environment variable.

### UI Component Libraries
- **Radix UI**: Full suite of accessible primitives
- **shadcn/ui**: Pre-built component library built on Radix (new-york style)
- **Lucide React**: Icon library
- **Framer Motion**: Animation library
- **Recharts**: Data visualization and charting

### Analytics & Math Libraries
- `mathjs`: Mathematical functions including factorial for Poisson
- `simple-statistics`: Statistical analysis and regression
- `ml-regression`: Machine learning regression models
- `ml-matrix`: Matrix operations
- `lodash`: Utility functions
- `dayjs`: Date/time handling

### Key NPM Dependencies
- `drizzle-orm` / `drizzle-zod`: Database ORM and validation
- `@tanstack/react-query`: Server state management
- `framer-motion`: Animation library
- `zustand`: Client state management
- `wouter`: Routing
- `express`: HTTP server
- `openai`: OpenAI API client
- `p-limit` / `p-retry`: Rate limiting and retry logic
