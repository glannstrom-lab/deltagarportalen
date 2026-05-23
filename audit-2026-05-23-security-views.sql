-- Test 1: As the consultant — should see their 2 assigned participants
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"eef3d71f-518d-40d9-9098-79983fae2c59","role":"authenticated"}';
SELECT 'TEST1: consultant sees own participants' AS test,
       count(*) AS rows_visible,
       array_agg(participant_id) AS participants
FROM consultant_dashboard_participants;
ROLLBACK;

-- Test 2: As an unrelated user — must see 0 rows (this was the leak)
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"00bc4a3d-6759-413d-8796-be18a99b7d47","role":"authenticated"}';
SELECT 'TEST2: unrelated user' AS test,
       count(*) AS rows_visible
FROM consultant_dashboard_participants;
ROLLBACK;

-- Test 3: As a participant (assigned to consultant, but not themselves a consultant) — must see 0
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"f27172e0-8499-4e3c-9fdb-1690d45d3cae","role":"authenticated"}';
SELECT 'TEST3: participant of the consultant' AS test,
       count(*) AS rows_visible
FROM consultant_dashboard_participants;
ROLLBACK;

-- Test 4: As the consultant — verify they can read assigned participants' profiles via RLS
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"eef3d71f-518d-40d9-9098-79983fae2c59","role":"authenticated"}';
SELECT 'TEST4: consultant reads participant profile via RLS' AS test,
       count(*) AS profiles_visible
FROM profiles
WHERE id IN ('f27172e0-8499-4e3c-9fdb-1690d45d3cae', '695f3336-176e-4961-bef2-20ccdb4d4a4e');
ROLLBACK;

-- Test 5: As unrelated user — verify they CAN'T read those profiles
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"00bc4a3d-6759-413d-8796-be18a99b7d47","role":"authenticated"}';
SELECT 'TEST5: unrelated user reads participant profiles directly' AS test,
       count(*) AS profiles_visible
FROM profiles
WHERE id IN ('f27172e0-8499-4e3c-9fdb-1690d45d3cae', '695f3336-176e-4961-bef2-20ccdb4d4a4e');
ROLLBACK;

-- Test 6: user_consent_status — caller sees their own row only
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"eef3d71f-518d-40d9-9098-79983fae2c59","role":"authenticated"}';
SELECT 'TEST6: user_consent_status returns own row' AS test,
       count(*) AS rows_visible,
       array_agg(user_id) AS user_ids
FROM user_consent_status;
ROLLBACK;
