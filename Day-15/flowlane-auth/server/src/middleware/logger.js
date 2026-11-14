// Minimal request log: "GET /api/me 200 3ms". It deliberately has NO query string (could carry a
// search term or repo name) and NO headers (Authorization and X-GitHub-Token are secrets).
export function requestLogger({ silent }) {
  return (req, res, next) => {
    if (silent) return next()
    const started = process.hrtime.bigint()
    const path = req.originalUrl.split('?')[0]
    res.on('finish', () => {
      const ms = Number((process.hrtime.bigint() - started) / 1_000_000n)
      console.log(`${req.method} ${path} ${res.statusCode} ${ms}ms`)
    })
    next()
  }
}
