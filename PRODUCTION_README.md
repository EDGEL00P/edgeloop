# 🚀 Production Deployment Guide

## Quick Deploy

```bash
# 1. Validate production readiness
npm run validate:production

# 2. Build
npm run build

# 3. Deploy to Vercel (if using Vercel CLI)
vercel --prod
```

## Required Environment Variables

Set these in your deployment platform:

### Essential
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption secret (generate with `openssl rand -base64 32`)

### APIs (Production)
- `BALLDONTLIE_API_KEY` - NFL data API
- `ODDS_API_KEY` - Betting odds (The Odds API)
- `WEATHER_API_KEY` - Weather data (OpenWeatherMap)

### Optional APIs
- `SPORTSRADAR_API_KEY` - Additional sports data
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI integration
- `AI_INTEGRATIONS_GEMINI_API_KEY` - Google Gemini
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` - Anthropic Claude
- `AI_INTEGRATIONS_OPENROUTER_API_KEY` - OpenRouter

## Architecture

- **Services**: `services/identity/`, `services/oracle/`, `services/execution/`
- **Contracts**: `contracts/http/` (Zod schemas)
- **SDKs**: `sdks/ts/` (generated from contracts)
- **Platform**: `platform/` (templates + CI)

See `docs/STATUS.md` for complete status.

## Post-Deploy

1. Verify health endpoint: `https://your-domain.com/api/system/health`
2. Check logs for any environment variable warnings
3. Run production validation: `npm run validate:production`

## Support

- Architecture docs: `docs/architecture/`
- Contracts: `contracts/README.md`
- Status: `docs/STATUS.md`