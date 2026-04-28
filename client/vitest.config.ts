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
      // Inga thresholds aktiva än — vi har 20 pre-existing testfel i
      // Dashboard.test.tsx + andra som måste fixas innan thresholds kan
      // sättas meningsfullt. CI rapporterar coverage som artifact +
      // PR-kommentar så trender är synliga, men blockerar inte än.
      //
      // PLAN för aktivering:
      //   1. Fixa de 20 failing testerna (Dashboard.test.tsx m.fl.)
      //   2. Mät baseline coverage (förmodligen 20-25% efter Fas 2)
      //   3. Sätt thresholds 5% under baseline → höj 1-2% per sprint
      //   4. Använd thresholdAutoUpdate: true för automatisk drift
      // thresholds: { lines: 20, functions: 20, branches: 15, statements: 20 },
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
