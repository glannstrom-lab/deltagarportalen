-- Sätt alla roller på din användare
-- BYT UT 'din-email@example.com' mot din faktiska e-postadress

-- Alternativ 1: Om du vet din e-postadress (byt ut nedan)
UPDATE profiles 
SET roles = ARRAY['USER', 'CONSULTANT', 'ADMIN', 'SUPERADMIN'],
    active_role = 'SUPERADMIN',
    role = 'SUPERADMIN'  -- Bakåtkompatibel
WHERE email = 'din-email@example.com';

-- Alternativ 2: Om du vill uppdatera alla användare som redan är SUPERADMIN
-- UPDATE profiles 
-- SET roles = ARRAY['USER', 'CONSULTANT', 'ADMIN', 'SUPERADMIN'],
--     active_role = 'SUPERADMIN'
-- WHERE role = 'SUPERADMIN';

-- Verifiera att uppdateringen fungerade
SELECT email, first_name, role, roles, active_role 
FROM profiles 
WHERE email = 'din-email@example.com';
