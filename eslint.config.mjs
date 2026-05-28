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
      // Mock adapters implementam interfaces async sem precisar de await real.
      '@typescript-eslint/require-await': 'off',
      // The base rule does not understand TypeScript overloads; the TS version
      // (included via recommended-type-checked) handles them correctly.
      'no-redeclare': 'off',
    },
  },

  // ── Playwright E2E tests ───────────────────────────────────────────────────
  {
    files: ['apps/web/tests/**/*.ts', 'apps/web/tests/**/*.spec.ts', 'apps/web/e2e/**/*.ts'],
    plugins: { '@typescript-eslint': tsPlugin },
    languageOptions: {
      parser: tsParser,
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
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
      // Next.js tem arquivos server-side (Server Actions, Route Handlers) e
      // client-side no mesmo diretório — precisamos de ambos os globals.
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      ...tsPlugin.configs['recommended-type-checked'].rules,
      ...tsRulesBase,
      // TypeScript já resolve referências indefinidas — no-undef gera falsos
      // positivos para tipos globais como React.FormEvent, JSX, etc.
      'no-undef': 'off',
      // Async event handlers sem await são comuns em React (e.preventDefault + sync logic).
      '@typescript-eslint/require-await': 'off',
      // The base rule does not understand TypeScript overloads; the TS version
      // (included via recommended-type-checked) handles them correctly.
      'no-redeclare': 'off',
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
      'apps/web/public/**',
    ],
  },
]
