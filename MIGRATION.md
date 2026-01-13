# Next.js Migration Guide

This document outlines the migration from Vite + React + Express to Next.js 16 with App Router.

## What Was Changed

### 1. Next.js Setup
- **Installed Next.js 16** with React 19
- Created `next.config.js` with Turbopack support
- Updated `tsconfig.json` for Next.js compatibility
- Configured PostCSS for Tailwind CSS v4 using `@tailwindcss/postcss`
- Set up ESLint with `eslint-config-next`

### 2. Application Structure
```
OLD Structure:
/client
  /src
    /pages        - React components with Wouter routing
    /components   - UI components
    /lib          - Utilities and hooks
    /hooks        - Custom React hooks
  index.html      - Entry point

NEW Structure:
/app              - Next.js App Router pages
  /home
  /teams
  /players
  ... (17 routes total)
  layout.tsx      - Root layout
  page.tsx        - Home page
  providers.tsx   - Client-side providers
  globals.css     - Global styles
/page-components  - Original page components (renamed from /pages)
/components       - UI components (copied from client/src)
/lib              - Utilities (copied from client/src)
/hooks            - Custom hooks (copied from client/src)
/public           - Static assets
```

### 3. Routing Migration
- **Replaced Wouter with Next.js App Router**
  - Converted from Wouter's `<Switch>` and `<Route>` to Next.js file-based routing
  - Created individual route directories in `/app` for each page
  - Each route has a `page.tsx` that wraps the original page component

- **Updated Navigation**
  - Replaced `Link` from 'wouter' with `Link` from 'next/link'
  - Replaced `useLocation()` with `usePathname()` from 'next/navigation'
  - Added `'use client'` directive to components using client-side hooks

### 4. Key Configuration Files

#### package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev -p 5000",
    "build": "next build",
    "start": "next start -p 5000",
    "check": "tsc",
    "db:push": "drizzle-kit push",
    "lint": "next lint"
  }
}
```

#### next.config.js
- Configured Turbopack (Next.js 16 default)
- Set up serverActions for experimental features
- Configured environment variables

#### tsconfig.json
- Updated paths to work with Next.js structure
- Added Next.js plugin
- Changed module resolution to "bundler"

### 5. Component Updates
- All page components marked with `'use client'` directive
- Original page components moved to `/page-components` to avoid conflict with Next.js Pages Router
- Created `ClientOnly` wrapper component for components that must only render on client
- Updated all imports from relative paths to use `@/` alias

### 6. Styling
- Kept Tailwind CSS v4 configuration
- **Important**: Updated PostCSS config to use `@tailwindcss/postcss` plugin instead of the deprecated `tailwindcss` plugin. This is required for Tailwind CSS v4.
- Copied `globals.css` from `client/src/index.css`
- Maintained all existing Tailwind custom themes and colors

## What Still Needs Integration

### API Routes
The Express backend (`/server`) is still separate. Options:
1. **Keep Express separate** (current state) - Run Express on a different port and use Next.js as frontend only
2. **Migrate to Next.js API Routes** - Convert Express routes to Next.js API routes in `/app/api`
3. **Custom Server** - Create a custom Next.js server that integrates Express

### Database
- Database configuration (`drizzle.config.ts`) remains unchanged
- All database logic in `/server` and `/shared` remains functional

### Authentication
- Express session-based auth needs to be integrated with Next.js
- Current auth routes in `/server/replit_integrations/auth` need migration or proxy

## Running the Application

### Development
```bash
npm run dev
```
Starts Next.js development server on port 5000

### Production Build
```bash
npm run build
npm start
```

### Type Checking
```bash
npm run check
```

## Important Notes

1. **Pages Directory Renamed**: The `/pages` directory was renamed to `/page-components` to avoid conflicts with Next.js Pages Router

2. **Client Components**: Most components use `'use client'` because they rely on React hooks and client-side state

3. **Dynamic Rendering**: All routes are marked with `export const dynamic = 'force-dynamic'` to prevent static generation issues with React Query

4. **API Integration**: The frontend currently expects API endpoints at `/api/*` - these need to be set up either as Next.js API routes or as a proxy to the Express backend

5. **Wouter Removed**: All routing now uses Next.js App Router - no more Wouter dependency

## Migration Benefits

- **Better Performance**: Next.js optimizations and Turbopack for faster builds
- **SEO Friendly**: Server-side rendering capabilities (when needed)
- **File-based Routing**: More intuitive routing structure
- **Built-in Optimizations**: Image optimization, code splitting, etc.
- **Modern Stack**: Using latest Next.js 16 with React 19

## Next Steps

1. **Test all pages**: Verify each route renders correctly
2. **Set up API integration**: Decide on API strategy (routes vs. proxy)
3. **Migrate authentication**: Integrate auth with Next.js
4. **Test data fetching**: Ensure all API calls work correctly
5. **Performance testing**: Compare with old Vite setup
6. **Remove old files**: Clean up old Vite configuration files (optional)
