# Bildprompter per sida — "Vägen" (2026-09-10)

**Beställning (Mikael 2026-09-10):** mer bilder, så portalen känns mer som ett spel och
inspirerar visuella människor. Ett dokument med kompletta prompter per sida, flera bilder
per ark. Bilderna genereras i ChatGPT av Mikael; Claude kopplar in dem.

**Läs `docs/GRAFIK-PLAN.md` §3 först** — produktionsstandarden gäller varje ark här:
solid magenta `#FF00FF` över hela ytan (även mellanrummen), platt vänlig vektorstil, inga
gradienter/skuggor/3D, hubbfärgen som huvudfärg, inkluderande människofigurer (ryggtavlor,
ingen utpekad etnicitet eller ålder). Pipelinen `client/scripts/optimize-illustrations.cjs`
chroma-keyar bort magentan. Spara alla PNG i `design-source/illustrations-raw/`, beskär arken
till en PNG per cell med angivet filnamn.

---

## 1. Idén: en väg, en följeslagare, stationer

Spelkänsla utan spelmekanik. DESIGN.md §1 förbjuder prestationsmätningar i hjälteposition
och tonen är "lugn vän" — så det som lånas från spel är **världen**, inte poängen:

| Spelgrepp | Hur det används här | Vad det INTE blir |
|---|---|---|
| **En värld att röra sig i** | "Vägen": en slingrande stig genom ett mjukt svenskt landskap (björkar, sjö, ett litet samhälle, en stad i fjärran). Varje hubb är en **station** längs vägen, i sin hubbfärg | Ingen karta med låsta nivåer |
| **En följeslagare** | **Lykta** — en liten rund, mjuk figur i mint som bär en varm lykta och en liten ryggsäck. Alltid med, aldrig i vägen. Icke-mänsklig, så regeln om inkluderande figurer inte bryts | Ingen maskot som tjatar, inga pratbubblor |
| **Föremål och rekvisita** | CV:t som en karta, ansökan som ett brev i en brevlåda, intervjun som en bro, lönen som en våg | Inga mynt, inga poäng, inga staplar |
| **Märken** | Milstolpar för sådant som FINNS ("första CV:t", "sju dagar i dagboken") som stickers på ryggsäcken | Inga "0 av 10", inga streaks som kan brytas |
| **Tomma tillstånd** | Lykta vid en tom plats där något kan börja — inviter, inte tomhet | Ingen ledsen figur |

**Följeslagaren Lykta, definition som ska stå i varje prompt där hon förekommer:**

> Lykta: en liten rund, mjuk figur, ungefär som en droppe med korta ben, i mintgrönt #1A7757
> med en ljusare mintbuk. Två enkla prickögon, ingen mun. Håller en liten varm gul lykta i ena
> handen och bär en liten brun ryggsäck. Inga mänskliga drag, inga kläder utöver ryggsäcken.
> Samma proportioner varje gång: huvud och kropp är en enda rund form, benen korta.

**Hubbfärger (ur `tokens.css`):** mint `#1A7757` (Översikt) · persika `#A85D24` (Söka jobb) ·
rosa `#B85363` (Karriär) · sky `#266DA0` (Resurser) · lavendel `#7058A8` (Din vardag).

**Format:** ark = kvadrat 1024×1024 med jämnt rutnät (2×2 eller 3×3). Breda scener =
1536×1024, motivet i högra två tredjedelarna, vänstra tredjedelen lugn (text läggs där).

**Filnamn:** `spel-<sida>-<n>.png` per cell, breda scener `scen-<sida>.png`.

**Grundtexten** nedan står med i varje prompt så att en ruta räcker att kopiera:

> Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal.
> HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF —
> ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter,
> inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text,
> inga etiketter, inga ramar runt cellerna. Människor visas alltid bakifrån eller som enkla
> silhuetter, utan utpekad etnicitet eller ålder.

---

## 2. Arken

### Ark 0 — Stilark: Lykta (3×3) — `spel-lykta-1..9.png`

Gör detta ark **först** och spara bilden. Ladda sedan upp den tillsammans med varje
följande prompt och skriv "Lykta ska se exakt ut som på den bifogade bilden".

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 9 celler i ett jämnt 3×3-rutnät med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Detta är ett karaktärsark för en följeslagare som heter Lykta: en liten rund, mjuk figur, ungefär som en droppe med korta ben, i mintgrönt #1A7757 med en ljusare mintbuk. Två enkla prickögon, ingen mun. Håller en liten varm gul lykta i ena handen och bär en liten brun ryggsäck. Inga mänskliga drag. Samma proportioner i alla nio cellerna: huvud och kropp är en enda rund form, benen korta. Cellerna radvis: 1) Lykta framifrån, stillastående, lyktan lyfts lite. 2) Lykta i profil, går åt höger. 3) Lykta bakifrån, tittar bort mot horisonten. 4) Lykta sitter ner och vilar med lyktan bredvid sig. 5) Lykta pekar med fri hand åt höger. 6) Lykta håller upp ett litet vitt papper (ett CV) med båda händerna, lyktan står på marken. 7) Lykta vinkar. 8) Lykta sover med slutna prickögon, lyktan nedskruvad till en liten glöd. 9) Lykta hoppar glatt, lyktan svängd uppåt, tre små vita stjärnprickar runt.
```

### Ark 1 — Världskartan (bred, en bild) — `scen-varlden.png`

Används på Översikt (bakom "Allt i portalen") och som landningssidans stora scen.

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Bredformat 1536×1024. HELA bakgrunden ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter. Motiv: en mjukt slingrande stig sedd snett uppifrån, som ett litet landskap på en spelkarta, som går från nedre vänstra hörnet till en liten stad i övre högra hörnet. Längs stigen ligger fyra små stationer, var och en en liten byggnad eller plats i sin egen färg: en persika-orange #A85D24 anslagstavla med jobblappar, en korall-rosa #B85363 trappa upp mot en liten stjärna, en sky-blå #266DA0 liten bokhylla under ett träd, och en lavendel-lila #7058A8 bänk med en kaffekopp och en växt. Mellan stationerna: björkar, en liten sjö, en röd stuga, mjuka kullar i dämpade neutrala toner (beige, sandgrå, ljus olivgrön) så att stationernas färger sticker ut. På stigen nära starten går Lykta: en liten rund, mjuk figur i mintgrönt #1A7757 med ljusare mintbuk, två prickögon, ingen mun, en liten gul lykta i handen och en brun ryggsäck. Lykta går åt höger, in i landskapet. Lämna den vänstra tredjedelen av bilden lugn och nästan tom (bara stigens början) så att text kan ligga där.
```

### Ark 2 — Översikt (2×2) — `spel-oversikt-1..4.png`

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg mint-grön #1A7757, med varm gul för lyktan och dämpade neutraler för mark och himmel. Lykta ska se exakt ut som på den bifogade bilden: en liten rund, mjuk figur i mintgrönt med ljusare buk, två prickögon, ingen mun, en gul lykta i handen och en brun ryggsäck. Cellerna radvis: 1) Morgon vid stigens början: Lykta står vid en liten träskylt med en pil, solen går upp bakom en mjuk kulle — känslan "här börjar dagen". 2) En liten vägskylt med tre pilar i olika riktningar, Lykta tittar på den (ett nästa steg att välja). 3) En tom, fin plats vid stigen: en bänk, ett träd, inget mer — Lykta sitter på bänken (tomt tillstånd, inbjudande, inte ledset). 4) Lykta bakifrån som ser ut över hela landskapet från en liten höjd, stigen slingrar sig ner mot en stad i fjärran (historik, "allt du har gjort").
```

### Ark 3 — Landningssidan (2×2) — `spel-landning-1..4.png`

Steg-sektionen ("Så här fungerar det", tre steg) + ett förtroendemotiv.

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg mint-grön #1A7757 med små inslag av persika #A85D24 och korall-rosa #B85363. Lykta ska se exakt ut som på den bifogade bilden. Cellerna radvis: 1) Steg ett, "upptäck dina styrkor": Lykta håller upp en kompass, och runt henne svävar tre små runda brickor med enkla symboler (ett kugghjul, en pensel, ett hjärta). 2) Steg två, "skapa ditt CV": Lykta bär ett stort vitt papper med enkla textlinjer och ett litet foto-fält, som en karta hon vecklar ut. 3) Steg tre, "hitta och sök jobb": Lykta lägger ett brev i en persika-orange brevlåda vid stigen, en liten stad skymtar bakom. 4) Förtroende: en person sedd bakifrån sitter lugnt vid ett köksbord med en laptop och en kaffekopp, Lykta sitter på bordskanten med lyktan — ingen stress, hemma, i egen takt.
```

### Ark 4 — Inloggning, registrering, onboarding (2×2) — `spel-start-1..4.png`

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg mint-grön #1A7757. Lykta ska se exakt ut som på den bifogade bilden. Cellerna radvis: 1) Inloggning: en liten mintgrön dörr på glänt i en mjuk kulle, varmt ljus inifrån, Lykta står utanför med lyktan höjd. 2) Registrering: Lykta räcker fram en liten tom namnbricka (rektangel med ett runt hål) till betraktaren. 3) Välkommen: Lykta vinkar vid stigens början, en liten välkomstflagga på en pinne bredvid, solen upp. 4) Onboarding: Lykta packar sin ryggsäck på marken — bredvid ligger tre saker som ska in: ett hopvikt papper, en kompass och en liten karta.
```

### Ark 5 — Söka jobb, hubbsidan (3×3) — `spel-jobb-hub-1..9.png`

Stationen i persika. Cell 1 är hubbens scen, 2–9 är verktygens rekvisita.

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 9 celler i ett jämnt 3×3-rutnät med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg persika-orange #A85D24, med vitt och dämpade neutraler för detaljer; Lykta behåller sin mintgröna färg #1A7757 och ska se exakt ut som på den bifogade bilden. Cellerna radvis: 1) Stationen: en persika-orange anslagstavla vid stigen med några jobblappar uppnålade, Lykta står framför och tittar upp på den. 2) Ett förstoringsglas över en liten stad med hus (sök jobb). 3) En brevlåda med tre brev, ett sticker upp (ansökningar). 4) En liten kontorsbyggnad med öppen dörr och en välkomstmatta (spontanansökan). 5) Ett vitt papper med textlinjer och ett runt fotofält, hopvikt som en karta (CV). 6) Ett kuvert med en liten hjärtformad sigill (personligt brev). 7) En liten bro över en bäck med två stolar på andra sidan (intervju). 8) En balansvåg med ett mynt i ena skålen och ett litet hus i den andra (lön). 9) En jordglob med en liten gul stig som slingrar över den (ny i Sverige).
```

### Ark 6 — Sök jobb (2×2) — `spel-sokjobb-1..4.png`

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg persika-orange #A85D24. Lykta ska se exakt ut som på den bifogade bilden. Cellerna radvis: 1) Lykta håller ett förstoringsglas över en liten stad med olika hus (fabrik, butik, skola, kontor) — söka. 2) En jobblapp från anslagstavlan i närbild, med en liten bokmärkesflik i hörnet, Lykta sätter fast den i sin ryggsäck (spara jobb). 3) En tom anslagstavla med bara nålar kvar och Lykta som står framför med lyktan — inget hittat än, lugnt, inte tomt på hopp (tomt sökresultat). 4) Två personer sedda bakifrån som tittar på samma anslagstavla, Lykta emellan dem (jobb nära dig / bevakning).
```

### Ark 7 — Ansökningar (2×2) — `spel-ansokningar-1..4.png`

Statusarna som platser längs vägen, inte som en tavla med kolumner.

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg persika-orange #A85D24. Lykta ska se exakt ut som på den bifogade bilden. Cellerna radvis: 1) Skickad: Lykta lägger ett brev i en persika-orange brevlåda vid stigen. 2) Väntar på svar: Lykta sitter på en bänk vid brevlådan och tittar mot horisonten med lyktan bredvid, en liten fågel på brevlådan — tålmodigt, inte oroligt. 3) Intervju: Lykta går över en liten bro mot en byggnad med öppen dörr. 4) Erbjudande: ett öppnat brev med en liten stjärna på, Lykta hoppar glatt bredvid.
```

### Ark 8 — Spontanansökan (2×2) — `spel-spontan-1..4.png`

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg persika-orange #A85D24. Lykta ska se exakt ut som på den bifogade bilden. Cellerna radvis: 1) Lykta knackar på dörren till ett litet företag (en byggnad med skylt utan text och en krukväxt vid dörren). 2) En liten karta över ett samhälle med tre byggnader markerade med små persika-orange flaggor (hitta företag). 3) En kalender-lapp med en liten flagga på en dag, Lykta pekar på den (uppföljning). 4) Lykta och en person sedd bakifrån skakar hand utanför en byggnad — eller snarare: personen räcker ut handen och Lykta lyfter lyktan mot den (ett svar).
```

### Ark 9 — CV (2×2) — `spel-cv-1..4.png`

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg persika-orange #A85D24. Lykta ska se exakt ut som på den bifogade bilden. Cellerna radvis: 1) Lykta vecklar ut ett stort vitt papper som en karta, med enkla textlinjer och ett runt fotofält — CV:t som karta. 2) Ett tomt vitt papper på ett bord, en penna bredvid, Lykta sitter vid bordet med lyktan (tomt CV, inbjudande). 3) Lykta lyfter upp ett papper ur en låda med flera papper i (ladda upp / importera). 4) Ett färdigt papper med en liten stjärna i hörnet, Lykta håller upp det med båda händerna och tre små vita stjärnprickar runt (klart, firande men lugnt).
```

### Ark 10 — Personligt brev (2×2) — `spel-brev-1..4.png`

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg persika-orange #A85D24. Lykta ska se exakt ut som på den bifogade bilden. Cellerna radvis: 1) Lykta skriver med en stor penna på ett papper som ligger på marken, lyktan lyser på papperet. 2) Ett kuvert med en hjärtformad sigill, Lykta håller det mot bröstet. 3) Ett tomt kuvert och en penna på ett bord, Lykta tittar på dem (inget brev än, inbjudande). 4) Två kuvert bredvid varandra, ett med en liten stjärna — Lykta pekar på det (välj mall / jämför).
```

### Ark 11 — Intervjuträning (2×2) — `spel-intervju-1..4.png`

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg persika-orange #A85D24. Lykta ska se exakt ut som på den bifogade bilden. Cellerna radvis: 1) En liten bro över en bäck, på andra sidan två stolar mitt emot varandra, Lykta står vid brons början. 2) Lykta sitter på en av stolarna och håller en mikrofon, en tom stol mitt emot (öva högt). 3) Lykta framför en spegel och ser sin egen spegelbild (öva själv, förbereda). 4) Lykta går tillbaka över bron med lyktan högt, en liten stjärna över bron (genomförd övning).
```

### Ark 12 — Lön, LinkedIn, Ny i Sverige (3×2) — `spel-lon-1..2.png`, `spel-linkedin-1..2.png`, `spel-nyisverige-1..2.png`

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 6 celler i ett jämnt 3×2-rutnät (tre kolumner, två rader) med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg persika-orange #A85D24. Lykta ska se exakt ut som på den bifogade bilden. Cellerna radvis: 1) Lön: en balansvåg där Lykta lägger ett mynt i ena skålen, ett litet hus i den andra. 2) Lön: Lykta och en person sedd bakifrån vid ett bord med ett papper emellan — ett lugnt samtal. 3) LinkedIn: ett profilkort på en skärm (runt fotofält, textlinjer) som Lykta putsar med en trasa. 4) LinkedIn: tre profilkort förbundna med linjer, Lykta pekar på det mittersta. 5) Ny i Sverige: en jordglob med en gul stig som slingrar över den till en liten röd stuga, Lykta står vid stugan. 6) Ny i Sverige: ett dokument med en stämpel (validering), Lykta håller det upp mot ljuset från lyktan.
```

### Ark 13 — Karriär, hubb + karriärplan (2×2) — `spel-karriar-1..4.png`

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg korall-rosa #B85363. Lykta ska se exakt ut som på den bifogade bilden (mintgrön). Cellerna radvis: 1) Stationen: en korall-rosa trappa i tre mjuka steg upp mot en liten stjärna, Lykta står på nedersta steget och tittar upp — INTE ett stapeldiagram, tydligt trappsteg man går på. 2) Lykta sitter på en sten och ritar en enkel stig på ett papper med ett kryss i slutet (karriärplan, "vad vill du på sikt?"). 3) Ett vägskäl med två stigar som båda leder mot fina platser (en stad, en skog), Lykta i mitten (val, inte prestation). 4) Lykta står på översta trappsteget och håller lyktan mot stjärnan, en liten flagga i handen (mål nått).
```

### Ark 14 — Intresseguiden (3×3) — `spel-intresse-1..9.png`

De sex intresseområdena som små världar (Hollands RIASEC: praktisk, undersökande, konstnärlig, social, företagsam, ordningsam) + tre lägen.

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 9 celler i ett jämnt 3×3-rutnät med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg korall-rosa #B85363. Lykta ska se exakt ut som på den bifogade bilden. Cellerna radvis, de sex första är små runda "världar" (en cirkel med ett litet landskap inuti): 1) Praktisk värld: en verkstad med en skiftnyckel och en planka. 2) Undersökande värld: ett teleskop och en uppslagen bok under stjärnor. 3) Konstnärlig värld: en pensel, en nottangent och en färgklick. 4) Social värld: tre små runda figurer i en ring runt ett bord. 5) Företagsam värld: en liten marknadsbod med en flagga. 6) Ordningsam värld: en snygg hylla med lådor och ett arkivskåp. 7) Lykta med en kompass i handen, nålen pekar mot en av världarna (starta guiden). 8) Lykta sitter och tänker med en fråga-symbol som en liten pratbubbla utan text (mitt i frågorna). 9) Lykta står framför tre av världarna som lyser lite mer (resultat: dina tre starkaste områden).
```

### Ark 15 — Kompetensanalys, Utbildning, Personligt varumärke (3×2) — `spel-kompetens-1..2.png`, `spel-utbildning-1..2.png`, `spel-varumarke-1..2.png`

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 6 celler i ett jämnt 3×2-rutnät (tre kolumner, två rader) med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg korall-rosa #B85363. Lykta ska se exakt ut som på den bifogade bilden. Cellerna radvis: 1) Kompetensanalys: Lykta håller två pusselbitar, en i varje hand, som nästan passar ihop (det du har och det som saknas). 2) Kompetensanalys: en ryggsäck öppen på marken med några små brickor i (kompetenser), en tom plats bredvid för fler. 3) Utbildning: en liten skolbyggnad på en kulle med en stig upp, Lykta på stigen. 4) Utbildning: en uppslagen bok med en liten planta som växer ur den. 5) Personligt varumärke: Lykta håller upp en liten spegel och ser sig själv, med en liten stjärna i spegelbilden. 6) Personligt varumärke: en fin sigill-stämpel med Lyktas silhuett, bredvid ett papper med stämpeln på.
```

### Ark 16 — Resurser, hubb + verktyg (3×2) — `spel-resurser-1..6.png`

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 6 celler i ett jämnt 3×2-rutnät (tre kolumner, två rader) med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg sky-blå #266DA0. Lykta ska se exakt ut som på den bifogade bilden (mintgrön). Cellerna radvis: 1) Stationen: en liten sky-blå bokhylla som står under ett stort träd vid stigen, Lykta läser en bok på en filt framför. 2) Kunskapsbank: en uppslagen bok med en liten lykta som lyser på sidan. 3) Dina dokument: en mapp med tre papper som sticker upp, ett med bokmärke. 4) Externa resurser: en skylt med en pil som pekar bort från stigen mot en annan liten by (länkar ut). 5) AI-team: fem små runda figurer i olika dämpade färger sitter i en halvcirkel, Lykta i mitten med lyktan (ett team att fråga). 6) Nätverk: tre små runda figurer förbundna med mjuka linjer, Lykta lägger till en fjärde.
```

### Ark 17 — AI-teamet, fem agenter som figurer (3×2) — `spel-agent-<id>.png`

Agenterna i AI-teamet (`arbetskonsulent`, `arbetsterapeut`, `studievagledare`,
`motivationscoach`, `digitalcoach`) har i dag ikoner. Som figurer i samma familj som Lykta
får chatten en samtalspartner att se. **Rådgivarna i sidokolumnen (Andreas, Mona, Linnea,
Daniel) har fotografier — att byta dem mot figurer är ett eget beslut**, inte en del av
detta ark.

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 6 celler i ett jämnt 3×2-rutnät (tre kolumner, två rader) med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Detta är ett karaktärsark med fem följeslagare i samma familj som Lykta på den bifogade bilden: samma runda droppform med korta ben, två prickögon, ingen mun, inga mänskliga drag — men var och en i sin egen färg och med ett eget föremål. Alla fem ska ha exakt samma storlek och proportioner. Cellerna radvis: 1) Arbetskonsulenten: sky-blå #266DA0, bär en liten portfölj. 2) Arbetsterapeuten: lavendel-lila #7058A8, håller en liten kudde eller ett mjukt hjärta. 3) Studievägledaren: korall-rosa #B85363, bär en liten studentmössa. 4) Motivationscoachen: persika-orange #A85D24, håller en liten flagga. 5) Digitalcoachen: mint-grön #1A7757 (ljusare än Lykta) och bär en liten surfplatta. 6) Alla fem tillsammans i en halvcirkel, sedda framifrån, i samma storlek, med Lykta (med sin gula lykta) längst fram i mitten.
```

### Ark 18 — Din vardag, hubb + verktyg (3×2) — `spel-vardag-1..6.png`

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 6 celler i ett jämnt 3×2-rutnät (tre kolumner, två rader) med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg lavendel-lila #7058A8. Lykta ska se exakt ut som på den bifogade bilden (mintgrön). Cellerna radvis: 1) Stationen: en lavendel-lila bänk vid stigen med en kaffekopp och en krukväxt, en liten måne på himlen, Lykta sitter på bänken med lyktan nedskruvad. 2) Hälsa/mående: en liten sol och ett litet moln bredvid varandra, Lykta tittar upp på dem (hur mår du i dag). 3) Dagbok: en uppslagen anteckningsbok med en penna, Lykta skriver. 4) Kalender: ett kalenderblad med en liten flagga på en dag, Lykta pekar. 5) Övningar: Lykta sträcker på sig med armarna upp, en liten matta på marken. 6) Min konsulent: Lykta och en person sedd bakifrån sitter på samma bänk, med lite avstånd, båda tittar mot samma utsikt.
```

### Ark 19 — Mående som väder (3×3) — `spel-maende-1..9.png`

För måendeloggningen: nio lägen som väder, utan värdering (regn är inte dåligt, det är regn).

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 9 celler i ett jämnt 3×3-rutnät med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg lavendel-lila #7058A8 med dämpade neutraler; alla nio motiven i samma storlek och samma enkla formspråk, som en uppsättning väderikoner. Inga ansikten, ingen värdering — regn är lika fint ritat som sol. Cellerna radvis: 1) Klar sol. 2) Sol bakom ett litet moln. 3) Ett mjukt moln. 4) Moln med lätt regn. 5) Moln med kraftigare regn. 6) Dimma (tre mjuka horisontella band). 7) Vind (tre böljande linjer och ett löv). 8) Snö (ett moln med små runda flingor). 9) Kväll: en måne och två stjärnor.
```

### Ark 20 — Dagbok och kalender (2×2) — `spel-dagbok-1..2.png`, `spel-kalender-1..2.png`

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg lavendel-lila #7058A8. Lykta ska se exakt ut som på den bifogade bilden. Cellerna radvis: 1) Dagbok: en stängd anteckningsbok med ett litet lås — ett hänglås som är ÖPPET och ligger bredvid, Lykta håller nyckeln (dagboken är din, privat). 2) Dagbok: en uppslagen tom sida i lyktans sken, en penna redo (första anteckningen, inbjudande). 3) Kalender: ett kalenderblad där en dag har en liten flagga, Lykta står bredvid och tittar (något inbokat). 4) Kalender: ett tomt kalenderblad och Lykta som sitter lugnt bredvid med lyktan — inget inbokat, och det är okej.
```

### Ark 21 — Märken: milstolpar som stickers (3×3) — `spel-marke-1..9.png`

Fästs på ryggsäcken i profilen och visas EN gång som firande när något sker. Inga
"0 av 9" — bara de man har.

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 9 celler i ett jämnt 3×3-rutnät med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor. Ingen text, inga etiketter, inga ramar runt cellerna. Detta är nio runda klistermärken (stickers) i samma storlek, var och en en cirkel med en tunn vit kant och ett enkelt motiv i mitten, som märken på en ryggsäck. Färgerna växlar mellan mint-grön #1A7757, persika-orange #A85D24, korall-rosa #B85363, sky-blå #266DA0 och lavendel-lila #7058A8. Cellerna radvis: 1) Första steget: en liten stövel på en stig (mint). 2) Första CV:t: ett hopvikt papper som en karta (persika). 3) Första ansökan: ett brev i en brevlåda (persika). 4) Första intervjun: en liten bro (persika). 5) Kompassen: en kompass (rosa, intresseguiden gjord). 6) Läsaren: en uppslagen bok (sky, tio artiklar lästa). 7) Sju dagar: en liten måne med sju små prickar i en båge (lavendel, sju dagar i dagboken). 8) Tillsammans: två små runda figurer sida vid sida (lavendel, kopplad till en konsulent). 9) Lyktan: Lyktas egen gula lykta (mint, "ett helt år med Jobin").
```

### Ark 22 — Tomma tillstånd, fel och paus (2×2) — `spel-tillstand-1..4.png`

Portalens generella lägen, hubbfärgen läggs på i koden via `data-domain` så dessa görs i
neutral mint.

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg mint-grön #1A7757 med dämpade neutraler. Lykta ska se exakt ut som på den bifogade bilden. Cellerna radvis: 1) Inget här än: en tom, fin äng med en enda liten planta, Lykta sätter sig bredvid den (tomt tillstånd — en början, inte en brist). 2) Portalen strular: en liten träbro med en planka som saknas, Lykta står lugnt på ena sidan med lyktan och väntar (fel — det är vägen som är trasig, inte du). 3) Lugnare läge: Lykta sitter under ett träd med lyktan nedskruvad, ett enda löv faller (fokusläge / paus). 4) Klart för i dag: Lykta går hemåt på stigen mot en liten stuga med ljus i fönstret, kväll, en måne (avslut, "nog för i dag").
```

### Ark 23 — Premium (2×2) — `spel-premium-1..4.png`

Spår P (roadmapen): AI-funktionerna bakom premium, 99 kr/mån. Bilderna ska sälja utan att
tjata — det som låses upp visas som **ljus**, inte som ett lås.

```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk bild 1024×1024 med exakt 4 celler i ett jämnt 2×2-rutnät med lika stora mellanrum, varje motiv centrerat i sin cell med god marginal. HELA bilden inklusive mellanrummen mellan cellerna ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita eller grå bakgrundsytor. Inga gradienter, inga skuggor, ingen 3D. Mjuka rundade former, tydliga fyllda ytor, mycket luft. Ingen text, inga etiketter, inga ramar runt cellerna. Huvudfärg mint-grön #1A7757 med varm gul för ljuset. Lykta ska se exakt ut som på den bifogade bilden. Cellerna radvis: 1) Lykta skruvar upp sin lykta så den lyser starkare, och runt henne tänds fem små runda lampor i olika hubbfärger (AI-verktygen låses upp — ljus, inte lås). 2) Lykta och de fem AI-följeslagarna från ark 17 går tillsammans på stigen, Lykta först med lyktan (premium = hela teamet med dig). 3) En liten nyckel i varm gul färg på en mjuk kudde, Lykta räcker fram den (uppgradera). 4) Lykta sitter på en bänk och läser en liten broschyr med en stjärna på framsidan, lugnt — ingen brådska (jämför gratis och premium, i egen takt).
```

---

## 3. Efter genereringen — vad Claude gör

1. Kör `node client/scripts/optimize-illustrations.cjs` på alla PNG i
   `design-source/illustrations-raw/` (chroma-key + webp).
2. Kopplar in per sida: Ark 1 på Översikt (bakom nivå 3, dämpad) och landningssidan;
   Ark 2–20 som `EmptyState`-illustration, sektionsspot och framgångsbild på respektive
   sida; Ark 21 i profilen (bara de märken som finns underlag för); Ark 22 i `EmptyState`,
   felvyn och Lugnare läge; Ark 23 i spår P när det byggs.
3. Verifierar i ljust och mörkt läge mot dev-servern i tre bredder, sedan i prod efter push.
4. Varje bild `aria-hidden`, rubriken bär betydelsen (GRAFIK-PLAN §1).

**Ordning som ger mest per ark:** 0 (Lykta, allt annat bygger på den) → 1 (världen) →
2 (Översikt) → 22 (tomma tillstånd, syns överallt) → 5, 13, 16, 18 (hubbarnas stationer) →
resten i den ordning sidorna används mest: 6, 7, 9, 10, 11, 14 → 21 → 3, 4 → 23.
