# Granskning: testsvit och kvalitetsskyddsnät — Jobin/Deltagarportalen

**Datum:** 2026-08-04
**Omfattning:** 66 vitest-filer / 933 tester, 10 Playwright-specar, 7 CI-grindar, `.github/workflows/ci.yml`
**Metod:** all kod läst; alla siffror mätta (vitest-körningar, `npx playwright test --list`, `information_schema`/`pg_policies` mot prod). Ingen kod ändrad.

---

## 0. Sammanfattning

Sviten är **grön och stor** (933/933) men **CI är röd** och har varit det: `npm run test:coverage` — exakt kommandot på `ci.yml:93` — avslutar med exit 1. Eftersom `build` har `needs: [lint-and-typecheck, test]` innebär det att `build`, `lighthouse`, `e2e-smoke` och `e2e-authenticated` **aldrig körs** på main. Fyra av nio CI-jobb är i praktiken avstängda.

Utöver det bär granskningen tre skarpa prod-buggar som testerna inte bara missade utan **asserterar som korrekt beteende** — samma familj som `journey_goals`- och `useJobsokHubSummary`-fällorna:

| | Bugg | Testet som cementerar den |
|---|---|---|
| T1 | Konsulentens massändring av deltagarstatus skriver till en kolumn som inte finns | `consultantService.test.ts:643` |
| T2 | 31 kopplade deltagare ser "Inte tilldelad" på Min vardag-hubben (UX12 lever kvar) | `useMinVardagHubSummary.test.ts:178-186` |
| T3 | Varje hubb-besök nollställer `profiles.onboarded_hubs` | `useOnboardedHubsTracking.test.ts:50-64` |

Den gemensamma nämnaren, och svaret på fråga 4: **buggklassen "objektet finns, typerna stämmer, men läsningen/skrivningen ger inget i drift" går rakt igenom alla sju grindarna.** Se §4.

**Fem åtgärder i prioritetsordning:** (1) gör CI grön igen — G4; (2) fixa T1/T2/T3; (3) fixa hash-routingen i e2e — E1, annars är 57 tester värdelösa även när secrets läggs in; (4) grind G-A (insert/update-payload + embed-RLS); (5) grind G-B (tautologi-lint).

---

## 1. Ljugande tester

### T1 — Konsulentens statusändring skriver till en kolumn som inte finns i prod
**Allvarlighet:** KRITISK

**Bevis.** `client/src/services/consultantService.ts:626-639`:
```ts
const { error } = await supabase
  .from('consultant_participants')
  .update({ status })
```
Prod (`information_schema.columns`, verifierat 2026-08-04) — tio kolumner, ingen `status`:
`assigned_at, assigned_by, consultant_id, id, last_contact_at, next_meeting_scheduled, notes, participant_id, priority, tags`

Varje anrop får PGRST204. Det är inte dödkod: `client/src/components/consultant/BulkActionsDialog.tsx:290` anropar `updateParticipantStatus(...)` — konsulentens massändring har alltså aldrig fungerat.

Testet som döljer det, `client/src/services/consultantService.test.ts:643`:
```ts
expect(mockFromBuilder.update).toHaveBeenCalledWith({ status: 'ON_HOLD' })
```
Mot en mockad klient passerar vilken payload som helst. `npm run lint:schema` är grön (kört: 717 filer OK) därför att `check-schema-drift.cjs:36` uttryckligen undantar `.insert()/.update()`-objekt.

**Åtgärd.** Statusen konsulentvyn faktiskt läser kommer från vyn `consultant_dashboard_participants.status` (speglar `profiles.status`). Skriv dit — eller lägg till kolumnen efter beslut. Låt testet assertera måltabellen, inte bara `update`-argumentet.
**Storlek:** S (fix) + M (om kolumnen ska införas med migration).

---

### T2 — Min vardag-hubben läser konsulenten via ett embed som RLS blockerar; testet låser fast den vägen
**Allvarlighet:** KRITISK

**Bevis.** `client/src/hooks/useMinVardagHubSummary.ts:57-62`:
```ts
supabase
  .from('consultant_participants')
  .select('consultant_id, profiles:consultant_id(id, full_name, avatar_url)')
  .eq('participant_id', userId)
```
`pg_policies` för `profiles` i prod — SELECT-policyer:
- `Users can view own profile` → `auth.uid() = id`
- `Consultants can view assigned participant profiles` → `consultant_id = auth.uid()`
- `Admins can view all profiles` → `is_admin_or_superadmin()`

**Ingen policy låter en deltagare läsa sin konsulents rad.** Embedet returnerar därför `null` → `MinVardagHub.tsx:139-140` visar `'Inte tilldelad'`. `SELECT count(*) FROM consultant_participants` = **31** — alla 31 kopplade deltagare ser fel status.

`client/src/services/myConsultantApi.ts:10-13` varnar ordagrant för exakt detta: *"Alla deltagarvända ytor som behöver konsulentens namn ska gå via den här funktionen. En direkt `.from('profiles').eq('id', consultant_id)` ger 0 rader — den vägen såg ut som 'ingen konsulent tilldelad' i UI:t i månader."* Det är UX12, oreparerad på hubben.

Testet gör två fel samtidigt. `useMinVardagHubSummary.test.ts:94-98` har en fixtur med ett fullt `profiles`-objekt som RLS gör omöjligt, och `:178-186` asserterar att frågan går via `consultant_participants` — dvs. **förbigåendet av `get_my_consultant()`-RPC:n är inskrivet som förväntat beteende.**

Kompletterande lucka: `MinVardagHub.test.tsx` kör alla tester med `consultant: null` (rad 73) eller `data: undefined` (rad 36) — grenen `consultant?.full_name ? … : 'Inte tilldelad'` har noll täckning.

**Åtgärd.** Byt hooken till `getMyConsultant()`. Skriv om testet till att assertera `rpc('get_my_consultant')`. Lägg till ett hubbtest med populerad konsulent.
**Storlek:** S

---

### T3 — Varje hubb-besök nollställer `profiles.onboarded_hubs`; testet asserterar överskrivningen
**Allvarlighet:** KRITISK (låg blast radius idag, se nedan)

**Bevis.** `client/src/hooks/useOnboardedHubsTracking.ts:30-39`:
```ts
const cached = queryClient.getQueryData(OVERSIKT_HUB_KEY(userId)) as …
const current = cached?.onboarded_hubs ?? []
if (current.includes(hubId)) return current
const next = [...current, hubId]
await supabase.from('profiles').update({ onboarded_hubs: next }).eq('id', userId)
```
Mutationen läser sitt "nuvarande" tillstånd ur **cachen**, inte ur servern. `OVERSIKT_HUB_KEY` fylls bara av `useOversiktHubSummary`, som monteras enbart av `HubOverview.tsx:114` och `HubOverviewHistory.tsx:112`. De fyra andra hubbarna (`JobsokHub.tsx:66`, `KarriarHub.tsx:65`, `ResurserHub.tsx:67`, `MinVardagHub.tsx:68`) monterar tracking-hooken utan att nyckeln någonsin fylls → `current` är `[]` → **ett besök på /jobb skriver `onboarded_hubs = ['jobb']` och raderar resten.** På /oversikt fyrar mutationen dessutom i `useEffect` (rad 57-63) parallellt med profil-SELECT:en, så cachen är ofta tom även där.

Prod-fördelning (`array_length(onboarded_hubs,1)`), 33 rader med värde:
| n | antal |
|---|---|
| 1 | 15 |
| 2 | 13 |
| 3 | 2 |
| 4 | 3 |
| 5 | **0** |

Ingen enda användare har nått 5 av 5 hubbar, och tyngdpunkten ligger på 1. Förenligt med överskrivningen (den enda väg som kan växa arrayen är /oversikt med varm cache). Inte ensamt bevis — nya användare har naturligt 1 — men mönstret stämmer med mekanismen.

Testet, `client/src/hooks/useOnboardedHubsTracking.test.ts:28-36`, förseedar wrappern med `{onboarded_hubs: []}` — precis den situation som aldrig uppstår i drift — och `:50-64` asserterar `updateSpy` anropad med `{ onboarded_hubs: ['jobb'] }`.

**Ärligt om blast radius:** ingen UI-yta läser kolumnen idag (grep på `onboarded_hubs` utanför tester ger bara hooken och typen). Funktionen är alltså inert medan fyra gröna tester intygar att den fungerar. Det är buggen i vila, inte i drift.

**Åtgärd.** Läs `current` från servern i `mutationFn`, eller använd en `array_append`-RPC. Lägg till ett test som kör med **tom** cache och kräver att befintliga hubbar bevaras.
**Storlek:** S

---

### T4 — `unifiedProfileApi` läser två kolumner som inte finns; fixturen uppfinner dem
**Allvarlighet:** HÖG

**Bevis.** `client/src/services/unifiedProfileApi.ts:218-219`:
```ts
riasecScores: interestResult?.riasec_scores || undefined,
topOccupations: interestResult?.top_occupations || [],
```
Prod `interest_results` har varken kolumnen. Faktiska kolumner:
`agreeableness, artistic, completed_at, conscientiousness, conventional, enterprising, extraversion, holland_code, id, investigative, neuroticism, openness, physical_requirements, realistic, recommended_jobs, social, user_id`

Läsningen sker efter `.select('*')`, så inget fel kastas — värdena är bara alltid `undefined`/`[]`. Konsekvens: `calculateCompleteness` (`unifiedProfileApi.ts:529`, `if (profile.career.riasecScores) score += 10`) drar 10 poäng från **varje** användare, även den som gjort intresseguiden.

Fixturen som gör testet grönt, `unifiedProfileApi.test.ts:112-115` och `:130`:
```ts
data: { riasec_scores: { realistic: 3 }, top_occupations: ['Snickare'] },
…
expect(result.career?.riasecScores).toEqual({ realistic: 3 })
```
`lint:schema` ser det inte: `.select('*')` ger inga kolumnnamn att kontrollera, och property-access på resultatet ligger utanför textanalysen.

Rätt mönster finns redan i repot: `client/src/hooks/useInterestProfile.ts:264-316` bygger RIASEC ur de platta kolumnerna.

**Åtgärd.** Läs de platta kolumnerna. Hämta fixturens nycklar ur `information_schema`, inte ur TypeScript-typen.
**Storlek:** S

---

### T5 — `cvs.skills`-fixturen har fel form (samma familj som UX14)
**Allvarlighet:** HÖG

**Bevis.** `client/src/services/unifiedProfileApi.test.ts:109`:
```ts
data: { summary: '…', skills: ['React'], work_experience: [{ title: 'X' }], education: [] },
```
Prod: `SELECT jsonb_typeof(skills->0) FROM cvs` → `object` i samtliga 16 rader med kompetenser. `unifiedProfileApi.ts:27` deklarerar `skills: string[]`; rad 211 skickar `cv?.skills` vidare orört. Typen ljuger om verkligheten — exakt vad `cvOptimizer.ts` gjorde innan UX14. Idag räddas det av att enda läsaren är `skills?.length` (rad 522); nästa läsare som gör `.join(', ')` renderar `[object Object]`.

Samma repo gör det rätt på ett annat ställe: `components/cv/templates/__tests__/templates.snapshot.test.tsx:65-70` använder objektformen. Två fixturer i samma repo är oense om samma kolumn.

Relaterat: `CVPage.test.tsx:226-239` har `skills: []` och saknar `languages`, `links`, `certificates`.

**Åtgärd.** Lyft ut **en** delad, prod-formad CV-fixtur och använd den i båda. Normalisera i `unifiedProfileApi.ts:211` eller rätta typen.
**Storlek:** S

---

### T6 — `nav-smoke` kan inte falla på det den påstår sig vakta
**Allvarlighet:** HÖG

**Bevis.** `client/src/test/integration/nav-smoke.test.tsx:1-13` lovar i filhuvudet: *"This test asserts the URL stays at the requested path after navigation"* och *"the catch-all `<Route path="*">` silently redirects unmatched URLs to '/'. A broken route would not fail loudly"*.

Assertionerna (`:166-199`) är:
```js
expect(container.textContent ?? '').not.toBe('loading')
expect(container.textContent ?? '').not.toBe('')
expect(container.querySelector('[data-testid="route-error-fallback"]')).toBeNull()
```
Ingen URL kontrolleras. Inget sidinnehåll kontrolleras. Togs **samtliga 28 djuplänkar** bort ur `App.tsx` skulle catch-all rendera dashboarden — icke-tom textContent, ingen error boundary — och alla 33 testfall vore gröna. Det är precis buggen testet säger sig vakta.

**Åtgärd.** Exponera location (`useLocation`-probe eller `MemoryRouter` + `router.state`) och assertera `pathname === path`, plus en unik rubrik per sida.
**Storlek:** M

---

### T7 — `CVPage.test.tsx`: mockens form matchar inte hookens, och nio tester kan inte falla
**Allvarlighet:** HÖG

**Bevis (a) — mockform.** `client/src/pages/CVPage.test.tsx:88-100`:
```js
vi.mock('@/hooks/useCVAutoSave', () => ({
  useCVAutoSave: vi.fn(() => ({ save: vi.fn(), isSaving: false, lastSaved: null })),
  useCVDraft: vi.fn(() => ({ draft: null, saveDraft: vi.fn(), clearDraft: vi.fn(), hasDraft: false })),
}))
```
Riktiga hooken returnerar `{ saveStatus, lastSavedAt, hasUnsavedChanges, triggerSave, pendingCount, isOnline, hasRemoteChanges }` (`useCVAutoSave.ts:262-270`); `useCVDraft` returnerar `{ restoreDraft, clearDraft }` (rad 324). **Inget fältnamn utom `clearDraft` överlappar.** Under test är hela autospar-/statusytan i CVBuilder `undefined`.

**Bevis (b) — innehållslösa assertions.** `:174-197, 207-214, 216-268, 272-279`:
`expect(container.firstChild).toBeInTheDocument()`, `expect(container.innerHTML.length).toBeGreaterThan(0)`, `expect(buttons.length).toBeGreaterThan(0)`.
Värst `:225-248` — testet heter *"should load existing CV data"*, mockar `firstName: 'Test'` och asserterar sedan bara `expect(mockCvApi.getCV).toHaveBeenCalled()`. `:260-268` (*"should handle CV loading error"*) mockar en rejection och asserterar samma sak. Samtliga vore gröna om CVBuilder returnerade `<div><button/></div>`.

**Bevis (c) — död mock.** `:9-15` mockar `@/services/api`, som inte längre finns.

**Åtgärd.** Typa mocken mot `UseCVAutoSaveReturn` så `tsc` fångar drift. Assertera på synligt innehåll (`screen.getByDisplayValue('Test')`) och på felytan. Ta bort den döda mocken.
**Storlek:** M

---

### T8 — Hub-hookarnas `wrapper` skapar en ny `QueryClient` per render — UX8-vakten är skör
**Allvarlighet:** MEDEL

**Bevis.** `useJobsokHubSummary.test.ts:37-40`, `useMinVardagHubSummary.test.ts:56-59`, `useKarriarHubSummary.test.ts:34-37`, `useOversiktHubSummary.test.ts:62-65`, `useOnboardedHubsTracking.test.ts:28-36` gör alla:
```js
function wrapper({children}) { _qc = new QueryClient(...); return createElement(QueryClientProvider, {client: _qc}, children) }
```
`_qc` pekar på den *senast skapade* klienten. UX8-regressionsvakten (`useJobsokHubSummary.test.ts:99-101`) asserterar `_qc.getQueryData(['application-stats'])` — den håller idag bara därför att RTL inte återrenderar wrappern vid barnets state-uppdateringar. Ett `rerender()` eller en RTL-uppgradering gör vakten till en no-op som alltid är grön.

**Positivt att notera:** själva UX8-fixen är korrekt och kvar. `useJobsokHubSummary.ts:79-88` har ingen `setQueryData`; testet `:95-102` kräver att `['application-stats']`, `['cv-versions']` och `['cover-letters']` är `undefined`. Kartläggningen av alla 9 `setQueryData`-anrop i `src/` visar bara **en** kvarvarande delad nyckel (`OVERSIKT_HUB_KEY`, skriven av `useOnboardedHubsTracking.ts:47`) — och där stämmer formerna. Det är inte formen som är fel där, utan läsningen (T3).

**Åtgärd.** Skapa klienten utanför wrappern (en per test) och referera den direkt.
**Storlek:** S

---

### T9 — Grindtester som inte kontrollerar vad grinden läser
**Allvarlighet:** MEDEL

**Bevis.** `client/src/services/aiServerConsentGate.test.ts:24-37` — `stubSupabase` asserterar aldrig tabell eller kolumner. Art. 9-grinden är **fail closed**, så ett felstavat tabell-/kolumnnamn ger `{error}` → `lookup_failed` → **AI blockeras för alla användare**, tyst. Testsviten förblir grön eftersom fail-closed-testerna redan förväntar sig `lookup_failed`. Det är just den symmetrin som gör felet osynligt.

Samma mönster: `personalBrandAuditsApi.test.ts:9` (`from: () => ({ insert })` — tabellnamnet asserteras aldrig, och prod har **båda** `personal_brand_audit` och `personal_brand_audits`, 0 rader vardera, så ingen driftsignal); `userApi.test.ts:16` (ingen av 9 tester kontrollerar att det är `profiles` som läses).

**Positivt:** i övrigt är `aiServerConsentGate.test.ts` det starkaste testet i repot — det importerar den riktiga `client/api/ai.js` och testar fail-closed-policyn på riktigt. Och `consentHonesty.test.ts` läser locale-JSON direkt och vaktar UX18-texterna ordagrant. Båda är förebilder.

**Åtgärd.** Assertera `from('profiles')` + att `select` innehåller `ai_consent_at` och `ai_enabled`. Samma sak i de två andra filerna.
**Storlek:** S

---

### T10 — Övriga innehållslösa eller dubblerade tester
**Allvarlighet:** MEDEL/LÅG

| Fil:rad | Problem |
|---|---|
| `services/staAiApi.test.ts:85-97` | `it('B8: parsear en bar sektions-record (utan sections-wrapper)')` sätter `mockResolvedValue` två gånger med **identiskt** `{success:true, sections:{intro:{…}}}` (rad 86-89 och 91-94). Den avwrappade formen testas aldrig — testet är en dublett |
| `services/supabaseApi.test.ts:225-227` | `expect(result).toEqual(mockUpdatedCV)` — ingen kontroll av tabell, camelCase→snake_case-mappning eller `user_id`. Filen testar dessutom re-exporter som redan har starkare egna testfiler |
| `services/cacheService.test.ts:90-93` | Kommentaren erkänner osäkerhet (*"Förväntat: ~80% behålls … eller mindre"*); `expect(size).toBeLessThanOrEqual(5)` passerar även om trimmen tömmer hela cachen |
| `services/cloudStorage.test.ts:70` | `vi.mocked(window.localStorage.getItem).mockReturnValue(null)` kortsluter den nya backing-storen i `setup.ts:30-36` för hela filen — round-trip kan aldrig verifieras. `platsbankenApi.test.ts:37-49` visar det bättre mönstret |
| `services/interviewService.test.ts:6-12` | Mockar hela `./cloudStorage`; `create`-payloaden asserteras aldrig — ett kolumnnamnbyte passerar |
| `services/consultantService.test.ts:557-583` | `getAnalytics` asserterar tabellerna men aldrig `gte('created_at', …)` — filtret som gör `goalsCompletedThisMonth` till "denna månad" i stället för "någonsin" |
| `hooks/useKarriarHubSummary.test.ts:90-104` | Testnamnet säger *"query is disabled when userId is empty"* men `useAuth` är mockad till inloggad (rad 6-8) — tomt userId inträffar aldrig. Passerar med `enabled: !!userId` helt borttaget |
| `test/integration/auth-flow.test.tsx:152-161` | `expect(isAuthenticated).toBe(false)` — `beforeEach` (rad 44-51) sätter exakt de värdena. Testet asserterar sin egen setup |
| `test/integration/login-flow.test.tsx:88-117` vs `174-203` | Identiska tester, ord för ord, samma assertion |
| `hooks/useKarriarHubSummary.test.ts:45` vs `pages/hubs/__tests__/HubOverview.test.tsx:109` | `career_goals.shortTerm` är fritext (`'Senior dev'`) i den ena och enum-kod (`'career-change'` → etikett `'Byta karriär'`) i den andra. Fältet kan inte vara båda — en av fixturerna speglar inte prod |

**Åtgärd.** Punktfixar, en fil i taget. Den enda systemiska biten är fixturkonflikterna — se G-B.
**Storlek:** M totalt

---

### T11 — Integrationstesterna testar formulärbindning, inte inloggning/registrering
**Allvarlighet:** MEDEL

**Bevis.** `test/integration/register-flow.test.tsx:27-29` och `login-flow.test.tsx:29-31` mockar bort **hela** `authStore`. Det som verifieras är att `Register.tsx` skickar rätt payload till en mockfunktion (`register-flow.test.tsx:172-177`) — inte att registrering fungerar.

`auth-flow.test.tsx` är den enda som kör den riktiga storen mot mockad `supabase.auth` (rad 88-92) och därmed testar kedjan Login → authStore → felöversättning (rad 123-125). Ingen av dem rör databasen eller RLS.

**Åtgärd.** Behåll som formulärkontrakt, men täck de riktiga vägarna i e2e (se E-serien) — det är där RLS och triggers finns.
**Storlek:** M

---

### T12 — `setup.ts` saknar global `offsetParent`-shim
**Allvarlighet:** MEDEL (latent)

**Bevis.** Shimmen finns bara lokalt i `components/cv/CVOnboarding.test.tsx:30-36` (`get() { return this.parentNode }`, återställd rad 46). `useFocusTrap.ts:47` filtrerar på `el.offsetParent !== null`, och hooken används av 15 komponenter (`ConfirmDialog`, `JobDetailModal`, `ApplicationDetailModal`, `AddApplicationModal`, `EventModal`, `OnboardingModal`, `OnboardingFlow`, `QuestionCard`, `DocumentsSection`, `AlertsTab`, `ApplicationsContacts`, `JobSearch`, `useAccessibility` m.fl.). Ingen av dem har fokustester idag — men nästa som skrivs går grönt mot noll fokuserbara element om den inte råkar kopiera shimmen.

**Positivt:** `localStorage`-mocken i `setup.ts:30-36` är numera korrekt backad. Lärdomen 2026-08-04 är alltså implementerad.

**Åtgärd.** Flytta shimmen till `setup.ts` globalt, kommentera varför.
**Storlek:** S

---

## 2. Täckningsluckor på kritiska vägar (mätt)

Kommando: `CI=true npx vitest run --coverage` — 66 filer, 933 tester, alla gröna, 57-67 s.

### Globalt

| | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| Rapporterat (nuvarande config) | 20.97 | 56.49 | **23.48** | 20.97 |
| Trösklar (`vitest.config.ts:29-34`) | 18 | **60** | **30** | 18 |
| Baseline 2026-05-14 (kommentar i configen) | 20.09 | 64.27 | 34.75 | — |
| Med `dist/` + configfiler exkluderade (mätt om) | 21.29 | **60.34** | **26.81** | 21.29 |

Två slutsatser ur sista raden:
- **Branch-underskottet är ett artefaktfel.** Den egna `exclude`-listan i `vitest.config.ts:16-24` **ersätter** vitests default-excludes i stället för att komplettera dem, så `client/dist/assets/*` (238 minifierade filer i rapporten), `eslint.config.js`, `tailwind.config.js`, `vite.config.ts` och `postcss.config.js` räknas som 0 %. Rensat klarar branch tröskeln (60.34 ≥ 60).
- **Funktionsunderskottet är äkta.** 26.81 % = 499/1861 funktioner. Det saknas ~60 täckta funktioner för att nå 30 %. Trots att sviten vuxit 698 → 933 tester har funktionstäckningen fallit 34.75 → 26.81 (-8 pp), eftersom otestad kod tillkommit snabbare än tester.

### Per katalog (nuvarande config)

| Katalog | Stmts | Branch | Funcs |
|---|---|---|---|
| `client/src` (rot) | 73.45 | 90.24 | 60.00 |
| `client/src/config` | 80.00 | 100 | 0 |
| `client/src/data` | 79.57 | 38.88 | 23.07 |
| `client/src/pages` | 60.39 | 62.37 | **16.33** |
| `client/src/pages/hubs` | 59.77 | 58.22 | 80.00 |
| `client/src/styles` | 56.25 | 0 | 0 |
| `client/src/services` | 44.23 | 73.83 | 34.83 |
| `client/src/lib` | 38.53 | 74.41 | 28.94 |
| `client/src/stores` | 36.47 | 64.19 | 38.35 |
| `client/src/components` | 24.87 | 60.22 | 32.63 |
| `client/src/hooks` | **12.34** | 59.86 | 38.88 |
| `client/src/i18n` | 7.82 | 0 | 0 |
| `client/src/contexts` | 7.40 | 0 | 0 |
| `client/src/utils` | **4.68** | 66.66 | 21.42 |
| `client/src/pwa` | **0** | 0 | 0 |

### Kritiska flöden med **noll** täckning

**Rättighets- och säkerhetsnära (allvarligast):**
- `components/consent/` — **0 %**. `consentHonesty.test.ts` ligger i katalogen men läser bara locale-JSON; själva grindkomponenten (`WellnessConsentGate.tsx` m.fl.) renderas aldrig i test. Art. 9-grinden är däremot väl täckt på serversidan (`aiServerConsentGate.test.ts`, `client/api/ai.js`).
- `components/auth/` — 0 %
- `utils/security.ts` — 0 %, `utils/validation.ts` — 0 %, `utils/safeStorage.ts` — 0 %
- `pwa/serviceWorker.ts` — 0 %

**Konsulentvyn (portalens enda) — noll täckning i båda lagren:**
- `components/consultant/` — 0 %, `pages/consultant/` — 0 %. Enda skyddet är `consultantService.test.ts` (51 tester) — och det är just den filen som cementerar T1.

**Deltagarens huvudfunktioner utan täckning:**
`components/applications/` 0 · `components/interview/` 0 · `components/interest-guide/` 0 · `components/diary/` 0 · `components/profile/` (+`forms/`, `sections/`) 0 · `components/knowledge-base/` 0 · `components/settings/` 0 · `components/education/` 0 · `components/energy/` 0 · `components/wellbeing/` 0 · `components/focus/` 0-1.96 % · `pages/wellness/` (5 flikar, 1 974 rader) 0 · `pages/career/` 0 · `pages/international/` 0 · `pages/interest-guide/` 0

**Services under 15 %:** `attachmentsApi` 0 · `afJobEdApi` 0 · `aiCompanySearchApi` 0 · `bolagsverketApi` 0 · `calendarIntegration` 0 · `consultantInsights` 0 · `educationApi` 0 · `insightsService` 0 · `aiJobMatching` 0 · `aiPersonalization` 0 · `jobMatchingService` 0 · `learningService` 0 · `notificationsService` 0 · `offlineStorage` 0 · `promptGenerator` 0 · `scbSalaryApi` 0 · `staPdfExport` 0 · `jobMatching` 5.0 · `contentApi` 5.74 · `aiAssistantApi` 6.99 · `cvWordExport` 7.11 · `jobAlertEmailService` 8.8 · `placementsApi` 9.91 · `exportService` 10.27 · `retryService` 11.11 · `diaryApi` 11.18 · `activityApi` 11.76 · `afTrendsApi` 13.6

**Betalvägar:** finns inga — ingen Stripe/betalintegration i repot. Ingen lucka.

**Åtgärd (C1).** Fixa `exclude`-listan (spreada `coverageConfigDefaults.exclude`), sänk `functions` till mätt nivå + marginal, och höj den sedan per betald skuld — samma ratchet som de tre frysta taken. Prioritera nya tester på `components/consent`, `pages/consultant` och `utils/security|validation`.
**Storlek:** S (config) + L (tester)

---

## 3. E2E

### Vad som faktiskt körs

`npx playwright test --list --project=chromium` → **105 tester i 10 filer** (525 om alla fem browserprojekt räknas; CI kör bara `--project=chromium`).

| Spec-fil | Tester | Körs utan secrets | Skippas | Skipp-mekanism |
|---|---:|---:|---:|---|
| `smoke.spec.ts` | 6 | 6 | 0 | — |
| `regression-fas-a.spec.ts` | 5 | 5 | 0 | — |
| `auth.spec.ts` | 12 | 10 | 2 | `:84`, `:172` |
| `axe-a11y.spec.ts` | 19 | 10 | 9 | `:75` (hela auth-blocket) |
| `cv.spec.ts` | 13 | **0** | 13 | `:6` (i `beforeEach`) |
| `dashboard.spec.ts` | 19 | **0** | 19 | `:10` |
| `job-search.spec.ts` | 15 | **0** | 15 | `:5` |
| `cover-letter.spec.ts` | 10 | **0** | 10 | `:10` |
| `golden-path.spec.ts` | 3 | **0** | 3 | `:21`, `:72` |
| `sta.spec.ts` | 3 | **0** | 3 | `:36`, `:37`, `:84` |
| **Totalt** | **105** | **31** | **74** | |

`e2e-smoke` kör 11/11. **`e2e-authenticated` kör 20 av 94 — 74 skippas tyst, och de 20 som körs är enbart publika sidor** som `e2e-smoke` i praktiken redan täcker. Jobbet "E2E Authenticated (golden path)" testar noll inloggade flöden och rapporterar grönt.

**Övergripande kontextfynd:** CI sätter aldrig `PLAYWRIGHT_BASE_URL`, så `playwright.config.ts:80-85` startar `npm run dev:client`. **Alla e2e-tester i CI kör mot Vite-dev-servern** — inte mot den byggda artefakten, inte mot prod. Det gör två av tre "vakter" omöjliga att fälla (E3, E4).

---

### E1 — 57 tester laddar fel sida (HashRouter vs. `page.goto('/x')`)
**Allvarlighet:** KRITISK

**Bevis.** Appen använder `HashRouter` (`client/src/main.tsx:3, 96`). Men `cv.spec.ts:22,31,48,72,88,107,124,143,158,181,199,217`, `job-search.spec.ts:20,31,54,77,99,109,130,144,163,182,196,217,236,246`, `cover-letter.spec.ts:26,35,…` och `dashboard.spec.ts:16,26,35,…` — 40+ anrop — gör `page.goto('/cv')`, `/job-search`, `/cover-letter`, `/` **utan hash**.

Vite-dev serverar `index.html` för vilken path som helst, hashen blir tom → `App.tsx:232` index-route → `Navigate to="/oversikt"`. URL:en blir `http://localhost:5173/cv#/oversikt` och **sidan som renderas är Översikt, inte CV**. Värre: `cv.spec.ts:18` `expect(page).toHaveURL(/\/cv/)` matchar då *pathnamnet* och går grönt på fel sida.

`golden-path.spec.ts` och `fixtures.ts` gör det redan rätt (`/#/…`).

**Åtgärd.** Byt alla `goto('/x')` → `goto('/#/x')` och URL-assertions till `/#\/cv/`. **Gör detta före secrets läggs in** — annars blir jobbet grönt utan att ha testat något.
**Storlek:** S

---

### E2 — 74 tester skippas tyst; jobbet blir grönt-men-tomt utan signal
**Allvarlighet:** HÖG

**Bevis.** Tre skippvarianter, alla tysta: `test.skip(cond, msg)` på describe-nivå (golden-path, sta, axe, auth), `test.skip(...)` som första rad i `beforeEach` (cv `:6`, dashboard `:10`, cover-letter `:10`, job-search `:5`), och skip inne i en enskild test (`auth.spec.ts:84`). Playwright rapporterar skipped med exit 0. Enda varningen är kommentaren `ci.yml:249-252`, som ingen läser på en grön körning.

**Åtgärd.** Lägg ett test som **inte** skippar: `expect(process.env.TEST_USER_EMAIL).toBeTruthy()`. Eller ett bash-steg före som failar när `TEST_USER_EMAIL` är tomt. Grönt ska inte kunna betyda "täckt noll".
**Storlek:** S (+ Mikael lägger in secrets — kodsidan har varit klar sedan D1, 2026-07-10)

---

### E3 — Säkerhetsvakten för `upload-image` kan inte falla
**Allvarlighet:** KRITISK

**Bevis.** `regression-fas-a.spec.ts:24-36`:
```ts
expect([200, 401, 501]).toContain(response.status())
```
Testet är märkt CRITICAL i filhuvudet (`:4`) och ska skydda mot att `/api/upload-image` tappar sin Bearer-kontroll. Men CI kör mot Vite-dev-mocken (`client/vite.config.ts:22-23`), som **alltid** returnerar 200 — vilket är accepterat av assertionen. Vakten går grön oavsett vad produktionsendpointen gör.

**Åtgärd.** Kör detta test mot en deploy (`PLAYWRIGHT_BASE_URL=https://jobin.se` eller preview-URL) och assertera `toBe(401)`. Alternativt `.skip` när base-URL är localhost, så att grönt inte ljuger.
**Storlek:** S

---

### E4 — LCP-vakten (A4) är sann per konstruktion
**Allvarlighet:** HÖG

**Bevis.** `regression-fas-a.spec.ts:12-22` läser `page.content()` — den renderade DOM:en från dev-servern. Vite-dev genererar aldrig hashade chunknamn eller `<link rel="modulepreload">` för byggda vendorchunkar, så `expect(html).not.toContain('vendor-pdf-')` är sant oavsett. Vakten inspekterar aldrig `client/dist/index.html`. `preloadMatches` räknas dessutom bara och `console.log`:as — **det finns ingen assertion på antalet**, trots att kommentaren säger "Fas A reducerade från 7 till 0".

**Åtgärd.** Flytta vakten till ett nodetest som läser `client/dist/index.html` efter `npm run build` (`build`-jobbet finns redan som `needs:`). Assertera både frånvaron av `vendor-pdf-` och taket på antal modulepreloads.
**Storlek:** S

---

### E5 — SkillsGap-vakten (A2) går grön på exakt den krasch den vaktar
**Allvarlighet:** HÖG

**Bevis.** `regression-fas-a.spec.ts:74-83`:
```ts
expect(url).toMatch(/\/(login|skills-gap-analysis|landing|$)/i)
```
Vakten ska säkerställa att SkillsGap-routen inte kraschar (rules-of-hooks-buggen), men asserterar **bara URL:en**. Kastar komponenten vid mount renderar `RouteErrorBoundary` sitt fallback medan URL:en står kvar på `/#/skills-gap-analysis` → regexen matchar → **grönt på en kraschad sida**. Oautentiserad redirectas man dessutom till `/`, som matchar `$`-alternativet — vakten går grön utan att sidan ens laddats.

**Åtgärd.** `expect(page.locator('[data-testid="route-error-fallback"]')).toHaveCount(0)` + en positiv rubrikassertion, och kör inloggad.
**Storlek:** S

---

### E6 — STA-regressionsvakten är avstängd, och den vaktar fel sak
**Allvarlighet:** HÖG

**Bevis (a) — avstängd.** `sta.spec.ts:84` gatear konsulentvakten på `TEST_CONSULTANT_EMAIL`. Det secretet finns inte (`ci.yml:290-291` mappar det; jobbkommentaren `:251-252` säger att det är valfritt och saknas). **Vakten för den permanenta borttagningen av STA-konsulentvyn har aldrig kört.** Filhuvudet (`:79-81`) hävdar *"Testet körs oavsett om STA-modulen är påslagen igen"* — det stämmer för modulflaggan, men inte för credentials.

**Bevis (b) — fel sak.** `sta.spec.ts:95`: `await expect(page).not.toHaveURL(/konsulent\/steg-till-arbete/)` fångar bara att *just den URL:en* inte finns. Kommer STA-konsulentytan tillbaka som en flik i `/consultant` eller under `/consultant/sta` går vakten grön — och rad 100 (`getByRole('tablist')` på `/#/consultant`) blir till och med *mer* sann.

**Åtgärd.** Gör vakten credential-fri och statisk: ett vitest/node-test som asserterar att `client/src/App.tsx` inte innehåller `konsulent/steg-till-arbete` och att `pages/sta/StaConsultant.tsx` har noll importörer. Komplettera med en innehållsvakt: `/#/consultant` får inte innehålla någon flik/länk vars namn matchar `/steg till arbete|arbetsprövning/i`.
**Storlek:** S

---

### E7 — Golden path asserterar frånvaro, inte närvaro
**Allvarlighet:** HÖG

**Bevis.** `golden-path.spec.ts:14-18` — `expectPageAlive()` asserterar endast att `route-error-fallback` och texten `Laddar Jobin...` **saknas**. En vit sida, ett tomt `<main>`, en redirect till landing eller ett tomtillstånd passerar identiskt. Steg 1 (`/#/oversikt`), 2 (`/#/cv`), 4 (`/#/applications`) och 6 (`/#/profile`) har **ingen positiv assertion alls**; bara steg 3 (sökfält) och 5 (AI-sökning-knapp) verifierar något som faktiskt finns.

Golden path kan alltså gå grön medan fyra av sex kärnsidor renderar tomt — exakt buggklassen UX8 (`/#/jobb` nollade `/#/applications`) tillhörde.

**Åtgärd.** En `data-testid` eller rubrikassertion per steg — särskilt på `/#/applications`, där en räknare > 0 hade fångat UX8.
**Storlek:** S

---

### E8 — Ingen vakt för att hubbar rör andras React Query-cache-nycklar
**Allvarlighet:** MEDEL/HÖG

**Bevis.** Sökt i hela `e2e/` (inkl. `archive/`) och i `client/src`. **Ingen e2e finns** som navigerar `/#/jobb` → `/#/applications` och kontrollerar att ansökningarna överlever.

Det som finns är två **unit**-vakter: `hooks/useJobsokHubSummary.test.ts:95-102` och `hooks/useResurserHubSummary.test.ts:97-102`. De är skarpa till innehållet men (a) hook-specifika — en *ny* hub som skriver till en främmande nyckel fångas inte, (b) skörhetsproblemet i T8, (c) de kan inte fånga cross-page-effekten. `useKarriarHubSummary`, `useMinVardagHubSummary` och `useOversiktHubSummary` har ingen motsvarande vakt.

**Åtgärd.** Generisk grind — se **G-C**. Plus ett e2e-steg i golden-path: `/#/applications` → notera räknaren → `/#/jobb` → tillbaka → räknaren oförändrad.
**Storlek:** M

---

### E9 — Assertions inuti `if (await X.isVisible())` utförs aldrig
**Allvarlighet:** HÖG

**Bevis.** `cv.spec.ts:35,41,58,63,78,93,97,113,129,147,162,185`; `job-search.spec.ts:38,60,84,113,148,168,184,199,222`; `cover-letter.spec.ts:39,…`; `dashboard.spec.ts:158,…`. När elementet inte hittas gör testkroppen ingenting och testet passerar. Kombinerat med E1 (fel sida laddas) är i praktiken **varje** assertion i dessa fyra filer en no-op. `cv.spec.ts:123-138` ("CV Export"), portalens enda e2e-täckning av PDF-exporten, är ett rent no-op-skal.

`sta.spec.ts:60` visar det rätta mönstret — explicit skip med motivering.

**Åtgärd.** Ta bort `if`-skalen. Antingen ska elementet finnas (assertera) eller så ska testet skippa explicit.
**Storlek:** M

---

### E10 — Latenta URL-assertions som faller dag ett när secrets läggs in
**Allvarlighet:** MEDEL

**Bevis.** `auth.spec.ts:89, 93, 177`: `await expect(page).toHaveURL('/')` — Playwright löser mot baseURL till exakt `http://localhost:5173/`. Efter login är URL:en `.../#/oversikt`; `fixtures.ts:30-32` dokumenterar uttryckligen den redirecten och undviker den i sin egen `waitForURL`. Samma sak `auth.spec.ts:183`.

**Åtgärd.** `toHaveURL(/#\/oversikt/)`.
**Storlek:** S

---

### E11 — Brittiga textselektorer
**Allvarlighet:** MEDEL

**Bevis.** Sviten hänger nästan helt på svensk copy; endast `route-error-fallback` (`golden-path.spec.ts:16`, `sta.spec.ts:28`) använder `data-testid`. Exempel: `auth.spec.ts:10` `/välkommen tillbaka/`, `:163` `getByText('Logga in här')` (exakt sträng), `:201` `/stärk dina deltagare/` (marknadsföringscopy); `sta.spec.ts:48` `'Steg till arbete'`; `fixtures.ts:138` `'Laddar Jobin...'`, `:157` `/endast nödvändiga/`.

Konkret risk redan idag: `golden-path.spec.ts:65` matchar `/din vardag/i` — stämmer mot `sv.json:421` (`"Din vardag"`) men **inte** mot `navigation.ts:289` `fallbackLabel: 'Min vardag'`. Går i18n-laddningen fel blir testet rött utan att något är trasigt.

Rollbaserade selektorer används dock genomgående korrekt (`getByRole('tab'|'link'|'button'|'tablist')`) — det räddar sviten.

**Åtgärd.** `data-testid` för hub-nav, tabs och kritiska CTA:n. Behåll textmatchning bara där texten *är* det som testas.
**Storlek:** M

---

### E12 — Kärnflöden helt utan e2e

| Flöde | Status |
|---|---|
| **Samtycke/GDPR** | **Ingen.** Cookie-bannern *avfärdas* i `fixtures.ts:156-164` men testas aldrig. Art. 9-grinden, återkallande av samtycke och datadelning med konsulent (UX18, fixad 2026-08-04) har noll regressionsskydd. Allvarligast — det är en rättighetsgrind med fail-closed-policy |
| **Konsulentvyn `/consultant`** | Endast `golden-path.spec.ts:74-81`, som kräver saknade konsulent-secrets **och** bara kör `expectPageAlive`. Portalens enda konsulentvy är i praktiken otestad |
| **Registrering** | Endast "formuläret renderas" (`auth.spec.ts:141-151`). Inget submit-flöde |
| **Kontoradering** | Ingen |
| **Intervjusimulator / Intresseguide / LinkedIn / AI-team / Dagbok / Hälsa / Fokusläge** | Ingen |
| **Kompetensanalys** | Endast E5 — och den vakten är trasig |
| **CV → PDF** | Endast no-op-skalet `cv.spec.ts:123-138`. Riktig täckning finns i `e2e/cv-pdf-visual-audit.cjs` — manuellt verktyg, utanför CI |
| **Spontanansökan** | En knapp (`golden-path.spec.ts:51`). Mutationsflödet i `e2e/spontan-verify.cjs`, utanför CI |
| **Jobbsökning** | 15 tester som alla laddar fel sida (E1) och vars assertions är no-ops (E9) |

**Åtgärd.** Prioritera i ordning: samtycke/GDPR → `/consultant` → registrering. Det är de tre där ett tyst fel kostar mest (rättigheter, konsulentens arbete, ny användares första intryck).
**Storlek:** L

---

## 4. CI-grindarna

### Status idag (alla körda lokalt 2026-08-04)

| Grind | Kommando | Resultat |
|---|---|---|
| ESLint | `npm run lint:ci` | ✅ 0 errors, **127** warnings (tak 129) |
| Typecheck krasch | `npm run typecheck:critical` | ✅ |
| Typecheck-tak | `npm run typecheck:ceiling` | ✅ 468 fel, exakt på taket |
| Designskuld | `npm run lint:design` | ✅ 52 (baseline 52) |
| Schemadrift | `npm run lint:schema` | ✅ 717 filer, 135 tabeller / 84 RPC / 2 buckets |
| Tester + coverage | `npm run test:coverage` | ❌ **exit 1** |
| Build | `npm run build` | (blockerad av ovan i CI) |

---

### G4 — CI-jobbet `test` failar; fyra jobb nedströms körs aldrig
**Allvarlighet:** KRITISK

**Bevis.** `ci.yml:91-95` kör `npm run test:coverage` med `CI: true`, utan `continue-on-error`. Reproducerat två gånger:
```
$ CI=true npx vitest run --coverage
 Test Files  66 passed (66)
      Tests  933 passed (933)
ERROR: Coverage for functions (23.43%) does not meet global threshold (30%)
ERROR: Coverage for branches (56.4%) does not meet global threshold (60%)
EXIT=1
```
`ci.yml:125` — `build: needs: [lint-and-typecheck, test]`. `lighthouse:159 needs: build`, `e2e-smoke:210 needs: build`, `e2e-authenticated:256 needs: build`. **Alla fem jobben hoppas över.** Kvar som faktiskt körande skydd: `lint-and-typecheck` och `security`.

Alltså: de sex gröna grindarna ovan är de enda som skyddar main. Build, Lighthouse, hela e2e-sviten och coveragerapporten är avstängda — och har varit det sedan funktionstäckningen föll under 30 % (tröskeln sattes 2026-05-15 när baseline var 34.75 %).

**Åtgärd.** (1) Fixa `exclude`-listan i `vitest.config.ts:16-24` — spreada `coverageConfigDefaults.exclude` så `dist/` och configfiler inte räknas; det ensamt löser branch-tröskeln (60.34 ≥ 60). (2) Sänk `functions` till 26 (mätt: 26.81) i samma commit, med samma ratchet-kommentar som de tre frysta taken: sänk aldrig för att bli grön — höj när du betalar av. (3) Överväg att flytta coverage-tröskeln till ett eget jobb så att `build`/`e2e` inte gisslas av den.
**Storlek:** S

---

### G5 — Vad varje grind missar

| Grind | Blind fläck |
|---|---|
| `lint:ci` | `eslint.config.js:53` scopar reglerna till `**/*.{ts,tsx}`. **`client/api/*.js` (ai.js, cv-pdf.js, job-alerts.js, upload-image.js) får inga regler alls** — inklusive art. 9-grinden och rate-limitern. `supabase/functions/` (24 Deno-funktioner) likaså |
| `typecheck:critical` | Endast TS2304/TS2307. Allt annat passerar |
| `typecheck:ceiling` | **Räknar, fingeravtrycker inte.** Fixar man ett fel och inför ett nytt blir summan 468 och grinden grön. `tsconfig.app.json` har `"include": ["src"]` → `client/api/*.js` typkontrolleras inte alls |
| `lint:design` | Regexen är `bg-gradient-(to-[trbl]+\|radial)` på `.ts/.tsx` i `src/`. Missar **32 råa `linear-gradient`/`radial-gradient`**: `index.css` (20), `mobile.css`, `design-system.css`, `animations.css`, plus inline-style-gradienter i `PageHero.tsx`, `HubOverview.tsx`, `CVPreview.tsx`, `CVPrintLayout.tsx` (4), `ModernTemplate.tsx`. Baselinen "52" undertäcker alltså verkligheten. Grinden mäter dessutom bara gradienter — inte en enda av DESIGN.md:s övriga regler (hub-färg per sida, hero-läge, EmptyState-kontraktet, Voice & Tone) |
| `lint:schema` | Uttryckligen (`check-schema-drift.cjs:32-40`): kolumner i `.insert()/.update()`-objekt kontrolleras inte; dynamiska tabellnamn hoppas över; testfiler hoppas över. Dessutom implicit: **existens ≠ läsbarhet** (RLS modelleras inte), **existens ≠ innehåll** (`job_applications` finns och är tom), `.select('*')` + property-access är osynligt, och embedade relationer (`profiles:consultant_id(...)`) **strippas medvetet bort** i `columnsFromSelect` |
| `test:run` | Mockad Supabase-klient → varje tabell-, kolumn- och RPC-namn passerar. Fixturer definierar sanningen. Se hela §1 |
| `build` | Kör aldrig en fråga |

---

### G6 — Buggklassen som går rakt igenom alla sju
**Allvarlighet:** KRITISK (systemisk)

**"Objektet finns, typerna stämmer — men läsningen eller skrivningen ger inget i drift."**

Tre former, alla funna idag:

| Form | Fynd | Varför varje grind är blind |
|---|---|---|
| RLS blockerar läsningen | T2 (`profiles`-embed, 31 deltagare) | `lint:schema` kollar existens, inte policyer; testet mockar bort RLS |
| Kolumn saknas i en insert/update-payload | T1 (`consultant_participants.status`) | `check-schema-drift.cjs:36` undantar payloads uttryckligen; mocken accepterar allt |
| Kolumn finns inte men läses via `select('*')` + property-access | T4 (`interest_results.riasec_scores`) | Ingen sträng att matcha; fixturen uppfinner kolumnen |

Ingen av de sju grindarna kör någonsin en riktig fråga mot prod-schemat med en riktig roll. `lint:schema` kom närmast och stängde namnfelen — men den återstående klassen är precis den som gjort sig känd fyra gånger nu (`participant_consultants`, `participant_data_sharing`-kolumnerna, de elva fantomtabellerna, och nu T1/T2/T4).

**Sekundär klass:** "testet asserterar det trasiga beteendet" (T2, T3, och tidigare `useJobsokHubSummary`). Den fångas av ingen grind alls — bara av kodgranskning eller av en grind som mäter testernas *form* (G-B).

---

### Tre nya grindar — störst fångst per krona

#### G-A: Utöka `lint:schema` med payload-nycklar och embed-RLS
**Fångar:** T1, T2 — och hela den återkommande klassen ovan.

`check-schema-drift.cjs` går redan igenom varje `.from()`-kedja och har snapshoten inläst. Två nya pass i samma loop:

1. **Payload-nycklar.** För `.insert({…})` / `.update({…})` / `.upsert({…})` med **statiskt objektliteral** i kedjan: plocka toppnivånycklarna och flagga dem som saknas i `snapshot.tables[table]`. Dynamiska objekt (`.update(payload)`) hoppas över, precis som dagens skript hoppar över dynamiska tabellnamn — hellre tyst om det osäkra.
   *Mäter:* antal okända payload-nycklar. Skulle idag rapportera `consultant_participants.status` på `consultantService.ts:637`.
2. **Embed-RLS.** Lägg till en `policies`-sektion i `schema-snapshot.json` (`refresh-schema-snapshot.cjs` pratar redan med prod: `SELECT tablename, policyname, cmd, qual FROM pg_policies`). För varje embed i `.select('tabell:kol(...)')` — som `columnsFromSelect` idag strippar bort — slå upp den embedade tabellen och flagga när den saknar en SELECT-policy vars `qual` refererar `auth.uid() = id` eller motsvarande självreferens, utan explicit allowlist-post.
   *Mäter:* antal embeds mot tabeller som den anropande rollen inte kan läsa. Skulle idag rapportera `profiles:consultant_id` på `useMinVardagHubSummary.ts:59`.

**Storlek:** M (~150 rader i ett befintligt skript + en query i snapshot-refreshen)

---

#### G-B: Tautologi-lint på testsviten
**Fångar:** T6, T7, T10, E9 — och gör klassen "testet skulle passera om implementationen togs bort" mätbar.

Node-skript över `client/src/**/*.test.ts(x)` och `e2e/*.spec.ts`. Ett testblock (`it`/`test`) flaggas när **alla** dess assertions kommer ur en förbjuden mängd:
- `toBeDefined()`, `toBeTruthy()`, `toBeInTheDocument()`, `not.toBeNull()`
- `toHaveBeenCalled()` utan `With` / `toHaveBeenCalledTimes`
- `toBeGreaterThan(0)` på `.length` / `.innerHTML.length`
- **e2e:** assertions som ligger inuti `if (await X.isVisible())` eller `if (await X.count())` — de utförs villkorligt och räknas inte

Fryst tak i samma stil som de tre befintliga: skriptet skriver ut det nya talet när skulden minskar. Det gör "vi har 933 tester" till ett ärligt tal.

*Mäter:* antal assertionsfria testblock. Idag: minst 9 i `CVPage.test.tsx`, 33 i `nav-smoke.test.tsx`, ~30 i cv/job-search/cover-letter/dashboard-specarna.

**Storlek:** M

---

#### G-C: Query-key-ägarskap
**Fångar:** UX8-klassen generellt — i stället för dagens två hook-specifika unit-vakter, som dessutom är sköra (T8).

Node-skript som samlar varje `queryKey:` i `useQuery`/`useInfiniteQuery` (= ägaren) och varje `setQueryData(…)` (= skrivaren), resolvar nyckelkonstanter (`OVERSIKT_HUB_KEY` m.fl.) och **failar när en modul skriver till en nyckel vars `useQuery` ligger i en annan modul**, utan explicit allowlist-post med motivering.

*Mäter:* antal cross-modul-skrivningar. Idag: **1** (`useOnboardedHubsTracking.ts:47` → `OVERSIKT_HUB_KEY`, ägd av `useOversiktHubSummary.ts:59`). Den posten skulle behöva en allowlist-rad — och just den granskningen är vad som avslöjar T3.

**Storlek:** S/M

---

*Ej grindar men gör mest nytta snabbast:* fixa `page.goto('/x')` → `'/#/x'` (E1, 57 tester), och lägg in `TEST_USER_*`-secrets så `e2e-authenticated` slutar vara grönt-men-tomt (E2).
