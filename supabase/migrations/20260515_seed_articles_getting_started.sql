-- Seed kunskapsbanken: kategori getting-started (subcategory first-week)
-- 2026-05-15
--
-- Slutför task E1 (articleData → Supabase) för kategorin "Komma igång".
-- Artiklarna är granskade och omskrivna 2026-05-15 mot DESIGN.md §2 (Voice & Tone),
-- faktakontroll, och struktur (mjukare tempo för långtidsarbetslösa målgruppen).
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
  'Välkommen – så funkar portalen',
  'En lugn introduktion till vad du kan göra här och hur du börjar i din egen takt.',
  $body$Att söka jobb kan kännas mycket på en gång. Det är helt okej. Portalen finns för att gå bredvid dig – från första utkastet till första arbetsdagen – i den takt som funkar för dig idag.

## Vad finns här för dig?

**Ett CV du faktiskt vågar visa**
CV-byggaren hjälper dig formulera dina erfarenheter, även de du själv inte tycker "räknas". Du kan börja, spara, och fortsätta när du orkar.

**En guide till vad du tycker om**
Om du är osäker på vilken riktning du vill ta, finns intresseguiden. Den ställer enkla frågor och föreslår yrken som matchar – inte för att låsa dig, utan för att ge dig idéer.

**Jobb och ansökningar samlat**
Du kan söka bland tusentals annonser och spara de som intresserar dig. Allt du gör – sparade jobb, ansökningar, anteckningar – samlas på ett ställe.

**Artiklar och stöd när du behöver det**
Kunskapsbanken (där du är nu) har artiklar om CV-skrivning, intervjuer, avslag och välmående. Du behöver inte läsa allt – plocka det som känns relevant just idag.

Har du en arbetskonsulent kopplad till dig kan ni jobba tillsammans i portalen. Annars funkar allt lika bra på egen hand.

## Tre steg när du orkar

**1. Skapa en bild av dig själv**
Fyll i din profil och prova intresseguiden. Inget är låst – du kan ändra senare. Det här ger portalen underlag att anpassa förslag åt dig.

**2. Bygg ditt CV**
Öppna CV-byggaren när du har lite ork. Du behöver inte göra klart på en gång. Spara och fortsätt en annan dag om det är vad som funkar.

**3. Börja titta på jobb**
Sök, spara intressanta annonser. Du behöver inte söka direkt – många använder portalen i veckor innan de skickar in första ansökan, och det är helt rimligt.

## Något att ta med dig

Jobbsökning är ingen rak väg. Vissa dagar går det framåt, andra dagar är det tungt – båda är normalt och båda räknas som arbete.

> Att vara här, läsa det här, det är redan ett steg framåt.

Om något är otydligt, eller om du fastnar, finns hjälpknappen längst ner till höger. Och har du en arbetskonsulent: hen kan se vad du jobbar med och hjälpa till.$body$,
  'getting-started',
  'first-week',
  ARRAY['introduktion', 'komma igång', 'steg-för-steg', 'för-nybörjare'],
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
  'En lugn väg in – sju steg, ingen klocka',
  'Sju steg som tar dig från första inloggningen till första utkastet av en ansökan. Du bestämmer själv tempot.',
  $body$Det här är en checklista, inte ett schema. Det står "steg", inte "dag" – för det är inte sju dagar, det är sju steg du kan ta när orken finns. Vissa gör allt på en vecka, andra på en månad. Båda är rätt.

## Steg 1 – Landa i portalen

- Logga in
- Fyll i grundläggande profilinformation (namn, ort räcker att börja med)
- Ladda upp en profilbild om du vill (inget krav)
- Bläddra runt i menyn så du vet ungefär var saker finns

Tar oftast 10–20 minuter. Behöver inte göras klart på ett bett.

## Steg 2 – Hitta riktning

- Gör intresseguiden – ungefär 15 frågor som ger förslag på yrken som kan passa
- Läs "Välkommen – så funkar portalen" om du inte redan gjort det
- Bläddra runt i kunskapsbanken och bokmärk det som verkar intressant (du behöver inte läsa allt)

## Steg 3 – Samla underlag till CV:t

Innan du öppnar CV-byggaren, försök samla:

- Vilka utbildningar du har gått (även påbörjade, även enstaka kurser)
- Vilka jobb du haft – även korta, även sådana du själv tycker var "ingenting"
- Vad du gjort utanför arbete (volontär, vård av närstående, eget projekt)
- Kompetenser du tycker om att använda

Det är okej att lista mycket först och skala ner sedan.

## Steg 4 – Bygg utkast 1

- Öppna CV-byggaren
- Välj en mall som känns rätt visuellt (du kan byta senare)
- Fyll i avsnitten i den ordning som känns enklast – inget måste göras uppifrån och ner
- Spara

Du behöver inte vara klar. Ett utkast räcker.

## Steg 5 – Få ögon på det

- Har du en arbetskonsulent: dela CV:t med hen via portalen och be om kommentarer
- Har du ingen konsulent: be en vän eller anhörig läsa, eller använd AI-coachen som finns i portalen
- Gör justeringar du faktiskt håller med om – allt feedback behöver inte följas

## Steg 6 – Börja titta på jobb

- Sök efter jobb som matchar din riktning
- Spara annonser du tycker verkar intressanta – behöver inte vara perfekt match
- Många upptäcker yrken de inte tänkt på här

Det är värdefullt även om du inte söker ännu. Att se vilka roller som finns och vad de kräver är förberedelse i sig.

## Steg 7 – Första utkastet av en ansökan

När det känns rätt, inte innan:

- Välj en av dina sparade annonser
- Skriv ett personligt brev – mallar finns i portalen
- Spara ansökan som utkast

Att skicka in är ett separat steg. Många låter utkastet ligga några dagar, läser om, justerar, och skickar sedan. Det är klokt – inte att skjuta upp.

## Att ta med sig

**Tempo är personligt**
Det finns ingen "rätt" hastighet. Att vila är inte att stå still.

**Stöd finns**
Har du en arbetskonsulent: hen ser vad du jobbar med i portalen och kan hjälpa till. Har du ingen: AI-coachen och kunskapsbanken är dina följeslagare.

**Det är inte en linje**
Du kommer att gå tillbaka till tidigare steg. Justera CV:t en månad in. Göra om intresseguiden när din riktning klarnar. Det är inte misslyckande – det är hur det ska fungera.$body$,
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
