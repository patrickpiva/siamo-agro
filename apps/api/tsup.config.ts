import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    worker: 'src/worker.ts',
  },
  format: ['cjs'],
  target: 'node22',
  outDir: 'dist',
  clean: true,
  bundle: true,
  // Inline all @siamo/* workspace packages so Node.js never tries to
  // import their .ts source files at runtime.
  noExternal: [/^@agraia\//],
  // Keep packages with native binaries external.
  external: ['@prisma/client', '@prisma/engines', 'bullmq', 'ioredis'],
})
