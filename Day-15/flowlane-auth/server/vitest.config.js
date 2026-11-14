import { defineConfig } from 'vitest/config'

// Explicit config so vitest does not pick up the client's vitest.config.js from the parent folder.
export default defineConfig({ test: { environment: 'node', include: ['test/**/*.test.js'] } })
