# Phase 5 — Live DB Discovery

**Run:** 2026-04-29T00:16:00Z
**Project:** linked Supabase project (deltagarportalen)
**Purpose:** Source of truth for Plan 02-05 hub-loader SELECT queries. Plans 02-05 do NOT re-run discovery — they consume this file.

---

## profiles

> **Pre-migration state** (Task 1 discovery): `career_goals` present, `linkedin_url` ABSENT, `onboarded_hubs` ABSENT.
> **Post-migration state** (Task 2 applied): `onboarded_hubs` ADDED, `linkedin_url` ADDED (both migrations applied).

| column | type | default | status |
|--------|------|---------|--------|
| career_goals | jsonb | `'{}'::jsonb` | PRESENT (pre-existing) |
| linkedin_url | text | null | ADDED in Task 2 (was absent) |
| onboarded_hubs | ARRAY (text[]) | `'{}'::text[]` | ADDED in Task 2 (was absent) |

**Key finding:** `profiles.career_goals` is already a JSONB column. The Karriär hub's "Karriärmål" widget reads from `profiles.career_goals` — no separate `career_goals` table migration needed. Career goal data is stored as JSONB on the profile row.

**Note on career tables:** The DB also has `career_plans`, `career_milestones`, `career_paths` — see Career tables section below. However the primary carrier for the widget is `profiles.career_goals` JSONB (simpler, already existing).

---

## skills_analyses

| column | type |
|--------|------|
| id | uuid |
| user_id | uuid |
| dream_job | text |
| cv_text | text |
| match_percentage | integer |
| analysis_result | jsonb |
| skills_comparison | jsonb |
| recommended_courses | jsonb |
| action_plan | jsonb |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

**Hub-loader SELECT:** `id, dream_job, match_percentage, skills_comparison, created_at` ordered by `created_at DESC LIMIT 1`
**Anti-shaming note:** `match_percentage` is an integer column. The Kompetensgap widget MUST NOT display it raw — use milestone-framing per UI-SPEC.

---

## personal_brand_audits

| column | type |
|--------|------|
| id | uuid |
| user_id | uuid |
| score | numeric |
| dimensions | jsonb |
| summary | text |
| created_at | timestamp with time zone |

**Hub-loader SELECT:** `id, score, dimensions, summary, created_at` ordered by `created_at DESC LIMIT 1`

---

## network_contacts

| column | type |
|--------|------|
| id | uuid |
| user_id | uuid |
| name | text |
| company | text |
| role | text |
| email | text |
| linkedin_url | text |
| relationship | text |
| last_contact_date | date |
| next_contact_date | date |
| notes | text |
| status | text |
| tags | ARRAY |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

**Hub-loader SELECT:** `count(*)` for contact count. Optional: `name, company` for most recently updated contact.

---

## diary_entries

| column | type |
|--------|------|
| id | uuid |
| user_id | uuid |
| title | text |
| content | text |
| mood | integer |
| energy_level | integer |
| tags | ARRAY |
| word_count | integer |
| entry_date | date |
| entry_type | text |
| is_favorite | boolean |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

**Hub-loader SELECT:** `count(*)` for entry count + `title, entry_date, created_at` ordered by `entry_date DESC LIMIT 1` for latest entry.

---

## mood_logs

| column | type |
|--------|------|
| id | uuid |
| user_id | uuid |
| log_date | date |
| mood_level | integer |
| energy_level | integer |
| stress_level | integer |
| sleep_quality | integer |
| activities | ARRAY |
| note | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

**Hub-loader SELECT:** `log_date, energy_level, mood_level` ordered by `log_date DESC LIMIT 7` for 7-day sparkline.

---

## calendar_events

| column | type |
|--------|------|
| id | uuid |
| user_id | uuid |
| title | text |
| description | text |
| date | date |
| time | time without time zone |
| type | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| end_time | time without time zone |
| location | text |
| is_video | boolean |
| is_phone | boolean |
| with_person | text |
| job_id | text |
| job_application_id | text |
| tasks | jsonb |
| travel | jsonb |
| interview_prep | jsonb |
| is_recurring | boolean |
| recurring_config | jsonb |
| parent_event_id | uuid |
| reminders | jsonb |
| shared_with | ARRAY |
| is_shared | boolean |

**Hub-loader SELECT:** `id, title, date, time, type, with_person, is_video, is_phone` WHERE `date >= CURRENT_DATE` ordered by `date ASC, time ASC LIMIT 3` for upcoming events.

---

## consultant_participants

| column | type |
|--------|------|
| id | uuid |
| consultant_id | uuid |
| participant_id | uuid |
| assigned_at | timestamp with time zone |
| assigned_by | uuid |
| notes | text |
| priority | integer |
| last_contact_at | timestamp with time zone |
| next_meeting_scheduled | timestamp with time zone |

**CRITICAL — column name disambiguation:** The column is `participant_id` (NOT `user_id`). Min Vardag hub-loader must filter with `.eq('participant_id', userId)` NOT `.eq('user_id', userId)`.

**Hub-loader SELECT:** `consultant_id, next_meeting_scheduled, last_contact_at` WHERE `participant_id = auth.uid()` LIMIT 1.

---

## ai_team_sessions

| column | type |
|--------|------|
| id | uuid |
| user_id | uuid |
| agent_id | text |
| messages | jsonb |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

**Hub-loader SELECT:** `agent_id, updated_at` ordered by `updated_at DESC LIMIT 3` for "recent AI tool usage". Resurser hub uses `count(*)` for total session count.

---

## article_reading_progress

| column | type |
|--------|------|
| id | uuid |
| user_id | uuid |
| article_id | text |
| progress_percent | integer |
| is_completed | boolean |
| completed_at | timestamp with time zone |
| paused_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| article_uuid | uuid |

**Hub-loader SELECT:** `article_id, progress_percent, is_completed, updated_at` ordered by `updated_at DESC LIMIT 1` for most recently read article.

---

## Exercises tables (query 11)

Five exercise-related tables exist in the public schema:

| table | purpose |
|-------|---------|
| exercises | Content table: slug, title, description, icon, category_id, category_name, duration, difficulty, is_active, sort_order |
| exercise_categories | Category definitions |
| exercise_questions | Questions within exercises |
| exercise_steps | Step-by-step instructions |
| exercise_answers | User answers to exercise questions |

**No user_exercise_progress / exercise_progress table found.** The `exercise_answers` table is the closest to progress tracking (user's answers to questions), but it is not a completion-tracking table.

**Conclusion for Resurser hub Övningar widget:** Read from `exercise_answers` WHERE `user_id = auth.uid()` to get count of exercises attempted. Alternatively, treat the widget as primarily static-content (links to exercises) — this is safer per RESEARCH.md Pitfall G. Hub-loader can query `exercise_answers` count to show "X övningar genomförda" as a summary.

---

## Career tables (query 12)

Eight career/goal-related tables exist:

| table |
|-------|
| calendar_goals |
| career_milestones |
| career_paths |
| career_plans |
| consultant_goal_templates |
| consultant_goals |
| user_goals |
| weekly_goals |

**`career_plans` schema (verified):**

| column | type |
|--------|------|
| id | uuid |
| user_id | uuid |
| current_situation | text |
| goal | text |
| timeframe | text |
| is_active | boolean |
| total_progress | integer |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |

**Karriär hub Karriärmål widget decision:** Use `profiles.career_goals` JSONB (already present, per-row) as the primary data source for the widget summary. The `career_plans` table exists but is more complex (separate rows with milestones). For the hub widget summary, `profiles.career_goals` JSONB provides a simpler entry point — Plan 02 hub-loader reads from profiles.

---

## Plan-loader implications

### Karriär hub-loader (Plan 02)

Reads three tables in `Promise.all`:

1. **Karriärmål:** `profiles` — `SELECT career_goals FROM profiles WHERE id = auth.uid()` (JSONB)
2. **Kompetensgap:** `skills_analyses` — `SELECT id, dream_job, match_percentage, skills_comparison, created_at FROM skills_analyses WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1`
3. **Personligt varumärke:** `personal_brand_audits` — `SELECT id, score, dimensions, summary, created_at FROM personal_brand_audits WHERE user_id = auth.uid() ORDER BY created_at DESC LIMIT 1`
4. **LinkedIn:** `profiles` — `SELECT linkedin_url FROM profiles WHERE id = auth.uid()` (same row as #1, merge into single profiles query)
5. **Intresseguide:** consumed via `useInterestProfile` hook (existing, no additional query)
6. **Utbildning:** consumed via `useEducationSearch` hook (existing, no additional query)

**Combined profiles SELECT:** `SELECT career_goals, linkedin_url FROM profiles WHERE id = auth.uid()` (one query, covers 1 + 4).

### Resurser hub-loader (Plan 03)

1. **Mina dokument:** consumed via `useDocuments` hook (existing — CV + cover letters)
2. **Kunskapsbank:** `article_reading_progress` — `SELECT article_id, progress_percent, is_completed, updated_at FROM article_reading_progress WHERE user_id = auth.uid() ORDER BY updated_at DESC LIMIT 1`
3. **AI-team:** `ai_team_sessions` — `SELECT agent_id, updated_at FROM ai_team_sessions WHERE user_id = auth.uid() ORDER BY updated_at DESC LIMIT 3`
4. **Övningar:** `exercise_answers` — `SELECT count(*) FROM exercise_answers WHERE user_id = auth.uid()` (no completion table — count answers)
5. **Externa resurser:** static content widget — no DB query
6. **Utskriftsmaterial:** static content widget — no DB query

### Min Vardag hub-loader (Plan 04)

1. **Hälsa/Energi:** `mood_logs` — `SELECT log_date, energy_level, mood_level FROM mood_logs WHERE user_id = auth.uid() ORDER BY log_date DESC LIMIT 7` (7-day sparkline)
2. **Dagbok:** `diary_entries` — `SELECT count(*), max(entry_date) FROM diary_entries WHERE user_id = auth.uid()` + `SELECT title, entry_date FROM diary_entries WHERE user_id = auth.uid() ORDER BY entry_date DESC LIMIT 1`
3. **Kalender:** `calendar_events` — `SELECT id, title, date, time, type, with_person FROM calendar_events WHERE user_id = auth.uid() AND date >= CURRENT_DATE ORDER BY date ASC, time ASC LIMIT 3`
4. **Nätverk:** `network_contacts` — `SELECT count(*) FROM network_contacts WHERE user_id = auth.uid()`
5. **Min konsulent:** `consultant_participants` — `SELECT consultant_id, next_meeting_scheduled, last_contact_at FROM consultant_participants WHERE participant_id = auth.uid() LIMIT 1` (**`participant_id` — NOT `user_id`**)

### Översikt hub-loader (Plan 05)

1. **Onboarding detection:** `profiles` — `SELECT onboarded_hubs FROM profiles WHERE id = auth.uid()` (TEXT[] column added in Task 2)
2. **Cross-hub summary:** Consumes React Query cache keys populated by the four other hub-loaders — no additional direct DB queries. Requires that the other four hubs have been mounted at least once in the session to populate cache.
3. **No linkedin_url migration needed separately** — confirmed added by Task 2 onboarded_hubs migration (two separate migration files).
