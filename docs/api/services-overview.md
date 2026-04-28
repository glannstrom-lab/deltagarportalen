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
generateCoverLetter({ companyName, jobTitle, jobbAnnons, ton, ... })
optimizeCV({ cvText, ... })
generateCVText({ yrke, erfarenhet, ... })
prepareInterview({ jobbTitel, foretag, ... })
getJobTips({ intressen, ... })
prepareSalaryNegotiation({ roll, erfarenhetAr, ... })
createCareerPlan({ currentOccupation, targetOccupation, ... })
chatWithAI({ message, ... })
generateProfileSummary({ ... })
```

Varje wrappar `callAI(<funktionsnamn>, data)`. Funktionsnamn matchar
PROMPTS-objektet i `client/api/ai.js`.

**Tester:** `aiApi.test.ts` (6 tester — auth, error mapping, generateCoverLetter)

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

## `cvMatcher.ts` — CV ↔ jobb matchning

Deterministisk matchnings-algoritm som producerar relevans-score för
CV mot en jobbannons. Inga AI-anrop.

### `cvMatcher.analyzeMatch(cv: CVData, job: JobAd): MatchResult`

Returnerar:
```ts
{
  score: number              // 0-100
  matchedSkills: string[]    // max 10
  missingSkills: string[]    // max 10
  recommendations: string[]  // genererade tips
  overallAssessment: string  // mänsklig bedömning
}
```

Algoritm: extraherar nyckelord från CV (skills + experience-beskrivningar +
education + languages) och från job (headline + description + must_have +
occupation), matchar exakt + partiellt + via synonymer (`getRelatedTerms`),
beräknar `matched / totalRequirements * 100`.

Synonym-tabellen i `getRelatedTerms` hanterar t.ex. js↔javascript, agil↔scrum,
sql↔databas. Begränsad — utöka när behov uppstår.

**Tester:** `cvMatcher.test.ts` (8 tester — score-grader, synonymer,
experience-extraktion, edge cases)

---

## `cloudStorage.ts` — Supabase data-wrappers

Stor fil (~1500 rader) med många små API-objekt per data-domän.
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
| `jobMatchingService.ts` | Wrapper runt cvMatcher för UI-komponenter |
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
   `accountApi.test.ts`, `cvMatcher.test.ts`. Mocka Supabase, testa
   error-vägar, testa edge cases.

---

*Senast uppdaterad: 2026-04-28*
