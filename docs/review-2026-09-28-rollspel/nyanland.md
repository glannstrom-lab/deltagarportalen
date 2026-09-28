# Rollspel: "Fatima", nyanländ deltagare i Demokommun (SFI kurs C) — prod 2026-09-28

Konto: `fatima.exempel@example.com` (deltagare i Demokommun, roll-mapp `nyanland`), inloggad via engångslänk (`/#/visa-som`).
Skript: `e2e/rollspel-2026-09-28-nyanland-01-vecka.cjs` … `-08-arabiska-diag.cjs` (åtta stegfiler, mobil 390×844 i första hand
plus en körning i mörkt läge). Belägg: `nyanland/*.png` + `nyanland/txt/*.txt` (sidtext per skärmdump). Inga fynd i denna rapport
saknar en fil eller en skärmdump.

**Muterat i demon (nollställs i natt):** skickade ett meddelande till Demo Konsulent från Fatimas konto ("Hej! Jag undrar vad jag
behöver göra den här veckan…"). Bytte språk fram och tillbaka (Svenska / Lätt svenska / English / Google-översättning till
arabiska) och satte tillbaka till Svenska sist. Öppnade frånvaroformuläret utan att skicka in något (Min vecka hade inga pass att
anmäla frånvaro från, se NY3/NY6). Inga andra deltagare, ingen organisationsinställning rörd. Noll nätverksfel ≥400 under hela
körningen (`nyanland/natverk.txt` skapades aldrig).

## Helhetsintryck (Fatima)

Jag loggar in och vill veta en sak: vad ska jag göra den här veckan? Sidan "Min vecka" säger bara att min konsulent inte lagt upp
något än — okej, jag väntar. Men när jag letar efter svar på egen hand hittar jag dem faktiskt: en riktig artikel om
aktivitetskravet, vad som händer om jag missar, och en sida som förklarar precis vad jag behöver för att få jobba som
sjuksköterska här. Det är bra skrivet. Problemet är att jag aldrig hittar dit av mig själv — ingenting leder mig dit, och när jag
väl är där kan jag inte växla till Lätt svenska som jag gör på andra sidor. Och den knapp jag skulle lita mest på — "Översätt
sidan" till arabiska, på min telefon, som är den enda datorn jag har — gör ingenting alls. Den säger att den översatt, men sidan
står kvar på svenska. Det hade jag inte upptäckt själv; jag hade bara tänkt att jag gjorde fel.

**De 3 viktigaste:**
1. **"Översätt sidan" till arabiska fungerar inte på mobil — men portalen säger att den gjort det** (NY1). Precis den funktion
   Fatima (Android, inget annat) skulle använda mest.
2. **Hennes viktigaste sida, "Ny i Sverige" (legitimation, UHR, Socialstyrelsen), finns inte på Lätt svenska** (NY2) — noll
   nycklar, medan Min vecka fick 744 av 744 för tio dagar sedan.
3. **"Min vecka" — sidan hon öppnar först varje dag — saknar egen sidtitel**; flikens namn och skärmläsarens annonsering blir den
   generiska varumärkestexten i stället för "Min vecka" (NY3).

Antal fynd: **Kritiskt 1 · Viktigt 4 · Skav 1 · Förslag 6.**

## Tidsåtgång / friktion (Fatimas fem vanligaste sidor)

| Uppgift | Klick/sekunder | Var hon tvekar |
|---|---|---|
| Se vad som krävs denna vecka (Min vecka) | 1 klick, direkt svar — men svaret är "vänta" | Ingen förklaring av vad aktivitetskravet betyder eller vad som väntar |
| Fråga konsulenten | 2 klick, skickat på under 2 s | Inget dröjsmål — fungerar bra |
| Hitta legitimationsregler (Ny i Sverige) | Nås via meny, men etiketten "Internationell Guide" säger inte vad sidan handlar om | Måste läsa sig fram, ingen Lätt svenska att falla tillbaka på |
| Läsa på om aktivitetskravet | Kräver att hon vet ordet "aktivitetskrav" och söker på det — ingen länk dit från Min vecka | Artikeln finns, är bra, men är gömd |
| Byta språk / översätta sidan | 3 klick till "Översatt till العربية" — men resultatet uteblir | Ingen felindikation; ser ut att ha lyckats |

Mätt via `main`-textens teckenlängd före/efter varje åtgärd (identisk längd = ingen förändring skedde), se metod under NY1.

## Kritiskt

**NY1. "Översätt sidan" till arabiska (och alla andra språk) gör ingenting på mobil — men portalen visar att valet gjorts.** · nytt

Var: Språkmenyn (flaggikonen i mobilnavet) → "Översätt sidan till fler språk" → العربية, på `/international` och testat även på
`/min-vecka` och `/my-consultant`. Detta är den enda vägen Fatima har till sitt eget språk — portalens egna språk är bara svenska
och engelska.

Vad som händer: sidan laddas om (som väntat), cookien `googtrans=/sv/ar` sätts korrekt, och språkmenyn skulle visa "Översatt till
العربية" som bekräftat val (`OversattSidan.tsx`, `valtNamn`). Men sidans text är **byte-för-byte identisk** med den svenska
originaltexten både direkt efter klicket och fem sekunder senare. En körd diagnostik bekräftar orsaken direkt i webbläsaren:

```
scriptExists false   ← <script src="translate.google.com/translate_a/element.js"> finns aldrig i DOM
googExists   false   ← window.google är odefinierat
cookie innehåller googtrans: true   ← valet sparades korrekt
Nätverksanrop mot Google Translate: []   ← noll anrop mot translate.google.com någonsin
```

Orsak (spårad i koden): Google-scriptet laddas bara på **ett enda ställe** — `GoogleTranslate.tsx`s `useEffect` vid montering
(rad 138–143, `loadGoogleTranslateScript`, rad 71–123). Den komponenten monteras bara inuti `TopBar.tsx` (rad 176–178), och
`TopBar` renderas **bara på desktop** (`client/src/components/Layout.tsx:452`, `{showBars && !isMobile && <TopBar />}`). På
mobil renderas i stället `MobileTopBar()` (`Layout.tsx:614`), som har sin egen `LanguageSwitcher` (rad 708–711) — den drar in
`OversattSidan.tsx`, som i sin tur bara anropar `services/sidoversattning.ts:oversattTill()`. Den funktionen sätter cookie och
`localStorage`, och laddar om sidan — men anropar aldrig `loadGoogleTranslateScript`. Kommentaren i `OversattSidan.tsx` rad 5–9
beskriver exakt detta hål i förväg ("GoogleTranslate.tsx bör på sikt läsa härifrån … så de två vägarna ser samma val") men
åtgärden gjordes aldrig.

Belägg: `m-70-fore-arabiska.txt`/`m-73-efter-arabiska-klick.txt`/`m-74-efter-arabiska-lang-vantan.txt` (alla 3763 tecken, identiska),
`m-80-diagnos-arabiska.png`, terminalutskrift från `e2e/rollspel-2026-09-28-nyanland-08-arabiska-diag.cjs`.
Fil: `client/src/components/Layout.tsx:302,452,614,708-711`, `client/src/components/layout/TopBar.tsx:176-178`,
`client/src/components/layout/GoogleTranslate.tsx:71-143`, `client/src/services/sidoversattning.ts:76-93`,
`client/src/components/sprak/OversattSidan.tsx:1-19`.

## Viktigt

**NY2. "Ny i Sverige" — sidan om legitimation, UHR och Socialstyrelsen — finns inte alls på Lätt svenska.** · nytt

Fatimas viktigaste sida (validering av sjuksköterskeexamen, arbetstillstånd) har **noll** nycklar i namespace `international` i
`sv-latt.json` (`grep -c "\"international" client/src/i18n/locales/sv-latt.json` → 0). Text i Svenska och Lätt svenska-läge är
identisk, bekräftat med diff (`m-10-international-svenska.txt` = `m-12-international-latt-svenska.txt`, ingen skillnad).
Läsbarhetsmätning på huvudtexten (LIX, standardformeln): 27 meningar, snitt 15,3 ord/mening, men 5 av 27 (18 %) över 25 ord,
LIX 36,4 — "medelsvår, normal tidningstext". För jämförelse: kunskapsbankens Lätt svenska-artikel om försörjningsstöd landar på
LIX 28,6 med 7 ord/mening i snitt. Min vecka fick Lätt svenska-täckning 123 → 744 av 744 nycklar för tio dagar sedan (RD5/RD30,
2026-09-27) — samma insats har inte gjorts här.
Belägg: `m-10/m-12-international-*.txt` (identiska), räkning ovan.
Fil: `client/src/i18n/locales/sv-latt.json` (saknar `international`-nyckel helt), `client/src/pages/International.tsx`,
`client/src/pages/international/{ValideringTab,LanguageTab,IntegrationTab}.tsx`.

**NY3. "Min vecka" saknar egen sidtitel — fliken och skärmläsaren säger fel sida.** · nytt

Alla andra rutter Fatima använder har en rad i `PAGE_TITLE_RULES` (`usePageTitle.ts:50-116`) — `/min-vecka` saknas helt. Resultat:
webbläsarfliken och skärmläsarannonseringen ("Du är nu på …") faller tillbaka på den generiska varumärkestiteln
`"Jobin — verktyg och stöd för dig som söker jobb"` i stället för "Min vecka", på just den sida hon besöker oftast för att se
vad kommunen kräver av henne. Bekräftat i både svenskt och engelskt läge (`m-02-min-vecka.txt` rad 1: "Du är nu på Jobin — …";
`m-17-min-vecka-english.txt` rad 1: "You are now on Jobin — tools and support …"). Alla andra sidor i samma test (Översikt,
Din konsulent, Internationell Guide, Inställningar, Kunskapsbank) annonserar rätt sidnamn.
Belägg: `m-02-min-vecka.txt`, `m-17-min-vecka-english.txt`, `m-51-min-vecka-morkt` (samma fel i mörkt läge).
Fil: `client/src/hooks/usePageTitle.ts:50-116` (listan saknar `{ path: '/min-vecka', key: 'nav.minVecka', sv: 'Min vecka' }`).

**NY4. English-läget: artiklar utan översättning blandar engelsk chrome med tyst svensk brödtext, och datumet växlar till
amerikanskt format.** · nytt

Öppnas `knowledge-base/article/lattsvenska-forsorjningsstod` i English-läge: rubrik, ingress och alla mellanrubriker
("Vad är försörjningsstöd?", "Vem bestämmer om jag får försörjningsstöd?" …) står kvar på svenska, medan sidans eget skal är
engelskt ("Back to knowledge base", "Updated 9/6/2026", "Listen / Print / Download", "IN THIS ARTICLE"). Verifierat i prod-databasen:
`content_en` är NULL för både `lattsvenska-forsorjningsstod` och `forsorjningsstod-nar-pengarna-tar-slut` — två av portalens fyra
artiklar om exakt det Fatima frågar sig ("vad händer med pengarna"). Utöver detta: datumet "Updated 9/6/2026" är amerikanskt
format (M/D/ÅÅÅÅ) — kodad direkt i `Article.tsx:398`:
`new Date(article.updatedAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'sv-SE')`. Projektets egen regel
("datumord ur `lib/datumsprak.ts`, aldrig `'en-US'`", satt efter RD6/RD30) är alltså inte tillämpad på just artikelsidan.
Belägg: `m-44-lattsvenska-forsorjningsstod-english.txt`, SQL: `SELECT slug, content_en IS NOT NULL FROM articles WHERE slug IN (…)`.
Fil: `client/src/pages/Article.tsx:398`.

**NY5. Nav-etiketten "Internationell Guide" matchar inte sidans egen rubrik "Ny i Sverige".** · nytt

Menyn (`sv.json:388`, `"international": "Internationell Guide"`) och sidans H1 (`International.tsx:57,96`,
`t('international.pageTitle')` = "Ny i Sverige") säger två olika saker. Samma mismatch i engelskt läge: nav "International Guide"
mot rubrik "New in Sweden" (`en.json`). "Internationell Guide" låter som hjälp för att flytta utomlands eller jobba internationellt
— inte som platsen där Fatima ska läsa om Socialstyrelsens legitimationskrav. En deltagare som specifikt letar efter hjälp med sitt
utländska yrke har ingen menypost som säger det.
Belägg: `m-07-ny-i-sverige.txt` (nav-raden "Internationell Guide" ovanför rubriken "Ny i Sverige").
Fil: `client/src/i18n/locales/sv.json:388`, `client/src/components/layout/navigation.ts:335`,
`client/src/pages/International.tsx:57,96`, `client/src/i18n/locales/en.json` (`nav.international`/`international.pageTitle`).

## Skav

**NY6. "Min vecka" är helt tom och länkar ingenstans vidare, trots att svaret redan finns skrivet i portalen.** · nytt

Fatima har noll rader i `activity_sessions` (verifierat i prod-databasen) — hennes konsulent har inte satt upp någon vecka än.
Sidan visar bara: "Ingen vecka planerad än. Din konsulent lägger upp veckan tillsammans med dig. Tills dess finns det inget du
behöver göra här." Det är en ärlig tomvy (ingen påhittad nolla), men den ger inget svar på det hon faktiskt undrar — och portalen
har redan svaret: kunskapsbanken har en fyllig artikel, "Aktivitetskravet för försörjningsstöd – vad gäller för dig", med precis
de avsnitt hon skulle vilja läsa ("Om du inte kan komma", "Vad kommunen ska göra", en checklista) och en Lätt svenska-syskonartikel
("Vad är försörjningsstöd?"). Ingetdera länkas från den tomma vyn.
Belägg: `m-02-min-vecka.txt`, `m-51-min-vecka-morkt.png`; SQL: `SELECT count(*) FROM activity_sessions WHERE participant_id=…` → 0;
artiklarna verifierade i prod (`aktivitetskrav-forsorjningsstod`, `lattsvenska-forsorjningsstod`).
Fil: `client/src/pages/MinVecka.tsx` (tomvyn), `client/src/i18n/locales/sv.json` (`minVecka.tomVecka.*`).

## Förslag på utveckling

**NY-F1. Koppla på Google-översättningen på mobil på riktigt.** Låt vägen som `OversattSidan.tsx`/`sidoversattning.ts` går
faktiskt anropa `loadGoogleTranslateScript` (samma funktion som redan finns i `GoogleTranslate.tsx`), eller flytta laddningen till
en plats som monteras oavsett vy (t.ex. rotlayouten). Värde: hela poängen med RD31 — mobil åtkomst till maskinöversättning för de
elva språk portalen inte själv stödjer — uppnås först då. I dag är knappen en attrapp för alla mobilanvändare, vilket är alla
Fatima-liknande deltagare. Storlek: liten, samma mönster finns redan att kopiera.

**NY-F2. Bygg Lätt svenska för "Ny i Sverige".** Tre flikar, uppskattningsvis 40–60 nycklar — samma insats som gav Min vecka
744/744 för tio dagar sedan. Värde: den sida som avgör om Fatima får arbeta som sjuksköterska blir läsbar utan hjälp. Storlek: medel.

**NY-F3. Länka aktivitetskravs-artikeln (och dess Lätt svenska-version) direkt från Min veckas tomma vy**, villkorat på
kommun-deltagare (`org_kind`). Värde: svar på "vad krävs" och "vad händer om jag missar" samma dag hon loggar in första gången,
utan att vänta på första mötet med konsulenten. Storlek: liten.

**NY-F4. Lägg `/min-vecka` i `PAGE_TITLE_RULES`.** Värde: rätt flik-titel och skärmläsarannonsering på hennes mest besökta sida.
Storlek: mycket liten, en rad kod.

**NY-F5. Byt navetiketten "Internationell Guide" till "Ny i Sverige"** (eller motsvarande engelska "New in Sweden"), så meny och
rubrik säger samma sak. Värde: hon hittar sidan när hon letar efter hjälp med sitt yrke. Storlek: mycket liten — dubbelkolla att
inget SEO-beroende (guide-slug) bygger på den nuvarande texten innan bytet.

**NY-F6. Artikelsidan i English-läge: använd portalens datumhjälpare (aldrig `'en-US'`) och visa en tydlig rad**
("Den här artikeln finns bara på svenska än så länge") i stället för att tyst blanda engelsk chrome med svensk brödtext. Värde:
mindre förvirrande för den som medvetet valt engelska eftersom hon läser det bättre än svenska. Storlek: liten.

## Fungerar bra nu (för balans)

- **Meddelande till konsulenten**: skrivet, skickat och synligt i tråden på under två sekunder, inget nätverksfel.
- **Frånvaroanmälan har en egen orsak för sjukt barn** ("Vård av barn" / Lätt svenska: "Jag måste ta hand om mitt barn",
  `franvaroApi.ts:20`, `sv-latt.json:73`) — precis det hon efterfrågar, även om hon inte fick pröva den (NY6: inga pass att anmäla
  frånvaro från än).
- **Svenska-fliken på "Ny i Sverige" är byggd kring SFI:s egna kurser (A–D), inte CEFR** — `international/LanguageTab.tsx` har
  redan rättat en tidigare felaktig premiss om detta (se filens egna kommentarer, rad 10–17).
- **Kunskapsbankens artikel om aktivitetskravet är ovanligt bra**: konkret, ärlig ("Uteblir du … kan kommunen sätta ned eller
  neka … Beslutet fattas av socialnämnden …"), med checklista och tydlig gräns mot det den inte vågar lova (inga belopp).
- **CV-byggaren har ett snabbläge** ("Skapa ett grundläggande CV på 30 sekunder", 3 steg) som fungerar på mobil.
- Noll nätverksfel (`>=400`) mot Supabase/API under hela sessionen.

## Vad jag inte prövade

- Kunde inte testa själva frånvaroanmälningsflödet från start till kvitto (Min vecka är tom, se NY6) — koden är läst men inte
  klickad igenom i prod för det här kontot.
- Närvarointyget (`NarvaroIntyg`-komponenten) är osynligt utan en aktiv plan — kunde inte bedömas.
- Sökfunktionen i kunskapsbanken testades inte grundligt på engelska (min egen selector missade det engelska sökfältet, ingen
  slutsats dragen om den fungerar eller inte).
- Övriga tio språk i "Översätt sidan" (persiska, somaliska, tigrinja m.fl.) — NY1 gäller sannolikt alla, eftersom felet ligger i
  att scriptet aldrig laddas, oavsett språkval, men bara arabiska kördes med full diagnostik.
