---
phase: 01-hub-navigation-shell
plan: 03
type: execute
wave: 2
depends_on:
  - 01
files_modified:
  - client/src/components/layout/Sidebar.tsx
autonomous: true
requirements:
  - NAV-01
  - NAV-02
  - NAV-05

must_haves:
  truths:
    - "When VITE_HUB_NAV_ENABLED=true, sidebar shows exactly 5 hub links (Översikt, Söka jobb, Karriär, Resurser, Min vardag), not the 27-item flat list"
    - "When VITE_HUB_NAV_ENABLED=true and user is on a deep-link page (e.g. /cv), the owning hub (Söka jobb) is highlighted as active AND its sub-items are expanded below it"
    - "When VITE_HUB_NAV_ENABLED=true and user is on /karriar (a hub page itself), Karriär hub is highlighted active and its 5 sub-items are visible"
    - "Hub expand/collapse uses the explicit pageToHub map / getActiveHub helper (NEVER URL prefix matching) per PITFALLS.md Pitfall 2"
    - "Sub-items of NON-active hubs are not rendered in the DOM (collapsed)"
    - "When VITE_HUB_NAV_ENABLED=false, sidebar renders the existing navGroups exactly as today (3-group flat sidebar) — zero behavioral change"
    - "Each hub link has its hub.domain set as data-domain on the wrapper, driving --c-* tokens for that link's active state"
    - "Sidebar collapse/expand toggle (w-[52px] / w-[220px]) still works in both flag states"
    - "Consultant section and Admin section render unchanged in both flag states"
    - "Footer (user profile, settings, logout) renders unchanged in both flag states"
  artifacts:
    - path: "client/src/components/layout/Sidebar.tsx"
      provides: "Conditional rendering: hub-mode (navHubs + active expansion) when flag on, legacy navGroups rendering when flag off"
      contains:
        - "isHubNavEnabled"
        - "navHubs"
        - "getActiveHub"
        - "navGroups"
  key_links:
    - from: "Sidebar.tsx hub rendering branch"
      to: "navHubs + getActiveHub from navigation.ts"
      via: "imports + conditional JSX based on isHubNavEnabled()"
      pattern: "isHubNavEnabled\\(\\)"
    - from: "Active hub detection"
      to: "pageToHub explicit map"
      via: "getActiveHub(location.pathname)"
      pattern: "getActiveHub\\("
---

<objective>
Refactor `client/src/components/layout/Sidebar.tsx` to support BOTH navigation modes via the `isHubNavEnabled()` flag from Plan 01:

- **Flag ON (`VITE_HUB_NAV_ENABLED=true`):** Sidebar renders 5 hub links (one per `navHubs` entry). The hub matching `getActiveHub(location.pathname)` is shown as active AND its `items[]` are rendered as an indented sub-list below it. Other hubs render only as collapsed top-level links.

- **Flag OFF (default):** Sidebar renders the existing navGroups flat list exactly as today. ZERO behavioral change.

The conditional must be at the top of the navigation rendering inside the `<nav>` element. Keep the existing collapse/expand logic, consultant section, admin section, and footer untouched — these work the same in both modes.

Per PITFALLS.md Pitfall 2: active-hub detection uses `getActiveHub()` (which uses the explicit `pageToHub` map), NEVER URL prefix matching like `location.pathname.startsWith(hub.path)`. Per PITFALLS.md Pitfall 16: rollout is environment-flag, not per-user.

Output: A Sidebar component that switches navigation modes at module load based on `import.meta.env.VITE_HUB_NAV_ENABLED`. Both modes pass tests.
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
@nav-hub-sketch.html

<interfaces>
<!-- From client/src/components/layout/navigation.ts (after Plan 01): -->
```typescript
export type HubId = 'oversikt' | 'jobb' | 'karriar' | 'resurser' | 'min-vardag'
export interface NavHub {
  id: HubId
  path: string
  labelKey: string
  fallbackLabel: string
  domain: LegacyColorDomain  // 'action' | 'activity' | 'coaching' | 'info' | 'wellbeing'
  icon: React.ComponentType<{ className?: string }>
  memberPaths: string[]
  items: NavItem[]
}
export const navHubs: NavHub[]
export function getActiveHub(pathname: string): NavHub | undefined
export function isHubNavEnabled(): boolean

// LEGACY (still exported, used in flag-off branch):
export const navGroups: NavGroup[]
export const adminNavItems
export const consultantNavItems
export function shouldShowBadge(item: NavItem): boolean
export function markFeatureVisited(path: string): void
```

<!-- From the existing Sidebar.tsx (must be preserved in both branches): -->
- The internal `NavLink` component (already defined inline) handles isCollapsed, badge, active state styling
- Footer block (user profile + settings + logout) is OUTSIDE the conditional and applies in both modes
- Consultant section + Admin section logic also OUTSIDE the hub/legacy conditional

<!-- Visual reference: nav-hub-sketch.html lines 56-77 -->
- Sidebar shows 5 top-level hub links (icon + label, dot indicator)
- Active hub gets `bg-white text-[var(--c-text)] font-semibold` with `box-shadow: inset 3px 0 0 var(--c-solid)` (left accent bar)
- The sketch's static prototype shows only the active hub's link highlighted; sub-item expansion below is NOT in the sketch but is required by NAV-02 ("Användaren ser aktiv hubbs undersidor expanderade i sidebaren") — render sub-items as a nested indented list per ARCHITECTURE.md section "Sidebar rendering: hubs vs sub-pages":

```tsx
{navHubs.map(hub => (
  <div key={hub.id} data-domain={hub.domain}>
    <NavLink to={hub.path} icon={hub.icon} label={t(hub.labelKey, hub.fallbackLabel)}
      isActive={activeHub?.id === hub.id} />
    {activeHub?.id === hub.id && hub.items.length > 0 && (
      <div className="ml-4 border-l-2 border-[var(--c-accent)] pl-2 space-y-0.5 mt-0.5">
        {hub.items.map(item => (
          <NavLink key={item.path} to={item.path} icon={item.icon} label={t(item.labelKey)}
            isActive={location.pathname === item.path || location.pathname.startsWith(item.path + '/')} />
        ))}
      </div>
    )}
  </div>
))}
```

When isCollapsed=true in hub mode, render only the 5 hub icons (no sub-list expansion).
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Refactor Sidebar.tsx to conditionally render hub navigation when flag is enabled</name>

  <read_first>
    - client/src/components/layout/Sidebar.tsx (full file — understand the existing NavLink component, navGroups rendering loop, consultant/admin sections, footer)
    - client/src/components/layout/navigation.ts (verify navHubs, getActiveHub, isHubNavEnabled exports from Plan 01)
    - .planning/research/ARCHITECTURE.md section "Sidebar rendering: hubs vs sub-pages" (the canonical render pattern)
    - .planning/research/PITFALLS.md Pitfall 2 (active-state via pageToHub, not prefix match)
    - nav-hub-sketch.html lines 322-330 (visual reference for 5-link sidebar layout) and lines 73-77 (active-state CSS)
  </read_first>

  <files>
    - client/src/components/layout/Sidebar.tsx (modify — add hub-mode rendering as a conditional branch above legacy navGroups rendering)
    - client/src/components/layout/Sidebar.test.tsx (create — new test file with mocked router)
  </files>

  <behavior>
    Hub mode (isHubNavEnabled() returns true — must be mockable via vi.mock):
    - Test 1: Renders exactly 5 top-level navigation links with text matching the hub fallback labels (Översikt, Söka jobb, Karriär, Resurser, Min vardag)
    - Test 2: When location.pathname is '/cv' (a Söka jobb member), the "Söka jobb" link has aria-current or the active className `bg-[var(--c-bg)]`, and the sub-item links for jobb (e.g. "Sök jobb", "Mina ansökningar", "CV") are rendered in the DOM
    - Test 3: When location.pathname is '/cv', sub-items for OTHER hubs (e.g. Karriär's "Intresseguide") are NOT in the DOM
    - Test 4: When location.pathname is '/karriar' (a hub path itself), the Karriär hub is active and its 5 sub-items are rendered
    - Test 5: When location.pathname is '/oversikt', the Översikt hub is active and renders no sub-items (its items array is empty)
    - Test 6: When location.pathname is '/some-unknown-route', no hub is highlighted (no link has the active class) and no sub-items are rendered

    Legacy mode (isHubNavEnabled() returns false — default for vi.mock):
    - Test 7: Renders all 3 navGroup labels (Översikt, Reflektion, Utåtriktat) as group headers
    - Test 8: Renders all 27 nav items from navGroups (count via querySelectorAll('a'))
    - Test 9: When location.pathname is '/cv', the '/cv' nav link is highlighted (existing behavior preserved)

    Both modes:
    - Test 10: Footer renders user profile link, settings link, logout button regardless of mode
    - Test 11: When isCollapsed=true and hub mode, only 5 icon-only hub links render (no sub-items, no labels, no group labels)
  </behavior>

  <action>
    Open client/src/components/layout/Sidebar.tsx. Make the following changes:

    STEP 1 — Update imports to include the new exports from navigation.ts (add to existing import line):

    ```typescript
    import {
      navGroups,
      navHubs,
      getActiveHub,
      isHubNavEnabled,
      adminNavItems,
      consultantNavItems,
      markFeatureVisited,
      shouldShowBadge,
      type NavItem,
      type NavHub,
    } from './navigation'
    ```

    STEP 2 — Inside the `Sidebar` component, BEFORE the `return (...)`, compute the hub mode flag and active hub:

    ```typescript
    const hubModeEnabled = isHubNavEnabled()
    const activeHub = hubModeEnabled ? getActiveHub(location.pathname) : undefined
    ```

    STEP 3 — In the `<nav>` block (currently around line 120-167 in the existing Sidebar.tsx), replace the legacy `{navGroups.map(...)}` block with a conditional. The structure should be:

    ```tsx
    <nav className={cn('flex-1 overflow-y-auto py-3', isCollapsed ? 'px-1.5' : 'px-2')}>
      {hubModeEnabled ? (
        // Hub mode: 5 hub links with active sub-item expansion
        <div className="space-y-0.5">
          {navHubs.map((hub) => {
            const isHubActive = activeHub?.id === hub.id
            return (
              <div key={hub.id} data-domain={hub.domain}>
                <NavLink
                  to={hub.path}
                  icon={hub.icon}
                  label={t(hub.labelKey, hub.fallbackLabel)}
                  isActive={isHubActive}
                />
                {/* Render sub-items only when hub is active AND sidebar is expanded AND hub has items */}
                {isHubActive && !isCollapsed && hub.items.length > 0 && (
                  <div className="ml-4 mt-0.5 border-l-2 border-[var(--c-accent)] pl-2 space-y-0.5">
                    {hub.items.map((item) => {
                      const itemActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(`${item.path}/`))
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          icon={item.icon}
                          label={t(item.labelKey)}
                          item={item}
                          isActive={itemActive}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        // Legacy mode: existing 3-group navGroups rendering — DO NOT MODIFY
        <>
          {navGroups.map((group, groupIndex) => (
            // ... EXISTING CODE — PRESERVE EXACTLY AS IS ...
          ))}
        </>
      )}

      {/* Consultant section — UNCHANGED, applies in both modes */}
      {isConsultant && !isUser && ( /* existing */ )}

      {/* Admin section — UNCHANGED, applies in both modes */}
      {isAdmin && ( /* existing */ )}
    </nav>
    ```

    Critical: extract the legacy `navGroups.map(...)` block VERBATIM from the existing file into the `else` branch. Do NOT re-implement it. Copy the existing JSX exactly.

    STEP 4 — Add `aria-current="page"` to the NavLink rendering when active (accessibility per WCAG 2.1 AA / NAV requirement). The existing NavLink component already styles based on `isActive`; add `aria-current={isActive ? 'page' : undefined}` to the inner `<Link>` element inside NavLink (around line 53). This applies in both modes.

    STEP 5 — Create client/src/components/layout/Sidebar.test.tsx with all 11 tests from the behavior block.

    Mocking strategy for tests:
    ```typescript
    import { describe, it, expect, vi, beforeEach } from 'vitest'
    import { render, screen } from '@testing-library/react'
    import { MemoryRouter } from 'react-router-dom'
    import { Sidebar } from './Sidebar'

    // Mock isHubNavEnabled (it reads import.meta.env at module load — must mock the module)
    vi.mock('./navigation', async (importOriginal) => {
      const actual: any = await importOriginal()
      return {
        ...actual,
        isHubNavEnabled: vi.fn(() => false),  // default off; override per test
      }
    })

    // Mock useAuthStore
    vi.mock('@/stores/authStore', () => ({
      useAuthStore: () => ({
        profile: { activeRole: 'USER', email: 'test@example.com', first_name: 'Test' },
        signOut: vi.fn(),
      }),
    }))

    // Helper
    const renderAt = (path: string) => render(
      <MemoryRouter initialEntries={[path]}>
        <Sidebar />
      </MemoryRouter>
    )

    // Each test that needs hub mode does:
    // const nav = await import('./navigation')
    // vi.mocked(nav.isHubNavEnabled).mockReturnValue(true)
    ```

    For tests that count nav items (Test 8), use `screen.getAllByRole('link')` or query `<a>` elements; expect at least 27 deep-link items (legacy mode) or exactly 5 hub items + sub-items of active hub (hub mode).

    For Test 11 (collapsed mode hub), pass `isCollapsed={true}` as prop and assert only icon links render (no `<span>` text).
  </action>

  <verify>
    <automated>cd client && npm run test:run -- src/components/layout/Sidebar.test.tsx && npx tsc --noEmit</automated>
  </verify>

  <acceptance_criteria>
    - File client/src/components/layout/Sidebar.tsx contains literal string `isHubNavEnabled()`
    - File client/src/components/layout/Sidebar.tsx contains literal string `navHubs.map`
    - File client/src/components/layout/Sidebar.tsx contains literal string `getActiveHub`
    - File client/src/components/layout/Sidebar.tsx still contains literal string `navGroups.map` (legacy branch preserved)
    - File client/src/components/layout/Sidebar.tsx contains literal string `aria-current`
    - File client/src/components/layout/Sidebar.tsx contains literal string `data-domain={hub.domain}`
    - File client/src/components/layout/Sidebar.test.tsx exists with at least 11 it() blocks
    - Command `cd client && npm run test:run -- src/components/layout/Sidebar.test.tsx` exits 0
    - Command `cd client && npx tsc --noEmit` exits 0
    - The legacy navGroups consultant section, admin section, footer (user, settings, logout) JSX is preserved in the file (grep for `consultantNavItems.map`, `adminNavItems.map`, `signOut()`, `to="/profile"` — all should match)
    - URL prefix matching is NOT used for hub active-state detection (grep for `location.pathname.startsWith(hub.path)` should return 0 matches)
  </acceptance_criteria>

  <done>
    - Sidebar conditionally renders hub mode or legacy mode based on isHubNavEnabled()
    - Hub mode shows 5 hub links + active hub's sub-items expanded
    - Legacy mode preserves the existing 3-group flat rendering exactly
    - Active-hub detection uses getActiveHub() (explicit map), not URL prefix matching
    - Consultant section, admin section, footer unchanged
    - 11 unit tests pass
    - TypeScript compiles
  </done>
</task>

</tasks>

<verification>
After Task 1:
1. `cd client && npm run test:run -- src/components/layout/Sidebar.test.tsx` exits 0 (all 11 tests pass)
2. `cd client && npx tsc --noEmit` exits 0
3. `cd client && npm run build` exits 0
4. Visual regression in legacy mode: build the app with `VITE_HUB_NAV_ENABLED` unset and confirm the existing sidebar rendering is unchanged. Manual smoke is sufficient — Plan 05 covers automated deep-link verification.
</verification>

<success_criteria>
- Sidebar.tsx renders 5 hub links in hub mode and the existing 3-group nav in legacy mode
- Active hub auto-expands its sub-items below the hub link in hub mode
- Active hub detection uses getActiveHub() helper (no URL prefix matching)
- Both modes pass all 11 unit tests
- Footer, consultant section, admin section preserved in both modes
- TypeScript and production build pass
</success_criteria>

<output>
After completion, create `.planning/phases/01-hub-navigation-shell/01-03-SUMMARY.md` documenting:
- The exact diff to Sidebar.tsx (imports added, conditional branch added, NavLink ARIA improvement)
- The behavior of each of the 11 tests
- Any visual/CSS deviations from nav-hub-sketch.html with rationale
- Confirmation that legacy mode is byte-equivalent to today's behavior
</output>
