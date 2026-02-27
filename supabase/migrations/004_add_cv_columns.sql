-- ============================================
-- Migration: Lägg till saknade kolumner i cvs-tabellen
-- ============================================

-- Lägg till color_scheme kolumn
ALTER TABLE cvs 
ADD COLUMN IF NOT EXISTS color_scheme TEXT DEFAULT 'indigo';

-- Lägg till font kolumn  
ALTER TABLE cvs 
ADD COLUMN IF NOT EXISTS font TEXT DEFAULT 'inter';

-- Uppdatera updated_at trigger om den saknas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Säkerställ att trigger finns
DROP TRIGGER IF EXISTS update_cvs_updated_at ON cvs;
CREATE TRIGGER update_cvs_updated_at 
  BEFORE UPDATE ON cvs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
