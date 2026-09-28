# Skarpt funktionstest — område kommun — prod 2026-09-28/29

## 1. Konton, mutationer, städning

**Konton:** `demo@jobin.se` (org-roll chef, profilroll CONSULTANT — samma `/consultant`-UI som
konsulent, "Demo Konsulent"), `hanna.handlaggare.demo@example.com` (Handläggare, ekonomiskt
bistånd), deltagarna **Anna Exempel** (`22222222-…-002`) och **Omar Demo** (`22222222-…-003`),
alla i "Demokommun (påhittade personer)". Inloggning via engångslänk (`/#/visa-som`,
`e2e/rollspel-2026-09-28.cjs` — samma körare som gårdagens rollspel, nya stegfiler
`e2e/skarpt-2026-09-28-kommun-*.cjs` (kopior i scratchpad, se nedan). Inga egna AI-anrop gjordes
(AI är av i demot; rörde inte AI-brytaren).

**Muterat (demot nollställs i natt, allt kvarstående är avsiktligt kvar för att visa flödet):**
- Ny aktivitetsplan för Omar ur "Demomall: jobbsökning + motivation" (28 sep–20 dec, 48→47 pass
  efter en borttagning).
- Ett pass redigerat enskilt (28 sep, plats "SKK-testlokal (ändrad)"), en serie redigerad
  ("det här och alla kommande", Motivationsgrupp → "Grupprum 2 (serie ändrad)", 4 pass), ett pass
  borttaget (8 okt Praktikbesök).
- Närvaro markerad på sex pass: `present` (28 sep), `absent_valid` (29 sep), `absent_invalid`
  (30 sep), `sick_certified` **med** intyg (1 okt), `sick_certified` **utan** intyg (5 okt),
  `external` (6 okt).
- Omar: en journalanteckning skapad och redigerad (ändringslogg verifierad), ett mål skapat,
  ändrat till "pågående" och sedan borttaget, ett videomöte bokat (9 okt 10:00), ett meddelande
  skickat till Omar och besvarat av Omar, en frånvaro anmäld i förväg (13 okt, sjuk), en
  ogiltig-frånvaro-förklaring skickad av Omar (30 sep). Ett extra testpass för incheckning
  skapat, incheckat av Omar, kvitterat av konsulenten och **städat bort** igen.
- Anna: två nya underlag till Hanna lämnade (den nya handläggarlistan) — det ena **ångrat**
  samma dag (avsiktlig dubblettstädning, se SKK3), det andra **kvitterat av Hanna**. Ett tredje
  kort testunderlag på Omar för att verifiera PDF-nedladdningen, **ångrat** direkt efteråt.
- Fyra rapporter nedladdade och kontrollerade: nyckeltal (CSV), IVO-kvartalsunderlag (TSV),
  konsultrapport (PDF), nämndrapport (PDF), månadsunderlag för Omar (PDF).

**Rört ingenting av:** AI-brytaren (läst: av för organisationen, ej ändrad), en riktig
överlämning (dialogen öppnades under gårdagens rollspel, inte idag — se KH/CH-fynden i
`docs/review-2026-09-28-rollspel/`), kollegors konton, andra deltagare än Anna/Omar.

**Städat:** testmålet (skapat → borttaget), testpasset för incheckning (skapat → borttaget),
dubblett-underlaget (skapat → ångrat), PDF-provunderlaget på Omar (skapat → ångrat).

---

## 2. Testmatris

| Funktion | Utfall |
|---|---|
| Skapa aktivitetsplan ur mall | ✅ |
| Redigera ett enskilt pass | ✅ |
| Redigera en serie ("det här och alla kommande") | ✅ |
| Flytta ett pass/en serie till annan dag | ⏭ **finns inte** — `AndraPassDialog` har inget datumfält; redan känt (ROADMAP: "flytta en serie till annan veckodag" under "Kvar av förslagen") |
| Ta bort ett pass | ✅ |
| Deltagaren ser planen i Min vecka | ✅ |
| Deltagaren checkar in ("Jag är här") | ✅ |
| Deltagaren anmäler frånvaro i förväg | ✅ (konsulenten fick notis direkt) |
| Deltagaren förklarar en ogiltig frånvaro i efterhand | ✅ (konsulenten fick notis + ser förklaringen på passet) |
| Konsulenten markerar närvarande | ✅ |
| Konsulenten markerar giltig frånvaro | ✅ |
| Konsulenten markerar ogiltig frånvaro | ✅ (men se SKK2 — spammar notis vid omklick) |
| Konsulenten markerar sjuk med intyg | ✅ |
| Konsulenten markerar sjuk utan intyg | ✅ |
| Konsulenten markerar extern aktivitet | ✅ |
| Lämna underlag — välj handläggare ur lista (nytt) | ✅ |
| Hanna ser "Underlag till dig" | ✅, inklusive andra konsulenters underlag (org-brett) |
| Hanna kvitterar | ✅ |
| Konsulenten ser "kvitterat" efteråt | ✅ |
| Ladda ner underlagspaket-PDF | ✅ men **bara i själva ögonblicket** — se SKK5 |
| Ångra underlag samma dag | ✅, kräver en orsak, syns i historiken med orsak |
| Journal: skriv | ✅ |
| Journal: redigera | ✅ |
| Journal: ändringslogg | ✅ — visar original + ändring, vem, när |
| Mål: skapa | ✅ men se SKK1 (listan uppdateras inte alltid direkt) |
| Mål: uppdatera status | ✅, direkt |
| Mål: ta bort | ✅, direkt |
| Möte: boka | ✅ |
| Möte syns i Min vecka/Min konsulent hos deltagaren | ✅ (båda ställena, dator och mobil) |
| Meddelande konsulent → deltagare | ✅ + notis hos mottagaren |
| Meddelande deltagare → konsulent | ✅ + notis hos mottagaren |
| Rapporter: nyckeltal | ✅ |
| Rapporter: omfångsraden (ny idag) | ✅ **stämmer** — texten säger exakt vilka mått som är egna vs. hela enheten, och siffrorna matchar (se nedan) |
| IVO-underlag (TSV) | ✅, siffror stämmer mot markeringarna |
| Nämndrapport (PDF) | ✅, siffror verifierade rad för rad mot mina egna markeringar (se avsnitt 5) |
| Månadsunderlag (PDF) | ✅ |
| Konsultrapport (PDF) | ✅ |
| CSV-export | ✅ |
| Organisation: kollegor | ✅ läst |
| Organisation: caseload | ✅ läst, siffror stämmer |
| Organisation: överlämning | ⏭ ej utfört (instruktion: gör INTE en riktig överlämning) |
| AI-brytaren | ✅ läst (av), ej ändrad |
| Mobilrunda (Min vecka, Min konsulent, deltagare) | ✅ stickprov, inga mobilspecifika fel |

**43 prövade: 39 ✅ / 0 ❌ / 2 ⚠️ (SKK1, SKK2 nedan) / 2 ⏭ (flytta-funktionen finns inte; överlämning uteslöts med flit).**

---

## 3. Buggar

Inga kritiska eller höga. Två medel, en låg-medel, en låg-confidence-observation.

### Medel

**SKK1 — Ett nytt mål syns inte i listan direkt efter "Skapa mål"; kräver att man lämnar sidan och kommer tillbaka.**
*Repro:* Som konsulent, öppna en deltagare → Mål → Nytt mål → Skapa eget mål → fyll i titel +
deadline → Skapa mål.
*Förväntat:* Målet dyker upp i listan direkt ("2 aktiva mål").
*Faktiskt:* Listan stod kvar på "1 aktivt mål" (bara det gamla målet syntes). Målet **fanns**
redan i databasen (`consultant_goals`, `created_at` matchade klicket exakt). Navigerade jag bort
från fliken och tillbaka igen visades båda målen korrekt.
*Belägg:* `d-35-mal-ifylld.png`/`d-36-mal-skapat.png` (bara "Färdigt CV" syns efter skapandet) vs.
`d-37-mal-flik-efter-reload.png` ("2 aktiva mål"); DB-rad `c9896ed1-…` skapad `21:32:26`, samma
sekund som klicket. Ett `KONSOLFEL` loggades under samma pass: CORS-blockerat anrop mot
`…supabase.co/auth/v1/user` ("Failed to fetch").
*Trolig kod:* `client/src/pages/consultant/ParticipantDetailPage.tsx:549-568` — `refetchGoals()`
gör `await supabase.auth.getUser()` som en vakt **innan** den hämtar om listan, och returnerar
tyst (`if (!user … ) return`) om det anropet fallerar. Skapandet (INSERT) och omhämtningen
(SELECT) är alltså två separata anrop, och det andra kan falla utan att något syns för
användaren. En konsulent som inte råkar reagera kan tro att klicket inte tog och skapa målet
igen.
*Notera:* jag kunde inte tvinga fram samma CORS-fel på begäran — det är sannolikt en intermittent
nätverksglitch, inte deterministiskt varje gång. Men mönstret (tyst retur vid fallerad
`getUser()`-vakt) är verifierat i koden och är exakt den felklass CLAUDE.md varnar för
("läsfel som tom data skriver över" / tysta fel).

**SKK5 — Underlagspaket-PDF:en går bara att ladda ner i sekunden efter att underlaget lämnats; ingen annan väg finns senare, för vare sig konsulenten eller handläggaren.**
*Repro:* Lämna ett underlag → dialogen visar "Underlaget är lämnat" med knappen "Ladda ner
underlaget (PDF)" → stäng dialogen med "Klar" i stället för att ladda ner → försök hitta PDF:en
igen (på deltagarens Aktivitet-flik, eller som Hanna på "Underlag till dig").
*Förväntat:* En knapp/länk att ladda ner samma PDF senare, eftersom hela poängen är att
handläggaren ska kunna spara den till kommunens verksamhetssystem.
*Faktiskt:* Ingenstans. Deltagarens Aktivitet-flik visar bara textraden ("Lämnat … till Hanna
Handläggare … kvitterat …") utan nedladdningslänk. Hannas "Underlag till dig"-vy
(`MottagnaUnderlag.tsx`) har ingen PDF-referens alls.
*Belägg:* kodläsning — `UnderlagDialog.tsx:153-187` bygger PDF-knappen bara ur den lokala
`lamnat`-variabeln som sätts direkt efter ett lyckat `taEmotUnderlag`, och existerar inte i något
annat render-läge av dialogen; `grep -n "Ladda\|PDF" MottagnaUnderlag.tsx` gav noll träffar.
Verifierat i UI: konsultens egen sida (`d-59-anna-underlag-kvitterat.png`) visar historikraden
utan nedladdningsknapp.
*Konsekvens:* missar konsulenten (eller stänger dialogen av misstag, vilket är lätt — "Klar" och
"Ladda ner underlaget (PDF)" ligger sida vid sida) det där enda tillfället, finns PDF:en aldrig
mer att hämta ur portalen — trots att texten i dialogen säger att den ska "skickas till
handläggaren på det sätt ni brukar".

### Låg–medel

**SKK2 — Att markera ett pass med SAMMA utfall det redan har (ingen faktisk ändring) skickar ändå en ny notis till deltagaren varje gång.**
*Repro:* Markera ett pass "Ogiltig frånvaro". Öppna Närvaro-panelen igen och klicka "Ogiltig
frånvaro" en gång till (t.ex. efter att ha lagt till en anteckning, eller av misstag).
*Förväntat:* Ingen ny notis, eftersom inget faktiskt ändrats.
*Faktiskt:* En identisk notis till ("Ett pass den 30 september är markerat som frånvaro utan
giltigt skäl…") skickas varje gång knappen klickas, oavsett tidigare värde.
*Belägg:* `notifications`-tabellen har två rader med identiskt innehåll för samma pass
(`2026-09-28 21:21:14` och `21:22:10`), från två separata klick på samma knapp under mitt
testpass (ett omprovförsök efter ett skriptfel, inte ett medvetet dubbelklick — men mekaniskt
identiskt med vad en användare som klickar två gånger skulle utlösa).
*Trolig kod:* `client/src/services/aktivitetApi.ts:556-559` —
`if (input.attendance === 'absent_invalid') { await notisBonus(…) }` i `markAttendance()`
kontrollerar bara det NYA värdet, aldrig om det skiljer sig från det gamla.
*Konsekvens:* en deltagare kan få samma "du är olovligt frånvarande"-varning flera gånger för
samma tillfälle, vilket känns onödigt alarmerande och kan uppfattas som att flera separata
frånvarotillfällen registrerats.

### Låg confidence (rapporteras ärligt, inte fullt reproducerad)

**SKK3 — Möjlig dubbel-inlämning av underlag vid ett formulärförsök som stötte på ett skriptfel.**
Under felsökning av mottagarval (ett UI-attribut jag först valde fel selektor för) skapades två
identiska underlagsrader för Anna (samma period, samma mottagare) 20 sekunder ifrån varandra,
trots att bara **ett** lyckat klick på "Markera som lämnat" observerades i skärmdumparna. Jag
kunde inte återskapa en ren dubbel-POST från ett enda klick i en kontrollerad omkörning, så det
kan bero på min egen testkörning (två separata skriptanrop mot samma sida) snarare än en
applikationsbugg. Nämns för spårbarhet — inte som ett bekräftat fynd. Städat samma dag (den ena
raden ångrad).

---

## 4. Förbättringar

1. **Fixa den tysta refetch-vakten i mål/journal-omhämtningen** (SKK1) — antingen fail-open
   (hämta om listan oavsett `getUser()`-resultat, eftersom RLS ändå skyddar datan) eller visa ett
   synligt fel/en "uppdatera"-knapp om omhämtningen misslyckas. Samma mönster (kommentaren i
   `ParticipantDetailPage.tsx` nämner en likadan vakt för journalen) bör kontrolleras samtidigt.
2. **Ge underlagspaket-PDF:en en permanent nedladdningsväg** — en ikonknapp på varje rad i
   "Underlag till handläggaren"-listan (konsulentsidan) och på varje rad i Hannas "Underlag till
   dig". Annars är hela KH11-satsningen (handläggarens läsvy) halvfärdig: hon ser en
   sammanfattning men får aldrig det dokument hon faktiskt ska diarieföra.
3. **Idempotent notis vid närvaromarkering** (SKK2) — jämför mot föregående `attendance`-värde i
   `markAttendance()` innan `notisOgiltigFranvaro` anropas; skicka bara vid en faktisk
   statusändring.

---

## 5. Kontroll: siffrorna i nämndrapporten mot mina egna markeringar

Nämndrapportens rad "Ej angivet" (Omar, försörjningshinder aldrig satt) visade **3 bedömda pass,
33 % närvarograd, 1 anmäld, 1 oanmäld, 0 underlag** — vilket är exakt mina tre markeringar inom
kvartalet (28–30 sep: present/giltig/ogiltig) och att jag ångrade mitt testunderlag på Omar (så
det korrekt INTE räknas). Sjuk-markeringarna (1–6 okt) föll utanför Q3 och räknades inte med,
vilket också är rätt. Se `namndrapport.pdf` (sparad i rapportmappen) för fullständig tabell.

## 6. Vad jag inte hann pröva

Skärmläsare/tangentbord rakt av (bara visuell + mus/touch denna gång). Mörkt läge specifikt för
aktivitetsplanen. En fullständig kollegöverlämning (uteslöts enligt instruktion). Fler samtidiga
handläggare i samma organisation (bara Hanna finns).
