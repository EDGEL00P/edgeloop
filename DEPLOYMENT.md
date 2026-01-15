# Deployment Guide

This guide covers deploying Edgeloop to various hosting platforms.

## Environment Variables

Copy `.env.example` to `.env` and fill in your values. Required variables:

- `DATABASE_URL` - PostgreSQL connection string (required)
- `BALLDONTLIE_API_KEY` - API key for BallDontLie API (required)
- `SESSION_SECRET` - Secret for session encryption (required in production)

## Vercel Deployment

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.example`
3. **Deploy**: Vercel will automatically build and deploy

### Vercel Configuration

- Framework: Next.js (auto-detected)
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

## Railway Deployment

1. **Create a new project** on Railway
2. **Connect your GitHub repository**
3. **Add PostgreSQL service**:
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically set `DATABASE_URL`
4. **Set environment variables**:
   - Go to your service → Variables
   - Add required variables
5. **Deploy**: Railway will automatically detect and deploy

### Railway Configuration

- Build Command: `npm run build`
- Start Command: `npm start`
- Port: Automatically set via `PORT` environment variable

## Docker Deployment

### Build the image:
```bash
docker build -t edgeloop .
```

### Run the container:
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e BALLDONTLIE_API_KEY=your-key \
  -e SESSION_SECRET=your-secret \
  edgeloop
```

### Docker Compose:
```bash
docker-compose up -d
```

## Environment-Specific Notes

### Vercel
- Uses serverless functions for API routes
- Maximum function duration: 60 seconds
- Static files are automatically optimized
- Edge functions supported

### Railway
- Full Node.js environment
- Persistent file system
- Background jobs supported
- WebSocket support available

### Docker
- Full control over environment
- Can run on any platform supporting Docker
- Supports multi-stage builds for optimization

## Database Migrations

Run migrations after deployment:

```bash
npm run db:push
```

Or use Drizzle Kit:

```bash
npm run db:generate
```

## Health Checks

The application includes health check endpoints:

- `/api/health` - Basic health check
- `/api/health/detailed` - Detailed system status

## Troubleshooting

### Build Failures
- Ensure all dependencies are in `package.json`
- Check Node.js version (should be 20+)
- Verify TypeScript compilation: `npm run check`

### Database Connection Issues
- Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Check SSL requirements (some providers require SSL)
- Ensure database is accessible from hosting platform

### Port Issues
- Platform will set `PORT` automatically
- Default port is 3000
- Server listens on `0.0.0.0` to accept external connections

### Environment Variables
- Ensure all required variables are set
- Check variable names match exactly (case-sensitive)
- Some platforms require `NEXT_PUBLIC_` prefix for client-side variables
