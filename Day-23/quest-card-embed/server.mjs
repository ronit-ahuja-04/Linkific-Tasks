// A tiny static file server for the quest-card embed site: a SECOND ORIGIN for the Day 23 CORS work.
// The Intern Quest app runs on http://localhost:3000; this site runs on http://localhost:4000. Same machine, same
// "site" (localhost), but a different PORT, so a different ORIGIN: the browser applies the same-origin policy.
// The same files at http://127.0.0.1:4000 are yet another origin (a different host name), which is how the CORS lab
// shows a refused origin.
//
//   node server.mjs            (PORT=4000 by default)
//
// It listens on the loopback addresses only (127.0.0.1 and ::1), never on the network.
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

const PORT = Number(process.env.PORT ?? 4000);
const ROOT = path.join(import.meta.dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };

async function handle(req, res) {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const file = path.normalize(path.join(ROOT, pathname === '/' ? 'index.html' : pathname));
  if (!file.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
}

for (const host of ['127.0.0.1', '::1']) {
  http.createServer(handle)
    .on('error', (error) => console.warn(`[embed] could not listen on ${host}: ${error.message}`))
    .listen(PORT, host, () => console.log(`[embed] http://${host.includes(':') ? `[${host}]` : host}:${PORT}`));
}
