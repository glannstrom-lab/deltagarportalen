# Deltagarportalen — client

React/TypeScript-frontend för Deltagarportalen (live på **jobin.se**), en
jobbsökarportal med AI-drivna verktyg för arbetssökande och arbetskonsulenter.

Detta är Vercel-projektets `rootDirectory`. Vercel serverless-funktioner ligger
i `api/` (t.ex. `api/ai.js`, `api/cv-pdf.js`).

För projektöversikt, teknikstack, arkitektur och kodstandard — se
**`../CLAUDE.md`** (repo-roten) och **`../docs/ROADMAP.md`**.

## Kommandon

```bash
npm run dev            # Utvecklingsserver (Vite)
npm run build           # Produktionsbygge
npm run test            # Vitest, watch mode
npm run test:run        # Vitest, single run
npm run test:coverage   # Vitest med coverage
npm run typecheck           # Fullständig typecheck (tsc --noEmit -p tsconfig.app.json)
npm run typecheck:critical  # Snabbare delmängd — se docs/claude-code-guide.md (plain `tsc --noEmit` utan -p är no-op här)
```

E2E-tester (Playwright) körs från repo-roten, inte härifrån: `npx playwright test`.

## Struktur (urval)

```
api/              # Vercel serverless functions (ai.js, cv-pdf.js, ...)
src/
  components/     # ui/, dashboard/, layout/, ai-team/, ...
  pages/          # ~120 sidfiler
  stores/         # Zustand
  services/       # API-klienter (aiApi.ts m.fl.)
  hooks/          # Custom hooks
  lib/            # supabase, sentry, validators, piiSanitizer, ...
```

Teknikstack: React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, Zustand 5,
React Query 5, Supabase 2.97, i18next 25.
