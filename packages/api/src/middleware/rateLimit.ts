import { createMiddleware } from 'hono/factory'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { AppError } from '@edgeloop/shared'

let ratelimit: Ratelimit | null = null
let rateLimitConfigurationLogged = false

function getRateLimiter(): Ratelimit | null {
  if (ratelimit) return ratelimit

  const redisUrl = process.env['REDIS_URL']
  const redisToken = process.env['REDIS_TOKEN']

  if (!redisUrl || !redisToken) {
    // Log configuration warning once to avoid spam
    if (!rateLimitConfigurationLogged) {
      console.warn(
        '[RateLimit] REDIS_URL or REDIS_TOKEN not configured. ' +
          'Rate limiting is disabled. This is acceptable for development but should be configured in production.'
      )
      rateLimitConfigurationLogged = true
    }
    return null
  }

  const redis = new Redis({
    url: redisUrl,
    token: redisToken,
  })

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    analytics: true,
  })

  return ratelimit
}

export const rateLimitMiddleware = createMiddleware(async (c, next) => {
  const limiter = getRateLimiter()

  if (!limiter) {
    // No rate limiting configured, skip
    await next()
    return
  }

  // Use IP address as identifier (or user ID if authenticated)
  const userId = c.get('userId')
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? 'unknown'
  const identifier = userId ?? ip

  const { success, limit, remaining, reset } = await limiter.limit(identifier)

  c.header('X-RateLimit-Limit', String(limit))
  c.header('X-RateLimit-Remaining', String(remaining))
  c.header('X-RateLimit-Reset', String(reset))

  if (!success) {
    throw AppError.rateLimited(`Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`)
  }

  await next()
})
