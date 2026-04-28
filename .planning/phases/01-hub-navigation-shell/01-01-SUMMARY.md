---
phase: 01-hub-navigation-shell
plan: "01"
subsystem: navigation
tags: [hub-nav, navigation, i18n, feature-flag]
dependency_graph:
  requires: []
  provides:
    - NavHub type and HubId type from navigation.ts
    - navHubs constant (5 ordered hubs)
    - pageToHub lookup map (path -> HubId)
    - getActiveHub(pathname) helper
    - isHubNavEnabled() flag reader
    - nav.hubs.* Swedish translation keys in sv.json
  affects:
    - client/src/components/layout/navigation.ts
    - client/src/i18n/locales/sv.json
tech_stack:
  added: []
  patterns:
    - Explicit pageToHub map for active-hub detection (avoids prefix-matching pitfall)
    - IIFE-built lookup map derived from navHubs[].memberPaths at module load
    - Env-flag gating via import.meta.env.VITE_HUB_NAV_ENABLED read once at module load
key_files:
  created:
    - client/src/components/layout/navigation.test.ts
  modified:
    - client/src/components/layout/navigation.ts
    - client/src/i18n/locales/sv.json
decisions:
  - "pageToHub built by iterating navHubs[].memberPaths (not URL prefix matching) per PITFALLS.md Pitfall 2"
  - "Import of LegacyColorDomain moved to top of file — TypeScript does not allow mid-file imports"
  - "Oversikt hub memberPaths includes '/' so legacy bookmarks resolve cleanly before redirect plan ships"
metrics:
  duration: "2m 5s"
  completed: "2026-04-28"
  tasks_completed: 2
  files_modified: 3
---

# Phase 1 Plan 01: Navigation Refactor Summary

Hub navigation model introduced to `navigation.ts` alongside the legacy `navGroups` export. Provides `navHubs` (5 hubs), `pageToHub` (explicit path lookup map), `getActiveHub(pathname)`, and `isHubNavEnabled()` env-flag reader — the source-of-truth every Wave 2/3 plan depends on. Swedish labels added to `sv.json`. All 15 unit tests pass. Legacy exports untouched.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add NavHub model, navHubs, pageToHub, getActiveHub, isHubNavEnabled | 7451f2c | navigation.ts (+162 lines), navigation.test.ts (new, 15 tests) |
| 2 | Add nav.hubs translation keys to sv.json | 6c20150 | sv.json (+7 lines) |

## New Exports Added to navigation.ts

| Export | Kind | Description |
|--------|------|-------------|
| `HubId` | type | Union: `'oversikt' \| 'jobb' \| 'karriar' \| 'resurser' \| 'min-vardag'` |
| `NavHub` | interface | Hub shape: id, path, labelKey, fallbackLabel, domain, icon, memberPaths, items |
| `navHubs` | const | Array of 5 NavHub entries in canonical order |
| `pageToHub` | const | Record<string, HubId> — explicit path→hub lookup, built at module load |
| `getActiveHub` | function | Resolves pathname to NavHub via exact + sub-path matching |
| `isHubNavEnabled` | function | Returns boolean from VITE_HUB_NAV_ENABLED env var |

## Hub-to-Path Mapping (27 deep-links)

| Path | Hub | Hub id |
|------|-----|--------|
| `/` | Översikt | oversikt |
| `/job-search` | Söka jobb | jobb |
| `/applications` | Söka jobb | jobb |
| `/spontanansökan` | Söka jobb | jobb |
| `/cv` | Söka jobb | jobb |
| `/cover-letter` | Söka jobb | jobb |
| `/interview-simulator` | Söka jobb | jobb |
| `/salary` | Söka jobb | jobb |
| `/international` | Söka jobb | jobb |
| `/linkedin-optimizer` | Söka jobb | jobb |
| `/career` | Karriär | karriar |
| `/interest-guide` | Karriär | karriar |
| `/skills-gap-analysis` | Karriär | karriar |
| `/personal-brand` | Karriär | karriar |
| `/education` | Karriär | karriar |
| `/knowledge-base` | Resurser | resurser |
| `/resources` | Resurser | resurser |
| `/print-resources` | Resurser | resurser |
| `/externa-resurser` | Resurser | resurser |
| `/ai-team` | Resurser | resurser |
| `/help` | Resurser | resurser |
| `/nätverk` | Resurser | resurser |
| `/wellness` | Min vardag | min-vardag |
| `/diary` | Min vardag | min-vardag |
| `/calendar` | Min vardag | min-vardag |
| `/exercises` | Min vardag | min-vardag |
| `/my-consultant` | Min vardag | min-vardag |
| `/profile` | Min vardag | min-vardag |

Note: `/profile` and `/my-consultant` were in the legacy `action` group but now belong to `min-vardag` per ARCHITECTURE.md. `/ai-team` moved from `action` to `resurser`. These moves only take effect when `VITE_HUB_NAV_ENABLED=true`.

## Test Results

All 15 unit tests pass:
- Tests 1-3: navHubs array structure (ids, paths, domains)
- Tests 4-8: pageToHub lookup for specific paths
- Test 13: parity check — every memberPath key is present in pageToHub
- Tests 9-12: getActiveHub() — exact match, sub-path, hub own path, unknown path
- Tests 14-15: legacy navGroups and navItems still intact

## Legacy Exports Confirmed Unchanged

- `navGroups` — 3-group legacy navigation (verified: length 3)
- `navItems` — flat list derived from navGroups (verified: contains /cv, /job-search)
- `adminNavItems` — admin section nav
- `consultantNavItems` — consultant section nav
- `NEWEST_FEATURE` — badge tracking constant
- `getVisitedFeatures`, `markFeatureVisited`, `shouldShowBadge` — smart badge functions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript does not allow mid-file import statements**
- **Found during:** Task 1 implementation
- **Issue:** Plan action block placed `import type { LegacyColorDomain }` inside the appended block after existing exports. TypeScript requires all import statements at the top of the module.
- **Fix:** Moved `import type { LegacyColorDomain } from '@/lib/domains'` to the top of navigation.ts (first line), removed the duplicate from the appended block.
- **Files modified:** client/src/components/layout/navigation.ts
- **Commit:** 7451f2c (included in same commit, no separate fix needed)

## Self-Check: PASSED

- client/src/components/layout/navigation.ts: FOUND
- client/src/components/layout/navigation.test.ts: FOUND
- client/src/i18n/locales/sv.json: FOUND (modified)
- Commit 7451f2c: FOUND
- Commit 6c20150: FOUND
- 15 tests pass: CONFIRMED
- TypeScript clean: CONFIRMED
