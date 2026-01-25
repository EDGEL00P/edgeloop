import { createLogger } from './logger'
import { createBroadcastHttpServer } from './http'

import { readRuntimeConfig } from './config'

export function main(): void {
  const logger = createLogger()
  const startedAtIso = new Date().toISOString()

  process.on('uncaughtException', (err) => {
    logger.error('uncaught_exception', { error: String(err) })
    process.exit(1)
  })

  process.on('unhandledRejection', (err) => {
    logger.error('unhandled_rejection', { error: String(err) })
    process.exit(1)
  })

  const server = createBroadcastHttpServer({
    startedAtIso,
    logger,
  })

  const cfg = readRuntimeConfig()

  server.listen(cfg.port, cfg.host, () => {
    logger.info('server_listening', { host: cfg.host, port: cfg.port })
  })

  const shutdown = (signal: string) => {
    logger.info('server_shutdown_begin', { signal, graceMs: cfg.shutdownGraceMs })

    const killTimer = setTimeout(() => {
      logger.error('server_shutdown_timeout')
      process.exit(1)
    }, cfg.shutdownGraceMs)

    server.close((err) => {
      clearTimeout(killTimer)

      if (err) {
        logger.error('server_shutdown_error', { error: String(err) })
        process.exit(1)
        return
      }

      logger.info('server_shutdown_complete')
    })
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

if (require.main === module) {
  main()
}
