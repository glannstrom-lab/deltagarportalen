# Feature Research: Hub Navigation + Widget System

**Domain:** Dashboard/hub navigation with smart widget cards for a vulnerable-user job-seeker portal
**Researched:** 2026-04-28
**Confidence:** HIGH (based on direct codebase inspection + existing nav-hub-sketch.html prototype)

---

## Per-Page Widget Specs

Each widget spec includes: title, KPI/primary data, secondary data, primary action, ideal default size, data source, and hub placement.

Pages are grouped by which hub owns them.

---

### Hub: Söka Jobb (Activity domain — persika #FCF1E6)

#### /job-search — Sök jobb
**Title:** Sök jobb
**Default size:** L (2 col × 2 row)
**KPI:** "12 nya träffar idag" (count from saved searches, fetched from Platsbanken via `arbetsformedlingenApi`)
**Secondary data:** Top 3 match cards — role, company, match% — from the `MatchesTab` component
**Primary action:** "Visa alla träffar" → `/job-search/matches`
**Secondary action:** "Redigera sökfilter" → `/job-search`
**S mode:** just the new-hits count + "Sök nu"-link
**M mode:** count + top 1 match card
**L mode:** count + top 3 match cards with match%
**Data dependency:** `useSavedJobs` hook, `MatchesTab` component, Platsbanken API

#### /applications — Mina ansökningar
**Title:** Mina ansökningar
**Default size:** M (2 col × 1 row)
**KPI:** Total count (e.g. "12 totalt")
**Secondary data:** Stacked status bar — Aktiva / Svar inväntas / Intervju / Avslutade — with counts from `ApplicationsPipeline`
**Alert chip:** Amber chip if any application has a pending action (e.g. "1 ansökan väntar på svar")
**Primary action:** "Lägg till ansökan" → opens `AddApplicationModal` inline or navigates to `/applications`
**Secondary action:** "Visa pipeline →"
**S mode:** count only + amber alert if pending
**M mode:** count + stacked bar + alert
**L mode:** count + bar + last 3 applications listed by status
**Data dependency:** `ApplicationsPipeline` component, `application.types` data

#### /spontanansökan — Spontanansökan
**Title:** Spontanansökan
**Default size:** S (1 col × 1 row)
**KPI:** Count of companies in pipeline (e.g. "5 företag")
**Secondary data:** Status breakdown: "2 kontaktade, 1 svar" if any
**Primary action:** "+ Lägg till företag" → `/spontanansökan`
**S mode:** pipeline count + add-link
**M mode:** pipeline count + top 2 company names with status pills
**Data dependency:** `MyCompaniesTab` data (Bolagsverket integration in `spontaneous/` tabs)

#### /linkedin-optimizer — LinkedIn
**Title:** LinkedIn
**Default size:** S (1 col × 1 row)
**KPI:** Profile completeness score (0–100, from `profileCompleteness` state in `LinkedInOptimizer.tsx`)
**Secondary data:** "Senaste förbättring: Rubrik" or empty state
**Primary action:** "Optimera profil" → `/linkedin-optimizer`
**S mode:** score ring (small, 48px) + action link
**M mode:** score + 3-item audit checklist (headline / about / post sections)
**Data dependency:** `profileCompleteness` state, `auditSections` from `LinkedInOptimizer.tsx`

#### /salary — Lön & förhandling
**Title:** Lön & marknad
**Default size:** M (2 col × 1 row)
**KPI:** Estimated market salary for the user's target role (e.g. "52 000 kr/mån")
**Secondary data:** Range bar — low/median/high — with a dot marker at the median; label "UX-designer, Stockholm"
**Primary action:** "Beräkna min lön" → `/salary`
**S mode:** just salary figure + role label
**M mode:** salary + range bar + role/region label
**Data dependency:** `SalaryCalculatorTab` — user enters role once; persist in user profile or localStorage

#### /international — Internationellt
**Title:** Internationellt
**Default size:** S (1 col × 1 row)
**KPI:** Count of saved countries/regions (or "Inga sparade" empty state)
**Secondary data:** List of country names if any saved
**Primary action:** "Utforska möjligheter →" → `/international`
**Empty state:** "Arbetar du mot utlandsjobb?" with explore link
**Data dependency:** `International.tsx` — appears to have saved countries feature (needs verification)

#### /cv — CV (also appears in Karriär hub, but primary is Söka Jobb)
**Title:** CV
**Default size:** L (2 col × 2 row)
**KPI:** Completion percentage (e.g. "75%") as a progress ring (88px diameter)
**Secondary data (ring-info):** "Senast redigerad: 2 dagar sedan" + 4-item section checklist: Personlig info (done/warn/empty), Erfarenhet, Utbildning, Färdigheter — status from `cvApi`
**Primary action:** "Fortsätt redigera" → `/cv`
**Secondary action:** "Förhandsgranska" → `/cv/preview` (MyCVs tab)
**S mode:** ring at small size (48px) + percentage text only
**M mode:** ring (64px) + last-edited timestamp only
**L mode:** full ring (88px) + section checklist
**Data dependency:** `cvApi` from `supabaseApi`, `useDashboardDataQuery` already returns `dashboardData.cv.progress` and `dashboardData.cv.hasCV`

#### /cover-letter — Personligt brev
**Title:** Personligt brev
**Default size:** M (2 col × 1 row)
**KPI:** Number of saved drafts (e.g. "3 utkast")
**Secondary data:** "Senast: [job title] hos [company] · igår" — from `CoverLetterMyLetters`
**Primary action:** "+ Generera nytt brev" → `/cover-letter`
**Secondary action:** "Visa alla →"
**S mode:** draft count only
**M mode:** count + last-edited label + generate action
**Data dependency:** `coverLetterApi` from `supabaseApi`, `dashboardData.coverLetters.count` already available

---

### Hub: Karriär (Coaching domain — rosa #FBEEEF)

#### /interview-simulator — Intervjuträning
**Title:** Intervjuträning
**Default size:** M (2 col × 1 row)
**KPI:** Last session score (e.g. "84 / 100")
**Secondary data:** "3 övningar denna vecka" + mini sparkline of score trend over last 5 sessions
**Primary action:** "Starta ny session" → `/interview-simulator`
**S mode:** last score only
**M mode:** score + "N övningar denna vecka" + sparkline + start action
**Data dependency:** `useAchievementTracker` hook in `InterviewSimulator.tsx`; session history needed in Supabase (currently stored locally — needs cloud persistence for widget)

#### /skills-gap-analysis — Kompetensanalys
**Title:** Kompetensanalys
**Default size:** M (2 col × 1 row)
**KPI:** Gap score as text: "3 av 8 kompetenser klara" or "Ingen analys gjord"
**Secondary data:** Target role name + date of last analysis
**Primary action:** "Analysera mot [roll]" → `/skills-gap-analysis`
**Secondary action:** "Uppdatera mål →"
**S mode:** gap fraction only
**M mode:** fraction + role name + analyze action
**Data dependency:** `skillsAnalysisApi` from `careerApi`, `favoriteOccupationsApi` for the target role name

#### /interest-guide — Intresseguide
**Title:** Intresseguide
**Default size:** S (1 col × 1 row) — can promote to M
**KPI:** RIASEC top code (e.g. "RIA") if test complete, or "Ej gjord"
**Secondary data:** Top 1 matched occupation name
**Primary action:** "Se mina yrken" → `/interest-guide/results` (if done) or "Gör testet" → `/interest-guide`
**S mode:** RIASEC code or "Gör testet" CTA
**M mode:** code + top 2 occupations + action
**Data dependency:** `useInterestProfile` hook, `interestApi` — result already surfaced in `useDashboardDataQuery`

#### /career — Karriärplan
**Title:** Karriärplan
**Default size:** M (2 col × 1 row)
**KPI:** Active milestone count (e.g. "2 aktiva mål") from `milestonesApi`
**Secondary data:** Next milestone: title + due date
**Primary action:** "Visa min plan" → `/career/plan`
**S mode:** active milestone count
**M mode:** count + next milestone title/date
**Data dependency:** `milestonesApi`, `careerPlanApi` from `careerApi`

#### /personal-brand — Personligt varumärke
**Title:** Personligt varumärke
**Default size:** S (1 col × 1 row)
**KPI:** Brand audit score (0–100) from `BrandAuditTab`
**Secondary data:** "Senast: Pitch uppdaterad" or empty
**Primary action:** "Gör varumärkesaudit" → `/personal-brand`
**S mode:** audit score (or "Ej gjord") + link
**M mode:** score + 3-item audit checklist (Headline / Portfolio / Synlighet)
**Data dependency:** `BrandAuditTab` — currently stores score in component state; needs cloud persistence for widget

#### /education — Utbildning
**Title:** Utbildning
**Default size:** S (1 col × 1 row)
**KPI:** Count of saved courses (or "Sök utbildningar" if none)
**Secondary data:** Top saved course name + provider
**Primary action:** "Sök utbildningar" → `/education`
**S mode:** saved count or empty-state CTA
**Data dependency:** `educationApi` — `useEducationSearch` hook; saved-to-profile feature may need building

#### /exercises — Övningar
**Title:** Övningar
**Default size:** S (1 col × 1 row)
**KPI:** "N av M övningar klara" (from `ExerciseProgress` stored in Supabase via `contentExerciseApi`)
**Secondary data:** Last completed exercise name
**Primary action:** "Fortsätt öva" → `/exercises`
**S mode:** completion fraction + CTA
**Data dependency:** `contentExerciseApi` from `contentApi`, `supabase` directly for progress

---

### Hub: Min Vardag (Wellbeing domain — lavendel #F2EDF8)

#### /wellness — Hälsa & wellness
**Title:** Hälsa
**Default size:** M (2 col × 1 row)
**KPI:** Today's energy/mood rating (1–5 scale) if logged, or "Logga ditt mående" empty state
**Secondary data:** 7-day mood sparkline (tiny, 5-point line) + streak count (e.g. "🔥 5 dagar")
**Primary action:** "Logga idag" → `/wellness` (HealthTab)
**S mode:** today's mood icon (or empty ring) only
**M mode:** mood icon + 7-day sparkline + streak
**L mode:** mood + sparkline + weekly average + "Akut stöd"-link (CrisisTab)
**Data dependency:** `HealthTab` data — mood entries stored in Supabase via wellness-related API; streak from `useDiaryStreaks` pattern

#### /diary — Dagbok
**Title:** Dagbok
**Default size:** M (2 col × 1 row)
**KPI:** Streak count (e.g. "12 dagars streak") from `useDiaryStreaks` hook
**Secondary data:** Last entry preview — first 60 chars of last journal entry + date
**Primary action:** "Skriv idag" → `/diary`
**S mode:** streak count (flame icon) + "Skriv idag" link
**M mode:** streak + last entry preview (truncated) + write action
**Empty state:** "Inga anteckningar ännu — börja din dagbok" with soft CTA
**Data dependency:** `useDiaryStreaks` from `hooks/useDiary`, journal entry API

#### /calendar — Kalender
**Title:** Kalender
**Default size:** M (2 col × 1 row)
**KPI:** Count of upcoming events (e.g. "3 kommande händelser")
**Secondary data:** Next 2 events — title + date/time — from `calendarApi.getEvents()`
**Primary action:** "+ Lägg till händelse" → `/calendar` with new-event modal
**Secondary action:** "Visa vecka →"
**S mode:** upcoming count + next event title only
**M mode:** count + next 2 events listed
**Data dependency:** `calendarApi` from `cloudStorage`, `CalendarEvent` type from `calendarData`

---

### Hub: Resurser (Info domain — sky #ECF4FA)

#### /knowledge-base — Kunskapsbank
**Title:** Kunskapsbank
**Default size:** M (2 col × 1 row)
**KPI:** Count of bookmarked articles (from `useBookmarks` hook)
**Secondary data:** Latest "För dig"-recommendation title from `ForYouTab`
**Primary action:** "Fortsätt läsa" → `/knowledge-base` (ForYouTab)
**Secondary action:** "Mina bokmärken →"
**S mode:** bookmark count only
**M mode:** count + latest recommendation title + action
**Data dependency:** `useBookmarks`, `useArticles` from `hooks/knowledge-base/useArticles`

#### /resources — Mina dokument
**Title:** Mina dokument
**Default size:** M (2 col × 1 row)
**KPI:** Total saved item count (saved jobs + bookmarks + CV + cover letters combined)
**Secondary data:** Document category breakdown: "2 CV, 3 brev, 5 sparade jobb"
**Primary action:** "Visa alla dokument" → `/resources`
**Secondary action:** "+ Lägg till"
**S mode:** total count only
**M mode:** count + category pills
**Data dependency:** `savedJobsApi`, `articleBookmarksApi` from `cloudStorage`; `cvApi`, `coverLetterApi`

#### /ai-team — AI-team
**Title:** AI-team
**Default size:** S (1 col × 1 row)
**KPI:** "Fråga din AI-coach" — no numeric KPI; this is a portal widget
**Secondary data:** Suggested agent based on user's current context (from `useSuggestedAgent` hook)
**Primary action:** "Chatta med [Agent]" → `/ai-team`
**S mode:** agent name + one-line prompt link
**M mode:** suggested agent card with description + quick-action buttons
**Data dependency:** `useSuggestedAgent` hook, `useAITeamStore`

#### /externa-resurser — Externa resurser
**Title:** Externa resurser
**Default size:** S (1 col × 1 row)
**KPI:** Count of bookmarked external links (if feature exists) or static label "Arbetsförmedlingen, CSN, ..."
**Primary action:** "Utforska resurser" → `/externa-resurser`
**S mode:** icon + link only (no real KPI)
**Data dependency:** `ExternalResources.tsx` — likely static/curated content; low data dependency

#### /print-resources — Utskriftsresurser
**Title:** Skriv ut
**Default size:** S (1 col × 1 row)
**KPI:** Static — "Checklistor & mallar"
**Primary action:** "Visa utskriftsmallar" → `/print-resources`
**Notes:** Low-data widget; exists primarily as a navigation shortcut; best kept at S

#### /nätverk — Nätverk
**Title:** Nätverk
**Default size:** S (1 col × 1 row)
**KPI:** Count of saved contacts
**Secondary data:** "Senast tillagd: [name]" if any
**Primary action:** "+ Lägg till kontakt" → `/nätverk`
**Data dependency:** `NetworkTab` from `career/NetworkTab` — contact storage in Supabase

---

### Hub: Översikt (cross-domain — neutral)

See Översikt composition section below.

---

### Pages outside hubs (system/admin — no widget needed)

- `/profile` — Full-page editing; profile completeness surfaces in Översikt widget only
- `/my-consultant` — Full-page; consultant widget in Översikt
- `/admin` — Admin-only, not in user hub
- `/consultant` — Consultant-only view
- `/settings`, `/terms`, `/privacy`, `/login`, `/register` — System pages, no widgets

---

## Översikt (Start Page) Widget Composition

**Purpose:** Orient the user immediately. Answer "what should I do right now?" for a first-time or returning user. Maximum 6 widgets. No scrolling required on desktop at 1280px.

**Vulnerable-user design constraint:** Keep it to one clear "next action" at a time. Do not show all hubs simultaneously. Progressive disclosure only.

### Recommended 6 Widgets — Default Layout

```
┌─────────────────────┬─────────────────────┐
│  Välkommen / Nästa  │  Snabbåtgärder       │  Row 1
│  steg (XL span 4)   │  (baked into XL)     │
├──────┬──────┬────────┴──────────────────────┤
│ CV   │ Jobb │  Ansökningar  │  Mående       │  Row 2
│  S   │  S   │     M         │   S           │
└──────┴──────┴───────────────┴───────────────┘
        + Konsulent-banner if linked (conditional)
```

#### Widget 1: Nästa steg / Onboarding (XL — span 4)
**When:** Onboarding incomplete (fewer than 5/5 steps done)
**Content:** Single focused CTA — "Nästa steg: Skapa ditt CV" with progress bar "2 av 5 klart"
**Design:** Solid `--c-solid` background (action mint), white text — same pattern as current Dashboard's next-step banner
**Action:** Navigates to the next uncompleted onboarding step
**Replaces with:** "Fortsätt där du slutade" when onboarding complete — shows last-visited tool + last-edited timestamp
**Data dependency:** `useDashboardDataQuery` + `useAuthStore` + `useInterestProfile` (existing Dashboard logic, can be extracted)

#### Widget 2: CV (S)
**Content:** Progress ring at completion% + "Senast redigerad N dagar sedan"
**Action:** "Redigera" → `/cv`
**Domain tint:** Coaching (rosa)
**Data:** `dashboardData.cv.progress`

#### Widget 3: Sparade jobb (S)
**Content:** Count of saved jobs + "N nya idag" if any
**Action:** "Sök" → `/job-search`
**Domain tint:** Activity (persika)
**Data:** `dashboardData.jobs.savedCount`

#### Widget 4: Ansökningar (M — span 2)
**Content:** Stacked status bar (Aktiva / Svar / Intervju / Avslutade) + pending-action amber alert
**Action:** "Visa pipeline" → `/applications`
**Domain tint:** Activity (persika)
**Data:** `dashboardData.applications.total` + status breakdown

#### Widget 5: Mående idag (S)
**Content:** Today's mood icon (if logged) or soft "Hur mår du?" prompt — no pressure framing
**Action:** Inline 1–5 quick-rate OR "Logga" → `/wellness`
**Domain tint:** Wellbeing (lavendel)
**Note:** Must be framed as optional — "Om du vill" language. Never "Du har inte loggat idag!"

#### Widget 6: Min konsulent (S — conditional)
**Shown:** Only when user has a linked consultant (`consultant` row exists in Supabase)
**Content:** Consultant name + avatar initial + next meeting date if set
**Action:** "Kontakta" → `/my-consultant`
**Domain tint:** Action (mint)
**Data:** `MyConsultant.tsx` — fetched from Supabase `consultant` relation

**If no consultant linked:** replace with AI-team shortcut widget ("Fråga din AI-coach")

---

## Table Stakes (Phase 1–2 Must-Have)

Features users expect from any dashboard/hub navigation system. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Static widget layout per hub | Users expect hub pages to show relevant tools, not a blank page | LOW | Hub routing structure |
| Real data in widgets (not placeholder) | Widgets with "—" or "Inga data" everywhere feel broken on day 1 | MEDIUM | Each widget's data hook/API |
| CV widget with completion ring | CV is the #1 action for any job-seeker; completion % is universally expected | LOW | `cvApi`, existing `dashboardData.cv.progress` |
| Applications pipeline widget | Kanban/pipeline tracking is expected in any job-seeker tool | MEDIUM | `ApplicationsPipeline`, `application.types` |
| Job matches widget | Users expect "what jobs match me today" on their hub | MEDIUM | `MatchesTab`, `arbetsformedlingenApi`, saved searches |
| Onboarding/next-step widget on Översikt | First-time users need orientation; returning users need continuity | LOW | Existing `ONBOARDING_STEPS` + `useDashboardDataQuery` |
| Domain-colored widgets | Visual language should map to DESIGN.md's 5 domains — users orient by color | LOW | CSS tokens already in `tokens.css` |
| Responsive layout (2-col on mobile) | 60%+ of users likely on mobile; broken layout = abandoned product | MEDIUM | CSS grid with breakpoint fallbacks (shown in nav-hub-sketch.html) |
| Empty states per widget | Every widget must handle zero-data gracefully, not show blank | LOW | Per-widget empty state component |
| Widget navigation (click → full page) | Widgets are entry points, not endpoints | LOW | React Router links in widget footers |

---

## Differentiators (Phase 3–4)

Features that elevate the system above standard dashboards. Not expected, but meaningfully improve the experience.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Persist widget layout per user in Supabase | User's resized/reordered widgets survive page refresh and device switches | MEDIUM | Needs `user_widget_layouts` table; `react-grid-layout` for drag/resize |
| Resize widget on hover (S/M/L toggle) | Power users customize density without leaving the hub | MEDIUM | Shown in nav-hub-sketch.html; needs layout save |
| "Continue where you left off" on Översikt | Reduces re-orientation time for returning users (critical for NPF/exhaustion users) | LOW | Track `last_visited_tool` + timestamp in user row or localStorage |
| Mood check-in inline in Mående widget | Logging wellness without navigating away reduces friction for low-energy users | MEDIUM | Needs inline form state; updates `HealthTab` data |
| Smart widget suggestion | Översikt surfaces "you haven't updated your CV in 2 weeks" or "3 new matches" contextually | HIGH | Requires rules engine or AI; Phase 4 |
| Accessibility: keyboard-navigable widget grid | Tab order through widgets makes hub usable without mouse | MEDIUM | WCAG 2.1 AA — focus management in grid |
| Drag-and-drop widget reorder | Users can put most-used widgets first | HIGH | `react-grid-layout` or `dnd-kit`; needs Supabase persistence |
| Add widget from catalogue | Users can bring in widgets from other hubs | HIGH | Widget registry pattern; Phase 4 |
| Hide a widget | Users can collapse widgets they don't use (e.g. International if not relevant) | LOW | Toggle visibility flag in layout persistence layer |
| Cross-hub summary row on Översikt | Row of mini S-widgets from each hub — single glance at all 4 activity areas | MEDIUM | Requires data from all 4 hubs on one load |

---

## Anti-Features (Out of Scope with Reasoning)

These are explicitly NOT to be built. The user base is vulnerable (NPF, exhaustion, long-term unemployment). Design for low cognitive load.

| Feature | Why It Seems Appealing | Why It Harms This User Base | What to Do Instead |
|---------|------------------------|-----------------------------|--------------------|
| Notification dots / badges on every widget | Feels "active" and "helpful" | Creates anxiety, pressure, guilt for low-energy users who don't act on them immediately | Only show amber alert for time-sensitive items (e.g. "application deadline today") with explicit label, never a dot |
| Gamification (points, levels, leaderboards) | Keeps users "engaged" | Job-seeking is already stressful; turning it into a game trivializes the user's situation and creates competitive stress | Streak counter in Dagbok is acceptable because it's private, optional, and celebrates consistency — not competition |
| Progress percentage as guilt trigger | Shows users "you're only 40% done" | NPF users fixate on incompleteness; can cause shame spirals | Frame as "Nästa steg" (positive next action) rather than "X% complete" — see current Dashboard pattern |
| Dense data visualizations | More data feels more "professional" | Cognitive overload for NPF, exhaustion, or low-literacy users | One KPI per widget; secondary data only in M/L. No multi-axis charts, no heatmaps |
| Auto-playing content or animations | Feels "alive" | Distraction for NPF users; prefers-reduced-motion must be respected | Static widgets; motion only on user-triggered transitions (150ms max) |
| Mandatory wellness logging | Feels supportive | Creates guilt and avoidance if users skip days | Wellness widget always uses "Om du vill" framing; no streak-breaking warnings |
| Comparison to other users | "Others have applied to 8 jobs this week" | Deeply harmful for long-term unemployed; implies personal failure | All metrics are personal-only; no benchmarks against other users |
| Notification emails about widget activity | Keeps users "engaged" | Users in vulnerable situations may find job-related emails triggering outside of active sessions | No outbound notification system at this stage |
| Infinite scroll of job matches in hub widget | Shows more content | Overwhelms users; hub widgets are summaries, not full pages | Cap at 3 items; "Visa alla →" for more |
| "Overdue" labels on goals or applications | Urgency framing | Creates stress and shame for users already struggling | Use neutral "Ingen aktivitet" or time-elapsed labels ("Senast uppdaterad: 3 veckor sedan") |
| Dark patterns (e.g. "complete your profile to unlock") | Drive engagement metrics | Exploits anxiety; damages trust with vulnerable users | Progress is always visible; no gating |

---

## Feature Dependencies

```
[Hub routing structure]
    └──requires──> [React Router hub paths] (already exists in App.tsx)
    └──requires──> [Hub layout component] (new: HubLayout.tsx)

[Per-hub widget grid]
    └──requires──> [Widget component system] (new: Widget.tsx + per-widget components)
    └──requires──> [Hub routing structure]

[Real data in widgets]
    └──requires──> [Existing page data hooks] (mostly already exist)
    └──requires──> [Widget component system]

[Resize widget S/M/L]
    └──requires──> [Widget component system]
    └──enhances──> [Persist layout in Supabase]

[Persist layout in Supabase]
    └──requires──> [user_widget_layouts DB table] (new migration)
    └──requires──> [Widget component system]

[Drag-and-drop reorder]
    └──requires──> [react-grid-layout or dnd-kit] (new dependency)
    └──requires──> [Persist layout in Supabase]

[Översikt onboarding widget]
    └──requires──> [useDashboardDataQuery] (already exists)
    └──enhances──> [Persist layout in Supabase]

[Mood check-in inline]
    └──requires──> [Wellness page data API] (HealthTab data)

[Interview simulator sparkline]
    └──requires──> [Session history in Supabase] (currently local state only — needs migration)

[Smart widget suggestion]
    └──requires──> [All widget data hooks]
    └──requires──> [Rules engine or AI backend call]
```

### Dependency Notes

- **Widget component system requires Hub routing structure:** You cannot render widgets without knowing which hub is active. Build hub routes first.
- **Real data requires existing hooks:** Most data hooks already exist (`useDashboardDataQuery`, `useDiaryStreaks`, `calendarApi`, `cvApi`, etc.). The widget layer consumes them — it does not replace them.
- **Interview simulator widget requires cloud session history:** `InterviewSimulator.tsx` uses `useAchievementTracker` but session scores appear to live in component state. A sparkline widget needs persistent history. This is a blocker for the M/L size interview widget.
- **Personal brand audit widget requires cloud persistence:** `BrandAuditTab` score is component state only. Needs a Supabase column or table entry.
- **Drag-and-drop conflicts with keyboard navigation:** `react-grid-layout` has known WCAG issues. If drag is added, it must be paired with an accessible alternative (keyboard reorder).

---

## MVP Definition

### Phase 1 — Static Hubs with Real Data (v1.0)

Minimum: replace current sidebar navigation with 5 hub pages, each showing a static (non-resizable) widget grid with real data.

- [ ] Hub routing structure — 5 routes: `/`, `/job-search-hub`, `/career-hub`, `/resources-hub`, `/vardagen-hub`
- [ ] HubLayout component — uniform hero header + section grid
- [ ] Widget base component — supports S/M/L size prop, renders different content per size
- [ ] CV widget (L default) — ring + checklist + "Fortsätt redigera"
- [ ] Applications widget (M) — stacked bar + alert chip
- [ ] Job matches widget (L) — today's count + top 3 matches
- [ ] Översikt page — next-step XL widget + 5 S/M widgets from cross-hub summary
- [ ] All widgets use real data from existing hooks (no mocks)
- [ ] Empty states for all widgets (user has no data yet)
- [ ] Mobile 2-col layout

### Phase 2 — Size Toggle + Layout Persistence (v1.1)

- [ ] S/M/L size toggle on hover (opacity-0 → 1 on hover, per nav-hub-sketch.html)
- [ ] `user_widget_layouts` Supabase table + migration
- [ ] Save/load layout per user per hub
- [ ] Hide widget option (visibility flag in layout)

### Phase 3–4 — Drag/Reorder + Smart Suggestions (v2+)

- [ ] `react-grid-layout` or `dnd-kit` for drag-and-drop
- [ ] Accessible keyboard reorder alternative
- [ ] Add widget from catalogue
- [ ] Smart contextual suggestions on Översikt
- [ ] Inline mood check-in in Mående widget

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Hub routing (5 hubs) | HIGH | LOW | P1 |
| Static widget grid per hub | HIGH | MEDIUM | P1 |
| CV widget with ring + checklist | HIGH | LOW | P1 |
| Applications stacked-bar widget | HIGH | LOW | P1 |
| Job matches widget (top 3) | HIGH | MEDIUM | P1 |
| Översikt onboarding/next-step widget | HIGH | LOW | P1 |
| Mobile 2-col layout | HIGH | LOW | P1 |
| Empty states per widget | HIGH | LOW | P1 |
| S/M/L size toggle on hover | MEDIUM | LOW | P2 |
| Layout persistence in Supabase | MEDIUM | MEDIUM | P2 |
| Hide widget | MEDIUM | LOW | P2 |
| Mood widget inline check-in | MEDIUM | MEDIUM | P2 |
| Interview session history (cloud) | MEDIUM | MEDIUM | P2 |
| Consultant widget (conditional) | MEDIUM | LOW | P2 |
| Drag-and-drop reorder | LOW | HIGH | P3 |
| Add widget from catalogue | LOW | HIGH | P3 |
| Smart widget suggestions | LOW | HIGH | P3 |

---

## Sources

- Direct codebase inspection: `client/src/pages/` (27 pages), `navigation.ts`, `Dashboard.tsx`
- Prototype: `nav-hub-sketch.html` — Söka Jobb hub with S/M/L toggle pattern
- Design system: `docs/DESIGN.md` — 5 semantic domains, pastell rules, motion constraints
- Existing data hooks: `useDashboardDataQuery`, `useDiaryStreaks`, `calendarApi`, `cvApi`, `skillsAnalysisApi`, `milestonesApi`
- Vulnerable-user design rationale: `PROJECT.md` context, DESIGN.md ("Headspace not Linear")

---

*Feature research for: Hub navigation + widget system milestone (v1.0)*
*Researched: 2026-04-28*
