# Teknisk skuld – Fullstack-perspektiv (2026-05-09)

Granskat av: fullstack-utvecklare (React 19 / TypeScript 5.9 / Supabase / Zustand / React Query)
Omfattning: `client/src/` (570 .tsx + 167 .ts, totalt ~159k rader)

---

## Sammanfattning

1. **Dominant manuell state-pattern**: 1 845 `useState`-anrop och 576 `useEffect` mot endast **28 filer** som använder React Query och **63** som använder `memo`. Server-state hämtas i de flesta sidor via `useEffect → setLoading(true) → setData`-mönstret istället för `useQuery`. Det innebär ingen automatisk caching, ingen retry, ingen background-refresh, och stora re-render-vågor.
2. **Mega-komponenter**: 18 komponentfiler är ≥700 rader. Värst: `MatchesTab.tsx` (1 885), `CoverLetterWrite.tsx` (1 153), `NetworkingGuide.tsx` (1 283 rader, 23 useState i en enda komponent), `DailyStep.tsx` (1 112), `CVBuilder.tsx` (1 122). Storleken döljer cykliska dataflöden och förhindrar testning.
3. **Direkt Supabase-anrop kringgår service-lagret**: 26 komponent-/sidefiler anropar `supabase.from/.rpc/.auth/.storage` direkt (förbi `services/supabaseApi.ts`). Detta dubblerar query-logik, RLS-fallback och felhantering.
4. **Felaktig server/klient-state-separation**: `profileStore.ts` (Zustand med persist) lagrar **server-data** (profile, preferences, cvData, enhancements) i client-state med manuell `loadAll`/debouncedSave. `cloudStorage.ts` har 158 `localStorage`-fallbacks i en service som heter "cloudStorage". Två sanningar för samma data – synk-buggar är ofrånkomliga.
5. **Inga retry, ingen error-boundary för API**: `callAI()` i `services/aiApi.ts` har ingen retry-logik, ingen Sentry-rapport, och kastar bara generiska fel. Endast 1 av 81 ErrorBoundary-träffar är på rotnivå (resten är widgets/route-boundary). 22 anrop till `await callAI(...)` saknar nära try/catch — fel propagerar tyst.

---

## Top 10 problemkomponenter

| # | Fil | Rader | useState | useEffect | Problem |
|---|---|---|---|---|---|
| 1 | `client/src/components/jobs/MatchesTab.tsx` | 1 885 | 14 | 4 | Tre parallella matchningskällor (CV/intresse/karriär), inline synonyms-lookup tabell, 14 useState samt egen filterlogik. Borde brytas ut till `useJobMatching` + `MatchSourcePanel` + ren UI. |
| 2 | `client/src/components/cover-letter/CoverLetterWrite.tsx` | 1 153 | 8 | 6 | Mall-väljare, AI-generering, autospar, PDF-export, sparat-jobb-väljare i en komponent. Trycker mot `supabase` direkt via import. |
| 3 | `client/src/components/career/NetworkingGuide.tsx` | 1 283 | **23** | 1 | Klassisk "useState-graveyard". 23 oberoende state-variabler – borde ersättas med `useReducer` eller delas i 3 sub-komponenter (templates / contacts / AI-strategy). |
| 4 | `client/src/components/gamification/DailyStep.tsx` | 1 112 | 11 | 5 | Spel-loopen + UI + persistens i samma fil. Bör splittras i `useDailyStep` (logik) + presentationskomponent. |
| 5 | `client/src/pages/CVBuilder.tsx` | 1 122 | 10 | 6 | 7 localStorage-anrop, 5 useEffect-laddare som kör på mount utan AbortController. Bör flyttas till `useCV()` med React Query + `useMutation` för spara. |
| 6 | `client/src/pages/InterviewSimulator.tsx` | 914 | 13 | 4 | Audio-recorder + AI-chat + timer + state-machine i samma komponent. Tillstånden borde modelleras som discriminated union i `useInterviewSession`. |
| 7 | `client/src/pages/JobSearch.tsx` | 1 009 | 9 | 4 | Hanterar router (`<Routes>` inuti page), söklogik och 19 hårdkodade regions-koder. Filterstate ligger redan i `useJobSearchFilters` men dupliceras delvis i sidan. |
| 8 | `client/src/pages/career/AdaptationTab.tsx` | 1 164 | 5 | 1 | Två rena `fetch('/api/ai', ...)`-anrop direkt i komponenten istället för via `services/aiApi.ts`. Bryter centraliseringen. |
| 9 | `client/src/components/ai-team/AgentChat.tsx` | 731 | 5 | – | Egen `fetch('/api/ai', ...)` + lokal localStorage-hantering. Borde gå via `useAIStream`/`callAI` så headers, auth och retries är konsekventa. |
| 10 | `client/src/components/cv/templates/CVTemplates.tsx` | 1 903 | 0 | – | Inte en logisk skuld men hela mall-katalogen ligger som en JSX-array. Brytes ut till `data/cvTemplates.ts` (data) + `<CVTemplateCard />` (UI). |

> Hederlig nämning: `client/src/services/cloudStorage.ts` (2 810 rader) – 158 `localStorage`-anrop trots namnet. `client/src/services/supabaseApi.ts` (1 835 rader, 32 exports) – borde delas per domän.

---

## TypeScript-skuld

| Indikator | Antal | Källa |
|---|---|---|
| `npx tsc --noEmit` (i `client/`) | **0 fel** | Bra grund. CI-låst typcheck fungerar. |
| `: any`/`as any`/`<any>` förekomster i prod-kod | **75** | (138 totalt inkl. tester; 75 är icke-test) |
| `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck` | **3** | `useZodForm.ts:1`, `RouteErrorBoundary.tsx:1`, `DropdownMenu.tsx:1` – litet och hanterbart. |
| `Record<string, any>` / `as unknown as` | 8 | Lågt, men finns i kritiska tester. |
| Värsta any-fönster | `pages/consultant/AnalyticsTab.tsx:8`, `hooks/useSpontaneousCompanies.ts:6`, `services/supabaseApi.ts:6`, `services/offlineStorage.ts:6`, `pages/dashboard/tabs/OverviewTab.tsx:9` |  |
| Hooks med `useEffect` utan AbortController/cleanup | 472 fall i komponenter/sidor | Risk för "set state on unmounted component" och race conditions. |

**Slutsats**: Type-disciplinen är sund (TS strict-läge fungerar), men `any` i analytics + offline storage indikerar att service-lagret läcker rådata uppåt. Returntyper saknas på många service-funktioner – TS infererar `Promise<any>` när Supabase-anropet returnerar `data` direkt.

---

## State-hanteringskuld

### A. Profil-data: tre lager för samma sanning
- `useAuthStore` (Zustand persist) lagrar `Profile` med 13 nästlade fält.
- `useProfileStore` (Zustand persist, `client/src/stores/profileStore.ts`) lagrar **samma** profile + preferences + cvData + enhancements i en parallell store, med egen debounce-spar och eget completion-räknande.
- `useDashboardData` (`hooks/useDashboardData.ts`, 651 rader) hämtar profile-relaterad data igen via React Query.

Uppdateras profilen i en av dessa kanaler är de andra tysta tills nästa reload. Detta är den största single point of pain.

**Åtgärd**: Servern är sanning. Flytta allt till React Query med `queryKey: ['profile', userId]`. Behåll Zustand endast för UI-state (`activeTab`, `showOnboarding`).

### B. localStorage som "cloud storage"
`services/cloudStorage.ts` har 158 `localStorage`-anrop som "fallback vid RLS-fel". Det innebär att data som inte sparas i molnet stannar lokalt och försvinner mellan enheter – tvärtemot kravet "Supabase är default-persistens" i `MEMORY.md`. Filen har också 11 olika domäner blandade (bookmarks, checklists, dashboard preferences, mood, articles…).

**Åtgärd**: Gör fallback-skiktet explicit (`try Supabase → throw → vise användaren)`. Ta bort tysta localStorage-skrivningar. Splittra filen per domän: `articleApi.ts`, `bookmarksApi.ts`, `dashboardPreferencesApi.ts`.

### C. Manuell loading/error-pattern istället för React Query
- 28 filer med `useQuery`/`useMutation`.
- 472 `useEffect` i pages/components (många som datalärare).
- 59 filer matchar mönstret "useEffect → setLoading(true) → setData".

Exempel: `CVBuilder.tsx:382` – `useEffect(() => { loadCV(); loadVersions() }, [])` utan AbortController, utan stale-tid, utan retry. Samma pattern i 50+ filer.

**Åtgärd**: Etablera `useCV`, `useVersions`, `useCoverLetters`, `useSavedJobs` (existerar redan men används inte alltid) som obligatoriska accesspunkter.

### D. Direkta `supabase.from()`-anrop i UI
26 filer importerar `supabase` och kör queries direkt – kringgår både `supabaseApi.ts` och React Query-cachen. Värst: `pages/consultant/*` (10 filer), `components/consultant/*` (6 filer), `components/microlearning/MicroLearningHub.tsx`, `components/cv/AIWritingAssistantSecure.tsx`, `components/ai-team/AgentChat.tsx`.

Effekten: Ingen optimistic UI, ingen invalidation, dubblerad loading-state.

---

## Custom hooks som saknas

| Saknad hook | Varför den behövs | Var dupliceras logiken idag |
|---|---|---|
| `useDebouncedValue<T>` | 93 träffar på `debounce`/`throttle`. `lib/debounce.ts` är en imperativ util som måste wrappas manuellt i useMemo+useEffect varje gång. | `profileStore.ts:123`, `useAutoSave.ts`, `useCVAutoSave.ts`, search-fält i 5 filer. |
| `useSupabaseQuery<T>` (tunn React Query-wrapper) | Standardiserar `staleTime`, `retry`, `onError → Sentry`. | `useApplications.ts` (gör det rätt) men 27 andra hooks gör det olika. |
| `useAsyncEffect` med AbortController | 472 useEffect i UI utan cleanup. | Alla `loadCV`/`loadProfile`-mönster. |
| `useAIRequest` | `callAI` saknar retry/Sentry. 22 callsites duplicerar try/catch + toast + setLoading. | `CoverLetterWrite.tsx`, `NetworkingGuide.tsx`, `AdaptationTab.tsx`, `InterviewSimulator.tsx`, `CareerCoach.tsx` etc. |
| `usePersistedState<T>` | Konsekvent localStorage-läsare med JSON-validering. | 372 raw `localStorage.*` – varav många i komponenter (DailyTask, OnboardingModal, etc.). |
| `useConsultantParticipants` | 16 consultant-komponenter har egen Supabase-query mot samma tabell. | `pages/consultant/*`. |
| `useSavedJobs` (finns) men `useApplications` (finns) – behöver konsolideras | Två närbesläktade hooks med 50% överlapp. | `useSavedJobs.ts` + `useApplications.ts`. |

---

## Konkreta åtgärder (sorterat efter ROI)

### Hög ROI (gör först – 5–8 dagar totalt)
1. **Slå ihop `profileStore` + `authStore.profile` till ett React Query-baserat `useProfile()`** (1–2 dagar). Eliminerar tre konkurrerande sanningar. Påverkar ~30 filer men sökvägen är mekanisk.
2. **Lägg retry + Sentry + toast i `services/aiApi.ts → callAI`** (2 timmar). 54 callsites förbättras gratis.
3. **Bryt ut `MatchesTab.tsx`** till `useJobMatching` + `MatchSourcePanel` + parent (1 dag). Den enskilt största komponenten i kodbasen.
4. **Ersätt `setLoading(true)/setData`-mönstret i de 10 mest besökta sidorna med `useQuery`** (2 dagar). Mätbar prestanda-vinst (cache + bakgrundsuppdatering).
5. **Förbjud direkt `supabase.from()` utanför `services/`** via ESLint-regel `no-restricted-imports` (30 min). Dokumenterar kontraktet och stoppar regression.

### Medium ROI (gör i nästa sprint – 4–6 dagar)
6. **Splittra `cloudStorage.ts` (2 810 rader)** i 6 domänspecifika service-filer + ta bort tyst localStorage-fallback (1–2 dagar).
7. **Splittra `supabaseApi.ts` (1 835 rader, 32 exports)** per resurs (`cvApi.ts`, `coverLetterApi.ts`, `userApi.ts`…) (1 dag).
8. **Refaktorera `NetworkingGuide.tsx` (23 useState → 3 sub-komponenter + useReducer)** (1 dag).
9. **Lyft data-arrayer ut ur komponenter** (`CVTemplates.tsx`, `ExternalResources.tsx`, `Resources.tsx`) till `data/`-mapp (4 timmar).
10. **Introducera `useDebouncedValue` + `useAIRequest` + `useAsyncEffect` shared hooks** (1 dag).

### Låg ROI (välj utifrån andra prioriteringar)
11. Ersätt `: any` i top-5 filer (Analytics, OverviewTab, supabaseApi, useSpontaneousCompanies) med konkreta typer (1 dag).
12. Konvertera `console.log/warn/error` (571 träffar) till `lib/logger`-nyttjare där det inte redan görs (4 timmar).
13. Lägg AbortController i alla `useEffect`-loaders (1 dag, men låg crash-frekvens i prod just nu).
14. Konsolidera `useSavedJobs` och `useApplications` till en gemensam datakälla (4 timmar – men kräver migrationsplan).

---

## Mätsiffror (för regression-tracking)

| Mätare | Värde 2026-05-09 |
|---|---|
| TypeScript-fel (`npx tsc --noEmit`) | 0 |
| `any` i prod-kod | 75 |
| `@ts-ignore`/`@ts-expect-error`/`@ts-nocheck` | 3 |
| Filer med `useQuery`/`useMutation` | 28 |
| Filer med `memo` | 63 |
| Total `useState` | 1 845 |
| Total `useEffect` | 576 |
| Filer >700 rader (.tsx i src/) | 18 |
| Direkta `supabase.from/.rpc` i komponenter/sidor | 26 |
| `localStorage.*`-anrop i `client/src` | 372 |
| `console.*`-anrop (icke-test) | 571 |
| ErrorBoundary-träffar | 81 (4 unika definitioner) |

Spara dessa siffror inför nästa granskning.
