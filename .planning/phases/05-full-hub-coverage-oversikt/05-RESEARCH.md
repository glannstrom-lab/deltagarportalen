# Phase 5: Full Hub Coverage + Översikt — Research

**Researched:** 2026-04-28
**Domain:** React 19 / Supabase hub-loader replication + widget data-mapping + Översikt onboarding + HUB-06 empathy gate
**Confidence:** HIGH (grounded entirely in actual codebase — all patterns confirmed in source code)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Architecture replication (Phase 3 + 4 pattern):**
- Per hub: `useKarriarHubSummary`, `useResurserHubSummary`, `useMinVardagHubSummary`, `useOversiktHubSummary` — all mirror Phase 3's `useJobsokHubSummary` (Promise.all + queryClient.setQueryData for cache-share)
- Per hub: `KarriarDataContext`, `ResurserDataContext`, `MinVardagDataContext`, `OversiktDataContext` — peer-pattern from Phase 3
- Per hub: `KarriarLayoutContext`, etc. — Phase 4 pattern, same `useWidgetLayout(hubId)` hook
- Provider order per hub-page: `*LayoutProvider` OUTER → `*DataProvider` INNER (Phase 4-locked)
- Existing hooks (useApplications/useDocuments/etc.) reused — hub-loader writes INTO existing query keys

**Widget-data-strategy (per widget — planneraren verifierar tabell-existens):**

Karriär (HUB-02):
- Karriärmål: NY tabell `career_goals` ELLER reuse `profiles.career_goals` JSONB — planneraren bestämmer
- Intresseguide: `useInterestProfile` — koppla
- Kompetensgap: `useJobMatching`/skills_analyses — koppla, visa top-3 kompetensluckor
- Personligt varumärke: `personal_brand_audits` (Phase 3) — senaste audit-score
- Utbildning: `useEducationSearch` — koppla
- LinkedIn: `profile.linkedin_url` + senaste optimerar-suggestion

Resurser (HUB-03):
- Mina dokument: `useDocuments` (CV + cover letters count) — koppla
- Kunskapsbank: `useArticles` — senaste lästa artikel
- Externa resurser: existing content — senast besökt resurs
- Utskriftsmaterial: print-resources content — status
- AI-team: ingen DB — visa snabblänk till verktygen
- Övningar: exercises content — senaste fullförd

Min Vardag (HUB-04):
- Hälsa: `useEnergyLevel`/mood_logs — senaste loggning + 7-dagars sparkline
- Dagbok: `useDiaryEntries` — entry-count + senaste anteckning
- Kalender: `calendar_events` — kommande möten
- Nätverk: `network_contacts` — kontakt-count
- Min konsulent: `consultant_participants` — konsulent-namn + nästa möte

Översikt (HUB-05):
- XL onboarding: `profile.onboarded_hubs` (NY KOLUMN — additiv migration) → om null/empty visa "kom igång"-CTA
- Cross-hub summary: 6 mini-widgets som läser från alla 4 hub-summary-loaders aggregerat (cachade React Query-nycklar)

**Schema-tillägg (alla additiva):**
- `profiles.onboarded_hubs TEXT[] DEFAULT '{}'` — för Översikt onboarding-detection
- `career_goals` NY TABELL om behövs (planneraren verifierar `profiles.career_goals` JSONB räcker)
- Inga andra schema-ändringar

**HUB-06 — Final empty-state-pass:**
- Varje av 24+ widgets får empty-state-rad i `05-PRE-IMPL-COPY-REVIEW.md`
- Empati-review ONE GÅNG av `arbetskonsulent` + `langtidsarbetssokande`
- BLOCKs stoppar; FLAGs deferreras till v1.1 backlog
- Sign-off i `05-EMPATHY-REVIEW.md`

**Plan-storleksstrategi (6 plans):**
1. Plan 01: DB-discovery + onboarded_hubs migration + career_goals if needed
2. Plan 02: Karriär hub (6 widgets + loader + persistence)
3. Plan 03: Resurser hub (6 widgets + loader + persistence)
4. Plan 04: Min Vardag hub (5 widgets + loader + persistence)
5. Plan 05: Översikt hub (XL onboarding + 6 cross-hub summary)
6. Plan 06: HUB-06 empty-state-final-pass + empati-review-ship-gate

**Anti-shaming + WCAG (Phase 3 carry-forward):**
- Inga råa procent som primär KPI på någon ny widget
- Milestone-framing istället för "X% klart"
- Avslutade/avslagna items dolda by default
- prefers-reduced-motion via tokens.css auto-routing
- Keyboard-navigation per Phase 2 + 3 contract
- Empati-review är OBLIGATORISK ship-gate

**Inviolabelt:**
- Inga DROP, inga destruktiva ALTER COLUMN — bara `ADD COLUMN IF NOT EXISTS` och `CREATE TABLE IF NOT EXISTS`
- NEVER `npx supabase db push` — alltid `npx supabase db query --linked -f`
- Originalsidor (27 deep-link routes) helt orörda
- Existerande hooks orörda — bygg ovanpå
- Phase 4's `useWidgetLayout`, `JobsokLayoutContext`-pattern återanvänds

### Claude's Discretion

- Exakt cross-hub summary-widget-set för Översikt (välj 6 av de mest informationstäta)
- Exakt onboarding-CTA-copy (utgå från Phase 2 UI-SPEC empty-state-mönster)
- Per-widget loader-implementation-detail
- Test-strategi (Vitest unit + minimal integration per hub-test-pattern från Phase 3)
- WIDGET_LABELS-utökningar för 24 nya widgets
- WIDGET_REGISTRY-utökningar (alla nya widgets måste vara lazy()-imported)
- HiddenWidgetsPanel hub-agnostic-strategi (se Architecture Patterns)

### Deferred Ideas (OUT OF SCOPE)

- Drag-and-drop omsortering (DRAG-01, v1.1)
- Tangentbord-tillgänglig sortering (DRAG-02, v1.1)
- Per-breakpoint UI-toggle (DRAG-03, v1.1)
- Lägg till widget från katalog (CAT-01, v1.1)
- Smart contextual suggestions på Översikt (SMART-01, v1.1)
- Engelsk översättning (i18next finns men svenska räcker för launch)
- WCAG-audit av 27 originalsidor (separat audit-projekt)
- Konsolidering av per-widget-hooks med deep-link-hooks (v1.1)

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HUB-02 | Karriär visar widgets för Karriärmål, Intresseguide, Kompetensgap, Personligt varumärke, Utbildning, LinkedIn — alla med riktig data | `career_plans`/`profiles.career_goals` + `interestguide_history` + `skills_analyses` + `personal_brand_audits` + `useEducationSearch` + `profiles.linkedin_url` (verified in migrations; see widget-data-map) |
| HUB-03 | Resurser visar widgets för Mina dokument, Kunskapsbank, Externa resurser, Utskriftsmaterial, AI-team, Övningar — alla med riktig data | `cvs`/`cover_letters` + `article_reading_progress` + static content + `ai_team_sessions` + `exercises` table (see widget-data-map) |
| HUB-04 | Min Vardag visar widgets för Hälsa, Dagbok, Kalender, Nätverk, Min konsulent — alla med riktig data | `mood_logs` + `diary_entries` + `calendar_events` + `network_contacts` + `consultant_participants` (see widget-data-map; `useCalendar` not an existing hook — direct Supabase in loader) |
| HUB-05 | Översikt visar onboarding/next-step XL-widget + max 6 sammanfattande widgets | `profiles.onboarded_hubs` (new additive column) + React Query cache aggregation from 4 hub loaders |
| HUB-06 | Alla widget-empty-states har handlingsstöttande kopia (ej bara nollor) | Artefakt `05-PRE-IMPL-COPY-REVIEW.md` (utvidgar 03-PRE-IMPL-COPY-REVIEW.md till ~36 rader) + empati-review-gate |

</phase_requirements>

---

## Summary

Phase 5 är den sista och största fasen i v1.0. Den replikerar ett välbeprövat mönster (Phase 3 hub-loader + Phase 4 layout-persistens) fyra gånger i rad — Karriär, Resurser, Min Vardag, Översikt — och avslutar med en formell HUB-06 empati-review-gate som låser final copy för alla 24+ widgets. All planering gynnas av det faktum att mönstret är bevisat; osäkerheterna är begränsade till (a) vilken exakt tabell som bäst backar varje widget, och (b) hur `HiddenWidgetsPanel` görs hub-agnostic utan att bryta JobsokHub.

**Viktigaste fynd:** `profiles.career_goals` (JSONB) finns redan i databasen (migration `20260416120000`) och räcker för Karriärmål-widgeten — ingen ny tabell behövs. `career_plans` + `career_milestones` finns för djupare career-goal-data. `skills_analyses`-tabellen finns och backar Kompetensgap-widgeten. Kalender-data finns i `calendar_events`. Nätverk har `network_contacts`-tabell. Konsulent-länk finns i `consultant_participants`. `HiddenWidgetsPanel` importerar `useJobsokLayout` direkt och måste antingen dupliceras per hub eller göras props-baserad (rekommendation: props-baserad variant).

**Primary recommendation:** Bygg Plan 01 som ett rent discovery + migration-plan (SQL-verifiering mot live-DB + onboarded_hubs migration), sedan Karriär → Resurser → Min Vardag → Översikt i strikt sekvens (varje plan ger testbara commits), med Plan 06 som en formell empati-review-plan likt Phase 3's Plan 05.

---

## Standard Stack

### Core (hela Phase 5 — samma som Phase 3/4, inga nya beroenden)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | v5 (befintlig) | Hub-loader + cache-delning | Bevisat i Phase 3; hub-loader-pattern established |
| supabase-js | v2 (befintlig) | Direct Supabase selects i hub-loaders | RLS + anon-client-pattern already proven |
| react (lazy/Suspense) | v19 (befintlig) | Widget code-splitting | Bundle contract established Phase 2 |
| vitest + @testing-library/react | befintlig | Hub integration tests | Same test stack as JobsokHub.test.tsx |

### Inga nya npm-beroenden

Phase 5 introducerar inga nya paket. Alla mönster och bibliotek är etablerade i Phase 2-4. Sparkline-primitive finns redan. Widget.Root/Header/Body/Footer finns. HubGrid finns.

---

## Architecture Patterns

### Hub-loader-pattern (direktreplikering av Phase 3)

Exakt samma struktur som `useJobsokHubSummary.ts` kopieras för varje ny hubb:

```typescript
// Source: client/src/hooks/useJobsokHubSummary.ts (Phase 3)
// Kopiera, ändra: importerad typ, query key-sträng, Promise.all-tabeller
export const KARRIAR_HUB_KEY = (userId: string) =>
  ['hub', 'karriar', userId] as const

export function useKarriarHubSummary() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const queryClient = useQueryClient()

  return useQuery<KarriarSummary>({
    queryKey: KARRIAR_HUB_KEY(userId),
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const [careerGoalsR, interestR, skillsR, brandR] = await Promise.all([
        // ... per-hub selects
      ])
      const summary: KarriarSummary = { /* ... */ }
      // Deep-link sync via queryClient.setQueryData if relevant
      return summary
    },
  })
}
```

### DataContext-pattern (direktreplikering av Phase 3)

```typescript
// Source: client/src/components/widgets/JobsokDataContext.tsx (Phase 3)
// Kopiera, ändra: interface-namn, context-namn, slice-typer

export interface KarriarSummary { /* se widget-data-map nedan */ }
const KarriarDataContext = createContext<KarriarSummary | undefined>(undefined)

export function KarriarDataProvider({ value, children }: ...)
export function useKarriarWidgetData<K extends keyof KarriarSummary>(slice: K)
export function useKarriarSummary(): KarriarSummary | undefined
```

### LayoutContext-pattern (direktreplikering av Phase 4)

```typescript
// Source: client/src/components/widgets/JobsokLayoutContext.tsx (Phase 4)
// Kopiera, ändra: interface-namn (KarriarLayoutValue), context-namn, hook-namn (useKarriarLayout)
// Allt annat identiskt — useWidgetLayout(hubId) är hub-agnostisk
```

### Hub-page-wiring-pattern (JobsokHub.tsx → alla 4 nya hubbar)

Phase 4's 04-04-SUMMARY.md dokumenterar exakt replikeringsrecept i 8 steg:
1. Import: `useWidgetLayout`, `useBreakpoint`, `*LayoutProvider`, `*LayoutValue`, `HiddenWidgetsPanel*`, `WIDGET_LABELS`, `getDefaultLayout`, `WIDGET_REGISTRY`, `WidgetLayoutItem`
2. Hub-local state: `useState` för `editMode` + `panelOpen`
3. `effectiveLayout = layout.length > 0 ? layout : getDefaultLayout(hubId, breakpoint)`
4. Build `layoutValue: *LayoutValue` from effectiveLayout mutators
5. Render order: `<*LayoutProvider value={layoutValue}><HubDataProvider value={...}>`
6. `actions` slot: trigger button only — panel renders inside provider tree
7. Each widget gets `editMode={editMode} onHide={() => hideWidget(item.id)}`
8. All widget components destructure and forward `onHide` to `Widget`

### Kritisk fix från Phase 4: HiddenWidgetsPanel hub-agnostisk

**Problem:** `HiddenWidgetsPanel` importerar direkt `useJobsokLayout` från `JobsokLayoutContext.tsx`:
```typescript
// Nuvarande — hub-locked:
import { useJobsokLayout, selectHiddenWidgets } from './JobsokLayoutContext'
```

**Lösning (props-baserad — rekommenderas):** Gör panelen hub-agnostisk via props:
```typescript
interface HiddenWidgetsPanelProps {
  isOpen: boolean
  onClose: () => void
  layout: WidgetLayoutItem[]        // från hub-specifik context
  onShowWidget: (id: string) => void
  onResetLayout: () => void
}

export function HiddenWidgetsPanel({ isOpen, onClose, layout, onShowWidget, onResetLayout }) {
  // Ersätt useJobsokLayout() med props
  const hidden = layout.filter(item => item.visible === false)
  // ...
}
```

Varje hub-page wrapper skickar sina mutators som props. `JobsokHub` uppdateras för att skicka samma props. Alternativet (duplicera panelen × 4) är sämre — duplicering av 136 rader logik.

**Plan 02 måste fixa detta** som sitt första steg (refaktorera HiddenWidgetsPanel till props-baserad) innan Karriär-hubb kan wigas.

### Section-struktuer per hub

```typescript
// Utöka defaultLayouts.ts med getKarriarSections(), getResurserSections() etc.
// Analogt med befintlig getJobbSections()

export function getKarriarSections(): SectionedLayout[] {
  return [
    { title: 'Utforska', items: [/* karriarmål, intresseguide */] },
    { title: 'Analysera', items: [/* kompetensgap, personligt varumärke */] },
    { title: 'Utveckla', items: [/* utbildning, linkedin */] },
  ]
}
```

### Rekommenderat projektstruktur (nya filer)

```
client/src/
├── hooks/
│   ├── useKarriarHubSummary.ts       (Plan 02)
│   ├── useResurserHubSummary.ts      (Plan 03)
│   ├── useMinVardagHubSummary.ts     (Plan 04)
│   └── useOversiktHubSummary.ts      (Plan 05)
├── components/widgets/
│   ├── KarriarDataContext.tsx         (Plan 02)
│   ├── KarriarLayoutContext.tsx       (Plan 02)
│   ├── ResurserDataContext.tsx        (Plan 03)
│   ├── ResurserLayoutContext.tsx      (Plan 03)
│   ├── MinVardagDataContext.tsx       (Plan 04)
│   ├── MinVardagLayoutContext.tsx     (Plan 04)
│   ├── OversiktDataContext.tsx        (Plan 05)
│   ├── OversiktLayoutContext.tsx      (Plan 05)
│   ├── KarriarmalWidget.tsx           (Plan 02) — karriärmål
│   ├── IntresseguideWidget.tsx        (Plan 02) — intresseguide
│   ├── KompetensgapWidget.tsx         (Plan 02) — kompetensgap
│   ├── PersonligtVarumarkeWidget.tsx  (Plan 02) — personligt varumärke
│   ├── UtbildningWidget.tsx           (Plan 02) — utbildning
│   ├── LinkedInWidget.tsx             (Plan 02) — linkedin
│   ├── MinaDokumentWidget.tsx         (Plan 03) — dokument
│   ├── KunskapsbankenWidget.tsx       (Plan 03) — kunskapsbank
│   ├── ExternaResurserWidget.tsx      (Plan 03) — externa resurser
│   ├── UtskriftsmaterialWidget.tsx    (Plan 03) — utskrift
│   ├── AITeamWidget.tsx               (Plan 03) — ai-team
│   ├── OvningarWidget.tsx             (Plan 03) — övningar
│   ├── HalsaWidget.tsx                (Plan 04) — hälsa
│   ├── DagbokWidget.tsx               (Plan 04) — dagbok
│   ├── KalenderWidget.tsx             (Plan 04) — kalender
│   ├── NatverkWidget.tsx              (Plan 04) — nätverk
│   ├── MinKonsulentWidget.tsx         (Plan 04) — min konsulent
│   ├── OnboardingXLWidget.tsx         (Plan 05) — översikt XL
│   └── [up to 6 cross-hub summary widgets] (Plan 05)
└── pages/hubs/
    ├── KarriarHub.tsx    (Plan 02 — ersätter Phase 2 stub)
    ├── ResurserHub.tsx   (Plan 03 — ersätter Phase 2 stub)
    ├── MinVardagHub.tsx  (Plan 04 — ersätter Phase 2 stub)
    └── HubOverview.tsx   (Plan 05 — ersätter Phase 2 stub)
```

---

## Widget–Data Mapping (kritisk sektion — plan-execution beror på detta)

Varje widget mappad till exakt tabell/hook, query-strategi, och empty-state-trigger.

### Karriär (HUB-02)

#### Karriärmål-widget

**Backing data:** `profiles.career_goals` JSONB (struktur: `{shortTerm, longTerm, preferredRoles, targetIndustries, updatedAt}`) — BEKRÄFTAT EXISTERAR i migration `20260416120000_add_employment_status.sql`.

**Rekommendation:** Använd `profiles.career_goals` JSONB direkt. Ingen ny tabell behövs. Hub-loader hämtar profil-raden och extraherar `career_goals`-slicen. Karriärmål-widgeten visar `shortTerm`-strängen som primär KPI (om satt) eller empty-state.

**Alternativ (ignorera om ej behövs):** `career_plans`-tabellen (från `20260412100000_career_module_tables.sql`) erbjuder rikare datamodell (milestones, progress). Karriärmål-widgeten behöver dock bara visa en sammanfattning — inte hela planen. Detaljerna finns på deep-link-sidan.

**Hub-loader query:**
```typescript
supabase.from('profiles')
  .select('career_goals, linkedin_url')
  .eq('id', userId)
  .maybeSingle()
```

**Empty-state trigger:** `!profile?.career_goals?.shortTerm && !profile?.career_goals?.longTerm`

**Empty-state copy (Phase 2 UI-SPEC kontrakt):**
- Heading: "Inga aktiva mål" (från 02-UI-SPEC.md Empty State Contract)
- Body: "Sätt ditt nästa karriärmål och börja planera"
- CTA: "Skapa mitt karriärmål"

#### Intresseguide-widget

**Backing data:** `interestguide_progress` + `interestguide_history` (via `useInterestProfile` hook, queryKey `['interestProfile']`).

**Rekommendation:** Hub-loader kallar INTE `useInterestProfile` direkt (den är sin egna hook). Istället: loader skriver till samma queryKey via `queryClient.setQueryData(['interestProfile'], ...)` efter en rå Supabase-select av `interestguide_progress`. Alternativt: widget-komponenten läser direkt från befintlig `useInterestProfile`-hook som cache-läsare (ingen dubbel fetch om staleTime inte löpt ut).

**Enklast:** Intresseguide-widget gör en direkt useInterestProfile()-anrop (befintlig hook) istället för att gå via DataContext. Hub-loader hämtar inte interestProfile-data separat. Widgeten är self-contained i sin data-fetch.

**Empty-state trigger:** `!profile.hasResult`

**Empty-state copy:**
- Heading: "Utforska dina intressen"
- Body: "Ta reda på vilka yrken som matchar dig bäst"
- CTA: "Starta intresseguide"

#### Kompetensgap-widget

**Backing data:** `skills_analyses`-tabellen (BEKRÄFTAT i `20260412100000_career_module_tables.sql`). Kolumner: `dream_job`, `skills_comparison JSONB`, `match_percentage`, `created_at`. Senaste analys hämtas.

**Hub-loader query:**
```typescript
supabase.from('skills_analyses')
  .select('dream_job, skills_comparison, match_percentage, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()
```

**Widget visar:** `dream_job` som rubrik + top-3 kompetenser som saknas (från `skills_comparison` JSONB). ALDRIG `match_percentage` som primär KPI (anti-shaming). Använd istället en kvalitativ label: "Nära målet", "Bra framsteg" etc. baserat på procent-bracket.

**Empty-state trigger:** ingen analys gjord (`skills_analyses` tom)

**Empty-state copy:**
- Heading: "Ingen analys gjord"
- Body: "Ta reda på vilka kompetenser du behöver för din drömroll"
- CTA: "Gör analys"

#### Personligt varumärke-widget

**Backing data:** `personal_brand_audits` (Phase 3-migration `20260429_personal_brand_audits.sql`). Kolumner: `score NUMERIC(4,1)`, `dimensions JSONB`, `created_at`. Senaste audit.

**OBS:** Det finns ÄVEN `personal_brand_audit` (SINGULAR, från `20260322183304_personal_brand_tables.sql`) — äldre tabell med annorlunda schema. Phase 3 skapade `personal_brand_audits` (PLURAL) för persistens. Använd PLURAL-tabellen.

**Hub-loader query:**
```typescript
supabase.from('personal_brand_audits')
  .select('score, dimensions, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()
```

**Widget visar:** Senaste audit-score som milestone-label (ej råt nummer som primär KPI). Exempelvis: "Starkt varumärke" (score >= 75), "Bra start" (score >= 50), "Förbättringsområden" (score < 50).

**Empty-state trigger:** ingen rad i `personal_brand_audits`

**Empty-state copy:**
- Heading: "Ditt personliga varumärke"
- Body: "Gör en audit och se hur starkt ditt varumärke är"
- CTA: "Starta audit"

#### Utbildning-widget

**Backing data:** `useEducationSearch` är en _sökhook_ (debounced search, inte cached data). För widgeten behövs istället ett mått på "senaste utbildningssök" eller sparade utbildningar. Kontrollera: ingen `saved_educations`-tabell hittades i migrationerna.

**Rekommendation:** Utbildning-widget är i praktiken en static-content-widget (ingen persistent data för widgetens summary-view). Widgeten visar en handlingsorienterad CTA: "Sök utbildningar" med en direktlänk till utbildningssök-sidan. Ingen hub-loader-slice behövs för Utbildning i v1.0. Widget är self-contained utan DataContext-data.

**Empty-state copy (permanent):**
- Heading: "Hitta din nästa utbildning"
- Body: "Sök bland tusentals kurser och utbildningar anpassade för dig"
- CTA: "Utforska utbildningar"

#### LinkedIn-widget

**Backing data:** `profiles.linkedin_url` TEXT — verifierat via applicationsApi.ts och NetworkingGuide.tsx som använder kolumnen. Kolumnen laddas via profil-raden i hub-loader (samma query som Karriärmål).

**Widget visar:**
- Om `linkedin_url` satt: länk + "Optimera din profil"-CTA till LinkedIn-optimizer-sidan
- Om ej satt: empty-state med uppmaning att lägga till LinkedIn-URL

**Empty-state trigger:** `!profile?.linkedin_url`

**Empty-state copy:**
- Heading: "Koppla LinkedIn"
- Body: "Lägg till din LinkedIn-URL och optimera din profil"
- CTA: "Lägg till LinkedIn"

---

### Resurser (HUB-03)

#### Mina dokument-widget

**Backing data:** `cvs` (via `useDocuments` queryKey `['cv-versions']`) + `cover_letters` (queryKey `['cover-letters']`). Hub-loader använder samma query som JobsokHub-loader för cvs/cover_letters och skriver till SAMMA queryKeys.

**Hub-loader query:** (identisk med JobsokHub-loader)
```typescript
supabase.from('cvs').select('id, updated_at').eq('user_id', userId).maybeSingle()
supabase.from('cover_letters').select('id').eq('user_id', userId)
```

**Widget visar:** Antal CV-versioner + antal brev. Milestone-label t.ex. "CV + 3 brev klara".

**Empty-state trigger:** `!cv && coverLetters.length === 0`

**Empty-state copy:**
- Heading: "Inga dokument ännu"
- Body: "Skapa ditt CV och dina personliga brev"
- CTA: "Gå till Söka jobb"

#### Kunskapsbank-widget

**Backing data:** `article_reading_progress` (BEKRÄFTAT i `20260306150000_create_all_cloud_tables.sql`). Senaste lästa artikel via `completed_at DESC`.

**Hub-loader query:**
```typescript
supabase.from('article_reading_progress')
  .select('article_id, progress_percent, is_completed, completed_at')
  .eq('user_id', userId)
  .order('completed_at', { ascending: false, nullsFirst: false })
  .limit(3)
```

**Widget visar:** Senaste lästa artikel + antal avklarade artiklar.

**Empty-state trigger:** ingen `article_reading_progress`-rad

**Empty-state copy:**
- Heading: "Utforska kunskapsbanken"
- Body: "Läs guider och tips för en mer effektiv jobbsökning"
- CTA: "Bläddra i kunskapsbanken"

#### Externa resurser-widget

**Backing data:** Ingen persisterad data i DB — extern content. Widgeten är static-content (curated list av externa länkresurser).

**Rekommendation:** Self-contained widget utan DataContext-slice. Renderar alltid en lista av handlingsorienterade externa resurser (AF, Jobtech, etc.). Ingen empty-state.

#### Utskriftsmaterial-widget

**Backing data:** Ingen persisterad data — statisk lista av mallar/blanketter. Self-contained widget.

**Rekommendation:** Renderar en lista av utskriftsbara resurser med direktlänkar. Alltid fylld med statisk data.

#### AI-team-widget

**Backing data:** `ai_team_sessions` (BEKRÄFTAT i `20260416100000_ai_team_sessions.sql`). Kolumner: `agent_id`, `messages JSONB`, `updated_at`. Antal sessioner = mått på aktivitet.

**Hub-loader query:**
```typescript
supabase.from('ai_team_sessions')
  .select('agent_id, updated_at')
  .eq('user_id', userId)
  .order('updated_at', { ascending: false })
  .limit(5)
```

**Widget visar:** Snabblänkar till de 5 AI-agenternas chat-gränssnitt. Om sessions finns: senast chattad agent och tidpunkt.

**Empty-state trigger:** inga `ai_team_sessions`

**Empty-state copy:**
- Heading: "Ditt AI-team väntar"
- Body: "Chatta med din karriärcoach, studievägledare eller motivationscoach"
- CTA: "Möt ditt AI-team"

#### Övningar-widget

**Backing data:** `exercises` + `article_reading_progress` (övningar är exercise-entities, ej articles). Kontrollera: exercises-tabellen skapas i `20260322100000_articles_exercises_tables.sql`. Senaste fullförda övning via `exercise_progress` eller liknande tabell.

**OBS:** `article_reading_progress` spårar BARA artiklar, inte övningar. Verificera i Plan 01 om en separat `exercise_progress`-tabell existerar.

**Rekommendation för v1.0:** Om ingen exercise_progress-tabell hittas i Plan 01 → Övningar-widget är static-content med en CTA till övningssidan (likt Utbildning).

**Empty-state copy:**
- Heading: "Träna och öva"
- Body: "Öva på intervjufärdigheter, presentationsteknik och mer"
- CTA: "Se alla övningar"

---

### Min Vardag (HUB-04)

#### Hälsa-widget

**Backing data:** `mood_logs`-tabellen (BEKRÄFTAT i `20260316_mood_logs.sql`) via `useMoodLogs`-hook (i `useDiary.ts`). Kolumner: `mood_level`, `energy_level`, `stress_level`, `log_date`.

**Hub-loader query:**
```typescript
supabase.from('mood_logs')
  .select('mood_level, energy_level, log_date')
  .eq('user_id', userId)
  .order('log_date', { ascending: false })
  .limit(7)  // 7-dagars sparkline
```

**Widget visar:** Senaste loggning + 7-dagars sparkline (befintlig Sparkline-primitive). Framing: "5 dagar i rad" (streak) ELLER "Logga idag" (ej loggat). ALDRIG "stressnivå: 4/5" som primär KPI.

**Empty-state trigger:** inga `mood_logs` alls

**Empty-state copy:**
- Heading: "Hur mår du idag?"
- Body: "Om du vill — logga ditt mående med ett klick"
- CTA: "Logga idag"

#### Dagbok-widget

**Backing data:** `diary_entries`-tabellen (BEKRÄFTAT i `20260317_diary_tables.sql`) via `useDiaryEntries`-hook. Kolumner: `title`, `content`, `created_at`.

**Hub-loader query:**
```typescript
supabase.from('diary_entries')
  .select('id, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(1)
```

**Widget visar:** Antal inlägg + datum för senaste anteckning.

**Empty-state trigger:** inga `diary_entries`

**Empty-state copy:**
- Heading: "Inga anteckningar ännu"
- Body: "Börja din dagbok — skriv fritt om din jobbsökning"
- CTA: "Skriv idag"

#### Kalender-widget

**Backing data:** `calendar_events`-tabellen (BEKRÄFTAT i `20260409_calendar_tables.sql`). Kolumner: `title`, `date`, `time`, `type`. Nästa kommande event (date >= today).

**OBS:** Ingen `useCalendar`-hook finns i `client/src/hooks/`. Hub-loader hämtar direkt via Supabase.

**Hub-loader query:**
```typescript
supabase.from('calendar_events')
  .select('id, title, date, time, type')
  .eq('user_id', userId)
  .gte('date', new Date().toISOString().split('T')[0])  // today or future
  .order('date', { ascending: true })
  .limit(3)  // nästa 3 events
```

**Widget visar:** Nästa möte (titel + datum/tid). Om inget: empty-state.

**Empty-state trigger:** inga kommande `calendar_events`

**Empty-state copy:**
- Heading: "Inga kommande möten"
- Body: "Lägg till intervjuer, möten och deadlines i din kalender"
- CTA: "Lägg till händelse"

#### Nätverk-widget

**Backing data:** `network_contacts`-tabellen. BEKRÄFTAT EXISTERAR — `20260412100000_career_module_tables.sql` noterar "network_contacts table already exists". Kolumner behöver verifieras i Plan 01, men sannolikt `id`, `user_id`, `name`, `created_at`.

**Hub-loader query:**
```typescript
supabase.from('network_contacts')
  .select('id')
  .eq('user_id', userId)
```

**Widget visar:** Antal kontakter. Milestone-label: "Bra nätverk" (>10), "Bygger nätverk" (>3), etc.

**Empty-state trigger:** `contacts.length === 0`

**Empty-state copy:**
- Heading: "Bygg ditt nätverk"
- Body: "Lägg till kontakter från ditt yrkesnätverk"
- CTA: "Lägg till kontakt"

#### Min konsulent-widget

**Backing data:** `consultant_participants`-tabellen (BEKRÄFTAT i `007_consultant_dashboard.sql`). Kolumner: `consultant_id`, `participant_id`. Hämta konsulent via join mot `profiles`-tabellen.

**Hub-loader query:**
```typescript
supabase.from('consultant_participants')
  .select('consultant_id, profiles!consultant_id(full_name, avatar_url)')
  .eq('participant_id', userId)
  .maybeSingle()
```

**Widget visar:** Konsulentens namn + bild (om finns). Nästa möte kan hämtas från `calendar_events` med `type = 'meeting'`.

**Empty-state trigger:** ingen rad i `consultant_participants` för userId

**Empty-state copy:**
- Heading: "Ingen konsulent ännu"
- Body: "Kontakta arbetsförmedlingen för att komma igång med coachning"
- CTA: "Mer om konsulentcoachning"

---

### Översikt (HUB-05)

#### Onboarding XL-widget

**Backing data:** `profiles.onboarded_hubs TEXT[] DEFAULT '{}'` — NY KOLUMN (Plan 01 migration).

**Logik:**
```typescript
// Ny kolumn på profiles-tabellen
// Varje gång användaren besöker en hub-sida: append hub-id till array
// (sker i hub-page useEffect, inte i loader)
const hasOnboarded = profile?.onboarded_hubs?.length > 0

if (!hasOnboarded) {
  // Visa "Kom igång"-XL-widget
} else {
  // Visa "Nästa steg"-XL-widget baserat på aktivitet
}
```

**XL-widget layout (4 columns wide × 1 row tall = 150px):** Horisontal layout med ikon + rubrik + body + CTA. Utökar befintlig XL-size-spec från 02-UI-SPEC.md.

**Kom igång-copy:**
- Heading: "Välkommen till din portal"
- Body: "Utforska dina hubbar och kom igång med din jobbsökning"
- CTA (upp till 4 snabblänkar): "Söka jobb →", "Karriär →", "Resurser →", "Min Vardag →"

**Nästa steg-copy (returning user):**
- Heading: "Bra jobbat {firstName}!"
- Body: Baserat på senaste aktivitet från cross-hub-aggregat — t.ex. "Du har {N} aktiva ansökningar. Fortsätt öva intervjun?"
- CTA: Kontextuell länk till mest aktiva hub

#### Cross-hub summary-widgets (6 st)

**Rekommenderade 6 widgets** (Claudtes discretion — välj de mest informationstäta):

| Widget | Läser från | Primär KPI |
|--------|-----------|------------|
| Jobb-summary | `JOBSOK_HUB_KEY` cache | Antal aktiva ansökningar |
| CV-status | `JOBSOK_HUB_KEY` cache | CV-milstolpe-label |
| Intervjuträning | `JOBSOK_HUB_KEY` cache | Senaste score |
| Karriärmål | `KARRIAR_HUB_KEY` cache | shortTerm-mål (trunkerat) |
| Hälsa | `MIN_VARDAG_HUB_KEY` cache | Senaste mood-sparkline |
| Dagbok | `MIN_VARDAG_HUB_KEY` cache | Antal inlägg |

**KRITISKT:** Cross-hub-widgetar GÖR INGA egna queries. De läser BARA från cache-keys som de 4 hub-loaderna populerar:
```typescript
// I OversiktDataContext: läs från befintliga cache-nycklar
const jobsokData = queryClient.getQueryData(JOBSOK_HUB_KEY(userId))
const karriarData = queryClient.getQueryData(KARRIAR_HUB_KEY(userId))
const minVardagData = queryClient.getQueryData(MIN_VARDAG_HUB_KEY(userId))
// OversiktHub-loader triggar de 4 hub-loaderna via prefetchQuery om cache är tom
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hub-data-cache-distribution | Eget state-management-system | React Query + DataContext-pattern (Phase 3) | Bevisat, minimal kod, cache-hit garanterat |
| Layout-persistens | Ny Supabase-tabell eller localStorage | `user_widget_layouts` + `useWidgetLayout(hubId)` (Phase 4) | Redan implementerat och testat |
| Widget-code-splitting | Statiska imports | `lazy()` i `registry.ts` (Phase 2) | Bundle-contract — CI-test bryter om man avviker |
| Sparklines | react-recharts eller annan lib | Befintlig Sparkline-primitive (Phase 2) | 160 KB sparade; primitiven är verified |
| Panel för dolda widgets | Ny komponent | `HiddenWidgetsPanel` (refaktorerad till props-based) | Redan 130 rader väl testad kod |
| Empati-review-process | Ad-hoc copy-granskning | Formell 2-steg artefakt-baserad process (Phase 3 pattern) | A11Y-05-gate kräver det |

---

## Common Pitfalls

### Pitfall A: HiddenWidgetsPanel glömmas bort att hub-agnostiseras

**Vad händer:** Plan 02 implementerar KarriarHub med full layout-persistens men `HiddenWidgetsPanel` importerar fortfarande `useJobsokLayout`. React kastar "useJobsokLayout must be used inside JobsokLayoutProvider" på KarriarHub.

**Hur undvika:** Plan 02's FÖRSTA task (Task 1) är refaktorering av `HiddenWidgetsPanel` till props-baserat API. Alla befintliga tester på `JobsokHub.test.tsx` verifieras gröna EFTER refaktorering.

**Varningssignal:** JobsokHub-tester rödnar efter HiddenWidgetsPanel-ändring → refaktoreringen är inte bakåtkompatibel.

### Pitfall B: onHide-forwarding glöms på nya widgets

**Vad händer:** Identisk bug som Phase 4's Auto-fix 1 — 8 widgets saknades `onHide`. Ny regel: alla 24 widgets måste destructurera `onHide` från `WidgetProps` och skicka `onHide={onHide}` till `Widget`.

**Hur undvika:** Dokumentera i plan-task: "Alla widget-komponenter MÅSTE destructurera `onHide` och forwarda till Widget. Verifiera med TDD: toggle editMode → bekräfta att hide-knappar syns."

### Pitfall C: personal_brand_audit (singular) vs personal_brand_audits (plural)

**Vad händer:** Loader väljer fel tabell. `personal_brand_audit` (singular) finns från `20260322183304` med annorlunda schema (total_score INTEGER, category_scores JSONB). `personal_brand_audits` (plural) skapades i Phase 3 med score NUMERIC(4,1).

**Hur undvika:** Alltid använda PLURAL-tabellen `personal_brand_audits` i Personligt varumärke-widgeten.

### Pitfall D: Cross-hub cache-läsning i Översikt fungerar bara om andra hub-loaders körts

**Vad händer:** Användaren går direkt till Översikt utan att ha besökt de andra hubbarna. De 4 hub-loader-cache-nycklarna är tomma. `getQueryData()` returnerar `undefined` för alla.

**Hur undvika:** OversiktHub-loader använder `prefetchQuery` för de 4 hub-loader-nycklarna vid mount:
```typescript
// I useOversiktHubSummary eller HubOverview mount-effect:
await Promise.all([
  queryClient.prefetchQuery({ queryKey: JOBSOK_HUB_KEY(userId), queryFn: ... }),
  queryClient.prefetchQuery({ queryKey: KARRIAR_HUB_KEY(userId), queryFn: ... }),
  // ... etc
])
```
Alternativt: OversiktHub läser från de 4 loaders via useQuery (inte getQueryData) — de är deduplicerade av React Query.

### Pitfall E: profiles-query körs dubbelt (karriärmål + linkedin är båda på profiles)

**Vad händer:** Karriär-hub-loader fetchar profiles-raden för `career_goals` och fetchar den igen för `linkedin_url` i separata Promise.all-slots.

**Hur undvika:** Hämta hela profiles-raden en gång: `SELECT career_goals, linkedin_url FROM profiles WHERE id = userId`. En query, två slices.

### Pitfall F: Intresseguide-widgeten gör egna Supabase-anrop utanför loader

**Vad händer:** `useInterestProfile` kallar `interestGuideApi.getProgress()` + `interestGuideApi.getHistory(1)` — det är 2 extra Supabase-anrop vid render (Pitfall 3: N+1 query waterfall).

**Hur undvika:** I KarriarHub: hub-loader prefetchar `['interestProfile']` queryKey. `useInterestProfile` i widgeten hittar cache-hit och gör inget nytt nätverksanrop. `staleTime: 5 * 60 * 1000` på `useInterestProfile` är tillräcklig — 5 min > hub-session-tid.

### Pitfall G: Övningar-widget får ingen data (saknad exercise_progress-tabell)

**Vad händer:** Ingen `exercise_progress`-tabell eller `user_exercises`-tabell hittas i migrationerna. Loader kraschar på `.from('exercises')` select utan att data existerar.

**Hur undvika:** Plan 01 MÅSTE verifiera `exercises`-tabellens exakta namn och schema mot live-DB (`\d exercises` ekvivalent via Supabase Studio). Om inget progress-spårning finns → Övningar-widget = static-content-widget (ingen loader-data).

### Pitfall H: defaultLayouts.ts returnerar `cv`-widget för alla 4 placeholder-hubbar

**Vad händer:** Befintlig `getDefaultLayout` för `karriar`, `resurser`, `min-vardag`, `oversikt` returnerar `[{ id: 'cv', size: 'S', order: 0, visible: true }]` (Phase 2 placeholder). Om Plan 02-05 glömmer att uppdatera dessa → alla 4 hubbar fortsätter visa CV-widgeten.

**Hur undvika:** Varje plan (02-05) MÅSTE uppdatera `defaultLayouts.ts` med rätt widget-ID:n för sin hubb som sitt FÖRSTA implementation-steg, INNAN widgets byggs.

---

## Code Examples

### Hub-loader (Karriär — verified replication pattern)

```typescript
// Source: client/src/hooks/useJobsokHubSummary.ts (Phase 3) — kopiera + anpassa
// File: client/src/hooks/useKarriarHubSummary.ts

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useSupabase'
import { supabase } from '@/lib/supabase'
import type { KarriarSummary } from '@/components/widgets/KarriarDataContext'

export const KARRIAR_HUB_KEY = (userId: string) =>
  ['hub', 'karriar', userId] as const

export function useKarriarHubSummary() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const queryClient = useQueryClient()

  return useQuery<KarriarSummary>({
    queryKey: KARRIAR_HUB_KEY(userId),
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const [profileR, skillsR, brandR, aiTeamR] = await Promise.all([
        supabase.from('profiles')
          .select('career_goals, linkedin_url')
          .eq('id', userId)
          .maybeSingle(),
        supabase.from('skills_analyses')
          .select('dream_job, skills_comparison, match_percentage, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('personal_brand_audits')  // PLURAL — Phase 3 table
          .select('score, dimensions, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        // interestProfile NOT fetched here — useInterestProfile hook handles its own cache
      ])

      return {
        careerGoals: profileR.data?.career_goals ?? null,
        linkedinUrl: profileR.data?.linkedin_url ?? null,
        latestSkillsAnalysis: skillsR.data ?? null,
        latestBrandAudit: brandR.data ?? null,
      } satisfies KarriarSummary
    },
  })
}
```

### DataContext (Karriär)

```typescript
// Source: client/src/components/widgets/JobsokDataContext.tsx — kopiera + anpassa
// File: client/src/components/widgets/KarriarDataContext.tsx

import { createContext, useContext, type ReactNode } from 'react'

export interface KarriarSummary {
  careerGoals: { shortTerm?: string; longTerm?: string; preferredRoles?: string[] } | null
  linkedinUrl: string | null
  latestSkillsAnalysis: {
    dream_job: string
    skills_comparison: unknown
    match_percentage: number
    created_at: string
  } | null
  latestBrandAudit: { score: number; dimensions: unknown; created_at: string } | null
}

const KarriarDataContext = createContext<KarriarSummary | undefined>(undefined)

export function KarriarDataProvider({ value, children }: { value: KarriarSummary | undefined; children: ReactNode }) {
  return <KarriarDataContext.Provider value={value}>{children}</KarriarDataContext.Provider>
}

export function useKarriarWidgetData<K extends keyof KarriarSummary>(slice: K) {
  const ctx = useContext(KarriarDataContext)
  if (!ctx) return undefined
  return ctx[slice]
}

export function useKarriarSummary(): KarriarSummary | undefined {
  return useContext(KarriarDataContext)
}
```

### HiddenWidgetsPanel (hub-agnostisk refaktorering)

```typescript
// File: client/src/components/widgets/HiddenWidgetsPanel.tsx (refaktorerad)
// Tar layout/callbacks som props istället för useJobsokLayout()

interface HiddenWidgetsPanelProps {
  isOpen: boolean
  onClose: () => void
  layout: WidgetLayoutItem[]
  onShowWidget: (id: string) => void
  onResetLayout: () => void
}

export function HiddenWidgetsPanel({
  isOpen, onClose, layout, onShowWidget, onResetLayout
}: HiddenWidgetsPanelProps) {
  const { confirm } = useConfirmDialog()
  const hidden = layout.filter(item => item.visible === false)
  // ... samma implementation men utan useJobsokLayout()
}
```

### JobsokHub.tsx-uppdatering (bakåtkompatibel)

```typescript
// JobsokHub.tsx skickar sina mutators som props till HiddenWidgetsPanel
<HiddenWidgetsPanel
  isOpen={panelOpen}
  onClose={() => setPanelOpen(false)}
  layout={effectiveLayout}
  onShowWidget={showWidget}
  onResetLayout={resetLayout}
/>
```

### Supabase migration — onboarded_hubs (Plan 01)

```sql
-- File: supabase/migrations/20260429_phase5_onboarded_hubs.sql
-- Apply: npx supabase db query --linked -f supabase/migrations/20260429_phase5_onboarded_hubs.sql
-- INVIOLABLE: only ADD COLUMN IF NOT EXISTS — no DROP, no ALTER TYPE

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarded_hubs TEXT[] DEFAULT '{}';

COMMENT ON COLUMN profiles.onboarded_hubs IS
  'Hub IDs the user has visited at least once. Used by OversiktHub for onboarding detection. Appended by each hub page on first mount. Values: karriar, resurser, min-vardag, jobb, oversikt.';
```

### WIDGET_REGISTRY utökning (Plan 02)

```typescript
// Source: client/src/components/widgets/registry.ts
// Utöka med alla 6 Karriär-widgets (alla MÅSTE vara lazy())

export const WIDGET_REGISTRY = {
  // === Söka jobb (existing) ===
  cv: { ... },
  // ... (oförändrade)

  // === Karriär (Plan 02) ===
  'karriar-mal': {
    component: lazy(() => import('./KarriarmalWidget')),
    defaultSize: 'M' as const,
    allowedSizes: ['S', 'M', 'L'] as WidgetSize[]
  },
  intresseguide: {
    component: lazy(() => import('./IntresseguideWidget')),
    defaultSize: 'M' as const,
    allowedSizes: ['S', 'M', 'L'] as WidgetSize[]
  },
  kompetensgap: {
    component: lazy(() => import('./KompetensgapWidget')),
    defaultSize: 'L' as const,
    allowedSizes: ['M', 'L'] as WidgetSize[]
  },
  'personligt-varumarke': {
    component: lazy(() => import('./PersonligtVarumarkeWidget')),
    defaultSize: 'M' as const,
    allowedSizes: ['S', 'M', 'L'] as WidgetSize[]
  },
  utbildning: {
    component: lazy(() => import('./UtbildningWidget')),
    defaultSize: 'S' as const,
    allowedSizes: ['S', 'M'] as WidgetSize[]
  },
  linkedin: {
    component: lazy(() => import('./LinkedInWidget')),
    defaultSize: 'S' as const,
    allowedSizes: ['S', 'M'] as WidgetSize[]
  },

  // === Resurser (Plan 03) ===
  'mina-dokument': { ... },
  kunskapsbanken: { ... },
  'externa-resurser': { ... },
  utskriftsmaterial: { ... },
  'ai-team': { ... },
  ovningar: { ... },

  // === Min Vardag (Plan 04) ===
  halsa: { ... },
  dagbok: { ... },
  kalender: { ... },
  natverk: { ... },
  'min-konsulent': { ... },

  // === Översikt (Plan 05) ===
  'onboarding-xl': { component: lazy(() => import('./OnboardingXLWidget')), defaultSize: 'XL' as const, allowedSizes: ['XL'] as WidgetSize[] },
  // + 6 cross-hub summary widgets
} satisfies Record<string, WidgetRegistryEntry>
```

**OBS:** `WIDGET_LABELS: Record<WidgetId, string>` är exhaustive (TypeScript kräver ALLA nycklar). Uppdatera widgetLabels.ts I SAMMA COMMIT som registry.ts utökas.

---

## DB-Discovery Checklist (Plan 01 måste verifiera)

Kör mot live-DB med `npx supabase db query --linked`:

```sql
-- 1. Verifierar profiles.career_goals existens
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('career_goals', 'linkedin_url', 'onboarded_hubs');

-- 2. Verifierar skills_analyses schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'skills_analyses';

-- 3. Verifierar personal_brand_audits (PLURAL) existens
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'personal_brand_audits';

-- 4. Verifierar network_contacts schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'network_contacts';

-- 5. Verifierar diary_entries schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'diary_entries';

-- 6. Verifierar consultant_participants schema + join-kolumner
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'consultant_participants';

-- 7. Verifierar exercises tabell (om finns)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name ILIKE '%exercise%';

-- 8. Verifierar mood_logs schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'mood_logs';
```

**Förväntade svar:**
- `profiles.career_goals`: JSONB (BEKRÄFTAT i migration)
- `profiles.linkedin_url`: Okänt — ej hittad i migrations. Kan ligga i profiles via äldre migration eller saknas. Plan 01 MÅSTE verifiera.
- `profiles.onboarded_hubs`: SAKNAS (migreras i Plan 01)
- `skills_analyses`: Existerar (bekräftat)
- `personal_brand_audits`: Existerar (Phase 3 migration)
- `network_contacts`: Existerar (noterad som "already exists" i career_module_tables)
- `diary_entries`: Existerar (bekräftat i `20260317_diary_tables.sql`)
- `consultant_participants`: Existerar (bekräftat i `007_consultant_dashboard.sql`)
- `exercises`: Osäkert — verifiera i Plan 01

---

## HUB-06: Empty-State Pass — Komplett Widget-Lista

Artefakten `05-PRE-IMPL-COPY-REVIEW.md` (Plan 06) MÅSTE täcka alla ~36 widgets (8 Jobb + 6 Karriär + 6 Resurser + 5 Min Vardag + 7 Översikt) × 3 states (fylld / tom / error).

**Förifierade 12 widgets från Phase 3 (03-PRE-IMPL-COPY-REVIEW.md) är KLARA — importera dem direkt.**

**24 nya widgets som behöver granskas i Plan 06:**

| # | Widget | Hub |
|---|--------|-----|
| 1 | Karriärmål | Karriär |
| 2 | Intresseguide | Karriär |
| 3 | Kompetensgap | Karriär |
| 4 | Personligt varumärke | Karriär |
| 5 | Utbildning | Karriär |
| 6 | LinkedIn | Karriär |
| 7 | Mina dokument | Resurser |
| 8 | Kunskapsbanken | Resurser |
| 9 | Externa resurser | Resurser |
| 10 | Utskriftsmaterial | Resurser |
| 11 | AI-team | Resurser |
| 12 | Övningar | Resurser |
| 13 | Hälsa | Min Vardag |
| 14 | Dagbok | Min Vardag |
| 15 | Kalender | Min Vardag |
| 16 | Nätverk | Min Vardag |
| 17 | Min konsulent | Min Vardag |
| 18 | Onboarding XL (ny användare) | Översikt |
| 19 | Onboarding XL (returning user) | Översikt |
| 20-25 | 6 cross-hub summary-widgets | Översikt |

**Empati-review-process (identisk med Phase 3 Plan 05):**
1. Samla copy-artefakt med alla 24+ new widgets × 3 states
2. Kör `arbetskonsulent`-agenten → lista PASS/FLAG/BLOCK per widget
3. Kör `langtidsarbetssokande`-agenten → lista PASS/FLAG/BLOCK
4. BLOCKs → revisions-task i Plan 06 (max 1 revision per agent)
5. FLAGs → v1.1 backlog
6. Sign-off i `05-EMPATHY-REVIEW.md` med datum + commit-SHA

---

## State of the Art (relevanta ändringar)

| Aspekt | Nuläge (Phase 4) | Phase 5 |
|--------|-----------------|---------|
| Hub-loaders | 1 (Jobsok) | 5 (Jobsok + 4 nya) |
| Widgets i registry | 8 | ~32 |
| WIDGET_LABELS entries | 8 | ~32 |
| Hubbar med persistens | 1 (jobb) | 5 (alla) |
| defaultLayouts täckning | 5 hubbar × 1 widget (placeholders) | 5 hubbar × full widget-set × 2 breakpoints |
| HiddenWidgetsPanel | Job-specifik | Hub-agnostisk (props-baserad) |
| PRE-IMPL-COPY-REVIEW entries | 12 (Jobb hub) | ~36 (alla hubbar) |

---

## Open Questions

1. **profiles.linkedin_url — existens oklar**
   - Vad vi vet: Kolumnen används i `applicationsApi.ts` och `NetworkingGuide.tsx` men hittas inte i någon migration
   - Vad som är oklart: Ligger den i en äldre migration vi inte granskat, eller i `initial_schema.sql`?
   - Rekommendation: Plan 01 verifierar via SQL. Om den saknas: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;` läggs till Plan 01-migrationen.

2. **exercises-tabell och exercise_progress-spårning**
   - Vad vi vet: `articles_exercises_tables.sql` skapar articles och exercises tabeller. Ingen user-specific progress-tabell hittades för exercises.
   - Vad som är oklart: Finns en `user_exercises`-tabell eller liknande?
   - Rekommendation: Plan 01 verifierar. Om ingen progress-spårning → Övningar-widget = static-content.

3. **consultant_participants join-struktur för Min konsulent-widget**
   - Vad vi vet: `consultant_participants`-tabellen existerar. Sannolika kolumner: `consultant_id`, `participant_id`.
   - Vad som är oklart: Exakt kolumnnamn för `participant_id` vs `user_id`.
   - Rekommendation: Plan 01 verifierar via `\d consultant_participants`.

4. **OversiktHub — prefetch-strategi för cross-hub cache**
   - Vad vi vet: Om user går direkt till Översikt är de 4 hub-loader-cacherna tomma.
   - Vad som är oklart: Bästa strategi — egna prefetches i OversiktHub, eller trigga de 4 loader-hookarna parallellt?
   - Rekommendation: Kör alla 4 hub-loaders (useJobsokHubSummary + useKarriarHubSummary + useResurserHubSummary + useMinVardagHubSummary) parallellt i HubOverview. React Query deduplicerar. useOversiktHubSummary aggregerar resultaten.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react (befintlig) |
| Config file | `client/vite.config.ts` (test-sektion) |
| Quick run command | `cd client && npm run test:run -- --reporter=verbose` |
| Full suite command | `cd client && npm run test:run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HUB-02 | KarriarHub renderar 6 widgets med riktig data | integration | `npm run test:run -- KarriarHub.test` | ❌ Wave 0 |
| HUB-02 | KarriarHub hub-loader returnerar KarriarSummary | unit | `npm run test:run -- useKarriarHubSummary.test` | ❌ Wave 0 |
| HUB-03 | ResurserHub renderar 6 widgets med riktig data | integration | `npm run test:run -- ResurserHub.test` | ❌ Wave 0 |
| HUB-03 | ResurserHub hub-loader returnerar ResurserSummary | unit | `npm run test:run -- useResurserHubSummary.test` | ❌ Wave 0 |
| HUB-04 | MinVardagHub renderar 5 widgets med riktig data | integration | `npm run test:run -- MinVardagHub.test` | ❌ Wave 0 |
| HUB-04 | MinVardagHub hub-loader returnerar MinVardagSummary | unit | `npm run test:run -- useMinVardagHubSummary.test` | ❌ Wave 0 |
| HUB-05 | HubOverview renderar XL onboarding-widget + summary-widgets | integration | `npm run test:run -- HubOverview.test` | ❌ Wave 0 |
| HUB-06 | Alla widgets har non-empty empty-states (anti-shaming guard) | unit | `npm run test:run -- anti-shaming` | ✅ befintlig (Phase 3) |
| HUB-06 | Empati-review-artefakt finns och är signerad | manual | `ls .planning/phases/05-*/05-EMPATHY-REVIEW.md` | ❌ Plan 06 |

### Per-widget test-kontrakt (replikera Phase 3 pattern)

Varje ny hub-side-test (KarriarHub.test.tsx etc.) ska täcka:

```
α  — "Anpassa vy" button renderas i actions slot
β  — toggle editMode via aria-pressed
γ  — [N] hide-knappar syns i edit mode
δ  — gömma widget tar bort den från grid (CUST-01)
ε  — Återvisa återställer gömd widget (CUST-01)
ζ  — Återställ öppnar ConfirmDialog (CUST-02)
η  — bekräfta reset återställer alla [N] widgets (CUST-02)
θ  — avbryt reset lämnar layout oförändrat (CUST-02)
ι  — upsert payload innehåller breakpoint='desktop' (Pitfall 6)
κ  — empty-state renderas utan att krascha (anti-shaming)
λ  — widget-error isoleras (övriga widgets renderas normalt)
```

Pattern: Identiskt med `client/src/pages/hubs/__tests__/JobsokHub.test.tsx` (α-μ test-notation). Kopiera mock-struktur, ändra hub-ID + widget-lista.

### Anti-shaming guard test

```typescript
// Befintlig test täcker Jobb-hub widgets (Phase 3).
// Phase 5: utöka för att täcka de 24 nya widget-filerna.
// Test verifierar att ingen raw percent (text-[32px]/text-[22px] font-bold)
// visas i primär KPI-slot. Källkodsskanning (readFileSync) per widget-fil.
```

### Sampling Rate

- **Per task commit:** `cd client && npm run test:run -- --reporter=dot` (snabb, < 30s)
- **Per wave merge:** `cd client && npm run test:run` (komplett suite)
- **Phase gate:** Full suite grön PLUS `05-EMPATHY-REVIEW.md` signerad PLUS `05-VALIDATION.md` nyquist_compliant: true

### Wave 0 Gaps (test-filer att skapa INNAN implementation)

- [ ] `client/src/pages/hubs/__tests__/KarriarHub.test.tsx` — täcker HUB-02 + α-λ
- [ ] `client/src/pages/hubs/__tests__/ResurserHub.test.tsx` — täcker HUB-03 + α-λ
- [ ] `client/src/pages/hubs/__tests__/MinVardagHub.test.tsx` — täcker HUB-04 + α-λ
- [ ] `client/src/pages/hubs/__tests__/HubOverview.test.tsx` — täcker HUB-05 + α-λ
- [ ] `client/src/hooks/useKarriarHubSummary.test.ts` — enkel smoke: renderar utan fel
- [ ] `client/src/hooks/useResurserHubSummary.test.ts` — enkel smoke
- [ ] `client/src/hooks/useMinVardagHubSummary.test.ts` — enkel smoke
- [ ] `client/src/hooks/useOversiktHubSummary.test.ts` — enkel smoke

**Test-stub-mönster** (direktreplikering av Phase 3 Wave 0):
```typescript
// Samma mock-setup som useJobsokHubSummary.test.ts
vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))
vi.mock('@/hooks/useSupabase', () => ({ useAuth: vi.fn(() => ({ user: { id: 'u1' } })) }))
// Minimal smoke: renderHook → expect(result.current.isLoading).toBe(false)
```

---

## Sources

### Primary (HIGH confidence)

- `client/src/hooks/useJobsokHubSummary.ts` — exakt källkod för hub-loader-pattern
- `client/src/components/widgets/JobsokDataContext.tsx` — exakt källkod för DataContext-pattern
- `client/src/components/widgets/JobsokLayoutContext.tsx` — exakt källkod för LayoutContext-pattern
- `client/src/pages/hubs/JobsokHub.tsx` — exakt 180-raders wiring-mönster
- `client/src/components/widgets/HiddenWidgetsPanel.tsx` — verifierar hub-specifik import (måste refaktoreras)
- `client/src/hooks/useWidgetLayout.ts` — verifierar hubId-agnostisk design
- `client/src/components/widgets/registry.ts` — verifierar lazy()-kontrakt
- `client/src/components/widgets/defaultLayouts.ts` — verifierar placeholder-issue (Pitfall H)
- `.planning/phases/04-layout-persistence-hide-show/04-04-jobsokhub-wiring-and-integration-tests-SUMMARY.md` — 8-stegs replikeringsrecept
- `.planning/phases/03-data-wiring-wcag/03-CONTEXT.md` — data-layer architecture decisions
- `supabase/migrations/20260416120000_add_employment_status.sql` — bekräftar `profiles.career_goals` JSONB
- `supabase/migrations/20260412100000_career_module_tables.sql` — bekräftar `career_plans`, `skills_analyses`, `network_contacts`
- `supabase/migrations/20260409_calendar_tables.sql` — bekräftar `calendar_events`
- `supabase/migrations/20260429_personal_brand_audits.sql` — bekräftar PLURAL-tabell (Phase 3)
- `supabase/migrations/20260317_diary_tables.sql` — bekräftar `diary_entries`
- `supabase/migrations/20260416100000_ai_team_sessions.sql` — bekräftar `ai_team_sessions`
- `supabase/migrations/20260429_user_widget_layouts.sql` — bekräftar layoutpersistens-schema
- `.planning/phases/02-static-widget-grid/02-UI-SPEC.md` — empty-state copy contract
- `.planning/research/PITFALLS.md` Pitfalls 3, 4, 9, 11, 13, 17 — tillämpliga på Phase 5

### Secondary (MEDIUM confidence)

- `client/src/hooks/useDiary.ts` — bekräftar `useDiaryEntries` + `useMoodLogs` API
- `client/src/hooks/useInterestProfile.ts` — bekräftar queryKey `['interestProfile']`
- `client/src/hooks/useDocuments.ts` — bekräftar queryKeys `['cv-versions']` + `['cover-letters']`
- `client/src/hooks/knowledge-base/useArticles.ts` — bekräftar queryKey `['articles']`
- `supabase/migrations/20260322183304_personal_brand_tables.sql` — verifierar SINGULAR-tabell (äldre, ej för Phase 5)
- `client/src/services/applicationsApi.ts` — bekräftar linkedin_url används men ej var den kolumnen sitter

### Tertiary / Okänt (kräver Plan 01 verifiering)

- `profiles.linkedin_url` — oklar migration-source; Plan 01 MÅSTE verifiera
- `exercises` tabell-schema och progress-spårning — verifiera mot live-DB
- `network_contacts` kolumnnamn — verifiera via Plan 01

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — inga nya beroenden, beprövat mönster
- Architecture: HIGH — direkt replikering av Phase 3+4, källkod läst
- Widget-data-mapping: HIGH för 18/24 widgets (confirmed by migrations), MEDIUM för 6 (exercise progress, consultant join, linkedin_url source)
- Pitfalls: HIGH — alla är derived från faktiska bugg-fynd i Phase 4
- Test-strategi: HIGH — direktreplikering av existerande test-struktur

**Research date:** 2026-04-28
**Valid until:** 2026-06-01 (stabilt domän — 30 dagar)

---

*Phase: 05-full-hub-coverage-oversikt*
*Researched: 2026-04-28 (autonomous overnight — biggest phase in v1.0)*
