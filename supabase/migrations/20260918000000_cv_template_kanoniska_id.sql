-- Kanoniska mall-id i cvs.template och cv_versions.data->>'template'.
--
-- BAKGRUND (mätt 2026-09-18). Tre generationer har skrivit till kolumnen.
-- 7 av 33 CV:n bar ett id som inte finns bland de tolv i
-- `client/src/data/cvMallar.ts`: 4 × 'modern' (kolumnens egen DEFAULT, och
-- `CVBuilder`s starttillstånd), 1 × 'centrerad', 1 × 'sidokolumn' (svenska
-- visningsnamn sparade som id) och 1 × 'classic' (den gamla väljaren).
--
-- EFFEKTEN I DRIFT: `CVPrintLayout` föll på default-grenen (ModernTemplate,
-- som HAR en sidopanel) medan uppslaget `SIDEBAR_CONFIG[<okänt id>]` gav
-- `undefined` → panelens bakgrund målades aldrig. Panelen slutade där
-- innehållet tog slut i stället för att gå till papperskanten, och på
-- flersidiga CV:n saknade sida 2 och framåt panel helt. Verifierat i prod
-- genom print-vägen: `template=sidebar` gav `html{background:linear-gradient}`,
-- `template=modern` gav `none`.
--
-- Koden normaliserar numera vid varje gräns (`normaliseraMallId`), så den här
-- migrationen behövs inte för att rendera rätt — den städar datan så att
-- mallväljaren markerar rätt kort och filtret i "Dina CV" hittar dem.
--
-- 'classic' → 'centered' är ett omdöme: mallen hette "Klassisk" i den gamla
-- väljaren, och dagens 'centered' beskrivs som "Klassisk navy-header … Tidlös".
-- De övriga fyra är entydiga.

-- 1. Kolumnens DEFAULT var 'modern' (migration 005) — ett id som aldrig funnits
--    bland mallarna. Varje rad som skapades utan explicit mall blev alltså fel.
ALTER TABLE cvs ALTER COLUMN template SET DEFAULT 'sidebar';

-- 2. Befintliga rader.
UPDATE cvs
SET template = CASE template
    WHEN 'modern'     THEN 'sidebar'
    WHEN 'sidokolumn' THEN 'sidebar'
    WHEN 'centrerad'  THEN 'centered'
    WHEN 'classic'    THEN 'centered'
    WHEN 'nordisk'    THEN 'nordic'
    ELSE template
  END
WHERE template IN ('modern', 'sidokolumn', 'centrerad', 'classic', 'nordisk');

-- 3. Sparade CV-versioner bär samma id inne i sin jsonb (1 × 'modern').
UPDATE cv_versions
SET data = jsonb_set(
      data,
      '{template}',
      to_jsonb(
        CASE data->>'template'
          WHEN 'modern'     THEN 'sidebar'
          WHEN 'sidokolumn' THEN 'sidebar'
          WHEN 'centrerad'  THEN 'centered'
          WHEN 'classic'    THEN 'centered'
          WHEN 'nordisk'    THEN 'nordic'
        END
      )
    )
WHERE data->>'template' IN ('modern', 'sidokolumn', 'centrerad', 'classic', 'nordisk');

-- Ingen CHECK-villkor med flit: en sträng utanför listan ska rendera fel mall,
-- inte få sparningen att kasta och användaren att förlora sitt arbete.
-- Normaliseringen i koden är skyddet; grinden `cvMallar.test.ts` är vakten.
