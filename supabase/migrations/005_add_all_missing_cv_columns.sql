-- ============================================
-- Migration: Lägg till ALLA saknade kolumner i cvs-tabellen
-- ============================================

-- Lägg till template kolumn
ALTER TABLE cvs 
ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'modern';

-- Lägg till color_scheme kolumn
ALTER TABLE cvs 
ADD COLUMN IF NOT EXISTS color_scheme TEXT DEFAULT 'indigo';

-- Lägg till font kolumn  
ALTER TABLE cvs 
ADD COLUMN IF NOT EXISTS font TEXT DEFAULT 'inter';

-- Lägg till first_name kolumn
ALTER TABLE cvs 
ADD COLUMN IF NOT EXISTS first_name TEXT;

-- Lägg till last_name kolumn
ALTER TABLE cvs 
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Verifiera att alla kolumner finns
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'cvs' 
ORDER BY ordinal_position;
