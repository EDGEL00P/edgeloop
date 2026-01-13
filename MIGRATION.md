# Next.js Migration Guide

This repository has been migrated from Vite + React + Express to Next.js App Router.

## What's Changed

### Frontend
- **Routing**: Migrated from Wouter to Next.js App Router
- **Pages**: All pages moved to `app/` directory with proper route structure
- **Components**: Moved to `app/_components/` directory
- **Hooks & Utilities**: Moved to `app/hooks/` and `app/lib/`
- **Styles**: Global styles in `app/globals.css`

### Build System
- **Vite → Next.js**: Replaced Vite with Next.js built-in bundler
- **Scripts**: Updated package.json scripts:
  - `npm run dev` - Start Next.js development server on port 5000
  - `npm run build` - Build for production
  - `npm run start` - Start production server
  - `npm run check` - TypeScript check

### Configuration Files
- `next.config.mjs` - Next.js configuration
- `tsconfig.json` - Updated for Next.js
- `.eslintrc.json` - Next.js ESLint config

## API Routes Migration Status

The Express API routes need to be migrated to Next.js API routes. The pattern is:

**Express**: `app.get("/api/news/nfl", handler)`
**Next.js**: `app/api/news/nfl/route.ts` with `export async function GET()`

### Example API Route

```typescript
// app/api/news/nfl/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { getNflNews } = await import('@/server-utils/services/newsService');
    const news = await getNflNews();
    return NextResponse.json(news);
  } catch (error) {
    console.error("Failed to fetch NFL news:", error);
    return NextResponse.json(
      { error: "Failed to fetch NFL news", message: (error as Error).message },
      { status: 500 }
    );
  }
}
```

### Routes to Migrate

The following Express routes need to be converted to Next.js API routes:

1. **Player Props**: `/api/player-props/:gameId` → `app/api/player-props/[gameId]/route.ts` ✅
2. **News**: `/api/news/nfl` → `app/api/news/nfl/route.ts` ✅
3. **Weather**: `/api/weather/:venue` and `/api/weather/game/:gameId`
4. **Odds**: `/api/odds/nfl` and `/api/odds/game`
5. **Exploits**: `/api/exploits/:gameId`
6. **Picks**: `/api/picks/auto`
7. **ESPN**: Multiple endpoints for stats, injuries, depth charts, matchups
8. **Media**: Game media, podcasts, TV, radio
9. **Singularity**: Analytics endpoints
10. **NFL Data**: Teams, players, games endpoints

## Running the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm run start

# Type checking
npm run check
```

## Next Steps

1. Complete API route migration (see list above)
2. Test all pages and functionality
3. Remove old Vite-related files (client/*, vite.config.ts, etc.)
4. Update environment variables if needed
5. Test authentication and sessions
6. Verify database connections work in Next.js API routes

## Notes

- All server-side logic has been copied to `app/server-utils/` for reuse in API routes
- The `@/` path alias now points to the `app/` directory
- Components using React hooks need `'use client'` directive
- API routes run on the server by default (no need for separate Express server)
