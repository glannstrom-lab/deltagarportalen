import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/**/*.d.ts',
        'src/main.tsx',
        // Skippade från coverage: rena typ-filer, demo-mappar, generated
        'src/types/**',
        'src/i18n/locales/**',
      ],
      // 2026-05-15 (D5): aktiverade thresholds satta 3-5pp under nuvarande
      // baseline. Skyddar mot regression — coverage får inte sjunka.
      // Baseline (vitest run 2026-05-14): lines 20.09%, functions 34.75%,
      // branches 64.27%. Thresholds nedan höjs gradvis när nya tester läggs till.
      thresholds: {
        lines: 18,
        functions: 30,
        branches: 60,
        statements: 18,
      },
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
