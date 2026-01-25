const http = require('http')
const fs = require('fs')
const path = require('path')

const { URL } = require('url')

const root = path.resolve(__dirname, '..', 'apps', 'control-room')
const port = Number(process.env.PORT || process.argv[2] || 4173)
const host = process.env.HOST || '127.0.0.1'

const apiBase = new URL(process.env.API_BASE || 'http://127.0.0.1:3000')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
}

function safePathFromUrl(urlPathname) {
  // Strip query/hash and normalize.
  const clean = decodeURIComponent(
    String(urlPathname || '/')
      .split('?')[0]
      .split('#')[0],
  )
  const rel = clean === '/' ? '/index.html' : clean
  const abs = path.resolve(root, '.' + rel)
  if (!abs.startsWith(root)) return null
  return abs
}

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url || '/', `http://${host}`)
  const pathname = urlObj.pathname

  // Proxy API calls to the real server (same-origin from the browser's perspective).
  if (pathname.startsWith('/api/') || pathname === '/healthz' || pathname === '/readyz') {
    const upstreamPath = pathname + urlObj.search
    const upstreamUrl = new URL(upstreamPath, apiBase)

    const upstreamReq = http.request(
      upstreamUrl,
      {
        method: req.method,
        headers: req.headers,
      },
      (upstreamRes) => {
        res.statusCode = upstreamRes.statusCode || 502
        for (const [k, v] of Object.entries(upstreamRes.headers)) {
          if (v !== undefined) res.setHeader(k, v)
        }
        upstreamRes.pipe(res)
      },
    )

    upstreamReq.on('error', () => {
      res.statusCode = 502
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'upstream_unavailable', apiBase: apiBase.toString() }))
    })

    req.pipe(upstreamReq)
    return
  }

  const abs = safePathFromUrl(pathname)
  if (!abs) {
    res.statusCode = 400
    res.end('Bad Request')
    return
  }

  const candidates = [abs]
  // Support directory paths.
  if (!path.extname(abs)) candidates.push(path.join(abs, 'index.html'))

  let filePath = null
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      filePath = c
      break
    }
  }

  if (!filePath) {
    res.statusCode = 404
    res.end('Not Found')
    return
  }

  const ext = path.extname(filePath)
  res.setHeader('content-type', MIME[ext] || 'application/octet-stream')
  res.setHeader('cache-control', 'no-store')

  fs.createReadStream(filePath)
    .on('error', () => {
      res.statusCode = 500
      res.end('Internal Error')
    })
    .pipe(res)
})

server.listen(port, host, () => {
  console.log(`[control-room] serving ${root} at http://${host}:${port}`)
})
