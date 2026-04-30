# /job-search — Fullstack-review

**Granskat:** 2026-05-01 · **Live:** https://www.jobin.se/#/job-search · **Kommit:** 8e3f4ee

## TL;DR

Sidan fungerar i prod och har solid bas: Supabase-persistens av filter (cross-device), AF-API-cache (2 min), debounce på sök (300 ms) och autocomplete (200 ms), focus-trap på job-modalen, sr-only labels på filter-fälten. Men `JobSearch.tsx` är 980 LOC i en enda fil och rymmer fyra olika tabs som blandas med routing och PageLayout-stats — kompilerar bara på en lyckad slump (saknar `Train`-import som **kommer krascha vid runtime** så fort en användare öppnar pendlingsknappen i jobbmodalen). Topp-3 prioriteringar: (1) fixa `Train`-bug, (2) bryt ut `SearchTab`/`SavedJobsTab` till egna filer, (3) ersätt useEffect-baserad sökning med React Query för dedupe + cancellation + cache.

## Topp-5 förbättringar (med diff-skiss)

### 1. **Runtime-krasch: `Train` används utan import**

**Problem:** `JobSearch.tsx:665` renderar `<Train size={16} />` i job-detail-modalen ("Pendlingsinfo"-knappen), men ikonen är inte med i import-listan på rad 4-11. Eftersom det är inuti en branch som bara körs när modalen öppnas missas det av build/test, men i prod kraschar React när en användare klickar på ett jobb (eller åtminstone visas en ReferenceError i konsolen och knappen blir tom). Bell, MoreVertical, useRef och useId är samtidigt importerade men oanvända.

**Förslag:** Lägg till `Train` i icons-importen, ta bort de oanvända.

**Skiss:**
```tsx
// före (rad 1-11)
import { useState, useEffect, useMemo, useRef, useId } from 'react';
import {
  Search, MapPin, Briefcase, X, Building2,
  ExternalLink, Filter, ChevronDown,
  ChevronLeft, ChevronRight, Sparkles, Heart, FileText,
  Bookmark, Send, Bell, MoreVertical,
  Trash2, CheckCircle, Clock, MessageSquare,
  Star, Mic
} from '@/components/ui/icons';

// efter
import { useState, useEffect, useMemo } from 'react';
import {
  Search, MapPin, Briefcase, X, Building2,
  ExternalLink, Filter, ChevronDown,
  ChevronLeft, ChevronRight, Sparkles, Heart, FileText,
  Bookmark, Send, Trash2, CheckCircle, Clock, MessageSquare,
  Star, Mic, Train,
} from '@/components/ui/icons';
```

**Effort:** S · **Impact:** hög · **Risk:** låg

---

### 2. **Dela `JobSearch.tsx` (980 LOC) — bryt ut SearchTab och SavedJobsTab**

**Problem:** En fil rymmer två stora tab-komponenter + router + 80 LOC `REGIONS`-array + interna types. `SearchTab` (rad 85-760) gör sök, autocomplete, voice-input, filter-pills, paginering, jobblista, **två modaler** (job-detail + create-application) och två AI-paneler. `SavedJobsTab` (rad 763-916) är fristående men sitter kvar. När en utvecklare ska fixa filter-pills får de ladda 980 rader i editorn. AlertsTab/MatchesTab/DailyJobTab är redan utbrutna (`@/components/jobs/`) — gör samma sak här.

**Förslag:** Ny mapp `client/src/components/jobs/SearchTab/` med:
- `SearchTab.tsx` (root, ~200 LOC)
- `SearchAndFilterCard.tsx` (rad 217-446 — header + sökfält + filterselects + filter-pills)
- `JobResultsList.tsx` (rad 458-578 — list + paginering)
- `JobDetailModal.tsx` (rad 591-747 — modal + AI-paneler)
- `regions.ts` (REGIONS-array)
- `SavedJobsTab.tsx` flyttas till `@/components/jobs/SavedJobsTab.tsx`

JobSearch.tsx blir ~50 LOC: bara routing + stats.

**Skiss:**
```tsx
// JobSearch.tsx — efter
import { SearchTab } from '@/components/jobs/SearchTab/SearchTab'
import { SavedJobsTab } from '@/components/jobs/SavedJobsTab'
import { AlertsTab, MatchesTab, DailyJobTab } from '@/components/jobs'
// ... 50 rader: PageLayout + Routes
```

**Effort:** M · **Impact:** hög · **Risk:** låg (ren refaktor, samma render-träd)

---

### 3. **Ersätt useEffect-baserad sökning med React Query**

**Problem:** `SearchTab.tsx:117-122` och `:125-142` har **manuell debounce + useEffect + useState för loading/error/data**. Det är exakt vad React Query (redan i stacken!) löser. Nuvarande kod har följande issues:
- Inget request-cancelation: ny sökning startar utan att avbryta gammal — race condition om langsam svar landar efter snabb.
- `fetchFromAF`s in-memory cache (rad 13 i arbetsformedlingenApi.ts) försvinner vid hot-reload och delar inte med React Query devtools.
- `loading`-state återgår inte till `false` om komponenten unmountas mid-flight (memory leak risk i StrictMode).
- Ingen retry-strategi.

**Förslag:** `useQuery({ queryKey: ['jobs', filtersKey], queryFn, staleTime: 2*60_000 })`. `jobSearchFiltersKey()` finns redan i `useJobSearchFilters.ts:45` — använd den.

**Skiss:**
```tsx
// före
const [jobs, setJobs] = useState<PlatsbankenJob[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [totalJobs, setTotalJobs] = useState(0);

useEffect(() => {
  const timer = setTimeout(() => { performSearch(); }, 300);
  return () => clearTimeout(timer);
}, [filters]);

// efter
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { jobSearchFiltersKey } from '@/hooks/useJobSearchFilters'

const debouncedFilters = useDebounce(filters, 300)
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['jobs', jobSearchFiltersKey(debouncedFilters)],
  queryFn: () => searchJobs({ ...debouncedFilters, limit: JOBS_PER_PAGE }),
  staleTime: 2 * 60_000,
  placeholderData: keepPreviousData, // smooth UX vid filter-byte
})
const jobs = data?.hits ?? []
const totalJobs = data?.total.value ?? 0
```

**Effort:** M · **Impact:** hög · **Risk:** låg-medel (verifiera att `keepPreviousData` inte krockar med `EmptySearch`-rendering)

---

### 4. **Type safety: ta bort `any` och fixa boolean-buggen i arbetsformedlingenApi.ts**

**Problem:** Två konkreta typproblem:
1. `JobSearch.tsx:192` har `(event: any)` på `recognition.onresult` — finns en `SpeechRecognitionEvent`-typ.
2. `JobSearch.tsx:371` använder `as any` för publishedWithin select — onödigt eftersom typen redan är union.
3. `JobSearch.tsx:830` (`SavedJobsTab`) har `(e.target.value as any)` på sortBy.
4. **Bug i `arbetsformedlingenApi.ts:278`:** `!params.employmentType === 'Heltid'` — operator precedence-bugg. `!params.employmentType` evalueras först (boolean), jämförs sedan med strängen 'Heltid' → alltid `false`. Hela if-grenen är dödkod. Antingen ta bort eller skriv om.
5. `PlatsbankenJob.workplace_address` är inte `?` på alla nivåer trots att fältet ofta saknas — orsaken till alla `?.workplace_address?.municipality`-kedjor.

**Förslag:**

```ts
// arbetsformedlingenApi.ts:278 — före
if (params.employmentType && !params.employmentType === 'Heltid' && !params.employmentType === 'Deltid') {
  hits = hits.filter(/* ... */);
}

// efter — rensa eller fixa parenteser
if (
  params.employmentType &&
  params.employmentType !== 'Heltid' &&
  params.employmentType !== 'Deltid'
) {
  hits = hits.filter((job) =>
    job.employment_type?.label?.toLowerCase().includes(params.employmentType!.toLowerCase())
  );
}
```

```tsx
// JobSearch.tsx:192 — före
recognition.onresult = (event: any) => { ... };

// efter
recognition.onresult = (event: SpeechRecognitionEvent) => {
  const transcript = event.results[0][0].transcript;
  setFilters({ ...filters, query: transcript });
};
```

**Effort:** S · **Impact:** medel (fixar dödkod-bug) · **Risk:** låg

---

### 5. **Bryt useState-explosionen — useReducer för UI-state**

**Problem:** `SearchTab` har **11 useState** (rad 87-114) som ofta uppdateras tillsammans:
- `selectedJob` + `showInterviewPrep` + `showCommutePlanner` (modal-state)
- `applicationModalJob` (parallell modal)
- `suggestions` + `showSuggestions` (autocomplete)
- `currentPage` (reset:as när filters ändras — egen useEffect rad 145)
- `isListening` (voice)

Det leder till:
- Filter-byte triggar `setCurrentPage(1)` i en separat useEffect = extra render.
- Att stänga jobbmodalen kräver att man kommer ihåg att också stänga AI-panelerna (`showInterviewPrep`, `showCommutePlanner` förblir true mellan jobb).
- `selectedJob` + `applicationModalJob` är ömsesidigt uteslutande men hanteras som oberoende.

**Förslag:** En `useReducer` för modal/UI-state:

```tsx
type UiState = {
  modal: { type: 'none' } | { type: 'job-detail'; job: PlatsbankenJob; aiPanel?: 'interview' | 'commute' } | { type: 'create-application'; job: PlatsbankenJob };
  page: number;
  voice: 'idle' | 'listening';
  autocomplete: { open: boolean; suggestions: string[] };
}

type UiAction =
  | { type: 'open-job'; job: PlatsbankenJob }
  | { type: 'close-modal' }
  | { type: 'toggle-ai-panel'; panel: 'interview' | 'commute' }
  | { type: 'reset-page' }
  | { type: 'next-page' | 'prev-page' }
  // ...
```

Behåll dock `filters` separat (det har egen Supabase-persistens) och `jobs/loading/error` (kommer från React Query efter förslag #3).

**Effort:** M · **Impact:** medel · **Risk:** medel (testtäckning behöver utökas — nuvarande tester rör bara render-pass, inte modal-flöden)

---

## Hela listan (sorterad efter impact)

| # | Område | Problem | Effort | Impact | Risk |
|---|---|---|---|---|---|
| 1 | Bug | `Train`-ikonen används utan import (`:665`) → runtime-krasch i jobbmodal | S | hög | låg |
| 2 | Arkitektur | `JobSearch.tsx` 980 LOC monolit — bryt ut Search/Saved-tabs | M | hög | låg |
| 3 | Performance | useEffect+setState ersätts med React Query (cancelation, dedupe, cache) | M | hög | låg |
| 4 | Bug | `!x === 'str'` operator-precedence-bug i arbetsformedlingenApi.ts:278 → dödkod-gren | S | medel | låg |
| 5 | Type safety | `event: any` på voice-recognition + sortBy `as any` | S | medel | låg |
| 6 | State | useState-explosion (11 st) i SearchTab → useReducer för modal-state | M | medel | medel |
| 7 | A11y | `<div role="button">` på job cards (`:466-479`) — borde vara `<button>` eller `<article>` med inre länk | S | medel | låg |
| 8 | A11y | `confirm('Ta bort detta sparade jobb?')` (`:884`) — använd `ConfirmDialog` (finns i ui/) | S | medel | låg |
| 9 | i18n | Hårdkodad svensk text i `SavedJobsTab` ("Sparade jobb", "jobb sparade", "Senast sparade", "Företag A-Ö", "Markera som ansökt", "Ta bort") | S | medel | låg |
| 10 | i18n | Hårdkodad svensk text i jobmodal (`:654` "Intervjuförberedelse", `:666` "Pendlingsinfo") | S | låg | låg |
| 11 | Performance | `headerStats` (`:933-952`) byggs på varje JobSearch-render från `savedJobs`-array — useMemo:a den | S | låg | låg |
| 12 | Performance | `paginatedJobs` (`:204`) räknas oberoende av att API redan returnerar `JOBS_PER_PAGE` jobb (`:160`) — antingen hämta fler från API och paginera lokalt, eller ta bort lokal pagination (idag visas en sida bara) | S | medel | låg |
| 13 | Data | `searchJobs` returnerar `total.value = hits.length` efter lokal filtrering (`arbetsformedlingenApi.ts:287`) → "Visar 20 av 20 jobb" är alltid lika med antal hits, inte AF-totalen → paginering visas aldrig | S | medel | låg |
| 14 | Data | `MUNICIPALITY_TO_REGION`-mappen (`:98-159`) i arbetsformedlingenApi.ts används aldrig (orphan dictionary) | S | låg | låg |
| 15 | Data | `getMarketInsights` simulerar topOccupations med `Math.floor(totalJobs * 0.08)` (`:388-394`) — fake data presenterad som riktig | M | medel | medel |
| 16 | Dead code | `analyzeSkillGap` (`:412`) returnerar `Math.random()*40+60` — också simulerad. Antingen ta bort eller flagga `// MOCK` | S | låg | låg |
| 17 | Dead code | Oanvända imports i JobSearch: `useRef`, `useId`, `Bell`, `MoreVertical` | S | låg | låg |
| 18 | UX | Filter-pills använder emoji som ikon (`📍 🗺️ 💼 📅`) men resten av sidan har Lucide-ikoner — inkonsekvens | S | låg | låg |
| 19 | UX | Sortering i SavedJobsTab har `'date' \| 'company' \| 'status'` men UI exponerar bara två (`:833-834`) — döda val | S | låg | låg |
| 20 | A11y | Voice-search-knappen syns även om SpeechRecognition inte stöds — kontrolleras (`:265`), men `(window as any)` saknas typ. Browser-types kan ge problem i strikt TS | S | låg | låg |
| 21 | Test | `JobSearch.test.tsx` testar bara render — inga assertions för modal, voice, paginering, filter-pill-removal, eller error-state | M | medel | låg |
| 22 | Test | `e2e/job-search.spec.ts` skippas om `TEST_USER_EMAIL` saknas — verifiera att den körs i CI | S | medel | medel |
| 23 | Service | `useSavedJobs.ts:75` skriver `localStorage.setItem('saved-jobs', 'true')` — strider mot CLAUDE.md:s "Supabase är default-persistens"-policy | S | låg | låg |
| 24 | Service | `useSavedJobs.ts:120-128` `addNotes` uppdaterar bara lokalt state, inte Supabase — silent data loss | S | medel | låg |
| 25 | Service | `searchJobs` har in-memory `cache: Map` (`arbetsformedlingenApi.ts:13`) — växer utan TTL-cleanup; ändras inte vid filter-byte | S | låg | låg |
| 26 | Network | Inget retry på AF-API (rad 162-183) — vid HTTP 5xx får användaren bara "Kunde inte söka" | S | medel | låg |
| 27 | Network | Inget abort-controller — om sökningen är långsam och användaren skriver vidare så fortsätter alla pågående requests till slut | S | låg | låg |
| 28 | UX | Job card "Visar 20 av 20 jobb" (`:462`) — när jobb-API har fler men `limit=20` används framstår det som om det inte finns fler jobb. Lägg till "Visa fler"/cursor-paginering | M | medel | medel |
| 29 | A11y | Autocomplete `aria-selected={false}` (`:293`) — alltid false oavsett tangentbordsfokus. Korrekt ARIA kräver att tracks aktivt highlightat option | S | medel | medel |
| 30 | i18n | Datum formatteras manuellt (`new Date(job.publication_date).toLocaleDateString(...)`, rad 501) på flera ställen — bryt ut till `formatDate(date, lang)` i utils | S | låg | låg |

## Code smells noterade

- [ ] **Operator precedence-bug:** `arbetsformedlingenApi.ts:278` `!params.employmentType === 'Heltid'` är alltid false
- [ ] **`Train` icon import saknas:** `JobSearch.tsx:665` renderar utan import
- [ ] **Orphan-dictionary:** `MUNICIPALITY_TO_REGION` (`arbetsformedlingenApi.ts:98-159`) används aldrig
- [ ] **Orphan-imports:** `useRef`, `useId`, `Bell`, `MoreVertical` (`JobSearch.tsx:1, 8`)
- [ ] **Mock-data presenterad som riktig:** `getMarketInsights` (`arbetsformedlingenApi.ts:378`) — `Math.floor(totalJobs * 0.08)` för "topOccupations"
- [ ] **`Math.random` skill gap:** `analyzeSkillGap` (`arbetsformedlingenApi.ts:413`) — slumpmässig matchPercentage
- [ ] **`localStorage` blir kvar:** `useSavedJobs.ts:75` skriver `localStorage.setItem('saved-jobs', 'true')` parallellt med Supabase
- [ ] **Silent data loss:** `useSavedJobs.ts:120` `addNotes` uppdaterar bara lokalt state
- [ ] **`role="button"` på `<div>`:** `JobSearch.tsx:466-479` istället för `<button>` (eller `<article>` med inre länk)
- [ ] **`window.confirm()`:** `JobSearch.tsx:884` istället för `ConfirmDialog`-komponenten
- [ ] **Pagination total fel:** `arbetsformedlingenApi.ts:287` `total.value = hits.length` (post-filter) istället för AF-totalen → "Visar 20 av 20" alltid
- [ ] **AF in-memory `cache: Map`** (`arbetsformedlingenApi.ts:13`) växer utan begränsning
- [ ] **Hårdkodade SE-strängar i `SavedJobsTab`** (`:824, 825, 833, 834, 853, 857, 869, 878, 884, 889, 906`)
- [ ] **`event: any`** på voice recognition (`:192`)
- [ ] **`as any`** på sortBy (`:830`) och publishedWithin (`:371`)
- [ ] **Två filter-uppdaterande useEffect** (`:117-122`, `:145-147`) borde slås ihop eller flyttas till React Query
- [ ] **Emoji som filter-pill-ikoner** medan resten är Lucide
- [ ] **Aria-selected hårdkodad till false** (`:293`)
- [ ] **`fetchFromAF` typar via generic men returnerar `unknown` i cache** (`:13`)

## Vad funkar redan bra

1. **Filter-persistens** är kanonisk: `useJobSearchFilters` validerar med Zod, debouncar 500 ms, använder `user_preferences.job_search_filters` (cross-device-sync) och faller tillbaka till in-memory för utloggade. Just exempel på "Supabase är default" som CLAUDE.md kräver.
2. **A11y-grunden är solid:** `useFocusTrap` på job-modal, `role="status"` + `aria-live="polite"` på resultat-räknaren, `<fieldset>/<legend>` på filter-grupper, sr-only labels, `min-h-[44px]` på touch-targets, `aria-controls`/`aria-expanded` på combobox/sökfält.
3. **API-arkitekturen separerar I/O från view:** `arbetsformedlingenApi.ts` är pure och har sin egen 2-min-cache. `useSavedJobs` har korrekt optimistisk uppdatering (lokal state + Supabase) — bara `addNotes` är trasig. Tab-komponenter (Alerts/Matches/DailyJob) är redan utbrutna, vilket visar att refaktor #2 är genomförbar utan dramatik.
