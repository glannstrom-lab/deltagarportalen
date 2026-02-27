-- ============================================
-- Migration: Lägg till RLS policies för cv_versions
-- ============================================

-- RLS POLICIES - CV Versioner
-- ============================================

-- Användare kan se sina egna CV-versioner
CREATE POLICY "Users can view own CV versions" ON cv_versions
  FOR SELECT USING (auth.uid() = user_id);

-- Användare kan skapa sina egna CV-versioner
CREATE POLICY "Users can create own CV versions" ON cv_versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Användare kan uppdatera sina egna CV-versioner
CREATE POLICY "Users can update own CV versions" ON cv_versions
  FOR UPDATE USING (auth.uid() = user_id);

-- Användare kan ta bort sina egna CV-versioner
CREATE POLICY "Users can delete own CV versions" ON cv_versions
  FOR DELETE USING (auth.uid() = user_id);

-- Konsulenter kan se sina tilldelade deltagares CV-versioner
CREATE POLICY "Consultants can view participant CV versions" ON cv_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = cv_versions.user_id 
      AND consultant_id = auth.uid()
    )
  );
