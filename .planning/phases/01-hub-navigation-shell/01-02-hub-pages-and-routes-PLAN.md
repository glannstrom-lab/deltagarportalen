---
phase: 01-hub-navigation-shell
plan: 02
type: execute
wave: 2
depends_on:
  - 01
files_modified:
  - client/src/pages/hubs/HubOverview.tsx
  - client/src/pages/hubs/JobsokHub.tsx
  - client/src/pages/hubs/KarriarHub.tsx
  - client/src/pages/hubs/ResurserHub.tsx
  - client/src/pages/hubs/MinVardagHub.tsx
  - client/src/App.tsx
autonomous: true
requirements:
  - NAV-01
  - NAV-04
  - NAV-05

must_haves:
  truths:
    - "Visiting /oversikt renders HubOverview placeholder page (no widgets)"
    - "Visiting /jobb renders JobsokHub placeholder page with data-domain='activity'"
    - "Visiting /karriar renders KarriarHub placeholder page with data-domain='coaching'"
    - "Visiting /resurser renders ResurserHub placeholder page with data-domain='info'"
    - "Visiting /min-vardag renders MinVardagHub placeholder page with data-domain='wellbeing'"
    - "Visiting /cv, /applications, /diary, /career, /knowledge-base, and all 27 existing deep-links still renders the correct page (no 404, no redirect)"
    - "Index route '/' redirects to '/oversikt' ONLY when isHubNavEnabled() returns true; otherwise still renders Dashboard"
  artifacts:
    - path: "client/src/pages/hubs/HubOverview.tsx"
      provides: "Empty hub placeholder for /oversikt with data-domain='action'"
      contains:
        - "data-domain=\"action\""
    - path: "client/src/pages/hubs/JobsokHub.tsx"
      provides: "Empty hub placeholder for /jobb with data-domain='activity'"
      contains:
        - "data-domain=\"activity\""
    - path: "client/src/pages/hubs/KarriarHub.tsx"
      provides: "Empty hub placeholder for /karriar with data-domain='coaching'"
    - path: "client/src/pages/hubs/ResurserHub.tsx"
      provides: "Empty hub placeholder for /resurser with data-domain='info'"
    - path: "client/src/pages/hubs/MinVardagHub.tsx"
      provides: "Empty hub placeholder for /min-vardag with data-domain='wellbeing'"
    - path: "client/src/App.tsx"
      provides: "5 new lazy hub routes added INSIDE existing <Route path=\"/\" element={<RootRoute />}> block; conditional index redirect"
      contains:
        - "path=\"oversikt\""
        - "path=\"jobb\""
        - "path=\"karriar\""
        - "path=\"resurser\""
        - "path=\"min-vardag\""
        - "isHubNavEnabled"
  key_links:
    - from: "client/src/App.tsx"
      to: "client/src/pages/hubs/*.tsx"
      via: "lazy() imports + <Route> elements"
      pattern: "lazy\\(\\(\\) => import\\('\\./pages/hubs/"
    - from: "App.tsx index route"
      to: "isHubNavEnabled() from navigation.ts"
      via: "conditional <Navigate to='/oversikt' /> vs <Dashboard />"
      pattern: "isHubNavEnabled\\(\\)"
---

<objective>
Create 5 empty hub page components in `client/src/pages/hubs/` and wire them as new routes inside the existing `<Route path="/" element={<RootRoute />}>` block in App.tsx. The hub pages are deliberately empty placeholders — only `<PageLayout>` with title, subtitle, and `data-domain` attribute (driven by PageLayout's existing `domain` prop). NO widgets in this phase per phase scope.

Critical: per PITFALLS.md Pitfall 1, hub routes MUST be added as children INSIDE the existing root route block, not as siblings. The 27 existing deep-link routes must remain in their exact current positions and continue to work. The index route (`/`) must conditionally redirect to `/oversikt` ONLY when `isHubNavEnabled()` returns true — when the flag is off, it still renders `<Dashboard />` exactly as today.

Purpose: Prove the routing layer before any sidebar/bottom-nav work. Plan 03 (Sidebar) and Plan 04 (HubBottomNav) link to these routes; if routes don't exist, those plans break. Plan 05 (smoke test) verifies all 27 deep-links still resolve.

Output: 5 new hub page components, 5 new routes in App.tsx, conditional index redirect, no regression of existing 27 routes.
</objective>

<execution_context>
@C:/Users/Mikael/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Mikael/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/research/ARCHITECTURE.md
@.planning/research/PITFALLS.md
@.planning/phases/01-hub-navigation-shell/01-01-SUMMARY.md

<interfaces>
<!-- From Plan 01 (now in navigation.ts): -->
```typescript
export type HubId = 'oversikt' | 'jobb' | 'karriar' | 'resurser' | 'min-vardag'
export const navHubs: NavHub[] // 5 entries with paths /oversikt, /jobb, /karriar, /resurser, /min-vardag
export function isHubNavEnabled(): boolean
```

<!-- From client/src/components/layout/PageLayout.tsx (existing — DO NOT modify): -->
```typescript
export type ColorDomain = LegacyColorDomain  // accepts 'action' | 'activity' | 'coaching' | 'info' | 'wellbeing'

interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  description?: string
  actions?: React.ReactNode
  domain?: ColorDomain
  showTabs?: boolean
  showHeader?: boolean
}
```

PageLayout sets `data-domain={resolvedDomain}` on its root div, which CSS tokens use to flip --c-* variables.

<!-- From client/src/App.tsx (existing structure — relevant excerpt): -->
```tsx
// Lazy imports block (around lines 33-73)
const Dashboard = lazy(() => import('./pages/Dashboard'))
const CVPage = lazy(() => import('./pages/CVPage'))
// ... 30+ more lazy imports

// LazyRoute helper (line 79):
function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>
    </RouteErrorBoundary>
  )
}

// Route structure (line 224-272):
<Route path="/" element={<RootRoute />}>
  <Route index element={
    <LazyRoute>
      <RouteErrorBoundary>
        <Dashboard />
      </RouteErrorBoundary>
    </LazyRoute>
  } />
  <Route path="cv/*" element={<LazyRoute>...<CVPage /></LazyRoute>} />
  <Route path="cover-letter/*" element={...} />
  // ... 25 more deep-link routes ...
  <Route path="admin" element={...} />
</Route>

// Catch-all (line 279):
<Route path="*" element={<Navigate to="/" replace />} />
```

The 27 existing deep-link route paths under <Route path="/" element={<RootRoute />}>:
cv/*, cover-letter/*, interest-guide/*, knowledge-base/*, knowledge-base/article/:id, profile, my-consultant, job-search/*, applications/*, career/*, diary, wellness/*, settings, resources, print-resources, help, salary/*, education/*, calendar, spontanansökan/*, nätverk, personal-brand/*, linkedin-optimizer, skills-gap-analysis, interview-simulator, ai-team, exercises, international/*, externa-resurser, consultant/*, admin

(That is 31 inner Route elements, but a few use `/*` for sub-routing. The 27 referenced in the success criteria covers the user-facing entry points; smoke test in Plan 05 covers all of them.)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create 5 empty hub page components in client/src/pages/hubs/</name>

  <read_first>
    - client/src/components/layout/PageLayout.tsx (read full — understand domain prop, data-domain attribute, default styling)
    - client/src/pages/Dashboard.tsx (read first 80 lines — understand how an existing hub-like page uses PageLayout for visual reference)
    - client/src/lib/domains.ts (verify LegacyColorDomain accepts the 5 domain values)
    - .planning/research/ARCHITECTURE.md section "Recommended File Structure"
  </read_first>

  <files>
    - client/src/pages/hubs/HubOverview.tsx (create)
    - client/src/pages/hubs/JobsokHub.tsx (create)
    - client/src/pages/hubs/KarriarHub.tsx (create)
    - client/src/pages/hubs/ResurserHub.tsx (create)
    - client/src/pages/hubs/MinVardagHub.tsx (create)
  </files>

  <action>
    Create the directory client/src/pages/hubs/ if it does not exist.

    Each hub page is a minimal React component using PageLayout. Same skeleton, only varying title/subtitle/domain. NO widgets, NO grid, NO data fetching — just a placeholder content area announcing the hub is under construction. This phase ships only the navigation shell.

    Template (use this verbatim for each file, substituting the {{ALL_CAPS}} tokens):

    ```typescript
    import { PageLayout } from '@/components/layout/PageLayout'
    import { useTranslation } from 'react-i18next'

    /**
     * {{HUB_LABEL}} hub — placeholder.
     * Phase 1 ships only the navigation shell. Widgets land in Phase 2 (WIDG-01..03).
     * Domain: {{DOMAIN}} (drives --c-* tokens via PageLayout's data-domain attribute).
     */
    export default function {{COMPONENT_NAME}}() {
      const { t } = useTranslation()

      return (
        <PageLayout
          title={t('{{LABEL_KEY}}', '{{HUB_LABEL}}')}
          subtitle={t('{{SUBTITLE_KEY}}', '{{SUBTITLE_FALLBACK}}')}
          domain="{{DOMAIN}}"
          showTabs={false}
        >
          <div className="rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-700 p-8 text-center">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {t('hubs.placeholder', 'Här kommer widgets för {{HUB_LABEL}}. Den här sidan byggs ut i nästa fas.')}
            </p>
          </div>
        </PageLayout>
      )
    }
    ```

    Per-file substitutions:

    | File | Component | Title fallback | Subtitle fallback | Domain | LABEL_KEY | SUBTITLE_KEY |
    |------|-----------|----------------|-------------------|--------|-----------|--------------|
    | HubOverview.tsx | HubOverview | "Översikt" | "Din översikt över alla hubbar" | action | nav.hubs.oversikt | hubs.oversikt.subtitle |
    | JobsokHub.tsx | JobsokHub | "Söka jobb" | "Hitta lediga tjänster, skapa ansökningsmaterial och håll koll på dina ansökningar" | activity | nav.hubs.jobb | hubs.jobb.subtitle |
    | KarriarHub.tsx | KarriarHub | "Karriär" | "Utforska din karriärväg, dina styrkor och kompetensgap" | coaching | nav.hubs.karriar | hubs.karriar.subtitle |
    | ResurserHub.tsx | ResurserHub | "Resurser" | "Kunskapsbank, dokument och externa stöd" | info | nav.hubs.resurser | hubs.resurser.subtitle |
    | MinVardagHub.tsx | MinVardagHub | "Min vardag" | "Hälsa, dagbok, kalender och din konsulent" | wellbeing | nav.hubs.min-vardag | hubs.min-vardag.subtitle |

    Translation keys for `hubs.{id}.subtitle` and `hubs.placeholder` do NOT need to be added to sv.json in this plan — the `t()` calls have inline fallback strings that render correctly without translation keys (i18next falls back to the second arg when key is missing). Plan 03 or future phases can add the translation entries.

    Implementation rules:
    - Default export only (App.tsx imports them as default exports via `lazy(() => import('./pages/hubs/X'))`)
    - No additional dependencies beyond PageLayout and useTranslation
    - Each file must compile standalone (no shared local helper file)
    - Do NOT add `data-domain` directly on a div — pass `domain="..."` to PageLayout, which sets `data-domain` on its root.
  </action>

  <verify>
    <automated>cd client && npx tsc --noEmit && ls src/pages/hubs/HubOverview.tsx src/pages/hubs/JobsokHub.tsx src/pages/hubs/KarriarHub.tsx src/pages/hubs/ResurserHub.tsx src/pages/hubs/MinVardagHub.tsx</automated>
  </verify>

  <acceptance_criteria>
    - File client/src/pages/hubs/HubOverview.tsx exists
    - File client/src/pages/hubs/JobsokHub.tsx exists
    - File client/src/pages/hubs/KarriarHub.tsx exists
    - File client/src/pages/hubs/ResurserHub.tsx exists
    - File client/src/pages/hubs/MinVardagHub.tsx exists
    - HubOverview.tsx contains literal string `domain="action"`
    - JobsokHub.tsx contains literal string `domain="activity"`
    - KarriarHub.tsx contains literal string `domain="coaching"`
    - ResurserHub.tsx contains literal string `domain="info"`
    - MinVardagHub.tsx contains literal string `domain="wellbeing"`
    - All 5 files contain `import { PageLayout } from '@/components/layout/PageLayout'`
    - All 5 files have `export default function`
    - `cd client && npx tsc --noEmit` exits 0
  </acceptance_criteria>

  <done>
    - Directory client/src/pages/hubs/ contains exactly 5 .tsx files
    - Each renders PageLayout with the correct title/domain/subtitle
    - TypeScript compiles cleanly
    - No widget code, no grid layout, no data fetching
  </done>
</task>

<task type="auto">
  <name>Task 2: Add 5 hub routes + conditional index redirect to App.tsx</name>

  <read_first>
    - client/src/App.tsx (full file — understand the lazy() import block and the <Route path="/"> nesting structure)
    - .planning/research/PITFALLS.md Pitfall 1 (deep-link breakage) and Pitfall 16 (env-flag rollout)
    - client/src/components/layout/navigation.ts (verify isHubNavEnabled is exported per Plan 01)
  </read_first>

  <files>
    - client/src/App.tsx (modify)
  </files>

  <action>
    Modify client/src/App.tsx in two locations.

    LOCATION 1 — Add lazy imports for the 5 hub pages alongside the existing lazy imports (around lines 34-73, near the other lazy imports for hub-like Dashboard and Profile):

    ```typescript
    // Hub pages (Phase 1 — navigation shell)
    const HubOverview = lazy(() => import('./pages/hubs/HubOverview'))
    const JobsokHub = lazy(() => import('./pages/hubs/JobsokHub'))
    const KarriarHub = lazy(() => import('./pages/hubs/KarriarHub'))
    const ResurserHub = lazy(() => import('./pages/hubs/ResurserHub'))
    const MinVardagHub = lazy(() => import('./pages/hubs/MinVardagHub'))
    ```

    Also add at the top with the other navigation-related imports:

    ```typescript
    import { isHubNavEnabled } from './components/layout/navigation'
    ```

    LOCATION 2 — Inside the existing `<Route path="/" element={<RootRoute />}>` block (starting around line 224), do TWO things:

    (a) Replace the existing index route with a conditional:

    BEFORE:
    ```tsx
    <Route index element={
      <LazyRoute>
        <RouteErrorBoundary>
          <Dashboard />
        </RouteErrorBoundary>
      </LazyRoute>
    } />
    ```

    AFTER:
    ```tsx
    <Route index element={
      isHubNavEnabled() ? (
        <Navigate to="/oversikt" replace />
      ) : (
        <LazyRoute>
          <RouteErrorBoundary>
            <Dashboard />
          </RouteErrorBoundary>
        </LazyRoute>
      )
    } />
    ```

    (b) Add 5 NEW <Route> children INSIDE the same `<Route path="/" element={<RootRoute />}>` block, AFTER the existing index route and BEFORE the catch-all admin route. These are siblings of the existing 27 deep-link routes:

    ```tsx
    {/* Hub routes (Phase 1 — navigation shell) */}
    <Route path="oversikt" element={<LazyRoute><RouteErrorBoundary><HubOverview /></RouteErrorBoundary></LazyRoute>} />
    <Route path="jobb" element={<LazyRoute><RouteErrorBoundary><JobsokHub /></RouteErrorBoundary></LazyRoute>} />
    <Route path="karriar" element={<LazyRoute><RouteErrorBoundary><KarriarHub /></RouteErrorBoundary></LazyRoute>} />
    <Route path="resurser" element={<LazyRoute><RouteErrorBoundary><ResurserHub /></RouteErrorBoundary></LazyRoute>} />
    <Route path="min-vardag" element={<LazyRoute><RouteErrorBoundary><MinVardagHub /></RouteErrorBoundary></LazyRoute>} />
    ```

    Critical rules — DO NOT do any of these:
    - Do NOT remove, rename, reorder, or wrap any of the 27 existing deep-link <Route> children (cv/*, cover-letter/*, applications/*, etc.)
    - Do NOT change the catch-all `<Route path="*" element={<Navigate to="/" replace />} />`
    - Do NOT add a new layout wrapper route around the hub routes (anti-pattern per ARCHITECTURE.md "Anti-Pattern 3"). The 5 hub routes are peers of the 27 deep-link routes inside the same RootRoute block.
    - Do NOT change `<Route path="/dashboard" element={<Navigate to="/" replace />} />` — when flag is on, /dashboard → / → /oversikt naturally chains.
    - Do NOT touch any auth routes (/login, /register, /privacy, /terms, /ai-policy, /linkedin/callback, /calendar/google-callback, /profile/shared/:shareCode, /invite/:code).

    The hub paths use NO Swedish diacritics — `karriar` not `karriär`, `oversikt` not `översikt`, `min-vardag` (already ASCII) — per ARCHITECTURE.md path naming rationale and to avoid encoding issues.
  </action>

  <verify>
    <automated>cd client && npx tsc --noEmit && cd client && grep -c 'pages/hubs/' src/App.tsx</automated>
  </verify>

  <acceptance_criteria>
    - File client/src/App.tsx contains literal string `lazy(() => import('./pages/hubs/HubOverview'))`
    - File client/src/App.tsx contains literal string `lazy(() => import('./pages/hubs/JobsokHub'))`
    - File client/src/App.tsx contains literal string `lazy(() => import('./pages/hubs/KarriarHub'))`
    - File client/src/App.tsx contains literal string `lazy(() => import('./pages/hubs/ResurserHub'))`
    - File client/src/App.tsx contains literal string `lazy(() => import('./pages/hubs/MinVardagHub'))`
    - File client/src/App.tsx contains literal string `path="oversikt"`
    - File client/src/App.tsx contains literal string `path="jobb"`
    - File client/src/App.tsx contains literal string `path="karriar"`
    - File client/src/App.tsx contains literal string `path="resurser"`
    - File client/src/App.tsx contains literal string `path="min-vardag"`
    - File client/src/App.tsx contains literal string `isHubNavEnabled()`
    - File client/src/App.tsx contains literal string `<Navigate to="/oversikt" replace />`
    - File client/src/App.tsx still contains all 27 existing deep-link Route paths (verify by counting): grep -c 'path="cv' returns >=1, grep -c 'path="applications' returns >=1, grep -c 'path="job-search' returns >=1, grep -c 'path="diary' returns >=1, grep -c 'path="career' returns >=1, grep -c 'path="knowledge-base' returns >=1, grep -c 'path="ai-team' returns >=1, grep -c 'path="spontanansökan' returns >=1
    - File client/src/App.tsx still contains literal string `<Route path="*" element={<Navigate to="/" replace />} />`
    - `cd client && npx tsc --noEmit` exits 0
    - `cd client && npm run build` exits 0 (production build succeeds with new lazy imports)
  </acceptance_criteria>

  <done>
    - 5 hub routes added inside the existing `<Route path="/" element={<RootRoute />}>` block
    - Index route is conditional on isHubNavEnabled()
    - All 27 existing deep-link routes unchanged
    - Production build succeeds (lazy chunks generated for hub pages)
    - TypeScript compiles cleanly
  </done>
</task>

</tasks>

<verification>
After both tasks:
1. `cd client && npx tsc --noEmit` exits 0
2. `cd client && npm run build` exits 0 — production build succeeds, hub pages appear as separate chunks
3. Manual check: `grep -c 'path="' client/src/App.tsx` should be approximately 36 (auth routes + 27 deep-link + 5 hub routes + a few legacy redirects)
4. The existing 27 deep-link routes' verification is the responsibility of Plan 05 (smoke test). This plan only verifies the hub pages compile and are reachable in principle.
</verification>

<success_criteria>
- 5 hub page files exist with correct domain values
- 5 hub routes added inside existing root route block as siblings of deep-link routes
- Conditional index redirect: only redirects to /oversikt when VITE_HUB_NAV_ENABLED=true
- All 27 existing deep-link routes left intact
- TypeScript and production build pass
</success_criteria>

<output>
After completion, create `.planning/phases/01-hub-navigation-shell/01-02-SUMMARY.md` documenting:
- The 5 hub component files created and their domain values
- The exact diff to App.tsx (lazy imports added, index route changed, 5 routes inserted)
- Confirmation that all 27 existing deep-link routes were preserved (count before vs after)
- Confirmation that build succeeds
- Any deviations from the action block with rationale
</output>
