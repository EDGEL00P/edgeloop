# Quick Reference - Edgeloop Platform

## 🎯 Key Features Implemented

### 1. Advanced Next.js 15 Setup ✅
- **React Compiler 1.0**: Automatic memoization enabled
- **Partial Prerendering (PPR)**: Static shell + dynamic data
- **View Transitions**: Smooth navigation animations
- **Security Headers**: CSP, HSTS, X-Frame-Options configured

### 2. BallDontLie API Integration ✅
- **Teams API**: `/api/teams` (1h cache)
- **Games API**: `/api/games?season=2026&week=1` (30s cache)
- **Injuries API**: `/api/injuries?team=KC` (1m cache)
- **Roster API**: `/api/roster?team=KC&season=2026` (5m cache)
- **Client**: Cursor pagination, type-safe with Zod

### 3. Real-Time Edge Feed ✅
- **SSE Endpoint**: `/api/stream/edges`
- **Live Updates**: Demo mode (5s intervals)
- **Client Component**: Auto-reconnection
- **Production Ready**: Template for Redis pub/sub integration

### 4. Prediction Pages with PPR ✅
- **Landing**: `/predictions` - Current week shortcuts
- **Weekly Slate**: `/predictions/week/[season]/[week]`
- **Team Dashboard**: `/teams/[code]`
- **Cache Tags**: Instant invalidation support

### 5. UI Component Library ✅
- **ComboBox**: Team/market selectors with async data
- **NumberField**: EV thresholds, stakes with prefix/suffix
- **AlertRuleEditor**: Alert configuration form
- **CommandPalette**: Quick navigation (⌘K) - existing

### 6. Caching & Revalidation ✅
- **Tag System**: `games:${season}:${week}`, `team:${code}`
- **Revalidation Endpoint**: `/api/revalidate` (POST with secret)
- **Strategy**: 30s games, 60s injuries, 300s roster

### 7. CI/CD Pipeline ✅
- **GitHub Actions**: Type check, lint, test, build
- **Vercel Integration**: Auto-deploy on PR/merge
- **Turbo Remote Cache**: Shared build cache

### 8. Deployment Configuration ✅
- **Three Projects**: web, admin, workers
- **Cron Jobs**: vercel.json in workers
- **Environment Setup**: .env.example with all vars

## 📁 Project Structure

```
edgeloop/
├── apps/
│   ├── web/                    # Next.js 15 customer app
│   │   ├── app/
│   │   │   ├── (app)/
│   │   │   │   ├── edges/      # Live edge feed
│   │   │   │   ├── predictions/ # Prediction pages
│   │   │   │   └── teams/      # Team dashboards
│   │   │   └── api/
│   │   │       ├── teams/      # Teams API
│   │   │       ├── games/      # Games API
│   │   │       ├── injuries/   # Injuries API
│   │   │       ├── roster/     # Roster API
│   │   │       ├── revalidate/ # Cache invalidation
│   │   │       └── stream/     # SSE endpoints
│   │   └── next.config.js      # PPR, React Compiler
│   ├── admin/                  # Admin dashboard
│   └── workers/                # Cron jobs
│       └── vercel.json         # Cron schedules
├── packages/
│   ├── ui/                     # Design system
│   │   ├── src/
│   │   │   ├── combo-box.tsx   # NEW
│   │   │   ├── number-field.tsx # NEW
│   │   │   ├── alert-rule-editor.tsx # NEW
│   │   │   └── command-palette.tsx # Existing
│   │   └── index.ts            # Updated exports
│   ├── tokens/                 # Tailwind v4 tokens
│   │   └── theme.css           # Custom colors
│   ├── db/                     # Drizzle ORM
│   │   ├── src/schema/         # Database schemas
│   │   ├── src/seed/           # Seed scripts
│   │   └── drizzle.config.ts   # Migration config
│   └── integrations/           # API clients
│       └── src/providers/balldontlie/
└── .github/
    └── workflows/
        └── ci.yml              # NEW: CI pipeline
```

## 🚀 Quick Start Commands

```bash
# Install
pnpm install

# Development
pnpm dev                    # All apps
pnpm dev --filter=web       # Web only

# Build
pnpm build                  # All apps
pnpm typecheck              # Type check
pnpm lint                   # Lint

# Database
pnpm db:generate            # Generate migration
pnpm db:migrate             # Run migrations
pnpm db:studio              # Open Drizzle Studio
pnpm db:seed                # Seed data

# Deployment
vercel                      # Deploy preview
vercel --prod               # Deploy production
```

## 🔑 Environment Variables

**Required:**
```env
DATABASE_URL=postgresql://...
BALLDONTLIE_API_KEY=your-key
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
REVALIDATE_SECRET=random-secret
```

**Optional:**
```env
CLICKHOUSE_URL=https://...
THE_ODDS_API_KEY=...
NEXTAUTH_SECRET=...
EMAIL_API_KEY=...
```

## 📊 Cache Strategy

| Resource | Duration | Tag | Revalidate On |
|----------|----------|-----|---------------|
| Teams | 1 hour | - | Rarely |
| Games | 30s | `games:${season}:${week}` | Odds update |
| Injuries | 1 min | `team:${code}` | Worker cron |
| Roster | 5 min | `team:${code}` | Worker cron |
| Edges | No cache | - | Real-time SSE |

## 🛣️ Route Map

### Public Routes
- `/` - Home
- `/predictions` - Predictions landing
- `/predictions/week/[season]/[week]` - Weekly slate
- `/predictions/game/[gameId]` - Game detail
- `/predictions/futures` - Futures markets
- `/teams/[code]` - Team dashboard
- `/edges` - Live edge feed

### API Routes (Edge Runtime)
- `GET /api/teams`
- `GET /api/games?season=X&week=Y`
- `GET /api/injuries?team=CODE`
- `GET /api/roster?team=CODE&season=X`
- `POST /api/revalidate` (with secret)
- `GET /api/stream/edges` (SSE)

## 🎨 UI Components

### Forms
```tsx
import { ComboBox, NumberField, AlertRuleEditor } from '@edgeloop/ui'

<ComboBox 
  label="Team"
  value={team}
  onChange={setTeam}
  optionsSource="/api/teams"
/>

<NumberField
  label="Min EV %"
  value={minEV}
  onChange={setMinEV}
  min={0}
  max={50}
  step={0.5}
  suffix="%"
/>

<AlertRuleEditor
  onSave={(rule) => console.log(rule)}
/>
```

### Real-Time
```tsx
// Client component
'use client'
import { useEffect, useState } from 'react'

export default function Live() {
  const [data, setData] = useState([])
  
  useEffect(() => {
    const es = new EventSource('/api/stream/edges')
    es.onmessage = (e) => {
      const edge = JSON.parse(e.data)
      setData(prev => [edge, ...prev])
    }
    return () => es.close()
  }, [])
  
  return <div>{data.length} edges</div>
}
```

## 🔄 Cache Revalidation

### From Worker
```typescript
// After updating odds/injuries
const tags = [`games:${season}:${week}`, `team:${code}`]

await fetch(`${WEB_BASE_URL}/api/revalidate`, {
  method: 'POST',
  headers: {
    'x-revalidate-secret': process.env.REVALIDATE_SECRET,
    'content-type': 'application/json'
  },
  body: JSON.stringify({ tags })
})
```

### Manual (CLI)
```bash
curl -X POST https://your-app.vercel.app/api/revalidate \
  -H "x-revalidate-secret: your-secret" \
  -H "content-type: application/json" \
  -d '{"tags":["games:2026:1"]}'
```

## 🎯 Production Checklist

- [ ] Environment variables set in Vercel
- [ ] Database migrations run
- [ ] Teams seeded (`pnpm db:seed`)
- [ ] GitHub Actions passing
- [ ] Vercel deployment successful
- [ ] Health checks passing
- [ ] SSE feed connected
- [ ] Cache revalidation working
- [ ] Custom domain configured (optional)
- [ ] Analytics enabled

## 📖 Documentation Files

- `README.md` - Overview (existing, can be updated)
- `IMPLEMENTATION.md` - Technical deep dive ✅ NEW
- `DEPLOYMENT.md` - Vercel setup guide ✅ NEW
- `.env.example` - Environment template ✅ NEW

## 🔧 Technology Versions

- **Node**: 22 LTS
- **Next.js**: 15.x
- **React**: 19.2
- **Tailwind CSS**: 4.0+
- **Turborepo**: 2.x
- **pnpm**: 9+
- **TypeScript**: 5.x
- **Drizzle ORM**: Latest

## 🎓 Learning Resources

- [Next.js 15 Docs](https://nextjs.org/docs)
- [React 19 Blog](https://react.dev/blog)
- [Tailwind v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Turborepo Handbook](https://turbo.build/repo/docs)

## 💡 Tips

1. **Use PPR**: Enable for semi-static pages (schedules, slates)
2. **Edge Runtime**: Default for API routes unless you need Node APIs
3. **Cache Tags**: Tag everything that might need instant invalidation
4. **SSE over WS**: Simpler for one-way real-time updates
5. **Type Safety**: Zod for runtime validation, TypeScript for compile-time

## 🐛 Common Issues

**Module not found:**
→ Add to `transpilePackages` in next.config.js

**Build fails on Vercel:**
→ Check GitHub Actions logs first

**Cache not invalidating:**
→ Verify `REVALIDATE_SECRET` matches

**SSE disconnects:**
→ Expected on serverless; client auto-reconnects

**Slow API routes:**
→ Use Edge runtime or check database indexes
