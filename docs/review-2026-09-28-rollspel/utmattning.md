# Rollspel deltagare: Amina, prod 2026-09-28

**Persona:** Amina, 46, f.d. ekonomiassistent. Utmattningssyndrom för två år sedan, tre år borta
från arbetslivet. Inskriven hos Rusta och matcha-leverantör (Demoleverantör) via
Arbetsförmedlingen. Dåliga och bra dagar; på dåliga dagar orkar hon läsa några meningar och blir
stressad av krav och röda siffror.

**Konto:** `amina.fiktiv@example.com`, roll-mapp `utmattning`. Startsökväg `/`.

**Metod:** Inloggad i prod via superadmin "Visa som". Körningarna gjordes på mobil 390×844 i
mörkt läge (kvällsscenariot, "dålig dag") och på dator 1366×900 i ljust läge ("bra dag").
Skripten ligger i `e2e/rollspel-2026-09-28-utmattning-s1.cjs` till `-s10.cjs` (körare:
`e2e/rollspel-2026-09-28.cjs`). Skärmdumpar i `docs/review-2026-09-28-rollspel/utmattning/`,
sidtexter i `utmattning/txt/`, nätverksbelägg i `utmattning/natverk.txt`.

**Muterat i demon (Demoleverantör nollställs i natt):** Gav samtycke till måendeloggen (art. 9).
Loggade humör "Tufft" en gång och sparade en reflektion ("Orkar inte mycket idag. Låg energi.").
Slog PÅ delning av välmåendedata med Demo Coach (samtycke, lämnat på — tillåtet enligt uppdraget).
Startade ett CV i den fullständiga byggaren: valde standardmallen, gick igenom steg 1–4, och
klickade på "Generera sammanfattning" så fältet nu innehåller den fejkade AI-mallen (se UT1) —
detta ligger kvar i kontot. Slog på och av Fokusläge samt Större text igen (återställt). Rörde
inte "Påminn om pauser". Gjorde ingen frånvaroanmälan — kontot hade inget planerat pass att
anmäla frånvaro på (se UT5).

---

## Helhetsintryck

"Jag ser att jag inte behöver göra något om jag inte orkar — Min vecka säger det rakt ut, och det
är skönt. Men när jag klickar på 'Generera sammanfattning' i CV:t och det bara skriver
'[yrke]' och '[X] års erfarenhet' utan att säga att det inte är riktig AI, känns det som att
verktyget ljuger för mig på just det stället jag är som mest sårbar — mitt CV. Och när jag pratar
med arbetsterapeuten i AI-teamet men AI är avstängt, är det bra att den säger det direkt. Men då
borde inte knapparna bredvid låtsas fungera." De stora, ärliga sakerna — samtyckesskärmen, vad
konsulenten faktiskt ser, det tomma "Ingen vecka planerad"-läget — är byggda med respekt för en
trött läsare. Det som skaver är en handfull ställen där appen låtsas ha gjort något den inte gjort.

**De 3 viktigaste:**
1. **CV:ts "AI-skrivhjälp" är helt fejkad, alltid** — samma hårdkodade hakparentes-text, en
   låtsad väntetid med spinner, ingen som helst markering att det inte är AI (UT1).
2. **"Det finns luckor i din erfarenhet" visas innan ett enda jobb är ifyllt** — en statisk
   varningstext som ger sken av analys som aldrig gjorts, och portalen har ingen riktig
   glapp-förklaringsfunktion trots att det är precis vad Amina behöver (UT2).
3. **AI-teamets sidopanel är död när AI är av** — personlighet, svarslängd och fyra
   snabbfunktioner går att klicka på, men gör absolut ingenting (UT3).

---

## Tidsåtgång / friktion

| Uppgift | Klick | Väntan | Kommentar |
|---|---|---|---|
| Logga mående, första gången | 4 (öppna Hälsa → samtyck → välj humör → spara reflektion) | ~3–8 s tom snurra efter samtycket | Ingen text förklarar väntan (UT4) |
| Logga mående, andra gången | 1 | <1 s | Snabbt när samtycket väl är givet |
| Skriv första dagboksinlägget | 2 (Dagbok → "Skriv ditt första inlägg") | ingen | Kräver inget samtycke — bra |
| Hitta Lugnare läge/fokusläge | 2 (fäll ut panelen → slå på växeln) | ingen | Panelen ligger sist i sidopanelen, hopfälld; finns inte alls på hubbsidor (Översikt) |
| Se vad konsulenten ser om mig | 1 (Din konsulent, sektionen finns direkt) | ingen | Bra synlighet, ingen extra klickväg |

---

## Kritiskt

**UT1: CV-byggarens "AI-skrivhjälp" är helt fejkad — alltid samma text, ingen AI inblandad, ingen varning.** · *nytt*
- **Var:** CV → fullständig byggare → Steg 3: Profil → Sammanfattning → knappen "✨ AI-skrivhjälp / Generera sammanfattning".
- **Belägg:** `d-28-efter-generera-sammanfattning-ai-av.png` visar textfältet ifyllt med
  "Erfaren [yrke] med [X] års erfarenhet inom [område]. Jag brinner för [intresse] och vill nu ta
  nästa steg i min karriär." Nätverksloggen under klicket var tom (`NATVERKSANROP UNDER GENERERA: []`
  i skriptkörningen) — inget anrop görs alls. `textarea.inputValue()` bekräftar att texten, inte en
  placeholder, faktiskt skrivs in i fältet.
- **Fil:** `client/src/components/cv/AIHelpButton.tsx:12-25` — kommentaren i koden säger det
  rakt ut: `// Simulate AI processing`, följt av `await new Promise(r => setTimeout(r, 800))`
  innan `onFill()` körs och knappen visar "Klart!". `client/src/pages/CVBuilder.tsx:1052` är den
  enda platsen knappen används, kopplad till `t('cvBuilder.summary.aiTemplate')`.
  `client/src/i18n/locales/sv.json:7446` har den hårdkodade strängen. Detta gäller **alla**
  användare, oavsett om organisationens AI är på eller av — knappen ringer aldrig något API.
- **Varför det är kritiskt:** knappen heter "AI-skrivhjälp" och visar en snurra med texten
  "Fyller i..." som om något bearbetas. Ingenting i gränssnittet säger att resultatet är en
  generisk mall. En trött användare som litar på verktyget kan lämna kvar "[yrke]" och "[X] års
  erfarenhet" ordagrant i det CV hon skickar till en arbetsgivare. Portalen har redan löst
  samma problem korrekt på ett annat ställe (personligt brev, se UT9) — mönstret bara saknas här.

## Viktigt

**UT2: "Tidsluckor"-varningen på CV:ts Erfarenhet-steg är statisk och visas innan någon data finns — och portalen saknar en riktig funktion för att förklara ett glapp.** · *nytt*
- **Var:** CV → Steg 4: Erfarenhet. Varningsrutan "Tidsluckor — Det finns luckor i din
  erfarenhet. Överväg att lägga till annan relevant erfarenhet som volontärarbete eller
  praktik." visades med **noll** jobb tillagda ("Inga jobb tillagda ännu").
- **Belägg:** `m-dark-29-cv-steg4.png` och `txt/m-dark-29-cv-steg4.txt`.
- **Fil:** `client/src/components/cv/ContextualHelp.tsx:66-85` — `helpDatabase['experience']`
  är en fast lista av tips (`ex-1`, `ex-2`, `ex-3`) som renderas oavsett faktiskt CV-innehåll.
  Ingen kod beräknar om det faktiskt finns en lucka mellan två anställningar.
- **Vad som saknas:** Amina vill kunna förklara sitt treåriga glapp utan att ljuga. Sökning i
  koden (CVBuilder.tsx, aktivitetsschema, profilmodell) visar ingen periodtyp för "paus i
  arbetslivet" eller ett förklaringsfält kopplat till erfarenheten — bara det generiska rådet
  ovan. Se förslag UT8.

**UT3: AI-teamets sidopanel (personlighet, svarslängd, fyra snabbfunktioner) är fullt synlig och klickbar trots att AI är avstängt av organisationen — och gör ingenting.** · *nytt*
- **Var:** AI-team → välj "Arbetsterapeut" → sidopanelen till vänster (dator) / under chatten
  (mobil) → t.ex. knappen "Hantera stress" under "Snabbfunktioner".
- **Belägg:** `m-dark-23-efter-snabbfunktion-klick.png` — sidan är oförändrad efter klicket,
  fortfarande bara "Din organisation har valt att inte använda AI"-texten i chattytan.
  Nätverksloggen fick ingen ny post av klicket.
- **Fil:** `client/src/pages/AITeam.tsx:52-54` (`handleQuickAction` anropar alltid
  `chatRef.current?.sendMessage(prompt)`) och `:158-172` (`PersonalityDropdown`,
  `ResponseModeSelector`, `QuickActions` renderas ovillkorligt i sidopanelen, oavsett org-status).
  `client/src/components/ai-team/AgentChat.tsx:191-196` har skyddet
  (`if (orgSparr) return`) som gör att `sendMessage` avbryter helt tyst — men bara **chattytan**
  (rad 495-501) vet om `orgSparr`; sidopanelen gör det inte.
- **Konsekvens:** en användare som inte vet att AI är av (t.ex. om hon hoppar rakt till
  sidopanelen utan att läsa chattytan) kan klicka flera gånger på en knapp som aldrig svarar,
  utan att någonsin få veta varför.

## Skav

- **UT4:** Måendeloggen på Hälsa visar en tom snurra i flera sekunder (uppmätt ~3–8 s i den här
  körningen) efter att samtycket getts, utan text som förklarar vad som laddas. På en kväll med
  låg ork är en oförklarad väntan lätt att tolka som att sidan hängt sig. `m-dark-05-halsa-efter-samtycke.png`
  (fortfarande tom efter första sekunderna) mot `m-dark-05b/05c` (klart inom 8 s). · *nytt*
- **UT5:** Min vecka var helt tom för Amina ("Ingen vecka planerad än — Din konsulent lägger
  upp veckan tillsammans med dig. Tills dess finns det inget du behöver göra här.",
  `MinVecka.tsx:209`). Meddelandet i sig är bra och ärligt, men konsekvensen är att hela
  "jag orkar inte idag"-flödet (att slippa ett pass) inte går att pröva eller använda — enda
  vägen att signalera låg kapacitet är humörloggen på Hälsa, som ingen ser förrän hon aktivt
  slår på delning. `m-dark-03-min-vecka.png`. · *nytt*
- **UT6:** Direkt bredvid humörloggen på Hälsa, oavsett vilket humör man just valt, visas
  "Dagens aktiviteter — 0 av 4 avklarade" (Gå en promenad, Meditation 10 min, Skriv 3 positiva
  saker, Kontakta en vän). Att möta en ikryssningsbar prestationslista precis efter att ha
  markerat "Tufft" går emot manifestets regel om att inte visa prestationsspråk i
  hjälteposition för deltagare (DESIGN.md §1). `m-dark-08-humor-tufft-vald.png`. · *nytt*
- **UT7:** Motiverande citat på Hälsa attribueras till "— Okänd" (t.ex. "Ta det i din egen
  takt" — Okänd, "Varje steg framåt är ett steg närmare ditt mål" — Okänd). Det ser ut som en
  riktig källhänvisning som saknas snarare än ett medvetet stilval, vilket känns lite
  slarvigt på en sida som annars är noga med ton. `m-dark-07-halsa-redo.png`. · *nytt*

## Förslag på utveckling

- **UT8: En riktig "förklara ett glapp"-funktion i CV:t.** En periodtyp i Erfarenhet-steget,
  t.ex. "Paus i arbetslivet", med ett kort valfritt fält för orsak (färdiga alternativ:
  sjukskrivning, vård av anhörig, studieuppehåll, annat). Den renderas i CV:t som en vanlig
  post utan att kräva detaljer Amina inte vill dela. **Värde:** löser exakt det hon bad om —
  att förklara tre år utan att ljuga eller känna skam. **Storlek:** medel — ny fältgrupp i
  CV-datamodellen, mallrendering i alla CV-mallar, uppdaterad `ContextualHelp`-text som faktiskt
  räknar på verkliga datumluckor i stället för att alltid visa samma varning.

- **UT9: Ärlig reservtext i stället för fejkad AI i CV-sammanfattningen.** Portalen har redan
  rätt mönster i personligt brev (`sv.json:1469`, `blankTemplateBody`: "Vi vet inget om dig
  ännu, så vi lät inte AI:n skriva — den hade behövt gissa. I stället får du en stomme..."). Byt
  `AIHelpButton.tsx`s fejkade snurra och `cvBuilder.summary.aiTemplate` mot samma ärliga
  formulering, och ta bort "Fyller i..."-spinnern som simulerar bearbetning som aldrig sker.
  **Värde:** stänger den mest akuta tillitsluckan i CV-byggaren. **Storlek:** liten — texttbyte
  plus en rad UI (ingen ny backend-integration krävs, snarare tvärtom: mindre låtsad AI).

- **UT10: En lättviktig "tuff dag"-signal till konsulenten.** I dag är det allt-eller-inget:
  antingen delar man hela humörloggen (Inställningar → Integritet) eller inget alls. Ge Hälsa
  en enda knapp, "Berätta för Demo Coach att idag är en tuff dag", som skickar exakt ett
  meddelande — utan att slå på permanent delning av mående, energi, stress och sömn. **Värde:**
  sänker tröskeln för just den handling Amina efterfrågade ("säga att jag inte orkar idag utan
  att skämmas") utan att tvinga fram ett större samtyckesbeslut. **Storlek:** liten — återanvänd
  `consultant_messages`-vägen som redan finns på Min konsulent.

- **UT11: Laddningstext på Hälsa i stället för en tom snurra.** "Hämtar din mående-logg …" under
  spinnern gör väntan begriplig. **Värde:** litet men konkret — tar bort en händelse som annars
  lätt tolkas som att sidan hängt sig. **Storlek:** mycket liten.

- **UT12: Koppla dagens mående till vad Översikt visar överst.** I dag är "Ett bra nästa steg"
  på Översikt statiskt (oftast "Börja med ditt CV") oavsett hur man mår. Om humörloggen från
  samma dag redan säger "Tufft", kunde nästa-steg-rutan byta till något lättare (t.ex. "Läs en
  kort artikel" eller "Skriv en rad i dagboken") i stället för att alltid föreslå en uppgift
  som CV-byggande. **Värde:** gör hela startupplevelsen anpassningsbar efter dagsform, precis
  det Amina efterfrågar. **Storlek:** medel — kräver att `nastaStegRegler.ts` läser dagens
  `mood_logs`-rad.

- **UT13: Möjlighet att starta alltid i Lugnare läge.** En inställning under Tillgänglighet,
  "Starta alltid i fokusläge", så att Amina slipper leta upp och slå på växeln varje kväll hon
  loggar in trött. **Värde:** sänker tröskeln för den grupp panelen redan är byggd för.
  **Storlek:** liten — en boolean i `settingsStore` som läses vid inloggning.

## Fungerar bra nu (för balans)

Samtyckesskärmen för måendeloggen är tydlig och konkret om vad som samlas in, varför, och vem
som ser det — inklusive den viktiga meningen "Din humörlogg ser konsulenten bara om du själv
slår på delning". "Det här ser din konsulent" på Min konsulent, med en riktig loggrad över **när**
konsulenten öppnat vilken sida, är ovanligt transparent och byggdes uppenbarligen med tanke på
just den här oron. Delningsväxlarna för hälsodata respektive välmåendedata är separata,
fungerar korrekt (testat: slå på, spara, ladda om — höll), och varningstexten "Din konsulent
kan nu se denna data" speglar det som faktiskt är sparat, inte bara vad som råkar stå i
formuläret just då. AI-teamets besked när organisationen stängt av AI kommer direkt, med tre
konkreta alternativ, innan man hunnit skriva något (RD32 — bekräftat löst). Min veckas tomma
läge är ärligt i stället för att låtsas att det finns något att göra. Fokusläget gör om Min
konsulent till en lugn steg-för-steg-guide. Dagbokens tomma läge har god kontrast i mörkt läge.

## Inte prövat

Skärmläsare. Surfplatta. Frånvaroanmälan (inget planerat pass fanns att anmäla frånvaro på).
Kognitiv träning och Akut stöd-flikarna på Hälsa. Vad som händer om man byter organisation från
en med AI på till en med AI av mitt i en pågående CV-session. Ett riktigt AI-anrop (avstängt med
flit i Demoleverantör).
