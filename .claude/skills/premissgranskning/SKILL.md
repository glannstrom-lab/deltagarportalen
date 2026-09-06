---
name: premissgranskning
description: Verifiera premissen bakom en roadmap-punkt, en plan eller en uppgift innan något byggs — läs koden, spåra konsumenter, fråga prod-databasen, mät i stället för att tro på siffran i planen, och rapportera premissen innan du bygger. Använd före varje punkt ur docs/ROADMAP.md, när Mikael säger "ta X", "bygg X", "fixa X", "kör punkt X", eller när en uppgift beskrivs med en siffra eller ett påstående någon annan skrivit ner.
---

# Premissgranskning — obligatorisk före varje roadmap-punkt

**Roadmapen beskriver vad någon trodde när raden skrevs — inte vad som är sant
idag.** Regeln i CLAUDE.md har **inget undantag**, inte ens för en punkt som ser
trivial ut.

Träffbilden är inte marginell. Vid körningen 2026-07-27 hade sex av punkterna fel
premiss. I passet 2026-09-02 föll tio av tjugofem. I innehållsomgång 5 visade sig
två av sex beställda ämnen vara avvecklade program.

---

## Ordningen — följ den, hoppa inte

### 1. Läs den faktiska koden

Öppna filerna raden pekar på. **Inte bara sök — läs.** En sökträff säger att
strängen finns, inte vad koden gör.

### 2. Spåra konsumenter själv

Finns komponenten, hooken eller funktionen ens monterad? Vem importerar den?

> **En vanlig importsökning räcker inte.** 20 döda barrel-filer i det här
> projektet håller 41 878 rader vid liv för en `grep`. `hooks/index.ts` ensam
> håller 2 651 rader. Sökningen hittar barreln och rapporterar "har importör" —
> fast ingen importerar barreln.

Kör nåbarhetsanalys från `main.tsx`. Det är den enda sökning som ser sanningen:

```bash
node client/scripts/dead-code.cjs
```

**Noll konsumenter = punkten handlar om dödkod**, inte om en funktion som ska
förbättras. Tre stycken betalt arbete har landat i filer ingen kör.

### 3. Fråga databasen, inte migrationsfilerna

Att en migrationsfil finns i `supabase/migrations/` är **inget bevis** för att
tabellen finns i prod. Samma buggklass har träffat minst fyra gånger.

```bash
npx supabase db query --linked "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='<tabell>';" --output table
```

Rör punkten en JSON-kolumn — kontrollera **formen**, inte bara att kolumnen finns:

```bash
npx supabase db query --linked "SELECT jsonb_typeof(kolumn->0) FROM tabell LIMIT 5;"
```

Ett `Property X does not exist`-typfel betyder att koden läser något som inte
finns. `cvs.skills` var objekt i 16 av 16 CV:n medan koden anropade
`.toLowerCase()` — felet låg i skuldlistan som "typskuld" och kastade i drift
varje gång, för just de användare som fyllt i mest.

Rör den rättigheter: mät `has_function_privilege`, inte vad REVOKE svarade.

### 4. Mät i stället för att lita på siffran i planen

| Påstående | Rätt mätning |
|---|---|
| Bundlestorlek | brotli över nätet, inte rå `dist/` |
| Radantal i en tabell | `SELECT count(*)`, inte `reltuples` |
| Regelfördelning | kör linten, inte minnesbilden |
| Antal funktioner/mallar/frågor | räkna i källan, skriv inte av |
| "Testet finns" | mutera koden och se om testet faller |

I1 avskrevs för att 1 510 kB var rå storlek — brotli gav 383 kB.
`ai.js` har stått som 24, 18 och 16 funktioner i fyra dokument samtidigt.
`tools.json` påstod 13 CV-mallar i tolv dygn medan koden hade tolv.

### 5. Rapportera premissen INNAN du bygger

> *"Premissen håller / håller inte — så här ser verkligheten ut."*

Föreslå därefter ett av tre: **bygg**, **omscopa** eller **avskriv**.

**Rapporten ska bära bevis, inte intryck:** radantal, importspår, brotli-tal,
prod-repro, kommandot du körde och vad det svarade. *"Jag kollade"* räcker inte.

### 6. Bygg — och skriv in rättelsen i roadmapen

Under "Rättelser mot förra versionen" i `docs/ROADMAP.md`, inte bara i
commit-meddelandet. Nästa läsare har bara raden.

---

## Sex mönster för hur en premiss brukar vara fel

1. **Punkten är redan löst men raden står kvar.** Sex av tio fallna premisser i
   passet 2026-09-02 var av den här sorten. Kontrollera alltid nuläget först.
2. **Funktionen är dödkod.** G9 hade noll läsare, inte bara ingen vy. G10 var
   dödkod rakt av.
3. **Siffran i raden är rå i stället för mätt.** Se I1 ovan.
4. **Raden är inverterad.** K12 sa att metadatan var B2B och texten B2C. Det var
   tvärtom.
5. **Begreppet har bytt namn.** LAS säger "sakliga skäl" sedan 1 oktober 2022,
   inte "saklig grund". Extratjänsten och studiestartsstödet är avvecklade.
6. **Kraven har flyttat.** "Vyn finns men ljuger" ser ut som "bygg en ny vy".
   G3 och G13 såg triviala ut och var det inte.

---

## Fällor i själva granskningen

- **En dokumenterad fälla är den förklaring man når först och prövar sämst.**
  Två diagnoser av Lighthouse-felet var rimliga och båda fel; det som avgjorde
  var att göra utdatan läsbar.
- **Ju mer en mening bär, desto mindre omprövas den.** Kontrollera särskilt de
  påståenden som står under rubriker som *"regeln som allt annat vilar på"*.
- **En agents egenrapporterade "verifierat rent" är inte en mätning.** Sex
  omgångar i rad har agenter rapportat grönt och egen mätning hittat fel de
  missat.
- **Läs vad grinden faktiskt kontrollerar, inte vad den heter.** `lint:schema`
  läser 722 filer inklusive edge-funktioner — men kontrollerar **inte**
  kolumnnycklar i `.insert()/.update()/.upsert()`, och ser inte vydefinitioner.
  En grön grind avgränsar risken; den avskaffar den inte.
- **Läs båda projektets aktiva planeringsdokument** innan du planerar något nytt
  — annars planeras samma arbete två gånger.

---

## Undantag

Inga.
