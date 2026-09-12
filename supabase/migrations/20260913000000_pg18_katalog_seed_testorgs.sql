-- PG18 (persona-genomgång 2026-09-12): aktivitetskatalogen var tom i prod — 0 rader
-- i activity_catalog_items för ALLA organisationer. KM8 byggde tabellen, RLS:en och
-- fliken, men ingen katalogpost skrevs någonsin; schemamallen "Jobbsökarverkstad
-- 15 h (test)" och Demokommuns mall bär aktiviteterna som schemamallposter
-- (activity_template_items), inte som katalogposter. Fliken visade därför "Inga
-- aktiviteter i katalogen än" fast planen "använde" aktiviteterna.
--
-- Den här migrationen seedar katalogen för de två TESTorganisationerna ur deras
-- egna schemamallar: en katalogpost per unik (titel, typ, plats, tid), utan veckodag
-- (en verkstad måndag–fredag 9–12 är ETT utbud, inte fem). Ägare = mallens ägare.
-- Riktiga kommuner seedas inte här — de lägger in sitt utbud själva (chef) eller
-- via "Hämta ur schemamall" (kvar att bygga, se roadmap PG18).
--
-- Testkommun: 11111111-1111-4111-8111-111111111111 (mallen har org_id NULL men ägs
-- av km-konsulent 2c0a3a35-…, chef i Testkommun). Demokommun: 22222222-…, reset_demo_org()
-- raderar demots rader nattligen — katalogposterna för Demokommun bör därför även in i
-- seed_demo_org() (rapporterat, inte gjort här: den funktionen ägs av demomigrationen).
--
-- Idempotent: hoppar över poster som redan finns med samma org+titel+typ.
-- Torrkörning 2026-09-13: 0 katalogposter före; mallposter 5 (Testkommun) + 4 (Demokommun)
-- → 1 + 4 unika utbud.

INSERT INTO activity_catalog_items (org_id, owner_id, title, activity_type, location, start_time, end_time, description)
SELECT DISTINCT
  '11111111-1111-4111-8111-111111111111'::uuid,
  t.owner_id,
  i.title,
  i.activity_type,
  i.location,
  i.start_time,
  i.end_time,
  'Ur schemamallen "' || t.name || '" (seedad 2026-09-13, PG18).'
FROM activity_template_items i
JOIN activity_templates t ON t.id = i.template_id
WHERE t.id = '125036ef-3072-480c-8321-1d460144367a'
  AND NOT EXISTS (
    SELECT 1 FROM activity_catalog_items c
    WHERE c.org_id = '11111111-1111-4111-8111-111111111111' AND c.title = i.title AND c.activity_type = i.activity_type
  );

INSERT INTO activity_catalog_items (org_id, owner_id, title, activity_type, location, start_time, end_time, description)
SELECT DISTINCT
  t.org_id,
  t.owner_id,
  i.title,
  i.activity_type,
  i.location,
  i.start_time,
  i.end_time,
  'Ur schemamallen "' || t.name || '" (seedad 2026-09-13, PG18).'
FROM activity_template_items i
JOIN activity_templates t ON t.id = i.template_id
WHERE t.org_id = '22222222-2222-4222-8222-222222222222'
  AND NOT EXISTS (
    SELECT 1 FROM activity_catalog_items c
    WHERE c.org_id = t.org_id AND c.title = i.title AND c.activity_type = i.activity_type
  );

-- Verifiering: select org_id, count(*) from activity_catalog_items group by 1;  → 1 + 4
