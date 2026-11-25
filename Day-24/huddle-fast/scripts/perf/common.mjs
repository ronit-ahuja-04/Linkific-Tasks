// Shared by the Day 24 measurement scripts (scripts/perf/*.mjs).
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import zlib from 'node:zlib';

export const ROOT = path.resolve(import.meta.dirname, '../..');
export const DOCS = path.join(ROOT, 'docs', 'perf');
export const LABEL = process.env.PERF_LABEL ?? 'before';
export const PERF_USER = { email: 'perf@example.com', password: 'perf-password-123' }; // local test data only (scripts/perf-data.mjs)
export const PROD_PORT = 4180; // the production build, served like a host would
export const DEV_PORT = 5179; // the dev server, for render counts (component names are readable there)

/** The local stack's URL and keys, read from `supabase status` (kept in memory, never written) */
export function localStack() {
  const out = execSync('npx supabase status -o env', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const read = (name) => out.match(new RegExp(`^${name}="?([^"\\n]+)"?$`, 'm'))?.[1];
  const url = read('API_URL');
  const service = read('SERVICE_ROLE_KEY') ?? read('SECRET_KEY');
  if (!url || !service) throw new Error('Local Supabase is not running (npm run db:start).');
  return { url, service };
}

export async function rest(stack, pathAndQuery, init = {}) {
  const response = await fetch(`${stack.url}/rest/v1/${pathAndQuery}`, {
    ...init,
    headers: { apikey: stack.service, Authorization: `Bearer ${stack.service}`, 'Content-Type': 'application/json', ...init.headers },
  });
  if (!response.ok) throw new Error(`${pathAndQuery}: ${response.status} ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/** The "Perf lab" room and its members, from the test data set */
export async function perfRoom(stack) {
  const [room] = await rest(stack, `rooms?select=id,created_by&name=eq.${encodeURIComponent('Perf lab')}`);
  if (!room) throw new Error('No perf data. Run: node scripts/perf-data.mjs add');
  const members = await rest(stack, `room_members?select=user_id&room_id=eq.${room.id}`);
  return { id: room.id, owner: room.created_by, others: members.map((m) => m.user_id).filter((id) => id !== room.created_by) };
}

// ---------------------------------------------------------------- a static host for dist/

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json', '.ico': 'image/x-icon' };
const COMPRESSIBLE = /\.(html|js|css|svg|json)$/;

/**
 * Serves a production build the way a static host (Netlify, Cloudflare Pages, Vercel) does:
 *   - brotli or gzip for text, as every host does;
 *   - SPA fallback: unknown paths get index.html;
 *   - Cache-Control from `dist/_headers` (the Netlify / Cloudflare format the app can ship), and otherwise the
 *     hosts' safe default `public, max-age=0, must-revalidate` (the browser revalidates every file).
 * So caching is something the APP decides (by shipping _headers), as on a real host; compression is not.
 */
export function serveDist(dir, port) {
  const rules = parseHeaders(path.join(dir, '_headers'));
  const cache = new Map();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let file = path.join(dir, decodeURIComponent(url.pathname));
    if (!file.startsWith(dir) || !existsSync(file) || statSync(file).isDirectory()) file = path.join(dir, 'index.html');
    const ext = path.extname(file);
    const headers = { 'Content-Type': TYPES[ext] ?? 'application/octet-stream', 'Cache-Control': 'public, max-age=0, must-revalidate', Vary: 'Accept-Encoding' };
    for (const rule of rules) if (rule.match(url.pathname)) Object.assign(headers, rule.headers);
    let body = readFileSync(file);
    const accept = String(req.headers['accept-encoding'] ?? '');
    if (COMPRESSIBLE.test(ext)) {
      const encoding = accept.includes('br') ? 'br' : accept.includes('gzip') ? 'gzip' : null;
      if (encoding) {
        const key = `${file}|${encoding}`;
        if (!cache.has(key)) cache.set(key, encoding === 'br' ? zlib.brotliCompressSync(body) : zlib.gzipSync(body, { level: 9 }));
        body = cache.get(key);
        headers['Content-Encoding'] = encoding;
      }
    }
    res.writeHead(200, { ...headers, 'Content-Length': body.length }).end(req.method === 'HEAD' ? undefined : body);
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

function parseHeaders(file) {
  if (!existsSync(file)) return [];
  const rules = [];
  let current = null;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      const pattern = new RegExp(`^${line.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
      current = { match: (p) => pattern.test(p), headers: {} };
      rules.push(current);
    } else if (current) {
      const [name, ...value] = line.trim().split(':');
      current.headers[name.trim()] = value.join(':').trim();
    }
  }
  return rules;
}

// ---------------------------------------------------------------- the app

/** Sign in through the real form (works for Playwright and Puppeteer pages) */
export async function signIn(page, base) {
  await page.goto(`${base}/login`);
  await page.waitForSelector('#login-email');
  await page.type('#login-email', PERF_USER.email);
  await page.type('input[autocomplete="current-password"]', PERF_USER.password);
  await Promise.all([page.waitForFunction(() => location.pathname === '/', undefined, { timeout: 30_000 }), page.keyboard.press('Enter')]);
}

export const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length === 0 ? null : sorted[Math.floor((sorted.length - 1) / 2)];
};
export const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
