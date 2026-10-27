//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import i18next from 'eslint-plugin-i18next'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
      // shadcn 4 imports cn from its own 0.x package; we keep src/lib/utils (ADR-011).
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'cn', message: "Use cn from '#/lib/utils'." }] },
      ],
    },
  },
  // Every visible string goes through t() (ADR-008). shadcn primitives hold no copy.
  {
    files: ['src/**/*.tsx'],
    ignores: ['src/components/ui/**'],
    plugins: { i18next },
    rules: {
      'i18next/no-literal-string': ['error', { mode: 'jsx-text-only' }],
    },
  },
  {
    ignores: ['eslint.config.js', 'prettier.config.js', 'src/routeTree.gen.ts'],
  },
]
