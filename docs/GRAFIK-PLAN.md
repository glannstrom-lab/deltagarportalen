# Grafikplan — Deltagarportalen

**Syfte:** Göra portalen mer levande och mindre platt-text, utan att bryta mot
DESIGN.md (lugn-vän-ton, ingen gradient, en-färg-per-sida, hub-landning = full
pastell-hero / verktygssida = neutral hero).

**Status:** Levande dokument. Uppdateras när bilder genereras och kopplas in.

---

## 1. Princip

- Grafik ska **stötta**, inte dekorera tomt. Den hör hemma där text annars känns
  kal eller avskräckande: tomtillstånd, hero, onboarding, framgångsögonblick.
- **En illustrationsfamilj.** Samma flata, vänliga vektorstil genom hela portalen.
  Variation kommer från hub-färg och motiv — aldrig från olika stilar.
- **En hub-färg per sida.** Illustrationen på en sida använder sidans hub-färg
  som huvudfärg (mint/persika/rosa/sky/lavendel).
- Illustrationer är **dekorativa** → alltid `aria-hidden`, rubriken bär betydelsen.

---

## 2. Nuläge (klart)

| Vad | Status |
|-----|--------|
| Pipeline `client/scripts/optimize-illustrations.cjs` | ✅ Rensar + optimerar → transparent webp |
| `EmptyState` `illustration`-prop (5 hubbar) | ✅ |
| 5 spot-illustrationer (`empty-jobb/karriar/resurser/vardag/oversikt`) | ✅ Filer live |
| Hero översikt (`hero-oversikt`) | ✅ Live i `/oversikt`-hero |
| Inkopplat skarpt | ✅ Nätverk (resurser), Sparade jobb (jobb), Översikt-hero |

---

## 3. Produktionsstandard (VIKTIGT — gäller alla nya bilder)

ChatGPT-bilder saknar äkta transparens och bränner in ett rutmönster. Lösningen
är **att alltid generera motivet på solid magenta `#FF00FF`** — då chroma-keyar
pipelinen bort exakt magentan → perfekt transparens, rena kanter i ljust + mörkt
läge. (Detta ersätter det tidigare rutmönster-tricket.)

**Regler för varje bild du genererar:**
1. Solid magenta `#FF00FF` som fyller HELA bakgrunden. Ingen transparens, inget
   rutmönster, inga vita/grå bakgrundsytor.
2. Samma flata, vänliga vektorstil. Inga gradienter, skuggor, 3D.
3. Hub-färgen som motivets huvudfärg (hex nedan).
4. Inkluderande figurer (ryggtavlor/silhuetter, ingen utpekad etnicitet/ålder).

**Hub-färger (ur `tokens.css`):**
mint `#1A7757` · persika `#A85D24` · rosa `#B85363` · sky `#266DA0` · lavendel `#7058A8`

**Format per typ:**
| Typ | Källformat | Slutformat (pipeline gör) | Filnamn |
|-----|-----------|---------------------------|---------|
| Hero | liggande, motiv till höger, 1600×900 | webp ~1200px brett | `hero-<hub>.png` |
| Spot (tomtillstånd, framgång) | kvadrat 1024×1024 | webp 360px | `empty-<key>.png` / `success-<key>.png` |
| Editorial spot | kvadrat 1024×1024 | webp 360px | `spot-<ämne>.png` |

**Leverans:** lägg alla PNG i `design-source/illustrations-raw/` (gitignorerad).

---

## 4. Arbetssätt — BATCH, inte en-i-taget

Lärdom: att generera → koppla in → deploya → verifiera **en bild i taget** är för
långsamt. Nytt flöde:

1. **Du** genererar en hel fas av bilder i ChatGPT (promptlista nedan) och lägger
   alla i `design-source/illustrations-raw/`.
2. **Jag** kör pipelinen en gång (rensar + optimerar alla), kopplar in alla,
   bygger, pushar **en gång**, och verifierar live **en gång** med Playwright.

Så blir det en deploy per fas i stället för en per bild.

---

## 5. Grafik-typer och var de hör hemma

| # | Typ | Var | Antal | Återanvänder |
|---|-----|-----|-------|--------------|
| A | Hub-heroes | De 5 hub-landningssidorna | 5 (1 klar) | — |
| B | Tomtillstånd (spot) | Inline-tomtillstånd i appen | 5 bas finns | A-färgerna |
| C | Framgång/firande | När man slutför CV, skickar ansökan, klarar kurs | 3–4 | — |
| D | Onboarding/välkommen | Första besöket, kom-igång | 1–2 | kan återanvända A |
| E | Editorial spot | Text-tunga sidor: Kunskapsbank, Resurser, guider | 4–8 | per hub-färg |

---

## 6. Faser

### Fas 1 — Färdigställ hubbarna (störst effekt, infra finns) 🎯 NÄST
**Mål:** Alla 5 hub-heroes + alla 5 spot-illustrationer inkopplade överallt.
- Generera 4 hero-bilder: **jobb, karriär, resurser, min vardag** (promptlista §7.2).
- Jag kopplar in alla 4 heroes i respektive hub-landning (samma mönster som översikt).
- **Svepet:** byt återstående inline-tomtillstånd → `EmptyState` med rätt hub-illustration:
  - Söka jobb: ansökningar, (sparade jobb ✅)
  - Karriär: CV-lista, personligt brev, kompetensgap, intresseguide
  - Resurser: sparade resurser, AI-team, (nätverk ✅)
  - Min vardag: dagbok, kalender, hälsa/wellness
  - Översikt: dashboard "kom igång"
  - *(De flesta återanvänder de 5 bas-spotsen — inga nya bilder krävs.)*

### Fas 2 — Framgång & onboarding (känslolyft)
**Mål:** Positiv förstärkning i nyckelögonblick.
- Generera framgångs-spots (§7.3): CV klart, ansökan skickad, kurs/övning klar.
- Generera välkomst/onboarding-spot (§7.4).
- Jag kopplar in i slutför-flöden och första-besök.

### Fas 3 — Editorial spot i text-tunga sidor
**Mål:** Bryta textmassor i Kunskapsbank, Resurser och guider.
- Generera editorial-spots per ämne/kategori (§7.5, mall + exempel).
- Jag placerar dem som ankare överst i artiklar/sektioner.

### Fas 4 — Polish (valfritt)
- Diskreta dekor-motiv i sektionsheaders, små accenter. Endast om tid finns.

---

## 7. Promptlista

Varje prompt är komplett i sig själv — kopiera EN ruta, klistra in i ChatGPT,
få ett färdigt resultat. Spara med angivet filnamn i `design-source/illustrations-raw/`.

### 7.1 Hub-heroes (Fas 1)

**`hero-jobb.png`**
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Bredformat 1600×900 pixlar. Placera motivet i den högra tredjedelen och lämna vänstra delen tom. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former, mycket luft. Motiv: en person sedd bakifrån (ingen utpekad etnicitet eller ålder) som läser jobbanslag på en anslagstavla, med några svävande kort. Motivets huvudfärg är persika-orange #A85D24, med vitt och neutralt för små detaljer.
```

**`hero-karriar.png`**
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Bredformat 1600×900 pixlar. Placera motivet i den högra tredjedelen och lämna vänstra delen tom. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former, mycket luft. Motiv: en person sedd bakifrån (ingen utpekad etnicitet eller ålder) som går uppför mjuka trappsteg mot en liten stjärna eller flagga, en känsla av växande riktning. Motivets huvudfärg är korall-rosa #B85363, med vitt och neutralt för små detaljer.
```

**`hero-resurser.png`**
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Bredformat 1600×900 pixlar. Placera motivet i den högra tredjedelen och lämna vänstra delen tom. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former, mycket luft. Motiv: en öppen bok eller en liten bokhylla med några svävande bokmärken och en liten nätverksnod (förbundna cirklar). Motivets huvudfärg är sky-blå #266DA0, med vitt och neutralt för små detaljer.
```

**`hero-vardag.png`**
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Bredformat 1600×900 pixlar. Placera motivet i den högra tredjedelen och lämna vänstra delen tom. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former, mycket luft. Motiv: en lugn scen med en person sedd bakifrån som håller en kaffekopp, en kruka med en växt och en dagbok bredvid, en liten måne. Motivets huvudfärg är lavendel-lila #7058A8, med vitt och neutralt för små detaljer.
```

### 7.2 Framgång/firande (Fas 2)

**`success-cv.png`**
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk 1024×1024 pixlar, motivet centrerat med god marginal. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former. Motiv: ett dokument/CV med en liten bock eller stjärna och några konfetti-prickar, glatt men lugnt. Motivets huvudfärg är korall-rosa #B85363, med vitt och neutralt för små detaljer.
```

**`success-ansokan.png`**
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk 1024×1024 pixlar, motivet centrerat med god marginal. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former. Motiv: ett kuvert som lyfter och flyger iväg med en liten båge bakom sig. Motivets huvudfärg är persika-orange #A85D24, med vitt och neutralt för små detaljer.
```

**`success-klart.png`**
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk 1024×1024 pixlar, motivet centrerat med god marginal. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former. Motiv: en liten flagga på en kulle eller en stor bock i en cirkel, uppmuntrande. Motivets huvudfärg är mint-grön #1A7757, med vitt och neutralt för små detaljer.
```

### 7.3 Onboarding/välkommen (Fas 2)

**`spot-valkommen.png`**
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk 1024×1024 pixlar, motivet centrerat med god marginal. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former. Motiv: en öppen dörr med mjukt ljus som strömmar ut, inbjudande första intryck. Motivets huvudfärg är mint-grön #1A7757, med vitt och neutralt för små detaljer.
```

### 7.4 Editorial spot (Fas 3)

Varje prompt är komplett. (Vill du fler ämnen: kopiera valfri ruta nedan och byt
ut motiv-meningen och huvudfärgen.)

**`spot-intervju.png`**
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk 1024×1024 pixlar, motivet centrerat med god marginal. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former. Motiv: en pratbubbla tillsammans med en mikrofon, symboliserar intervju. Motivets huvudfärg är sky-blå #266DA0, med vitt och neutralt för små detaljer.
```

**`spot-ekonomi.png`**
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk 1024×1024 pixlar, motivet centrerat med god marginal. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former. Motiv: ett mynt och en liten spargris, symboliserar ekonomi. Motivets huvudfärg är sky-blå #266DA0, med vitt och neutralt för små detaljer.
```

**`spot-ratt.png`**
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk 1024×1024 pixlar, motivet centrerat med god marginal. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former. Motiv: en enkel vågskål, symboliserar rättigheter. Motivets huvudfärg är sky-blå #266DA0, med vitt och neutralt för små detaljer.
```

**`spot-halsa.png`**
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk 1024×1024 pixlar, motivet centrerat med god marginal. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former. Motiv: ett hjärta tillsammans med ett löv, symboliserar hälsa och mående. Motivets huvudfärg är lavendel-lila #7058A8, med vitt och neutralt för små detaljer.
```

---

## 8. Att börja med nu

Generera **Fas 1, §7.2 (de 4 hero-bilderna)** i en batch och lägg i
`design-source/illustrations-raw/`. Säg till när de ligger där, så kör jag
pipelinen, kopplar in alla fyra heroes + gör tomtillstånds-svepet, och pushar +
verifierar en gång.
