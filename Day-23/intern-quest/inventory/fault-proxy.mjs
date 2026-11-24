// FAULT PROXY for the error inventory. It sits between the app and the local Supabase API, so the inventory can make
// the database slow, unavailable or unreachable WITHOUT changing a line of the app:
//
//   app (SUPABASE_URL=http://127.0.0.1:55499)  ->  this proxy  ->  Supabase (http://127.0.0.1:55421)
//
// Modes, switched by the tests with   POST /__fault?mode=<mode>&ms=<delay>   (GET /__fault reports the current mode):
//   pass         forward everything (the default)
//   slow         wait `ms` milliseconds, then forward
//   unavailable  answer 503 with PostgREST's own body for "the database can not be reached"
//   down         drop the connection (the app's fetch fails: what a network outage or a dead host looks like)
//
// Local use only: it is started by playwright.inventory.config.ts and listens on 127.0.0.1.
import http from 'node:http';

const PORT = Number(process.env.FAULT_PROXY_PORT ?? 55499);
const TARGET = new URL(process.env.FAULT_PROXY_TARGET ?? 'http://127.0.0.1:55421');
let state = { mode: 'pass', ms: 0 };

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  if (url.pathname === '/__fault') {
    if (req.method === 'POST') state = { mode: url.searchParams.get('mode') ?? 'pass', ms: Number(url.searchParams.get('ms') ?? 0) };
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(state));
    return;
  }

  const { mode, ms } = state;
  if (mode === 'down') {
    req.socket.destroy();
    return;
  }
  if (mode === 'unavailable') {
    res.writeHead(503, { 'content-type': 'application/json' })
      .end(JSON.stringify({ code: 'PGRST001', details: 'connection refused', hint: null, message: 'Database client error. Retrying the connection.' }));
    return;
  }

  const forward = () => {
    const upstream = http.request(
      { host: TARGET.hostname, port: TARGET.port, method: req.method, path: req.url, headers: { ...req.headers, host: TARGET.host } },
      (answer) => {
        res.writeHead(answer.statusCode ?? 502, answer.headers);
        answer.pipe(res);
      },
    );
    upstream.on('error', () => res.writeHead(502).end());
    req.pipe(upstream);
  };
  if (mode === 'slow') setTimeout(forward, ms);
  else forward();
});

server.listen(PORT, '127.0.0.1', () => console.log(`[fault-proxy] :${PORT} -> ${TARGET.origin}`));
