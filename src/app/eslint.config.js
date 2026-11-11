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
      // shadcn 4 imports cn from its own package; we keep src/lib/utils (ADR-011).
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'cn', message: "Use cn from '#/lib/utils'." }] },
      ],
    },
  },
  // Size limits keep files readable; split a component rather than raise them.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/routeTree.gen.ts', 'src/components/ui/**'],
    rules: {
      complexity: ['error', 15],
      'max-depth': ['error', 3],
      'max-params': ['error', 3],
      'max-lines': [
        'error',
        { max: 250, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'error',
        { max: 80, skipBlankLines: true, skipComments: true },
      ],
      'no-nested-ternary': 'error',
      'no-console': ['error', { allow: ['error'] }],
    },
  },
  // Every visible string goes through t() (ADR-008).
  {
    files: ['src/**/*.tsx'],
    // The design gallery is a dev tool, in English only (ADR-043).
    ignores: [
      'src/components/ui/**',
      'src/components/design/**',
      'src/routes/_authed/design.tsx',
    ],
    plugins: { i18next },
    rules: {
      'i18next/no-literal-string': ['error', { mode: 'jsx-text-only' }],
    },
  },
  {
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      'src/routeTree.gen.ts',
      'src/lib/db/database.gen.ts',
    ],
  },
]
