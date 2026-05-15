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
  'En orientering över portalens sex verktyg och kunskapsbas, och en rimlig ordning att börja i.',
  $body$Första gången man loggar in i en jobbportal vet man sällan vart man ska börja. Det finns sex sidor i menyn, alla har ikoner, och knapparna leder till knappar som leder till andra knappar. Den här artikeln är en kort orientering, så du slipper söka dig fram själv.

Portalen består av sex verktyg och en kunskapsbas — den du läser ur just nu.

**CV-byggaren** har tolv mallar. De spänner från strama, klassiska upplägg lämpade för förvaltning och bank, till mer formgivningstunga för kreativa branscher. Du fyller i avsnitten i den ordning du vill, byter mall mellan första och sista utkastet om du ångrar dig, och exporterar till PDF eller Word när det är klart. Det går att skriva in perioder av sjukskrivning, vård av barn eller eget företagande som egna poster — alltså inte luckor att gömma utan rader du fyller i som vad de är.

**Intresseguiden** är 34 frågor uppdelade i fyra delar: arbetsintressen, personlighet, intresseområden och förutsättningar. Det tar ungefär tjugo minuter att gå igenom allt, men svaren sparas automatiskt så du kan pausa och fortsätta senare. När du är klar får du yrkesförslag som matchar svaren. Förslag, inte facit — ingen algoritm kan säga säkert vad du borde bli. Men som startpunkt när riktningen är oklar fungerar guiden utmärkt.

**Jobbsöket** hämtar annonser från Arbetsförmedlingens databas, den största samlade jobbdatabasen i Sverige med annonser från både offentliga och privata arbetsgivare. Du söker på roll, ort, anställningsform och bransch, sparar de annonser som är intressanta och lägger till egna anteckningar.

**Ansökningstrackern** är en lista över allt du sökt. Varje ansökan kan ha en av elva statusar — från "intresserad" och "sparad" via "skickad", "intervju" och "erbjudande" till "tackat ja" eller "avslag". Du ser direkt vilka som väntar på svar, vilka som behöver en uppföljning, och vilka som är avslutade.

**Brevgeneratorn** använder din profil och en jobbannons för att föreslå ett första utkast till personligt brev. Du redigerar därifrån — formuleringarna är gjorda för att bytas ut, inte skickas in som de står.

**AI-teamet** är fem chatt-agenter med olika inriktning: en arbetskonsulent (CV-feedback, jobbstrategi), en arbetsterapeut (energi, stresshantering), en studievägledare (karriärvägar, utbildningar), en motivationscoach (mål och motgångar) och en digitalcoach (LinkedIn, online-närvaro). Du skriver in en fråga och får svar som utgår från din profil och vad du gjort i portalen tidigare.

**Kunskapsbasen** har 282 artiklar om jobbsökning, intervjuer, lön, rättigheter, välmående och liknande. Sökbar, kan filtreras på kategori och svårighetsgrad.

## I vilken ordning

Det finns ingen tvingande ordning, men ungefär så här rör sig de flesta första gången:

1. **Profil.** Namn, ort, kontaktuppgifter, ett par meningar om vad du gjort senast. Tio minuter.
2. **Intresseguide** om du är osäker på riktning. Annars hoppa över.
3. **CV.** Börja med utbildning och tidigare jobb. Kompetenser, språk och övriga avsnitt får komma senare — det är lättare när det grova står på plats.
4. **Sök ett jobb** för att se hur flödet fungerar. Du behöver inte söka direkt; det räcker som introduktion till resten av portalen.
5. **Spara två-tre annonser** och börja på ett personligt brev till en av dem.

Det är inte ett schema. Vissa sveper igenom på en eftermiddag, andra tar veckor. Båda är rimliga.

Har du en arbetskonsulent kopplad till dig ser hen vad du jobbar med och kan kommentera. Saknar du konsulent finns AI-teamet, och kunskapsbasens 282 artiklar täcker det allra mesta.$body$,
  'getting-started',
  'first-week',
  ARRAY['introduktion', 'komma igång', 'orientering', 'för-nybörjare'],
  5,
  'easy',
  'low',
  ARRAY['cv-grunder', 'intresseguide-intro', 'hantera-avslag'],
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
- Generera ett brevutkast med Brevgeneratorn
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
