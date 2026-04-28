---
phase: 4
slug: layout-persistence-hide-show
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x (jsdom) |
| **Config file** | `client/vitest.config.ts` |
| **Quick run command** | `cd client && npm run test:run -- src/hooks/useWidgetLayout.test.ts src/components/widgets/HiddenWidgetsPanel.test.tsx` |
| **Full suite command** | `cd client && npm run test:run` |
| **Estimated runtime** | ~28 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick subset (touched widget/hook tests)
- **After every plan wave:** `cd client && npm run test:run`
- **Before `/gsd:verify-work`:** Full suite green + manual migration verification SQL passes
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| CUST-01 (mergeLayouts) | Appends missing widget; removes unknown widget; preserves user-set sizes/visibility | unit | `npm run test:run -- src/hooks/useWidgetLayout.test.ts` | ❌ Wave 0 | ⬜ |
| CUST-01 (HubGrid filter) | Slot with `visible: false` not rendered | unit | `npm run test:run -- src/components/widgets/HubGrid.test.tsx` | ✅ extend | ⬜ |
| CUST-01 (Hide button) | Hide button renders only when `editMode=true`; `aria-label="Dölj widget {namn}"`; calls `onHide` | unit | `npm run test:run -- src/components/widgets/Widget.test.tsx` | ✅ extend | ⬜ |
| CUST-01 (Restore panel) | Lists hidden widgets; clicking restore re-shows widget; closes on Escape + outside click | unit | `npm run test:run -- src/components/widgets/HiddenWidgetsPanel.test.tsx` | ❌ Wave 0 | ⬜ |
| CUST-02 (Reset button) | ConfirmDialog appears with svensk copy; on confirm layout reverts to default | unit | same HiddenWidgetsPanel.test.tsx | ❌ Wave 0 | ⬜ |
| CUST-02 (Cancel reset) | On cancel, layout unchanged; no upsert fires | unit | same | ❌ Wave 0 | ⬜ |
| CUST-03 (query key) | `useWidgetLayout(hubId)` uses key `['user-widget-layouts', userId, hubId, breakpoint]` | unit | `npm run test:run -- src/hooks/useWidgetLayout.test.ts` | ❌ Wave 0 | ⬜ |
| CUST-03 (optimistic) | onMutate snapshots prior layout; onError restores; final state matches server | unit | same | ❌ Wave 0 | ⬜ |
| CUST-03 (upsert payload) | Payload includes user_id, hub_id, breakpoint, widgets — never bare data values | unit (mock supabase) | same | ❌ Wave 0 | ⬜ |
| CUST-03 (migration) | `user_widget_layouts` table exists with 7 columns + unique constraint on (user_id, hub_id, breakpoint) | manual SQL | `npx supabase db query --linked "SELECT column_name FROM information_schema.columns WHERE table_name='user_widget_layouts';" --output table` | N/A manual | ⬜ |
| CUST-03 (RLS) | 4 policies (select/insert/update/delete) on auth.uid()=user_id | manual SQL | `npx supabase db query --linked "SELECT policyname FROM pg_policies WHERE tablename='user_widget_layouts';" --output table` | N/A manual | ⬜ |
| Pitfall 5 (debounce) | Debounce timer 1000ms; `useBeforeUnload` flushes pending save synchronously | unit | useWidgetLayout.test.ts | ❌ Wave 0 | ⬜ |
| Pitfall 6 (per-breakpoint) | Mobile save with breakpoint='mobile' does not overwrite desktop row (separate keys) | unit | useWidgetLayout.test.ts | ❌ Wave 0 | ⬜ |
| Pitfall 7 (reconcile) | Existing layout missing newly-added widget — appended at default position | unit | useWidgetLayout.test.ts | ❌ Wave 0 | ⬜ |
| Pitfall 15 (re-render) | onVisibilityChange not called more than once on initial mount | regression | useWidgetLayout.test.ts | ❌ Wave 0 | ⬜ |
| A11Y (keyboard) | Hide button + restore panel reachable via Tab; Enter activates | unit | Widget.test.tsx + HiddenWidgetsPanel.test.tsx | ✅/❌ | ⬜ |
| A11Y (live region) | aria-live announcement after hide/restore/reset | unit | JobsokHub.test.tsx extension | ✅ extend | ⬜ |

---

## Wave 0 Requirements

- [ ] `client/src/hooks/useWidgetLayout.test.ts` — CUST-03 + Pitfalls 5, 6, 7, 15
- [ ] `client/src/components/widgets/HiddenWidgetsPanel.test.tsx` — CUST-01 (restore) + CUST-02 (reset)
- [ ] `client/src/components/widgets/JobsokLayoutContext.tsx` — peer-context (file exists for tests to import)

**Existing tests to extend:**
- `Widget.test.tsx` — hide-button render + aria + onHide callback
- `HubGrid.test.tsx` — visible:false filtering
- `JobsokHub.test.tsx` — integration: edit-mode toggle, hide flow, reset flow, layout persistence on remount

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Migration applied to remote DB | CUST-03 | `db query --linked -f` requires interactive auth | After committing migration: `npx supabase db query --linked -f supabase/migrations/{file}.sql`; verify with column-introspection SQL |
| Cross-device persistence (real test) | CUST-03 | Requires two devices/browsers | Login on desktop, hide widget, login on phone, verify mobile layout independent (Pitfall 6 manual proof) |
| RLS enforcement | CUST-03 | Requires authed JWT | Login as user A, attempt SELECT on user B's row, expect 0 rows |

---

## Validation Sign-Off

- [ ] All tasks have `<acceptance_criteria>` or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter once Wave 0 lands

**Approval:** pending
