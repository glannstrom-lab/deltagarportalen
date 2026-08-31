-- AG1: praktikplatser och arbetsträning i konsulentvyn (/consultant).
--
-- Bakgrund: konsulentvyn saknar helt en yta för praktik/arbetsträning/
-- arbetsprövning/subventionerad anställning. Kravbilden kommer från Mikael
-- (erfaren arbetskonsulent) — se docs/ROADMAP.md AG1 och uppdragstexten i
-- samma runda. Mönstret är portat från den avaktiverade STA-modulens
-- sta_workplaces/sta_workplace_followups (0 rader i prod, se
-- 20260512_sta_data_model.sql och 20260522_sta_at_roll_workplaces_ai.sql)
-- men byggt som EGNA tabeller: sta_workplaces bär AF-byråkrati
-- (af_submission_status, af_approved_at, inriktning) som inte hör hemma
-- här, och den tabellen rörs INTE av denna migration.
--
-- Namngivning: INTE "consultant_placements" — den tabellen finns redan
-- (20260323100000_consultant_features.sql) och betyder något annat: en
-- avslutad ANSTÄLLNING (employer_name, salary_range, placement_date) som
-- KS1/AG3 bygger vidare på i sitt eget spår (se
-- 20260831120000_ag3_placement_company_id.sql, som lägger company_id på
-- just den tabellen). Att återanvända namnet hade blandat ihop två olika
-- begrepp: en pågående INSATS (praktik/arbetsträning) är inte en anställning.
--
-- RLS-mönstret är den lärdom KS2 dokumenterar: flera befintliga
-- konsulent-tabeller (consultant_goals, consultant_journal m.fl., samma
-- migration som ovan) har policyn `USING (auth.uid() = consultant_id)` utan
-- att kontrollera att relationen fortfarande är AKTIV. `revoke_consultant_link()`
-- (20260522_sta_bulk_invite_consent.sql:294) tar bort raden i
-- consultant_participants när en deltagare säger upp sin konsulent — så en
-- policy som bara jämför `consultant_id` fortsätter att släppa igenom en
-- konsulent som inte längre har någon relation till deltagaren. Policyerna
-- här kräver därför EXISTS mot consultant_participants, inte bara ett
-- kolumnjämförelse.
--
-- INTE KÖRD ÄN. Kräver Mikaels ja enligt CLAUDE.md (migrationer mot prod).
-- Kör manuellt när klartecken finns:
--   npx supabase db query --linked -f supabase/migrations/20260831130000_ag1_work_placements.sql
-- Uppdatera sedan schema-snapshoten i SAMMA commit som körningen:
--   cd client && npm run schema:refresh
--
-- =============================================================================
-- REDIGERAD 2026-08-31 efter domänsvar från Mikael (arbetskonsulent) — INNAN
-- körning, så detta är samma fil, inte en ny migration. Tre ändringar:
--
-- (a) Handledningskapacitet är inte en dimension bland fyra — den är kritisk.
--     Ingen schemaändring (kolumnerna fanns redan), men UI:t (PlaceringCard)
--     lyfter obalansen `workplace_supervision_capacity='lag'` +
--     `participant_supervision_need='hog'` till en egen, synlig varning i
--     stället för en rad text bland andra.
--
-- (b) VAD ska skiljas från VARFÖR. `workplace_adaptations` (ett enda fält)
--     är ersatt av två:
--       - `employer_instructions` — praktiska anvisningar UTAN orsak
--         ("skriftliga instruktioner", "paus var 90:e minut"). FÅR delas
--         med arbetsgivaren.
--       - `internal_adaptation_notes` — konsulentens interna anteckning om
--         bakgrunden. Detta är art. 9-närliggande data (funktionsnedsättning/
--         anpassningsbehov, se docs/DPIA-PORTAL.md:51-54,140) och FÅR ALDRIG
--         ingå i något som serialiseras mot en arbetsgivare. Se vakten
--         `byggArbetsgivarUnderlag()` i client/src/services/placeringarApi.ts
--         — en allowlist med flit, så ett nytt fält aldrig läcker per
--         misstag. `client/src/services/placeringarApi.test.ts` har ett
--         test som fäller om det här fältet (eller något annat internt
--         fält) dyker upp i den serialiseringen.
--
-- (c) Arbetsgivarens motivation fångas i två nya fält:
--       - `employer_future_needs` — vad arbetsgivaren har för framtida
--         behov (det som gör praktikanten till en tillgång).
--       - `employer_hiring_interest` — hur arbetsgivaren ställer sig till
--         en eventuell anställning efteråt.
--     Båda är konsulentens interna underlag (säljargument/prognos), INTE
--     något att skicka tillbaka till arbetsgivaren — de finns därför
--     medvetet INTE med i `byggArbetsgivarUnderlag()` heller.
--
-- Utöver detta: `consultant_work_placement_followups` bygger nu på
-- MILSTOLPAR (vecka 1/5/12/24, Mikaels riktvärde) i stället för en löpande
-- veckoserie. `week_number`-kolumnen behålls (bär nu ett milstolpenummer),
-- men `status` är gjord nullbar och `is_completed` tillkommer, så en rad
-- kan representera en PLANERAD (ej genomförd) milstolpe. Se
-- `berakMilstolpeUppfoljningar()` i placeringarApi.ts.
-- =============================================================================

-- =============================================================================
-- consultant_work_placements — praktik/arbetsträning/arbetsprövning/subv. anställning
-- =============================================================================
CREATE TABLE IF NOT EXISTS consultant_work_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Förberedd för spår AG etapp 1 (företagskonto äger platsen i stället för
  -- att konsulenten registrerar den manuellt från sitt nätverk). Nullbar,
  -- UTAN FK — tabellen för företagskonton finns inte än. Samma mönster som
  -- consultant_placements.company_id (20260831120000_ag3_placement_company_id.sql).
  company_account_id UUID,

  -- ---- Insatstyp: styrande kolumn, inte en etikett. Juridik, ersättning
  -- och dokumentationskrav skiljer sig åt mellan de fyra typerna. ----
  placement_type TEXT NOT NULL CHECK (placement_type IN (
    'praktik',                    -- arbetspraktik, meritering, behåller ersättning
    'arbetstraning',               -- lägre krav, rutiner/uthållighet/arbetsförmåga
    'arbetsprovning',               -- underlag till bedömning av vad personen klarar
    'subventionerad_anstallning'    -- nystartsjobb/introduktionsjobb/lönebidrag/OSA
  )),

  status TEXT NOT NULL DEFAULT 'planerad' CHECK (status IN (
    'planerad', 'pagaende', 'avslutad', 'avbruten'
  )),

  -- ---- Grunddata om platsen ----
  company_name TEXT NOT NULL,
  org_number TEXT,
  occupation TEXT,              -- yrke
  industry TEXT,                -- bransch
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  address TEXT,

  -- ---- Dimension 2: omfattning och tider ----
  start_date DATE,
  end_date DATE,
  hours_per_week NUMERIC(4,1),
  schedule_days TEXT,            -- t.ex. "Mån, tis, tors 09–14"
  can_ramp_up BOOLEAN NOT NULL DEFAULT FALSE,   -- möjlighet att trappa upp
  ramp_up_plan TEXT,             -- hur upptrappningen ska gå till

  -- ---- Dimension 1: fysiska krav och tempo ----
  -- Mikael framhöll detta särskilt — oftast det som fäller en placering för
  -- målgruppen, och det som sällan står nedskrivet någonstans. Egna kolumner,
  -- inte ett fritextfält bland andra.
  lifting_required BOOLEAN,
  standing_required BOOLEAN,
  temperature_demands TEXT CHECK (temperature_demands IN ('normal', 'kyla', 'varme')),
  noise_level TEXT CHECK (noise_level IN ('lag', 'mellan', 'hog')),
  pace_level TEXT CHECK (pace_level IN ('lag', 'mellan', 'hog')),
  shift_work BOOLEAN NOT NULL DEFAULT FALSE,
  physical_notes TEXT,

  -- ---- Dimension 3: handledningsbehov — matchning mellan två sidor ----
  -- KRITISK, inte jämbördig med de andra dimensionerna (Mikael, uppdragssvar
  -- 2026-08-31): "arbetsplatsen inte har tid med handledning" är den
  -- vanligaste orsaken till att en placering inte fungerar. Obalansen
  -- workplace_supervision_capacity='lag' + participant_supervision_need='hog'
  -- lyfts som en egen, synlig varning i PlaceringCard — inte ett fält bland
  -- andra. Se harHandledningsobalans() i placeringarApi.ts.
  participant_supervision_need TEXT CHECK (participant_supervision_need IN ('lag', 'mellan', 'hog')),
  workplace_supervision_capacity TEXT CHECK (workplace_supervision_capacity IN ('lag', 'mellan', 'hog')),
  supervision_notes TEXT,

  -- ---- Dimension 4: yrke/bransch/språkkrav + körkort/behörigheter ----
  language_requirements TEXT,
  drivers_license_required BOOLEAN NOT NULL DEFAULT FALSE,
  other_requirements TEXT,       -- övriga behörigheter

  -- ---- Praktiskt (docs/STA-FORBATTRINGSFORSLAG.md:122-130) ----
  sick_call_phone TEXT,                 -- "ring sjuk"-snabblänk
  sick_call_instructions TEXT,

  -- ---- VAD skiljs från VARFÖR (Mikael, uppdragssvar 2026-08-31) ----
  -- `employer_instructions` är formulerat som instruktioner UTAN orsak —
  -- det FÅR nå arbetsgivaren. `internal_adaptation_notes` är konsulentens
  -- anteckning om bakgrunden (diagnos-närliggande, art. 9, se
  -- docs/DPIA-PORTAL.md:51-54,140) och FÅR ALDRIG serialiseras mot en
  -- arbetsgivare — se allowlisten byggArbetsgivarUnderlag() i
  -- client/src/services/placeringarApi.ts och dess vakt-test. Slå aldrig
  -- ihop de här två fälten igen.
  employer_instructions TEXT,           -- VAD arbetsplatsen ska göra — delningsbart
  internal_adaptation_notes TEXT,       -- VARFÖR — internt, art. 9, delas ALDRIG
  work_environment_responsibility TEXT, -- vem som har arbetsmiljöansvaret

  -- ---- Arbetsgivarens motivation (Mikael, uppdragssvar 2026-08-31) ----
  -- "Det är säljargumentet, och det är det som avgör om placeringen leder
  -- någonstans." Konsulentens interna underlag om ARBETSGIVAREN — inte
  -- data att skicka tillbaka till arbetsgivaren, därför inte med i
  -- byggArbetsgivarUnderlag() heller.
  employer_future_needs TEXT,           -- vad arbetsgivaren har för framtida behov
  employer_hiring_interest TEXT CHECK (employer_hiring_interest IN (
    'positiv', 'avvaktande', 'ej_aktuellt', 'okant'
  )) DEFAULT 'okant',

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cwp_consultant ON consultant_work_placements(consultant_id);
CREATE INDEX IF NOT EXISTS idx_cwp_participant ON consultant_work_placements(participant_id);
CREATE INDEX IF NOT EXISTS idx_cwp_status ON consultant_work_placements(status);
CREATE INDEX IF NOT EXISTS idx_cwp_placement_type ON consultant_work_placements(placement_type);

ALTER TABLE consultant_work_placements ENABLE ROW LEVEL SECURITY;

-- Deltagaren ser sina egna platser (oavsett om konsulentrelationen senare
-- upphör — det är deltagarens egen historik, inte konsulentens åtkomst).
CREATE POLICY "Deltagaren ser sina platser"
  ON consultant_work_placements FOR SELECT
  USING (participant_id = auth.uid());

-- Konsulenten har full åtkomst BARA så länge relationen är aktiv. KS2-mönstret:
-- EXISTS mot consultant_participants, inte bara consultant_id = auth.uid().
CREATE POLICY "Konsulent har access till aktiva deltagares platser"
  ON consultant_work_placements FOR ALL
  USING (
    consultant_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM consultant_participants cp
      WHERE cp.consultant_id = auth.uid()
        AND cp.participant_id = consultant_work_placements.participant_id
    )
  )
  WITH CHECK (
    consultant_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM consultant_participants cp
      WHERE cp.consultant_id = auth.uid()
        AND cp.participant_id = consultant_work_placements.participant_id
    )
  );

DROP TRIGGER IF EXISTS trg_consultant_work_placements_updated_at ON consultant_work_placements;
CREATE TRIGGER trg_consultant_work_placements_updated_at
  BEFORE UPDATE ON consultant_work_placements
  FOR EACH ROW EXECUTE FUNCTION update_consultant_updated_at();

COMMENT ON TABLE consultant_work_placements IS
  'Praktik/arbetsträning/arbetsprövning/subventionerad anställning som konsulenten registrerar för en deltagare (spår AG1). Inte samma sak som consultant_placements (avslutad anställning, AG3/KS1).';

-- =============================================================================
-- consultant_work_placement_followups — uppföljning vid milstolpar (vecka 1/5/12/24)
-- =============================================================================
CREATE TABLE IF NOT EXISTS consultant_work_placement_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id UUID NOT NULL REFERENCES consultant_work_placements(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL REFERENCES profiles(id),

  -- Milstolpe, inte löpnummer i en veckoserie. Mikael (arbetskonsulent):
  -- "Varje vecka är för tätt. Vanligtvis vecka 1, 5, 12 och 24."
  -- De fyra förbereds från startdatum som PLANERADE rader; konsulenten kan
  -- lägga till fler när hon vill. Riktvärdena bor i placeringLabels.ts.
  week_number SMALLINT NOT NULL CHECK (week_number BETWEEN 1 AND 52),
  followup_date DATE NOT NULL,

  -- En planerad milstolpe är ännu inte genomförd — därför får varken närvaro
  -- eller status ha ett värde förrän uppföljningen faktiskt ägt rum. Ett
  -- förifyllt 'good' på något som inte hänt vore precis den sortens påhittade
  -- värde projektets ärlighetsregel finns för att stoppa.
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,

  attendance_pct SMALLINT CHECK (attendance_pct BETWEEN 0 AND 100),
  -- 'good' = går bra, 'concerns' = vissa svårigheter, 'critical' = behöver omplanering.
  -- NULL = uppföljningen är planerad men inte genomförd.
  status TEXT CHECK (status IN ('good', 'concerns', 'critical')),

  -- En genomförd uppföljning måste ha en status; en planerad får inte ha en.
  CONSTRAINT cwpf_status_kraver_genomford CHECK (
    (is_completed AND status IS NOT NULL) OR (NOT is_completed AND status IS NULL)
  ),

  topics_to_discuss TEXT,  -- frågor att ta upp vid nästa avstämning
  notes TEXT,
  next_step TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (placement_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_cwpf_placement ON consultant_work_placement_followups(placement_id);
CREATE INDEX IF NOT EXISTS idx_cwpf_date ON consultant_work_placement_followups(followup_date);

ALTER TABLE consultant_work_placement_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deltagaren ser uppföljningar på sin plats"
  ON consultant_work_placement_followups FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM consultant_work_placements p
    WHERE p.id = placement_id AND p.participant_id = auth.uid()
  ));

-- Samma KS2-mönster: aktiv relation krävs, inte bara ägarskap av platsraden.
CREATE POLICY "Konsulent har access till uppföljningar på aktiva platser"
  ON consultant_work_placement_followups FOR ALL
  USING (EXISTS (
    SELECT 1 FROM consultant_work_placements p
    JOIN consultant_participants cp
      ON cp.consultant_id = p.consultant_id AND cp.participant_id = p.participant_id
    WHERE p.id = placement_id AND p.consultant_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM consultant_work_placements p
    JOIN consultant_participants cp
      ON cp.consultant_id = p.consultant_id AND cp.participant_id = p.participant_id
    WHERE p.id = placement_id AND p.consultant_id = auth.uid()
  ));

DROP TRIGGER IF EXISTS trg_cwpf_updated_at ON consultant_work_placement_followups;
CREATE TRIGGER trg_cwpf_updated_at
  BEFORE UPDATE ON consultant_work_placement_followups
  FOR EACH ROW EXECUTE FUNCTION update_consultant_updated_at();

COMMENT ON TABLE consultant_work_placement_followups IS
  'Uppföljning av en consultant_work_placements-rad vid milstolpar — vecka 1, 5, 12 och 24 enligt Mikaels riktvärde, inte en löpande veckoserie. Formen lånad från sta_workplace_followups (0 rader i prod), men egen tabell och egen semantik: en rad kan vara PLANERAD (is_completed=false, status NULL).';

-- Kontroll efter körning:
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_name IN ('consultant_work_placements', 'consultant_work_placement_followups')
--   ORDER BY table_name, ordinal_position;
--
--   SELECT policyname, cmd, permissive, qual, with_check FROM pg_policies
--   WHERE tablename IN ('consultant_work_placements', 'consultant_work_placement_followups')
--   ORDER BY tablename, cmd;
