# E2E-tester och verifieringsverktyg

Uppdaterad 2026-07-10 (ROADMAP C6). Katalogen kurerad: 82 ad-hoc-skript
flyttade till `archive/` — det som ligger i roten är kanoniskt.

## Spec-filer (Playwright Test — körs med `npx playwright test`)

| Fil | Täcker |
|-----|--------|
| `smoke.spec.ts` | Grundläggande sidladdning — **körs i CI på varje PR/push** (inga credentials krävs) |
| `auth.spec.ts` | Login/registrering |
| `cv.spec.ts` | CV-flödet |
| `cover-letter.spec.ts` | Personligt brev |
| `job-search.spec.ts` | Jobbsökning |
| `dashboard.spec.ts` | Översikt |
| `axe-a11y.spec.ts` | Automatisk a11y-svep (axe-core) |
| `regression-fas-a.spec.ts` | Regressionsskydd tech-debt fas A |

**CI-status för authenticated-testerna:** väntar på GitHub Secrets
(`TEST_USER_EMAIL`/`TEST_USER_PASSWORD`) — ROADMAP D1. Testkontot finns
redan i `.env.test.local` (gitignorerad) och fungerar mot prod (jobin.se).
När secrets är satta: aktivera workflow-steget i `.github/workflows/`.

## Kanoniska verktygsskript (körs med `node e2e/<fil>`)

| Skript | Användning |
|--------|-----------|
| `screenshot.cjs` | `node e2e/screenshot.cjs /<route> [WxH]` — loggar in (cachar session i `.auth/state.json`), tar skärmdump. `BASE_URL=https://www.jobin.se` för prod |
| `cv-pdf-visual-audit.cjs` | PDF+PNG per CV-mall/variant → `cv-prints/visual-audit/` (kräver dev-server på :3000). Kanoniskt verifieringsverktyg för CV-PDF (se CLAUDE.md) |
| `axe-contrast.cjs` | Kontrastkontroll (WCAG) |
| `spontan-verify.cjs` | Full browserverifiering av Spontanansökan mot prod (24 kontroller, självstädande) |
| `spontan-verify-p7.cjs` | Fokuserad kontroll: uppföljningspill på Jobb-hubbens Spontanansökan-kort |
| `art50-verify.cjs` | AI Act Art 50: synlig märkning + data-ai-generated på AI-output (LinkedIn-optimeraren) |
| `spar-b-verify.cjs` | Spår B-regression: riktig AI på /career/adaptation, konsulentens deltagarlista, borttagen LinkedIn-teaser |

Verktygsskripten läser `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` (och för
konsulentflöden `E2E_CONS_EMAIL`/`E2E_CONS_PASSWORD`) från `.env.test.local`
i projektroten. Sessioner cachas i `e2e/.auth/*.json` (gitignorerat).

## Mönster: verifiera datadrivna vyer

Testkontot är ofta tomt. Antingen skapa riktig data via UI:t och städa
efteråt (som `spontan-verify.cjs` gör), eller intercepta Supabase REST med
Playwright-routes (route-interception av `**/rest/v1/...`).

## `archive/`

82 historiska ad-hoc-skript (apr–jul 2026): engångsfelsökningar,
skärmdumpsserier, granskningsskript. Behållna för referens — förvänta dig
inte att de kör oförändrade (selektorer/flöden har ändrats).
