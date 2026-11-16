// A tiny fake of the GitHub REST API for demos and e2e tests (no network, no real account).
//   node src/dev/fake-github.js            (port: FAKE_GITHUB_PORT, default 4200)
// Point the API at it with GITHUB_API_URL=http://127.0.0.1:4200
//
// Tokens: any non-empty one works, except `bad-token` (401 Bad credentials) and `limited-token`
// (403 with x-ratelimit-remaining: 0). Data is deterministic.
//
// octocat/hello-flowlane has 40 items, newest first (like GitHub):
//   open   #35..#1  = 35 items (2 pages of 30), every 7th is a pull request (must be filtered)
//   closed #36..#40 = 5 items (#40 is a pull request)
// so state=open gives 35 items over 2 pages, state=closed 5, state=all 40 over 2 pages.
import http from 'node:http'
import { fileURLToPath } from 'node:url'

const REPO = 'octocat/hello-flowlane'
const LABELS = [
  { name: 'bug', color: 'd73a4a' },
  { name: 'enhancement', color: 'a2eeef' },
  { name: 'good first issue', color: '7057ff' },
  { name: 'docs', color: '0075ca' },
]

const repos = [
  { id: 1001, full_name: REPO, private: false, description: 'A friendly demo project', open_issues_count: 35, updated_at: '2026-11-10T09:00:00Z', html_url: `https://github.com/${REPO}` },
  { id: 1002, full_name: 'octocat/Spoon-Knife', private: false, description: 'This repo is for demonstration purposes only.', open_issues_count: 2, updated_at: '2026-10-01T12:30:00Z', html_url: 'https://github.com/octocat/Spoon-Knife' },
  { id: 1003, full_name: 'octocat/secret-plans', private: true, description: null, open_issues_count: 0, updated_at: '2026-09-15T08:15:00Z', html_url: 'https://github.com/octocat/secret-plans' },
]

function buildItems() {
  const items = []
  for (let n = 40; n >= 1; n--) {
    const closed = n > 35
    const isPr = closed ? n === 40 : n % 7 === 0
    const day = String(((n * 3) % 27) + 1).padStart(2, '0')
    const item = {
      id: 5000 + n,
      number: n,
      title: isPr ? `Pull request ${n}: update dependencies` : `Issue ${n}: ${['Login button misaligned', 'Add dark mode', 'Docs typo', 'Crash on empty board', 'Export to CSV'][n % 5]}`,
      body: n % 4 === 0 ? null : n % 9 === 0 ? `Long description. ${'x'.repeat(900)}` : `Steps to reproduce issue ${n}.`,
      html_url: `https://github.com/${REPO}/${isPr ? 'pull' : 'issues'}/${n}`,
      state: closed ? 'closed' : 'open',
      labels: LABELS.filter((_, i) => (n + i) % 3 === 0),
      user: { login: n % 2 ? 'octocat' : 'hubot' },
      comments: n % 6,
      created_at: `2026-10-${day}T10:00:00Z`,
      updated_at: `2026-11-${day}T10:00:00Z`,
    }
    if (isPr) item.pull_request = { url: `https://api.github.com/repos/${REPO}/pulls/${n}` }
    items.push(item)
  }
  return items
}
const items = buildItems()

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json', 'x-ratelimit-remaining': '4999', ...headers })
  res.end(JSON.stringify(body))
}

function linkHeader(base, params, page, hasNext) {
  const url = (p) => `${base}?${new URLSearchParams({ ...params, page: String(p) })}`
  const parts = hasNext ? [`<${url(page + 1)}>; rel="next"`, `<${url(page + 1)}>; rel="last"`] : []
  if (page > 1) parts.push(`<${url(page - 1)}>; rel="prev"`)
  return parts.length ? { link: parts.join(', ') } : {}
}

export function createFakeGithub() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://fake.local')
    const auth = req.headers.authorization ?? ''
    const token = auth.replace(/^(Bearer|token)\s+/i, '').trim()
    if (!token) return send(res, 401, { message: 'Requires authentication' })
    if (token === 'bad-token') return send(res, 401, { message: 'Bad credentials' })
    if (token === 'limited-token') {
      const reset = String(Math.floor(Date.now() / 1000) + 3600)
      return send(res, 403, { message: 'API rate limit exceeded' }, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': reset })
    }
    if (req.method !== 'GET') return send(res, 405, { message: 'Method not allowed' })

    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
    const perPage = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('per_page') ?? '30', 10) || 30))

    if (url.pathname === '/user') return send(res, 200, { login: 'octocat', id: 1, name: 'The Octocat' })

    if (url.pathname === '/user/repos') {
      const slice = repos.slice((page - 1) * perPage, page * perPage)
      const hasNext = page * perPage < repos.length
      return send(res, 200, slice, linkHeader(`http://${req.headers.host}/user/repos`, { per_page: perPage }, page, hasNext))
    }

    const match = /^\/repos\/([^/]+)\/([^/]+)\/issues$/.exec(url.pathname)
    if (match) {
      if (`${match[1]}/${match[2]}` !== REPO) return send(res, 404, { message: 'Not Found' })
      const state = url.searchParams.get('state') ?? 'open'
      const filtered = items.filter((i) => state === 'all' || i.state === state)
      const slice = filtered.slice((page - 1) * perPage, page * perPage)
      const hasNext = page * perPage < filtered.length
      return send(res, 200, slice, linkHeader(`http://${req.headers.host}${url.pathname}`, { state, per_page: perPage }, page, hasNext))
    }
    return send(res, 404, { message: 'Not Found' })
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number.parseInt(process.env.FAKE_GITHUB_PORT ?? '', 10) || 4200
  const server = createFakeGithub().listen(port, '127.0.0.1', () => console.log(`[fake-github] listening on http://127.0.0.1:${port}`))
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)))
}
