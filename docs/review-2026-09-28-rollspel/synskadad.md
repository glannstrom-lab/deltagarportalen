# Rollspel: "Peter", 38, gravt synskadad, NVDA + endast tangentbord — prod 2026-09-28

Konto: `peter.testsson@example.com` (deltagare hos "Demoleverantör (påhittade personer)", nyinskriven — första mötet bokat
för 5 dagar sedan enligt seed). Inloggad via superadmin "Visa som" (engångslänk), övriga sidor körda med **endast tangentbord**
(`Tab`, `Enter`, `Escape`) — aldrig musklick, förutom där skriptet uttryckligen testar musklick separat för jämförelse.

Skript: `e2e/rollspel-2026-09-28-synskadad-login.cjs` (fristående, testar `/login` OINLOGGAD), `-helpers.cjs`
(tab-spårning via `ariaSnapshot` av `:focus`, axe-core, landmärkes-/rubrikdump, skiplänkstest), `-s1` t.o.m. `-s6` (Översikt,
Min vecka, Min konsulent, Sök jobb, CV-byggaren, Kunskapsbank, Inställningar). Belägg: `synskadad/*.png` (45 st) och
`synskadad/txt/*.txt`/`*.json` (83 st) — tab-spår, axe-fynd, landmärkesdumpar, aria-live-loggar, `natverk.txt`.
axe-core kördes med `@axe-core/playwright` (finns i repo-roten) på sju sidor.

**Muterat i demon (nollställs i natt):** ett meddelande till konsulenten ("Hej! Jag undrar när vi kan boka in nästa
samtal. Mvh Peter"), ett sparat jobb (Servicerådgivare/Kundmottagare, Roy Andersson Bilbolaget AB, Kungälv), en
arbetslivserfarenhet i CV:t (Kundtjänstmedarbetare, Exempel Kundservice AB, Malmö, fr.o.m. mars 2023) plus en
nedladdad CV-PDF. Inga inställningar ändrades (Tillgänglighet-fliken lästes men inget kryssades i, inget behöver
återställas). Rörde inte "Det du delat"-kortet (Nordfrakt) — det är en annan agents förslag till Peter.

## Helhetsintryck (Peter)

Det här är första gången jag testar en svensk jobbportal som faktiskt går att navigera helt med tangentbord utan att
tappa fokus i en meny eller fastna i en dialog jag inte kan stänga — och det märks att någon har tänkt på
tillgänglighet som mer än en bock i en ruta: det finns en egen sida med fokusläge, hög kontrast, större text, lugnt
läge och till och med Lätt svenska. Men detaljerna som avgör om jag orkar använda det här varje dag är inte klara.
Erfarenhetsposten i CV-byggaren presenterar sig för NVDA som en enda lång rad skräptext ("Flytta erfarenhet uppåt
Flytta erfarenhet nedåt 0/3 Ny position Företagsnamn") i stället för "Kundtjänstmedarbetare, ej ifylld — tryck för
att redigera". Inloggningssidan — det första jag möter — har inga landmärken och ingen skiplänk alls, till skillnad
från resten av appen. Och när jag skulle exportera mitt CV fick jag ett serverfel första gången, utan förklaring,
och fick gissa mig till att jag skulle försöka igen.

**De 3 viktigaste:**
1. **CV-byggarens erfarenhetsrad har ett förstört tillgängligt namn** (SV1) — den enda knapp jag har för att öppna och
   redigera en anställning läses upp som en osammanhängande blandning av två andra knappars etiketter, en räknare och
   platshållartext. Det är det viktigaste verktyget i portalen och det är svårast att förstå med skärmläsare.
2. **CV-export gav ett serverfel (500) på första försöket** (SV2) — fungerade vid omförsök, men jag fick ingen
   förklaring, bara tystnad tills nedladdningen aldrig kom.
3. **Inloggningssidan saknar landmärken och skiplänk helt** (SV3) — resten av appen har `Hoppa till huvudinnehåll`
   och tydliga regioner; den första sidan en ny användare möter har varken.

Antal fynd: **Kritiskt 2 · Viktigt 5 · Skav 6 · Förslag 6.**

## Tidsåtgång / friktion (uppmätt via tab-spår, se `txt/tab-*.txt`)

- **Logga in:** ingen skiplänk finns att hoppa förbi något med — men det behövs inte, sidan har bara ett fåtal
  fokuserbara element innan formuläret (logga, "Hoppa till..." saknas helt). E-post → lösenord → visa lösenord →
  logga in: 4 tabbar, rakt fram. Ett fel efter felaktig inloggning annonseras korrekt (`role="alert"
  aria-live="assertive"`), men fokus lämnas kvar på `<body>` i stället för att flyttas till felet eller till
  e-postfältet — jag måste tabba om från början.
- **Skicka meddelande till konsulenten:** fältet hittas direkt via sitt tillgängliga namn ("Skriv ett meddelande"),
  `Enter` skickar, meddelandet dyker upp i en `role="log"`-region som NVDA läser upp automatiskt. Fungerade
  first-try, inget att anmärka.
- **Spara ett jobb:** knappen heter "Spara" och byter till "Sparad" efter tryck — fungerar, men bekräftelsen är
  bara knappens eget namnbyte, ingen egen `aria-live`-status ("Jobbet sparat"). Fungerar om jag håller fokus kvar,
  otydligt om jag hunnit tabba vidare.
- **Lägga till en CV-erfarenhet:** öppna posten, fylla jobbtitel/företag/plats/startdatum/beskrivning, klicka Klar —
  gick att göra hela vägen med tangentbord, men startdatum-fältet (`<input type="month">`) läser upp "Startdatum *"
  två gånger i följd med ett odefinierat tabbstopp mellan (se SV6) — jag vet inte vilken del jag står i förrän jag
  provar en pil.
- **Exportera CV till PDF:** knappen är lätt att hitta ("Exportera PDF" i verktygslistan), men se SV2 — första
  försöket gav serverfel utan besked, andra försöket fungerade och filen laddades ner som `CV_okänd_.pdf` (se SV7).
- **Checka in på ett pass / anmäla frånvaro:** **gick inte att testa alls** — se SV1. Peter är nyinskriven och har
  ingen aktivitetsplan än, så "Min vecka" visar bara tomtillståndet.

---

## Kritiskt (fel, lögn, tyst dataförlust, blockerar)

**SV1. Kontot har ingen aktivitetsplan — "checka in" och "anmäl frånvaro" går inte att nå eller testa.** · nytt
Var: `/min-vecka`. Peters seed (`consultant_participants` sedan 5 dagar, ingen rad i `activity_plans`) ger tomtillståndet
"Ingen vecka planerad än — Din konsulent lägger upp veckan tillsammans med dig. Tills dess finns det inget du behöver
göra här." Både incheckningsknappen och frånvaroanmälan (`FranvaroAnmalan`) renderas bara per `ActivitySession`, och
Peter har noll sessioner. Det är **ärligt** — texten ljuger inte, och tomtillståndet är välbyggt (ikon, rubrik, en
tydlig CTA "Gå till din konsulent"). Men det betyder att den ena av rollspelets huvuduppgifter (incheckning,
frånvaroanmälan) är strukturellt omöjlig att göra för just det här kontot, och jag kan inte säga om de flödena är
tillgängliga för en skärmläsare eftersom de aldrig renderas. Det väcker en riktig produktfråga: vad gör en nyinskriven
deltagare med bara ett bokat första möte under de dagar/veckor som går innan konsulenten hinner lägga en plan?
Belägg: `d-02-min-vecka.png`, `txt/min-vecka-tom-plan.txt`, `txt/tab-min-vecka-tomt-cta.txt`.
Fil: `client/src/pages/MinVecka.tsx:205-213` (tomtillstånd), seed `supabase/migrations/20260927_demo_leverantor.sql:155-181`
(bara `v_p1`/`v_p2` får `activity_plans`-rader).
Föreslagen åtgärd: antingen ge Peter en enkel plan i seed-datan (så nästa rollspel/demo kan visa flödet), eller — som
produktfråga till Mikael — lägg till en rad i tomtillståndet om vad som händer under tiden (t.ex. en länk till CV eller
kunskapsbanken), så väntetiden inte känns helt tom.

**SV2. `/api/cv-pdf` svarade 500 vid första exportförsöket — ingen förklaring till användaren.** · nytt
Var: `/cv`, knappen "Exportera PDF", första försöket (via tangentbordsfokus + Enter). Nätverksloggen visar
`POST 500 https://www.jobin.se/api/cv-pdf` kl. 16:43:17 UTC. Sidan gav ingen synlig felindikation — jag satt bara och
väntade, ingen `aria-live`-status sa att något gått fel (jag fick bara ett `page.waitForEvent('download')`-timeout i
skriptet). Ett omförsök ett par minuter senare (rent musklick, ingen navigeringsomväg) **fungerade** och gav en
nedladdad `CV_okänd_.pdf` — felet är alltså inte reproducerbart, men det inträffade en gång i skarp drift under den
här sessionen, vilket matchar historiken i `CLAUDE.md` om kallstartsproblem i `cv-pdf.js`/Chromium. Kritiskt eftersom
detta är en av rollspelets uttryckliga uppgifter och en tyst 500:a utan felmeddelande är särskilt farlig för någon som
inte kan se att sidan "hänger" — jag hade bara tystnad att gå på.
Belägg: `natverk.txt`, `txt/cv-export-resultat.json`, `d-14-cv-efter-export.png` (visar att en onboarding-dialog
"Steg 1 av 7" dök upp ovanpå allt strax efter, se SV8), `txt/cv-export-retry.json` (lyckat omförsök).
Föreslagen åtgärd: lägg en synlig, `aria-live`-kopplad felrad vid misslyckad export ("Kunde inte skapa PDF:en, försök
igen") i stället för att bara låta knappen sluta göra något.

---

## Viktigt

**SV3. Inloggningssidan (`/login`) saknar landmärken och skiplänk helt — resten av appen har båda.** · nytt
Var: `/login`, oinloggad. `landmarkOchRubriker`-dumpen ger `LANDMÄRKEN: (inga)` — ingen `<main>`, ingen `<nav>`, ingen
`<header>`/banner. axe bekräftar: `landmark-one-main` (moderate) och `region` (moderate, 10 element utanför
landmärken). Ingen `SkipLinks`-komponent renderas på den här sidan (jämför med varje inloggad sida, som har
"Hoppa till huvudinnehåll" + "Hoppa till navigation" som konsekvent första och andra tabbstopp). Sidan är ändå
användbar — bara sex fokuserbara element totalt, e-post/lösenord/visa-lösenord/logga in/Google/skapa-konto — men
det är en inkonsekvens som gör det första intrycket sämre än resten av produkten, och en sida med fler element (t.ex.
efter ett register-flöde) skulle sakna motsvarande genväg.
Belägg: `txt/struktur-login.txt`, `txt/axe-login.json`.
Fil: sidan renderas utan `<SkipLinks>`/`<MainContent>` från `client/src/components/SkipLinks.tsx` — jämför med
`client/src/components/Layout.tsx` som drar in dem för inloggade sidor.

**SV4. Focus flyttas inte till felmeddelandet vid misslyckad inloggning — och tappas helt efteråt.** · nytt
Var: `/login`, fel e-post/lösenord. Felet "Fel e-post eller lösenord" annonseras korrekt av NVDA tack vare
`role="alert" aria-live="assertive"` (bra!), men `document.activeElement` efter felet är `<body>` — fokus följer
varken med till felmeddelandet eller stannar på Logga in-knappen. En tangentbordsanvändare måste tabba om från
toppen av sidan för att försöka igen, i stället för att kunna trycka Tab en gång och landa i e-postfältet.
Belägg: `txt/login-fokus-efter-fel.json`, `txt/login-arialive.json`.
Fil: `client/src/pages/Login.tsx` (sök på var felstatet sätts efter `signIn`-anropet).

**SV5. CV-erfarenhetens huvudknapp har ett tillgängligt namn som är en oläslig blandning av tre olika saker.** · nytt
Var: CV-byggaren → Erfarenhet → en post i listan. `ariaSnapshot` av knappen: *"Flytta erfarenhet uppåt Flytta
erfarenhet nedåt 0/3 Ny position Företagsnamn" [expanded]*. Orsaken: raden är en `<div role="button"
aria-expanded={isExpanded}>` **utan egen `aria-label`**, med två riktiga `<button>`-element (flytta upp/ner) samt
statustext och titel som barn — webbläsaren beräknar då hela textinnehållet, inklusive de nästlade knapparnas
`aria-label`, som radens eget tillgängliga namn. Koden har redan städat bort EN nästlad interaktivitet här (en
onödig chevron-knapp, se kommentaren på rad 260-266) men missade att flytta-knapparna fortfarande förorenar namnet.
Resultatet: NVDA-användaren hör en mening som inte säger vad raden faktiskt gör (expandera/kollapsa en
anställningspost) och måste gissa.
Belägg: `txt/tab-cv-erfarenhet-formular.txt` (rad 1).
Fil: `client/src/components/cv/ExperienceEditor.tsx:204-235`.
Föreslagen åtgärd: sätt en explicit `aria-label` på rad 204, t.ex.
`` `${exp.title || 'Ny position'} hos ${exp.company || 'okänt företag'} — visa eller dölj detaljer` ``, så namnet
inte längre läser in barnens etiketter.

**SV6. `<input type="month">` för start-/slutdatum läser upp samma etikett två gånger med ett odefinierat tabbstopp emellan.** · nytt
Var: CV-byggaren → Erfarenhet → Startdatum/Slutdatum. Tab-spåret visar "Startdatum *" på både steg 5 och 6 (och
"Slutdatum" på 8 och 9), med "(inget fokuserat element)" mellan varje par. Fältet är ETT `<input>` i koden (rad
375-399), så det är webbläsarens interna månad/år-segment i den native `type="month"`-kontrollen som exponeras som
separata tabbstopp med identisk annonsering — ett känt problem med native datumfält och skärmläsare (Chrome+NVDA):
båda delarna heter "Startdatum", så jag vet inte om jag står i månaden eller året förrän jag testar en piltangent.
Det här är inte unikt för Jobin, men det drabbar en central del av CV-byggandet.
Belägg: `txt/tab-cv-erfarenhet-formular.txt` (rad 5-10).
Fil: `client/src/components/cv/ExperienceEditor.tsx:380-399, 414-423`.
Föreslagen åtgärd: överväg en egen textbaserad datumkontroll ("MM/ÅÅÅÅ" i ett fält med `aria-describedby` som
förklarar formatet) i stället för native `type="month"`, eller lägg åtminstone till `aria-label="Startmånad och år"`
som är tydligare än enbart "Startdatum".

**SV7. Nedladdad CV-PDF heter `CV_okänd_.pdf` när "Om dig"-fliken inte fyllts i.** · nytt
Var: `/cv`, "Exportera PDF" innan namnfälten i "Om dig" är ifyllda. Filnamnet innehåller den råa platshållaren
"okänd" i stället för ett neutralt namn (t.ex. `Mitt-CV.pdf`) eller Peters riktiga namn, som redan finns i
`profiles.first_name`/`last_name` ("Peter Testsson") oberoende av CV:ts egna namnfält. Litet, men i linje med
`CLAUDE.md`s regel om att aldrig visa ett påhittat/tekniskt värde i stället för en ärlig fallback.
Belägg: `txt/cv-export-retry.json` (`"filnamn":"CV_okänd_.pdf"`).
Fil: PDF-namngivningen i `client/api/cv-pdf.js` eller motsvarande i CV-exportflödet i `client/src/services/`.

---

## Skav

**SV8. Onboarding-tour ("Steg 1 av 7") dyker upp igen mitt i arbetet och täcker hela skärmen.** · nytt
Var: CV-byggaren, efter att ha fyllt i en erfarenhet och klickat "Klar". Skärmdumpen `d-14-cv-efter-export.png` visar
en fullskärmsdialog "Steg 1 av 7 — Välkommen till CV-byggaren!" ovanpå allt annat, trots att jag redan var mitt i
flödet. Overkant om den triggas av scroll/re-render — under alla omständigheter stör den en pågående uppgift och
kräver en extra Escape/stäng-åtgärd som inte fanns i min ursprungliga plan.
Belägg: `d-14-cv-efter-export.png`.

**SV9. Felmeddelandets textfärg på `/login` klarar precis inte kontrastkravet.** · kvarstår-liknande (ny mätning)
Var: `/login`, felraden "Fel e-post eller lösenord". axe mäter 4,36:1 mot kravet 4,5:1 (`#e7000b` på `#fef2f2`).
Marginellt, och eftersom texten annonseras via `aria-live="assertive"` hör en skärmläsaranvändare den ändå — men
påverkar den som ser delvis.
Belägg: `txt/axe-login.json`.

**SV10. "Spara"-knappen på ett jobb bekräftar bara genom att byta eget namn — ingen separat statusrad.** · nytt
Var: `/job-search`, en jobbannons. Efter tryck byter knappen namn "Spara" → "Sparad" (bra, upptäcktes av NVDA eftersom
fokus stannade kvar), men det finns ingen `role="status"`-rad som säger "Jobbet sparat" om fokus av någon anledning
flyttat sig innan namnbytet hinner ske.
Belägg: `txt/jobbsok-spara-fore-efter.json`, `txt/jobbsok-spara-arialive.json`.

**SV11. Jobbsökresultatens rubriker ligger alla på samma nivå (H3) som filtersektionen.** · nytt
Var: `/job-search`. axe: `heading-order` (moderate). Rubrikdumpen visar H1 "Sök jobb" → H3 "Sök & Filtrera" → H3 ×20
(en per jobbannons). Ingen H2 grupperar "kontroller" och "resultat" isär. Vid H3-navigering i NVDA (tangenten 3) får
jag en enda lång, odifferentierad lista utan sektionsgränser.
Belägg: `txt/axe-jobbsok-resultat.json` (i loggen ovan), `d-05-jobbsok-resultat.png`.
Fil: jobbresultatlistans komponent i `client/src/pages`/`client/src/components` för `/job-search`.

**SV12. Samma rubrikhopp (H1→H3, ingen H2) upprepas på minst tre andra ställen.** · nytt
Var: (a) `EmptyState`-komponenten (`client/src/components/ui/EmptyState.tsx:144, 84`) använder `<h3>` ovillkorligt
för sin titel — drabbar `/min-vecka` när planen saknas (axe: `heading-order`, h3). (b) `/settings`, sektionen
"Profilinställningar" (H1 → H3, ingen H2). (c) `/settings` → Tillgänglighet-fliken (samma mönster, axe bekräftar).
`EmptyState` är enligt `DESIGN.md` §7 "den ENDA accepterade vägen att rendera ett tomtillstånd", så samma hopp
återkommer överallt komponenten används — det är alltså inte tre isolerade fel utan en systemisk lucka i rubrikdisciplinen.
Belägg: `txt/axe-min-vecka.json`, `txt/axe-installningar.json`, `txt/axe-installningar-tillganglighet.json`.
Fil: `client/src/components/ui/EmptyState.tsx:144` (kompakt: rad 103) — byt `<h3>` mot en prop som låter anroparen
ange rätt nivå relativt sidans egen struktur.

**SV13. Kunskapsbankens "relaterade övningar"-kort är hela beskrivningen i en enda länk.** · nytt
Var: en artikel, sektionen "Relaterade övningar". Länkens tillgängliga namn:
*"Hitta ditt jobb-jag Upptäck vilken personlighetstyp du är och vilka yrken som passar dig bäst. Baserad på
Arbetsförmedlingens modell med fyra profiler. Självkännedom • 20-30 min • Lätt"* — hela kortets brödtext, kategori,
tidsåtgång och svårighetsgrad läses som en enda sammanhängande mening innan jag kan gå vidare till nästa kort. Fungerar,
men tre sådana kort i rad är tungt att lyssna igenom bara för att avgöra om det är värt att klicka.
Belägg: `txt/tab-artikel-2-atgarder.txt` (rad 16-18).

---

## Förslag (utveckling)

**SV14. Gör "Lyssna"-knappen medveten om att den ofta krockar med en riktig skärmläsare.** · nytt
Vad: `TextToSpeech`-komponenten (`client/src/components/knowledge-base/TextToSpeech.tsx`) använder webbläsarens
`speechSynthesis` för att läsa upp artikeln. För mig, som redan har NVDA igång, betyder ett klick på "Lyssna" att
TVÅ röster pratar samtidigt — NVDA:s egen och webbläsarens TTS. Funktionen är uppenbarligen till för lässvaga eller
lågsynta användare utan skärmläsare, men det står ingenstans, och namnet "Lyssna" ger ingen som helst signal om vem
den är till för.
Värde: en tydlig hjälptext ("Läser texten högt med webbläsarens röst — stäng av din skärmläsare först om du redan
har en igång") sparar förvirring, och är enkel att skriva. Ett större steg vore att låta "Lyssna" fokusera artikelns
brödtext (`tabIndex=-1` + `focus()`) i stället för att spela ljud, så en skärmläsare kan läsa den i sitt eget tempo —
men det kräver mer omtanke om vad knappen ska betyda för respektive målgrupp.
Storlek: liten (hjälptext) till medel (fokusalternativ).

**SV15. Bygg om inställningarnas flikväxlare med riktig ARIA-tabs-semantik.** · nytt
Vad: "Profil / Tillgänglighet / Notifikationer / Utseende / Integritet / Säkerhet" på `/settings` är sex fristående
`<button>`-element, inte ett `role="tablist"` med `role="tab"`/`aria-selected`/`role="tabpanel"`. Fungerar med Tab och
Enter, men NVDA får ingen "flik 2 av 6, vald"-kontext, och pilnavigering mellan flikarna (standardmönstret för tabbar)
saknas.
Värde: gör en central, återkommande sida (inställningar besöks av alla, ofta) mer förutsägbar för alla
skärmläsaranvändare, inte bara mig.
Storlek: liten–medel (WAI-ARIA Tabs-mönstret är väldokumenterat, komponenten finns redan strukturerad för det).

**SV16. En rad om vad som händer under väntetiden innan en aktivitetsplan finns.** · nytt
Vad: se SV1. "Min vecka"-tomtillståndet säger korrekt att det inte finns något att göra där än, men ger ingen
vägledning om vad jag KAN göra under tiden (bygga CV, läsa i kunskapsbanken, fylla i profilen).
Värde: en nyinskriven deltagare — särskilt en som väntar på sitt första möte — får en konkret nästa handling i
stället för att bara mötas av frånvaro av innehåll. Kopplar naturligt till Översiktens "Ett bra nästa steg"-mönster,
som redan finns och fungerar bra.
Storlek: liten (en rad text + länk, samma komponent som redan används på Översikt).

**SV17. Fixa CV-erfarenhetens namnproblem (SV5) — det är den enskilt mest värdefulla fixen i den här rundan.** · nytt
Vad: se SV5 för detaljer. Lyfts som eget förslag eftersom det är litet att åtgärda (en `aria-label`-rad) men stort i
effekt: CV-byggaren är, enligt konsulentens egna råd på sidan, det första verktyget en ny deltagare ska använda.
Värde: hög — påverkar varje synskadad användares första riktiga uppgift i portalen.
Storlek: liten (en kodrad).

**SV18. Synliggör tillgänglighetsarbetet som redan finns — det är ett starkt AF-argument.** · nytt
Vad: portalen har redan Fokusläge (NPF-anpassat), Hög kontrast, Större text, Lugnt läge och Lätt svenska samlat på EN
sida (`/settings`, Tillgänglighet), plus konsekventa skiplänkar på alla inloggade sidor och en fungerande JS-driven
skiplänksresolver som hanterar både mobil och desktop (`client/src/components/SkipLinks.tsx` — se koden, den är
ovanligt genomtänkt: den hittar rätt navigeringsmål oavsett vilken layout som är synlig). Det är mer strukturerat
tillgänglighetsarbete än vad jag brukar se i svenska myndighets-/leverantörsportaler.
Värde: en leverantör som ska visa upp tillgänglighet för Arbetsförmedlingen har redan underlag — men det kräver att
de skarpa detaljfelen (SV1-SV13) är åtgärdade, annars säger demot en sak och verkligheten en annan.
Storlek: dokumentation/kommunikation, inte kod.

**SV19. Gör inloggningssidan lika strukturerad som resten av appen (SV3).** · nytt
Vad: lägg samma `<SkipLinks>` + landmärkesstruktur (`<main>`, ev. `<nav>` för "Skapa konto"/"Google") på `/login` som
resten av portalen redan har. Litet jobb eftersom komponenterna finns färdiga — sidan behöver bara dra in dem.
Värde: konsekvens för en ny användares första intryck, plus att axe-varningarna (`landmark-one-main`, `region`)
försvinner.
Storlek: liten.

---

## Vad jag inte hann testa

Ett riktigt AI-anrop (avstängt med flit i demot). Surfplatta. `forced-colors`-emulering gav inget tydligt utslag i
headless Chromium här (troligen ett begränsningsläge i testmiljön snarare än sidans CSS — kräver en riktig Windows
högkontrast-körning för att avgöra säkert, så jag utelämnar det som fynd). 200%-zoom testades bara på Översikt (se
"Allt i portalen"-korten som klipper rubriker till enstaka bokstäver vid `document.documentElement.style.zoom=2` —
`d-01-oversikt-200pct.png` — nämns här utan eget SV-nummer eftersom jag inte hann verifiera om det är
zoom-emuleringen eller en riktig CSS-brytpunkt som orsakar det; värt en uppföljning).
