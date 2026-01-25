import { createMiddleware } from 'hono/factory'

export const securityMiddleware = createMiddleware(async (c, next) => {
  await next()

  // Security headers
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('Referrer-Policy', 'no-referrer')
  c.header('X-Frame-Options', 'DENY')
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  c.header('Cross-Origin-Opener-Policy', 'same-origin')
  c.header('Cross-Origin-Resource-Policy', 'same-origin')

  // CSP for HTML responses
  const contentType = c.res.headers.get('content-type')
  if (contentType?.includes('text/html')) {
    c.header(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'"
    )
  }
})
