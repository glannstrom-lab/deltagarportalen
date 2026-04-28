---
phase: 01-hub-navigation-shell
plan: 04
type: execute
wave: 2
depends_on:
  - 01
files_modified:
  - client/src/components/layout/HubBottomNav.tsx
  - client/src/components/Layout.tsx
autonomous: true
requirements:
  - NAV-03
  - NAV-05

must_haves:
  truths:
    - "On mobile (isMobile=true) AND VITE_HUB_NAV_ENABLED=true, a 5-tab bottom nav renders at the bottom of every authenticated page"
    - "On mobile, when on /cv (a Söka jobb member), the 'Söka jobb' tab is highlighted active"
    - "On mobile, when on /jobb (the hub path itself), the 'Söka jobb' tab is highlighted active"
    - "Each bottom-nav tab has minimum 44x44px touch target (WCAG 2.5.5 / 2.1 AA)"
    - "When VITE_HUB_NAV_ENABLED=false OR isMobile=false, HubBottomNav does NOT render"
    - "The existing FAQ BottomBar continues to render in flag-OFF state on mobile (zero behavioral regression)"
    - "When flag is ON and on mobile, the FAQ BottomBar is hidden so only HubBottomNav appears at the screen bottom (no double-stacking)"
    - "Active-tab detection uses getActiveHub() — explicit pageToHub map, NOT URL prefix matching"
  artifacts:
    - path: "client/src/components/layout/HubBottomNav.tsx"
      provides: "5-tab persistent mobile bottom navigation aligned with navHubs"
      contains:
        - "navHubs.map"
        - "getActiveHub"
        - "min-h-[44px]"
        - "aria-current"
    - path: "client/src/components/Layout.tsx"
      provides: "Conditional rendering of HubBottomNav vs legacy BottomBar based on flag and isMobile"
      contains:
        - "HubBottomNav"
        - "isHubNavEnabled"
  key_links:
    - from: "Layout.tsx mobile-bottom-bar slot"
      to: "HubBottomNav vs BottomBar"
      via: "conditional rendering on isHubNavEnabled() && isMobile"
      pattern: "isHubNavEnabled\\(\\)"
    - from: "HubBottomNav active-tab detection"
      to: "getActiveHub from navigation.ts"
      via: "useLocation().pathname passed to getActiveHub"
      pattern: "getActiveHub\\(location\\.pathname\\)"
---

<objective>
Create a new `HubBottomNav.tsx` component — a 5-tab persistent mobile bottom navigation aligned to `navHubs` — and wire it into `Layout.tsx` so it renders only when `isMobile && isHubNavEnabled()` returns true. When the hub flag is off or the viewport is desktop, the existing FAQ BottomBar continues to render exactly as today.

Critical: per NAV-03 the bottom nav is at hub level (5 tabs only). Per ARCHITECTURE.md the active tab is determined by `getActiveHub(location.pathname)` so navigating to any deep-link page WITHIN a hub keeps the parent hub's tab highlighted. Per WCAG 2.1 AA (SC 2.5.5 Target Size), each tab must be at least 44x44px touch target.

When flag is on AND on mobile, replace the FAQ BottomBar with HubBottomNav (avoid stacking two bottom bars). When flag is off OR on desktop, keep the existing BottomBar rendering as-is.

Output: New HubBottomNav.tsx component and an updated Layout.tsx with conditional bottom-nav rendering.
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
<!-- From client/src/components/layout/navigation.ts (after Plan 01): -->
```typescript
export const navHubs: NavHub[]  // 5 hubs with id, path, labelKey, fallbackLabel, domain, icon
export function getActiveHub(pathname: string): NavHub | undefined
export function isHubNavEnabled(): boolean
```

<!-- From client/src/components/MobileOptimizer (existing): -->
```typescript
export function useMobileOptimizer(): { isMobile: boolean, ... }
```

<!-- From client/src/components/Layout.tsx (existing structure — relevant excerpt): -->
```tsx
import { Sidebar } from './layout/Sidebar'
import { TopBar } from './layout/TopBar'
import { BottomBar } from './layout/BottomBar'
import { useMobileOptimizer } from './MobileOptimizer'
import { useLocation } from 'react-router-dom'

export default function Layout() {
  const { isMobile } = useMobileOptimizer()
  const location = useLocation()
  const showBars = !['/login', '/register'].includes(location.pathname)
  const showBackButton = isMobile && location.pathname !== '/'

  return (
    <>
      <SkipLinks />
      <div className="...">
        {showBars && !isMobile && <TopBar />}
        {showBars && isMobile && <MobileTopBar />}
        <div className="flex-1 flex">
          {/* Desktop sidebar */}
          {/* Main content */}
        </div>
        {showBackButton && <MobileBackButton />}
        {showBars && <BottomBar />}    {/* <-- LEGACY: always renders */}
        <BreakReminder workDuration={15} />
        <ToastContainer />
      </div>
    </>
  )
}
```

The existing BottomBar is FAQ-help content (read first 40 lines if you need to verify) — it is NOT a navigation bar. It is allowed to coexist with HubBottomNav on desktop, but on mobile they would visually conflict (both at screen bottom). Resolution: when flag is on AND on mobile, render HubBottomNav INSTEAD OF BottomBar. When flag is off OR on desktop, keep current behavior.

<!-- nav-hub-sketch.html does NOT include a mobile bottom-nav prototype. Visual design must match existing tab patterns: -->
- Background: white with top border (var(--header-border) equivalent — use stone-200)
- Active tab: bg-[var(--c-bg)] text-[var(--c-text)] with data-domain on the active tab wrapper to drive the pastel color
- Inactive tabs: text-stone-500 hover:text-[var(--c-text)]
- Layout: flex flex-row, justify-between, with each tab as a flex column (icon stacked above label)
- Touch target: min-h-[44px] min-w-[44px] per tab
- Safe area: pb-safe (matches existing Layout.tsx pattern)

<!-- Behavior contract: -->
- When location.pathname has no owning hub (e.g. /admin, /settings, /login), all 5 tabs render UNHIGHLIGHTED. Do NOT throw, do NOT default-highlight Översikt.
- When isHubNavEnabled() returns false, HubBottomNav must return null. Component is mountable safely either way.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create HubBottomNav.tsx — 5-tab mobile bottom navigation</name>

  <read_first>
    - client/src/components/layout/navigation.ts (verify navHubs, getActiveHub, isHubNavEnabled exports)
    - client/src/components/MobileOptimizer.tsx (verify useMobileOptimizer hook signature)
    - client/src/components/layout/BottomBar.tsx (first 40 lines — see existing bottom-fixed-positioning pattern and safe-area handling)
    - client/src/components/layout/Sidebar.tsx (read NavLink internal — match active-state styling patterns)
    - .planning/research/ARCHITECTURE.md section "Mobile nav: 5-tab bottom bar"
    - docs/DESIGN.md section about mobile/bottom-nav (if exists — otherwise use existing patterns)
  </read_first>

  <files>
    - client/src/components/layout/HubBottomNav.tsx (create)
    - client/src/components/layout/HubBottomNav.test.tsx (create)
  </files>

  <behavior>
    - Test 1: Renders exactly 5 navigation links (one per hub) when isHubNavEnabled() returns true
    - Test 2: Each link's text content matches the hub fallback label (Översikt, Söka jobb, Karriär, Resurser, Min vardag)
    - Test 3: Each link's `to` attribute equals the hub.path (/oversikt, /jobb, /karriar, /resurser, /min-vardag)
    - Test 4: When at pathname '/cv', the link to '/jobb' has aria-current="page" and the active className includes 'bg-[var(--c-bg)]'
    - Test 5: When at pathname '/karriar' (the hub path itself), the link to '/karriar' has aria-current="page"
    - Test 6: When at pathname '/some-unknown-route', no link has aria-current="page" (no default highlighting)
    - Test 7: Each link element has minimum 44px height (verify via inline className or computed style — string match `min-h-[44px]` on element)
    - Test 8: When isHubNavEnabled() returns false, the component renders null (no DOM output)
    - Test 9: Active link's parent has data-domain attribute equal to the active hub's domain (e.g. 'activity' when on /jobb)
    - Test 10: Component has role="navigation" and an aria-label like "Hubnavigering" / "Hub navigation"
  </behavior>

  <action>
    Create client/src/components/layout/HubBottomNav.tsx with this implementation:

    ```typescript
    /**
     * HubBottomNav — 5-tab persistent mobile bottom navigation
     *
     * Renders only when isHubNavEnabled() returns true. Replaces the FAQ BottomBar
     * on mobile when hub navigation is rolled out (Phase 1 of v1.0 milestone).
     *
     * Active-tab detection uses getActiveHub() (explicit pageToHub map),
     * NEVER URL prefix matching (PITFALLS.md Pitfall 2).
     *
     * Each tab meets WCAG 2.1 AA SC 2.5.5 Target Size (min 44x44px).
     */

    import { Link, useLocation } from 'react-router-dom'
    import { useTranslation } from 'react-i18next'
    import { navHubs, getActiveHub, isHubNavEnabled } from './navigation'
    import { cn } from '@/lib/utils'

    export function HubBottomNav() {
      const location = useLocation()
      const { t } = useTranslation()

      // Render nothing when feature flag is off — caller should not need to gate this
      if (!isHubNavEnabled()) return null

      const activeHub = getActiveHub(location.pathname)

      return (
        <nav
          role="navigation"
          aria-label={t('hubBottomNav.label', 'Hubnavigering')}
          className={cn(
            'fixed bottom-0 left-0 right-0 z-30 lg:hidden',
            'bg-white dark:bg-stone-900',
            'border-t border-stone-200 dark:border-stone-700',
            'pb-safe'
          )}
        >
          <ul className="flex flex-row items-stretch justify-between">
            {navHubs.map((hub) => {
              const isActive = activeHub?.id === hub.id
              const Icon = hub.icon
              return (
                <li
                  key={hub.id}
                  data-domain={hub.domain}
                  className="flex-1"
                >
                  <Link
                    to={hub.path}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex flex-col items-center justify-center gap-0.5',
                      'min-h-[44px] min-w-[44px] py-2 px-1',
                      'text-[10px] font-medium',
                      'transition-colors',
                      isActive
                        ? 'bg-[var(--c-bg)] text-[var(--c-text)] font-semibold'
                        : 'text-stone-500 dark:text-stone-400 hover:text-[var(--c-text)]'
                    )}
                  >
                    <Icon className={cn('w-5 h-5', isActive ? 'text-[var(--c-solid)]' : '')} aria-hidden="true" />
                    <span className="truncate max-w-full">{t(hub.labelKey, hub.fallbackLabel)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      )
    }

    export default HubBottomNav
    ```

    Then create client/src/components/layout/HubBottomNav.test.tsx with all 10 tests from the behavior block. Follow the same mocking pattern as Sidebar.test.tsx:

    ```typescript
    import { describe, it, expect, vi } from 'vitest'
    import { render, screen } from '@testing-library/react'
    import { MemoryRouter } from 'react-router-dom'
    import { HubBottomNav } from './HubBottomNav'

    vi.mock('./navigation', async (importOriginal) => {
      const actual: any = await importOriginal()
      return {
        ...actual,
        isHubNavEnabled: vi.fn(() => true),  // default ON for most tests; override in test 8
      }
    })

    const renderAt = (path: string) => render(
      <MemoryRouter initialEntries={[path]}>
        <HubBottomNav />
      </MemoryRouter>
    )
    ```

    For Test 7 (44px touch target): use `screen.getAllByRole('link')` and check the className includes `min-h-[44px]`. Tailwind class strings are stable for grep-based assertion in tests.

    For Test 8 (flag off):
    ```typescript
    it('renders null when isHubNavEnabled returns false', async () => {
      const nav = await import('./navigation')
      vi.mocked(nav.isHubNavEnabled).mockReturnValueOnce(false)
      const { container } = renderAt('/cv')
      expect(container.firstChild).toBeNull()
    })
    ```

    Implementation notes:
    - Position `fixed bottom-0` ensures the bar sits above page content. The `pb-safe` class (already used by Layout.tsx) handles iPhone safe-area inset.
    - `lg:hidden` is a defense-in-depth — Layout.tsx ALSO conditions rendering on isMobile, so this only matters if HubBottomNav is ever used elsewhere.
    - `data-domain={hub.domain}` is on the `<li>` so the active-state CSS variables resolve correctly per-tab.
    - The translation key 'hubBottomNav.label' falls back to "Hubnavigering" inline; sv.json entry can be added in a future polish plan.
  </action>

  <verify>
    <automated>cd client && npm run test:run -- src/components/layout/HubBottomNav.test.tsx && npx tsc --noEmit</automated>
  </verify>

  <acceptance_criteria>
    - File client/src/components/layout/HubBottomNav.tsx exists
    - File client/src/components/layout/HubBottomNav.tsx contains literal string `navHubs.map`
    - File client/src/components/layout/HubBottomNav.tsx contains literal string `getActiveHub(location.pathname)`
    - File client/src/components/layout/HubBottomNav.tsx contains literal string `isHubNavEnabled()`
    - File client/src/components/layout/HubBottomNav.tsx contains literal string `min-h-[44px]`
    - File client/src/components/layout/HubBottomNav.tsx contains literal string `aria-current`
    - File client/src/components/layout/HubBottomNav.tsx contains literal string `data-domain={hub.domain}`
    - File client/src/components/layout/HubBottomNav.tsx contains literal string `role="navigation"`
    - File client/src/components/layout/HubBottomNav.test.tsx exists with at least 10 it() blocks
    - URL prefix matching is NOT used (grep `location.pathname.startsWith` returns 0 matches in HubBottomNav.tsx)
    - `cd client && npm run test:run -- src/components/layout/HubBottomNav.test.tsx` exits 0
    - `cd client && npx tsc --noEmit` exits 0
  </acceptance_criteria>

  <done>
    - HubBottomNav.tsx exports a 5-tab fixed-bottom navigation aligned to navHubs
    - Active-tab detection uses getActiveHub() (no URL prefix matching)
    - WCAG 2.1 AA target-size requirement met (44x44px minimum)
    - Component returns null when flag is off
    - 10 unit tests pass
    - TypeScript compiles cleanly
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire HubBottomNav into Layout.tsx — replace BottomBar on mobile when flag is on</name>

  <read_first>
    - client/src/components/Layout.tsx (full file — understand the existing showBars / isMobile / BottomBar conditional, and the main outer div padding behavior)
    - client/src/components/layout/HubBottomNav.tsx (just created in Task 1)
    - client/src/components/layout/navigation.ts (verify isHubNavEnabled is exported)
  </read_first>

  <files>
    - client/src/components/Layout.tsx (modify — add HubBottomNav import, conditional rendering at the bottom-bar slot)
  </files>

  <action>
    Open client/src/components/Layout.tsx. Make these changes:

    STEP 1 — Add imports near the existing layout imports (around line 9):

    ```typescript
    import { HubBottomNav } from './layout/HubBottomNav'
    import { isHubNavEnabled } from './layout/navigation'
    ```

    STEP 2 — In the `Layout` component body, BEFORE the return statement, compute the flag and the bottom-nav decision:

    ```typescript
    const hubModeEnabled = isHubNavEnabled()
    // When flag is on AND on mobile, the hub bottom nav replaces the FAQ BottomBar.
    // Otherwise the FAQ BottomBar stays where it is today.
    const showHubBottomNav = hubModeEnabled && isMobile && showBars
    const showLegacyBottomBar = showBars && !showHubBottomNav
    ```

    STEP 3 — Locate the existing bottom-bar rendering line (around line 97):

    BEFORE:
    ```tsx
    {/* FAQ BottomBar - always visible like TopBar */}
    {showBars && <BottomBar />}
    ```

    AFTER:
    ```tsx
    {/* Hub bottom nav (mobile + flag on) — replaces FAQ BottomBar in this state */}
    {showHubBottomNav && <HubBottomNav />}

    {/* FAQ BottomBar — preserved for desktop and for flag-off rollout */}
    {showLegacyBottomBar && <BottomBar />}
    ```

    STEP 4 — Add bottom-padding to the main scroll container ONLY when showHubBottomNav is true, so the fixed bottom-nav doesn't cover content. Locate the `<main>` element (around line 75):

    BEFORE:
    ```tsx
    <main
      id="main-content"
      className={cn(
        'flex-1 overflow-auto',
        isMobile ? 'p-4' : 'p-6'
      )}
      tabIndex={-1}
    >
    ```

    AFTER:
    ```tsx
    <main
      id="main-content"
      className={cn(
        'flex-1 overflow-auto',
        isMobile ? 'p-4' : 'p-6',
        showHubBottomNav && 'pb-20'  // 64px footroom for the fixed bottom nav (h ~56px + safe-area)
      )}
      tabIndex={-1}
    >
    ```

    Critical rules:
    - Do NOT remove the existing BottomBar import or component reference — it still renders in flag-off and on desktop.
    - Do NOT change the MobileBackButton rendering (it already coexists fine; HubBottomNav is at the very bottom of the screen, MobileBackButton is positioned separately).
    - Do NOT change MobileTopBar or any of the mobile menu logic.
    - Both BottomBar and HubBottomNav are mutually exclusive at any given moment via the showHubBottomNav / showLegacyBottomBar booleans — never both render.
  </action>

  <verify>
    <automated>cd client && npx tsc --noEmit && grep -c 'HubBottomNav' client/src/components/Layout.tsx</automated>
  </verify>

  <acceptance_criteria>
    - File client/src/components/Layout.tsx contains literal string `import { HubBottomNav }`
    - File client/src/components/Layout.tsx contains literal string `import { isHubNavEnabled }`
    - File client/src/components/Layout.tsx contains literal string `showHubBottomNav`
    - File client/src/components/Layout.tsx contains literal string `<HubBottomNav />`
    - File client/src/components/Layout.tsx still contains literal string `<BottomBar />` (legacy preserved)
    - File client/src/components/Layout.tsx contains literal string `pb-20` (main padding when bottom nav active)
    - The expressions `showHubBottomNav` and `showLegacyBottomBar` are mutually exclusive: confirm by reading the conditions
    - `cd client && npx tsc --noEmit` exits 0
    - `cd client && npm run build` exits 0
    - `cd client && npm run test:run -- src/components/layout/HubBottomNav.test.tsx` still exits 0 (no regression)
  </acceptance_criteria>

  <done>
    - HubBottomNav imported and rendered conditionally in Layout.tsx
    - When VITE_HUB_NAV_ENABLED=true AND on mobile, HubBottomNav replaces BottomBar
    - When flag is off OR on desktop, BottomBar renders unchanged (zero regression)
    - Main content area gets bottom padding to avoid being covered by the fixed nav
    - TypeScript and production build pass
  </done>
</task>

</tasks>

<verification>
After both tasks:
1. `cd client && npm run test:run -- src/components/layout/HubBottomNav.test.tsx` exits 0
2. `cd client && npx tsc --noEmit` exits 0
3. `cd client && npm run build` exits 0
4. `grep -c 'HubBottomNav' client/src/components/Layout.tsx` returns at least 2 (import + JSX usage)
5. `grep -c 'BottomBar' client/src/components/Layout.tsx` returns at least 2 (import preserved + JSX preserved)
</verification>

<success_criteria>
- New HubBottomNav.tsx component exists with 5 hub tabs and active-state via getActiveHub
- Layout.tsx conditionally renders HubBottomNav (mobile + flag on) OR BottomBar (otherwise)
- WCAG 2.1 AA target-size met (44x44px per tab)
- Active-tab detection uses explicit pageToHub map (no URL prefix matching)
- All 10 HubBottomNav tests pass
- Production build succeeds
- Zero behavioral regression in flag-off state
</success_criteria>

<output>
After completion, create `.planning/phases/01-hub-navigation-shell/01-04-SUMMARY.md` documenting:
- The full HubBottomNav.tsx implementation
- The Layout.tsx diff (imports + conditional rendering + main padding)
- Confirmation that mutual exclusion between HubBottomNav and BottomBar holds in all 4 flag/device combinations:
  | Flag | Device | HubBottomNav | BottomBar |
  |------|--------|--------------|-----------|
  | on   | mobile | renders      | hidden    |
  | on   | desktop| hidden       | renders   |
  | off  | mobile | hidden       | renders   |
  | off  | desktop| hidden       | renders   |
- Confirmation 10 tests pass
</output>
