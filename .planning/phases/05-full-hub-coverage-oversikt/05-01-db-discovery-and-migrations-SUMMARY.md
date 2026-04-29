---
phase: 05-full-hub-coverage-oversikt
plan: "01"
subsystem: database + widget-refactor
tags: [supabase, migration, schema, HiddenWidgetsPanel, refactor, tdd]
dependency_graph:
  requires: [04-04-jobsokhub-wiring-and-integration-tests-SUMMARY]
  provides: [05-DB-DISCOVERY, profiles.onboarded_hubs, profiles.linkedin_url, HiddenWidgetsPanel-props-API]
  affects: [05-02-karriar-hub, 05-03-resurser-hub, 05-04-min-vardag-hub, 05-05-oversikt-hub]
tech_stack:
  added: []
  patterns: [additive-migration, props-based-API, TDD-red-green, outside-click-dialog-guard]
key_files:
  created:
    - .planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md
    - supabase/migrations/20260429_phase5_onboarded_hubs.sql
    - supabase/migrations/20260429_phase5_linkedin_url.sql
  modified:
    - client/src/components/widgets/HiddenWidgetsPanel.tsx
    - client/src/components/widgets/HiddenWidgetsPanel.test.tsx
    - client/src/pages/hubs/JobsokHub.tsx
decisions:
  - "profiles.career_goals JSONB already exists — no separate career_goals table migration needed for Karriär hub"
  - "linkedin_url was ABSENT — migration applied (20260429_phase5_linkedin_url.sql)"
  - "consultant_participants uses participant_id (NOT user_id) — Plan 04 loader must filter on participant_id"
  - "No exercise_progress/completion table — Övningar widget uses exercise_answers count for progress"
  - "HiddenWidgetsPanel outside-click guard extended to exclude clicks inside [role=dialog] — prevents double-close on ConfirmDialog confirm button"
metrics:
  duration: "~6 min"
  completed_date: "2026-04-29"
  tasks: 3
  files: 6
---

# Phase 5 Plan 01: DB Discovery and Migrations Summary

Foundation plan establishing live DB schema truth, two additive idempotent migrations, and a hub-agnostic HiddenWidgetsPanel refactor. Plans 02-05 can now build on locked SELECT shapes and a reusable panel component.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Live DB introspection — write 05-DB-DISCOVERY.md | f62cfaf | 05-DB-DISCOVERY.md |
| 2 | Idempotent migrations — onboarded_hubs + linkedin_url | e4ce64e | 2 migration .sql files |
| 3 | Refactor HiddenWidgetsPanel to props-based + update JobsokHub | ea1d8a1 | HiddenWidgetsPanel.tsx, .test.tsx, JobsokHub.tsx |

---

## Task 1: DB Discovery Key Facts

Plans 02-05 must know:

**profiles table (post-migration):**
- `career_goals` JSONB `'{}'::jsonb` — PRESENT (Karriär Karriärmål reads from here, no separate table)
- `linkedin_url` TEXT — ADDED (was absent, migration applied)
- `onboarded_hubs` ARRAY (text[]) `'{}'::text[]` — ADDED (was absent, migration applied)

**Critical disambiguation — consultant_participants:**
- Column is `participant_id` NOT `user_id`
- Plan 04 loader: `.eq('participant_id', userId)` (NOT `.eq('user_id', userId)`)

**Exercise tables:** Five tables exist (`exercises`, `exercise_categories`, `exercise_questions`, `exercise_steps`, `exercise_answers`). No user completion/progress table. Övningar widget uses `exercise_answers` count for progress summary.

**Career tables:** `career_plans`, `career_milestones`, `career_paths`, etc. exist but Karriärmål widget reads `profiles.career_goals` JSONB (simpler, single-row).

Full discovery: `.planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md`

---

## Task 2: Migrations Applied + Verification

**File 1: `supabase/migrations/20260429_phase5_onboarded_hubs.sql`**
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarded_hubs TEXT[] DEFAULT '{}';
```
Applied via: `npx supabase db query --linked -f supabase/migrations/20260429_phase5_onboarded_hubs.sql`

**File 2: `supabase/migrations/20260429_phase5_linkedin_url.sql`**
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
```
Applied via: `npx supabase db query --linked -f supabase/migrations/20260429_phase5_linkedin_url.sql`

**Post-migration verification result:**
```
column_name     | data_type | column_default
----------------|-----------|---------------
linkedin_url    | text      | NULL
onboarded_hubs  | ARRAY     | '{}'::text[]
```

Both columns confirmed present. Zero destructive keywords (no DROP, no ALTER COLUMN TYPE).

---

## Task 3: HiddenWidgetsPanel Refactor

**Before (hub-locked):**
```typescript
// Imported context — threw if used outside JobsokLayoutProvider
import { useJobsokLayout, selectHiddenWidgets } from './JobsokLayoutContext'
interface HiddenWidgetsPanelProps { isOpen: boolean; onClose: () => void }
// Internally: const { layout, showWidget, resetLayout } = useJobsokLayout()
```

**After (hub-agnostic, props-based):**
```typescript
import type { WidgetLayoutItem } from './types'
interface HiddenWidgetsPanelProps {
  isOpen: boolean; onClose: () => void
  layout: WidgetLayoutItem[]; onShowWidget: (id: string) => void; onResetLayout: () => void
}
// Internally: const hidden = layout.filter(item => item.visible === false)
```

**JobsokHub.tsx call site updated:**
```tsx
<HiddenWidgetsPanel
  isOpen={panelOpen} onClose={() => setPanelOpen(false)}
  layout={effectiveLayout} onShowWidget={showWidget} onResetLayout={resetLayout}
/>
```

**Test counts:**
- HiddenWidgetsPanel.test.tsx: 13 tests previously → 6 new tests (props-based, no provider needed)
- JobsokHub.test.tsx: 24 tests before → 24 tests after (no regression)
- Combined: 30/30 pass

**Extra fix (deviation):** Dialog-click guard added to outside-click handler — prevents double-`onClose` when ConfirmDialog confirm button is clicked (button is outside panel containerRef).

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Dialog-click triggers panel outside-click handler**
- **Found during:** Task 3 TDD GREEN phase (Test 4 failing: onClose called 2 times)
- **Issue:** ConfirmDialog confirm button is rendered outside panel containerRef, so the panel's `mousedown` listener fired on dialog button click, calling `onClose` an extra time
- **Fix:** Added `closest('[role="dialog"]')` guard in onMouseDown — skips close if click target is inside a dialog overlay
- **Files modified:** `client/src/components/widgets/HiddenWidgetsPanel.tsx`
- **Commit:** ea1d8a1

---

## Self-Check

**Files exist:**
- [x] `.planning/phases/05-full-hub-coverage-oversikt/05-DB-DISCOVERY.md`
- [x] `supabase/migrations/20260429_phase5_onboarded_hubs.sql`
- [x] `supabase/migrations/20260429_phase5_linkedin_url.sql`
- [x] `client/src/components/widgets/HiddenWidgetsPanel.tsx` (modified)
- [x] `client/src/components/widgets/HiddenWidgetsPanel.test.tsx` (rewritten)
- [x] `client/src/pages/hubs/JobsokHub.tsx` (updated)

**Commits exist:**
- [x] f62cfaf — Task 1
- [x] e4ce64e — Task 2
- [x] ea1d8a1 — Task 3

## Self-Check: PASSED
