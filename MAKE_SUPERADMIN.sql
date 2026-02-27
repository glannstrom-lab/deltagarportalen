-- Göra dig till Superadmin
-- BYT UT EMAIL NEDAN MOT DIN RIKTIGA EMAIL:

UPDATE profiles 
SET role = 'SUPERADMIN' 
WHERE email = 'din-email@example.com';
