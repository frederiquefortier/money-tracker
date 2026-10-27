import { defineConfig } from 'vitest/config'

// Kept apart from vite.config.ts: the Start and Netlify plugins are not needed to test
// plain modules.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { include: ['src/**/*.test.ts'] },
})
