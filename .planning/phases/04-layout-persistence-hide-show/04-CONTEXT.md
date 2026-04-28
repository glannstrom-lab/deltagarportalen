# Phase 4: Layout Persistence + Hide/Show - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning
**Mode:** Smart-discuss (autonomous overnight, all proposals auto-accepted per user directive)

<domain>
## Phase Boundary

Användare kan dölja enskilda widgets på JobsokHub, återvisa dem från en katalog, och återställa default-layouten — och dessa preferenser överlever sidladdning + cross-device. **Ingen drag/resize** (deferrad till v1.1). Storlek (S/M/L) som idag är hub-lokal state lyfts till Supabase-persistens i samma rörelse.

**Inom scope (Phase 4):**
- `user_widget_layouts` Supabase-tabell + 4 RLS-policies (additiv migration)
- `useWidgetLayout(hubId)` hook — optimistic update + debounce + rollback
- Hide-affordance per widget (× i widget-header, edit-mode-gated)
- "Återvisa dolda" panel (dropdown från hub-header)
- Reset-knapp (med confirm-dialog) → återställer default-layout
- Layout reconciliation on load (Pitfall 7) — saknade widgets appendas, borttagna ignoreras
- Per-breakpoint schema (Pitfall 6) — desktop och mobile separat

**Utom scope:**
- Drag-and-drop (DRAG-01 → v1.1)
- Layout-persistens för Karriär/Resurser/Min Vardag/Översikt (Phase 5 — först när de har widgets)
- Tangentbord-tillgänglig sortering (DRAG-02 → v1.1)

**Inviolabelt (Mikaels feedback, locked from Phase 3):**
- Inga DROP, inga destruktiva ALTER COLUMN — bara `ADD COLUMN IF NOT EXISTS` och `CREATE TABLE IF NOT EXISTS`
- Originalsidor (27 deep-link routes) helt orörda
- Existerande hooks (51 st) får inte brytas — Phase 4 bygger ovanpå Phase 3:s hub-loader
- `interview_sessions`, `personal_brand_audits`, etc. orörda

</domain>

<decisions>
## Implementation Decisions

### Schema-design (Pitfall 6 — per-breakpoint från start)
- **Tabell:** `user_widget_layouts`
- **Kolumner:** `(id UUID PK, user_id UUID FK auth.users, hub_id TEXT, breakpoint TEXT, widgets JSONB, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)`
- **Upsert-nyckel:** `(user_id, hub_id, breakpoint)` — uppfyller Pitfall 6 (mobile/desktop kan inte överskriva varandra)
- **`widgets` JSONB-shape:** array av `{id: string, size: 'S'|'M'|'L'|'XL', visible: boolean}` — INGA datavärden (Pitfall säkerhet: layout får inte innehålla applikationsdata)
- **Validering server-side:** widget-ID måste finnas i `WIDGET_REGISTRY` — okända ID rejectas tyst i upsert (kommentar i SQL för manuell server-side validation senare)
- **`updated_at` med trigger:** för conflict detection (Pitfall 5) — om server `updated_at > client.updated_at`, reject och re-fetch

### Data-flöde
- **`useWidgetLayout(hubId)` hook:**
  - `useQuery` med `staleTime: Infinity` (layout ändras bara när användaren agerar)
  - `useMutation` för spara med `onMutate`/`onError`/`onSettled` rollback-pattern (Pitfall 5)
  - Debounce 1000ms — skriv på `onDragStop`/storlek-change/visibility-change, inte på varje state-tick
  - `useBeforeUnload` — flush pending debounce synkront innan tab stängs
- **Reconciliation:** `mergeLayouts(persisted, defaultLayout)` på hub-mount: lägger till saknade widgets i default-position, filtrerar bort widgets som inte längre finns i registry. Test täcker båda fallen.
- **Default-layout-källa:** `getDefaultLayout(hubId)` från Phase 2 — utökas med `breakpoint`-parameter ('desktop' | 'mobile')

### UI-affordances
- **Hide-knapp:** liten × i widget-header, synlig endast i edit-mode (analog med S/M/L-toggles). `aria-label="Dölj widget {namn}"`, fokusring per Phase 2 a11y-kontrakt.
- **"Anpassa vy"-knapp** i hub-header (icke-funktionell platshållare i Phase 2) → aktiveras nu, togglar edit-mode för hela hubben.
- **Återvisa-panel:** dropdown från "Anpassa vy" som listar `hidden: true` widgets med "Återvisa"-knapp per rad. Auto-stäng vid klick utanför.
- **Reset-knapp:** länge-stil ("Återställ standardlayout") längst ner i återvisa-panelen. Confirm-dialog innan reset (`Är du säker? Detta tar bort alla anpassningar för denna hub.`). ConfirmDialog finns redan i `client/src/components/ui/ConfirmDialog`.
- **Status-feedback:** efter hide/show/reset → `aria-live="polite"`-announcement ("Widget dold", "Layout återställd")

### Rollout-strategi
- Endast JobsokHub får layout-persistens i Phase 4 (det är enda hubben med widgets)
- Pattern dokumenteras i `04-SUMMARY.md` så Phase 5 kan replikera för Karriär/Resurser/Min Vardag/Översikt
- VITE_HUB_NAV_ENABLED-flaggan styr fortfarande hela hub-systemet — om av, ingen layout-persistens behövs

### Claude's Discretion
- Exakt CSS för "Anpassa vy"-toggle-tillstånd (active/inactive — använd Phase 2 ghost-button-stil)
- Exakt copy för reset-confirm (utgå från svensk ton: "Är du säker?" inte "Are you sure?")
- Whether to use Zustand for edit-mode-state eller useState i JobsokHub (default: useState — hub-lokalt)
- Test-strategi för optimistic-update rollback (default: vitest med mock supabase som rejectar nästa upsert)
- Exakta queryKey-strängar (förslag: `['user-widget-layouts', userId, hubId, breakpoint]`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & krav
- `.planning/ROADMAP.md` §"Phase 4: Layout Persistence + Hide/Show" — fas-mål, 3 success criteria
- `.planning/REQUIREMENTS.md` §CUST — CUST-01, CUST-02, CUST-03

### Föregående fas-output (locked)
- `.planning/phases/03-data-wiring-wcag/03-CONTEXT.md` — locked decisions från Phase 3
- `.planning/phases/03-data-wiring-wcag/03-SUMMARY.md` (om finns) — vad Phase 3 levererade
- `.planning/phases/02-static-widget-grid/02-UI-SPEC.md` — design-kontrakt (edit-mode-toggle redan specat)
- `client/src/components/widgets/JobsokDataContext.tsx` — Phase 3 hub-data-context (Phase 4 lägger till layout-context som peer)
- `client/src/hooks/useJobsokHubSummary.ts` — pattern för hub-loader (Phase 4:s `useWidgetLayout` följer samma)

### Pitfalls (hard-required)
- `.planning/research/PITFALLS.md` Pitfall 5 — layout-race-condition + optimistic rollback
- `.planning/research/PITFALLS.md` Pitfall 6 — multi-device layout conflict (per-breakpoint schema)
- `.planning/research/PITFALLS.md` Pitfall 7 — default layout drift on widget add/remove
- `.planning/research/PITFALLS.md` Pitfall 15 — infinite re-render loop (use `useRef` + isEqual för layout compare)

### Inviolabelt (memory-pinned)
- `feedback_preserve_functionality.md` — additivt mot DB, originalsidor orörda
- `CLAUDE.md` §"Supabase-migrationer" — kör `db query --linked -f`, INTE `db push`

### Existerande kod
- `client/src/components/ui/ConfirmDialog/*` — använd för reset-confirm
- `client/src/components/widgets/defaultLayouts.ts` — getDefaultLayout(hubId) — utöka med breakpoint
- `client/src/components/widgets/registry.ts` — WIDGET_REGISTRY för server-side widget-ID-validering
- `supabase/migrations/20260227130000_add_new_features.sql` — RLS-mönster att replikera

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Phase 3 JobsokDataContext-pattern** — `useWidgetLayout` byggs som peer-context (`JobsokLayoutContext`)
- **Phase 3 hub-summary-loader-pattern** — useQuery + setQueryData för cache-share-pattern återanvänds
- **ConfirmDialog** — `client/src/components/ui/ConfirmDialog` redan installerad och stöder svenska
- **WIDGET_REGISTRY** — `client/src/components/widgets/registry.ts` har redan alla 8 widgets, server-side-validering hänvisar till denna källa
- **Phase 2 size-toggle-mönster** — `aria-pressed`, `role="group"`, `aria-label` — replikeras för hide-affordans
- **tokens.css `--motion-*`** — prefers-reduced-motion redan auto-routat (samma som Phase 3)

### Established Patterns
- **Supabase migrationer:** alltid additiva, alltid `db query --linked -f`, RLS 4 policies på `auth.uid() = user_id`
- **React Query:** staleTime explicit per-query (default 5min, men layout använder Infinity), retry 1, refetchOnWindowFocus false
- **A11Y:** aria-live="polite" för state-changes, fokusring via Phase 2 box-shadow-tokens, aria-label på alla interaktiva element

### Integration Points
- **JobsokHub.tsx**: lägg till `<JobsokLayoutProvider>` runt `<JobsokDataProvider>` — order viktig (layout först, data sen, eftersom data-fetch beror på vilka widgets som är synliga)
- **Widget.tsx (Phase 2 compound):** lägg till hide-knapp i Widget.Header — opt-in via prop `editable` på Widget.Root
- **HubGrid.tsx (Phase 2):** filtrera ut `visible: false` widgets innan render
- **defaultLayouts.ts:** utöka från `(hubId) => Layout` till `(hubId, breakpoint) => Layout`

</code_context>

<specifics>
## Specific Ideas

- **Mikaels uttryckliga preferens (2026-04-28→29):** "jag ville bara bekräfta att allt innehåll i molnet inte försvinner för att vi bygger massa nytt." → Phase 4 är **strikt additivt** mot Supabase. Migration får INTE använda DROP, ALTER COLUMN ... TYPE, eller andra destruktiva DDL.
- **"Anpassa vy"-knappen finns redan visuellt** i Phase 2 UI-SPEC som icke-funktionell placeholder — Phase 4 aktiverar den. Inga visuella förändringar förutom toggle-state.
- **Reset är destruktivt UX-mässigt** — confirm-dialog är obligatorisk. Användare med kognitiv trötthet ska inte kunna göra det av misstag.
- **Mobile-layout är NOT samma som desktop-layout** — när användare drar widget på mobile får det ALDRIG överskriva desktop. Per-breakpoint upsert-key.

</specifics>

<deferred>
## Deferred Ideas

- **Drag-and-drop omsortering** — DRAG-01, v1.1
- **Tangentbord-tillgänglig sortering** (Up/Down/arrow keys) — DRAG-02, v1.1
- **Lägg till widget från katalog** — CAT-01, v1.1 (Phase 4 har bara hide/show av redan-installerade widgets)
- **Per-breakpoint UI-toggle** (användare väljer breakpoint manuellt) — DRAG-03, v1.1
- **Layout-persistens för Karriär/Resurser/Min Vardag** — Phase 5 (efter att de hubbar har widgets)
- **Smart contextual suggestions på Översikt** — SMART-01, v1.1

</deferred>

---

*Phase: 04-layout-persistence-hide-show*
*Context gathered: 2026-04-29 (autonomous overnight)*
