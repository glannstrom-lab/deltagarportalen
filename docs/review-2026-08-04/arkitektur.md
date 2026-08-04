# Arkitektur- och kodhälsogranskning — Jobin/Deltagarportalen

**Datum:** 2026-08-04 · **Omfattning:** `client/src` (750 filer, 247 309 rader; 233 388 exkl. tester), `client/package.json`, de tre frysta taken.
**Metod:** import-graf byggd över hela `client/src` med upplösning av `@/`-alias, relativa paths, `import()`-dynamik, `export * from` och `vi.mock()`. **Nåbarhet räknad transitivt från `src/main.tsx`** — inte "har någon importör", eftersom döda barrel-filer (`components/*/index.ts`) annars maskerar hela underträd. Alla fynd i §1 är dessutom stickprovsverifierade med namnsökning över hela repot (inkl. `client/api/`, `e2e/`, `scripts/`, `vite.config.ts`).

**Skripten ligger kvar** i scratchpad (`deadcode3.cjs`, `debt.cjs`, `deadtests.cjs`) och är körbara igen efter en städning för att verifiera resultatet.

---

## Sammanfattning

| Mått | Värde | Kommentar |
|---|---|---|
| Filer nåbara från `main.tsx` | **510 av 750** | 68 % |
| **Ej nåbara (dödkod)** | **175 filer / 41 878 rader** | 18 % av `client/src` |
| — varav STA (avaktiverad modul, medvetet) | 23 filer / 9 587 rader | dokumenterat |
| — **varav INTE STA** | **152 filer / 32 291 rader** | **odokumenterat** |
| Tester som vaktar dödkod | 6 filer / ~113 tester av 933 | 12 % av sviten |
| ESLint-varningar i dödkod | **31 av 127** (24 %) | |
| Strict-typfel i dödkod | **104 av 468** (22 %) | |
| Gradient-överträdelser i dödkod | **45 av 52** (87 %) | |

**Enskilt viktigaste slutsats:** en raderingspass över dödkoden sänker **alla tre frysta tak samtidigt** — gradienter 52 → 7, typfel 468 → 364, eslint 127 → 96 — utan att en enda rad levererad kod ändras. Det är den överlägset billigaste avbetalningen som finns i projektet just nu (§6).

---

## 1. Dödkod

### A1 — `components/dashboard/` är dött i sin helhet (17 av 17 filer)
**Allvarlighet:** HÖG (dokumentationen ljuger) · **Storlek:** S (ren radering) · **Rader som försvinner: 3 182 + 134 (test)**

**Bevis:** samtliga 17 icke-testfiler i `client/src/components/dashboard/` saknar väg till `main.tsx`. Enda importören för 6 av dem är `components/dashboard/index.ts`, som själv har noll importörer. Namnsökning över hela `client/src` bekräftar noll träffar utanför filerna själva för `CareerReadinessScore`, `NextStepCard`, `KpiCard`, `ProfileStatusWidget`, `MatchingScoreWidget`, `DashboardRiasecChart`.

| Fil | Rader |
|---|---|
| `components/dashboard/CareerReadinessScore.tsx` | 333 |
| `components/dashboard/NextStepCard.tsx` | 311 |
| `components/dashboard/DashboardRiasecChart.tsx` | 310 |
| `components/dashboard/WeeklySummary.tsx` | 286 |
| `components/dashboard/WhyItMatters.tsx` | 267 |
| `components/dashboard/ProfileStatusWidget.tsx` | 241 |
| `components/dashboard/DashboardSkeleton.tsx` | 215 (test-only) |
| `components/dashboard/MatchingScoreWidget.tsx` | 212 |
| `components/dashboard/QuickActions.tsx` | 205 |
| `components/dashboard/WellnessQuickCard.tsx` | 166 |
| `components/dashboard/DashboardSection.tsx` | 146 |
| `components/dashboard/SkeletonWidget.tsx` | 144 |
| `components/dashboard/KpiCard.tsx` | 135 |
| `components/dashboard/OnboardingStep.tsx` | 105 |
| `components/dashboard/DashboardError.tsx` | 54 |
| `components/dashboard/QuickActionButton.tsx` | 44 |
| `components/dashboard/index.ts` | 8 |

**Detta är resten av C1/C10.** Widgetarna arkiverades i två omgångar; komponentbiblioteket som matade dem lämnades kvar. **`CLAUDE.md` § Komponentkatalog listar tolv av dessa filer som levande** (`KpiCard, NextStepCard, OnboardingStep, DashboardWidget, DashboardGrid, DashboardSection, WidgetFilter, WidgetSizeSelector, QuickActions, CareerReadinessScore, MatchingScoreWidget, ProfileStatusWidget, WeeklySummary, WellnessQuickCard, WhyItMatters, DashboardRiasecChart`). En utvecklare som följer katalogen bygger vidare på dödkod — precis den fälla `docs/ROADMAP.md` C11 redan dokumenterat en gång (`CareerCoach.tsx` "den levande varianten" som hade noll konsumenter).

**Åtgärd:** arkivera hela katalogen (mönster: `archive/2026-07-widget-system-gen2/`), **och rätta komponentkatalogen i `CLAUDE.md` i samma commit.** `WellnessQuickCard.tsx` bär 2 av 52 gradienter (§6).

---

### A2 — `hooks/index.ts`-barreln och dess 8 unika hooks är döda
**Allvarlighet:** HÖG (barreln kastar `ReferenceError` vid import) · **Storlek:** S · **Rader: 2 651 (16 filer)**

**Bevis:** `hooks/index.ts` (58 rader) har noll importörer. Alla hooks vars enda importör är barreln är därmed också döda:

| Fil | Rader | Not |
|---|---|---|
| `hooks/useUnifiedProgress.ts` | 596 | se A3 |
| `hooks/useJobMatching.ts` | 464 | drar `services/interestJobMatching.ts` (377) |
| `hooks/useAccessibility.tsx` | 291 | **kastar `ReferenceError`** (ROADMAP UX19) |
| `hooks/useImageUpload.ts` | 232 | |
| `hooks/useCVScore.ts` | 203 | test-only |
| `hooks/useProfileStatus.ts` | 186 | |
| `hooks/useAIContext.ts` | 180 | test-only, 15 tester |
| `hooks/useLearning.ts` | 120 | drar `services/learningService.ts` (550) |
| `hooks/useEnergyLevel.ts` | 60 | |
| `hooks/useClickOutside.ts` | 54 | |
| `hooks/useNextStep.ts` | 54 | |
| `hooks/useInsights.ts` | 48 | drar `services/insightsService.ts` (503) |
| `hooks/useAuthInit.ts` | 39 | drar `stores/energyStoreWithSync.ts` (226) |
| `hooks/useStorageValidation.ts` | 40 | drar `lib/validatedStorage.ts` (362, 45 tester) |
| `hooks/useBreakpoint.ts` | 26 | test-only |

ROADMAP UX19 noterade `useAccessibility`-barrelns `ReferenceError` men slutsatsen stannade vid "ingen importerar den i dag". Rätt slutsats är bredare: **hela barreln är död, och den håller 2 651 rader vid liv i typkontroll, lint och testsvit.**

**Åtgärd:** radera `hooks/index.ts` först, kör om nåbarhetsanalysen, arkivera det som faller bort.

---

### A3 — Betalt arbete har lagts i döda filer (tre bekräftade fall)
**Allvarlighet:** HÖG (metodfel, inte kodfel) · **Storlek:** — (rapport)

Tre gånger de senaste två veckorna har fixar lagts i filer som ingen användare kan nå. Ingen grind fångar det.

| Fil | Rader | Vad som gjordes | Bevis på att filen är död |
|---|---|---|---|
| `hooks/useUnifiedProgress.ts` | 596 | **UX8 (2026-07-28)** styrde om `useUnifiedProgress.ts:509` från döda `job_applications` | Enda importörer: `hooks/index.ts` (dött) + `components/dashboard/CareerReadinessScore.tsx` (dött). Noll namnträffar i övriga `src`. |
| `utils/validation.ts` | 284 | **I5 (2026-07-27)** betalade 43 av 216 strict-typfel här (`asRecord()`, `isSkillLevel()`, `repairCVData`) | **Noll importörer, noll namnträffar** i hela `client/src`. Filen har i dag 0 typfel — men den kompileras inte in i något. |
| `services/accountApi.ts` | 97 (+160 test) | 11 tester i D10-vågen | Den levande kontoraderingen ligger i `components/settings/DeleteAccountSection.tsx:199`, som anropar edge-funktionen `delete-account` **direkt med `fetch`** och aldrig rör servicen. |

**Lärdomen är densamma som `journey_goals`, `useJobsokHubSummary.test.ts` och `localStorage`-mocken:** en grön grind bevisar ingenting om nåbarhet. **Åtgärd:** lägg nåbarhetsanalysen (skriptet finns) som en åttonde CI-grind med fryst tak, precis som de tre andra. Utan den återkommer klassen en fjärde gång.

---

### A4 — `components/jobs/` — gammal jobbvy, 9 av 13 filer döda
**Allvarlighet:** MEDEL · **Storlek:** S · **Rader: 2 865 + 744 (`MatchesTab.test.ts`, se not)**

`components/jobs/index.ts` (14 rader) är död → `JobFilters.tsx` (520), `JobMatchAnalyzer.tsx` (405), `JobCard.tsx` (375), `ApplicationsTab.tsx` (345), `JobDetailModal.tsx` (294) faller med den; `JobDetailModal` drar `ShareJobDialog.tsx` (227) som drar `services/jobSharingService.ts` (293) och `components/consultant/IncomingSharedJobs.tsx` (272). `CRMTab.tsx` (461) och `CultureTab.tsx` (224) har noll importörer överhuvudtaget. `types/jobs.ts` (38) faller med.

**Levande kvar i katalogen:** `MatchesTab.tsx`, `AlertsTab.tsx` m.fl. — `MatchesTab.test.ts` är alltså inte dödkod och ska stå kvar.

**Not:** hela jobbdelningen deltagare↔konsulent (`jobSharingService` + `ShareJobDialog` + `IncomingSharedJobs`, 792 rader) är död. Om funktionen ska finnas är det en produktfråga, inte en städfråga — den bör lyftas till ROADMAP innan raderingen.

---

### A5 — `components/cv/` — 14 av 32 filer döda, inkl. hela ATS-dubbelspåret
**Allvarlighet:** MEDEL · **Storlek:** S · **Rader: 4 425**

| Fil | Rader |
|---|---|
| `components/cv/templates/CVTemplates.tsx` | **1 904** — se A6 |
| `components/cv/SpellChecker.tsx` | 324 |
| `components/cv/PagedCVPrint.tsx` | 308 (`@deprecated` sedan 2026-05-22, utpekad som raderingskandidat redan i I5) |
| `components/cv/KeywordMatcher.tsx` | 295 |
| `components/cv/CVTemplateSelector.tsx` | 255 |
| `components/cv/CVOptimizer.tsx` | 217 |
| `components/cv/JobMatcher.tsx` | 183 |
| `components/cv/CVSaveTest.tsx` | 175 — **en testkomponent som ligger i produktionskällkoden** |
| `components/cv/SkillSuggestions.tsx` | 164 |
| `components/cv/CVProgressBar.tsx` | 131 |
| `components/cv/CVScoreWidget.tsx` | 119 |
| `components/cv/PhraseBank.tsx` | 112 |
| `components/cv/MobilePreviewFAB.tsx` | 64 |
| `components/cv/CVShare.tsx`, `index.ts` | — |

**`CVSaveTest.tsx` är värd en egen rad:** en felsökningskomponent som skriver mot Supabase ligger kvar i `src/` sedan okänt datum. Den är inte nåbar, men den är också inget som ska kunna bli nåbart av misstag.

---

### A6 — `CVTemplates.tsx` (1 904 rader) är död — och bär 43 av 52 gradienter
**Allvarlighet:** HÖG (låser ett fryst tak) · **Storlek:** S · **Rader: 1 904**

**Bevis:** enda importören är `components/cv/index.ts` (7 rader), som har noll importörer. Den levande mallmotorn är `components/cv/templates/index.ts` + de tolv `*Template.tsx`-filerna (`AtelierTemplate`, `BerlinTemplate`, … `RotterdamTemplate`) — dem rör detta inte.

**Gradientmätning (`grep -oE "bg-gradient-(to-[trbl]+|radial)"` per fil, samma uttryck som `scripts/check-design-debt.cjs`):**

```
43  components/cv/templates/CVTemplates.tsx      ← DÖD
 4  styles/design-system.ts                       (levande, medvetet undantag)
 3  pages/Landing.tsx                             (levande, medvetet hero-undantag)
 2  components/dashboard/WellnessQuickCard.tsx    ← DÖD (A1)
```

`client/eslint.config.js:103–109` whitelistar `CVTemplates.tsx` med motiveringen "CV-mall-thumbnails (DESIGN.md §6 — dekorativa)", och `docs/DESIGN-DEBT.md:22,33,38` beskriver den som ett medvetet undantag. **Undantaget skyddar en fil som ingen renderar.** Efter A1+A6 är gradientskulden 7, båda posterna dokumenterade undantag — taket kan sättas till **7** och whitelistningen i eslint-konfigurationen tas bort.

---

### A7 — Övriga större orphaner (noll importörer, noll namnträffar)
**Allvarlighet:** MEDEL · **Storlek:** S · **Rader: ~4 800**

| Fil | Rader | Not |
|---|---|---|
| `data/helpContent.ts` | 791 | ~34 kB innehåll; enda referens är en kommentar i `lib/dynamicIconMap.ts:9` |
| `components/consultant/ActionPlan.tsx` | 703 | via död `components/consultant/index.ts` |
| `components/map/SwedenMap.tsx` | 469 | noll referenser |
| `data/journeyData.ts` | 445 + `types/journey.types.ts` 133 | rest efter C9 (journey/gamification arkiverades, datat blev kvar) |
| `components/consultant/ParticipantJournal.tsx` | 390 | |
| `services/notificationsService.ts` | 365 + `components/NotificationsCenter.tsx` 334 | hela notiscentret; **den levande vägen är `useNotifications` (E5)** |
| `pages/wellness/EnergyTab.tsx` | 329 | + `EnergyLevelSelector` 460, `MobileEnergySelector` 276, `energyStoreWithSync` 226, `useEnergyLevel` 60 = **1 351 rader energifunktion, helt onåbar** |
| `services/afEnrichmentsApi.ts` | 320 | speglar C4:s callerlösa edge-funktion `af-enrichments` |
| `styles/designTokens.ts` | 307 | ersatt av `styles/tokens.css` + `design-system.ts` |
| `utils/supportiveLanguage.ts` | 277 | |
| `components/wellbeing/MoodCheck.tsx` | 276 | C14:s kvarvarande post |
| `components/resume/ContinueWhereYouLeft.tsx` | 265 | |
| `i18n/sv.ts` | 253 | äldre i18n-lager parallellt med `locales/sv.json` |
| `components/layout/BottomBar.tsx` | 231 | `components/Layout.tsx:72` säger själv "BottomBar removed" — filen blev kvar |
| `components/focus/FocusGuide.tsx` + `steps/` | 1 751 | **äldre fokusguide** parallellt med det levande `FocusWizardFrame`/`PageFocusShell`; se B2 |
| `services/afJobEdApi.ts` 201 + `components/education/EducationPathFinder.tsx` 146 + `components/common/Autocomplete.tsx` 254 | 601 | C5 skrev om importörerna till `afJobEdApi` — den enda som blev kvar är själv död |
| `pwa/serviceWorker.ts` | 172 | rest efter C2 (SW-avregistrering flyttad till `index.html`) |
| `utils/safeStorage.ts` 161, `utils/security.ts` 146, `data/knowledgeTabs.ts` 43 | 350 | |

---

### A8 — Döda UI-primitiver som dokumentationen listar som levande
**Allvarlighet:** MEDEL (fällrisk) · **Storlek:** S · **Rader: 951**

`components/ui/Tabs.tsx` (293), `components/ui/Avatar.tsx` (199), `components/ui/Badge.tsx` (168), `components/ui/LanguageSelector.tsx` (112), `components/ui/MemoizedButton.tsx` (110), `components/ui/QuickActions.tsx` (64) — samtliga noll importörer, verifierat med `grep "from '[^']*<namn>'"` över hela `src`.

Fyra av dem (`Tabs`, `Avatar`, `Badge`, `LanguageSelector`) står i **`CLAUDE.md` § Komponentkatalog**. Instruktionen "sök i `client/src/components/ui/` om komponenten redan finns — återanvänd alltid" pekar alltså mot sex komponenter som inte används av något. Det som faktiskt lever är `components/layout/PageTabs.tsx` (`Tabs`), `components/ai-team/AgentAvatar.tsx` (`Avatar`), `components/ai/AIBadge.tsx` (`Badge`).

**Åtgärd:** radera + rätta katalogen i `CLAUDE.md`. Detta och A1 bör göras i samma commit.

---

### A9 — 20 döda barrel-filer
**Allvarlighet:** LÅG · **Storlek:** S · **Rader: 116**

`components/{applications,jobs,ai-team,coverletter,energy,cover-letter,dashboard,cv,notifications,consultant,chat,analytics,market,video,voice,wellbeing}/index.ts`, `contexts/index.ts`, `utils/index.ts`, `styles/index.ts`, `data/index.ts`. Samtliga noll importörer.

De är inte ofarliga: **det är de som gömmer underträden i A1/A2/A4/A5** för varje enklare "har någon importerat den här filen?"-sökning. Radera dem först — då blir resten av dödkoden synlig även för en vanlig grep.

---

### A10 — STA: 9 587 rader dödkod (medvetet, men bör dokumenteras som siffra)
**Allvarlighet:** LÅG (beslutat) · **Storlek:** — · **Rader: 9 587 (23 filer)**

`pages/sta/StaConsultant.tsx` (3 020) + `pages/sta/consultant/` (6 filer, 1 383) + `StaDocumentWorkspace.tsx` (156) + `pages/sta/components/` (11 filer, ~4 400) + `assessmentPdfExport.ts` (615) + `staPdfExport.ts` (372) + `staDeadlines.ts`, `staConsentText.ts`.

Detta matchar beslutet 2026-08-03 och ska inte röras. **Två noteringar:**
1. `services/staAiApi.ts` (93 rader, 20 tester) är test-only — den nås inte ens via flaggan.
2. Dessa 23 filer är den enda anledningen till att `xlsx`, `pdf-lib` och `papaparse` finns i `package.json` (§4).

---

### A11 — 113 av 933 tester vaktar dödkod
**Allvarlighet:** MEDEL · **Storlek:** S · **Rader: 1 362**

| Testfil | Tester | Subjektets status |
|---|---|---|
| `lib/validatedStorage.test.ts` | 45 | `lib/validatedStorage.ts` nås bara via döda `useStorageValidation` |
| `services/staAiApi.test.ts` | 20 | STA, test-only |
| `components/dashboard/DashboardSkeleton.test.tsx` | 19 | A1 |
| `hooks/useAIContext.test.ts` | 15 | A2 |
| `services/accountApi.test.ts` | 11 | A3 |
| `hooks/useBreakpoint.test.ts` | 3 | A2 |

Sviten går från 933 → ~820 tester. **Det är en förbättring, inte en försämring:** 113 gröna tester som inte kan gå sönder för en användare ger falsk trygghet, exakt som de 184 widgettesterna C1 tog bort.

---

### A12 — Alla lazy-importer i `App.tsx` har en route (premiss kontrollerad)
**Allvarlighet:** — (inget fynd) · **Bevis:** 49 `lazy()`-deklarationer i `App.tsx:13–78`; nåbarhetsanalysen visar noll av sidorna i den listan bland orphanerna. Lärdomen "lazy-import utan route = dödkod" (2026-04-27) **håller inte längre som öppet problem** — den luckan är stängd. Dagens dödkod ligger ett lager längre in: **döda barrel-filer**, inte orutade lazy-importer. Uppdatera lärdomen i `CLAUDE.md` så nästa granskning letar på rätt ställe.

---

## 2. Duplicerad funktionalitet

### B1 — Två `LoadingState`, tre `QuickActions`, två `VoiceInput`, två `InterviewPrep`, två `JobCard`
**Allvarlighet:** MEDEL · **Storlek:** S

| Namn | Levande | Död |
|---|---|---|
| `LoadingState` | `components/ui/LoadingState.tsx` (5 importörer) | `components/LoadingState.tsx` (59) |
| `QuickActions` | `components/ai-team/QuickActions.tsx` (`pages/AITeam.tsx:11`) | `components/ui/QuickActions.tsx` (64), `components/dashboard/QuickActions.tsx` (205) |
| `VoiceInput` | `pages/sta/components/VoiceInput.tsx` | `components/VoiceInput.tsx` (158) |
| `InterviewPrep` | `components/calendar/InterviewPrep.tsx` | `components/interview/InterviewPrep.tsx` (188) + `MockInterviewSession.tsx` (278) + `StarMethodGuide.tsx` (153) |
| `JobCard` | `components/interest-guide/JobCard.tsx` | `components/jobs/JobCard.tsx` (375) |

Två filer med samma namn där den ena är död är den värsta varianten: en `import { LoadingState } from '@/components/LoadingState'` autoslutförs lika gärna som den rätta, kompilerar, och ger en komponent som ingen underhåller. **Radera dubbletterna.**

### B2 — Två fokusguide-generationer
**Allvarlighet:** MEDEL · **Storlek:** S · **Rader: 1 751**

Levande: `components/focus/FocusWizardFrame.tsx`, `PageFocusShell`, `FocusHubWizard`, `pages/`-wizards, `FocusCVBuilder` — det som UX11 arbetade i 2026-08-03 (38 bindningar, 35 filer).
Dött: `components/focus/FocusGuide.tsx` (232) + `steps/FocusCV.tsx` (554), `FocusJobSearch.tsx` (428), `FocusProfile.tsx` (344), `FocusComplete.tsx` (103), `FocusWelcome.tsx` (90).

Risken är konkret: UX11 löste en begreppsförväxling i fokusläget. Nästa person som söker "fokus-CV" träffar `steps/FocusCV.tsx` (554 rader) före `components/cv/FocusCVBuilder.tsx` (830 rader) och fixar fel fil.

### B3 — ATS/CV-matchning finns i fem lager, tre döda
**Allvarlighet:** LÅG · **Storlek:** S

Levande: `services/cvOptimizer.ts` (465, UX14-arbetet) + `components/cv/ATSAnalyzer.tsx` (932).
Dött: `CVOptimizer.tsx` (216), `KeywordMatcher.tsx` (294), `JobMatcher.tsx` (182), `CVScoreWidget.tsx` (119), `hooks/useCVScore.ts` (203, test-only).

### B4 — PDF-generering i fem parallella vägar
**Allvarlighet:** MEDEL (underhåll) · **Storlek:** L om den ska enas — **rekommendation: ena inte nu**

`services/pdfExportService.ts` (1 619) · `services/pdfReportGenerator.ts` · `services/pdfLazyLoad.ts` · `services/cvWordExport.ts` · `components/cover-letter/CoverLetterPDF.tsx` (`@react-pdf/renderer`) · `components/cv/CVPrintLayout.tsx` + `client/api/cv-pdf.js` (puppeteer) · samt två döda (`staPdfExport.ts` 372, `assessmentPdfExport.ts` 615, `PagedCVPrint.tsx` 308).

**Premissnot:** I1 avskrevs 2026-07-27 med motiveringen att `@react-pdf/renderer` bär svensk typografi som `jspdf` inte klarar. Den slutsatsen håller och ska inte rivas upp. Men den dokumenterade också att serverrendering via `api/cv-pdf.js` kostar klienten 0 kB. **Konsolideringen bör i så fall gå åt det hållet — inte mot ett bibliotek.** E6:s fynd att PDF-chunken bär 3× pako-kopior är fortfarande obetalt och är den mätbara delen.

### B5 — Konsulentmodulen har ett servicelager som den till 64 anrop går förbi
Se §5 (E1) — det är lika mycket en konsistensfråga som en dubbleringsfråga.

---

## 3. Filstorlek och komplexitet

**De 15 största (icke-test) i `client/src`:**

| # | Fil | Rader | Bedömning |
|---|---|---|---|
| 1 | `services/articleData.ts` | 24 864 | **Dela inte.** Ren datafil, lazy-laddad; E4 mätte att den inte belastar entry. |
| 2 | `data/exercises.ts` | 5 072 | **Dela inte.** Samma skäl. |
| 3 | `pages/ExternalResources.tsx` | 3 596 | **JA — högsta prioritet.** Levande deltagarsida. Enligt tidigare granskning en JSX-array av innehåll: bryt ut datat till `data/` och behåll en presenterande komponent. Mönstret finns redan (`data/pageTabs.ts`). |
| 4 | `services/interestGuideData.ts` | 3 317 | **Dela inte** — men den bär **21 strict-typfel**, näst flest i repot. Datat är feltypat, inte för stort. |
| 5 | `pages/sta/StaConsultant.tsx` | 3 019 | **Rör inte** — dödkod (A10). ROADMAP I4 utgår korrekt. |
| 6 | `pages/sta/StaParticipant.tsx` | 2 726 | Pausad modul; F11 gäller den dagen STA slås på. |
| 7 | `services/cloudStorage.ts` | 2 579 | **JA.** Levande, men blandar `platsbanken_saved_jobs`, `mood_history` (dött lager, C14), diarie- och profillager. Dela per domän — och ta bort `moodHistoryApi` (rad 573–620) i samma svep. |
| 8 | `components/cv/templates/CVTemplates.tsx` | 1 903 | **Radera** (A6). |
| 9 | `services/pdfExportService.ts` | 1 619 | Se B4. 14 typfel. |
| 10 | `services/careerApi.ts` | 1 413 | Gränsfall. Dela när den ändå rörs. |
| 11 | `pages/CVBuilder.tsx` | 1 342 | **JA.** **32 strict-typfel — flest i hela repot.** Använder inte `PageLayout` (§5). Bar både UX16 (z-index mot bottennavet) och I2:s läckta `setTimeout`. Den fil där storleken bevisligen kostat buggar. |
| 12 | `pages/Resources.tsx` | 1 318 | Gränsfall; innehållsarrayer inbakade. |
| 13 | `pages/consultant/ResourcesTab.tsx` | 1 308 | 11 direkta `supabase.from()` (§5). |
| 14 | `pages/JobSearch.tsx` | 1 306 | Gränsfall. |
| 15 | `services/staApi.ts` | 1 294 | Pausad modul. |

**Rekommendation, pragmatiskt:** `CLAUDE.md`s 150-radersregel ska **inte** appliceras brett — 34 av 45 sidor ligger över den och de flesta är begripliga. Lyft bara tre: **`pages/CVBuilder.tsx`** (bevisad buggkälla + 32 typfel), **`pages/ExternalResources.tsx`** (störst levande, ren data/UI-separation), **`services/cloudStorage.ts`** (blandade domäner + dött moodlager). Övriga är kosmetik.

---

## 4. Beroenden

Verifierat med sökning på `'<paket>'` i `client/src`, `client/api`, `client/scripts`, `client/vite.config.ts` — inklusive `await import()`-formen som en enkel `from '<paket>'`-sökning missar.

| Paket | Status | Bevis |
|---|---|---|
| **`svgo` ^4.0.1** (dev) | ❌ **NOLL användare** | Enda träffen i hela repot är `client/package.json:86`. Inte i `vite.config.ts`, inte i något skript. **Ta bort.** (S) |
| **`xlsx`** (från CDN-tarball, ~978 kB) | ⚠️ **Endast dödkod** | Enda konsument: `pages/sta/components/bulkImportParser.ts:126,177,185` → `BulkImportParticipantsModal` → `StaConsultant.tsx` (**omonterad**, A10). |
| **`papaparse` + `@types/papaparse`** | ⚠️ **Endast dödkod** | Samma fil: `bulkImportParser.ts:12`. |
| **`pdf-lib`** | ⚠️ **Endast dödkod** | Enda konsument: `pages/sta/assessmentPdfExport.ts:201,294,407,532` → `AssessmentEditor` → `StaConsultant.tsx`. |
| `canvas-confetti` | ✅ Levande | `hooks/useCelebration.ts:68` (G5 kopplade in den — ROADMAP-raden stämmer). |
| `docx`, `file-saver` | ✅ Levande | `pages/Resources.tsx:235,281`, `services/cvWordExport.ts:72,77`. |
| `html2canvas` | ✅ Levande | `services/pdfLazyLoad.ts:10,27`. |
| `sharp` (dev) | ✅ Levande | `scripts/convert-images.mjs:6`, `scripts/optimize-illustrations.cjs:5`. |
| `terser` (dev) | ✅ Levande | `vite.config.ts:246`. |
| `@sparticuz/chromium`, `puppeteer-core` | ✅ Levande | `client/api/cv-pdf.js:26,63`. |
| Övriga (`clsx`, `date-fns`, `dompurify`, `jspdf*`, `zod`, `zustand`, `tailwind-merge`, `react-hot-toast`, `@react-pdf/renderer`, `@vercel/blob`) | ✅ Levande | — |

**Åtgärd:** `svgo` bort direkt (S, riskfritt). `xlsx`/`papaparse`/`pdf-lib` **behålls** så länge STA-koden behålls — men de ska stå i STA-beslutets dokumentation, för de är tre paket (varav ett på ~978 kB) som ingen levande kodväg når. Om STA aldrig slås på igen faller de med modulen.

---

## 5. Konsistens

### E1 — Konsulentmodulen går förbi sitt eget servicelager i 64 anrop
**Allvarlighet:** HÖG · **Storlek:** M

**Bevis:** 64 direkta `.from('<tabell>')`-anrop i 14 `.tsx`-filer under `pages/consultant/` och `components/consultant/`, medan `services/consultantService.ts` (687 rader) finns som avsedd yta.

```
11  pages/consultant/ResourcesTab.tsx      10  pages/consultant/SettingsTab.tsx
 9  pages/consultant/CommunicationTab.tsx   7  pages/consultant/AnalyticsTab.tsx
 6  pages/consultant/OverviewTab.tsx        6  pages/consultant/ParticipantDetailPage.tsx
 5  components/consultant/InviteParticipantDialog.tsx   … + 7 dialogfiler
```

**Varför det kostar:** D11 (2026-07-23) betalade av felmaskering och la auth-guards på **sju metoder i `consultantService`**. De 64 anropen fick ingenting av det. Samma sak för B5:s ärliga felhantering. Varje framtida rättelse i servicen måste dubbelimplementeras eller missar två tredjedelar av konsulentvyn. Det är också här nästa `participant_consultants`-fel kommer att uppstå — `lint:schema` fångar tabellnamn men inte att fel sväljs.

**Åtgärd:** flytta anropen till `consultantService` i takt med att flikarna rörs (inte som ett block). Sätt en lokal regel: ny konsulentkod får inte importera `supabase` direkt.

### E2 — Två stora deltagarsidor står utanför `PageLayout`
**Allvarlighet:** MEDEL · **Storlek:** M

`pages/CVBuilder.tsx` (1 342) och `pages/Profile.tsx` — båda levande verktygssidor, båda utan `PageLayout`. De publika sidorna (`Landing`, `Login`, `Register`, `Privacy`, `Terms`, `AiPolicy`, `Accessibility`) och specialrenderarna (`PrintCV`, `TemplateSnapshot`, `SharedProfile`, `Article`, `JobAdaptPage`) står korrekt utanför.

`PageLayout` sätter `data-domain` (hub-färgen, DESIGN.md §4) och bottenutrymme. **UX16 var precis den buggen:** `CVBuilder.tsx:1302` la en egen `fixed bottom-0 z-40`-rad över `HubBottomNav` (z-30), och fixen blev en ny CSS-variabel i stället för det layoutkontrakt som redan fanns. UX16 noterade dessutom att `/#/profile` *inte* hade problemet — vilket är tur, inte design. Båda sidorna bör flyttas in i `PageLayout`.

### E3 — Nya moduler följer mönstret väl (positivt fynd)
`services/myConsultantApi.ts` (UX12, 2026-08-03) gör allt rätt: eget servicelager, kastar vid fel i stället för att returnera null, 8 tester, RPC i stället för bred policy, snapshot uppdaterad. `services/aiServerConsentGate` (UX13) likaså med explicit fail-closed-policy. **Mönstret sitter i det nya arbetet — problemet är uteslutande äldre lager som aldrig migrerades.**

### E4 — `EmptyState` har god täckning
30 filer importerar `EmptyState`. UX15 fann och åtgärdade dessutom att komponenten själv navigerade fel. Ingen åtgärd.

---

## 6. De tre frysta taken — rotorsaker och största hävstång

Mätt 2026-08-04 med `npm run lint` (JSON-formatter, grupperat per regel och fil), `npx tsc --noEmit -p tsconfig.app.json` (468 fel, grupperat per kod och fil) och `grep -oE "bg-gradient-…"` per fil.

### 6.1 ESLint — 127 varningar (tak 129)

| Regel | Antal |
|---|---|
| `react-hooks/exhaustive-deps` | 54 |
| `react-hooks/set-state-in-effect` | 41 |
| `react-hooks/purity` | 15 |
| `react-hooks/static-components` | 9 |
| (utan regel-id) | 4 |
| `react-hooks/preserve-manual-memoization` | 3 |
| `react-hooks/set-state-in-render` | 1 |

I3:s rättelse **håller fortfarande**: `no-console` är 0, react-hooks-familjen är 123 av 127. Spridningen är platt — värsta filen har 4 varningar. **Det finns ingen enskild rotorsak att attackera.** I3:s slutsats ("betas av per rörd fil") är rätt och ska stå kvar.

**Men:** **31 av 127 sitter i filer som inte är nåbara** — bl.a. `ParticipantList.tsx` (3), `ui/Tabs.tsx` (3), `KeywordMatcher.tsx` (2), `JobFilters.tsx` (2), `useAccessibility.tsx` (2), `wellness/EnergyTab.tsx` (`Math.random` under render). Radering ger **127 → 96**, ett tak som kan sättas till **96**.

### 6.2 Strict-typfel — 468 (tak 468)

| Kod | Antal | Betydelse |
|---|---|---|
| TS2339 | 101 | `Property X does not exist` |
| TS2345 | 94 | argument ej tilldelningsbart |
| TS2322 | 91 | typ ej tilldelningsbar |
| TS2353 | 39 | okänd egenskap i objektliteral |
| TS7006 | 24 | implicit `any` i parameter |
| TS18048 | 23 | `possibly undefined` |
| TS6133 | 11 | oanvänd deklaration |
| TS2614 | 10 | fel import-form (named vs default) |

I5:s notering att "ingen enskild rotorsak är lika stor som CV-mallarna" **håller** — men fördelningen per fil visar en tydligare hävstång än per kod:

| Fil | Fel | Status |
|---|---|---|
| `pages/CVBuilder.tsx` | **32** | levande |
| `services/interestGuideData.ts` | 21 | levande (feltypad datafil) |
| `components/jobs/JobMatchAnalyzer.tsx` | 17 | **död** |
| `services/pdfExportService.ts` | 14 | levande |
| `components/NotificationsCenter.tsx` | 12 | **död** |
| `hooks/useDashboardData.ts` | 11 | levande |
| `services/cloudStorage.ts` | 10 | levande |
| `pwa/serviceWorker.ts` | 8 | **död** |

**104 av 468 (22 %) sitter i 31 icke-nåbara filer.** Radering ger **468 → 364**.

**Viktig varning (lärdomen 2026-08-03):** TS2339 är 101 av 468 och är *just den kod* som avslöjade UX14 (`Property 'toLowerCase' does not exist on type 'Skill'` var ett skarpt `TypeError` i drift). **Innan man betar av TS2339 mekaniskt bör de 101 gås igenom mot verklig data** — några av dem är sannolikt skarpa buggar, inte typskuld. Det är det enda i typskulden som kan innehålla en användarbugg och bör därför tas som en egen, mätande insats.

### 6.3 Gradienter — 52 (tak 52)

**45 av 52 (87 %) i dödkod** — 43 i `CVTemplates.tsx`, 2 i `WellnessQuickCard.tsx`. Kvar efter radering: 4 i `styles/design-system.ts` + 3 i `pages/Landing.tsx`, båda dokumenterade medvetna undantag i DESIGN.md §6. **Taket kan gå 52 → 7**, och eslint-whitelistningen `client/eslint.config.js:103–109` kan tas bort.

### 6.4 Vilken enskild insats sänker mest per timme

**Svar: raderingspasset i §1 — och inget annat är i närheten.**

| Insats | Gradienter | Typfel | ESLint | Tester | Rader | Risk |
|---|---|---|---|---|---|---|
| **Radera dödkod (A1–A9)** | **52 → 7** | **468 → 364** | **127 → 96** | 933 → ~820 | −32 291 (exkl. STA) | **Noll** — inget levererat ändras |
| Beta av TS2339 manuellt | — | −101 (max) | — | — | 0 | Medel; kan avslöja buggar |
| Beta av `exhaustive-deps` | — | — | −54 (max) | — | 0 | **Hög** — ändrar beteende (I3 dokumenterade det) |

Alla tre taken sänks av **samma** commit-serie, arbetet är rent mekaniskt (flytta filer till `archive/`, radera barrels, kör om grindarna), och risken är noll eftersom inget av det är nåbart från `main.tsx`. Ordningen som gör arbetet enklast: **barrels först (A9) → hooks/index.ts (A2) → katalogvis (A1, A4, A5) → orphaner (A6, A7, A8) → tester (A11)**, med nåbarhetsskriptet omkört mellan varje steg.

**Storlek:** M totalt (uppskattat en dags arbete), fördelat på 6–8 commits.

---

## 7. Premissgranskning av ROADMAP-punkter

| Punkt | Roadmapens påstående | Verkligheten 2026-08-04 | Slutsats |
|---|---|---|---|
| **C1/C10** | Widget-systemet arkiverat | Widgetarna är borta, men **hela `components/dashboard/` (17 filer, 3 182 rader) blev kvar** och står fortfarande i `CLAUDE.md`s katalog | **Omscopa** — städningen är ofullständig |
| **C14** | Kvar: arkivera `MoodCheck` + `moodHistoryApi` + `calendarMoodApi` | `calendarMoodApi` **finns inte längre** (noll träffar i `src`). Kvar är `MoodCheck.tsx` (276) + `moodHistoryApi` i `cloudStorage.ts:573–620` | **Omscopa** — mindre än beskrivet |
| **E12** | Kvar: "`cloudStorage.savedJobsApi` + `jobsApi.savedJobsApi` är fortf. två läsvägar mot `saved_jobs`" | **Stämmer inte längre.** Endast `services/applicationsApi.ts` gör `.from('saved_jobs')`. `jobsApi.ts:167–199` dokumenterar själv att den bara översätter form, och `cloudStorage.ts:1125` säger "All åtkomst till `saved_jobs` ligger nu i applicationsApi" | **Avskriv** kodresten; kvar är bara Mikaels DROP-beslut |
| **I4** | Näst största levande filer: `ExternalResources.tsx` (3 519), `cloudStorage.ts` (2 431) | Mätt nu: **3 596** resp. **2 579** (siffrorna har drivit). `StaConsultant.tsx` är 3 019, inte 2 878 | **Bygg**, med rättade tal — och lägg till `CVBuilder.tsx` som tredje kandidat (32 typfel) |
| **I5** | 216 typfel betalda, inga beteendeändringar | Håller — **men 43 av dem låg i `utils/validation.ts`, som har noll importörer.** Den delen av avbetalningen sänkte taket utan att förbättra levererad kod | **Rättelse att skriva in** i ROADMAP |
| **I3** | `no-console` var 25 av 154, react-hooks dominerar | **Håller fortfarande.** 0 `no-console`, 123 av 127 är react-hooks | Ingen ändring |
| **I1** | Avskriven; `@react-pdf/renderer` behålls | **Håller.** Bekräftat 2 levande importörer. Serverrendering via `api/cv-pdf.js` är rätt väg om storleken återkommer | Ingen ändring |
| **C4** | 6 callerlösa edge-funktioner, pausade | **Bekräftat från klientsidan:** `services/afEnrichmentsApi.ts` (320) och `services/afJobEdApi.ts` (201) är döda även i klienten | Ingen ändring — men notera att klientsidan också är död |
| **Lärdom 2026-04-27** | "Lazy-import utan route = dödkod" | **Stängd.** Alla 49 `lazy()` i `App.tsx` har route. Dagens dödkod göms i **barrel-filer**, inte i orutade lazy-importer | **Uppdatera lärdomen** i `CLAUDE.md` |

---

## 8. Föreslagen ordning

1. **`svgo` ur `package.json`** — S, riskfritt, 1 minut.
2. **Raderingspasset A9 → A2 → A1/A4/A5 → A6/A7/A8 → A11** — M, sänker alla tre tak (§6.4). Sänk taken till **7 / 364 / 96** i samma commit-serie och ta bort `CVTemplates`-whitelistningen ur `eslint.config.js`.
3. **Rätta `CLAUDE.md`** — komponentkatalogen (§A1, §A8) och lazy-import-lärdomen (§A12). Utan detta bygger nästa session vidare på det som raderades.
4. **Lägg nåbarhetsanalysen som åttonde CI-grind** med fryst tak — annars återkommer A3 (arbete i döda filer) en fjärde gång.
5. **`pages/CVBuilder.tsx`** — in i `PageLayout` + uppdelning; 32 typfel och två dokumenterade buggar (UX16, I2) har samma rot.
6. **De 101 TS2339 gås igenom mot verklig data** innan de betas av mekaniskt (UX14-lärdomen).
7. **Konsulentmodulens 64 direktanrop** — per rörd flik, inte som block.

**Att lyfta till ROADMAP som produktbeslut, inte städning:** jobbdelningen deltagare↔konsulent (`jobSharingService` + `ShareJobDialog` + `IncomingSharedJobs`, 792 rader) och energifunktionen (`EnergyTab` + selektorer + `energyStoreWithSync`, 1 351 rader) är byggda, kompletta och helt onåbara. Det är 2 143 rader färdig funktionalitet som ingen användare kan se — antingen kopplas de in eller så arkiveras de medvetet.
