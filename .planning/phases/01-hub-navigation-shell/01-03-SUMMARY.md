---
phase: 01-hub-navigation-shell
plan: "03"
subsystem: navigation
tags: [hub-nav, sidebar, feature-flag, wcag, aria]
dependency_graph:
  requires:
    - 01-01 (navHubs, getActiveHub, isHubNavEnabled from navigation.ts)
  provides:
    - Sidebar renders 5 hub links in hub mode (VITE_HUB_NAV_ENABLED=true)
    - Sidebar renders legacy 3-group navGroups in legacy mode (default)
    - Active hub auto-expands sub-items below hub link
    - aria-current="page" on all active NavLink elements (WCAG 2.1 AA)
    - data-domain={hub.domain} wrapper drives --c-* tokens per hub
  affects:
    - client/src/components/layout/Sidebar.tsx
tech_stack:
  added: []
  patterns:
    - Conditional branch in JSX based on isHubNavEnabled() at render time
    - getActiveHub(location.pathname) for active-hub resolution (never prefix matching)
    - aria-current="page" on Link elements for WCAG 2.1 AA compliance
    - data-domain={hub.domain} for CSS custom property token scoping
key_files:
  created:
    - client/src/components/layout/Sidebar.test.tsx
  modified:
    - client/src/components/layout/Sidebar.tsx
decisions:
  - "Hub mode renders 5 hub links + active hub sub-items; collapsed mode suppresses sub-items and text labels"
  - "NavLink aria-current added globally (both modes) for WCAG 2.1 AA — not hub-mode-only"
  - "Legacy navGroups rendering preserved verbatim in else branch — zero behavioral change"
metrics:
  duration: "~8 min"
  completed: "2026-04-28"
  tasks_completed: 1
  files_modified: 2
---

# Phase 1 Plan 03: Sidebar Refactor Summary

Sidebar.tsx refactored to dual-mode rendering: hub mode (5 NavHub links + active hub sub-item expansion) when `VITE_HUB_NAV_ENABLED=true`, legacy mode (3-group navGroups flat list) otherwise. Active-hub detection uses `getActiveHub()` (explicit `pageToHub` map), never URL prefix matching. `aria-current="page"` added to all active NavLink `<Link>` elements for WCAG 2.1 AA. 12 unit tests pass. TypeScript and production build clean.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Refactor Sidebar.tsx to conditionally render hub navigation when flag is enabled | ecc244b | Sidebar.tsx (modified, +253/-41 lines), Sidebar.test.tsx (created, 12 tests) |

## Changes to Sidebar.tsx

### Imports Added

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

Previously only `navGroups`, `adminNavItems`, `consultantNavItems`, `markFeatureVisited`, `shouldShowBadge`, `NavItem` were imported.

### Hub Mode Constants (Before `return`)

```typescript
const hubModeEnabled = isHubNavEnabled()
const activeHub = hubModeEnabled ? getActiveHub(location.pathname) : undefined
```

### NavLink ARIA Improvement

Added `aria-current={isActive ? 'page' : undefined}` to the inner `<Link>` element inside `NavLink`. Applies in both modes.

### Conditional Navigation Rendering in `<nav>`

```tsx
{hubModeEnabled ? (
  // Hub mode: 5 hub links with active sub-item expansion
  <div className="space-y-0.5">
    {navHubs.map((hub) => {
      const isHubActive = activeHub?.id === hub.id
      return (
        <div key={hub.id} data-domain={hub.domain}>
          <NavLink to={hub.path} ... isActive={isHubActive} />
          {isHubActive && !isCollapsed && hub.items.length > 0 && (
            <div className="ml-4 mt-0.5 border-l-2 border-[var(--c-accent)] pl-2 space-y-0.5">
              {hub.items.map(...)}
            </div>
          )}
        </div>
      )
    })}
  </div>
) : (
  // Legacy mode: existing 3-group navGroups rendering — preserved verbatim
  <>
    {navGroups.map((group, groupIndex) => ( ... ))}
  </>
)}
```

## Test Behavior (12 tests)

| Test | Description | Result |
|------|-------------|--------|
| 1 | Hub mode: exactly 5 hub links with fallback labels visible | PASS |
| 2 | Hub mode: on /cv, Söka jobb is aria-current and sub-item CV is rendered | PASS |
| 3 | Hub mode: on /cv, Karriär sub-items (Intresseguide) are NOT in DOM | PASS |
| 4 | Hub mode: on /karriar hub path, Karriär active + 5 sub-items rendered | PASS |
| 5 | Hub mode: on /oversikt, Översikt active + no sub-items (items[] empty) | PASS |
| 6 | Hub mode: on unknown route, no aria-current and no sub-items | PASS |
| 7 | Legacy mode: all 3 navGroup labels rendered as headers | PASS |
| 8 | Legacy mode: at least 27 nav links rendered (all navGroups items) | PASS |
| 9 | Legacy mode: on /cv, the /cv link has aria-current="page" | PASS |
| 10 | Hub mode: footer settings link + logout button present | PASS |
| 10b | Legacy mode: footer settings link + logout button present | PASS |
| 11 | Hub mode collapsed: no text labels, no sub-items rendered | PASS |

## Acceptance Criteria Verification

| Criterion | Status |
|-----------|--------|
| Sidebar.tsx contains `isHubNavEnabled()` | PASS |
| Sidebar.tsx contains `navHubs.map` | PASS |
| Sidebar.tsx contains `getActiveHub` | PASS |
| Sidebar.tsx contains `navGroups.map` (legacy branch) | PASS |
| Sidebar.tsx contains `aria-current` | PASS |
| Sidebar.tsx contains `data-domain={hub.domain}` | PASS |
| Sidebar.test.tsx exists with 12 it() blocks | PASS |
| `npm run test:run -- Sidebar.test.tsx` exits 0 | PASS |
| `npx tsc --noEmit` exits 0 | PASS |
| `consultantNavItems.map`, `adminNavItems.map`, `signOut()`, `to="/profile"` preserved | PASS |
| `location.pathname.startsWith(hub.path)` = 0 matches (no prefix matching for hubs) | PASS |

## Visual/CSS Notes

- Active hub link: `bg-[var(--c-bg)] text-[var(--c-text)] border-l-[var(--c-solid)] font-semibold` — matches the sketch's left-accent-bar + white background pattern
- Sub-item list: `ml-4 mt-0.5 border-l-2 border-[var(--c-accent)] pl-2 space-y-0.5` — indented with domain-colored left border
- Sub-item expansion is hidden when `isCollapsed=true` (icon-only mode)
- No deviations from nav-hub-sketch.html visual intent

## Legacy Mode Confirmation

The `navGroups.map(...)` block in the else branch is byte-equivalent to the original Sidebar.tsx rendering — only wrapped in `<>...</>` fragments. Zero behavioral change in legacy mode confirmed by Tests 7, 8, 9 and visual smoke test via production build.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- client/src/components/layout/Sidebar.tsx: FOUND (modified)
- client/src/components/layout/Sidebar.test.tsx: FOUND (created)
- Commit ecc244b: FOUND
- 12 tests pass: CONFIRMED
- TypeScript clean: CONFIRMED
- Production build: CONFIRMED (no errors)
