import { API, withApi } from './config.js';

// The CORS lab: each case is one cross-origin request with a known outcome, run live in this browser.
const card = `${API}/api/public/characters/ronit`;

const CASES = [
  {
    id: 'simple',
    title: '1. A simple GET to the public card API',
    what: 'fetch(card): a GET with no custom headers is a "simple" request. The browser sends it straight away, with an Origin header.',
    expect: 'Works from an allowed origin (localhost:4000 by default). Blocked from any other origin, e.g. 127.0.0.1:4000.',
    why: 'The API answers Access-Control-Allow-Origin with this exact origin (never *), plus Vary: Origin so no cache serves one origin\'s answer to another.',
    run: () => fetch(card),
  },
  {
    id: 'preflight',
    title: '2. A request with a custom header: preflighted',
    what: 'fetch(card, { headers: { "X-Client-Name": "cors-lab" } }): a custom header makes it "non-simple". The browser first asks with OPTIONS (the preflight), then sends the GET.',
    expect: 'Works from an allowed origin. In the Network tab: an OPTIONS (204) and then the GET. Run it again: no OPTIONS for 10 minutes (Access-Control-Max-Age: 600).',
    why: 'The preflight answer lists X-Client-Name in Access-Control-Allow-Headers.',
    run: () => fetch(card, { headers: { 'X-Client-Name': 'cors-lab' } }),
  },
  {
    id: 'header',
    title: '3. A header the API does not allow',
    what: 'fetch(card, { headers: { "X-Debug": "1" } }): preflighted, but X-Debug is not in the allowed headers.',
    expect: 'Blocked, even from an allowed origin: the GET is never sent.',
    why: 'An allowed origin is not enough: the preflight answer must also allow the method and every non-simple header.',
    run: () => fetch(card, { headers: { 'X-Debug': '1' } }),
  },
  {
    id: 'method',
    title: '4. A method the API does not allow',
    what: 'fetch(card, { method: "DELETE" }): DELETE is never simple, so it is preflighted.',
    expect: 'Blocked: the preflight allows only GET and OPTIONS. The DELETE is never sent.',
    why: 'Access-Control-Allow-Methods: GET, OPTIONS. (The browser enforces it; a non-browser client could still send a DELETE, and the API itself would refuse it.)',
    run: () => fetch(card, { method: 'DELETE' }),
  },
  {
    id: 'credentials',
    title: '5. Sending cookies: credentials "include"',
    what: 'fetch(card, { credentials: "include" }): send this browser\'s cookies for the API\'s site along with the request.',
    expect: 'Blocked: the API does not send Access-Control-Allow-Credentials: true.',
    why: 'The card is public, so no cookie is needed, and none is invited. A credentialed answer would also need the exact origin (the * wildcard is never allowed with credentials).',
    run: () => fetch(card, { credentials: 'include' }),
  },
  {
    id: 'private',
    title: '6. The signed-in API: /api/quests',
    what: 'fetch(`${API}/api/quests`, { credentials: "include" }): try to read someone\'s quests from another site, with their session cookie.',
    expect: 'Blocked: routes outside /api/public send no CORS headers at all. Note that the request may still REACH the server (and, signed in, be processed): CORS hides the answer, it does not stop the request. That is why the signed-in API also checks the session, and why writes must never be reachable with a simple request.',
    why: 'localhost:4000 and localhost:3000 are the same SITE (cookies can flow between them) but different ORIGINS (scripts can not read across them).',
    run: () => fetch(`${API}/api/quests`, { credentials: 'include' }),
  },
  {
    id: 'csrf',
    title: '7. A "simple" POST with the session cookie: forged write (CSRF)',
    what: 'fetch(`${API}/api/quests`, { method: "POST", credentials: "include", headers: { "Content-Type": "text/plain" }, body: …a valid quest… }): text/plain makes it a simple request, so NO preflight; the browser just sends it, with your cookie.',
    expect: 'Blocked for the script, as in case 6. What matters is the server: in the Network tab the POST answers 403 "accepted from this site only". Without that check, a quest would have been logged in your name, unseen.',
    why: 'CORS decides who may READ an answer, not who may SEND a request. The API refuses every write whose Origin is not its own (src/proxy.ts), the same check Next.js makes for server actions.',
    run: () => fetch(`${API}/api/quests`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ day: 365, date: '2026-12-31', title: 'Forged by the CORS lab', skills: ['react'] }),
    }),
  },
];

const el = (tag, text, attrs = {}) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  return node;
};

const seenIds = new Set();

async function runCase(test, output) {
  output.dataset.result = '';
  output.textContent = 'Running…';
  try {
    const response = await test.run();
    const body = await response.json().catch(() => null);
    const id = response.headers.get('x-request-id');
    // the card answer may be cached for 60 s (Cache-Control: public, max-age=60): the same id means the browser
    // answered from its cache and the GET never reached the server (a preflight may still have)
    const cached = id !== null && seenIds.has(id);
    if (id) seenIds.add(id);
    output.dataset.result = 'ok';
    output.textContent = [
      `Worked: HTTP ${response.status}${body?.card ? `, card for ${body.card.name}` : ''}.`,
      `Readable response headers: content-type = ${response.headers.get('content-type')}, x-request-id = ${response.headers.get('x-request-id') ?? '(not exposed)'}`,
      `Not readable (not exposed to scripts): access-control-allow-origin = ${response.headers.get('access-control-allow-origin')}`,
      ...(cached ? ['Same request id as before: served from the browser cache (Cache-Control: max-age=60). Disable the cache in the Network tab to see every request.'] : []),
    ].join('\n');
  } catch (error) {
    output.dataset.result = 'blocked';
    output.textContent = `Blocked: JavaScript got "${error}".\nThe script can not tell a CORS refusal from a network failure. The Console says which.`;
  }
}

document.getElementById('origin').textContent = location.origin;
document.getElementById('api').textContent = API;
document.getElementById('home').href = withApi('index.html');

// the same lab under another host name is another origin, not on the API's list
const other = location.hostname === 'localhost' ? location.href.replace('//localhost', '//127.0.0.1') : location.href.replace('//127.0.0.1', '//localhost');
const otherLink = el('a', `Open this lab from ${new URL(other).origin}`, { href: other });
document.getElementById('other-origin').append(otherLink, ' to see case 1 and 2 blocked: same files, same machine, different origin.');

const outputs = [];
const container = document.getElementById('cases');
for (const test of CASES) {
  const section = el('section', undefined, { class: 'case', 'aria-labelledby': `t-${test.id}` });
  const output = el('output', '', { id: `r-${test.id}`, 'aria-live': 'polite' });
  const button = el('button', `Run case ${test.title.split('.')[0]}`, { type: 'button' });
  button.addEventListener('click', () => void runCase(test, output));
  section.append(el('h2', test.title, { id: `t-${test.id}` }), el('p', test.what), el('p', `Expected: ${test.expect}`, { class: 'expect' }), el('p', `Why: ${test.why}`), button, output);
  container.append(section);
  outputs.push([test, output]);
}
document.getElementById('run-all').addEventListener('click', async () => {
  for (const [test, output] of outputs) await runCase(test, output);
});
