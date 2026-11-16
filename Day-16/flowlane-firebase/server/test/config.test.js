import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { loadConfig } from '../src/config.js'

describe('loadConfig', () => {
  it('applies defaults', () => {
    const c = loadConfig({ FIREBASE_PROJECT_ID: 'p' })
    expect(c).toMatchObject({ projectId: 'p', port: 4000, githubApiUrl: 'https://api.github.com', clientUrl: 'http://localhost:5173', rateLimitMax: 60, emulatorHost: null, logSilent: false })
  })

  it('reads overrides and strips a trailing slash from the GitHub URL', () => {
    const c = loadConfig({ FIREBASE_PROJECT_ID: 'p', PORT: '4010', GITHUB_API_URL: 'http://x:1/', RATE_LIMIT_MAX: '5', LOG_SILENT: 'true' })
    expect(c).toMatchObject({ port: 4010, githubApiUrl: 'http://x:1', rateLimitMax: 5, logSilent: true })
  })

  it('falls back to VITE_FIREBASE_PROJECT_ID from the client .env in development', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cfg-'))
    const file = path.join(dir, '.env')
    fs.writeFileSync(file, 'FOO=1\nVITE_FIREBASE_PROJECT_ID="from-client"\n')
    expect(loadConfig({}, { clientEnv: file }).projectId).toBe('from-client')
    fs.rmSync(dir, { recursive: true })
  })

  it('requires a project id (no client fallback in production, none when the file is missing)', () => {
    expect(() => loadConfig({}, { clientEnv: '/nonexistent/.env' })).toThrow(/FIREBASE_PROJECT_ID/)
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cfg-'))
    const file = path.join(dir, '.env')
    fs.writeFileSync(file, 'VITE_FIREBASE_PROJECT_ID=x\n')
    expect(() => loadConfig({ NODE_ENV: 'production' }, { clientEnv: file })).toThrow(/FIREBASE_PROJECT_ID/)
    fs.rmSync(dir, { recursive: true })
  })

  it('keeps the emulator host outside production and drops it in production', () => {
    const dev = loadConfig({ FIREBASE_PROJECT_ID: 'p', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9199' })
    expect(dev.emulatorHost).toBe('127.0.0.1:9199')
    const prod = loadConfig({ FIREBASE_PROJECT_ID: 'p', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9199', NODE_ENV: 'production' })
    expect(prod.emulatorHost).toBeNull()
    expect(prod.emulatorIgnored).toBe(true)
  })
})
