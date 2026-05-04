// @ts-check
import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import globals from 'globals'

const tsRulesBase = {
  '@typescript-eslint/no-unused-vars': [
    'error',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
  ],
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
  ],
  '@typescript-eslint/no-import-type-side-effects': 'error',
}

export default [
  js.configs.recommended,

  // ── Config / test setup files — sem type-checking (tsconfig não os inclui) ──
  {
    files: ['**/*.config.{ts,mjs,cjs}', '**/vitest.setup.ts'],
    plugins: { '@typescript-eslint': tsPlugin },
    languageOptions: {
      parser: tsParser,
      globals: { ...globals.node },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...tsRulesBase,
    },
  },

  // ── Node.js source files (api, db, shared) ────────────────────────────────
  {
    files: [
      'apps/api/src/**/*.ts',
      'packages/db/src/**/*.ts',
      'packages/db/prisma/**/*.ts',
      'packages/shared/src/**/*.ts',
    ],
    plugins: { '@typescript-eslint': tsPlugin },
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: true },
      globals: { ...globals.node },
    },
    rules: {
      ...tsPlugin.configs['recommended-type-checked'].rules,
      ...tsRulesBase,
    },
  },

  // ── React / browser files (web, ui) ───────────────────────────────────────
  {
    files: ['apps/web/src/**/*.{ts,tsx}', 'packages/ui/src/**/*.{ts,tsx}'],
    plugins: { '@typescript-eslint': tsPlugin },
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: true },
      globals: { ...globals.browser },
    },
    rules: {
      ...tsPlugin.configs['recommended-type-checked'].rules,
      ...tsRulesBase,
    },
  },

  // ── Ignores ───────────────────────────────────────────────────────────────
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/next-env.d.ts',
    ],
  },
]
