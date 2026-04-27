-- Add template field to cover_letters table
-- This allows users to save their template preference with each letter

ALTER TABLE cover_letters
ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'professional';

-- Add comment for documentation
COMMENT ON COLUMN cover_letters.template IS 'Visual template ID for the cover letter (professional, modern, minimal, executive)';
