-- Seed kunskapsbanken: kategori getting-started (subcategory first-week)
-- 2026-05-15 (uppdaterad efter fakta + språkpass)
--
-- Slutför task E1 (articleData → Supabase) för kategorin "Komma igång".
-- Artiklarna är skrivna 2026-05-15 i tre steg: faktagranskning, fyllig skrivning,
-- språkpass mot AI-prosa.
--
-- Källa: client/src/services/articleData.ts (samma slug, identiskt innehåll).
-- ON CONFLICT-uppdatering så att den här kan köras flera gånger utan duplicering.

INSERT INTO articles (
  slug, title, summary, content,
  category_key, subcategory, tags,
  reading_time, difficulty, energy_level,
  related_article_slugs, related_exercise_slugs, related_tools,
  checklist, actions,
  author, author_title,
  is_active, sort_order
) VALUES
(
  'komma-igang-intro',
  'Komma igång – så funkar portalen',
  'En kort orientering över portalens verktyg och en rimlig ordning att börja i.',
  $body$Här är en orientering över portalens verktyg och en rimlig ordning att börja i. Du behöver inte göra allt på en gång.

Portalen är uppdelad i fem områden i navigeringen: **Översikt**, **Söka jobb**, **Karriär**, **Resurser** och **Min vardag**.

## Verktygen i korthet

- **CV-byggaren** — tolv mallar, export till PDF eller Word. *Söka jobb → CV*.
- **Personligt brev** — AI föreslår ett första utkast utifrån din profil och en jobbannons. *Söka jobb → Personligt brev*.
- **Hitta jobb** — söker i Arbetsförmedlingens databas. *Söka jobb → Hitta jobb*.
- **Mina ansökningar** — lista över sökta jobb med elva statussteg. *Söka jobb → Mina ansökningar*.
- **Intresseguiden** — 34 frågor som ger förslag på yrken. *Karriär → Intresseguide*.
- **AI-teamet** — fem chatt-agenter för CV-feedback, energi, karriärval, motivation och LinkedIn. *Resurser → AI-team*.
- **Kunskapsbasen** — knappt 300 artiklar om jobbsökning, intervjuer, lön, välmående. *Resurser → Kunskapsbank*.

## En rimlig ordning att börja i

1. **Profil.** Namn, ort, kontakt, ett par meningar om vad du gjort senast. Tio minuter.
2. **Intresseguide** om du är osäker på yrkesriktning. Annars hoppa över.
3. **CV.** Börja med utbildning och tidigare jobb.
4. **Hitta jobb** för att bekanta dig med flödet. Du behöver inte söka direkt.
5. **Spara två-tre annonser** och börja på ett personligt brev till en av dem.

> Det är inte ett schema. Vissa sveper igenom på en eftermiddag, andra tar veckor. Båda är rimliga.

---

Har du en arbetskonsulent kopplad till dig ser hen vad du jobbar med och kan kommentera. Saknar du konsulent finns AI-teamet, och artiklarna i kunskapsbasen täcker det allra mesta.$body$,
  'getting-started',
  'first-week',
  ARRAY['introduktion', 'komma igång', 'orientering', 'för-nybörjare'],
  3,
  'easy',
  'low',
  ARRAY['cv-grunder', 'upptack-dina-styrkor', 'hantera-avslag'],
  ARRAY['jobb-jag', 'cv-masterclass', 'jobbsokarstrategier'],
  ARRAY['/cv-builder', '/interest-guide'],
  '[
    {"id":"1","text":"Skapa konto i portalen"},
    {"id":"2","text":"Fyll i din profil"},
    {"id":"3","text":"Gör intresseguiden"},
    {"id":"4","text":"Bygg ditt första CV"},
    {"id":"5","text":"Sök ditt första jobb"}
  ]'::jsonb,
  '[
    {"label":"Gör intresseguiden","href":"/interest-guide","type":"primary"},
    {"label":"Skapa CV","href":"/cv-builder","type":"secondary"}
  ]'::jsonb,
  'Maria Lindqvist',
  'Arbetskonsulent',
  TRUE,
  10
),
(
  'forsta-veckan-checklista',
  'Komma igång – checklista i sju steg',
  'En arbetsgång från första inloggningen till första ansökan. Ingen tidsplan – du tar stegen när du orkar.',
  $body$En checklista, inte ett schema. Sju steg, ingen tidsplan. Vissa gör allt på några dagar, andra på en månad — båda fungerar.

## 1. Profil

Logga in. Fyll i namn, ort, kontaktuppgifter. Skriv ett par meningar om vad du gjort senast: jobb, studier, period av sjukskrivning, vård av barn — vad det än är. Profilbild om du vill. Tio minuter, kanske femton.

## 2. Intresseguide

Hoppa över om du redan vet vilket yrke du söker. Annars: 34 frågor över fyra teman — arbetsintressen, personlighet, intresseområden, förutsättningar. Svaren sparas automatiskt, så du kan pausa och fortsätta senare. Räkna med tjugo minuter om du gör allt på en gång.

## 3. Underlag till CV

Innan du öppnar CV-byggaren, sätt dig ned och samla:

- **Utbildningar** — även påbörjade, även enstaka kurser, även folkhögskola
- **Jobb** — även korta vikariat, även sommarjobb från gymnasiet, även det där säsongsjobbet du nästan glömt
- **Det utanför arbetet** — volontär, vård av närstående, eget projekt, föreningsuppdrag, period av sjukskrivning, vad det än varit
- **Kompetenser** du faktiskt använder och vill fortsätta använda

Lista mycket först. Skala ner senare. Det är lättare att ta bort än att tillägga.

## 4. Utkast av CV

Öppna CV-byggaren. Välj en av de tolv mallarna — den kan bytas. Fyll i avsnitten i den ordning som känns enklast; du måste inte börja med "Personliga egenskaper" bara för att den ligger överst. Spara.

Ett utkast räcker just nu. Att putsa kommer i nästa steg.

## 5. Få ögon på CV:t

Är du kopplad till en arbetskonsulent — dela CV:t via portalen och be om kommentarer.

Saknar du konsulent — fråga en vän eller anhörig om de kan läsa, eller gå till AI-teamet, välj Arbetskonsulent-agenten, och be om CV-feedback.

Behåll det du håller med om. Strunta i resten.

## 6. Sök efter jobb

Sök på roll och ort. Spara annonser som verkar intressanta. Spara också annonser för roller du undrar över men aldrig sökt — det är ofta där man hittar yrken man inte tänkt på.

Att läsa vad rekryterare faktiskt skriver är värdefullt även om du inte söker än. Du lär dig vilka ord och kompetenser de letar efter, och det smyger sig in i hur du formulerar din egen profil.

## 7. Första ansökan

När det känns rätt:

- Välj en av de sparade annonserna
- Öppna **Personligt brev** och låt AI:n föreslå ett första utkast utifrån din profil och annonsen
- Redigera så det låter som du, inte som en mall
- Läs igenom en gång till

Vänta gärna en dag innan du skickar. Då hittar du stavfel och meningar som låter konstigt — sådant som är osynligt direkt efter att man skrivit det.$body$,
  'getting-started',
  'first-week',
  ARRAY['checklista', 'komma igång', 'steg-för-steg', 'praktiskt'],
  6,
  'easy',
  'low',
  ARRAY['komma-igang-intro', 'cv-grunder'],
  ARRAY['cv-masterclass', 'jobb-jag', 'tidsplanering'],
  ARRAY['/cv-builder'],
  '[]'::jsonb,
  '[]'::jsonb,
  NULL,
  NULL,
  TRUE,
  20
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  content = EXCLUDED.content,
  tags = EXCLUDED.tags,
  reading_time = EXCLUDED.reading_time,
  difficulty = EXCLUDED.difficulty,
  energy_level = EXCLUDED.energy_level,
  related_article_slugs = EXCLUDED.related_article_slugs,
  related_exercise_slugs = EXCLUDED.related_exercise_slugs,
  related_tools = EXCLUDED.related_tools,
  checklist = EXCLUDED.checklist,
  actions = EXCLUDED.actions,
  is_active = TRUE,
  updated_at = NOW();
