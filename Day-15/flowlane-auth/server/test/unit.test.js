import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { hashPassword, passwordError, verifyPassword } from '../src/passwords.js';
import { createStore } from '../src/store.js';
import { hashToken, randomToken, signAccessToken, verifyAccessToken } from '../src/tokens.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const secret = 's'.repeat(40);
const user = { id: 'u1', role: 'member', email: 'a@b.co', name: 'A B' };
const NOW = Date.UTC(2026, 0, 1);

describe('password policy', () => {
  it('accepts a good password', () => expect(passwordError('Sup3r-Secret-9')).toBeNull());
  it('rejects short passwords', () => expect(passwordError('a1b2c3')).toMatch(/at least 8/));
  it('requires a letter and a digit', () => {
    expect(passwordError('abcdefghij')).toMatch(/letter and one number/);
    expect(passwordError('1234567890')).toMatch(/letter and one number/);
  });
  it.each(['password1', '12345678', 'qwerty123', 'Password1', 'PASSWORD1'])('rejects common password %s', (p) => {
    expect(passwordError(p)).toBeTruthy();
  });
  it('rejects non-strings and too-long passwords', () => {
    expect(passwordError(undefined)).toBeTruthy();
    expect(passwordError(`a1${'x'.repeat(80)}`)).toMatch(/72/);
  });
  it('hashes with bcrypt and verifies; unknown user never verifies', async () => {
    const hash = await hashPassword('Sup3r-Secret-9', 4);
    expect(hash).not.toContain('Sup3r');
    expect(await verifyPassword({ passwordHash: hash }, 'Sup3r-Secret-9', 4)).toBe(true);
    expect(await verifyPassword({ passwordHash: hash }, 'wrong-pass-1', 4)).toBe(false);
    expect(await verifyPassword(null, 'Sup3r-Secret-9', 4)).toBe(false);
  });
});

describe('access tokens', () => {
  const sign = (over = {}) => signAccessToken({ secret, user, sid: 's1', nowMs: NOW, ttlSeconds: 60, ...over });

  it('round-trips and carries the contract claims', () => {
    const r = verifyAccessToken(sign(), { secret, nowMs: NOW + 1000 });
    expect(r.status).toBe('valid');
    expect(r.claims).toMatchObject({ sub: 'u1', role: 'member', email: 'a@b.co', name: 'A B', sid: 's1', iss: 'flowlane-auth', aud: 'flowlane-web' });
    expect(r.claims.exp - r.claims.iat).toBe(60);
  });
  it('reports expired separately from invalid', () => {
    expect(verifyAccessToken(sign(), { secret, nowMs: NOW + 61_000 }).status).toBe('expired');
    expect(verifyAccessToken('garbage', { secret, nowMs: NOW }).status).toBe('invalid');
  });
  it('rejects a token signed with another secret (even if not expired)', () => {
    expect(verifyAccessToken(sign({ secret: 'x'.repeat(40) }), { secret, nowMs: NOW }).status).toBe('invalid');
  });
  it('rejects alg none', () => {
    const none = jwt.sign({ sub: 'u1', sid: 's1', iss: 'flowlane-auth', aud: 'flowlane-web' }, '', { algorithm: 'none' });
    expect(verifyAccessToken(none, { secret, nowMs: NOW }).status).toBe('invalid');
  });
  it('rejects other HMAC algorithms (HS512)', () => {
    const t = jwt.sign({ sub: 'u1', sid: 's1' }, secret, { algorithm: 'HS512', issuer: 'flowlane-auth', audience: 'flowlane-web' });
    expect(verifyAccessToken(t, { secret, nowMs: Date.now() }).status).toBe('invalid');
  });
  it('rejects wrong issuer and audience', () => {
    const bad = (o) => jwt.sign({ sub: 'u1', sid: 's1' }, secret, { algorithm: 'HS256', ...o });
    expect(verifyAccessToken(bad({ issuer: 'evil', audience: 'flowlane-web' }), { secret, nowMs: Date.now() }).status).toBe('invalid');
    expect(verifyAccessToken(bad({ issuer: 'flowlane-auth', audience: 'other' }), { secret, nowMs: Date.now() }).status).toBe('invalid');
  });
  it('a forged expired token is invalid, not expired', () => {
    const forged = sign({ secret: 'y'.repeat(40) });
    expect(verifyAccessToken(forged, { secret, nowMs: NOW + 999_000 }).status).toBe('invalid');
  });
});

describe('opaque tokens', () => {
  it('are random and hashed with sha256', () => {
    expect(randomToken()).not.toBe(randomToken());
    expect(randomToken().length).toBeGreaterThanOrEqual(40);
    expect(hashToken('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('config', () => {
  it('requires JWT_SECRET in production', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/JWT_SECRET/);
    expect(loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'x' }).isProd).toBe(true);
  });
  it('has the contract defaults', () => {
    const c = loadConfig({});
    expect(c).toMatchObject({ port: 4000, clientUrl: 'http://localhost:5173', accessTtlSeconds: 900, refreshTtlDays: 30, sessionRefreshTtlHours: 24, bcryptCost: 12, trustProxy: false, secretGenerated: true });
    expect(c.github.callbackUrl).toBe('http://localhost:5173/api/auth/github/callback');
  });
  it('never enables dev features in production', () => {
    const c = loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'x', ENABLE_DEV_OUTBOX: 'true', OAUTH_FAKE: 'true' });
    expect(c.enableDevOutbox).toBe(false);
    expect(c.oauthFake).toBe(false);
  });
});

describe('store persistence', () => {
  it('writes atomically to a file and reloads it', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fl-store-'));
    const file = path.join(dir, 'nested', 'db.json');
    const a = createStore({ dbFile: file });
    a.users.insert({ email: 'x@y.zz' });
    expect(fs.readdirSync(path.dirname(file))).toEqual(['db.json']); // no temp file left behind
    const b = createStore({ dbFile: file });
    expect(b.users.all()).toHaveLength(1);
    expect(b.users.all()[0].id).toMatch(/^[0-9a-f-]{36}$/);
    fs.rmSync(dir, { recursive: true, force: true });
  });
  it('does not touch the disk for :memory:', () => {
    const s = createStore({ dbFile: ':memory:' });
    s.users.insert({ a: 1 });
    expect(s.users.all()).toHaveLength(1);
  });
});
