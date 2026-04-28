---
phase: 03-data-wiring-wcag
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/phases/03-data-wiring-wcag/03-DB-PERFORMANCE.md
  - supabase/migrations/20260429_interview_score.sql
  - supabase/migrations/20260429_personal_brand_audits.sql
  - .planning/REQUIREMENTS.md
autonomous: false
requirements: [DATA-01, DATA-02, HUB-02, HUB-03, HUB-04, HUB-01]
must_haves:
  truths:
    - "EXPLAIN ANALYZE results documented for the 5 hub-summary Supabase queries with timing per query and a cumulative-latency verdict"
    - "interview_sessions has a nullable score NUMERIC(4,1) column and a nullable score_breakdown JSONB column on the live database"
    - "personal_brand_audits table exists on the live database with 4 RLS policies on auth.uid() = user_id"
    - "REQUIREMENTS.md Traceability table maps HUB-02, HUB-03, HUB-04 to Phase 5 (no longer Phase 3)"
    - "Both migration files exist in supabase/migrations/ with 20260429 datestamp prefix and ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS guards"
  artifacts:
    - path: ".planning/phases/03-data-wiring-wcag/03-DB-PERFORMANCE.md"
      provides: "EXPLAIN ANALYZE results + Pitfall 3/18 verdict"
      min_lines: 40
    - path: "supabase/migrations/20260429_interview_score.sql"
      provides: "DATA-01 schema migration (additive)"
      contains: "ADD COLUMN IF NOT EXISTS score NUMERIC(4,1)"
    - path: "supabase/migrations/20260429_personal_brand_audits.sql"
      provides: "DATA-02 schema migration (new append-only table)"
      contains: "CREATE TABLE IF NOT EXISTS personal_brand_audits"
    - path: ".planning/REQUIREMENTS.md"
      provides: "Traceability remap of HUB-02..04 to Phase 5"
      contains: "HUB-02 | Phase 5"
  key_links:
    - from: "supabase/migrations/20260429_interview_score.sql"
      to: "interview_sessions table"
      via: "ALTER TABLE ADD COLUMN"
      pattern: "ALTER TABLE interview_sessions"
    - from: "supabase/migrations/20260429_personal_brand_audits.sql"
      to: "auth.users(id)"
      via: "FOREIGN KEY ON DELETE CASCADE"
      pattern: "REFERENCES auth.users\\(id\\) ON DELETE CASCADE"
---

<objective>
Unblock Phase 3 by (a) profiling hub-summary query performance against live RLS so the loader design has a measured cumulative-latency verdict (Pitfall 3 + 18 from STATE.md blockers), (b) authoring two strictly additive Supabase migrations for DATA-01 (interview_sessions.score) and DATA-02 (new personal_brand_audits table), (c) applying both migrations manually via `npx supabase db query --linked -f` per CLAUDE.md (NEVER `db push`), and (d) closing the HUB-02/03/04 traceability gap by documenting the Phase 3 -> Phase 5 scope remap in REQUIREMENTS.md.

Purpose: Plan 02 (hub-summary loader) cannot be designed before performance is measured. Plans 03–05 (widget data wiring + persistence) cannot run before the score columns and audits table exist. This plan is the foundation gate for the entire phase.

Output: 03-DB-PERFORMANCE.md report with EXPLAIN ANALYZE results, two committed migration SQL files, both migrations applied to live Supabase, and an updated REQUIREMENTS.md traceability table.
</objective>

<execution_context>
@C:/Users/Mikael/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Mikael/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/phases/03-data-wiring-wcag/03-CONTEXT.md
@.planning/phases/03-data-wiring-wcag/03-RESEARCH.md
@.planning/research/PITFALLS.md
@CLAUDE.md
@supabase/migrations/20260227130000_add_new_features.sql
@supabase/migrations/20260322183304_personal_brand_tables.sql

<interfaces>
<!-- Existing interview_sessions schema (verified from migration 20260227130000) -->
<!-- Columns: id UUID, mock_interview_id, user_id UUID, start_time, end_time, answers JSONB, completed BOOLEAN, created_at, updated_at -->
<!-- RLS: 4 policies (select/insert/update/delete) on auth.uid() = user_id — UNCHANGED by this plan -->

<!-- Existing personal_brand_audit (singular, upsert) — DO NOT TOUCH -->
<!-- This existing table from 20260322183304 keeps its current upsert behavior for BrandAuditTab.tsx -->
<!-- The new personal_brand_audits (plural, append-only) is a SEPARATE table — see Pitfall C in 03-RESEARCH.md -->

<!-- CLAUDE.md migration rule (LOCKED) -->
<!-- DO NOT use `npx supabase db push` — it tries to run all migrations and fails on conflicts -->
<!-- Use: `npx supabase db query --linked -f supabase/migrations/{filename}.sql` to apply a single migration -->
<!-- Verify: `npx supabase db query --linked "SELECT ..." --output table` -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Run EXPLAIN ANALYZE on the 5 hub-summary queries and write 03-DB-PERFORMANCE.md</name>
  <files>.planning/phases/03-data-wiring-wcag/03-DB-PERFORMANCE.md</files>
  <read_first>
    - .planning/phases/03-data-wiring-wcag/03-RESEARCH.md (sections "Pattern 1: Hub-Level Summary Loader" and "Pitfall A: N+1 Supabase Waterfall")
    - .planning/research/PITFALLS.md (Pitfalls 3 and 18 verbatim)
    - CLAUDE.md ("Supabase-migrationer" section — confirms `db query --linked` is the correct CLI)
    - supabase/migrations/20260227130000_add_new_features.sql (interview_sessions schema and RLS policies)
    - supabase/migrations/20260408150000_spontaneous_companies.sql (verify spontaneous_companies table exists)
  </read_first>
  <action>
    Execute exactly these 5 EXPLAIN ANALYZE statements against the linked remote database using `npx supabase db query --linked` (one statement per CLI call). Capture the full output of each — the goal is to record actual query timings for the queries that the hub-summary loader will issue in Plan 02.

    **The 5 queries to profile** (these are the Promise.all members for `useJobsokHubSummary`):

    1. CV summary:
       ```sql
       EXPLAIN ANALYZE SELECT id, updated_at FROM cvs WHERE user_id = (SELECT id FROM auth.users LIMIT 1);
       ```

    2. Cover letters (latest 3):
       ```sql
       EXPLAIN ANALYZE SELECT id, title, created_at FROM cover_letters WHERE user_id = (SELECT id FROM auth.users LIMIT 1) ORDER BY created_at DESC LIMIT 3;
       ```

    3. Interview sessions (latest 8 completed):
       ```sql
       EXPLAIN ANALYZE SELECT id, created_at, completed FROM interview_sessions WHERE user_id = (SELECT id FROM auth.users LIMIT 1) AND completed = true ORDER BY created_at DESC LIMIT 8;
       ```

    4. Job applications (all for stats):
       ```sql
       EXPLAIN ANALYZE SELECT status FROM job_applications WHERE user_id = (SELECT id FROM auth.users LIMIT 1);
       ```

    5. Spontaneous companies (count):
       ```sql
       EXPLAIN ANALYZE SELECT id FROM spontaneous_companies WHERE user_id = (SELECT id FROM auth.users LIMIT 1);
       ```

    **Run each query like this** (one CLI call per query — the CLAUDE.md rule):
    ```bash
    npx supabase db query --linked "EXPLAIN ANALYZE SELECT id, updated_at FROM cvs WHERE user_id = (SELECT id FROM auth.users LIMIT 1);"
    ```

    Also verify whether the optional tables `salary_data` and `international_targets` exist (research flagged them as LOW confidence):
    ```bash
    npx supabase db query --linked "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('salary_data','international_targets');" --output table
    ```

    Then write `.planning/phases/03-data-wiring-wcag/03-DB-PERFORMANCE.md` with this exact structure:

    ```markdown
    # Phase 3 — DB Performance Audit (Pitfalls 3 and 18 closure)

    **Date:** {YYYY-MM-DD}
    **Tool:** `npx supabase db query --linked`
    **Test user:** `(SELECT id FROM auth.users LIMIT 1)` — first user in DB (proxy for live RLS evaluation cost)

    ## Per-Query Timing

    | # | Query | Tables | Planning time | Execution time | Verdict |
    |---|-------|--------|---------------|----------------|---------|
    | 1 | CV summary | cvs | {x.xx ms} | {y.yy ms} | OK / SLOW |
    | 2 | Cover letters latest 3 | cover_letters | ... | ... | ... |
    | 3 | Interview sessions latest 8 | interview_sessions | ... | ... | ... |
    | 4 | Job applications all | job_applications | ... | ... | ... |
    | 5 | Spontaneous companies | spontaneous_companies | ... | ... | ... |

    **Cumulative execution time (sum of per-query Execution time): {Z.ZZ ms}**

    ## Optional-Table Existence Check

    | Table | Exists? | Notes |
    |-------|---------|-------|
    | salary_data | YES/NO | {if NO: SalaryWidget stays in mock/empty mode in Phase 3, full wire deferred to Phase 5} |
    | international_targets | YES/NO | {InternationalWidget stays in empty-state mode regardless} |

    ## Verdict

    **Threshold:** 50ms cumulative across the 5 queries (per 03-RESEARCH.md Pattern 1).

    **Result:** PASS (cumulative < 50ms) / FAIL (cumulative >= 50ms — recommend RPC migration in v1.1)

    ## Pitfall 3 / Pitfall 18 closure

    - Pitfall 3 (N+1 waterfall): {addressed by hub-summary Promise.all in Plan 02 / OR escalate to RPC if cumulative > 50ms}
    - Pitfall 18 (RLS overhead): {confirmed acceptable / OR documented for v1.1 hub-summary RPC}

    ## Raw EXPLAIN ANALYZE Output

    ### Query 1 — cvs
    ```
    {full EXPLAIN ANALYZE output captured from CLI}
    ```

    ### Query 2 — cover_letters
    ```
    {full EXPLAIN ANALYZE output}
    ```

    {repeat for all 5 queries}
    ```

    Fill the table with the actual numbers from the CLI output. Do not estimate or fabricate.

    If any query returns an error (table missing, RLS-blocked from CLI auth context, etc.), record the error verbatim in the corresponding "Raw" section and mark the verdict as "ERROR — see raw output". This is data, not failure.
  </action>
  <verify>
    <automated>test -f .planning/phases/03-data-wiring-wcag/03-DB-PERFORMANCE.md && grep -q "Cumulative execution time" .planning/phases/03-data-wiring-wcag/03-DB-PERFORMANCE.md && grep -q "Pitfall 3 / Pitfall 18 closure" .planning/phases/03-data-wiring-wcag/03-DB-PERFORMANCE.md</automated>
  </verify>
  <acceptance_criteria>
    - File `.planning/phases/03-data-wiring-wcag/03-DB-PERFORMANCE.md` exists
    - File contains literal string "## Per-Query Timing"
    - File contains literal string "## Verdict"
    - File contains literal string "Cumulative execution time"
    - File references all 5 table names: `cvs`, `cover_letters`, `interview_sessions`, `job_applications`, `spontaneous_companies`
    - File contains optional-table check rows for `salary_data` and `international_targets`
    - File contains 5 raw EXPLAIN ANALYZE outputs (one per query) — verifiable by `grep -c "EXPLAIN ANALYZE\|Planning Time\|Execution Time" 03-DB-PERFORMANCE.md` returning at least 5
    - Verdict line states either "PASS" or "FAIL" with cumulative number stated
  </acceptance_criteria>
  <done>
    Pitfalls 3 and 18 are closed: hub-summary cumulative latency is measured against live RLS. Plan 02 can now design the loader with a verdict instead of a guess.
  </done>
</task>

<task type="auto">
  <name>Task 2: Author and apply migration 20260429_interview_score.sql (DATA-01)</name>
  <files>supabase/migrations/20260429_interview_score.sql</files>
  <read_first>
    - CLAUDE.md ("Supabase-migrationer" — confirms `db query --linked -f` syntax)
    - supabase/migrations/20260227130000_add_new_features.sql (existing interview_sessions schema, baseline columns)
    - .planning/phases/03-data-wiring-wcag/03-CONTEXT.md (DATA-01 spec — score NUMERIC(4,1) DEFAULT NULL, score_breakdown JSONB DEFAULT NULL)
    - .planning/phases/03-data-wiring-wcag/03-RESEARCH.md (Pattern 3: Additive Schema Migrations)
  </read_first>
  <action>
    Create `supabase/migrations/20260429_interview_score.sql` with EXACTLY this content (no extra comments, no DROP, no destructive ALTER — strictly additive per CONTEXT.md "Inviolabelt"):

    ```sql
    -- Phase 3 / DATA-01 — Interview session score persistence
    -- Strictly additive: ADD COLUMN IF NOT EXISTS guards make this safe to re-run.
    -- Existing rows keep score = NULL; widget renders "Ingen poäng" for null.
    -- RLS unchanged (auth.uid() = user_id already enforced by 20260227130000).

    ALTER TABLE interview_sessions
      ADD COLUMN IF NOT EXISTS score NUMERIC(4,1) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT NULL;

    -- Comment to document append-only, nullable semantics
    COMMENT ON COLUMN interview_sessions.score IS 'Session total score 0.0–100.0 (Phase 3 DATA-01). NULL = no score yet.';
    COMMENT ON COLUMN interview_sessions.score_breakdown IS 'Per-question scores + AI feedback strings (Phase 3 DATA-01). NULL = no breakdown yet.';
    ```

    Then apply the migration to the live database (CLAUDE.md rule — NEVER use `db push`):
    ```bash
    npx supabase db query --linked -f supabase/migrations/20260429_interview_score.sql
    ```

    Then verify the columns exist with the correct types:
    ```bash
    npx supabase db query --linked "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='interview_sessions' AND column_name IN ('score','score_breakdown') ORDER BY column_name;" --output table
    ```

    The output table MUST contain exactly two rows:
    | column_name | data_type | is_nullable |
    | score | numeric | YES |
    | score_breakdown | jsonb | YES |

    Also verify RLS policies are still in place (no destructive change):
    ```bash
    npx supabase db query --linked "SELECT policyname, cmd FROM pg_policies WHERE tablename='interview_sessions' ORDER BY policyname;" --output table
    ```

    Expect 4 policies (one per cmd: SELECT, INSERT, UPDATE, DELETE) — any missing policy is a regression and the migration must be rolled back manually (DROP COLUMN IF EXISTS).

    Capture both verification outputs verbatim into the migration commit message body. Do NOT proceed to Task 3 if either verification fails.
  </action>
  <verify>
    <automated>test -f supabase/migrations/20260429_interview_score.sql && grep -q "ADD COLUMN IF NOT EXISTS score NUMERIC(4,1)" supabase/migrations/20260429_interview_score.sql && grep -q "ADD COLUMN IF NOT EXISTS score_breakdown JSONB" supabase/migrations/20260429_interview_score.sql && ! grep -qi "DROP " supabase/migrations/20260429_interview_score.sql</automated>
  </verify>
  <acceptance_criteria>
    - File `supabase/migrations/20260429_interview_score.sql` exists
    - File contains literal `ADD COLUMN IF NOT EXISTS score NUMERIC(4,1) DEFAULT NULL`
    - File contains literal `ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT NULL`
    - File does NOT contain any of: `DROP COLUMN`, `DROP TABLE`, `ALTER COLUMN ... TYPE`, `ALTER COLUMN ... DROP NOT NULL` (verifiable by `grep -i "DROP \|TYPE\|DROP NOT NULL"` returning no matches)
    - Migration applied: `npx supabase db query --linked "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='interview_sessions' AND column_name='score';" --output table` shows row with column_name=score, data_type=numeric
    - Migration applied: same query for `score_breakdown` shows data_type=jsonb
    - RLS preserved: `npx supabase db query --linked "SELECT count(*) FROM pg_policies WHERE tablename='interview_sessions';"` returns count >= 4
  </acceptance_criteria>
  <done>
    DATA-01 schema is live on Supabase. Plan 03 can call `interviewSessionsApi.update(id, { score, score_breakdown })` against the new columns.
  </done>
</task>

<task type="auto">
  <name>Task 3: Author and apply migration 20260429_personal_brand_audits.sql (DATA-02)</name>
  <files>supabase/migrations/20260429_personal_brand_audits.sql</files>
  <read_first>
    - CLAUDE.md ("Supabase-migrationer")
    - supabase/migrations/20260322183304_personal_brand_tables.sql (existing `personal_brand_audit` SINGULAR upsert table — DO NOT modify; new table is `personal_brand_audits` PLURAL)
    - .planning/phases/03-data-wiring-wcag/03-CONTEXT.md (DATA-02 schema spec)
    - .planning/phases/03-data-wiring-wcag/03-RESEARCH.md (Pattern 3 + Pitfall C: naming-collision warning)
    - docs/security-audit.md (RLS pattern — 4 policies on auth.uid() = user_id)
  </read_first>
  <action>
    Create `supabase/migrations/20260429_personal_brand_audits.sql` with EXACTLY this content. Note the table name is PLURAL (`personal_brand_audits`) — the existing SINGULAR `personal_brand_audit` from 20260322183304 stays untouched (Pitfall C from 03-RESEARCH.md):

    ```sql
    -- Phase 3 / DATA-02 — Personal Brand audit history (append-only)
    -- DISTINCT from existing `personal_brand_audit` (singular, upsert) from migration 20260322183304.
    -- This new `personal_brand_audits` (plural) is append-only: each audit run = one row.
    -- BrandAuditTab.tsx continues to use existing personalBrandApi for upsert behavior.
    -- Widget reads latest row from this table by created_at DESC.

    CREATE TABLE IF NOT EXISTS personal_brand_audits (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      score       NUMERIC(4,1) NOT NULL,
      dimensions  JSONB NOT NULL DEFAULT '{}',
      summary     TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_pba_user    ON personal_brand_audits(user_id);
    CREATE INDEX IF NOT EXISTS idx_pba_created ON personal_brand_audits(created_at DESC);

    ALTER TABLE personal_brand_audits ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "pba_select" ON personal_brand_audits;
    CREATE POLICY "pba_select" ON personal_brand_audits
      FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "pba_insert" ON personal_brand_audits;
    CREATE POLICY "pba_insert" ON personal_brand_audits
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "pba_update" ON personal_brand_audits;
    CREATE POLICY "pba_update" ON personal_brand_audits
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "pba_delete" ON personal_brand_audits;
    CREATE POLICY "pba_delete" ON personal_brand_audits
      FOR DELETE USING (auth.uid() = user_id);

    COMMENT ON TABLE personal_brand_audits IS 'Phase 3 DATA-02. Append-only audit history. NOT to be confused with personal_brand_audit (singular, upsert).';
    ```

    The `DROP POLICY IF EXISTS` lines before each `CREATE POLICY` make the migration idempotent without violating the inviolable rule (these DROPs only target policies created by this same migration on the new table; no existing data is at risk).

    Apply the migration:
    ```bash
    npx supabase db query --linked -f supabase/migrations/20260429_personal_brand_audits.sql
    ```

    Verify the table exists with the correct schema:
    ```bash
    npx supabase db query --linked "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='personal_brand_audits' ORDER BY ordinal_position;" --output table
    ```

    Expected rows (exact order, exact types):
    | column_name | data_type | is_nullable |
    | id | uuid | NO |
    | user_id | uuid | NO |
    | score | numeric | NO |
    | dimensions | jsonb | NO |
    | summary | text | YES |
    | created_at | timestamp with time zone | NO |

    Verify RLS is enabled:
    ```bash
    npx supabase db query --linked "SELECT relname, relrowsecurity FROM pg_class WHERE relname='personal_brand_audits';" --output table
    ```
    Expected: relrowsecurity = t

    Verify all 4 policies exist:
    ```bash
    npx supabase db query --linked "SELECT policyname, cmd FROM pg_policies WHERE tablename='personal_brand_audits' ORDER BY policyname;" --output table
    ```
    Expected: 4 rows — pba_delete (DELETE), pba_insert (INSERT), pba_select (SELECT), pba_update (UPDATE)

    Verify the existing singular `personal_brand_audit` was NOT modified:
    ```bash
    npx supabase db query --linked "SELECT count(*) FROM information_schema.tables WHERE table_name='personal_brand_audit';"
    ```
    Expected: count = 1 (singular still exists; we did not destroy it)
  </action>
  <verify>
    <automated>test -f supabase/migrations/20260429_personal_brand_audits.sql && grep -q "CREATE TABLE IF NOT EXISTS personal_brand_audits" supabase/migrations/20260429_personal_brand_audits.sql && grep -q "ENABLE ROW LEVEL SECURITY" supabase/migrations/20260429_personal_brand_audits.sql && grep -c "CREATE POLICY" supabase/migrations/20260429_personal_brand_audits.sql | grep -q "^4$" && ! grep -q "DROP TABLE" supabase/migrations/20260429_personal_brand_audits.sql</automated>
  </verify>
  <acceptance_criteria>
    - File `supabase/migrations/20260429_personal_brand_audits.sql` exists
    - File contains literal `CREATE TABLE IF NOT EXISTS personal_brand_audits`
    - File defines exactly 6 columns: id, user_id, score, dimensions, summary, created_at
    - File contains literal `score       NUMERIC(4,1) NOT NULL`
    - File contains literal `REFERENCES auth.users(id) ON DELETE CASCADE`
    - File contains literal `ENABLE ROW LEVEL SECURITY`
    - File contains exactly 4 `CREATE POLICY` statements (verifiable: `grep -c "^CREATE POLICY"` returns 4)
    - File does NOT contain `DROP TABLE` or modify the existing `personal_brand_audit` (singular) table — verifiable by `grep -i "personal_brand_audit\b"` returning no matches outside the comment
    - Migration applied: `npx supabase db query --linked "SELECT count(*) FROM information_schema.tables WHERE table_name='personal_brand_audits';"` returns 1
    - RLS active: `npx supabase db query --linked "SELECT relrowsecurity FROM pg_class WHERE relname='personal_brand_audits';"` returns t
    - 4 policies live: `npx supabase db query --linked "SELECT count(*) FROM pg_policies WHERE tablename='personal_brand_audits';"` returns 4
    - Existing singular table preserved: `personal_brand_audit` table still exists (count = 1 from information_schema.tables query)
  </acceptance_criteria>
  <done>
    DATA-02 schema is live. Plan 03 can call `personalBrandAuditsApi.create()` against the new append-only table while BrandAuditTab.tsx upsert flow continues unchanged on the existing singular table.
  </done>
</task>

<task type="auto">
  <name>Task 4: Update REQUIREMENTS.md Traceability table — remap HUB-02..04 to Phase 5</name>
  <files>.planning/REQUIREMENTS.md</files>
  <read_first>
    - .planning/REQUIREMENTS.md (current Traceability table at end of file — read entire file)
    - .planning/phases/03-data-wiring-wcag/03-CONTEXT.md (decision: HUB-02..04 widget BUILD work moves to Phase 5; documentation-only resolution)
    - .planning/ROADMAP.md (Phase 5 is "Full Hub Coverage + Översikt" — already targets remaining widgets)
  </read_first>
  <action>
    Edit `.planning/REQUIREMENTS.md` Traceability table to remap HUB-02, HUB-03, HUB-04 from "Phase 3 | Pending" to "Phase 5 | Pending".

    Find these 3 lines exactly (they currently say `Phase 3`):
    ```
    | HUB-02 | Phase 3 | Pending |
    | HUB-03 | Phase 3 | Pending |
    | HUB-04 | Phase 3 | Pending |
    ```

    Replace with:
    ```
    | HUB-02 | Phase 5 | Pending |
    | HUB-03 | Phase 5 | Pending |
    | HUB-04 | Phase 5 | Pending |
    ```

    Also update the "Last updated" line at the bottom of the file from `2026-04-28 — traceability mapped by roadmapper` to `2026-04-28 — HUB-02..04 remapped to Phase 5 (Phase 3 scope sharpened to JobsokHub only)`.

    Do NOT modify any other rows in the Traceability table. Do NOT modify the requirement definitions in §HUB. Do NOT add new rows. Do NOT change the column structure.

    The "Coverage" summary at the bottom does not need recomputation — both Phase 3 and Phase 5 had pending mappings before; the totals (24 mapped) remain correct after remapping.
  </action>
  <verify>
    <automated>grep -q "| HUB-02 | Phase 5 | Pending |" .planning/REQUIREMENTS.md && grep -q "| HUB-03 | Phase 5 | Pending |" .planning/REQUIREMENTS.md && grep -q "| HUB-04 | Phase 5 | Pending |" .planning/REQUIREMENTS.md && ! grep -q "| HUB-02 | Phase 3 |" .planning/REQUIREMENTS.md && ! grep -q "| HUB-03 | Phase 3 |" .planning/REQUIREMENTS.md && ! grep -q "| HUB-04 | Phase 3 |" .planning/REQUIREMENTS.md</automated>
  </verify>
  <acceptance_criteria>
    - `.planning/REQUIREMENTS.md` contains literal row `| HUB-02 | Phase 5 | Pending |`
    - `.planning/REQUIREMENTS.md` contains literal row `| HUB-03 | Phase 5 | Pending |`
    - `.planning/REQUIREMENTS.md` contains literal row `| HUB-04 | Phase 5 | Pending |`
    - `.planning/REQUIREMENTS.md` does NOT contain any of: `| HUB-02 | Phase 3 |`, `| HUB-03 | Phase 3 |`, `| HUB-04 | Phase 3 |`
    - HUB-01 row still maps to Phase 3 (unchanged): `grep -q "| HUB-01 | Phase 3 | Pending |" .planning/REQUIREMENTS.md` returns true
    - HUB-05, HUB-06 rows still map to Phase 5 (unchanged): both rows still match `Phase 5 | Pending`
    - DATA-01, DATA-02, A11Y-01..05 rows still map to Phase 3 (unchanged) — verifiable by `grep "Phase 3" .planning/REQUIREMENTS.md | wc -l` returning at least 8
    - "Last updated" footer line updated to mention HUB-02..04 remap
  </acceptance_criteria>
  <done>
    HUB-02, HUB-03, HUB-04 traceability now points to Phase 5 ("Full Hub Coverage + Översikt") where the actual widget BUILD work happens. Phase 3's scope is correctly bounded to JobsokHub data wiring + WCAG.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 5: Mikael verifies migrations applied successfully and reviews DB performance verdict</name>
  <files>n/a — checkpoint task</files>
  <what-built>
    Two strictly additive migrations (interview_sessions ADD COLUMN score + new personal_brand_audits table) applied to live Supabase. Hub-summary query performance measured and recorded in 03-DB-PERFORMANCE.md. REQUIREMENTS.md traceability remapped.
  </what-built>
  <how-to-verify>
    1. Open `.planning/phases/03-data-wiring-wcag/03-DB-PERFORMANCE.md` and read the Verdict section. Confirm cumulative latency is documented and either PASS (<50ms) or FAIL (>50ms with v1.1 RPC noted).
    2. Run this verification SQL yourself to confirm columns exist:
       ```bash
       npx supabase db query --linked "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='interview_sessions' AND column_name IN ('score','score_breakdown');" --output table
       ```
       Expect 2 rows: score (numeric), score_breakdown (jsonb).
    3. Run this verification SQL to confirm new table exists:
       ```bash
       npx supabase db query --linked "SELECT count(*) FROM information_schema.tables WHERE table_name='personal_brand_audits';"
       ```
       Expect: 1.
    4. Run this verification to confirm existing singular table is untouched:
       ```bash
       npx supabase db query --linked "SELECT count(*) FROM information_schema.tables WHERE table_name='personal_brand_audit';"
       ```
       Expect: 1 (still there; not destroyed).
    5. Open `.planning/REQUIREMENTS.md` and search for `HUB-02` — confirm it now says `Phase 5`.
    6. If any of 1–5 fails, type the specific failure and the plan is paused for fix. If all pass, type "approved".
  </how-to-verify>
  <action>
    Mikael (or the user running this checkpoint) executes the 5 verification steps in `<how-to-verify>` above. This task pauses the autonomous flow until Mikael types "approved" or describes a failure.

    For Claude executing this checkpoint: surface the artifacts (03-DB-PERFORMANCE.md content, the verification SQL commands, and the REQUIREMENTS.md HUB-02 line) to Mikael and wait for the resume signal. Do NOT proceed past this gate without an explicit "approved" from the user.
  </action>
  <verify>
    <automated>echo "checkpoint:human-verify — resume signal required from Mikael"</automated>
  </verify>
  <acceptance_criteria>
    - Mikael has typed "approved" OR described specific failures
    - If failures described: this plan is restarted from the failed task; do not proceed to Plan 02
    - Resume signal recorded in summary
  </acceptance_criteria>
  <done>
    Mikael has confirmed the migrations are live and the performance verdict is acceptable. Plan 02 (hub-summary loader) is unblocked.
  </done>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- All 4 automated tasks above passed
- Mikael's checkpoint signed off
- 03-DB-PERFORMANCE.md exists with full per-query timings
- Both migration SQL files committed to git in supabase/migrations/
- Both migrations live on Supabase (verified via column-introspection SQL)
- REQUIREMENTS.md updated and committed
- Existing personal_brand_audit (singular) untouched — Pitfall C avoided
</verification>

<success_criteria>
- DATA-01 schema gate cleared: `interview_sessions.score NUMERIC(4,1)` and `interview_sessions.score_breakdown JSONB` exist on live DB
- DATA-02 schema gate cleared: `personal_brand_audits` table with 4 RLS policies exists on live DB
- Pitfall 3 + Pitfall 18 closure: cumulative hub-query latency documented (Plan 02 unblocked)
- HUB-02/03/04 traceability resolved without writing widget code (documentation-only)
- HUB-01 (this plan's contribution): performance prerequisite established for the loader Plan 02 will design
</success_criteria>

<output>
After completion, create `.planning/phases/03-data-wiring-wcag/03-01-SUMMARY.md` with:
- Cumulative-latency number from 03-DB-PERFORMANCE.md
- Verdict (PASS/FAIL on the 50ms threshold)
- Whether `salary_data` and `international_targets` tables exist (informs Plan 03 widget wiring strategy)
- Confirmation that both migrations applied without modifying any existing data
- Confirmation that REQUIREMENTS.md traceability remap is complete
</output>
