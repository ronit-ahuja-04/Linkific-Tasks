import { Router } from 'express'
import { errors, ApiError } from '../errors.js'

const REPO_RE = /^[\w.-]+\/[\w.-]+$/
const STATES = new Set(['open', 'closed', 'all'])
const GITHUB_TOKEN_RE = /^[A-Za-z0-9_.-]{1,255}$/
const BODY_MAX = 600

// The GitHub access token arrives per request in X-GitHub-Token (the browser keeps it in memory
// only). We forward it to GitHub and forget it: never stored, never logged, never echoed back.
function readGithubToken(req) {
  const token = req.get('x-github-token')
  if (!token) throw errors.githubTokenMissing()
  if (!GITHUB_TOKEN_RE.test(token)) throw errors.githubTokenInvalid()
  return token
}

function parsePage(value) {
  if (value === undefined) return 1
  if (typeof value !== 'string' || !/^\d{1,4}$/.test(value) || Number(value) < 1) throw errors.validation('page must be a positive integer.')
  return Number(value)
}

// Calls GitHub and translates its failures into our error codes. Returns { data, hasMore }.
async function callGithub({ fetch, config, path, token, notFound }) {
  let res
  try {
    res = await fetch(`${config.githubApiUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'flowlane-api' },
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw errors.githubUnavailable()
  }
  if (res.status === 401) throw errors.githubTokenInvalid()
  if (res.status === 429 || (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0')) {
    const reset = Number(res.headers.get('x-ratelimit-reset'))
    throw new ApiError(429, 'github_rate_limited', 'GitHub rate limit reached. Try again later.', { resetAt: reset > 0 ? reset * 1000 : null })
  }
  if (res.status === 403) throw new ApiError(403, 'github_forbidden', 'GitHub refused access to this resource.')
  if (res.status === 404 && notFound) throw notFound()
  if (!res.ok) throw errors.githubUnavailable()
  let data
  try {
    data = await res.json()
  } catch {
    throw errors.githubUnavailable()
  }
  if (!Array.isArray(data)) throw errors.githubUnavailable()
  return { data, hasMore: /rel="next"/.test(res.headers.get('link') ?? '') }
}

export function githubRouter({ config, fetch }) {
  const router = Router()

  router.get('/repos', async (req, res) => {
    const token = readGithubToken(req)
    const page = parsePage(req.query.page)
    const q = req.query.q ?? ''
    if (typeof q !== 'string' || q.length > 100) throw errors.validation('q must be a string of at most 100 characters.')

    const path = `/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member&page=${page}`
    const { data, hasMore } = await callGithub({ fetch, config, path, token })
    const needle = q.trim().toLowerCase()
    const repos = data
      .filter((r) => !needle || String(r.full_name).toLowerCase().includes(needle))
      .map((r) => ({
        id: r.id,
        fullName: r.full_name,
        private: Boolean(r.private),
        description: r.description ?? null,
        openIssues: r.open_issues_count ?? 0,
        updatedAt: r.updated_at,
        url: r.html_url,
      }))
    res.json({ repos, hasMore })
  })

  router.get('/issues', async (req, res) => {
    const token = readGithubToken(req)
    const repo = req.query.repo
    // Validate strictly: the value is placed in a URL path, so "../x" must never get through.
    if (typeof repo !== 'string' || !REPO_RE.test(repo) || repo.split('/').some((s) => s === '.' || s === '..')) {
      throw errors.validation('repo must look like "owner/name".')
    }
    const state = req.query.state ?? 'open'
    if (typeof state !== 'string' || !STATES.has(state)) throw errors.validation('state must be open, closed or all.')
    const page = parsePage(req.query.page)

    const path = `/repos/${repo}/issues?state=${state}&per_page=30&page=${page}`
    const { data, hasMore } = await callGithub({ fetch, config, path, token, notFound: errors.repoNotFound })
    // GitHub's issues endpoint also returns pull requests (they carry a "pull_request" key): drop them.
    const issues = data
      .filter((i) => !i.pull_request)
      .map((i) => ({
        id: i.id,
        number: i.number,
        title: i.title,
        body: (i.body ?? '').slice(0, BODY_MAX),
        url: i.html_url,
        state: i.state,
        labels: (i.labels ?? []).map((l) => (typeof l === 'string' ? { name: l, color: '' } : { name: l.name, color: l.color ?? '' })),
        author: i.user?.login ?? null,
        comments: i.comments ?? 0,
        createdAt: i.created_at,
        updatedAt: i.updated_at,
      }))
    res.json({ issues, hasMore })
  })

  return router
}
