# Arkitekturgranskning — Jobin/Deltagarportalen

**Datum:** 2026-08-09 · **HEAD:** `f2877dcb` · **Arbetsträd:** rent vid mätningen (`git status --porcelain` = 0 rader). *Not: efter mätningen dök `M client/api/ai.js` upp — en parallell agent arbetar i trädet. Siffrorna nedan gäller `f2877dcb`, och raderingspasset kan inte köras förrän trädet är tyst igen (skriptet vägrar).*
**Omfattning:** `client/src` (788 kod-/CSS-filer, 257 812 rader; 697 filer / 239 012 rader exkl. tester), `client/package.json`, routning, state-lagret, beroenden.

**Metod.** Nåbarhetsanalysen är körd om från `client/src/main.tsx` med det befintliga
`client/scripts/dead-code.cjs` (torrläge, ingenting ändrat). Skriptet löser `@/`-alias,
relativa sökvägar, `export * from`, dynamiska `import()`, `require()`, `vi.mock()` **och
CSS `@import`**. Ovanpå det har jag kört tre egna mätningar som skriptet inte gör:
en **export-nivå-analys** (§3 — vilka exporter i *levande* filer ingen levande
icke-testfil använder), en **länk-mot-route-matchare** (§4) och en **git-korsning**
av vilka commits som rört onåbara filer (§2). Skripten ligger i sessionens scratchpad.

---

## 1. Sammanfattning

1. **Dödkoden har inte minskat sedan 4 augusti — den har växt.** 182 onåbara icke-testfiler / **42 851 rader** (08-04: 175 / 41 878). Exkl. STA: **157 filer / 32 799 rader** mot 32 291. Ingenting av raderingspasset (C16) är utfört.
2. **Passet är nu blockerat av sitt eget skyddsnät.** `f2877dcb` rörde **15 onåbara filer** med aria-labels. Färskhetsgrinden flyttade därför **8 076 rader** från RADERA/ARKIVERA till UTRED. Varje mekaniskt svep över "hela `src/`" förlänger blockeringen med sju dygn.
3. **Ett andra lager dödkod är osynligt för filnivåanalysen:** **287 oanvända exporter i 92 levande filer**. `interviewService.ts` (539 rader) har 11 av 12 exporter utan levande läsare.
4. **40 länkar pekar på toppnivåer som inte har någon route** och sväljs tyst av catch-allen — `/jobs`, `/cv-builder`, `/spontaneous` m.fl., varav flera i levande UI.
5. **Routningen i sig är däremot ren:** noll nav-länkar utan route, noll dubblerade `memberPaths`. Och den dokumenterade cache-kollisionen `['application-stats']` är åtgärdad med regressionsvakt.
6. **C20 är orört:** exakt 64 direkta `.from()` i 14 konsulentfiler, samma siffra som 08-04.
7. **Största hävstången är fortfarande raderingspasset** — men fönstret måste skyddas (§9).

---

## 2. Numrerade fynd

### F1 — HÖG · Nåbarhetsläget: dödkoden har växt, inte krympt · Storlek M

Körd 2026-08-09 mot rent träd:

```
Filer i src (kod+css+json):     790
Nåbara från main.tsx:           517
Onåbara (exkl. testfiler):      182 filer / 42 851 rader
Testfiler totalt:               91
Tester som vaktar dödkod:       6

Grupp      Filer   Rader   varav test
RADERA        95   15 261            4
ARKIVERA      37   10 396            1
UTRED         27    8 076            0
BEHÅLL        29   10 480            1
```

| Mått | 2026-08-04 | 2026-08-05 | **2026-08-09** |
|---|---:|---:|---:|
| Filer i `src` | 750 | 783 | **790** |
| Nåbara från `main.tsx` | 510 | 517 | **517** |
| Onåbara icke-test, filer | 175 | 182 | **182** |
| Onåbara icke-test, rader | 41 878 | 42 823 | **42 851** |
| — varav STA (pausad) | 9 587 | 10 052 | **10 052** (25 filer) |
| — **varav INTE STA** | 32 291 | 32 771 | **32 799** (157 filer) |

**Premissen i ROADMAP C16 håller fortfarande, men siffran ska rättas:** raden säger
"32 291 rader odokumenterad dödkod". Rätt tal i dag är **32 799**. Andelen av
`client/src` (icke-test) är **17,9 %**.

De frysta taken, mätta med de riktiga verktygen (`node scripts/dead-code.cjs --tak`,
2026-08-09):

| Mått | Totalt | I dödkod | **Levande = nytt tak efter passet** |
|---|---:|---:|---:|
| strict-typfel | 468 | 105 | **363** |
| eslint-warnings | **128** | 31 | **97** |
| gradienter | 52 | 45 | **7** |

eslint-totalen har drivit 127 → 125 → **128** sedan 08-04. Taket är 129. **Marginalen
är en varning.** Nästa commit som lägger till två react-hooks-varningar fäller
`lint:ci` — och den enda åtgärden som ger luft är raderingspasset.

**Åtgärd:** kör passet. Rätta talet i C16 till 32 799 / 42 851.

---

### F2 — HÖG · Raderingspasset blockerar sig självt — sjätte träffen för A3-klassen · Storlek S (process)

`f2877dcb` (2026-08-05, "WCAG-namn m.m.") ändrade **112 filer i `client/src`**. Av dem
är **15 onåbara från `main.tsx`** — 58 rader betalt arbete som ingen användare kan se:

```
 18  components/jobs/CRMTab.tsx                      3  components/interview/MockInterviewSession.tsx
 11  components/jobs/JobFilters.tsx                  3  components/jobs/ShareJobDialog.tsx
  4  components/common/Autocomplete.tsx              1  components/NotificationsCenter.tsx
  4  components/cover-letter/CoverLetterApplications.tsx   1  components/cv/JobMatcher.tsx
  3  components/calendar/MoodTracker.tsx             1  components/cv/KeywordMatcher.tsx
  3  components/cv/CVOptimizer.tsx                   1  components/map/SwedenMap.tsx
  3  components/cv/CVShare.tsx                       1  components/wellbeing/MoodCheck.tsx
                                                     1  pages/wellness/EnergyTab.tsx
```

Diffen är mekanisk — t.ex. `components/map/SwedenMap.tsx:355`
`+ aria-label="Sortera regionlistan"` på en `<select>` i en komponent med noll
referenser i hela repot. Commit-meddelandet skriver själv "10 [fält] i dödkod", så
det var känt; svepet kördes ändå över dem.

**Den nya skadan är inte de 58 raderna — det är att grinden gick igång.**
`dead-code.cjs` klassar allt som rörts i git de senaste 7 dygnen som UTRED. Effekten:

| Grupp | 2026-08-05 | **2026-08-09** | Δ |
|---|---:|---:|---:|
| RADERA | 104 filer / 17 839 | 95 / **15 261** | −2 578 |
| ARKIVERA | 39 / 11 143 | 37 / **10 396** | −747 |
| **UTRED** | 16 / 4 723 | 27 / **8 076** | **+3 353** |

11 filer flyttades ut ur passet. **Raderingsfönstret öppnar tidigast 2026-08-12**, och
varje nytt "svep över hela `src/`" (WCAG, i18n, lint, typskuld) skjuter det sju dygn
till. Det är en självförstärkande loop: dödkoden är stor → mekaniska svep träffar den
→ färskhetsgrinden fryser passet → dödkoden förblir stor.

**Åtgärd (två delar, båda små):**
1. **Kör passets steg 1–2 (barrels + hooks) omedelbart** — de 21 barrel-filerna och
   `hooks/`-underträdet ligger inte i UTRED och är inte rörda.
2. **Ge mekaniska svep en dödkodsfilter-flagga.** Ett svep ska läsa
   `dead-code.cjs --json` och hoppa över allt utanför de 517 nåbara filerna. Utan det
   är D16:s nåbarhetsgrind bara en detektor, inte ett skydd.

---

### F3 — HÖG · Ett andra lager dödkod: 287 oanvända exporter i 92 levande filer · Storlek M

Filnivå-nåbarhet är uttömd som mätmetod. Nästa lager ligger *inuti* levande filer.
Mätt med helordssökning per export, där **döda filer inte räknas som användare**
(annars maskerar dödkod dödkod — samma fälla som barrel-filerna, ett steg ned):

| Antal | Fil (rader) | Oanvända exporter |
|---:|---|---|
| 13 | `services/afTaxonomyApi.ts` (324) | `taxonomyApi:299`, `searchOccupations:111`, `getSkillsForOccupation:165`, … — enda levande importör är `components/occupation/OccupationPicker.tsx:18` som tar `autocompleteOccupations`. Resten hölls vid liv av döda `SkillSuggestions.tsx` och `EducationPathFinder.tsx` |
| 11 | `services/interviewService.ts` (539) | `COMMON_INTERVIEW_QUESTIONS:54`, `MOCK_INTERVIEWS:182`, `analyzeStarAnswer:230`, `createInterviewPlan:301`, … — enda levande läsare är `pages/InterviewSimulator.tsx:15` (`saveSimulatorSession`). **~450 av 539 rader är dead-in-practice** |
| 11 | `lib/validators.ts` (269) | `validateEmail:60`, `validatePhone:38`, `validateForm:222`, `sanitizeHtml:21`, … — levande användning är bara `validateTextLength`, `sanitizeInput`, `validateTag` |
| 10 | `pages/sta/enrollmentDisplay.ts` | STA (pausad) |
| 9 | `data/pageTabs.ts` | se F5 |
| 8 | `hooks/knowledge-base/useArticles.ts` | `useArticle`, `useBookmarks`, `useToggleBookmark`, `useSaveProgress`, … — hela hook-familjen |
| 8 | `services/interestPersonalization.ts` (442) | `personalizeArticles:191`, `getCoverLetterTips:353`, … |
| 7 | `services/educationApi.ts` (379) | `searchEducations:136`, `getEducationsForRIASEC:305`, … |
| 6 | `services/cloudStorage.ts` (2 580) | `dashboardPreferencesApi:403`, `moodHistoryApi:573`, `journalApi:622`, `notificationsApi:854`, `draftsApi:962`, `platsbankenApi:1171` |
| 6 | `services/jobAlertEmailService.ts` (252) | hela filen utom typerna |
| 6 | `lib/supabase.ts` | `upsertCV:257`, `getCoverLetters:266`, `subscribeToCVUpdates:288`, … |
| 5 | `stores/authStore.ts` | `useActiveRole:506`, `useUserRoles:510`, `useHasRole:528`, `useIsSuperAdmin:533`, `useIsAdmin:534` |
| 5 | `stores/profileStore.ts` | `useProfileData:483` … `useSetActiveTab:490` |

**Totalt 287 exporter i 92 filer.** Detta är inte samma sak som 287 raderbara block —
en del är avsiktlig publik yta och några används bara av tester (utmärkta i mätningen).
Men de tre översta posterna är hela moduler som överlever på en enda import.

**Varför det spelar roll nu:** när C16 raderar `SkillSuggestions.tsx`,
`InterviewPrep.tsx`, `MockInterviewSession.tsx` och `EducationPathFinder.tsx`
blir `afTaxonomyApi`, `interviewService` och delar av `educationApi` **ännu mer**
föräldralösa — men filerna blir aldrig onåbara, så nåbarhetsgrinden ser dem aldrig.

**Åtgärd:** kör export-analysen som ett andra steg **efter** C16 och bunta ihop den med
raderingen. Överväg `eslint-plugin-unused-imports`/`knip` som permanent grind med fryst
tak — samma modell som de tre befintliga taken.

---

### F4 — HÖG · 40 länkar till toppnivåer utan route — catch-allen sväljer dem tyst · Storlek S

`App.tsx:298` har `<Route path="*" element={<Navigate to="/" replace />} />`. En länk
till en okänd sökväg ger därför **ingen 404 och inget fel** — bara en oförklarad
teleportering till Översikt. Matchat samtliga `navigate()`, `<Link to>`, `path:` och
`href:` i levande filer mot de 46 toppnivåsegment som faktiskt har route:

| Länk | Ställe | Bedömning |
|---|---|---|
| `/jobs` | `components/interest-guide/CareerRecommendationsPanel.tsx:312` ("Se lediga jobb") | **Skarp.** Hubben heter `/jobb`. Knappen är synlig i Intresseguidens rekommendationspanel |
| `/jobs?tab=saved` | `components/knowledge-base/tabs/MyJourneyTab.tsx:284` ("Visa alla" sparade jobb) | **Skarp.** Samma fel |
| `/cv-builder` | `components/profile/CareerTimeline.tsx:249` (tomtillståndets enda CTA) | **Skarp.** Routen är `/cv`. Detta är en `<EmptyState>`-liknande CTA — exakt buggklassen UX15 åtgärdade på ett annat ställe |
| `/spontaneous` | `data/coaches.ts:360` (coach-widgetens länklista) | Routen är `/spontanansökan` |
| `/quests` | `data/dashboardTabs.ts:15` | Nås bara via `/dashboard` som redirectar → dead-in-practice, men datat ljuger |
| `/job-tracker` | `data/pageTabs.ts:60` | Skuggad, se F5 |
| `/knowledge/<slug>` ×15 | `services/articleData.ts:10377, 10710, 11032, 11288, 11650, 11954, 11955, 12309, 13091, 13092, 13505, 13934, 14673, 14823, 15104` | Rätt form är `/knowledge-base/article/:id`. Renderas som `<Link to={action.href}>` i `pages/Article.tsx:390` |
| `/fonts/*.woff2`, `/sta/*.pdf` | `FontProvider.tsx:91-92`, `pages/sta/mockData.ts:139` | Falska positiva (statiska assets / STA-mockdata) |

De 15 i `articleData.ts` är samma klass som minnesnoteringen *"en Set av route-strängar
är ingen routematchare"* — `client/scripts/apply-article-corrections.cjs` har redan en
riktig matchare, men den har uppenbarligen inte körts över `action.href`-fältet.

**Åtgärd:** rätta de fyra skarpa länkarna (S). Lyft sedan matcharen ur
`apply-article-corrections.cjs` till en **CI-grind över hela `src`** — `prerender-guides.cjs`
har redan `validateRoutes(APP_TSX)` för guidesidornas CTA:er, men appens egna länkar
har ingen motsvarighet. Byt slutligen catch-allen mot en riktig 404-sida i dev
(`import.meta.env.DEV`) så klassen blir synlig när den uppstår.

---

### F5 — MEDEL · `data/pageTabs.ts` är nåbar men skuggad — flikdefinitioner som ingen renderar · Storlek S

`data/pageTabs.ts` (9 oanvända exporter) konsumeras av `components/layout/PageLayout.tsx:61`
via `getTabsForPath()`. Men:

- `jobSearchTabDefs` (`pageTabs.ts:58`) **skuggas av en lokal definition** i
  `pages/JobSearch.tsx:46` med samma namn. Sidan använder sin egen; `pageTabs.ts`-versionen
  — och därmed dess `/job-tracker`-länk — renderas aldrig.
- `dashboardTabs` (via `data/dashboardTabs.ts`) returneras bara för `path.startsWith('/dashboard')`
  (`pageTabs.ts:142`), och `/dashboard` redirectar till `/` (`App.tsx:294`). Grenen är oåtkomlig.
- `dashboardNavTabDefs`, `cvBuilderTabDefs`, `profileTabDefs`, `resourcesTabDefs` + deras
  `*Tabs`-varianter har noll levande läsare.

**Åtgärd:** rensa `pageTabs.ts` till det `getTabsForPath` faktiskt returnerar, ta bort
`data/dashboardTabs.ts` och `/dashboard`-grenen. Byt den lokala definitionen i
`JobSearch.tsx:46` mot import — eller ta bort den delade. Två definitioner med samma
namn där den ena är död är exakt det B1-mönster granskningen 08-04 varnade för.

---

### F6 — MEDEL/HÖG · Två parallella auth-implementationer, båda levande · Storlek M

| Implementation | Rader | Konsumenter | Mekanism |
|---|---:|---:|---|
| `stores/authStore.ts` (Zustand) | 552 | **63 filer** | `initialize()` anropad från `App.tsx:184` |
| `hooks/useSupabase.ts` → `useAuth()` | 121 (filen) | 6 | **egen** `supabase.auth.onAuthStateChange` (`useSupabase.ts:32`) |

`useAuth()` används av `useJobsokHubSummary.ts:2`, `useKarriarHubSummary.ts:2`,
`useMinVardagHubSummary.ts:2`, `useOversiktHubSummary`, `useResurserHubSummary` och
`useOnboardedHubsTracking.ts:3` — alltså av **hela hub-sammanfattningslagret**, den kod
som driver startsidan.

Det innebär två prenumerationer på samma auth-ström, två egna `useState`-kopior av
`user`/`profile`, och två tidpunkter då `user.id` blir tillgängligt. Hub-hooksen kan
alltså se en annan inloggningsstatus än resten av appen under de första
renderingarna — samma familj som `['application-stats']`-buggen, men på auth-nivå
i stället för cache-nivå.

`useCV` i samma fil är dessutom **död**: enda exportvägen är `hooks/index.ts:7`, som
har noll importörer. Filkommentaren `useSupabase.ts:1-5` påstår att `useCV` används av
`useAITeamContext` — det stämmer inte, `hooks/useAITeamContext.ts` importerar den inte.

**Åtgärd:** låt hub-hooksen läsa `useAuthStore(s => s.user)`. Radera `useCV` med
`hooks/index.ts`. Rätta filkommentaren. (M — sex filer, men beteendekänsligt: testerna
mockar `useAuth`, så mockarna måste flyttas i samma commit.)

---

### F7 — MEDEL · 21 döda barrel-filer står kvar och gömmer allt annat · Storlek S

Oförändrat sedan 08-04. `hooks/index.ts` (58 rader) håller ensam ~2 650 rader vid liv
för varje vanlig importsökning; `components/{jobs,cv,cover-letter,coverletter,dashboard,
consultant,chat,analytics,market,video,voice,wellbeing,ai-team,applications,energy,
notifications}/index.ts` + `contexts/`, `data/`, `styles/`, `utils/index.ts` gör samma
sak för sina underträd. Sammanlagt 183 rader.

**Detta är den enda åtgärden i hela rapporten som är helt riskfri och samtidigt
förändrar vad nästa granskning kan se.** Ingen av dem ligger i UTRED — de går att
radera i dag: `node scripts/dead-code.cjs --skriv --steg=barrels`.

---

### F8 — MEDEL · De största onåbara blocken — och vad de är · Storlek varierar

| Rader | Block | Klass | Motivering |
|---:|---|---|---|
| 10 052 | `pages/sta/*` + `staPdfExport.ts` + `staAiApi.ts` (25 filer) | **BEHÅLL** | Pausad modul, beslut 2026-08-03. Rör inte. Bär ensam `xlsx`, `pdf-lib`, `papaparse` (F18) |
| 4 716 | `components/cv/` (14 filer) | **RADERA/ARKIVERA** | Varav `templates/CVTemplates.tsx` 1 904 (F10, arkivera) och `CVSaveTest.tsx` 175 — en felsökningskomponent som skriver mot Supabase och ligger i produktionskällkod |
| 3 316 | **hela `components/dashboard/`** (17+2 filer) | **ARKIVERA** | Rest av widget-systemet (C1/C10). Mönstret finns i `archive/2026-07-widget-system-gen2/`. Radera + rätta `CLAUDE.md` i samma commit |
| 2 879 | `components/jobs/` (9 av 13 filer) | **RADERA** utom jobbdelningen | Gammal jobbvy via död barrel. `MatchesTab`, `AlertsTab`, `DailyJobTab` är levande och rörs inte |
| 1 987 | `components/consultant/` (7 filer) | **ARKIVERA** | Konsulentvyn är under aktiv utveckling — arkivera hellre än radera |
| 1 751 | `components/focus/FocusGuide.tsx` + `steps/` | **ARKIVERA** | Äldre fokusguide-generation. Konkret risk: den som söker "fokus-CV" träffar `steps/FocusCV.tsx` (554) före levande `components/cv/FocusCVBuilder.tsx` (830) |
| 1 351 | Energifunktionen (`EnergyTab` 330, `EnergyLevelSelector` 460, `MobileEnergySelector` 276, `energyStoreWithSync` 226, `useEnergyLevel` 60) | **BORDE MONTERAS ELLER ARKIVERAS** | Färdig, komplett, helt onåbar. ROADMAP C19 — produktbeslut |
| 1 071 | `learningService.ts` 550, `afEnrichmentsApi.ts` 320, `afJobEdApi.ts` 201, `useLearning.ts` 120 | **UTRED** | Klientsidan av C4:s callerlösa edge-funktioner, låst av det pausade EU-spåret |
| 967 | `components/cover-letter/` (via död barrel) | **RADERA** | `CoverLetterStatistics.tsx` 392, `CoverLetterApplications.tsx` 401 (rörd av UX15 — dokumenterat A3-fall) |
| 946 | `components/ui/` — `Tabs` 293, `Avatar` 199, `Badge` 168, `LanguageSelector` 112, `MemoizedButton` 110, `QuickActions` 64 | **RADERA** | Levande motsvarigheter: `layout/PageTabs`, `ai-team/AgentAvatar`, `ai/AIBadge` |
| 792 | Jobbdelning deltagare↔konsulent (`jobSharingService` 293, `ShareJobDialog` 228, `IncomingSharedJobs` 272) | **BORDE MONTERAS ELLER ARKIVERAS** | ROADMAP C19 |
| 791 | `data/helpContent.ts` | **ARKIVERA** | Redaktionellt innehåll värt att behålla |
| 700 | Notiscentret (`notificationsService` 365, `NotificationsCenter` 335) | **UTRED** | ROADMAP H12. Klockan är monterad, tabellen tom, levande vägen är `useNotifications` |
| 620 | `components/interview/` (3 filer) | **ARKIVERA** | Levande `InterviewPrep` finns i `components/calendar/` |
| 596 | `hooks/useUnifiedProgress.ts` | **RADERA** | UX8 betalade arbete här 2026-07-28 |
| 470 | `components/map/SwedenMap.tsx` | **ARKIVERA** | Komplett, noll referenser — och fick en aria-label 08-05 (F2) |

**Sammanfattat per klass:** ~15 300 rader ren radering, ~10 400 arkivering,
~3 900 rader väntar på produktbeslut (energi 1 351 + jobbdelning 792 + notiser 700 +
learning 1 071), 10 052 rader pausad STA som ska stå orörd.

---

### F9 — MEDEL · `components/dashboard/` är fortfarande dött och `CLAUDE.md` har bara halvrättats · Storlek S

Alla 17 icke-testfiler + testet + snapshoten saknar väg till `main.tsx`.
`CLAUDE.md` § Komponentkatalog är rättad så att katalogen märks "⛔ HELA KATALOGEN ÄR
DÖD", men listar samtidigt `Badge, Avatar, Tabs, LanguageSelector, Skeleton` under
`ui/` som "döda". Det är korrekt i dag men blir fel så fort filerna raderas — raden
ska bort helt då, inte flyttas. `components/ui/MemoizedButton.tsx` (110) och
`components/ui/QuickActions.tsx` (64) saknas dessutom i listan.

`NextStepCard.tsx` bär enligt ROADMAP 19 av de 94 råa i18n-nycklarna, och
`WellnessQuickCard.tsx` 2 av 52 gradienter — båda taken städas alltså av samma commit.

---

### F10 — MEDEL · Ett eslint-undantag skyddar 1 904 rader dödkod · Storlek S

`components/cv/templates/CVTemplates.tsx` (1 904 rader) har som enda importör
`components/cv/index.ts` (7 rader, noll importörer). Filen bär **43 av 52 gradienter**
och är uttryckligen whitelistad i `client/eslint.config.js:103–109` med motiveringen
"CV-mall-thumbnails (DESIGN.md §6 — dekorativa)", samt beskriven som medvetet undantag
i `docs/DESIGN-DEBT.md:22,33,38`.

Den levande mallmotorn är `components/cv/templates/index.ts` + de tolv
`*Template.tsx`-filerna och berörs inte.

Efter arkivering: gradientskulden är **7** (4 i `styles/design-system.ts`, 3 i
`pages/Landing.tsx`), båda dokumenterade undantag. Taket kan sättas till 7 och
whitelistningen tas bort.

**Sidonot om grindens täckning:** `check-design-debt.cjs` räknar bara `.ts`/`.tsx`.
Det finns 3 gradienter till i `styles/accessibility.css` som grinden aldrig ser — och
den filen är levande (importerad via CSS `@import` från `index.css:19`). Ingen åtgärd,
men grinden mäter inte det den ser ut att mäta.

---

### F11 — MEDEL · 3 913 rader färdig funktionalitet väntar på ett beslut som inte fattats · Storlek — (beslut)

Oförändrat sedan 08-05. Energifunktionen (1 351), jobbdelning deltagare↔konsulent (792),
notiscentret (700) och `learning-*`-klienten (1 071). Alla fyra ligger i UTRED och
skriptet rör dem aldrig.

Det här är den enda posten i rapporten som **inte** går att lösa med arbete — den
kräver fyra ja/nej från Mikael. Så länge de är obesvarade kan raderingspasset inte
avslutas, och 3 913 rader fortsätter belasta typkontroll, lint och testsvit.

---

### F12 — HÖG · C20 orört: 64 direkta `.from()` förbi konsulentens eget servicelager · Storlek M

Exakt samma siffra som 08-04, mätt med samma uttryck (`\.from\('[a-z_]+'\)` i `.tsx`
under `pages/consultant/` och `components/consultant/`):

```
11  pages/consultant/ResourcesTab.tsx        5  components/consultant/InviteParticipantDialog.tsx
10  pages/consultant/SettingsTab.tsx         2  components/consultant/{ReportDraft,MeetingScheduler,GroupMessage,GoalCreation}Dialog.tsx
 8  pages/consultant/CommunicationTab.tsx    1  pages/consultant/ParticipantsTab.tsx
 7  pages/consultant/AnalyticsTab.tsx        1  components/consultant/ConsultantRequestBanner.tsx
 6  pages/consultant/ParticipantDetailPage.tsx   1  components/consultant/BulkActionsDialog.tsx
 6  pages/consultant/OverviewTab.tsx
```

14 filer, 64 anrop, medan `services/consultantService.ts` (687 rader) finns som avsedd
yta. D11:s auth-guards och B5:s ärliga felhantering täcker alltså ungefär en tredjedel
av konsulentvyn. Av hela `client/src` görs 88 `.from('…')` direkt i `.tsx` — **73 % av
dem sitter i konsulentmodulen.**

**Åtgärd:** oförändrad rekommendation — flytta per rörd flik, inte som block, och sätt
regeln "ny konsulentkod importerar inte `supabase` direkt". 31 `.tsx`-filer importerar
i dag `@/lib/supabase`; en eslint-`no-restricted-imports` med fryst tak på 31 skulle
göra regeln mekanisk i stället för kulturell.

---

### F13 — MEDEL · Datumformatering är implementerad 15 gånger · Storlek S

127 `toLocaleDateString`/`toLocaleTimeString`-anrop i 79 filer. 15 lokala
`formatDate`-implementationer i levande kod:

```
components/cover-letter/CoverLetterMyLetters.tsx:229   components/profile/ProfileSharing.tsx:120
components/cover-letter/CoverLetterPDF.tsx:28          components/settings/DeleteAccountSection.tsx:233
components/cv/MyCVs.tsx:233                            pages/AiPolicy.tsx:50
components/profile/CareerTimeline.tsx:114 + :119       pages/Privacy.tsx:52
components/profile/DocumentsSection.tsx:149            pages/SharedProfile.tsx:53
components/profile/ProfileHistory.tsx:49               pages/Terms.tsx:8
pages/interest-guide/HistoryTab.tsx:74                 pages/consultant/CommunicationTab.tsx:92 (relativ)
```

`date-fns` finns i `package.json` och importeras av **tre** filer
(`NotificationBell.tsx`, `VisibilityTab.tsx`, `pdfReportGenerator.ts`).

Konsekvensen är inte prestanda utan **inkonsekvent språk och format**: varje
implementation väljer sin egen locale-hantering, och i en portal med sv/en betyder det
att datum kan visas på svenska i en vy och engelska i nästa. `services/calendarData.ts:208`
har redan en exporterad `formatTime` — men den har noll levande läsare (F3).

**Åtgärd:** en `lib/datetime.ts` med `formatDate`/`formatDateRange`/`formatRelative`
som tar `i18n.language`, och byt de 15 vid nästa beröring. S per fil.

---

### F14 — MEDEL · `services/supabaseApi.ts` — en migrering som stannade halvvägs · Storlek M

768 rader, varav toppen är re-exporter (`cvApi`, `userApi`, `jobsApi`, `savedJobsApi`,
`jobAlertsApi`, `interestApi`, `coverLetterApi`, `activityApi`, `APIError`, `handleError`).
Filens egen kommentar (rad 14–19) beskriver splittringen 2026-05-09 som en "gradvis
migration" där callers ska byta till direktimport.

Femton månader senare importerar merparten fortfarande typerna därifrån
(`CVData`, `Skill`, `Education`, `CoverLetter`, `ProfilePreferences`, `WorkExperience`).
Det gör filen till en de facto barrel — den enda i repot som **inte** är död, och
därför också den som gör att `cvApi` m.fl. aldrig kan tree-shakas bort från en caller
som bara vill ha en typ.

Filen har dessutom två egna oanvända exporter: `authApi:174` (endast test) och
`exerciseApi:319`.

**Åtgärd:** flytta typerna till `types/` och låt `supabaseApi.ts` dö. Det är den sista
barrelen, och den bär samma risk som de 21 döda: nästa nåbarhetsanalys ser den som
levande och missar vad den håller uppe.

---

### F15 — MEDEL · Fem parallella PDF-vägar (oförändrat) · Storlek L om de ska enas — **ena inte nu**

`services/pdfExportService.ts` (1 620) · `pdfReportGenerator.ts` · `pdfLazyLoad.ts` ·
`cvWordExport.ts` · `components/cover-letter/CoverLetterPDF.tsx` (`@react-pdf/renderer`) ·
`components/cv/CVPrintLayout.tsx` + `client/api/cv-pdf.js` (puppeteer), samt två döda
(`staPdfExport.ts` 372, `assessmentPdfExport.ts` 615, `PagedCVPrint.tsx` 308).

I1:s slutsats står fast (`@react-pdf/renderer` bär svensk typografi som `jspdf` inte
klarar) och ska inte rivas upp. Rätt riktning för en framtida konsolidering är
serverrendering via `api/cv-pdf.js`, som kostar klienten 0 kB — inte ett bibliotek.
`pdfLazyLoad.ts` har alla tre exporter oanvända (F3), vilket antyder att en av de fem
vägarna redan är avvecklad utan att ha städats bort.

---

### F16 — MEDEL · Två renderingssystem med varsin designdefinition · Storlek M

Sedan K1–K6 finns en andra, statisk rendering vid sidan av SPA:n:

```
client/scripts/prerender-guides.cjs        163 rader
client/scripts/lib/guide-template.cjs      675   ← egen HTML + egen CSS
client/scripts/lib/guides.cjs              225
client/scripts/lib/markdown.cjs            258
client/scripts/lib/related.cjs             269
client/scripts/generate-sitemap.cjs         87
                                         1 677 rader
```

`guide-template.cjs:26–31` definierar **18 hårdkodade färgliteraler** (light + dark)
som är handkopierade ur `src/styles/tokens.css` (70 literaler). Kommentaren på rad 18
säger uttryckligen "hämtade ur src/styles/tokens.css". Ingen grind kopplar ihop dem:
`lint:design` läser bara `.ts`/`.tsx` under `src/`, så en tokenändring i portalen
driver isär de 133 publika sidorna utan att något larmar. Samma sak för
Voice & Tone och komponentmönster — guidesidorna kan aldrig återanvända
`components/ui/`.

Det är **inte fel arkitektur** (HashRouter gör prerendering nödvändig, och sidor som
renderar utan JS är rätt för målgruppen), men det är ett andra designsystem med noll
kopplingar till det första.

**Åtgärd (S):** generera CSS-variabelblocket i `guide-template.cjs` **ur**
`tokens.css` vid byggtid i stället för att kopiera det. Då blir de 18 literalerna en
härledning, inte en dublett.

---

### F17 — MEDEL · De 15 största filerna — bara tre bör delas · Storlek M för de tre

| # | Fil | Rader | Bedömning |
|---:|---|---:|---|
| 1 | `services/articleData.ts` | 24 865 | **Dela inte.** Ren datafil, lazy-laddad. Men den bär 15 döda länkar (F4) och 7 oanvända exporter (F3) |
| 2 | `data/exercises.ts` | 5 073 | **Dela inte.** Samma skäl |
| 3 | `pages/ExternalResources.tsx` | **3 600** | **JA — högsta prioritet.** Största levande sidan. JSX-array av innehåll; bryt ut datat till `data/`, mönstret finns |
| 4 | `services/interestGuideData.ts` | 3 318 | Dela inte — men bär 21 strict-typfel. Datat är feltypat, inte för stort |
| 5 | `pages/sta/StaConsultant.tsx` | 3 020 | **Rör inte** — pausad modul |
| 6 | `pages/sta/StaParticipant.tsx` | 2 727 | Pausad (men **nåbar** i grafen — `App.tsx:82/284`, gate:ad vid rendering) |
| 7 | `services/cloudStorage.ts` | **2 580** | **JA.** Blandar domäner och har 6 oanvända export-API:er (F3). Dela per domän och ta bort de döda i samma svep |
| 8 | `components/cv/templates/CVTemplates.tsx` | 1 904 | **Arkivera** (F10) |
| 9 | `services/pdfExportService.ts` | 1 620 | Se F15. 14 typfel |
| 10 | `services/careerApi.ts` | 1 414 | Gränsfall. 2 oanvända exporter |
| 11 | `pages/CVBuilder.tsx` | **1 345** | **JA.** 32 strict-typfel (flest i repot), står utanför `PageLayout`, bar både UX16 och I2. Den fil där storleken bevisligen kostat buggar |
| 12 | `pages/Resources.tsx` | 1 321 | Gränsfall; innehållsarrayer inbakade |
| 13 | `pages/consultant/ResourcesTab.tsx` | 1 309 | 11 direkta `.from()` (F12) |
| 14 | `pages/JobSearch.tsx` | 1 309 | Gränsfall. Skuggar `jobSearchTabDefs` (F5) |
| 15 | `pages/InterviewSimulator.tsx` | 1 307 | Gränsfall |

**Om 150-radersregeln:** 166 av 272 levande komponenter och 89 av 106 levande sidor
ligger över den. Att applicera den brett vore hundratals timmar utan mätbar vinst.
Regeln bör omformuleras i `CLAUDE.md` till *"150 rader är gränsen där du ska fråga dig
om filen gör två saker"* — inte ett tak. Lyft de tre ovan; resten är kosmetik.

---

### F18 — LÅG · Fem npm-paket utan levande användare · Storlek S

Sökt på paketnamnet i `src`, `api`, `scripts` och alla konfigfiler, inklusive
`await import()`-formen:

| Paket | Status | Bevis |
|---|---|---|
| **`svgo` ^4.0.1** (dev) | ❌ **noll träffar i hela repot** | Enda förekomsten är `package.json`. Ta bort |
| **`autoprefixer`** (dev) | ❌ **noll träffar** | `postcss.config.js` laddar bara `@tailwindcss/postcss`. Tailwind 4 gör prefixningen själv. **Nytt fynd — stod inte i C18** |
| `xlsx` (~978 kB) | ⚠️ endast dödkod | `pages/sta/components/bulkImportParser.ts:126` (STA-konsulentvyn) |
| `papaparse` + `@types/papaparse` | ⚠️ endast dödkod | `bulkImportParser.ts:12` |
| `pdf-lib` | ⚠️ endast dödkod | `pages/sta/assessmentPdfExport.ts:201,294,407,532` |

`lint-staged` (via `.husky/pre-commit:2`) och `@vitest/ui` (via `test:ui`) är levande
trots noll källkodsträffar — de anropas från konfiguration.

**Åtgärd:** `svgo` och `autoprefixer` bort direkt (riskfritt, kör `npm run build`
efteråt). De tre STA-paketen behålls så länge modulen behålls, men bör stå i
STA-beslutets dokumentation.

---

### F19 — MEDEL · npm audit: 19 sårbarheter, 13 höga · Storlek S–M

| Allvarlighet | Paket | Not |
|---|---|---|
| HIGH | **`react-router` / `react-router-dom`** | "RSC Mode CSRF Bypass". Portalen kör inte RSC → **inte exploaterbar här**, men `fixAvailable: true` utan major |
| HIGH | `@vercel/node` + kedjan (`@vercel/build-utils`, `path-to-regexp`, `undici`, `minimatch`, `js-yaml`, `smol-toml`) | Dev-beroende. Fix kräver **major** (3.0.1) |
| HIGH | `sharp` | Ärvda libvips-CVE:er. Dev, endast bildskript. Fix = major (0.35.3) |
| HIGH | `nanoid`, `ip-address`, `brace-expansion`, `js-yaml` | Transitiva, `fixAvailable: true` |
| MODERATE | **`dompurify`** | "IN_PLACE hook removal leaves a detached node". **Enda med runtime-exponering i klienten** — `utils/sanitize.ts` + artikelrendering. `fixAvailable: true` |
| MODERATE | `postcss`, `ajv`, `@vercel/static-config` | Byggkedja |
| LOW | `esbuild` | Dev-server, arbiträr filläsning |

**Åtgärd:** kör `npm audit fix` (icke-major) — det tar `dompurify`, `react-router`,
`nanoid`, `js-yaml`, `brace-expansion`, `ip-address`, `postcss`, `esbuild`. Verifiera
med `npm run verify` + `npm run build`. `dompurify` bör prioriteras: det är det enda
som körs i deltagarens webbläsare. **`react-router-dom` är ett bygg-/deploypåverkande
beroende — enligt CLAUDE.md ska den uppgraderingen inte pushas utan Mikaels ja.**

---

### F20 — LÅG · `@/types/knowledge` finns inte men importeras av fyra levande filer · Storlek S

```
components/knowledge-base/tabs/ForYouTab.tsx:16
components/knowledge-base/tabs/QuickHelpTab.tsx:11
components/knowledge-base/tabs/TopicsTab.tsx:14
hooks/knowledge-base/useArticles.ts:8
    import type { Article } from '@/types/knowledge'
```

Fyra `TS2307 Cannot find module` bland de 468. Rapporterat 2026-08-05, fortfarande
öppet. `git ls-files client/src/types/` har ingen `knowledge.*`. Filen har antingen
aldrig committats eller raderats av misstag.

---

### F21 — LÅG · `client/api/*.js` får varken eslint eller typecheck · Storlek S

`client/eslint.config.js:53` matchar `files: ['**/*.{ts,tsx}']` och inget block
matchar `.js`. `tsconfig.app.json` täcker bara `src/`. Det betyder att `client/api/ai.js`
(18 AI-funktioner, art. 9-grinden, PII-saneringen) — portalens mest säkerhetskänsliga
fil — inte får en enda statisk kontroll. Det är precis där A19 kunde gömma sig.
Redan noterat i ROADMAP D16; upprepas här för att det är ett arkitekturhål, inte en
lintdetalj.

---

### F22 — POSITIVT · Routningen är konsistent · Ingen åtgärd

Matchat `navGroups` (25 items) + `navHubs` (5 hubbar, 26 memberPaths, 26 items) +
`adminNavItems` + `consultantNavItems` mot `App.tsx`s 53 routes:

- **Noll nav-länkar utan route.** Varenda `path:` i `navigation.ts` har en matchande route.
- **Noll dubblerade `memberPaths` mellan hubbar** — regeln på `navigation.ts:189` hålls.
- **Routes utan nav-länk är alla avsiktliga:** `/login`, `/register`, `/invite/:code`,
  legal-sidorna, `/template-snapshot/:templateId`, `/print/cv`, `/profile/shared/:shareCode`,
  `/knowledge-base/article/:id`, `/settings` (nås från TopBar), `/oversikt/historik`,
  `steg-till-arbete` (flaggad).
- `pages/JobAdaptPage.tsx` är nåbar via nästlad route i `pages/CVPage.tsx:75` — inte dödkod.
- `getActiveHub()` (`navigation.ts:332`) använder korrekt explicit map + prefix-fallback
  över `memberPaths`, inte URL-prefixmatchning. PITFALLS.md Pitfall 2 hålls.

Det som *är* trasigt i routningslagret är länkar i sidinnehåll, inte i navigationen (F4).

---

### F23 — POSITIVT · Cache-kollisionen `['application-stats']` är åtgärdad och vaktad · Ingen åtgärd

Alla 17 `setQueryData`-anrop i `client/src` genomgångna. Var och en skriver till en
nyckel som ägs av samma hook som läser den:

| Nyckel | Ägare | Skrivare |
|---|---|---|
| `DIARY_ENTRIES_KEY`, `MOOD_LOGS_KEY`, `WEEKLY_GOALS_KEY`, `GRATITUDE_ENTRIES_KEY`, `WRITING_PROMPTS_KEY` | `hooks/useDiary.ts` | samma fil, typad `setQueryData<T>` |
| `JOB_ALERTS_KEY` | `useJobAlerts.ts` | samma fil |
| `SAVED_JOBS_KEY` | `useSavedJobs.ts` | samma fil |
| `SPONTANEOUS_COMPANIES_KEY` | `useSpontaneousCompanies.ts` | samma fil |
| `notificationsKey(userId)` | `useNotifications.ts` | samma fil |
| `BOOKMARKS_KEY` | `hooks/knowledge-base/useArticles.ts` | samma fil |
| `OVERSIKT_HUB_KEY(userId)` | `useOnboardedHubsTracking.ts` | samma fil |

`useJobsokHubSummary.ts` skriver **inte längre** till `['application-stats']` — nyckeln
ägs nu ensam av `useApplications.ts:37`, och `useJobsokHubSummary.test.ts:99` är
omskriven till en regressionsvakt (`expect(_qc.getQueryData(['application-stats'])).toBeUndefined()`)
med en förklarande kommentar på rad 90. **Detta är rätt sätt att stänga en lärdom** —
fixen plus en vakt som faller om någon återinför mönstret.

**En kvarvarande delad nyckel utan ägare:** `['cv']` läses med `queryFn: cvApi.getCV`
från både `components/cv/FocusCVBuilder.tsx:59` och döda `components/focus/steps/FocusCV.tsx:65`,
och invalideras från `hooks/useCVAutoSave.ts:75`. Formen är identisk (`cvApi.getCV`),
så det är inte en bugg — men ingen fil äger nyckeln, och när `steps/FocusCV.tsx`
arkiveras bör `['cv']` få en `CV_QUERY_KEY`-konstant med en namngiven ägare.

---

### F24 — LÅG · Zustand vs React Query: gränsen är i huvudsak sund · Storlek S

| Store | Rader | Innehåll | Bedömning |
|---|---:|---|---|
| `authStore.ts` | 552 | session, profil, roller, 13 supabase-anrop | Legitim klientstate, men se F6 |
| `profileStore.ts` | 504 | formulärstate + debounce-sparning | Gränsfall — serverdata i store. 5 oanvända selektorer |
| `settingsStore.ts` | 288 | inställningar, 5 supabase-anrop | Gränsfall. `useSettingsSync:280` oanvänd |
| `cvStore.ts` | 87 | ren UI-state | Rätt |
| `aiTeamStore.ts` | 89 | ren UI-state | Rätt |
| `focusWizardStore.ts` | 43 | ren UI-state | Rätt |
| `energyStoreWithSync.ts` | 226 | **onåbar** (F8) | — |

Tre av sex stores gör egna Supabase-anrop parallellt med React Query-lagret. Det är
inte fel i sig (auth och inställningar är rimliga att äga i en store), men
`profileStore` bär serverdata som annars hade fått cache, retry och invalidering gratis.
Ingen akut åtgärd; noteras för att `profileStore` redan haft en bugg av den typen
(completion räknad på gammalt state, D13).

---

### F25 — LÅG · Sex tester vaktar dödkod · Storlek S

`lib/validatedStorage.test.ts` (45 tester, 526 rader), `services/staAiApi.test.ts` (20),
`components/dashboard/DashboardSkeleton.test.tsx` (19), `hooks/useAIContext.test.ts` (15),
`services/accountApi.test.ts` (11), `hooks/useBreakpoint.test.ts` (3).

Dessutom: `src/pages/CVPage.test.tsx` är ett **levande** test som `vi.mock`:ar
`@/hooks/useCVScore` (död) och `@/services/api` (existerar inte alls — den ligger bland
de 10 olösta importerna). Båda `vi.mock`-blocken ska bort i raderingscommiten.

Sviten har vuxit från 933 till över 1 080 tester sedan D13. Passet tar bort ~113 av dem,
och **coverage-siffran kommer att röra sig** — mät den, gissa inte (`npm run test:coverage`,
functions-tröskeln är 30 % och låg på 34,74 % efter D13).

---

## 3. Förbättrings- och utvecklingsförslag för arkitekturen

### 3.1 Gör nåbarhet till en grind, inte en granskning (D16, punkt 1)

Skriptet finns och fungerar. Det som saknas är två rader i `ci.yml` och ett fryst tak
på antalet onåbara filer. **Men grinden som den är tänkt fångar bara nya döda filer.**
Efter F2 vet vi att den verkliga läckan är den motsatta: mekaniska svep som *skriver in*
i redan död kod. Grinden bör därför ha två lägen:

```
dead-code.cjs --tak-filer 182       # taket får inte växa (detektor)
dead-code.cjs --diff HEAD~1..HEAD   # fäller om commiten rört en onåbar fil (skydd)
```

Det andra läget är det som hade stoppat UX8, I5, UX15, UX19 och de 15 filerna i
`f2877dcb` — fem separata tillfällen på tre veckor.

### 3.2 Ge svepverktygen en nåbarhetsfilter-flagga

Varje agentuppdrag som gör ett mekaniskt svep (WCAG-namn, i18n-nycklar, typskuld,
lint) bör börja med `node scripts/dead-code.cjs --json` och begränsa sig till de 517
nåbara filerna. Det sparar arbete, håller resultatmätningen ärlig (F2:s commit
rapporterar "0 av 69 fält utan namn" — talet gäller nåbara sidor, vilket är rätt, men
15 döda filer ändrades ändå) och slutar blockera raderingsfönstret.

### 3.3 Lyft dödkodsanalysen från fil till export

Filnivån är slut när C16 är kört. Nästa 287 poster (F3) kräver ett verktyg som förstår
exporter — `knip` gör exakt det och kan köras i samma stil som de befintliga taken:
`knip --max-issues N`. Kör den **efter** C16, annars räknar den dödkod som användare av
dödkod.

### 3.4 En länkgrind, inte en catch-all som gömmer felen

`prerender-guides.cjs` har redan `validateRoutes(App.tsx)` för guidesidornas CTA:er.
Samma funktion bör köras över `navigate()`, `<Link to>` och `href:`-fälten i `src` och
i `articleData.ts`. Kostnaden är ~40 rader; utdelningen är att F4-klassen aldrig kan
återkomma. Komplettera med en riktig 404-vy i dev så en trasig länk syns när den skrivs
i stället för att teleportera användaren till Översikt.

### 3.5 Stäng barrel-eran helt

De 21 döda barrelsen ska bort (F7). Men lägg också till en regel: **inga nya
`index.ts`-barrels i `components/` eller `hooks/`.** De ger noll värde i ett projekt
med `@/`-alias och de kostade fyra granskningar i rad att upptäcka. Den enda
kvarvarande levande barreln, `services/supabaseApi.ts`, bör avvecklas (F14).

### 3.6 En gemensam formatterings-modul

`lib/datetime.ts` (F13) + en gemensam `lib/format.ts` för orgnummer, valuta och
procent. Låg risk, hög konsekvens för språkkonsistensen i en tvåspråkig portal.

### 3.7 Låt guidegeneratorn ärva designtokens i stället för att kopiera dem

F16. En byggtidsutläsning av `tokens.css` → CSS-variabelblocket i `guide-template.cjs`
gör de 133 publika sidorna till en vy av designsystemet i stället för en gaffel av det.

### 3.8 Låt `client/api/` omfattas av lint och typecheck

F21. Antingen genom att lägga till ett `files: ['api/**/*.js']`-block i eslint-konfigurationen,
eller genom att flytta `api/*.js` till TypeScript. Den senare varianten är M men ger
`ai.js` samma skydd som resten av portalen.

### 3.9 Formulera om 150-radersregeln

F17. Som absolut tak är den redan bruten av 255 filer och ignoreras därför i praktiken.
Som fråga ("gör den här filen två saker?") skulle den styra tre riktiga uppdelningar i
stället för noll.

---

## 4. Bedömning: största hävstången per nedlagd timme

**Raderingspasset (C16) är fortfarande svaret — men det är inte längre bara städning,
det är att låsa upp resten av planen.**

| Insats | Tid | Sänker | Risk |
|---|---|---|---|
| **Barrels + hooks-steget (F7)** | ~1 h | gör resten av dödkoden synlig för vanlig grep; ~2 800 rader | **Noll** — noll importörer |
| **Hela passet (F1, F8)** | ~1 dag | gradienter 52→7, typfel 468→363, eslint **128→97**, ~113 tester | **Noll** — inget nåbart ändras |
| Nåbarhetsgrind i två lägen (3.1) | ~3 h | stoppar en klass som träffat 5 ggr | Noll |
| De 4 skarpa länkarna (F4) | ~1 h | fyra trasiga CTA:er för deltagare | Låg |
| Export-analys (F3) | ~1 dag, **efter** passet | ~2 000 rader till | Låg |
| C20 — 64 direktanrop (F12) | veckor, per flik | konsistens, inte skuldtak | Medel |
| TS2339 mot verklig data | ~1 dag | kan innehålla skarpa buggar | Medel |

Tre skäl till att passet rankar först, och ett nytt sedan 08-04:

1. **Det är den enda insatsen som sänker alla tre frysta tak samtidigt**, och
   eslint-taket har nu bara **1 varnings marginal** (128 av 129). Nästa normala
   feature-commit kan fälla `lint:ci`. Passet ger 32 varningars luft.
2. **Risken är verifierbart noll** — inget av det är nåbart från `main.tsx`.
3. **Kostnaden av att vänta är inte konstant utan stigande.** Sedan 08-04 har
   dödkoden vuxit med ~500 rader, och 08-05 lades 58 rader betalt arbete rakt in i
   den. Det är sjätte gången.
4. **Nytt:** passet blockerar nu sig självt (F2). Varje vecka utan pass ökar risken
   att nästa svep skjuter fönstret sju dygn till. Kör steg 1–2 i dag och resten
   2026-08-12 — och lägg 3.2 på plats innan nästa mekaniska uppdrag startar.

**Den enskilt billigaste raden i hela rapporten:**
`node scripts/dead-code.cjs --skriv --steg=barrels`. En timme, noll risk, och efter
den hittar en vanlig `grep` det som fyra granskningar i rad missade.

---

## 5. Vad jag inte hann granska

- **Bundle- och chunkstruktur.** Ingen brotli-mätning, ingen kontroll av
  `manualChunks` i `vite.config.ts`, ingen verifiering av E6:s "3× pako i PDF-chunken".
  Jag rörde inte dev-servern och byggde inte — performance-agenten äger området.
- **`supabase/functions/` (24 edge-funktioner).** Nåbarhetsanalysen täcker bara
  `client/src`. C4:s sex callerlösa `learning-*`-funktioner är bekräftade från
  klientsidan (F8) men inte granskade på serversidan.
- **`client/api/*.js` internt.** Jag konstaterade att de saknar lint/typecheck (F21)
  men läste inte igenom `ai.js` (18 funktioner) arkitektoniskt.
- **RLS-policyer och databasschema.** Endast läst indirekt; ingen `pg_policies`-körning.
  Säkerhetsagentens område.
- **e2e-sviten.** `e2e/` (8 spec + 10 verktygsskript + 82 arkiverade) är inte
  nåbarhetsanalyserad. D14 antyder att flera tester testar fel sida.
- **i18n-nycklarnas nåbarhet.** Locale-JSON ingår inte i importgrafen; hur många av
  nycklarna i `sv.json`/`en.json` som faktiskt slås upp är omätt.
- **De 287 oanvända exporterna, en och en.** Mätningen är en helordsheuristik. Innan
  något raderas ska varje post bekräftas — särskilt exporter som kan konsumeras
  dynamiskt eller från `client/api`, `e2e` och byggskript (namngrinden i
  `dead-code.cjs` gör den kontrollen för filer, inte för exporter).
- **`npm audit fix` är inte kört.** Jag mätte bara. Ingen kod och inga
  beroenden har ändrats i den här granskningen.
