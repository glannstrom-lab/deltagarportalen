-- ============================================
-- Migration: Lägg till bio och location kolumner i profiles
-- ============================================

-- Lägg till bio-kolumn om den inte finns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'bio'
    ) THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT;
        RAISE NOTICE 'Added bio column to profiles';
    ELSE
        RAISE NOTICE 'bio column already exists';
    END IF;
END $$;

-- Lägg till location-kolumn om den inte finns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'location'
    ) THEN
        ALTER TABLE profiles ADD COLUMN location TEXT;
        RAISE NOTICE 'Added location column to profiles';
    ELSE
        RAISE NOTICE 'location column already exists';
    END IF;
END $$;

-- Verifiera att kolumnerna finns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
