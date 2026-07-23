# Services Reference

Snabb-referens för de viktigaste service-modulerna i `client/src/services/`.
Detta är klient-sidans wrappers som komponenter ska anropa — undvik att
gå direkt mot `supabase.from(...)` från komponenter när det finns en wrapper.

---

## `aiApi.ts` — central client för alla AI-anrop

Skickar autentiserade requests till `/api/ai` (Vercel serverless).
Token läggs till automatiskt från Supabase-sessionen.

### `callAI<T>(functionName, data): Promise<AIApiResponse<T>>`

Generisk anrop. Kastar `Error` med svenska meddelanden:
- 401 → "Din session har gått ut. Vänligen logga in igen."
- 429 → "För många förfrågningar. Försök igen om en stund."
- annat → "Ett fel uppstod vid kommunikation med AI-tjänsten."
- ingen session → "Du måste vara inloggad för att använda AI-funktioner."

### Convenience-funktioner

```ts
generateCoverLetter({ companyName, jobTitle, jobbAnnons, ton, ... })  // → 'personligt-brev'
chatWithAI({ meddelande, historik, ... })                              // → 'chatbot'
generateProfileSummary({ name, experience, skills, ... })              // → 'profile-summary'
generateDoaSummary({ firstName, categories })                          // → 'sta-doa-sammanfattning'
```

Varje wrappar `callAI(<funktionsnamn>, data)`. Funktionsnamn matchar
`PROMPTS`-objektet i `client/api/ai.js` (16 funktioner efter C12 — se
`docs/AI_ARCHITECTURE_OVERVIEW.md`). Övriga PROMPTS-funktioner (t.ex.
`karriarplan`, `kompetensgap`, `intervju-simulator`, `sta-document-draft`)
anropas direkt via `callAI(...)` från respektive sida/komponent utan en
namngiven wrapper här.

**C12 (2026-07-23):** åtta tidigare convenience-wrappers (`optimizeCV`,
`generateCVText`, `prepareInterview`, `getJobTips`,
`prepareSalaryNegotiation`, `createCareerPlan` m.fl.) togs bort tillsammans
med sina motsvarande, då orphanade, `ai.js`-funktioner (0 anropare). Går att
återskapa från git-historiken om ett framtida behov uppstår.

**Tester:** `aiApi.test.ts` (auth, error mapping, generateCoverLetter),
`aiSchemas.test.ts` (Zod-scheman för strukturerade AI-svar — se
`aiSchemas.ts`, dokumenterad i AI_ARCHITECTURE_OVERVIEW.md).

---

## `accountApi.ts` — GDPR-radering (Art. 17)

Wrapper kring Supabase RPC + delete-account edge function.
Ska användas av `DeleteAccountSection.tsx` (refactor pågår).

### `requestDeletion(reason?): Promise<DeletionRequestResult>`
Begär radering med 14 dagars grace period. Returnerar `scheduled_at` + `grace_period_days`.

### `cancelDeletion(): Promise<{ success: boolean }>`
Avbryt en pågående grace-period-radering.

### `executeImmediateDeletion(): Promise<ImmediateDeletionResult>`
Två-stegs: RPC raderar profile-data, edge function raderar `auth.users`.
Edge function-fel är **icke-fatalt** — profile är redan borta, vi flaggar
`authDeleted: false` och returnerar success. Auth-cleanup kan göras manuellt.

**Tester:** `accountApi.test.ts` (11 tester — alla error-vägar)

---

## `cvOptimizer.ts` — CV ↔ jobb matchning (deterministisk, ingen AI)

> **Rättelse (2026-07-23):** tidigare version av detta dokument beskrev en
> `cvMatcher.ts` med `analyzeMatch()` — den filen finns inte och har aldrig
> funnits i repot. Nedan beskriver den verkliga modulen.

Nyckelords-baserad matchning mellan ett CV och en jobbannons. Inga AI-anrop.

### `analyzeCVForJob(cv, job): CVOptimizationResult`
### `calculateQuickMatchScore(...)`

Returnerar (`CVOptimizationResult`):
```ts
{
  matchScore: number
  totalKeywords: number
  matchedKeywords: number
  missingKeywords: KeywordMatch[]
  suggestions: CVSuggestion[]
  sectionScores: { skills, experience, summary, education }
}
```

Relaterad, separat modul: `jobMatching.ts` innehåller fristående
matchnings-hjälpare (`matchSkill`, `matchJobTitle`, `matchesEmploymentType`,
`matchesRemoteWork`, `matchesDriversLicense`, `applyProfileBoosts`) som
används av `MatchesTab.tsx`/`MatchCard.tsx` för att ranka
Platsbanken-jobb mot användarens profil — detta är **inte** samma modul som
CV-optimeringen ovan, och det finns ingen `jobMatchingService.ts`-wrapper
runt den (den filen finns inte heller).

---

## `cloudStorage.ts` — Supabase data-wrappers

Stor fil (~2800 rader) med många små API-objekt per data-domän.
Centralisera all `supabase.from(...)`-användning här.

Alla funktioner följer samma mönster:
1. Hämta current user via `getCurrentUser()`
2. Om ingen user → fall tillbaka till localStorage (för anonyma flöden)
3. Försök Supabase-anrop
4. Vid fel: `handleStorageError()` (RLS-fel = tyst debug, övriga = error)
5. Fallback till localStorage vid fel

### Viktiga API-objekt

| Objekt | Tabell | Anteckningar |
|--------|--------|--------------|
| `articleBookmarksApi` | `article_bookmarks` | Anonym fallback för ej-inloggade |
| `savedJobsApi` | `saved_jobs` | För Arbetsförmedlingen-jobb |
| `platsbankenApi` | `platsbanken_saved_jobs` + `platsbanken_saved_searches` | UNIQUE-constraint, upsert med onConflict |
| `darkModeApi` | `user_preferences.dark_mode` | |
| `notificationPrefsApi` | `user_preferences` | |
| `jobApplicationsApi` | `job_applications` | |
| `interviewSessionsApi` | `interview_sessions` | |
| `draftsApi` | `user_drafts` | Generisk draft-storage |
| `moodApi` | `mood_logs` | |
| `userPreferencesApi` | `user_preferences` | Konsoliderad preferences-API |

### `platsbankenApi` (uppdaterad 2026-04-28)

- `getSavedJobs()` — auto-migrerar localStorage → cloud vid första anrop
- `saveJob(job)` — använder `upsert(... onConflict: 'user_id,job_id')` för
  att undvika dubbel-spara-krasch
- `removeSavedJob(jobId)` — synkar localStorage även vid lyckad cloud-radering
- `isSaved(jobId)` — defense-in-depth `eq('user_id', user.id)` utöver RLS
- Loggning: `storageLogger.warn` vid fallback till localStorage (tidigare
  tysta debug-fel som dolde dataförlust-risker)

---

## Andra services som är värda att känna till

| Service | Syfte |
|---------|-------|
| `arbetsformedlingenApi.ts` | AF Platsbanken-integration (sök, taxonomy, trends, occupations) |
| `bolagsverketApi.ts` | Företagsdata-uppslag |
| `careerApi.ts` | Karriärplaner, milstolpar, favoritocupations |
| `applicationsApi.ts` | Job applications CRUD |
| `consultantService.ts` | Konsulent-vyn (några TODO:s kvar — månadsstats hårdkodade) |
| `pdfExportService.ts` | CV + cover letter PDF (jsPDF + html2canvas + @react-pdf) |
| `pdfLazyLoad.ts` | Dynamic imports av PDF-libs (jsPDF, html2canvas) |
| `cacheService.ts` | In-memory caching med TTL |
| `jobMatching.ts` | Skill/titel/anställningstyp/körkort-matchning + profilboost för Platsbanken-jobb (se `cvOptimizer.ts`-avsnittet ovan) |
| `cvOptimizer.ts` | CV↔jobbannons-matchning, keyword-gap, förbättringsförslag (se ovan) |
| `notificationsService.ts` | Notif-CRUD + smart-batching |

---

## Konventioner

1. **Returnera promises eller throw — välj en.** Använd `throw` för fel,
   `return` för success. Inte `{ success, error }`-objekt om det inte krävs
   av extern API.
2. **Sanera input innan AI-anrop.** All data som går till `/api/ai` saneras
   automatiskt av `sanitizeAll()` i `client/api/ai.js` — wrappers behöver
   inte göra det själva.
3. **Logga via `storageLogger`/`apiLogger`/`authLogger`** från `lib/logger.ts`
   istället för direkt `console.log`. Loggers respekterar prod/dev-läge och
   skickar warn/error till Sentry (om initierat).
4. **Lägg till tester när du rör en service.** Mönster i `aiApi.test.ts`,
   `accountApi.test.ts`, `careerApi.test.ts`. Mocka Supabase, testa
   error-vägar, testa edge cases.

---

*Senast uppdaterad: 2026-07-23 (C15 — dokumentsvep: rättat fiktiva `cvMatcher.ts`/`jobMatchingService.ts`, aktualiserat aiApi.ts-wrapperlistan efter C12)*
