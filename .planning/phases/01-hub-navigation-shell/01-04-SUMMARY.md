---
phase: 01-hub-navigation-shell
plan: "04"
subsystem: navigation
tags: [hub-nav, mobile, bottom-nav, wcag, feature-flag]
dependency_graph:
  requires:
    - 01-01 (navHubs, getActiveHub, isHubNavEnabled from navigation.ts)
  provides:
    - HubBottomNav component (5-tab fixed mobile bottom nav)
    - Layout.tsx conditional bottom-bar slot (HubBottomNav vs BottomBar)
  affects:
    - client/src/components/layout/HubBottomNav.tsx
    - client/src/components/Layout.tsx
tech_stack:
  added: []
  patterns:
    - Fixed bottom nav with pb-safe for iPhone safe-area inset
    - Mutually exclusive bottom bar rendering via showHubBottomNav / showLegacyBottomBar booleans
    - Active-tab detection via getActiveHub() — explicit pageToHub map, no URL prefix matching
    - data-domain on tab wrapper to resolve CSS custom property color tokens per-hub
key_files:
  created:
    - client/src/components/layout/HubBottomNav.tsx
    - client/src/components/layout/HubBottomNav.test.tsx
  modified:
    - client/src/components/Layout.tsx
decisions:
  - "data-domain placed on <li> wrapper (not <Link>) so that CSS variable cascade resolves via the active-state parent"
  - "pb-20 added to main content only when showHubBottomNav — on desktop and flag-off no layout change"
  - "lg:hidden on HubBottomNav as defense-in-depth; primary guard is isMobile in Layout.tsx"
metrics:
  duration: "~5 min"
  completed: "2026-04-28"
  tasks_completed: 2
  files_modified: 3
---

# Phase 1 Plan 04: Mobile Bottom Nav Summary

5-tab `HubBottomNav.tsx` component with active-tab detection via `getActiveHub()` wired into `Layout.tsx` behind `isMobile && isHubNavEnabled()`. The existing FAQ `BottomBar` is fully preserved for desktop and flag-off state via mutually exclusive booleans. All 10 unit tests pass. WCAG 2.1 AA target-size met (min-h-[44px] min-w-[44px] per tab).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create HubBottomNav.tsx — 5-tab mobile bottom navigation | b2da2b7 | HubBottomNav.tsx (new, 73 lines), HubBottomNav.test.tsx (new, 10 tests) |
| 2 | Wire HubBottomNav into Layout.tsx | 4ccd724 | Layout.tsx (+15 lines, -4 lines) |

## New Component: HubBottomNav.tsx

Key implementation details:

- `navHubs.map(...)` — iterates the canonical 5-hub array from navigation.ts
- `getActiveHub(location.pathname)` — resolves active hub using explicit pageToHub map (PITFALLS.md Pitfall 2 compliant)
- `isHubNavEnabled()` gate — component returns null when flag is off; no external gating required
- `role="navigation"` + `aria-label="Hubnavigering"` — WCAG landmark
- `min-h-[44px] min-w-[44px]` — WCAG 2.1 AA SC 2.5.5 Target Size on each link
- `aria-current="page"` on active link — screen reader active-state signaling
- `data-domain={hub.domain}` on `<li>` — CSS variable token resolution per-hub domain
- `fixed bottom-0 left-0 right-0 z-30 lg:hidden` — positioning + desktop defense-in-depth
- `pb-safe` — iPhone home-indicator safe area

## Layout.tsx Changes

### Imports added (line 19-20)

```tsx
import { navGroups, adminNavItems, consultantNavItems, shouldShowBadge, isHubNavEnabled } from './layout/navigation'
import { HubBottomNav } from './layout/HubBottomNav'
```

### Computed variables added (before return)

```tsx
const hubModeEnabled = isHubNavEnabled()
const showHubBottomNav = hubModeEnabled && isMobile && showBars
const showLegacyBottomBar = showBars && !showHubBottomNav
```

### Bottom-bar slot (was one line, now two exclusive slots)

```tsx
{/* Hub bottom nav (mobile + flag on) — replaces FAQ BottomBar in this state */}
{showHubBottomNav && <HubBottomNav />}

{/* FAQ BottomBar — preserved for desktop and for flag-off rollout */}
{showLegacyBottomBar && <BottomBar />}
```

### Main content padding when HubBottomNav active

```tsx
<main
  id="main-content"
  className={cn(
    'flex-1 overflow-auto',
    isMobile ? 'p-4' : 'p-6',
    showHubBottomNav && 'pb-20'  // 64px footroom for the fixed bottom nav
  )}
  tabIndex={-1}
>
```

## Mutual Exclusion Matrix

| Flag | Device | HubBottomNav | BottomBar |
|------|--------|--------------|-----------|
| on   | mobile | renders      | hidden    |
| on   | desktop| hidden       | renders   |
| off  | mobile | hidden       | renders   |
| off  | desktop| hidden       | renders   |

**Proof:** `showHubBottomNav = hubModeEnabled && isMobile && showBars` | `showLegacyBottomBar = showBars && !showHubBottomNav`. The expressions are mutually exclusive by construction — at most one can be true at any time.

## Test Results

All 10 unit tests pass:

| Test | Description | Result |
|------|-------------|--------|
| 1 | Renders exactly 5 navigation links when flag on | PASS |
| 2 | Each link text matches fallback labels | PASS |
| 3 | Each link href matches hub path | PASS |
| 4 | /cv path → /jobb link has aria-current="page" and active class | PASS |
| 5 | /karriar path → /karriar link has aria-current="page" | PASS |
| 6 | Unknown route → no link has aria-current="page" | PASS |
| 7 | Each link has min-h-[44px] in className | PASS |
| 8 | isHubNavEnabled false → renders null | PASS |
| 9 | Active link parent has correct data-domain | PASS |
| 10 | role="navigation" and aria-label present | PASS |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- client/src/components/layout/HubBottomNav.tsx: FOUND
- client/src/components/layout/HubBottomNav.test.tsx: FOUND
- client/src/components/Layout.tsx: FOUND (modified)
- Commit b2da2b7: FOUND
- Commit 4ccd724: FOUND
- 10 tests pass: CONFIRMED
- TypeScript clean: CONFIRMED
- Production build: CONFIRMED

## Self-Check: PASSED
