/**
 * API process — HTTP server only.
 *
 * Workers (BullMQ) run in a separate process via worker.ts.
 * This keeps API restarts independent from worker drain cycles.
 */

import { buildApp } from './app.js'

const PORT = Number(process.env['PORT']) || 3001
const HOST = process.env['HOST'] ?? '0.0.0.0'

void (async () => {
  const app = await buildApp()

  try {
    await app.listen({ port: PORT, host: HOST })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }

  // Railway envia SIGTERM no redeploy — drena conexões em vez de derrubar requests
  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, 'shutting down')
    await app.close()
    process.exit(0)
  }
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))
})()
