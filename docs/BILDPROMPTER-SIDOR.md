# Bildprompter per sida — "Matchdagen" (2026-09-10, v2)

**Beställning (Mikael 2026-09-10):** mer bilder, så portalen känns mer som ett spel och
inspirerar visuella människor. Ett dokument med kompletta prompter per sida, flera bilder
per ark. Bilderna genereras i ChatGPT av Mikael; Claude kopplar in dem.

**Stilbeslut samma dag:** första versionen byggde på den platta vektorstilen i
GRAFIK-PLAN plus en maskot. Mikael: "jag gillar inte bolibompa barn stilen … jag vill ha
en modern realistisk grafik" och "tänk snarare EA Sports än Bolibompa". Hela dokumentet
är omskrivet efter det. **Referensen är ett modernt sportspels presentation:**
fotorealistisk 3D-render eller studiofoto, dramatiskt riktat ljus, hög kontrast, djup,
dynamiska vinklar, premiumkänsla.

---

## 0. Testet först: Översikt i två stilar

**Beslut Mikael 2026-09-10:** "gör till översikten först, så testar vi. både din mjukare
realism och min ea sport realism." Samma två motiv (scenen och fyra utsnitt) i två stilar.
Generera alla fyra, koppla in A på dev och B på dev, jämför i ljust och mörkt läge, välj —
sedan skrivs resten av arken i den stil som vann.

| | A — mjuk realism | B — EA Sports |
|---|---|---|
| Rendering | fotografi, naturligt dagsljus, äkta material | 3D-render/studiofoto, dramatiskt riktat ljus |
| Bakgrund | ljus, luftig, skandinavisk miljö | mörk, djup, ljusfall |
| Hubbfärg | ett föremål eller ett plagg i mint | kantljus i mint längs konturen + glöd |
| Känsla | lugn, hemma, i egen takt | fokus, matchdag, premium |

### Test A1 — Översikt, scen, mjuk realism — `scen-oversikt-A.png`

```
Modernt, realistiskt fotografi i redaktionell stil. Bredformat 1536×1024. Naturligt dagsljus från ett fönster till vänster, dämpade varma toner, äkta material, grunt skärpedjup, kameran i ögonhöjd. Ingen text, inga logotyper, inga siffror, inga UI-element. Inga illustrationer, inget tecknat, inga maskotar. Motiv: ett ljust svenskt kök på morgonen. Vid ett bord av ljust trä sitter en person sedd snett bakifrån, i en enkel tröja, med en kaffekopp, en uppslagen anteckningsbok och en stängd laptop framför sig. Genom fönstret skymtar en stad i oskärpa. Ett enda föremål i mintgrönt #1A7757 — koppen — är den enda starka färgen i bilden; resten är trä, vitt, ljusgrått och varmt morgonljus. Placera bordet och personen i den högra två tredjedelen; lämna den vänstra tredjedelen lugn (väggyta i mjukt ljus) så att text kan ligga där. Inget ansikte, inkluderande figur i ålder, kropp och kön.
```

### Test A2 — Översikt, fyra utsnitt, mjuk realism (2×2) — `spel-oversikt-A-1..4.png`

```
Modernt, realistiskt produktfotografi. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, ett frilagt föremål centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, inget golv, ingen skugga på bakgrunden. Mjukt naturligt dagsljus från vänster, äkta material, skarpa detaljer, dämpade varma toner. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Cellerna radvis: 1) En liten träskylt med tre pilar i olika riktningar, av obehandlat trä, sedd rakt framifrån (ett nästa steg att välja). 2) En uppslagen anteckningsbok med en tom sida och en träpenna tvärs över, sedd rakt uppifrån (inget gjort än, en början). 3) Ett par rena vita sneakers sedda från sidan, redo (start). 4) En kikare av mässing och läder som ligger på ett trä-räcke (överblick). Ett litet inslag av mintgrönt #1A7757 i varje föremål — snöret, pennans ände, skosnörena, remmen.
```

### Test B1 — Översikt, scen, EA Sports — `scen-oversikt-B.png`

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Bredformat 1536×1024. Skarpa detaljer, riktiga material, dramatiskt riktat huvudljus, hög kontrast, grunt skärpedjup, låg kameravinkel. Ingen text, inga logotyper, inga siffror, inga UI-element. Inga illustrationer, inget tecknat, inga maskotar. Motiv: en person sedd bakifrån, i vardagskläder med en enkel ryggsäck, går genom en mörk betongtunnel mot en ljus öppning — och det som väntar utanför öppningen är inte en arena utan en svensk stad i gryningsljus (tak, en kyrkspira, kranar, en vattenyta). Personen är i silhuett mot ljuset, mitt i ett steg. Kantljus i mintgrönt #5FB89A tecknar konturen av axlar och ryggsäck; tunnelns väggar har ett svagt mintgrönt återsken. Bakgrunden utanför är varmvit och gyllene. Placera personen och öppningen i den högra två tredjedelen; lämna den vänstra tredjedelen mörk och lugn så att text kan ligga där. Inget ansikte, inkluderande figur i ålder, kropp och kön.
```

### Test B2 — Översikt, fyra utsnitt, EA Sports (2×2) — `spel-oversikt-B-1..4.png`

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, ett frilagt motiv centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, inget golv, ingen skugga på bakgrunden. Skarpa detaljer, riktiga material, dramatiskt huvudljus och ett kantljus i mintgrönt #5FB89A längs varje motivs kontur. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Cellerna radvis: 1) En modern vägvisare av borstad metall med tre pilar i olika riktningar, sedd snett underifrån (ett nästa steg att välja). 2) En uppslagen svart anteckningsbok med en enda tom sida och en metallpenna som ligger tvärs över, sedd rakt uppifrån med hårt sidoljus (inget gjort än, en början). 3) Ett par nya, rena sneakers på en betongkant, sedda från sidan i låg vinkel, redo (start). 4) En kikare av metall och gummi som ligger på ett räcke med en suddig stad i bakgrunden (överblick).
```

**Så testar vi:** lägg de fyra filerna i `design-source/illustrations-raw/`. Claude kör
pipelinen, kopplar in A på Översikt (scenen bakom hälsningsraden, dämpad; utsnitt 2 som
tomtillstånd i "Det som är igång", utsnitt 4 vid "Se allt du har gjort"), tar skärmbilder i
ljust och mörkt, byter till B, tar samma skärmbilder, och lägger båda i en artifakt att
välja ur. Vinnaren styr ark 1–23 nedan (skrivna i B-stil; A-stil kan härledas rad för rad
med samma motiv).

## 1. Stilen: EA Sports, inte Bolibompa

| | Så här | Inte så här |
|---|---|---|
| **Rendering** | Fotorealistisk 3D-render eller studiofotografi, skarpa detaljer, riktiga material (borstad metall, glas, papper med struktur, tyg) | Platt vektor, tecknat, pastellfigurer, maskotar |
| **Ljus** | Ett dramatiskt huvudljus + ett **kantljus i hubbens färg** (rim light) som tecknar konturen. Mörk eller djup bakgrund med mjukt ljusfall | Jämnt dagsljus, vit bakgrund, "glad" färgsättning |
| **Komposition** | Låg kamera, grunt skärpedjup, motivet nära, rörelse i bilden (ett papper som lyfter, ett steg som tas) | Centrerade ikonlika motiv, allt i fokus |
| **Människor** | Bakifrån, från sidan eller i silhuett mot ljuset. Aldrig ett tydligt ansikte. Inkluderande i ålder, kropp och kön | Leende porträtt, stockfoto-känsla |
| **Text** | Ingen text, inga logotyper, inga tal, inga UI-element i bilden | Skyltar med ord, siffror, "poäng" |
| **Ton** | Fokus, förberedelse, matchdag, lugn styrka | Stress, tävling mot andra, prestation mätt i siffror |

**Det som lånas från sportspelet är presentationen — inte poängen.** DESIGN.md §1
förbjuder prestationsmätningar i hjälteposition, så inga tal, ingen ranking, inga
staplar i bilderna. Det som visas är **förberedelsen** (träningen, utrustningen, planen)
och **matchdagen** (intervjun, mötet, brevet som skickas).

**Hubbfärgen är kantljuset.** Varje sida har en hubb, och hubbens färg är det färgade
ljuset i bilden — inte ett färgfilter över allt, utan en ljuskant längs motivet och en
glöd i bakgrunden. Resten av paletten är neutral: kol, grafit, betong, varmvitt.

| Hubb | Kantljus | Hex |
|---|---|---|
| Översikt | mintgrönt | `#1A7757` (ljusare i glöden: `#5FB89A`) |
| Söka jobb | persika/bärnsten | `#A85D24` (glöd `#E0955A`) |
| Karriär | korallrött | `#B85363` (glöd `#E8899A`) |
| Resurser | djupblått | `#266DA0` (glöd `#6FA6D8`) |
| Din vardag | lila | `#7058A8` (glöd `#A48FD6`) |

**Två bildtyper — och bara den ena är magenta:**

| Typ | Format | Bakgrund | Filnamn | Var |
|---|---|---|---|---|
| **Scen** | bred, 1536×1024, motivet i högra två tredjedelarna, vänstra tredjedelen lugn (text läggs där) | naturlig, mörk, med ljusfall | `scen-<sida>.png` | hubbheroes, Översikt, landningssidan, sektionsbilder |
| **Utsnitt** | kvadrat 1024×1024, rutnät 2×2 eller 3×3, ett frilagt motiv per cell | **solid magenta #FF00FF** inklusive mellanrummen (GRAFIK-PLAN §3, pipelinen nyckar bort den) | `spel-<sida>-<n>.png` per cell | tomtillstånd, framgång, sektionsspots, milstolpar |

Scenerna behöver ingen transparens och ska INTE ha magenta. Utsnitten ska ha det: ett
frilagt, realistiskt renderat föremål eller en figur i silhuett, med kantljus, på magenta.
Pipelinen `client/scripts/optimize-illustrations.cjs` gör resten. Spara allt i
`design-source/illustrations-raw/`, beskär arken till en PNG per cell.

**Grundtexten** står med i varje prompt så att en ruta räcker att kopiera:

> Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel.
> Skarpa detaljer, riktiga material, dramatiskt riktat huvudljus, hög kontrast, grunt
> skärpedjup, låg kameravinkel. Ingen text, inga logotyper, inga siffror, inga UI-element.
> Inga illustrationer, inget tecknat, inga maskotar. Människor visas bakifrån, från sidan
> eller i silhuett mot ljuset — aldrig ett tydligt ansikte — och inkluderande i ålder,
> kropp och kön.

**Vad som händer med de 66 befintliga bilderna:** de är platt vektor (GRAFIK-PLAN §1,
"en illustrationsfamilj"). Två stilar samtidigt är värre än en. Hubbheroes och
tomtillstånd byts först (ark 1, 2, 5, 13, 16, 18, 22 nedan), sedan kunskapsbankens
banners. Ikonerna `icon-*.webp` är symboler, inte bilder, och står kvar tills vidare.

---

## 2. Arken

### Ark 1 — Matchdagen (scen) — `scen-oversikt.png`

Översiktens och landningssidans stora bild. Tunneln ut mot planen — men planen är en
stad i gryning.

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Bredformat 1536×1024. Skarpa detaljer, riktiga material, dramatiskt riktat huvudljus, hög kontrast, grunt skärpedjup, låg kameravinkel. Ingen text, inga logotyper, inga siffror, inga UI-element. Inga illustrationer, inget tecknat, inga maskotar. Motiv: en person sedd bakifrån, i vardagskläder med en enkel ryggsäck, går genom en mörk betongtunnel mot en ljus öppning — och det som väntar utanför öppningen är inte en arena utan en svensk stad i gryningsljus (tak, en kyrkspira, kranar, en vattenyta). Personen är i silhuett mot ljuset, mitt i ett steg. Kantljus i mintgrönt #5FB89A tecknar konturen av axlar och ryggsäck; tunnelns väggar har ett svagt mintgrönt återsken. Bakgrunden utanför är varmvit och gyllene. Placera personen och öppningen i den högra två tredjedelen; lämna den vänstra tredjedelen mörk och lugn så att text kan ligga där. Inkluderande figur, inget ansikte.
```

### Ark 2 — Översikt: utsnitt (2×2) — `spel-oversikt-1..4.png`

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, ett frilagt motiv centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, ingen skugga på bakgrunden, inget golv. Skarpa detaljer, riktiga material, dramatiskt huvudljus och ett kantljus i mintgrönt #5FB89A längs varje motivs kontur. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Cellerna radvis: 1) En modern vägvisare av borstad metall med tre pilar i olika riktningar, sedd snett underifrån (ett nästa steg att välja). 2) En uppslagen svart anteckningsbok med en enda tom sida och en metallpenna som ligger tvärs över, sedd rakt uppifrån med hårt sidoljus (inget gjort än — och det är en början). 3) Ett par nya, rena sneakers på en betongkant, sedda från sidan i låg vinkel, redo (start). 4) En kikare av metall och gummi som ligger på ett räcke med en suddig stad i bakgrunden (överblick, "allt du har gjort").
```

### Ark 3 — Landningssidan: tre steg (3×1, bred) — `scen-landning-1..3.png`

Steg-sektionen "Så här fungerar det". Tre scener i samma ljus, som tre kapitel.

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Bredformat 1536×1024 delat i exakt 3 lika breda stående celler sida vid sida med tunna lika stora mellanrum. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF utanför själva motiven — men varje cell innehåller en hel scen med egen mörk bakgrund, som ett stående foto med rak kant, så att cellerna går att beskära var för sig. Samma ljus i alla tre: mörk bakgrund, dramatiskt huvudljus, kantljus i mintgrönt #5FB89A. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Människor utan tydligt ansikte, inkluderande. Cell 1, "upptäck dina styrkor": en kompass av mässing och glas i en öppen hand, nålen skarp, handen och ärmen i halvmörker. Cell 2, "skapa ditt CV": ett vitt A4-papper med struktur som lyfter från ett mörkt skrivbord, ljuset går igenom papperet, en penna bredvid. Cell 3, "hitta och sök jobb": en person sedd bakifrån som står framför en stor mörk glasfasad där en stad speglas i gryningsljus, ryggsäck på, ett steg från dörren.
```

### Ark 4 — Inloggning, registrering, onboarding (2×2) — `spel-start-1..4.png`

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, ett frilagt motiv centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, inget golv, ingen skugga på bakgrunden. Skarpa detaljer, riktiga material, dramatiskt huvudljus och kantljus i mintgrönt #5FB89A längs varje kontur. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Cellerna radvis: 1) Inloggning: en modern nyckel av borstat stål med en enkel läderrem, sedd i närbild med reflexer. 2) Registrering: ett tomt namnbrickehölje i matt svart plast och metall, det slags man bär på en konferens, utan text. 3) Välkommen: en dörr av mörkt trä på glänt med varmt ljus som faller ut genom springan, sedd i låg vinkel. 4) Onboarding: en öppen ryggsäck i mörkt canvas sedd uppifrån, med tre saker halvt nedpackade: en hopvikt karta, en kompass och en anteckningsbok.
```

### Ark 5 — Söka jobb (scen) — `scen-jobb.png`

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Bredformat 1536×1024. Skarpa detaljer, riktiga material, dramatiskt riktat huvudljus, hög kontrast, grunt skärpedjup, låg kameravinkel. Ingen text, inga logotyper, inga siffror, inga UI-element. Inga illustrationer, inget tecknat, inga maskotar. Motiv: ett omklädningsrum i mörkt trä och betong sett från låg vinkel, men det som hänger på kroken är inte en matchtröja utan en välpressad skjorta och en enkel kavaj, med ett par putsade skor på bänken under och en mapp med papper bredvid. En person sedd bakifrån, i silhuett, står och knäpper manschetten. Hårt huvudljus uppifrån, kantljus i bärnstensorange #E0955A längs skjortans och axlarnas kontur, varm glöd i bakgrunden. Placera motivet i den högra två tredjedelen; lämna den vänstra tredjedelen mörk och lugn. Inget ansikte, inkluderande figur.
```

### Ark 6 — Söka jobb: verktygen (3×3) — `spel-jobb-1..9.png`

Ett frilagt föremål per verktyg, samma ljus, samma kantljus. Används som spots på
verktygssidorna och i tomtillstånd.

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 9 celler i ett jämnt 3×3-rutnät med lika stora mellanrum, ett frilagt motiv centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, inget golv, ingen skugga på bakgrunden. Skarpa detaljer, riktiga material, dramatiskt huvudljus och kantljus i bärnstensorange #E0955A längs varje kontur; alla nio föremålen i samma skala och samma ljus. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Cellerna radvis: 1) Sök jobb: ett förstoringsglas av svart metall och glas, sett snett med reflex i linsen. 2) Ansökningar: en bunt vita kuvert i ett stålställ, ett kuvert lite utdraget. 3) Spontanansökan: en mässingsdörrknackare på en mörk dörr, i närbild. 4) CV: ett vitt A4-papper med tydlig pappersstruktur, lätt böjt, som fångar ljuset. 5) Personligt brev: en reservoarpenna av svart lack och guld som ligger på ett tjockt kuvert. 6) Intervjuträning: en studiomikrofon på ett svart stativ, sedd i låg vinkel. 7) Lön: en gammaldags balansvåg av mässing, skålarna i jämvikt. 8) LinkedIn: en modern laptop halvöppen sedd från sidan med ljus som faller ut ur skärmen (ingen skärmbild synlig). 9) Ny i Sverige: en jordglob av mörkt glas med Skandinavien vänt mot kameran, ljus inifrån.
```

### Ark 7 — Ansökningar (2×2) — `spel-ansokningar-1..4.png`

Statusarna som ögonblick på matchdagen. Inga siffror.

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, ett frilagt motiv centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, inget golv, ingen skugga på bakgrunden. Skarpa detaljer, riktiga material, dramatiskt huvudljus och kantljus i bärnstensorange #E0955A. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Människor utan ansikte, inkluderande. Cellerna radvis: 1) Skickad: en hand i skjortärm som släpper ett vitt kuvert i springan på en modern brevlåda av mörk metall, i närbild. 2) Väntar på svar: en enkel armbandsklocka av stål på en handled som vilar på ett mörkt bord, ljuset på urtavlan (ingen tid läsbar). 3) Intervju: två moderna stolar av svart läder och stål mitt emot varandra, sedda i låg vinkel, ljuset faller på den tomma stolen närmast kameran. 4) Erbjudande: ett öppnat kuvert med ett hopvikt papper som sticker upp, i hårt sidoljus, papperets kant lyser.
```

### Ark 8 — Spontanansökan (2×2) — `spel-spontan-1..4.png`

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, ett frilagt motiv centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, inget golv, ingen skugga på bakgrunden. Skarpa detaljer, riktiga material, dramatiskt huvudljus och kantljus i bärnstensorange #E0955A. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Cellerna radvis: 1) En modern glasdörr till ett kontor med ett handtag av borstat stål, sedd snett från sidan, ljus inifrån. 2) En stadskarta i relief av mörkt material med tre små metallnålar i bärnstensfärg nedstuckna. 3) Ett kalenderblad av tjockt papper med en enda dag markerad med ett hål efter en nål (inga siffror läsbara), i sidoljus. 4) Två händer som möts i ett handslag, sedda i närbild, ärmar i mörkt tyg, kantljus längs händerna.
```

### Ark 9 — CV (2×2) — `spel-cv-1..4.png`

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, ett frilagt motiv centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, inget golv, ingen skugga på bakgrunden. Skarpa detaljer, riktiga material, dramatiskt huvudljus och kantljus i bärnstensorange #E0955A. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Cellerna radvis: 1) Ett vitt A4-papper med tydlig struktur som svävar lätt vridet i luften, ljuset går igenom det (CV:t). 2) Ett helt tomt vitt papper på ett mörkt skrivbord med en metallpenna bredvid, sett rakt uppifrån (inget CV än, en början). 3) En hand som lyfter ett papper ur en öppen arkivlåda av svart metall (ladda upp / importera). 4) Ett papper som rullats ihop och bundits med ett smalt läderband, som ett diplom, i hårt sidoljus (klart).
```

### Ark 10 — Personligt brev (2×2) — `spel-brev-1..4.png`

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, ett frilagt motiv centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, inget golv, ingen skugga på bakgrunden. Skarpa detaljer, riktiga material, dramatiskt huvudljus och kantljus i bärnstensorange #E0955A. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Cellerna radvis: 1) En reservoarpenna av svart lack och guld, spetsen mot ett tjockt papper, i extrem närbild med bläckets glans. 2) Ett tjockt kuvert av krämvitt papper med ett lacksigill i bärnstensfärg, utan text. 3) Ett tomt kuvert och en penna på ett mörkt bord, sett uppifrån, hårt sidoljus (inget brev än). 4) Två kuvert bredvid varandra, det ena i ljus, det andra i skugga (välj mall).
```

### Ark 11 — Intervjuträning (2×2) — `spel-intervju-1..4.png`

Här är sportspelet som tydligast: träningen före matchen.

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, ett frilagt motiv centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, inget golv, ingen skugga på bakgrunden. Skarpa detaljer, riktiga material, dramatiskt huvudljus och kantljus i bärnstensorange #E0955A. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Människor utan ansikte, inkluderande. Cellerna radvis: 1) En studiomikrofon på stativ i låg vinkel, som före en presskonferens. 2) En person sedd bakifrån som sitter på en stol av svart läder framför en tom stol, axlarna raka, händerna på knäna (öva). 3) En person i silhuett framför en hög spegel med svag reflex, i halvmörker med kantljus (förbered dig). 4) En stoppurklocka av stål i en hand, tummen på knappen, i närbild (genomförd övning — inga siffror läsbara på urtavlan).
```

### Ark 12 — Lön, LinkedIn, Ny i Sverige (3×2) — `spel-lon-1..2.png`, `spel-linkedin-1..2.png`, `spel-nyisverige-1..2.png`

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 6 celler i ett jämnt 3×2-rutnät (tre kolumner, två rader) med lika stora mellanrum, ett frilagt motiv centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, inget golv, ingen skugga på bakgrunden. Skarpa detaljer, riktiga material, dramatiskt huvudljus och kantljus i bärnstensorange #E0955A. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Cellerna radvis: 1) Lön: en balansvåg av mässing i jämvikt, sedd snett från sidan. 2) Lön: två händer på var sin sida av ett mörkt bord med ett papper emellan, sedda uppifrån, ärmar i mörkt tyg (ett samtal). 3) LinkedIn: en modern laptop sedd rakt från sidan, halvöppen, kallvitt ljus faller ut ur skärmen. 4) LinkedIn: ett elegant visitkort av tjockt papper med blindprägling (ingen läsbar text) som hålls fram av två fingrar. 5) Ny i Sverige: en jordglob av mörkt glas med Skandinavien mot kameran, upplyst inifrån. 6) Ny i Sverige: ett dokument med ett präglat sigill och ett band, som ett intyg, utan läsbar text.
```

### Ark 13 — Karriär (scen) — `scen-karriar.png`

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Bredformat 1536×1024. Skarpa detaljer, riktiga material, dramatiskt riktat huvudljus, hög kontrast, grunt skärpedjup, låg kameravinkel. Ingen text, inga logotyper, inga siffror, inga UI-element. Inga illustrationer, inget tecknat, inga maskotar. Motiv: en bred trappa av ljus betong utomhus i gryning, sedd i låg vinkel underifrån så att stegen tornar upp sig; högst upp en öppning mot himlen med varmt ljus. En person sedd bakifrån är halvvägs upp, i vardagskläder, mitt i ett steg. Kantljus i korallrött #E8899A tecknar personens kontur och stegens kanter; svag korallglöd i disen. Placera trappan och personen i den högra två tredjedelen; lämna den vänstra tredjedelen mörk och lugn. Inget ansikte, inkluderande figur.
```

### Ark 14 — Intresseguiden: sex världar (3×3) — `spel-intresse-1..9.png`

De sex intresseområdena (praktisk, undersökande, konstnärlig, social, företagsam,
ordningsam) som sex stilleben i samma ljus, plus tre lägen.

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 9 celler i ett jämnt 3×3-rutnät med lika stora mellanrum, ett frilagt motiv centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, inget golv, ingen skugga på bakgrunden. Skarpa detaljer, riktiga material, dramatiskt huvudljus och kantljus i korallrött #E8899A; alla nio i samma skala. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Cellerna radvis, de sex första är stilleben för sex intresseområden: 1) Praktisk: en skiftnyckel av stål och en bit hyvlat trä, korsade. 2) Undersökande: ett mässingsteleskop på ett litet stativ. 3) Konstnärlig: en pensel med färg på spetsen bredvid en stämgaffel. 4) Social: fyra kaffekoppar av vit keramik tätt ihop, sedda uppifrån. 5) Företagsam: en liten mässingsklocka av det slag man ringer i vid en disk. 6) Ordningsam: en rad mörka arkivmappar med små metallflikar, perfekt uppradade. Sedan tre lägen: 7) En kompass av mässing och glas i en öppen hand (starta guiden). 8) En enda schackpjäs, en löpare av svart trä, i hårt sidoljus (mitt i frågorna, ett val i taget). 9) Tre av stillebenen ovan (kompass, teleskop, kaffekoppar) som miniatyrer i ett kluster, det mittersta i ljus (resultat: dina starkaste områden).
```

### Ark 15 — Kompetensanalys, Utbildning, Personligt varumärke (3×2) — `spel-kompetens-1..2.png`, `spel-utbildning-1..2.png`, `spel-varumarke-1..2.png`

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 6 celler i ett jämnt 3×2-rutnät (tre kolumner, två rader) med lika stora mellanrum, ett frilagt motiv centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, inget golv, ingen skugga på bakgrunden. Skarpa detaljer, riktiga material, dramatiskt huvudljus och kantljus i korallrött #E8899A. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Cellerna radvis: 1) Kompetensanalys: två pusselbitar av mörkt trä som nästan passar ihop, i närbild. 2) Kompetensanalys: en öppen verktygslåda av stål sedd uppifrån, några fack fyllda, ett tomt. 3) Utbildning: en stapel tjocka böcker med tygryggar, den översta uppslagen, i sidoljus. 4) Utbildning: en akademisk hatt av svart tyg på en bänk av mörkt trä. 5) Personligt varumärke: en rund handspegel av mässing som reflekterar ett varmt ljus (ingen person i spegeln). 6) Personligt varumärke: en stämpel av trä och mässing bredvid ett präglat sigill i vax, korallfärgat, utan text.
```

### Ark 16 — Resurser (scen + 3×2) — `scen-resurser.png`, `spel-resurser-1..6.png`

Scenen:

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Bredformat 1536×1024. Skarpa detaljer, riktiga material, dramatiskt riktat huvudljus, hög kontrast, grunt skärpedjup, låg kameravinkel. Ingen text, inga logotyper, inga siffror, inga UI-element. Inga illustrationer, inget tecknat, inga maskotar. Motiv: ett modernt bibliotek eller arkiv i mörkt trä och glas sett längs en lång hylla i låg vinkel, bokryggarna suddiga i förgrunden, och längst bort ett läsbord med en enda tänd lampa. En person sedd bakifrån sitter vid bordet med en uppslagen bok. Kantljus i djupblått #6FA6D8 längs hyllkanterna och personens axlar; kall blå glöd i djupet, varmt ljus vid lampan. Placera bordet och personen i den högra två tredjedelen; lämna den vänstra tredjedelen mörk och lugn. Inget ansikte, inkluderande figur.
```

Utsnitten:

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 6 celler i ett jämnt 3×2-rutnät (tre kolumner, två rader) med lika stora mellanrum, ett frilagt motiv centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, inget golv, ingen skugga på bakgrunden. Skarpa detaljer, riktiga material, dramatiskt huvudljus och kantljus i djupblått #6FA6D8. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Cellerna radvis: 1) Kunskapsbank: en tjock uppslagen bok med tygrygg, sidorna lyser i ljuset. 2) Dina dokument: en mörk läderportfölj med mässingslås, halvöppen, papperskanter synliga. 3) Externa resurser: en modern vägvisare av borstad metall med en enda pil som pekar ut ur bilden. 4) AI-team: fem moderna hörlurar av svart metall och läder upphängda i rad på en stång, i samma ljus (ett team att fråga). 5) Nätverk: fem stålkulor förbundna med tunna stålstänger, som en molekylmodell, i närbild. 6) Hjälp: en livboj av vitt och blått material, ren och modern, hängd på en krok.
```

### Ark 17 — AI-teamet: fem stationer (3×2) — `spel-agent-<id>.png`

De fem agenterna (`arbetskonsulent`, `arbetsterapeut`, `studievagledare`,
`motivationscoach`, `digitalcoach`) som fem arbetsplatser — inte som figurer. Det
undviker både maskoten och det fejkade porträttet.

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 6 celler i ett jämnt 3×2-rutnät (tre kolumner, två rader) med lika stora mellanrum, ett frilagt motiv centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, inget golv, ingen skugga på bakgrunden. Skarpa detaljer, riktiga material, dramatiskt huvudljus. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar, inga människor. Fem arbetsplatser i miniatyr, var och en ett litet stilleben med sitt eget kantljus: 1) Arbetskonsulenten: en mörk läderportfölj och en reservoarpenna, kantljus djupblått #6FA6D8. 2) Arbetsterapeuten: en mjuk grå kudde och en kopp te av vit keramik, kantljus lila #A48FD6. 3) Studievägledaren: en stapel böcker och en kompass, kantljus korallrött #E8899A. 4) Motivationscoachen: ett par sneakers och en stoppurklocka, kantljus bärnstensorange #E0955A. 5) Digitalcoachen: en surfplatta i ett svart fodral och ett par hörlurar, kantljus mintgrönt #5FB89A. 6) Alla fem stilleben tillsammans i en halvcirkel på ett mörkt bord, varje litet kluster i sitt eget kantljus.
```

### Ark 18 — Din vardag (scen + 3×2) — `scen-vardag.png`, `spel-vardag-1..6.png`

Scenen:

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Bredformat 1536×1024. Skarpa detaljer, riktiga material, dramatiskt riktat huvudljus, hög kontrast, grunt skärpedjup, låg kameravinkel. Ingen text, inga logotyper, inga siffror, inga UI-element. Inga illustrationer, inget tecknat, inga maskotar. Motiv: ett fönster i ett mörkt rum i skymning, regn på rutan, en stad utanför i oskärpa. På fönsterbrädan en kopp te som ryker, en uppslagen anteckningsbok och en liten växt. En person sedd bakifrån, i mjuk tröja, står lutad mot fönsterkarmen och tittar ut. Kantljus i lila #A48FD6 längs axlarna och koppens kant; lila glöd från staden i regnet. Placera fönstret och personen i den högra två tredjedelen; lämna den vänstra tredjedelen mörk och lugn. Inget ansikte, inkluderande figur.
```

Utsnitten:

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 6 celler i ett jämnt 3×2-rutnät (tre kolumner, två rader) med lika stora mellanrum, ett frilagt motiv centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, inget golv, ingen skugga på bakgrunden. Skarpa detaljer, riktiga material, dramatiskt huvudljus och kantljus i lila #A48FD6. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Cellerna radvis: 1) Hälsa/mående: en kopp te av vit keramik med ånga som stiger, i sidoljus. 2) Dagbok: en svart anteckningsbok med gummiband och en penna, stängd, i närbild. 3) Kalender: ett kalenderblad av tjockt papper med en enda dag markerad med en liten metallnål, inga siffror läsbara. 4) Övningar: en hoprullad träningsmatta i mörkgrått och ett par lätta hantlar av stål. 5) Min konsulent: två kaffekoppar bredvid varandra på ett mörkt bord, en av dem lite framskjuten mot kameran. 6) Profil: en enkel läderplånbok, stängd, med ett id-kort halvt utdraget (ingen läsbar text).
```

### Ark 19 — Mående som himmel (3×3) — `spel-maende-1..9.png`

Nio himlar, utan värdering. Regn är inte dåligt, det är regn.

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 9 celler i ett jämnt 3×3-rutnät med lika stora mellanrum. Varje cell är ett kvadratiskt foto av en himmel, med rak kant, så att cellerna går att beskära var för sig; mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF. Fotorealistiskt, hög kontrast, samma kamerahöjd i alla nio, en tunn horisontlinje av mörk stad längst ner i varje. Ingen text, inga siffror. Inga illustrationer, inget tecknat. Cellerna radvis: 1) Klar blå morgonhimmel. 2) Sol bakom ett enda moln. 3) Jämnt molntäcke i mjukt grått. 4) Lätt regn, dropparna syns mot ljuset. 5) Kraftigt regn och mörka moln. 6) Dimma som mjukar upp staden. 7) Vind: moln som stryker snabbt förbi, rörelseoskärpa. 8) Snöfall mot en mörk himmel. 9) Kväll: djupblå himmel med en tunn måne och stadens ljus. En svag lila #A48FD6 ton i alla nio himlarnas skuggor så att serien hänger ihop.
```

### Ark 20 — Dagbok och kalender (2×2) — `spel-dagbok-1..2.png`, `spel-kalender-1..2.png`

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, ett frilagt motiv centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, inget golv, ingen skugga på bakgrunden. Skarpa detaljer, riktiga material, dramatiskt huvudljus och kantljus i lila #A48FD6. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Cellerna radvis: 1) Dagbok: en svart anteckningsbok med ett litet hänglås av mässing — hänglåset ÖPPET och nyckeln i, i närbild (dagboken är din, privat). 2) Dagbok: en uppslagen tom sida i varmt lampljus, en penna redo (första anteckningen). 3) Kalender: ett kalenderblad av tjockt papper med en enda dag markerad med en metallnål, inga siffror läsbara. 4) Kalender: ett helt tomt kalenderblad, slätt och rent, i mjukt ljus (inget inbokat, och det är okej).
```

### Ark 21 — Milstolpar: nio föremål (3×3) — `spel-marke-1..9.png`

Milstolpar för sådant som FINNS, som frilagda föremål i stället för klistermärken. Visas
en gång som firande och sedan i profilen. Bara de man har — aldrig "0 av 9".

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 9 celler i ett jämnt 3×3-rutnät med lika stora mellanrum, ett frilagt motiv centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, inget golv, ingen skugga på bakgrunden. Skarpa detaljer, riktiga material, dramatiskt huvudljus; alla nio föremålen i samma skala, som en samling troféer i ett skåp men vardagliga och äkta. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Kantljuset växlar per cell. Cellerna radvis: 1) Första steget: ett par sneakers, kantljus mintgrönt #5FB89A. 2) Första CV:t: ett hoprullat papper med läderband, kantljus bärnsten #E0955A. 3) Första ansökan: ett kuvert med lacksigill, kantljus bärnsten #E0955A. 4) Första intervjun: en stoppurklocka av stål, kantljus bärnsten #E0955A. 5) Kompassen: en kompass av mässing, kantljus korallrött #E8899A. 6) Läsaren: en bok med tygrygg och ett bokmärke i band, kantljus djupblått #6FA6D8. 7) Sju dagar: en anteckningsbok med sju smala bokmärkesband i olika toner, kantljus lila #A48FD6. 8) Tillsammans: två kaffekoppar sida vid sida, kantljus lila #A48FD6. 9) Ett år: en enkel nyckel av borstat stål på en läderrem, kantljus mintgrönt #5FB89A.
```

### Ark 22 — Tomma tillstånd, fel och paus (2×2) — `spel-tillstand-1..4.png`

Portalens generella lägen, i mint (Översiktens färg); hubbfärgen läggs på i koden.

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, ett frilagt motiv centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, inget golv, ingen skugga på bakgrunden. Skarpa detaljer, riktiga material, dramatiskt huvudljus och kantljus i mintgrönt #5FB89A. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Cellerna radvis: 1) Inget här än: en enda grön planta i en kruka av obehandlad betong, ett nytt blad på väg upp, i sidoljus (en början, inte en brist). 2) Portalen strular: en modern vägbom av stål med reflexband, nedfälld, i halvmörker — vägen är stängd en stund, inte du. 3) Lugnare läge: en tänd lykta av svart metall och glas med en liten låga, i mörker (fokus, paus). 4) Klart för i dag: ett par sneakers avställda vid en dörrmatta, en jacka hängd över en stolsrygg, kvällsljus (avslut).
```

### Ark 23 — Premium (2×2) — `spel-premium-1..4.png`

Spår P i roadmapen: AI-funktionerna bakom premium, 99 kr/mån. Det som låses upp visas som
ljus och utrustning, inte som ett lås.

```
Fotorealistisk, cinematisk 3D-render i stil med presentationen i ett modernt sportspel. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, ett frilagt motiv centrerat i varje cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen annan bakgrund, inget golv, ingen skugga på bakgrunden. Skarpa detaljer, riktiga material, dramatiskt huvudljus och kantljus i mintgrönt #5FB89A med varm gyllene glöd. Ingen text, inga logotyper, inga siffror. Inga illustrationer, inget tecknat, inga maskotar. Cellerna radvis: 1) En strålkastare av svart metall som just tänts, ljuskäglan synlig i dis (det som låses upp är ljus, inte ett lås). 2) Fem hörlurar av svart metall och läder i rad på en stång, alla tända med en liten grön lysdiod (hela teamet med dig). 3) En nyckel av borstat stål med en läderrem på en mörk träyta, ljuset fångar kanten (uppgradera). 4) En tjock, elegant broschyr av mörkt papper, halvöppen, med blindpräglad framsida utan text (jämför i egen takt).
```

---

## 3. Efter genereringen — vad Claude gör

1. Kör `node client/scripts/optimize-illustrations.cjs` på utsnitten i
   `design-source/illustrations-raw/` (chroma-key + webp). Scenerna optimeras till webp
   utan chroma-key (~1200 px breda, kvalitet 80).
2. Kopplar in per sida: scenerna ersätter dagens `hero-*.webp` på hubbsidorna (ark 1, 5,
   13, 16, 18); utsnitten ersätter `empty-*.webp` i `EmptyState` (ark 22) och blir
   sektionsspots och framgångsbilder på verktygssidorna (ark 6–15, 20); ark 21 i profilen
   (bara de milstolpar som har underlag); ark 23 i spår P när det byggs.
3. Verifierar i ljust och mörkt läge mot dev-servern i tre bredder, sedan i prod efter
   push. Scenerna är mörka och fungerar i båda lägena; utsnittens kantljus testas mot
   både ljus och mörk yta (frans-testet i GRAFIK-PLAN §9.6).
4. Varje bild `aria-hidden`, rubriken bär betydelsen (GRAFIK-PLAN §1).
5. GRAFIK-PLAN §1 ("en illustrationsfamilj: platt vektor") skrivs om till den nya stilen
   när första batchen sitter, och de gamla vektorbilderna som ersatts tas bort ur
   `public/illustrations/`.

**Ordning som ger mest per ark:** 1 (Matchdagen, Översikt + landning) → 22 (tomma
tillstånd, syns överallt) → 5, 13, 16, 18 (hubbarnas scener, ersätter fyra vektorheroes)
→ 6 (nio verktygsspots på en gång) → 7, 9, 10, 11 → 14 → 21 → 3, 4 → 23.
