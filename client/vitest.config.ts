import { defineConfig, coverageConfigDefaults } from 'vitest/config'
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
      // D13 (2026-08-05): `exclude` ERSÄTTER vitests defaults — den gör inte
      // tillägg. Den gamla listan saknade därför `dist/**`, testfilerna själva
      // och konfigfilerna, vilket lät byggartefakter räknas som otestad
      // källkod (238 filer i `client/dist/assets` lokalt; i CI finns ingen
      // dist eftersom den är gitignorerad, så siffrorna skiljde sig mellan
      // lokalt och CI). Spread:a alltid `coverageConfigDefaults.exclude` när
      // du lägger till något här.
      exclude: [
        ...coverageConfigDefaults.exclude,
        // Projektspecifikt: inte källkod som den här sviten kan testa.
        'src/test/**',
        'src/main.tsx',
        // Rena typ-filer och genererade/statiska resurser
        'src/types/**',
        'src/i18n/locales/**',
        // Byggkonfiguration som defaults-listan inte känner till vid namn
        'tailwind.config.{js,cjs,ts}',
        'postcss.config.{js,cjs,ts}',
        // `public/` serveras statiskt och importeras aldrig av bundlern
        'public/**',
      ],
      // 2026-05-15 (D5): aktiverade thresholds satta 3-5pp under dåvarande
      // baseline. Skyddar mot regression — coverage får inte sjunka.
      //
      // D13 (2026-08-05): CI hade varit rött på `functions` (29,54 % mot 30).
      // Tröskeln är INTE sänkt — skulden är betald med 109 nyligen täckta
      // funktioner i lib/, stores/, utils/ och contexts/ (nya tester för
      // debounce, toast, logger, sanitize, onboardingCoordinator,
      // spontaneousFocusDraft, aiTeamStore, settingsStore, profileStore,
      // ThemeContext). Mätt läge efter: statements 22,90 %, branches 64,01 %,
      // functions 34,76 %, lines 22,90 %.
      // Höj aldrig ett tak för att bli grön — och sänk aldrig en tröskel.
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
