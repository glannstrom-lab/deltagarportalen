-- =============================================================================
-- STA — Steg till arbete datamodell
-- =============================================================================
-- Fas 1 av roadmappen (docs/sta-automation-roadmap.md):
--   sta_enrollments    — deltagarens tilldelning till STA (vilken del, anpassningar)
--   sta_activities     — varje genomförd dag/aktivitet i Del 1-4
--   sta_assessments    — DOA/WRI/MOHOST/AWP/AWC-skattningar
--   sta_workplaces     — arbetsprövningsplatser (Del 3-4)
--   sta_documents      — utkast och inskickade rapporter till AF
--   sta_quick_notes    — snabbanteckningar med taggchips
--   sta_pulse_checks   — daglig energi/mood från deltagare
--   sta_weekly_checkins — fredagsavslutning från deltagare
--
-- Konsulenten kan lägga till deltagare manuellt → participant_id är nullable
-- och external_name/email/phone används för manuella deltagare som inte har
-- Jobin-konto än.

-- =============================================================================
-- sta_enrollments
-- =============================================================================
CREATE TABLE IF NOT EXISTS sta_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Deltagaren: antingen ett Jobin-konto (participant_id) eller manuellt registrerad (external_*)
  participant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  external_name TEXT,           -- för manuellt tillagda deltagare utan Jobin-konto
  external_email TEXT,
  external_phone TEXT,
  external_personal_id TEXT,    -- personnummer (krävs av AF)
  consultant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  current_part SMALLINT NOT NULL DEFAULT 1 CHECK (current_part BETWEEN 1 AND 4),
  started_at DATE NOT NULL,
  part_started_at DATE NOT NULL,
  focus_occupation TEXT,        -- "fokusyrke" enligt AF
  adaptations TEXT,             -- fritextbeskrivning av anpassningsbehov
  language_support TEXT[] DEFAULT '{}',  -- ['arabiska', 'tigrinja', ...]
  communication_support TEXT[] DEFAULT '{}',  -- ['bildstöd', 'lättläst']
  link_status TEXT NOT NULL DEFAULT 'linked'
    CHECK (link_status IN ('linked', 'invited', 'unlinked')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Antingen kopplad eller manuell — minst ett namn-sätt krävs
  CONSTRAINT participant_or_external CHECK (
    participant_id IS NOT NULL OR external_name IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_sta_enrollments_participant ON sta_enrollments(participant_id);
CREATE INDEX IF NOT EXISTS idx_sta_enrollments_consultant ON sta_enrollments(consultant_id);
CREATE INDEX IF NOT EXISTS idx_sta_enrollments_status ON sta_enrollments(status);

ALTER TABLE sta_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deltagaren ser sin egen enrollment"
  ON sta_enrollments FOR SELECT
  USING (auth.uid() = participant_id);

CREATE POLICY "Konsulent ser sina deltagares enrollments"
  ON sta_enrollments FOR ALL
  USING (auth.uid() = consultant_id);

-- =============================================================================
-- sta_activities — vad har deltagaren gjort?
-- =============================================================================
CREATE TABLE IF NOT EXISTS sta_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES sta_enrollments(id) ON DELETE CASCADE,
  part SMALLINT NOT NULL CHECK (part BETWEEN 1 AND 4),
  activity_type TEXT NOT NULL
    CHECK (activity_type IN (
      'startsamtal', 'dagsslinga', 'arbetsstation', 'arbetsprovning',
      'samtal', 'halsoaktivitet', 'karriarvagledning', 'kompetenskartlaggning',
      'annat'
    )),
  activity_key TEXT,            -- 'dag-7-somn' | 'station-administration' | 'mote-vecka-3'
  scheduled_for DATE,
  completed_at TIMESTAMPTZ,
  duration_minutes INT,
  participant_reflection TEXT,
  consultant_note TEXT,
  attendance TEXT
    CHECK (attendance IN ('present', 'absent', 'sick', 'allowed_absence', 'external')),
  metadata JSONB DEFAULT '{}',  -- vad som inte passar i kolumner ovan
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sta_activities_enrollment ON sta_activities(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_sta_activities_part ON sta_activities(part);
CREATE INDEX IF NOT EXISTS idx_sta_activities_scheduled ON sta_activities(scheduled_for);

ALTER TABLE sta_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deltagaren ser sina aktiviteter"
  ON sta_activities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM sta_enrollments e
    WHERE e.id = enrollment_id AND e.participant_id = auth.uid()
  ));

CREATE POLICY "Deltagaren skapar/uppdaterar sina egna aktiviteter"
  ON sta_activities FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM sta_enrollments e
    WHERE e.id = enrollment_id AND e.participant_id = auth.uid()
  ));

CREATE POLICY "Deltagaren uppdaterar sina egna aktiviteter"
  ON sta_activities FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM sta_enrollments e
    WHERE e.id = enrollment_id AND e.participant_id = auth.uid()
  ));

CREATE POLICY "Konsulent har full access till sina deltagares aktiviteter"
  ON sta_activities FOR ALL
  USING (EXISTS (
    SELECT 1 FROM sta_enrollments e
    WHERE e.id = enrollment_id AND e.consultant_id = auth.uid()
  ));

-- =============================================================================
-- sta_assessments — DOA/WRI/MOHOST/AWP/AWC
-- =============================================================================
CREATE TABLE IF NOT EXISTS sta_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES sta_enrollments(id) ON DELETE CASCADE,
  part SMALLINT NOT NULL CHECK (part BETWEEN 1 AND 4),
  instrument TEXT NOT NULL
    CHECK (instrument IN ('DOA', 'WRI', 'MOHOST', 'AWP', 'AWC')),
  performed_by UUID REFERENCES profiles(id),  -- AT eller konsulent
  performed_at DATE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'complete', 'submitted_to_af')),
  scores JSONB DEFAULT '{}',           -- instrumentspecifik datastruktur (poäng per item)
  summary TEXT,                        -- "Sammanfattande kommentar"
  workplace_id UUID,                   -- för AWC/AWP i del 3-4 (referens sätts efter sta_workplaces skapas)
  activity_id UUID REFERENCES sta_activities(id),  -- för AWP per aktivitet i Del 2
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sta_assessments_enrollment ON sta_assessments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_sta_assessments_part_instrument ON sta_assessments(part, instrument);

ALTER TABLE sta_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deltagaren ser sina skattningar"
  ON sta_assessments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM sta_enrollments e
    WHERE e.id = enrollment_id AND e.participant_id = auth.uid()
  ));

CREATE POLICY "Konsulent har full access"
  ON sta_assessments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM sta_enrollments e
    WHERE e.id = enrollment_id AND e.consultant_id = auth.uid()
  ));

-- =============================================================================
-- sta_workplaces — arbetsprövningsplatser (Del 3-4)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sta_workplaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES sta_enrollments(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  org_number TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  start_date DATE,
  end_date DATE,
  weeks_planned INT,
  inriktning TEXT CHECK (inriktning IN ('aktiverande', 'introducerande')),
  af_submission_status TEXT DEFAULT 'pending'
    CHECK (af_submission_status IN ('pending', 'submitted', 'approved', 'rejected')),
  af_submitted_at TIMESTAMPTZ,
  af_approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sta_workplaces_enrollment ON sta_workplaces(enrollment_id);

ALTER TABLE sta_workplaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deltagaren ser sin arbetsplats"
  ON sta_workplaces FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM sta_enrollments e
    WHERE e.id = enrollment_id AND e.participant_id = auth.uid()
  ));

CREATE POLICY "Konsulent har full access"
  ON sta_workplaces FOR ALL
  USING (EXISTS (
    SELECT 1 FROM sta_enrollments e
    WHERE e.id = enrollment_id AND e.consultant_id = auth.uid()
  ));

-- Lägg till FK från sta_assessments till sta_workplaces nu när tabellen finns
ALTER TABLE sta_assessments
  ADD CONSTRAINT sta_assessments_workplace_fkey
  FOREIGN KEY (workplace_id) REFERENCES sta_workplaces(id) ON DELETE SET NULL;

-- =============================================================================
-- sta_documents — rapporter (utkast och inskickade)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sta_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES sta_enrollments(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL
    CHECK (doc_type IN (
      'initial_planering',
      'delredovisning_1', 'delredovisning_2', 'delredovisning_3', 'delredovisning_4',
      'anmalan_arbetsprovning', 'information_arbetsprovning',
      'atgardsplan_utebliven_ap', 'informativ_rapport_hjalpmedel'
    )),
  part SMALLINT CHECK (part BETWEEN 1 AND 4),
  content_json JSONB DEFAULT '{}',     -- strukturerade fält + fritext sammansatt
  content_md TEXT,                     -- auto-genererat utkast i markdown
  ai_drafted BOOLEAN DEFAULT FALSE,
  ai_model TEXT,                       -- t.ex. 'openai/gpt-oss-120b'
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'consultant_review', 'approved', 'submitted')),
  pdf_url TEXT,                        -- länk till genererad PDF
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sta_documents_enrollment ON sta_documents(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_sta_documents_status ON sta_documents(status);

ALTER TABLE sta_documents ENABLE ROW LEVEL SECURITY;

-- Deltagaren ser bara godkända/inskickade dokument (inte utkast med konsulent-anteckningar)
CREATE POLICY "Deltagaren ser inskickade dokument"
  ON sta_documents FOR SELECT
  USING (
    status IN ('approved', 'submitted')
    AND EXISTS (
      SELECT 1 FROM sta_enrollments e
      WHERE e.id = enrollment_id AND e.participant_id = auth.uid()
    )
  );

CREATE POLICY "Konsulent har full access"
  ON sta_documents FOR ALL
  USING (EXISTS (
    SELECT 1 FROM sta_enrollments e
    WHERE e.id = enrollment_id AND e.consultant_id = auth.uid()
  ));

-- =============================================================================
-- sta_quick_notes — snabbanteckningar med taggchips
-- =============================================================================
CREATE TABLE IF NOT EXISTS sta_quick_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES sta_enrollments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT,                           -- fritext-anteckning
  tags TEXT[] DEFAULT '{}',            -- ['fokuserad','tystlaten',...]
  voice_transcript TEXT,               -- om voice-to-text använts
  visibility TEXT NOT NULL DEFAULT 'consultant_only'
    CHECK (visibility IN ('consultant_only', 'shared_in_report', 'shared_with_participant')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sta_quick_notes_enrollment ON sta_quick_notes(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_sta_quick_notes_created ON sta_quick_notes(created_at DESC);

ALTER TABLE sta_quick_notes ENABLE ROW LEVEL SECURITY;

-- Konsulent ser allt om sina deltagare
CREATE POLICY "Konsulent ser och hanterar quick notes"
  ON sta_quick_notes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM sta_enrollments e
    WHERE e.id = enrollment_id AND e.consultant_id = auth.uid()
  ));

-- Deltagaren ser bara anteckningar delade med dem
CREATE POLICY "Deltagaren ser delade anteckningar"
  ON sta_quick_notes FOR SELECT
  USING (
    visibility = 'shared_with_participant'
    AND EXISTS (
      SELECT 1 FROM sta_enrollments e
      WHERE e.id = enrollment_id AND e.participant_id = auth.uid()
    )
  );

-- =============================================================================
-- sta_pulse_checks — daglig energi/mood från deltagare
-- =============================================================================
CREATE TABLE IF NOT EXISTS sta_pulse_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES sta_enrollments(id) ON DELETE CASCADE,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  energy_level SMALLINT CHECK (energy_level BETWEEN 1 AND 5),
  mood TEXT CHECK (mood IN ('great', 'okay', 'soso', 'tough', 'bad')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (enrollment_id, check_date)  -- en pulse per dag
);

CREATE INDEX IF NOT EXISTS idx_sta_pulse_checks_enrollment_date ON sta_pulse_checks(enrollment_id, check_date DESC);

ALTER TABLE sta_pulse_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deltagaren ser och hanterar sin pulse"
  ON sta_pulse_checks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM sta_enrollments e
    WHERE e.id = enrollment_id AND e.participant_id = auth.uid()
  ));

CREATE POLICY "Konsulent ser sina deltagares pulse"
  ON sta_pulse_checks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM sta_enrollments e
    WHERE e.id = enrollment_id AND e.consultant_id = auth.uid()
  ));

-- =============================================================================
-- sta_weekly_checkins — fredagsavslutning från deltagare
-- =============================================================================
CREATE TABLE IF NOT EXISTS sta_weekly_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES sta_enrollments(id) ON DELETE CASCADE,
  week_starts DATE NOT NULL,           -- måndag den veckan
  overall_mood TEXT CHECK (overall_mood IN ('great', 'okay', 'soso', 'tough', 'bad')),
  best_thing TEXT,                     -- "Vad var bäst denna vecka?"
  hardest_thing TEXT,                  -- "Vad var jobbigast?"
  question_for_consultant TEXT,        -- frivillig fråga
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (enrollment_id, week_starts)
);

CREATE INDEX IF NOT EXISTS idx_sta_weekly_checkins_enrollment ON sta_weekly_checkins(enrollment_id, week_starts DESC);

ALTER TABLE sta_weekly_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deltagaren ser och hanterar sina veckoavslutningar"
  ON sta_weekly_checkins FOR ALL
  USING (EXISTS (
    SELECT 1 FROM sta_enrollments e
    WHERE e.id = enrollment_id AND e.participant_id = auth.uid()
  ));

CREATE POLICY "Konsulent ser sina deltagares veckoavslutningar"
  ON sta_weekly_checkins FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM sta_enrollments e
    WHERE e.id = enrollment_id AND e.consultant_id = auth.uid()
  ));

-- =============================================================================
-- updated_at-triggers
-- =============================================================================
CREATE OR REPLACE FUNCTION update_sta_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sta_enrollments_updated_at ON sta_enrollments;
CREATE TRIGGER trg_sta_enrollments_updated_at BEFORE UPDATE ON sta_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_sta_updated_at();

DROP TRIGGER IF EXISTS trg_sta_activities_updated_at ON sta_activities;
CREATE TRIGGER trg_sta_activities_updated_at BEFORE UPDATE ON sta_activities
  FOR EACH ROW EXECUTE FUNCTION update_sta_updated_at();

DROP TRIGGER IF EXISTS trg_sta_assessments_updated_at ON sta_assessments;
CREATE TRIGGER trg_sta_assessments_updated_at BEFORE UPDATE ON sta_assessments
  FOR EACH ROW EXECUTE FUNCTION update_sta_updated_at();

DROP TRIGGER IF EXISTS trg_sta_workplaces_updated_at ON sta_workplaces;
CREATE TRIGGER trg_sta_workplaces_updated_at BEFORE UPDATE ON sta_workplaces
  FOR EACH ROW EXECUTE FUNCTION update_sta_updated_at();

DROP TRIGGER IF EXISTS trg_sta_documents_updated_at ON sta_documents;
CREATE TRIGGER trg_sta_documents_updated_at BEFORE UPDATE ON sta_documents
  FOR EACH ROW EXECUTE FUNCTION update_sta_updated_at();

DROP TRIGGER IF EXISTS trg_sta_quick_notes_updated_at ON sta_quick_notes;
CREATE TRIGGER trg_sta_quick_notes_updated_at BEFORE UPDATE ON sta_quick_notes
  FOR EACH ROW EXECUTE FUNCTION update_sta_updated_at();

-- =============================================================================
-- KOMMENTARER FÖR PSQL/INFORMATION_SCHEMA
-- =============================================================================
COMMENT ON TABLE sta_enrollments IS 'Deltagarens tilldelning till Steg till arbete-tjänsten';
COMMENT ON TABLE sta_activities IS 'Genomförda dagar, övningar och samtal i STA';
COMMENT ON TABLE sta_assessments IS 'Skattningar med arbetsterapeutiska instrument (DOA/WRI/MOHOST/AWP/AWC)';
COMMENT ON TABLE sta_workplaces IS 'Arbetsprövningsplatser (Del 3-4)';
COMMENT ON TABLE sta_documents IS 'Rapporter till AF (utkast och inskickade)';
COMMENT ON TABLE sta_quick_notes IS 'Snabbanteckningar med taggchips från konsulent eller deltagare';
COMMENT ON TABLE sta_pulse_checks IS 'Daglig energi/mood-check från deltagare';
COMMENT ON TABLE sta_weekly_checkins IS 'Veckoavslutning från deltagare (fredag eftermiddag)';
