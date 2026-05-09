# Teknisk skuld ur Product Owner-perspektiv – maj 2026

**Datum:** 2026-05-09
**Granskare:** Product Owner-agent (Claude Opus 4.7)
**Scope:** Värdedrivande granskning av teknisk skuld – halvfärdiga features, dödkod, roadmap-drift, feedback-loopar

---

## Sammanfattning

Deltagarportalen är funktionsmässigt mogen — Phase 1–5 av v1.0 hub-navigationen är klar (2026-04-29) och 85+ sidor är produktionsdriftade. Den största PO-risken just nu är **inte att vi saknar features — den är att vi inte mäter vilka features som används, att flera AI-paneler är osynliga för halva användarbasen, och att konsulentvärdet är hårdkodat till noll på centrala KPI:er**.

Tre värdeläckor som lyfter sig över allt annat:

1. **Konsulent-statistik är hårdkodad till 0** (`consultantService.ts:498–499`). Konsulenten kan inte bevisa att hen levererat — vilket sänker hela B2B-värdepropositionen.
2. **Ingen analytics, ingen feedback-knapp, ingen NPS.** Roadmapen sätter mål "Feature Adoption > 50 %" och "NPS > 40" men ingen kod mäter detta. Vi flyger blint.
3. **Två orphan-routes** (`/linkedin-optimizer`, `/international`) finns i `App.tsx` men saknas i hubbarnas `memberPaths` och i `navItems` — användaren kan inte hitta dem utan att gissa URL:en.

Roadmap-drift är låg på H1-nivå (Phase 1–5 levererat enligt plan), men "Operation Spring Clean" från `docs/ROADMAP.md` Maj 2026 är **inte påbörjad** — dödkod och 70+ rotfiler finns kvar trots att det är denna månad det skulle hända.

---

## Halvfärdiga features (filer + status)

### TODO:s med affärspåverkan

| Fil + rad | Vad som saknas | Användarvärde | Risk |
|-----------|----------------|---------------|------|
| `client/src/services/consultantService.ts:498–499` | `goalsCompletedThisMonth` och `placementsThisMonth` returnerar `0` | Konsulent kan inte rapportera utfall till uppdragsgivare. **Bryter B2B-värdet.** | Hög |
| `client/src/services/recommendationService.ts:163` | `applicationsCount: 0 // TODO: Get from applications API` | Rekommendationer baseras på ofullständig data — sämre matchning | Medel |
| `client/src/components/consultant/BulkActionsDialog.tsx:195, 278` | Bulk apply tags + bulk update status saknar API-anrop | Konsulent ser knapp, klickar, händer inget. Förtroendeskada. | Hög |
| `client/src/components/applications/ApplicationsContacts.tsx:179` | "Open edit modal" – kontakt kan inte redigeras | Kontaktdata blir read-only — måste raderas och skapas om | Medel |
| `client/src/components/widgets/SalaryWidget.tsx:33` | Länk till löneförhandling är `#` istället för riktig route | CTA leder ingenstans — sänker engagement på lönedomänen | Låg |
| `client/src/components/widgets/PrintResourcesWidget.tsx:8` | PDF-mallar 404:ar — "links currently 404 gracefully" | Användaren klickar på utskriftsmaterial och får 404 | Medel |
| `client/src/components/widgets/KnowledgeBaseWidget.tsx:87` | Visar rå slug/UUID istället för artikeltitel | Widgeten ser oanvändbar ut | Medel |

### v1.1-deferreds från Phase 5 empati-review

Från `.planning/STATE.md` (Phase 05-06): **10 FLAGs** kvarstår i backloggen, alla 2–30 minuters copy-fixar:

- Article-slug visas fortfarande råa, education- och exercises-progression saknas, consultant-widget har passiv framing, `useJobsokHubSummary` har redundans i heading/body. Inget strukturellt — men sammantaget signalerar det "släng-iväg-status" på flera widgets.

### Onboarding-vägen är dubbel/oklar

Det finns **fyra parallella onboarding-strukturer**:

1. `client/src/components/onboarding/OnboardingFlow.tsx` — global välkomstmodal (mountad i `Layout.tsx:116`)
2. `client/src/components/Onboarding.tsx` — separat 5-stegs welcome med energinivå
3. `client/src/components/cv/CVOnboarding.tsx` — CV-specifik onboarding
4. `client/src/components/profile/OnboardingModal.tsx`, `client/src/components/ai-team/OnboardingModal.tsx` — modaler per feature

Plus `useOnboardedHubsTracking` (Phase 5) som spårar vilka hubbar användaren besökt — ett **femte spår**. Det finns ingen koherent "user journey" — varje feature har sin egen onboarding-känsla.

**Värdepåverkan:** Roadmap-mål "Onboarding Completion > 80 %" är omätbart när det inte finns en definition av "onboardad".

---

## Doda features (kod utan UI-väg)

### Lazy-imports utan användning i `App.tsx`

| Fil + rad | Status |
|-----------|--------|
| `client/src/App.tsx:32` — `import StorageTest from './pages/StorageTest'` | **Eager-importerad, aldrig routad.** Bygger in i bundlen. |
| `client/src/App.tsx:37` — `const CVBuilder = lazy(() => import('./pages/CVBuilder'))` | Lazy-importerad i App.tsx men endast använd via `CVPage.tsx:10` (direkt import). App-importen är dödkod. |
| `client/src/App.tsx:55` — `const ConsultantDashboard = lazy(...)` | Lazy-importerad men aldrig använd i någon `<Route>`. Konsulenten ser `Consultant.tsx` istället. |

### Komponenter som exporteras men aldrig importeras

| Fil | Status |
|-----|--------|
| `client/src/components/ai/EducationPathPanel.tsx` (356 rader) | Exporterad i `components/ai/index.ts:18` men inga `import { EducationPathPanel }` finns någonstans. **Helt dödkod.** Feature-flaggan `VITE_AI_EDUCATION_GUIDE` styr en komponent som inte renderas. |
| `client/src/components/microlearning/MicroLearningHub.tsx` (300+ rader) | Exporterad i `components/microlearning/index.ts:1` men aldrig använd. En `SkillsDevelopment.tsx:330`-länk pekar på `#/career?tab=microlearning` — en hash-route som inte finns. |
| `client/src/components/learning/MicroLearning.tsx` | Exporterad i `components/learning/index.ts:1` men aldrig importerad utanför testmocks. |

### Orphan-routes — saknar nav-väg

Routes finns i `App.tsx` men är inte i någon hub's `memberPaths` eller i `navItems`/`navHubs[].items`:

| Route | App.tsx-rad | Hub som borde äga den |
|-------|-------------|------------------------|
| `/linkedin-optimizer` | App.tsx:272 | Ska vara i `jobb`-hub eller `karriar`-hub |
| `/international` | App.tsx:277 | Ska vara i `jobb`-hub |
| `/cv/adapt` (subroute i CVPage) | CVPage.tsx:60 | Reachable bara genom direkt URL |
| `/print/cv` | App.tsx:229 | Internt verktyg — OK |

Användaren har **ingen meny-väg** till LinkedIn-optimeraren eller International-modulen. Detta är två AI-features som syns i `client/api/ai.js` men är osynliga i navigationen efter hub-rolloutet.

### Edge-funktioner utan klient-anrop

`supabase/functions/learning-recommend` och `supabase/functions/learning-analyze-gap` — inga `import.meta.env.VITE_SUPABASE_URL/functions/v1/learning-recommend`-anrop hittade i klienten. Edge-funktionerna är deployade men anropas inte (eller anropas via en kodväg som inte är hub-aktiverad — `MicroLearningHub.tsx:224, 266` använder `learning-progress` men hubben är dödkod).

---

## Roadmap-drift

### Levererat utöver plan

`.planning/ROADMAP.md` v1.0 hub-navigation: **5/5 phases COMPLETE per 2026-04-29.** Detta är inte i `docs/ROADMAP.md`. **Documentation drift:** den officiella roadmapen vet inte om att hub-systemet finns.

### Ej levererat enligt plan

`docs/ROADMAP.md` Maj 2026 "Operation Spring Clean":

- [ ] **Dödkods-radering** — `EducationPathPanel`, `MicroLearningHub`, `MicroLearning`, `StorageTest`-import, `CVBuilder`-lazy-dubblett, `ConsultantDashboard`-lazy är fortfarande kvar. (Tidigare lista i portal-review-2026-04 nämner `CoverLetterGenerator`, `UnifiedProfile`, `DashboardNew`, `FocusDashboard`, `Journey`, `CareerPlan` — dessa är **borta** ✓)
- [ ] **Repo-hygien** — 73 rotfiler vid senaste granskning. Senaste git status visar fortfarande 24 untracked filer i rot (sketches, e2e-experiments, cv1.pdf–cv10.pdf).
- [ ] **README.md-uppdatering** — inte verifierad
- [ ] **HSTS-header + sanitizeInput-paritet** — inte verifierat
- [ ] **Console.log-stripping** — kvar (586 enligt portal-review)
- [ ] **Bundle-analys + PDF-bibliotekskonsolidering** — kvar
- [ ] **Migrationskonsolidation 20260306130000-dubbletten** — kvar

**Status:** Maj månad är till hälften gången, ingen åtgärd i Spring Clean påbörjad enligt git-loggen (senaste 5 commits handlar om kraschmönster, mobil-topbar, SVG-logga).

### EU-utlysningsspår saknar bas

`docs/ROADMAP.md` Augusti–september 2026: AI-Lärande spår (utlysning 26-002) ska byggas. Bas-skelettet:
- `MicroLearningHub.tsx` finns men är dödkod
- `learning-recommend`, `learning-analyze-gap`, `learning-progress` edge-funktioner finns, klient-anrop saknas till två av tre
- Tabeller `ai_learning_progress`, `ai_readiness_assessments`, `ai_course_modules` — inte verifierat om de finns i live DB

**Värdepåverkan:** Vi har 50–60 % av kodbasen för 26-002 redan. Ingen vet det. Risk: vi bygger dubbelt eller missar utlysningsfönstret.

---

## Saknad feedback-loop

### Det finns ingen analytics

Sökning på `analytics|trackEvent|posthog|mixpanel|gtag|plausible|umami` ger **noll matches** i `client/src/`. Sentry är konfigurerad för felrapportering men inte för produktanalys.

**Mätbara KPI:er i product-owner.md:**
- "Onboarding Completion > 80 %" — **omätbart**
- "Weekly Active Users > 60 %" — **omätbart**
- "Feature Adoption > 50 %" — **omätbart**
- "NPS > 40" — **omätbart**
- "Time to First Value < 10 min" — **omätbart**

**5 av 5 produkt-KPI:er saknar mätinstrument.** Detta är den enskilt viktigaste PO-skulden.

### Det finns ingen användarfeedback-väg

- Ingen feedback-knapp i UI (`FeedbackButton`, `FeedbackForm`, `UserFeedback` ger 0 matches)
- Ingen NPS-enkät
- Ingen "rapportera problem"-knapp utöver Sentry (som är osynlig för användaren)
- Ingen "kontakta din konsulent"-shortcut från fel/tomma tillstånd

`MyConsultant.tsx` finns, men det är en sida — inte en kontextuell shortcut. När en deltagare ser ett tomt tillstånd ("Du har inte sökt något jobb än") finns ingen knapp som säger "Be din konsulent om hjälp att komma igång".

### Hjälp-systemet är passivt

`HelpButton`-komponent finns på `CoverLetterPage`, `Settings`, `Spontaneous` — bara 3 sidor av 85+. På de andra sidorna får användaren ingen kontextuell hjälp. `/help` är en FAQ-sida, inte en chat eller live-support.

---

## Konsulentvärdet är osynligt

Roadmapen säger "Konsulenten är hävstången" (`docs/ROADMAP.md` princip 3). Status maj 2026:

- **Bulk-actions är fake** (`BulkActionsDialog.tsx:195, 278` har TODO på tag-tilldelning och statusuppdatering)
- **Månadsstatistik är hårdkodad till 0** (`consultantService.ts:498–499`)
- **AICoachAssistant** finns globalt på alla `/consultant/*`-sidor men hookar in mot `/api/ai`-routes som är icke-konsulentspecifika
- **Massmeddelande-funktion** finns inte alls (planerad till Juli 2026 enligt roadmap)
- **"10 deltagare som inte loggat in på 14 dagar"-vy** finns inte (planerad Juli 2026)

---

## i18n-läget

Sv har 3288 unika nycklar, en har 3283 — **5 nycklar saknas i en**. Inte stor drift. **Men:** AI-output (cover letters, CV-summeringar, intervjusvar) genereras alltid på svenska oavsett `i18next`-locale. För engelskspråkiga deltagare betyder detta att UI är på engelska men allt AI-genererat är på svenska. (Roadmap erkänner detta i Q4 2026.)

---

## Prioriterad lista: stäng eller färdigställ

Sortering: RICE-score (Reach × Impact × Confidence / Effort), högst först.

### MUST – stäng innan något nytt byggs

| # | Åtgärd | RICE | Motivering |
|---|--------|------|------------|
| 1 | **Lägg till product analytics** (PostHog eller Plausible). Track: page views, feature usage, onboarding-funnel, time-to-first-CV-saved | 9×3×0.9/2 = 12.2 | Utan detta vet vi inte vilka av punkt 2–10 nedan som faktiskt är viktiga. Förutsättning för all framtida prioritering. |
| 2 | **Fixa konsulent-statistik** (`consultantService.ts:498–499`) — hämta riktiga `goalsCompletedThisMonth` och `placementsThisMonth` från `consultant_participants` + `participant_goals` | 5×3×1.0/0.5 = 30 | Hård B2B-blockerare. 4 timmar effort enligt portal-review. |
| 3 | **Anslut bulk-actions till API** (`BulkActionsDialog.tsx`) — implementera tag- och statusuppdatering för konsulenter | 5×2×1.0/1 = 10 | Konsulenten klickar idag på en knapp som inte gör något. |
| 4 | **Lägg till feedback-knapp + NPS-enkät** (en floating button som öppnar Supabase-tabell `user_feedback`) | 8×2×0.9/1.5 = 9.6 | Mätbart NPS-mål utan mätare = teater. |
| 5 | **Lägg orphan-routes i hubbar:** `/linkedin-optimizer` → `karriar.memberPaths`, `/international` → `jobb.memberPaths`. Lägg motsvarande nav-items. | 7×2×1.0/0.25 = 56 | 15 minuter. Synliggör två existerande AI-features för 100 % av användarna. |

### SHOULD – stäng under maj/juni

| # | Åtgärd | RICE | Motivering |
|---|--------|------|------------|
| 6 | **Bestäm: behåll eller ta bort `MicroLearningHub` + `MicroLearning` + `EducationPathPanel`.** Om de ska behållas: anslut till hub. Om inte: radera. | 4×2×0.8/1 = 6.4 | Dödkod skapar förvirring och hindrar 26-002-utlysningen från att veta vilken bas som finns. |
| 7 | **Fixa SalaryWidget-CTA** (rad 33: `#` → riktig route) och **PrintResourcesWidget 404** | 6×1×1.0/0.5 = 12 | Brutet förtroende. 30 min total. |
| 8 | **Konsolidera onboarding** — välj en av `OnboardingFlow` vs `Onboarding.tsx` som global; gör de andra till feature-specifika sub-flows. Definiera "onboardad" mätbart. | 7×2×0.7/3 = 3.3 | Förutsättning för "Onboarding Completion > 80 %"-mätning. |
| 9 | **Radera dödkods-imports i `App.tsx`:** `StorageTest`, `CVBuilder`-lazy-dubblett, `ConsultantDashboard`-lazy | 3×1×1.0/0.1 = 30 | 5 min. Spring Clean-uppgift som är försenad. |
| 10 | **Lägg "Be din konsulent om hjälp"-knapp i empty states** på de 5 viktigaste sidorna (CV, Cover Letter, Job Search, Applications, Career) | 8×2×0.7/1.5 = 7.5 | Aktiverar konsulent-värdet i precis det ögonblick användaren behöver det. |

### COULD – Q3/Q4

| # | Åtgärd | RICE |
|---|--------|------|
| 11 | Adressera 10 FLAGs från Phase 05-06 empati-review (article-slug, education-progression, exercises-progression, consultant-widget passive framing, jobsok heading/body) | 4×1×1.0/2 = 2 |
| 12 | Översätt AI-output till engelska när `i18next.locale === 'en'` | 3×2×0.6/4 = 0.9 |
| 13 | Synkronisera `docs/ROADMAP.md` med `.planning/ROADMAP.md` så hub-systemet finns med | 2×1×1.0/0.25 = 8 |

### WON'T – inte nu

- Mer AI-features. Vi har redan 18 i `/api/ai.js` + 23 edge-funktioner. Två av dem är osynliga (LinkedInOptimizer, International) och tre exporteras utan att användas (Education-, MicroLearning-, MicroLearningHub-Panel). **Lägg ingen ny AI förrän befintlig är synlig och mätt.**
- Mobilapp (native) — bekräftat förbjuden riktning.
- Real-time messaging — utanför scope.

---

## Beslutsfråga till PO/teamet

**Innan H2 2026 EU-utlysningsspåret startar:** ska vi (a) plocka bort `MicroLearningHub`/`MicroLearning`/`EducationPathPanel` och börja från noll med utlysning 26-002, eller (b) återanvända dem som bas? Beslutet bestämmer 1–2 sprint av effort.

---

*Rapport genererad 2026-05-09 av Product Owner-agenten. Underlag: `docs/portal-review-2026-04.md`, `docs/ROADMAP.md`, `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, kodgranskning av `client/src/`.*
