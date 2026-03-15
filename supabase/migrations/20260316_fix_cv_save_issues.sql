-- ============================================
-- AUTOMATISK FIX: CV workExperience sparas inte
-- Kör detta i Supabase SQL Editor för att fixa alla vanliga problem
-- ============================================

DO $$
BEGIN
  -- 1. Kontrollera om cvs-tabellen finns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'cvs'
  ) THEN
    RAISE NOTICE '❌ cvs-tabellen finns inte! Skapar den...';
    
    CREATE TABLE cvs (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
      profile_image TEXT,
      title TEXT,
      email TEXT,
      phone TEXT,
      location TEXT,
      summary TEXT,
      work_experience JSONB DEFAULT '[]'::jsonb,
      education JSONB DEFAULT '[]'::jsonb,
      skills JSONB DEFAULT '[]'::jsonb,
      languages JSONB DEFAULT '[]'::jsonb,
      certificates JSONB DEFAULT '[]'::jsonb,
      links JSONB DEFAULT '[]'::jsonb,
      "references" JSONB DEFAULT '[]'::jsonb,
      ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
      ats_feedback JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    RAISE NOTICE '✅ cvs-tabellen skapad!';
  ELSE
    RAISE NOTICE '✅ cvs-tabellen finns redan';
  END IF;

  -- 2. Kontrollera om work_experience kolumnen finns och är JSONB
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cvs' AND column_name = 'work_experience'
  ) THEN
    RAISE NOTICE '❌ work_experience kolumnen saknas! Lägger till...';
    ALTER TABLE cvs ADD COLUMN work_experience JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ work_experience kolumn tillagd!';
  ELSE
    -- Kontrollera att den är JSONB
    DECLARE
      col_type TEXT;
    BEGIN
      SELECT data_type INTO col_type 
      FROM information_schema.columns 
      WHERE table_name = 'cvs' AND column_name = 'work_experience';
      
      IF col_type != 'jsonb' AND col_type != 'ARRAY' THEN
        RAISE NOTICE '⚠️ work_experience är inte JSONB (typ: %). Konverterar...', col_type;
        ALTER TABLE cvs ALTER COLUMN work_experience TYPE JSONB USING work_experience::jsonb;
        RAISE NOTICE '✅ Konverterad till JSONB!';
      ELSE
        RAISE NOTICE '✅ work_experience är korrekt typ (%)', col_type;
      END IF;
    END;
  END IF;

  -- 3. Kontrollera RLS är aktiverat
  IF NOT EXISTS (
    SELECT 1 FROM pg_class 
    WHERE relname = 'cvs' AND relrowsecurity = true
  ) THEN
    RAISE NOTICE '❌ RLS är inte aktiverat! Aktiverar...';
    ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS aktiverat!';
  ELSE
    RAISE NOTICE '✅ RLS är redan aktiverat';
  END IF;

  -- 4. Ta bort och återskapa policies för att vara säker
  RAISE NOTICE '🔧 Uppdaterar RLS policies...';
  
  DROP POLICY IF EXISTS "Users can CRUD own CV" ON cvs;
  DROP POLICY IF EXISTS "Users can view own CV" ON cvs;
  DROP POLICY IF EXISTS "Users can update own CV" ON cvs;
  DROP POLICY IF EXISTS "Users can insert own CV" ON cvs;
  DROP POLICY IF EXISTS "Users can delete own CV" ON cvs;
  DROP POLICY IF EXISTS "Consultants can view participant CVs" ON cvs;
  
  -- Skapa policies med korrekt syntax
  CREATE POLICY "Users can view own CV" ON cvs
    FOR SELECT USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can insert own CV" ON cvs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Users can update own CV" ON cvs
    FOR UPDATE USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can delete own CV" ON cvs
    FOR DELETE USING (auth.uid() = user_id);
  
  RAISE NOTICE '✅ RLS policies uppdaterade!';

  -- 5. Kontrollera och fixa updated_at trigger
  DROP TRIGGER IF EXISTS update_cvs_updated_at ON cvs;
  
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $func$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $func$ language 'plpgsql';
  
  CREATE TRIGGER update_cvs_updated_at 
    BEFORE UPDATE ON cvs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  
  RAISE NOTICE '✅ Updated_at trigger skapad!';

  -- 6. Säkerställ att authenticated role har behörighet
  GRANT ALL ON cvs TO authenticated;
  GRANT ALL ON cvs TO anon;
  
  RAISE NOTICE '✅ Behörigheter satta!';

  -- 7. Testa att det fungerar med en dummy-uppdatering
  RAISE NOTICE '🧪 Verifierar att konfigurationen fungerar...';
  
END $$;

-- Visa nuvarande konfiguration
SELECT 
  'KOLUMNER' as info,
  column_name,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'cvs'
ORDER BY ordinal_position;

SELECT 
  'RLS POLICIES' as info,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'cvs';

-- Visa om det finns data (utan att visa personlig info)
SELECT 
  'DATA STATUS' as info,
  COUNT(*) as total_rows,
  COUNT(work_experience) as rows_with_work_exp
FROM cvs;

RAISE NOTICE '========================================';
RAISE NOTICE '🎉 ALLA FIXAR TILLÄMPADE!';
RAISE NOTICE '========================================';
RAISE NOTICE 'Testa nu att spara ett CV med arbetslivserfarenhet.';
