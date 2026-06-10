# Kodkvalitet & TypeScript-skuld (2026-05-14)

## TL;DR

`npx eslint .` i `client/`: **1160 errors + 109 warnings** = 1269 totalt.
- **53 % är `no-unused-vars` (671)** — döda importer/vars, oftast en 5-minutersfix per fil.
- **10 % är `no-explicit-any` (133)** — utspridda men 9 stycken bara i `pages/consultant/AnalyticsTab.tsx`.
- **24 % är `react-hooks/*` (286)** — varav `static-components` (90), `exhaustive-deps` (66), `set-state-in-effect` (59), `purity` (33), `rules-of-hooks` (17). De sista 17 är **riktiga buggar** (conditional hook calls).
- `tsconfig.app.json` har `strict: true` + alla strikta flaggor — så skulden är *bara* lint, inte typsystem-hål.
- **Stora filer:** `services/articleData.ts` (24 880 rader), `data/exercises.ts` (5 072), `pages/ExternalResources.tsx` (3 596). 13 filer >1 000 rader.
- **Zod-validering täcker bara 3 filer** (Login, Register, InviteHandler) av 15 formulär.
- **Tester:** 81 test-filer, 5 disabled (`.skip`), bara 1 service har snapshot. **60 services utan tester** (8 av 68 har).
- **TODO/FIXME:** 11 förekomster i 7 filer — låg skuld där.
- **Tomma catch-blocks:** 5 filer sväljer fel tyst (`pwa/serviceWorker.ts`, `utils/validation.ts`, m.fl.).

---

## TypeScript-skuld (1160 errors → vart ligger de?)

### Topp 6 regler

| # | Regel | Antal | Karaktär |
|---|-------|------:|----------|
| 1 | `@typescript-eslint/no-unused-vars` | 671 | Döda imports/vars. Trivial. |
| 2 | `@typescript-eslint/no-explicit-any` | 133 | Riktig typskuld. |
| 3 | `react-hooks/static-components` | 90 | Mest i `Privacy.tsx` (60) + `AiPolicy.tsx` (16). |
| 4 | `react-refresh/only-export-components` | 77 | DX-warning, ej runtime-bugg. |
| 5 | `react-hooks/exhaustive-deps` | 66 | Riskerar stale closures. |
| 6 | `react-hooks/set-state-in-effect` | 59 | Cascading renders. |

### Hooks-buggar att titta på först (17 `rules-of-hooks`)

**`client/src/pages/SkillsGapAnalysis.tsx:115-149`** — Klassiskt mönster: `if (isFocusMode) return <PageFocusShell .../>` på rad 120, sedan `useState` på rad 133-149. 13 hooks anropas villkorligt. Detta är en riktig bugg som kan krascha vid focus-mode-toggle. Fix: flytta tidigt-return *efter* alla useState.

### Topp 10 filer med `no-explicit-any`

| Antal | Fil |
|------:|-----|
| 9 | `client/src/pages/consultant/AnalyticsTab.tsx` |
| 8 | `client/src/components/widgets/__tests__/anti-shaming.test.tsx` |
| 8 | `client/src/hooks/useAIContext.test.ts` |
| 8 | `client/src/services/offlineStorage.ts` |
| 6 | `client/src/stores/authStore.test.ts` |
| 5 | `client/src/components/applications/ApplicationsAnalytics.tsx` |
| 5 | `client/src/hooks/useServiceWorker.ts` |
| 4 | `client/src/pages/consultant/SettingsTab.tsx` |
| 3 | `client/src/components/applications/ApplicationCard.tsx` |
| 3 | `client/src/components/applications/ApplicationDetailModal.tsx` |

> 30 av 133 ligger i 3 testfiler — fixas billigt genom att skapa korrekta mock-typer.

### Topp 10 filer med `no-unused-vars`

| Antal | Fil |
|------:|-----|
| 14 | `client/src/pages/career/AdaptationTab.tsx` |
| 13 | `client/src/components/Onboarding.tsx` |
| 12 | `client/src/components/career/NetworkingGuide.tsx` |
| 10 | `client/src/pages/personal-brand/VisibilityTab.tsx` |
| 9 | `client/src/components/cv/templates/CVTemplates.tsx` |
| 8 | `client/src/components/consultant/AICoachAssistant.tsx` |
| 8 | `client/src/pages/JobSearch.tsx` |
| 8 | `client/src/pages/career/NetworkTab.tsx` |
| 8 | `client/src/pages/personal-brand/PortfolioTab.tsx` |
| 7 | `client/src/components/dashboard/widgets/DiaryWidget.tsx` |

**Stickprov (`AdaptationTab.tsx`):** Rad 8-13 importerar 35 ikoner från `@/components/ui/icons`, varav `CheckCircle2`, `Download`, `AlertCircle`, `Info`, `Save` aldrig används. Fixning: 1 minut med `npx eslint --fix`. Eslint borde lösa 671 stycken automatiskt.

### Stickprov: svårighetsbedömning

| Fil | Antal | Karaktär | Fixtid |
|-----|------:|----------|--------|
| `pages/Privacy.tsx` (61) | 60 × static-components | `Section`/`ListItem` deklareras **inne i komponenten**. Lyft ut. | ~30 min |
| `utils/security.ts` (21) | 21 × no-useless-escape | Onödiga `\` i regex. Ren auto-fix. | ~5 min |
| `hooks/useMemoized.tsx` (21) | 10 only-export + 5 refs + 3 console | Strukturellt — refs muteras under render. | ~1-2 h |
| `pages/career/AdaptationTab.tsx` (17) | 14 unused imports | Trivial auto-fix. | ~2 min |
| `pages/SkillsGapAnalysis.tsx` (15) | 13 conditional hooks | Riktig bugg, behöver omstrukturering. | ~30 min |
| `pages/consultant/AnalyticsTab.tsx` (13) | 9 × `any` + deps | Behöver typer för Supabase-RPC-responser. | ~2-4 h |

**Slutsats:** ca **800 av 1160 errors** (unused-vars + no-useless-escape + delvis prefer-const) kan lösas av `npx eslint --fix` på minuter. Resterande ~360 behöver mänsklig insats.

---

## Stora filer

### Topp 15 (rader)

| Rader | Fil | Typ |
|------:|-----|-----|
| 24 880 | `client/src/services/articleData.ts` | Hårdkodade KB-artiklar |
| 5 072 | `client/src/data/exercises.ts` | Hårdkodade övningar |
| 3 596 | `client/src/pages/ExternalResources.tsx` | Sida |
| 3 316 | `client/src/services/interestGuideData.ts` | Intresseguide-data |
| 2 810 | `client/src/services/cloudStorage.ts` | Supabase-wrapper |
| 2 046 | `client/src/pages/sta/StaConsultant.tsx` | Sida |
| 1 909 | `client/src/components/cv/templates/CVTemplates.tsx` | CV-mallar |
| 1 891 | `client/src/components/jobs/MatchesTab.tsx` | Komponent |
| 1 719 | `client/src/pages/sta/StaParticipant.tsx` | Sida |
| 1 619 | `client/src/services/pdfExportService.ts` | PDF-export |
| 1 383 | `client/src/services/careerApi.ts` | API-wrapper |
| 1 357 | `client/src/pages/Resources.tsx` | Sida |
| 1 297 | `client/src/pages/CVBuilder.tsx` | Sida |
| 1 283 | `client/src/components/career/NetworkingGuide.tsx` | Komponent |
| 1 164 | `client/src/pages/career/AdaptationTab.tsx` | Sida |

> CLAUDE.md säger "extrahera komponenter över 150 rader" — **vi har 50+ filer som överskrider 1 000 rader.**

### Datafiler som bör flyttas till DB

| Fil | Rader | Konsumenter | Bedömning |
|-----|------:|-------------|-----------|
| `services/articleData.ts` | 24 880 | `services/contentApi.ts`, `services/learningService.ts` | **JA — kritiskt.** Babel deoptimerar styling, det är troligen 80 % av bundle-tiden i dev. KB-artiklar är CMS-data, hör hemma i Supabase. **Hög ROI.** |
| `data/exercises.ts` | 5 072 | `pages/Exercises.tsx`, `pages/PrintableResources.tsx` | **JA på sikt.** Konsulenter borde kunna lägga till övningar utan deploy. Medel ROI — kräver admin-UI. |
| `data/coaches.ts` | 916 | `components/Layout.tsx` | **NEJ.** Strukturell konfig kopplad till sidlogik (PAGE_COACH_CONTENT mappas mot pageKey). Behåll i kod. |
| `data/helpContent.ts` | 780 | Liknande mönster | **Tveksamt.** Hjälptexter är innehåll men låsta till sid-IDs. Lägre prio. |
| `services/interestGuideData.ts` | 3 316 | Intresseguide-flödet | Strukturell konfig (RIASEC-mappningar). Behåll. |

**Direkt vinst om `articleData.ts` flyttas:** Babel-warningen försvinner, dev-rebuild förmodligen 2-3 s snabbare. Bundle-storleken minskar tydligt.

---

## Felhantering

### Tomma catch-blocks (5 filer)

```
client/src/pwa/serviceWorker.ts
client/src/utils/validation.ts
client/src/components/ai/AIResultCard.tsx
client/src/components/ai/CompanyAnalysisPanel.tsx
client/src/components/ai/AiConsentGate.tsx
```

Genomgång krävs — särskilt `validation.ts` får inte svälja parsefel.

### Generell felhantering

- **181 filer** har `console.error` — generell error-logging, OK.
- **63 filer** har `throw new Error` — explicit throwing finns.
- **38 `no-console`-warnings** — `console.log` i 38 filer. `vite.config.ts` strippar `console.log` i prod (men inte `console.error`/`warn`), så det är inte säkerhetsproblem men brus.
- Sentry är inkluderat (per CLAUDE.md), men inga `Sentry.captureException` syns i stickproven — fel sväljs eller bara loggas, rapporteras inte centralt.

### Input-validering

**Endast 3 filer** importerar från `@/lib/validations`:
- `pages/Login.tsx`
- `pages/Register.tsx`
- `components/auth/InviteHandler.tsx`

`lib/validations/index.ts` exporterar scheman för **profile, cv (workExperience, education, skill), coverLetter, jobSearch** — **men dessa används inte i UI**. CVBuilder, ProfileEditor, CoverLetterWrite skickar i.e. rådata utan Zod-validering. Bara 8 filer totalt använder Zod.

**Risk:** Användarinput sparas till Supabase utan validering på klient (RLS finns men ingen format-kontroll). Server-side görs det i edge functions men inkonsekvent.

### TODO/FIXME/HACK

**11 förekomster i 7 filer** — låg skuld:

```
articleData.ts                          4
BulkActionsDialog.tsx                   2
ApplicationsContacts.tsx                1
KnowledgeBaseWidget.tsx                 1
PrintResourcesWidget.tsx                1
SalaryWidget.tsx                        1
recommendationService.ts                1
```

---

## Test-skuld

### Stats

- **81 test-filer totalt** (`*.test.ts/tsx`).
- **5 `.skip`-tester** disabled — i `widgets/SalaryWidget.test.tsx` (3), `widgets/InternationalWidget.test.tsx` (1), `pages/Dashboard.test.tsx` (2). Skip-orsak dokumenterad ("Phase 3", "DB-PERFORMANCE.md").
- **Endast 1 fil** med snapshot-test (`components/dashboard/DashboardSkeleton.test.tsx`) — bra, inte snapshot-tung kodbas.
- **Inga `xdescribe`/`xit`** hittade.

### Services utan tester (60 av 68)

Bara 8 services har test: `accountApi`, `aiApi`, `cacheService`, `cvMatcher`, `interviewService`, `personalBrandAuditsApi`, `platsbankenApi`, `supabaseApi`.

**Kritiska services som saknar tester:**

| Service | Rader | Kritikalitet |
|---------|------:|--------------|
| `cloudStorage.ts` | 2 810 | **Hög** — central Supabase-wrapper |
| `pdfExportService.ts` | 1 619 | **Hög** — CV-export, brytpunkt för användare |
| `careerApi.ts` | 1 383 | **Hög** — flera tabbar konsumerar |
| `journeyService.ts` | 1 114 | Medel |
| `profileEnhancementsApi.ts` | 975 | Medel |
| `coverLetterApi.ts`, `cvApi.ts`, `applicationsApi.ts`, `arbetsformedlingenApi.ts`, `bolagsverketApi.ts` | <1000 | Medel-hög (extern integration) |

### Test-täckning

Inga coverage-siffror i denna körning, men ratio service-tester (8/68 = **12 %**) är låg. Hooks-tester finns (egen körning av `useAIContext.test.ts` ger 8 `any`-errors — testerna är typsvaga).

---

## Konfig

### `tsconfig.app.json` — bra

```json
"strict": true,
"noImplicitAny": true,
"strictNullChecks": true,
"strictFunctionTypes": true,
"strictPropertyInitialization": true,
"noUnusedLocals": true,
"noUnusedParameters": true,
"erasableSyntaxOnly": true,
"noFallthroughCasesInSwitch": true
```

Allt strikt påslaget. `tsc --noEmit` borde göra det omöjligt att introducera ny `any`-skuld utan eslint-disable. Att `no-explicit-any` är 133 stycken betyder att de är *medvetna* (typade ut som any).

### `vite.config.ts` — inget misstänkt

- Manual chunks ok.
- `drop_console: false` (behåller i prod) **MEN** `pure_funcs: ['console.log', ...]` tar bort log/info/debug/trace. `console.error` och `console.warn` behålls — rimligt.
- `sourcemap: mode !== 'production'` — sourcemaps i staging men inte i prod. OK för Sentry om Sentry uploadar separat.
- Babel deoptimerar `articleData.ts` (>500 KB) — varje dev-rebuild lider av detta.

### `eslint.config.js` — välsmött

- `js.configs.recommended` + `tseslint.configs.recommended` + `reactHooks.configs.flat.recommended` + `reactRefresh.configs.vite` aktiverade.
- Design-systemreglerna är `error` (no-restricted-syntax för gradients och hub-tokens).
- `no-console: ['warn', { allow: ['error', 'warn'] }]` — bra.
- **Inga `'off'`-regler.** Konfigen är inte uppluckrad — alla 1160 errors är från default-rules.

---

## Rekommendationer (prioriterad tabell)

| Prio | Insats | Tid | Vinst |
|-----:|--------|-----|-------|
| **P0** | Fixa `rules-of-hooks` i `SkillsGapAnalysis.tsx` (rad 115-149) — flytta `useState` före `if (isFocusMode) return`. | 30 min | Riktig bugg, kan krascha sidan vid focus-mode-toggle. |
| **P0** | Granska 5 tomma catch-blocks (`pwa/serviceWorker.ts`, `utils/validation.ts`, 3 ai/-komponenter). | 1 h | Sväljer fel som borde rapporteras till Sentry. |
| **P1** | Kör `npx eslint . --fix` och granska diff. Förväntat: ~800 errors borta (unused-vars, no-useless-escape, prefer-const). Commit per modul för att hålla diff läsbar. | 2-3 h | 1160 → ~360 errors. ESLint blir användbar i CI. |
| **P1** | Flytta `services/articleData.ts` (24 880 rader) till Supabase-tabell `kb_articles`. Skapa migration + API i `contentApi.ts`. | 1-2 dagar | Babel-deopt-warning försvinner. Snabbare dev-rebuild. KB blir CMS-baserad. |
| **P1** | Skriv tester för `cloudStorage.ts`, `pdfExportService.ts`, `careerApi.ts` (Top 3 services utan test). | 2-3 dagar | Skydd för kritisk Supabase-integration + CV-export. |
| **P2** | Refaktorera 9 `any` i `pages/consultant/AnalyticsTab.tsx` — typa Supabase-RPC-responser. | 4 h | Typer för konsultanalyser. |
| **P2** | Lyft ut `Section`/`ListItem` ur `Privacy.tsx` och `AiPolicy.tsx` till egna komponenter. | 1 h | 76 errors borta (60+16). |
| **P2** | Bredda Zod-validering till `CVBuilder`, `ProfileEditor`, `CoverLetterWrite` (idag används bara i auth-flöden). | 1-2 dagar | Konsistent input-validering. |
| **P2** | Bryt upp filer >1 500 rader: `pages/ExternalResources.tsx` (3 596), `pages/sta/StaConsultant.tsx` (2 046), `components/cv/templates/CVTemplates.tsx` (1 909), `components/jobs/MatchesTab.tsx` (1 891). | 3-5 dagar | Läsbarhet, lazy-loadning, mindre bundle-chunks. |
| **P3** | Adressera 66 `exhaustive-deps` — risk för stale closures, men de flesta är benign. Granska per fall. | 1 dag | Eliminerar subtila buggar. |
| **P3** | Flytta `data/exercises.ts` (5 072 rader) till Supabase när konsult-admin-UI byggs. | Senare | CMS-baserade övningar. |
| **P3** | Lägg till Sentry-rapportering i centrala catch-block (services/) — inte bara `console.error`. | 4 h | Felsynlighet i produktion. |

### Quick-win-paket (1 dag)

1. `npx eslint . --fix` (~800 fixar)
2. Fix `SkillsGapAnalysis.tsx` rules-of-hooks
3. Granska 5 tomma catches
4. Lyft `Section` ur Privacy/AiPolicy

→ **1160 → ~300 errors på en arbetsdag.** Resterande blir hanterbara att städa per modul.
