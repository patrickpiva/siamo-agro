import { buildApp } from './app.js'
import { startMatchmakingWorker } from './workers/matchmaking/index.js'

const PORT = Number(process.env['PORT']) || 3001
const HOST = process.env['HOST'] ?? '0.0.0.0'

void (async () => {
  const app = await buildApp()

  if (process.env['REDIS_URL']) {
    startMatchmakingWorker()
  }

  try {
    await app.listen({ port: PORT, host: HOST })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
})()
