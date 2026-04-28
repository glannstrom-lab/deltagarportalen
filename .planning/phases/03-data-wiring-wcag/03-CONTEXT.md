# Phase 3: Data Wiring + WCAG - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Wira de 8 widgets som byggdes på JobsokHub (Söka Jobb) i Phase 2 mot riktig Supabase-data via en hub-summary-loader. Lägg full WCAG 2.1 AA-täckning på widget-grid och hub-shell. Persistera Interview-sessionsscore och Personal Brand-audit-score i Supabase. Lås in widget-kopia via formell empati-review-gate innan ship.

**Inom scope:**
- 8 widgets på JobsokHub får riktig data (CV, Personligt brev, Intervjuträning, Sök jobb, Mina ansökningar, Spontanansökan, Lön, Internationellt)
- React Query cache-strategi delad mellan hub-loader och deep-link-sidor
- Schema-migrationer för Interview score + Personal Brand audit (icke-destruktivt: bara ADD)
- WCAG 2.1 AA: keyboard-navigering på hub, prefers-reduced-motion, milestone-framing istället för procent, dolda avslag som default
- Empati-review-process av `arbetskonsulent` + `langtidsarbetssokande` agenter

**Utom scope (flyttas till Phase 5):**
- Bygga widgets för Karriär, Resurser, Min Vardag (HUB-02, HUB-03, HUB-04 i REQUIREMENTS.md är felmappade — se Deferred)
- Översikt-hubben (HUB-05 i Phase 5)
- Layout-persistens / hide-show (Phase 4)

**Inviolabelt (carry-forward från Mikaels feedback):**
- Inga DROP/ALTER COLUMN som tar bort data — bara ADD COLUMN och nya tabeller
- Originalsidor (`/cv`, `/applications`, `/interview-simulator`, `/personal-brand/*` etc.) rörs inte
- Befintliga hooks (useApplications, useDocuments, useJobMatching, useInterestProfile) får inte brytas — Phase 3 bygger ovanpå dem

</domain>

<decisions>
## Implementation Decisions

### Phase 3 scope (skarp avgränsning)
- **Endast JobsokHub:s 8 Phase-2-widgets får riktig data** i Phase 3.
- HUB-02/03/04 (Karriär/Resurser/Min Vardag widget-uppsättningar) flyttas till Phase 5 där "Remaining widgets for all hubs" redan står.
- REQUIREMENTS.md traceability uppdateras i ett städ-task så HUB-02..04 mappar till Phase 5.
- **Reason:** Phase 2 byggde 8 widgets. Phase 3 ska wira dem. Phase 5 ska bygga + wira de återstående ~15 widgets för 3 andra hubbar. Att packa båda i Phase 3 skapar en megafas på 30+ tasks som missar både dataintegration och designkvalitet.

### Data layer architecture (Pitfall 3 + 18 unblock)
- **Hybrid hub-loader + delade React Query-nycklar.**
  1. **EXPLAIN ANALYZE FÖRST** (Phase 3 Plan 01, blocker från STATE.md): kör mot RLS-policies på `cvs`, `cover_letters`, `interview_sessions`, `saved_jobs`, `job_applications`, `companies` (spontanansökan), `salary_data` om finns, `international_targets` om finns. Mät query-tid per tabell. Resultatet styr om vi behöver materialized view eller inte.
  2. **Hub-summary-loader**: `useJobsokHubSummary(userId)` — en `useQuery` med key `['hub', 'jobsok', userId]`. Internt: `Promise.all` av 5–8 parallella Supabase-selects (inte en RPC i v1.0 — håller migrationen liten; RPC är en optimering om EXPLAIN visar >50ms cumulative).
  3. **Per-widget hooks**: varje widget får en `useWidgetData(id)` som läser från React Query-cachen via `queryClient.getQueryData(['hub', 'jobsok', userId])`. Ingen widget gör egna Supabase-anrop.
  4. **Deep-link cache-delning**: existerande hooks (`useApplications`, `useDocuments` etc.) byter inte queryKey. Hub-loader skriver in samma data under deep-link-nycklarna också via `queryClient.setQueryData(['applications', userId], ...)` så att navigering till `/applications` är cache-hit utan re-fetch.
  5. **staleTime 60s** för hub-summary, **gcTime 10min** (befintlig default räcker).
- **Reason:** Existerande hooks (51 st) får inte brytas. Hybrid återanvänder dem som cache-readers för deep-link-sidor. Hub-summary-RPC är en framtida optimering, inte en initialdesign — vi mäter först.

### Persistence-schema: Interview score (DATA-01)
- **Migration**: `ALTER TABLE interview_sessions ADD COLUMN score NUMERIC(4,1) DEFAULT NULL, ADD COLUMN score_breakdown JSONB DEFAULT NULL;`
- Score är NUMERIC(4,1) (0.0–100.0) — tillåter halv-poäng för delfrågor.
- `score_breakdown` JSONB lagrar per-fråga-poäng + AI-feedback-strängar (icke-strikt schema, framtidssäkrar).
- Score är **nullable** — befintliga sessioner utan score läses fortfarande. Widget visar "—" eller "Ingen poäng" för sessioner utan score.
- Append-only mönster: varje session är en rad. Widget visar senaste 8 sessioners trend (sparkline) + aktuell score.
- RLS-policy oförändrad — `auth.uid() = user_id` redan satt i 20260227130000.
- **Reason:** Befintliga interview_sessions raderas inte. Ny kolumn är non-blocking. Append-only ger sparkline-data gratis. JSONB-breakdown sparar oss en framtida migration när AI-feedback blir mer strukturerad.

### Persistence-schema: Personal Brand audit (DATA-02)
- **Ny tabell** `personal_brand_audits`:
  ```sql
  CREATE TABLE personal_brand_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score NUMERIC(4,1) NOT NULL,
    dimensions JSONB NOT NULL DEFAULT '{}',  -- per-dimension scores (de 4 tabbarna: Audit, Pitch, Portfolio, Visibility)
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX idx_pba_user ON personal_brand_audits(user_id);
  CREATE INDEX idx_pba_created ON personal_brand_audits(created_at DESC);
  ALTER TABLE personal_brand_audits ENABLE ROW LEVEL SECURITY;
  -- 4 RLS-policies (select/insert/update/delete) på `auth.uid() = user_id`
  ```
- **Append-only**: varje audit-körning är en rad. Widget visar senaste audit + valfritt mini-trendlinje.
- BrandAuditTab-sidan (originalsidan) får också persistens — befintlig localStorage-backup behålls som fallback för offline.
- **Reason:** Brand audit har idag noll persistens. Append-only ger användaren historik (när hen gjorde sin förra audit, hur den utvecklats). Single-latest-mönster är enklare men förlorar progression — exakt det som motiverar "kan se över tid"-kravet i DATA-02.

### Empati-review-process (A11Y-05 ship-gate)
- **Två-stegs-review, båda obligatoriska för ship:**
  1. **Pre-implementation copy review** (innan widget-data kopplas): rendera widget med riktig användardata till MD-tabell — Mikaels riktiga konto eller test-konto. Kör `arbetskonsulent` + `langtidsarbetssokande` agenter på samma artefakt. Output: lista av copy-ändringar inline. Block: ja, ändringar appliceras innan kod commitas.
  2. **Post-implementation screenshot review** (efter alla 8 widgets renderar live data): screenshot per widget i tre states — fylld, tom, fel. Kör samma två agenter. Output: PASS/FLAG/BLOCK per widget. Block-verdict = revision-task innan Phase 3 ships.
- **Iteration-budget**: 1 review + max 1 revision-pass per agent. Om andra revision behövs → eskalera till Mikael (inte tredje runda autonomt).
- **Sign-off-artefakt**: `.planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md` med båda agenternas slutgiltiga verdict + datum + commit-SHA review-sker mot.
- **Reason:** Phase 2 UI-SPEC låste copy för empty-states i förväg, men "framing" i fyllda states beror på riktiga värden (vad ser någon med 0 sökningar idag? med 47 ansökningar? med en uråldrig CV?). Pre-implementation-review säkrar det grundläggande copy-spåret; post-implementation fångar framing som först syns med riktig data. Två rundor ger Mikael snabb återkoppling utan att review blir oändlig.

### Claude's Discretion
- Exakta queryKey-strängar (förslag: `['hub', 'jobsok', userId]`, `['interview-sessions', userId]`, `['personal-brand', userId]`)
- Exakt skeleton-loading-pattern per widget (Phase 2 UI-SPEC ger ramen)
- Vilka existerande hooks som blir cache-readers vs ersatta — bestäms av kod-läsning i planeringsfas
- WCAG-test-strategi: Vitest-axe + manuellt NVDA + keyboard-only smoke-test (inget Playwright-tillägg om inte redan finns)
- Exakta `aria-live`-regions för size-toggle och layout-changes (Phase 2 UI-SPEC har ramen)
- Hur sparkline för Interview-trend renderas (befintlig Sparkline-primitive räcker)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & krav
- `.planning/ROADMAP.md` §"Phase 3: Data Wiring + WCAG" — fas-mål, 6 success criteria, requirement-mappning
- `.planning/REQUIREMENTS.md` §HUB / §DATA / §A11Y — HUB-01, DATA-01, DATA-02, A11Y-01..05 (HUB-02..04 flyttas till Phase 5 — se decision ovan)
- `.planning/PROJECT.md` — målgrupp, ton, "Headspace not Linear", WCAG 2.1 AA minimum

### Föregående fas-output (locked)
- `.planning/phases/02-static-widget-grid/02-UI-SPEC.md` — komplett designkontrakt för widgets (Copywriting, Empty State, Progress framing, Animation, Accessibility — allt redan låst)
- `.planning/phases/02-static-widget-grid/02-VERIFICATION.md` — Phase 2 leverans-state (de 8 widgets som finns)
- `.planning/STATE.md` §"Decisions" — alla locked decisions från Phase 1+2

### Pitfalls (hard-required läsning)
- `.planning/research/PITFALLS.md` Pitfall 3 — N+1 query waterfall (motivation för hub-loader)
- `.planning/research/PITFALLS.md` Pitfall 4 — error cascade (befintlig WidgetErrorBoundary täcker)
- `.planning/research/PITFALLS.md` Pitfall 9 — keyboard inaccessibility (A11Y-01-implementation)
- `.planning/research/PITFALLS.md` Pitfall 11 — progress shaming (kopplar till A11Y-03)
- `.planning/research/PITFALLS.md` Pitfall 13 — motion sickness (A11Y-02-implementation)
- `.planning/research/PITFALLS.md` Pitfall 17 — screen reader announce (A11Y-01-implementation)
- `.planning/research/PITFALLS.md` Pitfall 18 — RLS overhead per widget (motivation för EXPLAIN ANALYZE-task först)

### Design & säkerhet
- `docs/DESIGN.md` — domänfärger, header-kontrakt, fokusring-spec, motion-tokens
- `docs/security-audit.md` §RLS — RLS-mönster för nya tabeller (personal_brand_audits följer samma)
- `CLAUDE.md` §"Supabase-migrationer" — kör nya migrationer med `npx supabase db query --linked -f`, INTE `db push`

### Existerande kod att läsa innan plans skrivs
- `client/src/main.tsx:64-76` — QueryClient-konfig (staleTime 5min, retry 1, refetchOnWindowFocus false)
- `client/src/hooks/useApplications.ts` — befintligt cache-pattern att harmonisera mot
- `client/src/hooks/useDocuments.ts` — CV/cover-letter-data
- `client/src/hooks/useJobMatching.ts` — sök-jobb-data
- `client/src/hooks/useInterestProfile.ts` — för Karriär-hubb (Phase 5 — referens nu för konsistens)
- `client/src/services/interviewService.ts` — saveSession-flow (DATA-01-utgångspunkt)
- `client/src/pages/personal-brand/BrandAuditTab.tsx` — DATA-02-utgångspunkt (saknar persistens)
- `client/src/components/widgets/registry.ts` — lazy-import-mönster, ingen widget får läggas till utan lazy()
- `supabase/migrations/20260227130000_add_new_features.sql` §interview_sessions — befintligt schema att utöka
- `client/src/styles/tokens.css` — `--motion-*` tokens redan reduced-motion-aware

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **51 hooks** redan skrivna i `client/src/hooks/` — många använder useQuery (useApplications, useDocuments, useDashboardData, useInterestProfile, useJobMatching, useGamification). Phase 3 wirar hub-loader till samma cache, ersätter inte.
- **interview_sessions-tabell finns** med RLS, indices, answers JSONB. Saknar bara `score`-kolumn — non-destructive ADD COLUMN.
- **8 widgets renderar redan** med mock-data och Phase 2 compound API (Widget.Root/Header/Body/Footer). Phase 3 byter ut mock-data-konstanter mot data från `useWidgetData(id)`.
- **WidgetErrorBoundary finns** (Phase 2) — Pitfall 4 är redan addresserad. Phase 3 testar att den fortfarande fungerar med riktiga query-fel.
- **Sparkline-, ProgressRing-, StackedBar-, RangeBar-primitives finns** — Phase 3 fyller dem med riktig data, ändrar inte rendering.
- **tokens.css har redan `prefers-reduced-motion`-stöd** — `--motion-*` sätts till 0.01ms automatiskt. Widgets som använder tokens är compliant by default.

### Established Patterns
- **React Query default**: staleTime 5min, retry 1, refetchOnWindowFocus false (main.tsx). Phase 3 sätter staleTime 60s på hub-summary (kortare för fräschhet); accepterar default för per-widget cache.
- **Supabase migrationer**: kör enskilt med `db query --linked -f`, ALDRIG `db push` (CLAUDE.md). Två migrationer denna fas: `20260429_interview_score.sql` + `20260429_personal_brand_audits.sql`.
- **RLS-mönster**: `auth.uid() = user_id` per tabell, 4 policies (select/insert/update/delete). personal_brand_audits följer mönster från interview_sessions exakt.
- **Lazy-import-kontrakt**: alla widgets ska vara `lazy()`-importerade — Phase 2 verify-widget-chunks.cjs script kör i CI och bryter build om någon widget hamnar i main bundle.

### Integration Points
- **Hub-loader anropas i `JobsokHub.tsx`** (Phase 2 hub-page): `const summary = useJobsokHubSummary()` i komponenten, distribueras till widgets via context (Phase 2 etablerade WidgetContext-mönstret för size — Phase 3 utökar för data).
- **Deep-link sync**: `queryClient.setQueryData` skriver in same data under befintliga keys (`['applications', userId]` etc.) så `/applications` är instant-load efter hub-besök.
- **Empati-review-output skrivs till** `.planning/phases/03-data-wiring-wcag/03-EMPATHY-REVIEW.md` — gsd-verifier läser denna innan PHASE COMPLETE-verdict.
- **Migrationer commitas till** `supabase/migrations/` med datumprefix, körs manuellt mot remote-DB i ship-momentet.

</code_context>

<specifics>
## Specific Ideas

- **Mikaels uttryckliga preferens (2026-04-28):** "jag ville bara bekräfta att allt innehåll i molnet inte försvinner för att vi bygger massa nytt." → Phase 3 är **strikt additivt** mot Supabase — inga DROP, inga destruktiva ALTER, inga schema-rename. Migrationer som bryter detta avvisas i plan-checker.
- **Hub-summary-loader är PoC-pattern**, inte slutgiltig optimering. Om EXPLAIN ANALYZE visar >50ms cumulative latency, plana för en hub-summary-RPC i Phase 5 eller v1.1.
- **Personal Brand audit-flow:** befintlig BrandAuditTab kör en lokal beräkning idag. Phase 3 lägger till `await supabase.from('personal_brand_audits').insert(...)` vid avslut — utan att ändra själva audit-logiken.
- **Två-rundors empati-review är ny process** för projektet — Phase 3 är första gången den körs. Förfining baserat på erfarenhet är förväntat och ska dokumenteras till Phase 5.

</specifics>

<deferred>
## Deferred Ideas

- **HUB-02/03/04 widget-uppsättningar** (Karriär/Resurser/Min Vardag) — flyttas till Phase 5 där ROADMAP redan har "Remaining widgets for all hubs". REQUIREMENTS.md traceability uppdateras som ett städ-task i Phase 3 Plan 01.
- **Hub-summary RPC / materialized view** — om EXPLAIN ANALYZE visar >50ms cumulative, dokumentera men implementera inte i Phase 3. v1.1-kandidat.
- **Per-widget-hooks ersätter befintliga deep-link-hooks** — kan vara värt att konsolidera, men risk för regression. Lämnas till v1.1 efter alla hubbar är wirade.
- **Internationaliserad audit-trend** (engelska för agent-review) — i18next finns men engelsk översättning är inte launch-krav (PROJECT.md). Lämnas.
- **WCAG audit av övriga 27 originalsidor** — Phase 3 fokuserar på hub-shell + 8 widgets. Originalsidornas WCAG-status är ett separat audit-projekt utanför v1.0.

</deferred>

---

*Phase: 03-data-wiring-wcag*
*Context gathered: 2026-04-28*
