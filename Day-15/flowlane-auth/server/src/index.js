import 'dotenv/config'
import { createApp } from './app.js'
import { loadConfig } from './config.js'

const config = loadConfig()
if (config.emulatorHost) {
  console.warn(`[api] WARNING: FIREBASE_AUTH_EMULATOR_HOST is set (${config.emulatorHost}): accepting UNSIGNED emulator tokens. Development only.`)
}
if (config.emulatorIgnored) {
  console.warn('[api] FIREBASE_AUTH_EMULATOR_HOST is ignored because NODE_ENV=production.')
}

const server = createApp({ config }).listen(config.port, () => {
  console.log(`[api] FlowLane API listening on :${config.port} (project ${config.projectId}, GitHub ${config.githubApiUrl})`)
})

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)))
