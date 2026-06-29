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
| 5 spot-illustrationer (`empty-jobb/karriar/resurser/vardag/oversikt`) | ✅ Filer live + inkopplade i tomtillstånd |
| 5 hub-heroes (`hero-oversikt/jobb/karriar/resurser/vardag`) | ✅ Filer live + inkopplade i hub-landningar |
| Framgång/firande (`success-cv/ansokan/klart`) | ✅ Filer live + inkopplade i slutför-flöden |
| Onboarding (`spot-valkommen`) | ✅ Live i OnboardingFlow |
| Editorial spots (`spot-intervju/ratt/halsa`) | ✅ Live som Kunskapsbank-kategoribanners (`TopicsTab`) |
| Kunskapsbankens kategori-banners (§7.5, 9 nya spots) | ✅ Live — 12 av 13 kategorier har banner |
| Dagbok-tomtillstånd (Journal/Tacksamhet/Mål) → `empty-vardag` | ✅ Inkopplat (Hink A, 2026-06-06) |
| Intresseguide-resultat tomt läge → `empty-karriar` | ✅ Inkopplat + fixade amber-färgbrott (Hink A, 2026-06-06) |

**Fas 1, 2 och 3 är klara.** 12 av 13 Kunskapsbank-kategorier har banner (`job-search`
saknar dedikerad bild, lämnad utan). `spot-ekonomi.webp` är genererad men nu reserv
(`job-market` använder den på-tema `spot-arbetsmarknad`).

### Audit 2026-06-06 (asset-integritet ✅)
- 27 webp på disk, 26 refererade i kod. Enda oanvända: `spot-ekonomi` (avsiktlig reserv).
- Inga trasiga referenser (ingen kod pekar på saknad fil). Alla 27 giltiga transparenta
  webp, 8–47 KB, korrekta mått. *Live-rendering i ljust/mörkt läge ej verifierad — kräver
  inloggning mot jobin.se.*
- **Hink A (noll nya bilder) klar:** Dagbok + Intresseguide-empties kopplade till befintliga
  hub-spots. AI-teamets tomma chatt lämnas — har medveten agent-specifik greeting, inte ett
  platt tomtillstånd. Konsultvyns empties lämnas neutrala (DESIGN.md §2 — admin-vyer har
  egen, mer saklig ton; varma deltagar-illustrationer hör inte hemma där).
- **Hink B (ny batch) = Fas 5 nedan:** 3 nya framgångs-spots för AI-verktygens slutmoment.

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

### Fas 5 — Framgångsögonblick i AI-verktygen (nästa batch) 🎯
**Mål:** De tre största AI-verktygen saknar ett framgångsögonblick när man är klar.
Audit 2026-06-06 visade att CV och ansökan har success-spots, men Intervjusimulator,
Kompetensanalys och Intresseguide avslutas utan visuell belöning.
- Generera 3 framgångs-spots (§7.6), färgsatta per sidans hub-färg (en-färg-per-sida).
- Jag kopplar in i slutför-/resultatläget på respektive verktyg.
- **OBS — inga hero-illustrationer på verktygssidor.** DESIGN.md §3: verktygssidor har
  neutral grå hero. Grafik på dem = framgångsögonblick, tomtillstånd eller editorial-spot.

| Verktyg | Hub-färg | Filnamn | Inkopplas i |
|---------|----------|---------|-------------|
| Intervjusimulator klar | persika `#A85D24` | `success-intervju.png` | `InterviewSimulator.tsx` slutvy |
| Kompetensanalys klar | rosa `#B85363` | `success-kompetens.png` | `SkillsGapAnalysis.tsx` resultat/till-plan |
| Intresseguide klar | rosa `#B85363` | `success-intresse.png` | `interest-guide/ResultsTab.tsx` topp |

> **✅ Fas 5 inkopplad 2026-06-06.** Alla tre genererade, chroma-keyade (13–18 KB) och
> inkopplade: Intresseguide-resultatets topp, SkillsGap-resultatets header, och en
> milstolpe-hälsning i Intervjusimulatorn efter 3 besvarade frågor (verktyget saknade
> dedikerad slutvy — hälsningen är medvetet kopplad till milstolpen i stället).

### Fas 6 — Editorial-spots på verktygssidor (§7.7)
**Mål:** Bryta textmassan högst upp på fyra text-/formtunga verktygssidor + Dagbok,
med samma editorial-banner-mönster som Kunskapsbanken (`bg-[var(--c-bg)]` +
`border-[var(--c-accent)]`, auto-färgad via sidans `data-domain`). Inga hero-bilder.

| Bild (4 juni-batch) | Filnamn | Sida (domän) | Status |
|---------------------|---------|--------------|--------|
| Jordglob + flygplan | `spot-internationellt` | International (activity) | ✅ Inkopplad |
| Handslag + kr-mynt | `spot-lon` | Salary (activity) | ✅ Inkopplad |
| Rosett + person + stjärna | `spot-varumarke` | PersonalBrand (coaching) | ✅ Inkopplad |
| Pussel + stege | `spot-karriarbygge` | Career (coaching) | ✅ Inkopplad |
| Dagboks-uppslag | `spot-dagbok` | Diary (wellbeing) | ✅ Inkopplad |
| Min profil-kort | `spot-profil` | — | ⏸ **Reserv** |

> `spot-profil.webp` är genererad och chroma-keyad men **inte inkopplad**: Profilsidans
> `ProfileHeader` visar redan ett riktigt profilkort med avatar, så en stiliserad
> profil-illustration där bryter mot §1 ("grafik ska stötta, inte dekorera tomt").
> Sparas som reserv för onboarding / ofullständig-profil-läge (jfr `spot-ekonomi`).
> Bok+ABC-bilden från samma batch var redan inlagd som `spot-lattsvenska`.

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

### 7.5 Kunskapsbankens kategori-banners (Fas 3, nästa batch)

Bryter textmassorna i Kunskapsbankens Ämnen-flik. Mappas i `TopicsTab.tsx`
(`CATEGORY_ILLUSTRATIONS`) per kategori-id. Alla i sky-blå `#266DA0` (Resurser-hubben)
för en-färg-per-sida-koherens.

| Kategori-id | Filnamn | Motiv |
|-------------|---------|-------|
| `getting-started` | `spot-start.png` | spirande planta + pil uppåt |
| `self-awareness` | `spot-sjalvkannedom.png` | kompass + spegel |
| `networking` | `spot-natverk.png` | tre förbundna cirklar med silhuetter |
| `digital-presence` | `spot-digital.png` | skärm/mobil med profilkort |
| `career-development` | `spot-karriarutveckling.png` | trappsteg uppåt mot stjärna |
| `job-market` | `spot-arbetsmarknad.png` | stadssiluett + stapeldiagram |
| `tools` | `spot-verktyg.png` | checklista + penna |
| `accessibility` | `spot-tillganglighet.png` | två händer kring ett hjärta |
| `easy-swedish` | `spot-lattsvenska.png` | öppen bok med A B C |

> Alla 9 ovan ✅ genererade, optimerade och inkopplade i `TopicsTab.tsx`.
> `spot-ekonomi.webp` blev reserv (mynt + spargris) — kan användas till framtida lön/ekonomi-vy.

Prompt-mall (byt motiv-meningen per rad ovan):
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk 1024×1024 pixlar, motivet centrerat med god marginal. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former. Motiv: <MOTIV>. Motivets huvudfärg är sky-blå #266DA0, med vitt och neutralt för små detaljer.
```

### 7.6 Framgångsögonblick i AI-verktygen (Fas 5, nästa batch)

Varje prompt är komplett. Spara med angivet filnamn i `design-source/illustrations-raw/`.

**`success-intervju.png`** (Intervjusimulator — persika)
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk 1024×1024 pixlar, motivet centrerat med god marginal. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former. Motiv: en mikrofon med en liten stjärna eller bock bredvid och några lugna konfetti-prickar, känsla av väl genomförd intervju. Motivets huvudfärg är persika-orange #A85D24, med vitt och neutralt för små detaljer.
```

**`success-kompetens.png`** (Kompetensanalys — rosa)
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk 1024×1024 pixlar, motivet centrerat med god marginal. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former. Motiv: en pusselbit som faller på plats i ett mönster, symboliserar att ett kompetensgap fylls. Motivets huvudfärg är korall-rosa #B85363, med vitt och neutralt för små detaljer.
```

**`success-intresse.png`** (Intresseguide — rosa)
```
Skapa en platt, vänlig vektorillustration i lugn "kompis"-stil för en svensk jobbportal. Kvadratisk 1024×1024 pixlar, motivet centrerat med god marginal. Bakgrunden ska vara HELT SOLID magenta (#FF00FF) som fyller hela ytan — ingen transparens, inget rutmönster, inga vita eller grå ytor i bakgrunden. Inga gradienter, inga skuggor, ingen 3D, mjuka rundade former. Motiv: en kompass med en liten stjärna i riktningen, symboliserar att man hittat sin riktning. Motivets huvudfärg är korall-rosa #B85363, med vitt och neutralt för små detaljer.
```

---

## 8. Att börja med nu

Fas 1–3 är klara och inkopplade, och Hink A (audit 2026-06-06) kopplade in befintliga
spots i Dagbok + Intresseguide-empties utan nya bilder.

**Nästa batch: §7.6 — de 3 framgångs-spotsen (Fas 5).** Generera dem i ChatGPT och lägg
i `design-source/illustrations-raw/`. Säg till när de ligger där, så kör jag pipelinen en
gång, kopplar in alla tre i respektive verktygs slutvy, bygger och verifierar en gång.

---

## 9. Fas 7 — Custom ikonset (sprite-sheets)

**Mål:** Ge portalen ett eget ikonspråk i innehållsytorna istället för standard
lucide-stroke-ikoner (som alla andra sajter har). Detta är den enskilt största
"unik-göraren" — det syns på hubbarnas feature-kort och dashboard-widgetarna.

### 9.1 Var setet får (och inte får) användas — VIKTIGT

Ikonerna renderas på två helt olika sätt i koden:

| Yta | Storlek | Färg | Custom-ikon? |
|-----|---------|------|--------------|
| Sidofält / bottennav | 16–18px | byter på hover/aktiv (`text-current`) | **NEJ — behåll lucide.** Raster kan inte recoloras och blir grötigt vid 16px |
| Hub-feature-kortens tile (`HubPage.tsx`) | 36–40px ruta | sidans hub-färg | **JA** — custom-ikonen fyller hela tilen |
| Dashboard-widgetarnas rubrik-ikon | ~32–40px | hub-färg | **JA** |
| Hub-kort på Översikt + PageHero | ≥40px | hub-färg | **JA** |

> Regel: custom-ikoner = innehållsytor ≥36px utan state-baserad recolor. Funktionella
> småikoner (pilar, kryss, chevrons, inställningar, hover-toner i nav) förblir lucide.

### 9.2 Färgstrategi

En-färg-per-sida (§DESIGN.md): varje verktyg bor på exakt **en** hub, så varje ikon
får sin hubs huvudfärg. Därför 5 ark, ett per hub-färg — varje ark blir internt
färgkonsekvent och matchar automatiskt sidan det renderas på.

mint `#1A7757` · persika `#A85D24` · rosa `#B85363` · sky `#266DA0` · lavendel `#7058A8`

### 9.3 Sprite-sheet-teknik (flera ikoner i EN generering)

Varje ark genereras som **en** ChatGPT-bild med ett jämnt rutnät, sparas i
`design-source/illustrations-raw/`, **beskärs manuellt till en PNG per cell**, och körs
sedan genom `optimize-illustrations.cjs` (chroma-keyar bort magentan på varje cell).
Lägg magenta även i mellanrummen — pipelinen nyckar bort allt magenta globalt.

Filnamn efter beskärning: `icon-<key>.png` → blir `icon-<key>.webp`.

### 9.4 Promptlista — 5 ark

**Ark 1 — `iconsheet-hubbar` (5 hub-ikoner, en per färg)**
```
Skapa ett enhetligt ikon-ark (sprite sheet) i platt, vänlig vektorstil för en svensk jobbportal. Kvadratisk bild 1024×1024. Lägg ut exakt 5 ikoner på en rad (eller 5 jämnt fördelade celler) med tydliga lika stora mellanrum. Varje ikon centrerad i sin cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita/grå ytor. Inga gradienter, skuggor eller 3D. Alla ikoner ska ha samma visuella vikt, samma formspråk och vara så enkla att de läses tydligt redan vid 40 pixlar; enkla fyllda former, mjukt rundade hörn. Ingen text, inga etiketter, inga ramar runt cellerna. Ikoner i ordning: 1) ett lugnt överblicks-rutnät av fyra rundade rutor, huvudfärg mint-grön #1A7757. 2) en portfölj/arbetsväska, huvudfärg persika-orange #A85D24. 3) en trappa med tre tydliga trappsteg som leder uppåt mot en liten stjärna i övre högra hörnet — alltså en trappa man går upp för, ABSOLUT INTE ett stapeldiagram eller staplar, huvudfärg korall-rosa #B85363. 4) en öppen bok, huvudfärg sky-blå #266DA0. 5) ett hjärta, huvudfärg lavendel-lila #7058A8. Vitt och neutralt för små detaljer.

> **Regenererings-not (efter pilot):** Första ark1 gav ett stapeldiagram för karriär,
> vilket krockar med kompetensgap-ikonen (Ark 3, stapel + pil, samma rosa hub). Därför
> är ikon 3 ovan förtydligad till **trappa/trappsteg**. Behåll de övriga fyra som de var
> i piloten — de var godkända (se §9.6).
```

**Ark 2 — `iconsheet-jobb` (persika `#A85D24`, 9 ikoner, 3×3)**
```
Skapa ett enhetligt ikon-ark (sprite sheet) i platt, vänlig vektorstil för en svensk jobbportal. Kvadratisk bild 1024×1024. Lägg ut exakt 9 ikoner i ett jämnt 3×3-rutnät med tydliga lika stora mellanrum. Varje ikon centrerad i sin cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita/grå ytor. Inga gradienter, skuggor eller 3D. Alla ikoner ska ha samma visuella vikt, samma linjetjocklek och samma enkla fyllda formspråk så att de läses tydligt redan vid 40 pixlar; mjukt rundade hörn. Ikonernas huvudfärg är persika-orange #A85D24, med vitt och neutralt för små detaljer. Ingen text, inga etiketter, inga ramar runt cellerna. Ikoner radvis: 1) ett förstoringsglas över en lista (jobbsök), 2) ett urklippsblock med en bock (ansökningar), 3) ett kontorshus (spontanansökan), 4) ett persondokument med ett litet huvud (CV), 5) ett kuvert (personligt brev), 6) en mikrofon (intervju), 7) en plånbok med ett mynt (lön), 8) ett professionellt profilkort på en skärm (LinkedIn), 9) en jordglob med ett litet flygplan (internationellt).
```

**Ark 3 — `iconsheet-karriar` (rosa `#B85363`, 5 ikoner)**
```
Skapa ett enhetligt ikon-ark (sprite sheet) i platt, vänlig vektorstil för en svensk jobbportal. Kvadratisk bild 1024×1024. Lägg ut exakt 5 ikoner jämnt fördelade (t.ex. en rad om 5 eller 2+3) med tydliga lika stora mellanrum. Varje ikon centrerad i sin cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita/grå ytor. Inga gradienter, skuggor eller 3D. Alla ikoner ska ha samma visuella vikt, samma linjetjocklek och samma enkla fyllda formspråk så att de läses tydligt redan vid 40 pixlar; mjukt rundade hörn. Ikonernas huvudfärg är korall-rosa #B85363, med vitt och neutralt för små detaljer. Ingen text, inga etiketter, inga ramar runt cellerna. Ikoner i ordning: 1) trappsteg uppåt mot en stjärna (karriär), 2) en kompass (intresseguide), 3) ett stapeldiagram med en pil uppåt (kompetensgap), 4) en rosett/stjärna på en person (personligt varumärke), 5) en studentmössa (utbildning).
```

**Ark 4 — `iconsheet-resurser` (sky `#266DA0`, 6 ikoner, 3×2)**
```
Skapa ett enhetligt ikon-ark (sprite sheet) i platt, vänlig vektorstil för en svensk jobbportal. Kvadratisk bild 1024×1024. Lägg ut exakt 6 ikoner i ett jämnt 3×2-rutnät med tydliga lika stora mellanrum. Varje ikon centrerad i sin cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita/grå ytor. Inga gradienter, skuggor eller 3D. Alla ikoner ska ha samma visuella vikt, samma linjetjocklek och samma enkla fyllda formspråk så att de läses tydligt redan vid 40 pixlar; mjukt rundade hörn. Ikonernas huvudfärg är sky-blå #266DA0, med vitt och neutralt för små detaljer. Ingen text, inga etiketter, inga ramar runt cellerna. Ikoner radvis: 1) en bokhylla (kunskapsbank), 2) ett bokmärke i en mapp (mina dokument), 3) en skrivare (utskrift), 4) en pil som pekar ut ur en ruta (externa resurser), 5) en vänlig robot (AI-team), 6) tre förbundna noder med små silhuetter (nätverk).
```

**Ark 5 — `iconsheet-vardag` (lavendel `#7058A8`, 5 ikoner)**
```
Skapa ett enhetligt ikon-ark (sprite sheet) i platt, vänlig vektorstil för en svensk jobbportal. Kvadratisk bild 1024×1024. Lägg ut exakt 5 ikoner jämnt fördelade (t.ex. en rad om 5 eller 2+3) med tydliga lika stora mellanrum. Varje ikon centrerad i sin cell med god marginal. HELA bilden inklusive mellanrummen ska vara HELT SOLID magenta #FF00FF — ingen transparens, inget rutmönster, inga vita/grå ytor. Inga gradienter, skuggor eller 3D. Alla ikoner ska ha samma visuella vikt, samma linjetjocklek och samma enkla fyllda formspråk så att de läses tydligt redan vid 40 pixlar; mjukt rundade hörn. Ikonernas huvudfärg är lavendel-lila #7058A8, med vitt och neutralt för små detaljer. Ingen text, inga etiketter, inga ramar runt cellerna. Ikoner i ordning: 1) ett leende ansikte / en liten sol (wellness), 2) en anteckningsbok med penna (dagbok), 3) ett kalenderblad (kalender), 4) en hantel (övningar), 5) en person med en bock bredvid (min konsulent).
```

### 9.5 Test-flöde (denna batch)

1. **Börja med Ark 2 (`iconsheet-jobb`)** som pilot — flest ikoner, tydligast om stilen
   håller vid 40px. Generera, beskär till 9 PNG (`icon-jobbsok`, `icon-ansokningar`,
   `icon-spontan`, `icon-cv`, `icon-brev`, `icon-intervju`, `icon-lon`, `icon-linkedin`,
   `icon-internationellt`), lägg i `design-source/illustrations-raw/`.
2. Jag kör pipelinen, kopplar in på Söka jobb-hubbens feature-kort, bygger och visar dig
   resultatet vid 40px. Håller stilen → generera resten av arken. Håller den inte →
   justera prompt (enklare former / tjockare linje) innan vi skalar upp.

> Filnamn efter beskärning följer `icon-<key>.webp`. Mappning ikon→verktyg→hub finns i
> `client/src/components/layout/navigation.ts` (`navHubs[].items`).

### 9.6 Pilot-resultat — hub-ikoner (Ark 1)

Första ark1 testades som pilot innan resten av setet genererades. Resultat:

- **Frans-test (chroma-key):** ✅ Ingen synlig magenta-frans på vare sig ljus eller
  mörk yta. Pipelinens de-spill (`optimize-illustrations.cjs` rad 104–105) neutraliserar
  de mjuka kanterna. Rasterbaserade sprite-sheet-ikoner håller — ingen teknik-ändring
  behövs, och vi behöver inte ens tvinga fram skarpare kanter.
- **Läsbarhet @40px:** ✅ Alla fem läses tydligt i verklig renderingsstorlek. Boken är
  gränsfall (vita linjer smälter ihop något) men entydig.
- **Färgdrift:** Tonerna är något ljusare än tokens men harmoniserar med pastell-chippen
  (token-bg). Accepterad — ingen efter-recolor.
- **Karriär-motiv:** ✗ Stapel i stället för trappa → ark1 regenereras (se §9.4-noten).

**Beslut för inkoppling:**
- Hub-ikon-assets namnges **`icon-hub-<key>.webp`** (oversikt/jobb/karriar/resurser/vardag),
  ej `icon-<key>.webp` (det mönstret gäller verktygs-ikonerna i Ark 2–5).
- **Chippen behålls** — den färgade ikonen ligger kvar i sin pastell-chip (`--c-bg`),
  bevarar layout, 4px-accentrytm och optisk centrering. (Chip-löst alternativ avvaktar.)
- **Storleksnormalisering:** ikonerna har lite ojämn optisk vikt i arket → sätt
  per-ikon-storlek vid inkoppling så de väger lika i chippen.
- **Ytor:** Hub-ikonerna kopplas in på `HubOverview.tsx` (HubCard, ~rad 400) och därefter
  `PageHero` (hub-landningarnas hjälte). **Sidofält/bottennav (16px) rörs inte** — lucide
  kvar där (§9.1).
- Före/efter-preview genererades med `scratchpad/hub-preview.cjs` (riktig HubCard-markup,
  lucide vs custom). Kopia av HTML + PNG ligger i `design-source/previews/` (gitignorerat).

**✅ Inkopplat (pilot, hub-ikoner):**
- 5 webp i `client/public/illustrations/icon-hub-*.webp`.
- Central mappning domän→webp: `client/src/components/layout/hubIcons.ts` (`HUB_ICON_SRC`).
- `PageHero.tsx` fick `iconSrc`-prop (renderar `<img>` i hub-hjältens cirkel när satt).
- `HubPage.tsx` skickar `iconSrc={HUB_ICON_SRC[domain]}` → de 4 hub-landningarna.
- `HubOverview.tsx` HubCard renderar custom-ikonen i chippen (jobb/karriar/resurser/vardag).
- Sidofält/bottennav orörda (lucide). tsc + build + lint:design rena.
- `icon-hub-oversikt` (rutnätet) är genererad men **renderas inte än** — Översiktens hero
  visar en profil-avatar, inte hub-ikonen. Reserv för framtida oversikt-yta.

**✅ Inkopplat (verktygs-ikoner, Ark 2–5):**
- 25 webp i `client/public/illustrations/icon-*.webp` (icke-hub).
- `TOOL_ICON_SRC` i `hubIcons.ts` mappar feature-kortets `href` (path) → webp.
- `HubPage.tsx` FeatureCard renderar custom-ikonen i tilen (lucide-fallback om path saknas).
- 23 av 25 syns som kort; `icon-linkedin` + `icon-internationellt` finns men visas inte
  på JobsokHub (de verktygen är inte feature-kort där) — sparade som reserv.
- Verifierat i verklig kortstorlek (40px tile) via `scratchpad/feature-preview.cjs`
  (kopia i `design-source/previews/feature-preview.png`). tsc + 31 hub-tester + build +
  lint:design rena.

**Fas 7 klar** — hela ikonsetet (5 hub + 25 verktyg) live. Källark `ark1–5.png` återskapas
deterministiskt till webp via `scratchpad/slice-all.cjs` vid behov.
