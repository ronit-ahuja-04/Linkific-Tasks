import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const clientEnvFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env')

// Dev convenience: the browser app already knows the Firebase project id (VITE_FIREBASE_PROJECT_ID
// in the client .env). Reuse it so a fresh checkout works without a second config file.
function projectIdFromClientEnv(file = clientEnvFile) {
  try {
    const line = fs.readFileSync(file, 'utf8').split(/\r?\n/).find((l) => l.startsWith('VITE_FIREBASE_PROJECT_ID='))
    return line ? line.slice('VITE_FIREBASE_PROJECT_ID='.length).trim().replace(/^["']|["']$/g, '') : ''
  } catch {
    return ''
  }
}

export function loadConfig(env = process.env, { clientEnv = clientEnvFile } = {}) {
  const nodeEnv = env.NODE_ENV || 'development'
  const production = nodeEnv === 'production'

  let projectId = (env.FIREBASE_PROJECT_ID || '').trim()
  if (!projectId && !production) projectId = projectIdFromClientEnv(clientEnv)
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID is required (set it in server/.env).')

  const requestedEmulator = (env.FIREBASE_AUTH_EMULATOR_HOST || '').trim()
  const rateLimitMax = Number.parseInt(env.RATE_LIMIT_MAX ?? '', 10)

  return {
    nodeEnv,
    production,
    port: Number.parseInt(env.PORT ?? '', 10) || 4000,
    projectId,
    githubApiUrl: (env.GITHUB_API_URL || 'https://api.github.com').replace(/\/+$/, ''),
    clientUrl: env.CLIENT_URL || 'http://localhost:5173',
    // The emulator's unsigned tokens are only ever accepted outside production.
    emulatorHost: production ? null : requestedEmulator || null,
    emulatorIgnored: production && Boolean(requestedEmulator),
    rateLimitMax: rateLimitMax > 0 ? rateLimitMax : 60,
    logSilent: ['1', 'true', 'yes'].includes(String(env.LOG_SILENT ?? '').toLowerCase()),
  }
}
