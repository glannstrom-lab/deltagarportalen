import { defineConfig, coverageConfigDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // D17 (2026-08-09): CI hade aldrig varit grön på main — 687 körningar,
    // noll lyckade. Sju testfiler kraschade vid IMPORT med
    // `Error: supabaseUrl is required`, eftersom `src/lib/supabase.ts:15`
    // anropar `createClient(url || '', key || '')` och supabase-js kastar på
    // tom sträng. `test`-jobbet i ci.yml får bara `CI: true`; Supabase-env
    // sätts enbart i build- och e2e-jobben.
    //
    // Felet var strukturellt osynligt lokalt: `client/.env` är gitignorerad,
    // så varje utvecklarmaskin hade värdena och ingen lokal grind kunde
    // reproducera kraschen. Samma sak i en färsk klon.
    //
    // Fixen sitter här i stället för i workflowen med flit: en enhetssvit ska
    // aldrig behöva riktiga credentials eller nå ett riktigt backend. Värdena
    // nedan är avsiktligt icke-funktionella. Tester som behöver ett specifikt
    // värde stubbar det själva (`vi.stubEnv`), vilket tar över i runtime.
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key-not-a-real-credential',
    },
    // BL3 (2026-08-21): sviten gav olika svar på samma rena träd.
    //
    // Uppmätt: tre körningar av oförändrad kod gav 2 086/2 086 grönt, sedan
    // fyra timeouts (`nav-smoke`, `aiHandlerResponse`, `aiServerConsentGate`),
    // sedan grönt igen — och under `test:coverage`, där v8-instrumenteringen
    // lägger på overhead, föll `register-flow` på vitests default 5 000 ms.
    // Isolerat kör samma fil sina åtta tester grönt, men två av dem tar
    // 1,7–1,8 s var. Marginalen till 5 s äts upp av parallella filer plus
    // coverage.
    //
    // Det är alltså ingen logikbugg utan för snäva marginaler i tunga
    // jsdom-integrationstester. Höjt till 20 s: samma tal som `nav-smoke`
    // redan satte lokalt, och tillräckligt för CI:s delade runners.
    //
    // Varför det spelar roll: en grind som failar slumpvis lär man sig att
    // köra om i stället för att läsa. Då är den värdelös den dagen den har
    // rätt. Höjningen gör inte något test svagare — ett test som verkligen
    // hänger sig failar fortfarande, bara 15 sekunder senare.
    testTimeout: 20_000,
    hookTimeout: 20_000,
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
