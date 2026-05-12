-- Add `program` column to profiles for project assignment
-- Used by both consultants and participants. Single-select (null = no project).
-- Sidor som villkoras på detta värde tillkommer i en senare migration.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS program TEXT
  CHECK (program IS NULL OR program IN ('steg_till_arbete', 'rusta_och_matcha'));

COMMENT ON COLUMN profiles.program IS
  'Aktuellt arbetsmarknadsprojekt för konsulent/deltagare. NULL = inget valt. Värden: steg_till_arbete, rusta_och_matcha.';
