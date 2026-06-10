# Sida-för-sida UX-skuld (2026-05-14)

Audit av ~58 sidor i `client/src/pages/` + tabb-undersidor. Kompletterar
`audit-2026-05-10/RAPPORT.md` och `docs/DESIGN-DEBT.md` med UX-skuld som
INTE är design-frågor (färg/layout) utan beteende-/innehållsskuld.

## TL;DR

- **Endast 9 filer i hela kodbasen importerar `EmptyState`/`EmptyList`/`EmptyWidget`** trots att DESIGN.md §7 kontraktualiserar komponenten som enda accepterade tomtillstånd. ~80% av tomtillstånd är handskrivna `<Card className="p-12 text-center">…</Card>`.
- **Onboarding-spårning är fortfarande hybrid `localStorage` + cloud.** `dashboard/tabs/OverviewTab.tsx` (rader 385–453) skriver `cv-data`, `cover-letters`, `interest-result`, `career-visited`, `profile-data` lokalt. Bryter mot policyn att Supabase är default-persistens.
- **`NegotiationTab.tsx` och `IntegrationTab.tsx`-checklists sparas bara i `localStorage`.** Försvinner vid byte av enhet. `Article.tsx` lagrar bokmärken och teckenstorlek lokalt.
- **PageLayout-domän saknas på `Settings`, `Spontaneous`, `Consultant`.** Bryter mot DESIGN.md §3 (4px vänsterkant i hub-färg).
- **Hard-coded svenska tabb-labels** i `PersonalBrand.tsx`, `Salary.tsx`, `International.tsx`, `Network.tsx`-rubriker, `JobsokHub.tsx`-features ("Sök jobb", "Hitta jobb"). Bryter engelsk översättning.
- **"Kommer snart"-text överlever i prod:** `sta/StaParticipant.tsx:1317` ("Mer material för den här dagen kommer snart").
- **`onClick={() => {}}` i `CoverLetterStatistics.tsx:299`.** Klick gör ingenting.
- **Network/Diary/Applications har egna ad-hoc tomtillstånd** med "Inga ansökningar än", "Din dagbok är tom" — fungerar UX-mässigt men bygger inte på den kontraktualiserade komponenten.

## Sidor med mest UX-skuld (top 10)

| # | Sida | Huvudskuld |
|---|------|------------|
| 1 | `dashboard/tabs/OverviewTab.tsx` | localStorage-onboarding (6 nycklar), dubbla kodvägar mot Dashboard.tsx |
| 2 | `Article.tsx` | Bokmärken + teckenstorlek bara i localStorage → tappar vid enhetsbyte |
| 3 | `salary/NegotiationTab.tsx` | Förhandlingschecklist bara i localStorage (ingen cloud-sync) |
| 4 | `international/IntegrationTab.tsx` | Cloud finns men localStorage-fallback skriver konkurrent ändå |
| 5 | `sta/StaParticipant.tsx` | "Kommer snart"-text på rad 1317, custom tomtillstånd |
| 6 | `Spontaneous.tsx` | Saknar `domain=` i PageLayout, localStorage-visited-flagga |
| 7 | `Career.tsx` | `localStorage.setItem('career-visited',…)` parallellt med cloud-sync |
| 8 | `PersonalBrand.tsx` | Tabbar med hård svenska, ingen `t()` |
| 9 | `Settings.tsx` | PageLayout utan `domain=`, mobilmenyn växlas via lokal state utan deep-link |
| 10 | `Consultant.tsx` | PageLayout utan `domain=`, ingen 4px-accent på konsulent-vyer |

## Mönster över hela portalen

### Tomtillstånd

- **Endast 9 av ~58 sidor använder den kontraktualiserade `EmptyState`-komponenten:** `career/NetworkTab.tsx`, `Education.tsx`, `sta/StaParticipant.tsx`, `components/cover-letter/CoverLetterMyLetters.tsx`, `CoverLetterApplications.tsx`, `components/jobs/MatchesTab.tsx`, `components/ai-team/AgentChat.tsx`. Övriga rullar egna `<Card>…</Card>`-block.
- `ApplicationsPipeline.tsx:338` har eget tomtillstånd: ikon + rubrik "Inga ansökningar än" + två CTA — bra rubrik men bryter mot §7 (en CTA).
- `components/diary/JournalTab.tsx:381` — handskriven "Din dagbok är tom" istället för `EmptyState`. Rubriken är dock empatisk.
- `MyConsultant.tsx:100` — handskriven "Ingen konsulent"-kort med ikon + två rader. Bör vara `EmptyState`.
- `consultant/CommunicationTab.tsx:963,1078` — "Inga meddelanden ännu" / "Inga möten ännu" som text utan ikon/CTA. För minimalt.
- `consultant/AnalyticsTab.tsx:909` — använder oöversatt i18n-key `consultant.analytics.cohortAnalysis.empty` direkt i UI.
- Inga `0`-rubriker som primär information hittade — bra (en framgång).

### Felmeddelanden

- `Calendar.tsx:65` — `setError(t('calendar.errors.loadFailed'))` visar i18n-nyckel men inget retry-CTA inbyggt i felvisning (måste klicka på "RefreshCw"-ikonen i header).
- `LinkedInOptimizer.tsx:67–73` — fångar AI-fel och visar lokala fallback-strängar (`Jag är en driven ${formData.about.bakgrund}…`). Användaren ser ett "AI-svar" som faktiskt är en template — vilseledande.
- `interest-guide/TestTab.tsx:165–168` — fångar fel men loggar tyst med `console.error` istället för att rapportera till användaren. `setError` finns men sätts bara i ett fall.
- De flesta `.catch(err => console.error)`-mönster är tysta — bra för icke-kritiska fall (onboardingStep-sync) men förödande för t.ex. mat-spar (`Spontaneous`, `Career`).
- `Profile.tsx:46–80` har en lokal `ProfileErrorBoundary` med "Try again"-knapp — bra mönster som borde appliceras bredare istället för tysta `console.error`.

### Mobil

- `Settings.tsx:683–700` — egen lg:hidden-dropdown för sektionsval. Sektionen lagras i state, inte i URL. Reload tappar val. Tillbakaknapp fungerar inte.
- `Dashboard.tsx:97–109` — separat mobile- vs desktop-progress badge. OK men ökar markup.
- `Diary.tsx` tabbar har `overflow-x-auto` med `scrollbar-hide` — på små skärmar kan tabbar dölja sista fliken utan visuell pil. Touch-targets är >=44px, OK.
- `Calendar.tsx`-vy: switch mellan month/week/day via knappar, men på små skärmar är month-view antagligen oanvändbar — månadsceller blir för små. Ingen automatisk degradering till veckovy.
- `JobSearch.tsx`-filter: filterpanel använder bottom-sheet på mobil, men `FilterChips` ovan är scrollbara. Bra mönster.

### Personalisering

- **Bra:** Alla 5 hubbar (`HubOverview`, `JobsokHub`, `KarriarHub`, `MinVardagHub`, `ResurserHub`) använder `firstName` från `useAuthStore`/`useOversiktHubSummary`. `KnowledgeBase.tsx:69` har `userName = profile?.first_name || t('knowledgeBase.defaultUser')`. `Dashboard.tsx:80` använder `firstName`.
- **Saknas:** `Profile`, `Resources`, `Calendar`, `Settings`, `AITeam`, `JobSearch`, `Applications`, `Career`, `Wellness`, `Diary`-rubrikerna är generiska ("Personligt Varumärke", "Lön & Förhandling"). Bra för en verktygssida — men man kunde personalisera vid första visit ("Hej Anna, här bygger du ditt CV").
- **MyConsultant** är ett bra exempel — visar konsulentens namn men inte deltagarens, vilket är rätt.

### Konsistens

- **PageLayout utan `domain=`:**
  - `Spontaneous.tsx:53` (borde `activity`)
  - `Settings.tsx:677` (helt utan domain — visas med default hub-färg, kan se ut som fel hub)
  - `Consultant.tsx:26` (konsulent-vyer har ingen domain — DESIGN.md §3 osäker här, men inkonsekvent)
- **Hard-coded svenska labels (ingen `t()`-genomkörning):**
  - `PersonalBrand.tsx:21–24` — alla 4 tabbar
  - `Salary.tsx:20–22` — alla 3 tabbar
  - `International.tsx:20–22` — alla 3 tabbar
  - `JobsokHub.tsx:81–83,89,91,98–100` — features-arrays
- **Auto-save vs explicit save:**
  - CV-builder har autosave (`useCVAutoSave`)
  - CoverLetterPage har autosave
  - Diary kräver klick på "Spara"
  - Wellness/HealthTab sparar mood automatiskt
  - **Inkonsekvent** — användaren vet inte när data är säker.
- **Onboarding-banners:**
  - `AITeam.tsx:82` använder `<InlineTip storageKey="ai-team-intro">` — bra modern variant
  - `CVBuilder.tsx` använder `<CVOnboarding>` modal
  - `Profile.tsx` använder `<OnboardingModal>`-komponent som visas vid första visit
  - Tre olika onboarding-mönster på tre sidor.

### localStorage-skuld (mest akut)

| Plats | Vad sparas | Cloud-sync? |
|-------|-----------|-------------|
| `Article.tsx:97,142,160,169,186` | Artikel-bokmärken, teckenstorlek | Bokmärken: ja via `articleBookmarksApi`, men teckenstorlek är endast lokalt |
| `CVBuilder.tsx:401,425` | `cv-edit-version`, `cv-last-saved` | CV-data: ja, men dessa metadata-flaggor är lokala |
| `Career.tsx:31` | `career-visited` | Ja (sync till `userApi.updateOnboardingStep`) — redundant |
| `Spontaneous.tsx:27` | `spontaneous-visited` | Ja — redundant |
| `salary/NegotiationTab.tsx:191,205,212` | Förhandlingschecklist | **NEJ — försvinner vid enhetsbyte** |
| `international/IntegrationTab.tsx:202` | Integration-checklist | Ja (fallback) — OK |
| `interest-guide/TestTab.tsx:161` | `interest-result`-flagga | Ja — redundant |
| `dashboard/tabs/OverviewTab.tsx:385–453` | 6 olika onboarding-flaggor | Hybrid — läser cloud först, fallback till localStorage |

**Beslut behövs:** Är dubbel-skrivningen (`localStorage` + cloud) avsiktlig backwards-compat, eller dödkod efter att cloud-sync infördes? Om legacy → ta bort. Om migration → flagga och rensa.

## Konkret per-sida-tabell

| Sida | Skuld | Typ | Prio |
|------|-------|-----|------|
| `/` (Dashboard.tsx) | Återanvänder gamla `dashboard/tabs/OverviewTab.tsx` med localStorage-onboarding | localStorage-skuld | MEDEL |
| `/oversikt` (HubOverview) | Bra personalisering, OK | – | – |
| `/jobb` (JobsokHub) | Hard-coded svenska features ("Sök jobb", "Inga än") | i18n | LÅG |
| `/karriar` (KarriarHub) | Bra | – | – |
| `/resurser` (ResurserHub) | Bra | – | – |
| `/min-vardag` (MinVardagHub) | Bra | – | – |
| `/cv` (CVPage→CVBuilder) | `cv-edit-version`, `cv-last-saved` i localStorage | localStorage-skuld | LÅG |
| `/cover-letter` (CoverLetterPage) | OK | – | – |
| `/job-search` (JobSearch) | OK — EmptySearch används | – | – |
| `/applications` (Applications) | Custom empty state istället för EmptyState (rad 338 i ApplicationsPipeline) | Tomtillstånd | LÅG |
| `/spontanansökan` (Spontaneous) | Saknar `domain="activity"` i PageLayout, localStorage-visited | Konsistens | MEDEL |
| `/salary` (Salary) | Hard-coded svenska tabblabels, NegotiationTab localStorage-checklist | Cloud-sync + i18n | HÖG |
| `/international` (International) | Hard-coded svenska tabblabels | i18n | LÅG |
| `/personal-brand` (PersonalBrand) | Hard-coded svenska tabblabels | i18n | LÅG |
| `/linkedin-optimizer` (LinkedIn) | AI-fallback maskerar fel som genuina AI-svar | Felmeddelanden | MEDEL |
| `/skills-gap-analysis` | OK — använder cvApi/skillsAnalysisApi | – | – |
| `/interview-simulator` | OK — `domain="activity"` | – | – |
| `/career/*` (Career) | localStorage-visited redundant med cloud | localStorage-skuld | LÅG |
| `/interest-guide/*` | Tyst console.error i save-flow, localStorage-flagga redundant | Felhantering | MEDEL |
| `/education` | Använder EmptyState — bra | – | – |
| `/wellness/*` | OK — Health/Routines/Cognitive/Crisis-tabs alla sparar mot cloud | – | – |
| `/diary` | Egen tomtillstånd ("Din dagbok är tom") istället för EmptyState | Tomtillstånd | LÅG |
| `/exercises` | Exporerar progress till cloud OK | – | – |
| `/calendar` | Bra felhantering med RefreshCw i header, men reload-flöde är dolt | Felmeddelanden | LÅG |
| `/knowledge-base` | Bra | – | – |
| `/knowledge-base/article/:id` (Article) | Bokmärken-sync OK men `article-font-size` bara lokalt | localStorage-skuld | LÅG |
| `/resources` | Egen layout, ingen tomtillstånd för listsidor | Tomtillstånd | MEDEL |
| `/print-resources` (PrintableResources) | OK | – | – |
| `/externa-resurser` (ExternalResources) | Statiska data, bra | – | – |
| `/ai-team` (AITeam) | InlineTip-mönster är bra modernt | – | – |
| `/nätverk` (Network → NetworkTab) | Använder EmptyState — bra | – | – |
| `/my-consultant` (MyConsultant) | Egen "Ingen konsulent"-card istället för EmptyState | Tomtillstånd | LÅG |
| `/profile` (Profile) | Lokal ProfileErrorBoundary är ett bra mönster — men ingen domain på PageLayout (sidan har inte PageLayout alls) | Konsistens | MEDEL |
| `/settings` (Settings) | PageLayout utan `domain=`, mobile-section i state istället för URL | Konsistens | MEDEL |
| `/consultant/*` (Consultant) | PageLayout utan `domain=`, hela konsulent-flöden saknar 4px-accent | Konsistens | LÅG |
| `/consultant/communication` (CommunicationTab) | Minimalistiska tomtillstånd ("Inga meddelanden ännu") utan ikon/CTA | Tomtillstånd | LÅG |
| `/consultant/analytics` (AnalyticsTab) | Oöversatt i18n-key i UI (rad 909) | i18n | MEDEL |
| `/steg-till-arbete` (StaParticipant) | "Kommer snart"-text överlever (rad 1317) | Brutet | MEDEL |
| `/konsulent/steg-till-arbete` (StaConsultant) | Bra struktur, OK | – | – |
| `/help` | Statisk FAQ — bra | – | – |
| `/admin` (SuperAdminPanel) | Inte granskat, admin-only | – | – |
| `CoverLetterStatistics.tsx:299` (komponent) | `onClick={() => {}}` — knappen gör ingenting | Brutet | HÖG |

## Rekommenderad åtgärdsordning

1. **HÖG:** Konvertera `salary/NegotiationTab.tsx` checklist till `careerApi`-baserad cloud-sync (eller skapa ny `negotiationChecklistApi`). Annars förlorar användare data vid enhetsbyte.
2. **HÖG:** Hitta och fixa `CoverLetterStatistics.tsx:299` no-op-knapp.
3. **MEDEL:** Lägg `domain="action"` på `Settings.tsx`, `domain="activity"` på `Spontaneous.tsx`, bestäm domain-policy för `Consultant.tsx`.
4. **MEDEL:** Konvertera de 6 onboarding-localStorage-flaggorna i `dashboard/tabs/OverviewTab.tsx` till ren cloud — eller bekräfta att de är legacy och kan tas bort.
5. **MEDEL:** Lös "Kommer snart" i `sta/StaParticipant.tsx:1317`.
6. **MEDEL:** `LinkedInOptimizer` fallback-strings — visa "AI ej tillgänglig just nu, här är en grundmall" istället för att låtsas vara AI-svar.
7. **LÅG:** Migrera alla custom `<Card>`-tomtillstånd (Applications, Diary, MyConsultant, CommunicationTab) till `EmptyState`/`EmptyList`. Skriv migration-skript som söker `text-center.*Inga|tom` och flaggar.
8. **LÅG:** Bygg om hard-coded svenska tabblabels (`Salary`, `International`, `PersonalBrand`, `JobsokHub`) genom `t()`.
