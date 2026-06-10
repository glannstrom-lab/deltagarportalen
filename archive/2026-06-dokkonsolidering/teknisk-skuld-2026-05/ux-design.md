# Teknisk skuld — UX/Design

**Granskare:** UX-designer-persona
**Datum:** 2026-05-09
**Källor:** `docs/DESIGN.md` (2026-04-30), `docs/audit-2026-04.md` (Fas 1–7), `CLAUDE.md`,
`client/src/components/layout/navigation.ts`, `client/src/lib/domains.ts`

## Sammanfattning

Designsystemet (DESIGN.md, aktiverat 2026-04-30) är välartikulerat och
implementerat i `tokens.css` + `PageLayout`. Hub-systemet fungerar.
**Skulden ligger i avståndet mellan spec och kodbas:** 459 `bg-gradient-`-träffar
i 172 filer, 403 `shadow-md/lg/xl`-träffar i 201 filer, fyra parallella
EmptyState/LoadingState-implementationer, och fyra centrala sidor
(Dashboard, Profile, CVBuilder, SkillsGapAnalysis) renderar inte
PageHeader alls — designsystemets uniforma neutrala header är otillämplig
där.

DESIGN.md:s Fas 1–7 (audit-2026-04.md) har städat `teal-*`, `green-*`,
`slate-*` och `shadow-*` i Tailwind-klasser, men inte gradients,
hårdkodade `#hex`-värden i `style={{}}` eller `bg-[#XXX]`-arbiträr-färger.
Resultatet är ett system som ser polerat ut på hub-landningssidorna men
spretar så fort man dyker en nivå ner.

### Top 3 problem

1. **459 gradient-överträdelser** över 172 filer trots att DESIGN.md
   uttryckligen förbjuder gradients i återkommande UI. Alla 16
   dashboard-widgets använder gradient-bakgrund.
2. **Hub-arkitekturen är inkomplett.** `/linkedin-optimizer`,
   `/international` och flera andra registrerade routes saknas i
   `navHubs[].memberPaths` — sidorna får hub-färg via `domains.ts` men
   räknas inte som hub-medlemmar (HubBottomNav, aktiv-hub-detection,
   sub-items i sidebar).
3. **Fyra parallella EmptyState/LoadingState-set** (`components/EmptyState.tsx`,
   `components/ui/EmptyState.tsx`, `components/dashboard/EmptyState.tsx`,
   `components/LoadingState.tsx`, `components/ui/LoadingState.tsx`,
   `components/ui/Skeleton.tsx`, `components/dashboard/SkeletonWidget.tsx`).
   EmptyState används bara i 9 filer; resten faller tillbaka på inline
   "Inga..."-strängar och 244 ad hoc Loader2/animate-spin-instanser.

---

## Brott mot DESIGN.md

### G1. Gradients i återkommande UI (459 träffar / 172 filer)

DESIGN.md: *"Inga gradients i återkommande UI. Gradient-bakgrunder
(from-X to-Y) är förbjudna i KPI-kort, sektionsheaders, knappar."*

**Mest graverande lokaler:**

| Fil | Antal gradients |
|-----|-----------------|
| `client/src/pages/Resources.tsx` | 11 |
| `client/src/pages/interest-guide/ResultsTab.tsx` | 10 |
| `client/src/pages/interest-guide/OccupationsTab.tsx` | 12 |
| `client/src/pages/SkillsGapAnalysis.tsx` | 7 |
| `client/src/pages/interest-guide/TestTab.tsx` | 8 |
| `client/src/components/SuccessMoments.tsx` | 7 |
| `client/src/components/dashboard/widgets/CoverLetterWidget.tsx` | 11 |
| `client/src/components/dashboard/widgets/CVWidget.tsx` | 4 |
| `client/src/components/journey/JourneyAchievements.tsx` | 7 |
| `client/src/components/cv/templates/CVTemplates.tsx` | 43 |

**Alla 16 dashboard-widgets** (`components/dashboard/widgets/*Widget.tsx`)
använder `bg-gradient-`. Eftersom widgets är "återkommande UI" enligt
DESIGN.md är hela widget-katalogen designskuld.

**Notering:** `CVTemplates.tsx` är medvetet bevarad (audit-2026-04.md Fas 6
— per-template signatur). Det är legitimt undantag.

**Åtgärd:** Sed-pass över widgets (`bg-gradient-* from-X to-Y` → `bg-[--c-bg]`)
+ manuell granskning av interest-guide- och Resources-sidor.

### G2. Skuggor i återkommande UI (403 träffar / 201 filer)

DESIGN.md: *"Inga statiska skuggor. Subtil hover-elevation tillåten på
interaktiva element (0 2px 6px rgb(0 0 0 / 0.05))."*

audit-2026-04.md Fas 1 påstod att 639 → 2 instanser nåddes — det stämmer
inte i nuläget. 403 nya skuggor har sipprat in.

**Mest graverande lokaler:**

- `client/src/pages/Landing.tsx` — 8 (delvis legitim hero, granskas)
- `client/src/pages/CVBuilder.tsx` — 5
- `client/src/pages/JobSearch.tsx` — 3
- `client/src/components/Onboarding.tsx` — 8
- `client/src/components/cv/MyCVs.tsx` — 5
- 16 dashboard-widgets med 2–3 shadow vardera

**Åtgärd:** Återupprepa Fas 1-mönstret med ett ESLint-regelpass som blockerar
nya `shadow-md/lg/xl/2xl`-klasser i CI.

### G3. Header-uniformitet bryts på fyra centrala sidor

DESIGN.md: *"Hjältesektion = neutral grå på alla sidor."*

Följande sidor använder INTE `PageLayout`/`PageHeader`:

| Sida | Fil | Konsekvens |
|------|-----|------------|
| Dashboard | `client/src/pages/Dashboard.tsx` | Egen layout, ingen 4px hub-kant, ingen `data-domain` automatiskt |
| Profile | `client/src/pages/Profile.tsx` | Använder `<ProfileHeader>` (avatar + progress) — egen identitet |
| CVBuilder | `client/src/pages/CVBuilder.tsx` | 1122 rader monolit utan PageHeader |
| SkillsGapAnalysis | `client/src/pages/SkillsGapAnalysis.tsx` | 875 rader, ingen PageLayout |

Dashboard är defensibelt (route `/`) eftersom hub-arkitekturen flyttar
home till `/oversikt` med eget launchpad-mönster — men `/dashboard`
finns kvar och bryter visuellt. Profile, CVBuilder och SkillsGapAnalysis
är klart skuld.

### G4. Hårdkodade `#hex`-färger i komponenter

580 träffar i 55 filer på `color: '#...'` eller `bg-[#...]`-mönster.

**Legitima:**
- `components/cv/templates/*` (192 + per-template) — semantisk per-mall.
- `components/ui/Badge.tsx` (6) — kategorifärger från DESIGN.md.

**Skuld:**
- `components/profile/sections/CompetenceSection.tsx` (2 hårdkodade)
- `components/career/SalaryInsights.tsx` (8)
- `components/career/CareerCoach.tsx` (11)
- `components/cv/ATSAnalyzer.tsx` (9)
- `components/cv/JobMatcher.tsx` (9)
- `components/dashboard/DashboardRiasecChart.tsx` (10)
- `components/jobs/JobDetailModal.tsx` (8)
- `components/interest-guide/RiasecChart.tsx` (6)

Diagram-färger är delvis legitima (chart-palett saknas i DESIGN.md, jfr
audit-2026-04.md sista anteckningarna), men `#hex` i kort, badges och
panel-bakgrunder är ren skuld — de följer inte sidans `--c-*`-tokens
och blir kvar på samma färg oavsett hub.

### G5. Inkonsekvent CTA-hierarki

audit-2026-04.md Fas 5 identifierade:

- Settings.tsx — 13 `bg-brand-900`
- Landing.tsx — 12
- CVBuilder.tsx — 12
- UnifiedProfile.tsx — 11

DESIGN.md: *"En primär CTA per vy."* Status: ej åtgärdat. Manuell
granskning krävs sida för sida.

### G6. Mobile-responsivitet ojämn på kritiska flöden

| Sida | Rader | Breakpoints (sm:/md:/lg:) |
|------|-------|---------------------------|
| `pages/CVPage.tsx` | 67 | 0 (wrapper-sida — OK) |
| `pages/CoverLetterPage.tsx` | 43 | 0 (wrapper — OK) |
| `pages/Wellness.tsx` | 49 | 0 (wrapper — OK) |
| `pages/Career.tsx` | 63 | 0 (wrapper — OK) |
| `pages/CVBuilder.tsx` | 1122 | 18 (underdimensionerat) |
| `pages/SkillsGapAnalysis.tsx` | 875 | 3 (kraftigt underdimensionerat) |
| `pages/InterviewSimulator.tsx` | 914 | 6 (underdimensionerat) |
| `pages/JobSearch.tsx` | 1009 | 25 (acceptabelt) |
| `pages/LinkedInOptimizer.tsx` | 477 | 2 (underdimensionerat) |
| `pages/Diary.tsx` | 220 | 5 (rimligt) |

**SkillsGapAnalysis** med 3 breakpoints över 875 rader är värst.
**LinkedInOptimizer** med 2 över 477 rader är näst sämst. Båda är AI-tunga
sidor som ska fungera på mobilt — men har minimal responsiv anpassning.

CLAUDE.md noterar redan att HubBottomNav "fungerar tekniskt men inte
designgranskad" — detta sträcker sig till hela mobilflödet.

---

## Komponentduplicering

### EmptyState — 4 implementationer

| Plats | Status | Användning |
|-------|--------|------------|
| `components/EmptyState.tsx` | äldst | bara via 0 imports som matchar |
| `components/ui/EmptyState.tsx` | kanonisk | exporteras via `ui/index.ts` |
| `components/dashboard/EmptyState.tsx` | duplikat med `EmptyStateCompact` | 2 imports |
| `components/cover-letter/CoverLetterMyLetters.tsx` | använder dashboard-varianten | enstaka |

Totalt 9 filer importerar någon EmptyState. Resten av kodbasen rullar
inline-strängar ("Inga...", "Du har inte..."). DESIGN.md saknar
explicit EmptyState-spec — det är en designluck som behöver fyllas.

### LoadingState / Skeleton — 5 implementationer

| Plats | Innehåll |
|-------|----------|
| `components/LoadingState.tsx` | `LoadingState`, `SkeletonLoader` (gammal) |
| `components/ui/LoadingState.tsx` | `LoadingState`, `Spinner`, `Skeleton`, `SkeletonCard`, `SkeletonGrid`, `SkeletonList`, `ErrorState`, `PageLoading`, `InlineLoading`, `ContentPlaceholder` |
| `components/ui/Skeleton.tsx` | `Skeleton`, `CardSkeleton`, `TextSkeleton`, `DashboardWidgetSkeleton`, `DashboardGridSkeleton`, `ListSkeleton`, `FormSkeleton`, `ProfileSkeleton`, `CVBuilderSkeleton`, `JobSearchSkeleton`, `ArticleSkeleton`, `TableSkeleton` |
| `components/dashboard/SkeletonWidget.tsx` | `SkeletonWidget`, `SkeletonStats`, `SkeletonWidgets`, `SkeletonNextStep`, `SkeletonHeader` |
| `components/dashboard/DashboardSkeleton.tsx` | `KpiCardSkeleton`, `HeroSkeleton`, `SectionSkeleton`, `OnboardingStepSkeleton`, `RiasecSkeleton`, `SidebarCardSkeleton`, `DashboardSkeleton` |

`ui/index.ts` exporterar **två** Skeleton-set sida vid sida (raderna 17–30
och 67–78) under aliaserade namn — det signalerar att paralleliteten
är medveten men ostädad. 244 ad hoc Loader2/animate-spin är symptomet.

### Button — 2 implementationer

- `components/ui/Button.tsx` — kanonisk, exporteras
- `components/ui/MemoizedButton.tsx` — separat React.memo-variant

`MemoizedButton` är troligen död prematur-optimering. Antingen baka in
memo i `Button` eller ta bort.

### Card

- `components/ui/Card.tsx` — kanonisk (`Card`, `CardHeader`, `CardFooter`,
  `CardSection`, `StatCard as CardStat`, `InfoCard`, `ActionCard`,
  `SkeletonCard`)
- `components/ui/PageCard.tsx` — separat (`PageCard`, `PageCardLink`,
  `PageCardGrid`)
- `components/ui/StatCard.tsx` — separat (kolliderar namnmässigt med
  Card.tsx-export)

Tre kort-implementationer med överlappande ansvar och en namnkollision
maskerad med `as`.

---

## Hub-arkitektur-konsistens

### H1. Routes utan hub-medlemskap

`App.tsx` registrerar dessa routes — `domains.ts` ger dem hub-färg —
men `navigation.ts::navHubs[].memberPaths` saknar dem:

| Route | domains.ts mappar till | Saknad memberPath i hub |
|-------|------------------------|--------------------------|
| `/linkedin-optimizer` | `activity` | jobb |
| `/international` | `activity` | jobb |
| `/profile` | `action` (default) | (ingen — neutral) |
| `/settings` | `action` (default) | (ingen — neutral) |
| `/oversikt/historik` | `action` (default) | (ingen — submapp under oversikt) |

**Följdfel:** På `/linkedin-optimizer` blir hub-färgen persika via
`data-domain`, men `getActiveHub('/linkedin-optimizer')` returnerar
**undefined** — så HubBottomNav-pillret för "Söka jobb" markeras inte
aktivt och sidebar visar inte sub-items för jobb-hubben. Djup-länken
fungerar färgmässigt men inte navigationsmässigt.

CLAUDE.md säger: *"Sidor under `/jobb`-hubben (t.ex. CV, Applications)
använder persika ... LinkedIn"* — men LinkedIn finns inte i datat.

**Åtgärd:** Lägg till `/linkedin-optimizer` och `/international` i
`navHubs[1].memberPaths` (jobb).

### H2. Hub-listor i CLAUDE.md/DESIGN.md kontra navigation.ts

| Hub | DESIGN.md säger | navHubs har | Diff |
|-----|-----------------|-------------|------|
| Söka jobb | JobSearch, Applications, Spontanansökan, CV, Cover Letter, Interview Simulator, Salary, International, LinkedIn Optimizer | 7 paths utan international/linkedin | -2 |
| Karriär | Career, Interest Guide, Skills Gap, Personal Brand, Education | 5 paths | OK |
| Resurser | Knowledge Base, Resources, Print Resources, External Resources, AI-team, Nätverk | 7 paths inkl `/help` | +1 (help) |
| Min vardag | Wellness, Diary, Calendar, Exercises, My Consultant, Profile | 5 paths utan profile | -1 |

`/help` i resurser-hubben är OK (resurser-domän är legitim för Help).
`/profile` är dock klassad som "neutral" i CLAUDE.md ("Sidor utanför
hubbarna ... Profile" — fast DESIGN.md listar profile under Min vardag).
**Inkonsekvens i specen själv** — kräver klargörande från designern.

### H3. Legacy `navGroups` (3-domän) lever kvar

`navigation.ts` exporterar fortfarande `navGroups` med 3 domäner
(`action`/`reflection`/`outbound`) — DESIGN.md säger uttryckligen:
*"Den tidigare 3-domän-modellen är **borttagen som designkoncept**."*

Sidebar.tsx har båda render-vägarna (`hub`-läge bakom
`VITE_HUB_NAV_ENABLED`, gammal `groups`-läge default). Eftersom
flagga-default är `false` i `isHubNavEnabled()` är **gammal nav fortfarande
default i prod**.

`navItems = navGroups.flatMap(...)` används av mobilnav (`MobileNav.tsx`).
Det innebär att mobilen ser 25-items-platta listan, inte 5-hub-systemet.

**Åtgärd:** Bestäm rollout-status. Om hubbar är klart — tippa flaggan
default till `true` och avlägsna `navGroups`/`navItems`. Om inte — uppdatera
DESIGN.md att 3-domän-koncept fortfarande är aktivt i mobilen.

---

## Mobile-responsivitet

Utöver G6 ovan:

### M1. Touch targets ej verifierade

DESIGN.md kräver minst 44px touch targets. `Button.tsx` har korrekt
`min-h-[44px]` på `size='md'`, men:

- 310 `<button className=...>`-instanser i sidor (utanför `Button`-wrapper)
- Många i CV-templates har `text-xs` + `p-1` — sannolikt under 44px

### M2. HubBottomNav inte designgranskad

CLAUDE.md anteckning: *"Mobil bottom nav (HubBottomNav) — fungerar tekniskt
men inte designgranskad."* — bekräftat utestående.

### M3. Modal/Dialog mobile-fit

`InterviewSimulator.tsx` (914 rader, 6 breakpoints) öppnar audio-modaler
som troligen inte är optimerade för mobil. Egen test krävs.

### M4. Karta — `components/map/SwedenMap.tsx`

Använder gradients (2) + 2 hårdkodade hex. Kartan har troligen
egen layout som inte respekterar `data-domain`.

---

## Konkreta åtgärder

### Hög prioritet

1. **Lägg `/linkedin-optimizer` och `/international` i `navHubs[1].memberPaths`.**
   Filer: `client/src/components/layout/navigation.ts`. Trivial fix
   som åtgärdar H1.
2. **Klargör profile-tillhörighet** (Min vardag eller neutral?). Uppdatera
   DESIGN.md ELLER `navHubs`/`domains.ts` så de är konsistenta.
3. **Konsolidera EmptyState till en kanonisk implementation**
   (`components/ui/EmptyState.tsx`). Avlägsna `components/EmptyState.tsx`
   och `components/dashboard/EmptyState.tsx`. Lägg in en `EmptyState`-sektion
   i DESIGN.md (saknas helt nu).
4. **Konsolidera Skeleton/LoadingState.** Behåll `components/ui/Skeleton.tsx`
   som primitiv + sektions-skeletons (DashboardSkeleton, CVBuilderSkeleton)
   som kompositioner. Avlägsna `components/LoadingState.tsx` och de äldre
   `dashboard/SkeletonWidget.tsx` om möjligt.
5. **Återupprepa Fas 1-pass på `bg-gradient-` och `shadow-md/lg/xl`** —
   459 + 403 träffar är för mycket för manuell rensning. Sed + ESLint-regel
   som blockerar nya införanden.

### Medel prioritet

6. **Migrera Dashboard, CVBuilder, SkillsGapAnalysis till PageLayout** så
   neutral PageHeader appliceras. Kräver designval om Dashboard ska
   bevara nuvarande hero (kanske som launchpad-undantag, jfr HubOverview).
7. **Mobile-pass på SkillsGapAnalysis (3 bp / 875 rader)** och LinkedInOptimizer.
8. **Tippa `VITE_HUB_NAV_ENABLED=true` som default** eller avlägsna
   `navGroups`-export (efter beslut om rollout-status).
9. **Avgör MemoizedButton-fortsättning.** Antingen baka in `React.memo`
   i `ui/Button.tsx` eller avlägsna `MemoizedButton.tsx`.

### Låg prioritet

10. **Definiera chart-palett i DESIGN.md.** RiasecChart, BigFiveChart,
    LineChart, BarChart har alla per-fil-färgsystem.
11. **EmptyState-illustrationer.** `IllustratedEmptyState` finns men
    används aldrig — antingen ta bort eller skapa illustrationssvit.
12. **Dokumentera `style={{ background: ... }}` som anti-pattern.** 580
    träffar är för många — flera är CV-mallar (legitima), men inte alla.

---

## Slutkommentar

Designsystemet är **läsbart och välspecat** — det är dess räddning.
Men den faktiska implementationen är som ett fint hus där bara entrén
är renoverad. Hub-landningssidorna (oversikt/jobb/karriar/resurser/min-vardag)
är designet enligt DESIGN.md. Allt under dem (CV, Wellness, JobSearch,
Career, m.fl. ~25 sidor) är fortfarande i gammalt skick — vilket DESIGN.md
själv noterar under "Vad återstår".

Den största risken är inte de enskilda överträdelserna utan att
**audit-2026-04.md:s "✅ KLAR"-status för Fas 1 (shadow-rensning)
inte längre stämmer**. Om designgranskningen påstår att städning är
gjord men 403 nya skuggor smugits in på 13 dagar är det ett team- och
process-problem, inte ett kod-problem. Behöver lint-regel för att
inte regressa.
