# FLAG — Deferred till manuell granskning

**Datum:** 2026-05-15
**Av:** Tech-debt-roadmap-autonomous-loop

Saker jag identifierade som värdefulla men inte autonomt implementerade. Inte BLOCK (det finns inget tekniskt hinder) — bara saker som kräver beslut, design-arbete eller risk för installations-konflikter.

## D6 — Husky + lint-staged pre-commit

**Varför FLAGGED:** Installation kräver `npm install` + postinstall-script + ev. `.husky/`-katalog. Risk för package.json-konflikter med befintliga workflows. CI fångar redan samma fel innan merge.

**Att göra (om önskat):**
```bash
cd client
npm install -D husky lint-staged
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

I `client/package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": "eslint --fix"
  }
}
```

**Värde:** Lokal feedback ~1 sekund snabbare än att vänta på CI.

---

## C1 — Full prompt-konsolidering till `_prompts.js`

**Varför FLAGGED:** Kräver design-beslut om hur stream/non-stream-varianter ska representeras (två fält per funktion eller separata exports?). Stream- och non-stream-varianter har MEDVETET olika output-format (text vs JSON).

**Att göra (om önskat):**
1. Skapa `client/api/_prompts.js` som exporterar PROMPTS-objekt
2. Båda ai.js + ai-stream.js importerar från det
3. Stream-varianter får eget fält: `{ prompt: ..., stream: { prompt: ..., maxTokens: ... } }`
4. Snapshot-tester för att skydda mot drift

**Värde:** Eliminera duplikation av 18 prompt-templates. Singel source of truth.

**Status nu:** Tillagt kommentar i ai-stream.js som förklarar varför divergensen finns. Räcker som tillfälligt skydd.

---

## Onboarding-konsolidering (DESIGN.md §12)

**Varför FLAGGED:** Kräver UX-arbete (gemensam visuell mall, state-management per feature). Inte bara kod-refaktor.

**Att göra (om önskat):**
1. UX bestämmer en visuell mall för alla onboarding-flow
2. Migrera CVOnboarding, profile/OnboardingModal, ai-team/OnboardingModal till varianter av en gemensam komponent
3. Implementera `onboarding_completed`-flagga per feature i DB

**Värde:** Konsekvent UX för deltagare. Minska maintenance-cost.

**Status nu:** Dokumenterat i `docs/onboarding-patterns.md`. 2 dödkods-varianter raderade.

---

## E1 — articleData.ts (24 880 rader) → Supabase

**Varför FLAGGED:** Bredbandsmigration. Kräver:
1. Skapa `kb_articles`-tabell + RLS
2. Skriv seed-script som importerar nuvarande data
3. Uppdatera `contentApi.ts` att läsa från DB med React Query-cache
4. Behåll lazy `import('./articleData')` som fallback i 1 sprint
5. Köra seed-script EN gång på prod (irreversibel om backup saknas)

Risk för data-förlust om seed-script har bugg. Ska göras dagtid med backup-verifiering.

**Värde:** Bundle -1.5 MB, Babel-deopt borta, KB blir CMS-baserad.

---

## D2 — Alla 4 service-tester på en gång

**Varför DELVIS GJORD:** D2 listar 4 services (userApi, profileEnhancementsApi, careerApi, pdfExportService). Att skriva 60% radcoverage för alla 4 i samma session är 3-5 dagars arbete i blockerings-säker takt. Riskerar för bug-introduktion under autonomous loop.

**Status:** D2 är pending. Föreslår att börja med 1-2 service per session med ordentlig review mellan.

---

## E3, E4, E5 — Bryt upp god-objects (cloudStorage, careerApi, pdfExportService)

**Varför FLAGGED:** Mass-edits på 5000+ rader kod med många callers per
namespace. Risk för silent regression utan testtäckning. cloudStorage.ts
har 21 namespaces, careerApi 13, pdfExportService 4. Varje namespace-
extraktion kräver:
1. Skapa ny fil i `services/storage/<domain>Api.ts`
2. Migrera kod + behåll re-export i original under övergångsperiod
3. Migrera callers (15-50 per namespace)
4. Verifiera build + e2e

Estimerad tid: 1 vecka för alla tre. Föreslår dedikerad sprint med
tester först (D2 utökad till alla 4 services).

## E6 — Radera services/api.ts shim

**Varför FLAGGED:** 14 callers använder `@/services/api`-shimmen istället
för domän-direktimport. Migration är mekanisk men kräver verifiering att
varje caller fortfarande får rätt typ + funktion. Tree-shaking-vinsten
är liten (re-exports raderas av Rollup ändå om alla callers migrerar).

Kombinera med E3-E5-sprinten för bästa flow.

## A1 — Manuell ESLint-rensning

**Status:** Delvis. ~129 errors borta (1147 → 1019). Återstående 1019 är mest no-unused-vars i komponentfiler. Multi-dag-uppgift som du valde att göra "manuellt över flera dagar" i Fas A.

**Att göra:** Fortsätt fil-för-fil i prioriterad ordning (top no-unused-vars-filer först).

---

*Allt annat i Fas A-F som inte är BLOCKED eller här FLAGGED är genomfört.*
