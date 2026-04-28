# Phase 5: Full Hub Coverage + Översikt - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning
**Mode:** Smart-discuss (autonomous overnight, all proposals auto-accepted)

<domain>
## Phase Boundary

Bygg widgets för Karriär (HUB-02), Resurser (HUB-03), Min Vardag (HUB-04), och Översikt (HUB-05) med riktig data. Replikera Phase 3:s data-wiring-pattern och Phase 4:s layout-persistens-pattern över alla 4 nya hubbar. Slutgiltig empati-review-pass över hela widget-uppsättningen (HUB-06: alla empty-states action-oriented, inga "Inga data"). Detta är största fasen i v1.0 — fungerar som final-pass-fas.

**Inom scope:**
- **Karriär (HUB-02):** 6 widgets — Karriärmål, Intresseguide, Kompetensgap, Personligt varumärke, Utbildning, LinkedIn
- **Resurser (HUB-03):** 6 widgets — Mina dokument, Kunskapsbank, Externa resurser, Utskriftsmaterial, AI-team, Övningar
- **Min Vardag (HUB-04):** 5 widgets — Hälsa, Dagbok, Kalender, Nätverk, Min konsulent
- **Översikt (HUB-05):** 1 onboarding XL-widget + upp till 6 cross-hub-summary widgets
- **HUB-06:** Final empty-state-pass över alla 24+ widgets — inga råa nollor
- **Layout persistence** för alla 4 nya hubbar (Phase 4-pattern replikerat)
- **Empati-review-pass** av `arbetskonsulent` + `langtidsarbetssokande` på alla nya widgets

**Utom scope:**
- Drag/resize (DRAG-01..03 → v1.1)
- Add-from-catalog (CAT-01 → v1.1)
- Smart contextual suggestions (SMART-01 → v1.1)
- WCAG-audit av originalsidor (separat projekt)
- Engelsk översättning (i18next finns men svenska räcker för launch)

**Inviolabelt (Mikaels feedback från Phase 3, locked):**
- Inga DROP, inga destruktiva ALTER COLUMN — bara `ADD COLUMN IF NOT EXISTS` och `CREATE TABLE IF NOT EXISTS`
- NEVER `npx supabase db push` — alltid `npx supabase db query --linked -f`
- Originalsidor (27 deep-link routes) helt orörda
- Existerande tabeller orörda — bara additiva migrationer
- Existerande hooks orörda — bygg ovanpå
- Phase 4:s `useWidgetLayout`, `JobsokLayoutContext`-pattern återanvänds — kopiera, ändra inte

</domain>

<decisions>
## Implementation Decisions

### Architecture replication (Phase 3 + 4 pattern)
- **Per hub:** `useKarriarHubSummary`, `useResurserHubSummary`, `useMinVardagHubSummary`, `useOversiktHubSummary` — alla mirror Phase 3:s `useJobsokHubSummary` (Promise.all + queryClient.setQueryData för cache-share)
- **Per hub:** `KarriarDataContext`, `ResurserDataContext`, `MinVardagDataContext`, `OversiktDataContext` — peer-pattern från Phase 3
- **Per hub:** `KarriarLayoutContext`, etc. — Phase 4-pattern, samma `useWidgetLayout(hubId)` hook
- **Provider-order per hub-page:** `*LayoutProvider` OUTER → `*DataProvider` INNER (Phase 4-locked)
- **Existing useApplications/useDocuments/etc. återanvänds** — hub-loader skriver INTO existing query keys

### Widget-data-strategi (per widget — beslut nu, planeraren bekräftar tabell-existens)

**Karriär (HUB-02):**
- Karriärmål: ny tabell `career_goals` (id, user_id, goal_title, target_date, milestones JSONB, created_at) ELLER reuse interest_profile.career_goal — planneraren bestämmer baserat på vad som finns
- Intresseguide: `useInterestProfile` finns redan → koppla
- Kompetensgap: `useJobMatching`/cv_matcher finns → koppla, visa top-3 kompetensluckor
- Personligt varumärke: `personal_brand_audits` (Phase 3) → senaste audit-score
- Utbildning: education search-data eller `useEducationSearch` → koppla
- LinkedIn: profile.linkedin_url + senaste optimerar-suggestion (om persisteras)

**Resurser (HUB-03):**
- Mina dokument: `useDocuments` (CV + cover letters count) → koppla
- Kunskapsbank: `useArticles` → senaste lästa artikel
- Externa resurser: existing content → senast besökt resurs
- Utskriftsmaterial: print-resources content → status
- AI-team: ingen DB — visa snabblänk till verktygen
- Övningar: exercises content → senaste fullförd

**Min Vardag (HUB-04):**
- Hälsa: `useEnergyLevel` → senaste energi-loggning + 7-dagars sparkline
- Dagbok: `useDiary` → entry-count + senaste anteckning
- Kalender: `useCalendar` → kommande möten
- Nätverk: profile/contacts → kontakt-count
- Min konsulent: `useConsultant` → konsulent-namn + nästa möte

**Översikt (HUB-05):**
- XL onboarding: profile.onboarded_hubs flag (NY FÄLT — additiv migration på profiles) → om null/empty visa "kom igång"-CTA, annars visa "next step"-baserat på senaste aktivitet
- Cross-hub summary: 6 mini-widgets som läser från alla 4 hub-summary-loaders aggregerat. Återanvänd loaders (de cachas i React Query).

### Schema-tillägg (alla additiva)
- **Profile.onboarded_hubs** TEXT[] DEFAULT '{}' (Phase 5 — för Översikt-onboarding-detection)
- **career_goals** ny tabell OM behövs (planeraren verifierar existerande tabell först — annars reuse)
- **Inga andra schema-ändringar** — alla andra widgets använder existerande tabeller

### HUB-06: Final empty-state-pass
- Varje av de 24+ widgets får en empty-state-rad i `05-PRE-IMPL-COPY-REVIEW.md`-artefakt (utöka Phase 3:s 12-rad till ~36 rader)
- Empty-state-copy följer Phase 2 UI-SPEC Empty State Copy Contract — frågande, action-orienterad, ingen "Inga data"
- Empati-review körs OnE GÅNG på den utökade artefakten av båda agents
- BLOCKs stoppar; FLAGs deferreras till v1.1 backlog
- Sign-off i `05-EMPATHY-REVIEW.md`

### Plan-storleksstrategi (för planneraren)
Phase 5 är stor — kommer brytas i ~6 plans. Föreslagen struktur:
1. **Plan 01:** DB-discovery + onboarded_hubs migration + career_goals migration (om behövs) + REQUIREMENTS.md HUB-06 lagts till som en del av Phase 5 om saknas
2. **Plan 02:** Karriär hub — loader + 6 widgets + layout-persistens
3. **Plan 03:** Resurser hub — loader + 6 widgets + layout-persistens
4. **Plan 04:** Min Vardag hub — loader + 5 widgets + layout-persistens
5. **Plan 05:** Översikt hub — XL onboarding + 6 cross-hub summary
6. **Plan 06:** HUB-06 empty-state-final-pass + empati-review-ship-gate

Plan 02-05 kan teoretiskt köras parallellt (oberoende hubbar) men sekventiell körning är säkrare för executor-agentens kontext.

### Anti-shaming + WCAG (Phase 3-arv gäller fortfarande)
- Inga råa procent som primär KPI på någon ny widget
- Milestone-framing istället för "X% klart"
- Avslutade/avslagna items dolda by default
- prefers-reduced-motion auto-routat via tokens.css
- Keyboard-navigation per Phase 2 + 3-kontrakt
- Empati-review är OBLIGATORISK ship-gate

### Claude's Discretion
- Exakt cross-hub summary-widget-set för Översikt (välj 6 av de mest informationstäta från andra hubbar)
- Exakt onboarding-CTA-copy (utgå från Phase 2 UI-SPEC empty-state-mönster)
- Per-widget loader-implementation-detail
- Test-strategi (Vitest unit + minimal integration per hub-test-pattern från Phase 3)
- WIDGET_LABELS-utökningar för 24 nya widgets
- WIDGET_REGISTRY-utökningar (alla nya widgets måste vara lazy()-imported)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & krav
- `.planning/ROADMAP.md` §"Phase 5"
- `.planning/REQUIREMENTS.md` §HUB-02..06

### Föregående faser (locked patterns)
- `.planning/phases/03-data-wiring-wcag/03-CONTEXT.md` + `03-SUMMARY.md` — data-wiring-pattern
- `.planning/phases/04-layout-persistence-hide-show/04-04-jobsokhub-wiring-and-integration-tests-SUMMARY.md` — layout-persistens-replikeringsmönster för andra hubbar (DOKUMENTERAT FÖR DETTA)
- `.planning/phases/02-static-widget-grid/02-UI-SPEC.md` — visual contract, copywriting contract, empty-state-contract

### Pitfalls
- `.planning/research/PITFALLS.md` Pitfalls 3, 4, 9, 11, 13, 17 (samma som Phase 3 — anti-shaming, error-isolation, keyboard, motion)

### Existerande kod (mönster att replikera)
- `client/src/hooks/useJobsokHubSummary.ts` — kopiera × 4 för andra hubbar
- `client/src/components/widgets/JobsokDataContext.tsx` — kopiera × 4
- `client/src/components/widgets/JobsokLayoutContext.tsx` — kopiera × 4
- `client/src/pages/hubs/JobsokHub.tsx` — wiring-mönster för alla nya hubbar
- `client/src/components/widgets/registry.ts` — utöka med 24 nya entries (alla lazy())
- `client/src/components/widgets/widgetLabels.ts` — utöka med svenska labels
- `client/src/components/widgets/defaultLayouts.ts` — utöka per hub × breakpoint

### Existerande hooks att integrera (inte ersätt)
- `client/src/hooks/useDocuments.ts` — Resurser-hub Mina dokument
- `client/src/hooks/useDiary.ts` — Min Vardag Dagbok
- `client/src/hooks/useEnergyLevel.ts` — Min Vardag Hälsa
- `client/src/hooks/useInterestProfile.ts` — Karriär Intresseguide
- `client/src/hooks/useJobMatching.ts` — Karriär Kompetensgap
- `client/src/hooks/useEducationSearch.ts` — Karriär Utbildning
- `client/src/hooks/knowledge-base/useArticles.ts` — Resurser Kunskapsbank
- `client/src/hooks/useCalendar.ts` (om finns) — Min Vardag Kalender

### Inviolabelt (memory-pinned)
- `feedback_preserve_functionality.md` — additivt mot DB
- `feedback_overnight_runs.md` — overnight policy
- `CLAUDE.md` §"Supabase-migrationer" — `db query --linked -f`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Phase 3 hub-loader-pattern** — direktreplikerar för 4 nya hubbar
- **Phase 4 layout-persistens-pattern** — `useWidgetLayout(hubId)`, `mergeLayouts`, `useBreakpoint` är hub-id-parameteriserade och fungerar omedelbart för alla nya hubbar
- **Phase 4 HiddenWidgetsPanel** — fungerar för alla hubbar; tar `useJobsokLayout`-hook som prop... wait, beror på context-namn. Måste antingen göras hub-agnostic ELLER duplicera per hub. Planneraren bestämmer.
- **51 existerande hooks** — täcker majoriteten av widget-data-behoven; de få widgets som saknar hooks får antingen ny hook eller direkt-fetch i hub-loader
- **WIDGET_REGISTRY** + lazy() — utöka samma sätt som Phase 2

### Established Patterns
- Supabase migrationer: `db query --linked -f`, additiva, RLS 4 policies på `auth.uid() = user_id`
- React Query: staleTime 60s för hub-summary, gcTime 10min default, retry 1
- Widget compound: Widget.Root/Header/Body/Footer + size + onHide
- A11Y: aria-live, aria-pressed, fokusring via tokens.css

### Integration Points
- `KarriarHub.tsx`, `ResurserHub.tsx`, `MinVardagHub.tsx`, `HubOverview.tsx` — placeholder-pages finns redan, transformeras till riktiga hub-pages med providers + grid
- `App.tsx` — routes finns redan: `/karriar`, `/resurser`, `/min-vardag`, `/oversikt` — INGA route-ändringar
- `defaultLayouts.ts` — utöka från jobsok till alla 5 hubbar × 2 breakpoints = 10 default-layouts totalt
- `widgetLabels.ts` — utöka från 8 till ~32 labels

</code_context>

<specifics>
## Specific Ideas

- **Mikaels uttryckliga overnight-instruktion (2026-04-29):** "kör dessa faser själv under natten" — Phase 5 är stor, allt commitas men INGET pushas; FLAGs deferreras, BLOCKs stoppar
- **Cross-hub summary i Översikt** ska INTE göra egna queries — den ska konsumera de cache-keys som de andra 4 hub-loaderna populerar, vilket garanterar konsistens och inga extra DB-anrop
- **Onboarding XL-widget** behöver kunna detektera "ny användare" via `profile.onboarded_hubs` (TEXT[] DEFAULT '{}'). När en användare först besöker en hub appendas hub-id till arrayen. Om arrayen är tom eller saknar hubbar → visa "kom igång"-CTA.
- **Phase 4:s replikering-sektion i 04-04-SUMMARY.md** är direkta receptet — planneraren behöver inte uppfinna mönstret, bara följa det.
- **HiddenWidgetsPanel kan göras hub-agnostic** genom att ta `useLayout` som prop ELLER ta `layout`/`showWidget`/`resetLayout` direkt som props. Senare är enklare och undviker context-namespace-problem. Planneraren beslutar.

</specifics>

<deferred>
## Deferred Ideas

- Drag-and-drop omsortering — DRAG-01, v1.1
- Tangentbord-tillgänglig sortering — DRAG-02, v1.1
- Per-breakpoint UI-toggle (användare väljer breakpoint) — DRAG-03, v1.1
- Lägg till widget från katalog — CAT-01, v1.1
- Smart contextual suggestions på Översikt — SMART-01, v1.1
- Engelsk översättning — i18next finns men inte launch-krav
- WCAG-audit av 27 originalsidor — separat audit-projekt
- Konsolidering av per-widget-hooks med deep-link-hooks — v1.1

</deferred>

---

*Phase: 05-full-hub-coverage-oversikt*
*Context gathered: 2026-04-29 (autonomous overnight — biggest phase in v1.0)*
