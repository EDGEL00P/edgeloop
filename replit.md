# Edge Loop - NFL Betting Intelligence

## Overview

Edge Loop is an advanced NFL betting analytics platform designed to provide users with a competitive edge through data-driven insights. It features an "Omni-Weekly Exploit Engine" with over 30 automated exploit detectors, offering comprehensive analysis of NFL games. Key capabilities include EPA metrics, real-time line movement tracking, weather impact assessment, Poisson simulations, and exploit signal generation. The platform integrates AI-powered analysis from multiple providers, supports same-game parlay (SGM) building, and offers in-depth team and player analytics, injury intelligence, and sophisticated betting strategy tools. Edge Loop aims to empower users with professional-grade sports analytics, signal pattern detection, and smart insights to inform their betting decisions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features an ESPN-inspired premium design, utilizing an ESPN red color scheme (#CD1141) with gold accents (#FFD700). Design elements include glassmorphism panels with `backdrop-blur` effects, glow effects, animated gradients, and premium shadows. Custom CSS utilities like `.glass-panel`, `.glow-red`, and `.gradient-mesh` are used to achieve this aesthetic. The UI/UX prioritizes a professional, high-performance look with a clean navigation bar, mobile-optimized layouts, and a Command Hub home page.

### Technical Implementations
The application is built with a Next.js 15 frontend using the App Router and a Node.js Express backend, with a Python 3.11 ML Engine for high-performance computations. It employs a multi-provider AI router for intelligent task routing across OpenAI GPT-4.1, Gemini Flash, Anthropic Claude, and OpenRouter Llama, with graceful fallbacks. Data fetching utilizes TanStack React Query, and state management is handled by Zustand. PostgreSQL serves as the primary database with Drizzle ORM. The system incorporates robust production infrastructure, including circuit breakers, token bucket rate limiters, multi-level caching, and an auto-refresh system for data synchronization.

### Feature Specifications
- **Omni-Weekly Exploit Engine**: Detects over 30 betting exploits including Key Numbers, Weather Elastic, Injury Cascade, Steam Move, Reverse Line Move, and Primetime Bias.
- **AI-Powered Analysis**: Provides game predictions, betting value analysis, and injury impact assessment using adaptive AI models.
- **Same-Game Parlay (SGM) Builder**: Allows selection of player props, visualizes correlation via heatmaps, and integrates Kelly criterion recommendations.
- **Omni Analytics Engine**: Offers Poisson distribution calculations, Expected Value (EV) calculation, Kelly Criterion bet sizing, line analysis, and weather/injury impact analysis.
- **Python Singularity Supercomputer**: A high-performance ML engine with Monte Carlo simulations (100,000 iterations), a Neural Network Predictor (MLP architecture), Cholesky Decomposition for SGM correlation, and a multi-dimensional Kelly Criterion staking engine.
- **Real-time Data**: Integrates data from multiple sources (ESPN, BallDontLie, Odds API) with caching and fallbacks.
- **User Authentication**: Secured with Replit Auth, featuring a split-screen landing page and session management.
- **UI Components**: Utilizes shadcn/ui components, Radix UI primitives, and Recharts for data visualization.

### System Design Choices
The project follows a monorepo structure with client, server, and shared code. Type safety is enforced using TypeScript and Drizzle-zod. The system is designed for enterprise-grade reliability with structured logging, metrics collection, and an adaptive data router. It features a responsive and mobile-optimized design with a dark theme and Edge Loop blue accents.

## External Dependencies

### AI Integrations
- **OpenAI**: GPT-4o-mini for game analysis and chat.
- **Gemini**: For advanced AI features.
- **Anthropic Claude**: Used for complex AI tasks.
- **OpenRouter Llama**: Utilized for creative AI tasks.

### Database
- **PostgreSQL**: Primary relational database.

### UI Component Libraries
- **Radix UI**: Accessible UI component primitives.
- **shadcn/ui**: Pre-built components based on Radix UI.
- **Lucide React**: Icon library.
- **Framer Motion**: Animation library.
- **Recharts**: Charting and data visualization library.

### Analytics & Math Libraries
- `mathjs`: Comprehensive mathematical functions.
- `simple-statistics`: Statistical analysis.
- `ml-regression`: Machine learning regression models.
- `ml-matrix`: Matrix operations.
- `lodash`: Utility functions.
- `dayjs`: Date and time manipulation.

### Key NPM Dependencies
- `drizzle-orm` / `drizzle-zod`: ORM and schema validation.
- `@tanstack/react-query`: Server state management.
- `zustand`: Client state management.
- `wouter`: Lightweight React router.
- `express`: Backend web framework.
- `openai`: OpenAI API client.
- `p-limit` / `p-retry`: Concurrency limiting and retry logic.
- `postgres-js`: PostgreSQL client for Node.js.