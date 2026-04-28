# Screenshots Specification — Phase 3 Empathy Review (A11Y-05)

**Status:** Deferred — captured during auto-mode execution as acceptable fallback (text artifact 03-PRE-IMPL-COPY-REVIEW.md used as primary agent input)
**Target:** 24 PNG screenshots (8 widgets x 3 states)
**Date spec written:** 2026-04-28

---

## Screenshot Specification

### Viewport & Auth Setup

| Property | Value |
|----------|-------|
| Viewport | 1440 x 900 (desktop L-size default) |
| URL | http://localhost:5173/soka-jobb (JobsokHub) |
| Dev server | `cd client && npm run dev` |
| Browser | Chromium / Chrome |

### Three Auth States Required

| State | Setup |
|-------|-------|
| Filled | Supabase test account with: cv (completion_pct ~75), >=3 cover_letters, >=2 interview_sessions with scores, >=5 job_applications across statuses, >=3 spontaneous_companies |
| Empty | Newly created Supabase account — zero rows in all tables |
| Error | Temporarily break supabase URL in `.env.local` OR use DevTools to throw inside a widget's queryFn |

---

## 24 Required Files

Save under `.planning/phases/03-data-wiring-wcag/screenshots/` with EXACT naming below:

| # | Filename | Widget | State |
|---|----------|--------|-------|
| 1 | cv-filled.png | CvWidget | filled |
| 2 | cv-empty.png | CvWidget | empty |
| 3 | cv-error.png | CvWidget | error |
| 4 | cover-letter-filled.png | CoverLetterWidget | filled |
| 5 | cover-letter-empty.png | CoverLetterWidget | empty |
| 6 | cover-letter-error.png | CoverLetterWidget | error |
| 7 | interview-filled.png | InterviewWidget | filled |
| 8 | interview-empty.png | InterviewWidget | empty |
| 9 | interview-error.png | InterviewWidget | error |
| 10 | job-search-filled.png | JobSearchWidget | filled |
| 11 | job-search-empty.png | JobSearchWidget | empty |
| 12 | job-search-error.png | JobSearchWidget | error |
| 13 | applications-filled.png | ApplicationsWidget | filled |
| 14 | applications-empty.png | ApplicationsWidget | empty |
| 15 | applications-error.png | ApplicationsWidget | error |
| 16 | spontaneous-filled.png | SpontaneousWidget | filled |
| 17 | spontaneous-empty.png | SpontaneousWidget | empty |
| 18 | spontaneous-error.png | SpontaneousWidget | error |
| 19 | salary-filled.png | SalaryWidget | filled (Phase 5 only — use empty-state for now) |
| 20 | salary-empty.png | SalaryWidget | empty |
| 21 | salary-error.png | SalaryWidget | error |
| 22 | international-filled.png | InternationalWidget | filled (Phase 5 only — use empty-state for now) |
| 23 | international-empty.png | InternationalWidget | empty |
| 24 | international-error.png | InternationalWidget | error |

---

## Verification Commands (after capture)

```bash
# Count files
ls .planning/phases/03-data-wiring-wcag/screenshots/ | wc -l
# Expected: 25 (24 PNGs + this README.md)

# Verify naming convention
ls .planning/phases/03-data-wiring-wcag/screenshots/ | grep -E "^(cv|cover-letter|interview|job-search|applications|spontaneous|salary|international)-(filled|empty|error)\.png$" | wc -l
# Expected: 24
```

---

## Notes on Phase 3 Limitations

- **SalaryWidget (salary-filled.png):** `salary_data` table absent from live DB in Phase 3. Capture the empty-state for now; the filled branch will be exercised in Phase 5.
- **InternationalWidget (international-filled.png):** Same — `international_targets` table absent. Capture empty-state.
- **Error state method:** The easiest approach is DevTools > Network tab > block the Supabase API domain, then refresh. This triggers the WidgetErrorBoundary for all widgets simultaneously.

---

*Spec written by gsd execute-phase during auto-mode run 2026-04-28.*
*Task 1 deferred per auto_mode instructions — 03-PRE-IMPL-COPY-REVIEW.md used as primary text input for agent reviews (Tasks 2 and 3).*
