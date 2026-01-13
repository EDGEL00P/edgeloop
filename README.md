# Edge Loop - NFL Intelligence

Professional sports analytics platform built with Next.js.

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19
- **Backend**: Express.js (API server)
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand + React Query

## Getting Started

### Development
```bash
npm run dev
```
Starts the Next.js development server on port 5000.

### Build
```bash
npm run build
npm start
```

### Database
```bash
npm run db:push
```

## Project Structure

- `/app` - Next.js App Router pages and layouts
- `/page-components` - Page component implementations
- `/components` - Reusable UI components
- `/lib` - Utility functions and shared logic
- `/hooks` - Custom React hooks
- `/server` - Express API backend
- `/shared` - Shared types and schemas

## Recent Migration

This project was recently migrated from Vite + React to Next.js 16. See [MIGRATION.md](./MIGRATION.md) for details.
