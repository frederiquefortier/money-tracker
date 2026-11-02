import { defineConfig } from 'vitest/config'

// Without the Start and Netlify plugins, which plain modules do not need.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { include: ['src/**/*.test.ts'] },
})
