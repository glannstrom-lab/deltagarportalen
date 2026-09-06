---
name: grind
description: Gör ett fynd till en maskinell grind som faktiskt kan falla — välj rätt plats (CI-skript, vitest, byggsteg, snapshot), mät utfallet i stället för kommandot, och mutationstesta att grinden fäller. Använd när ett fynd är en klass snarare än en instans, när Mikael säger "lägg en grind på det", "se till att det inte kommer tillbaka", "vakta det", eller efter varje granskning där samma fel hittats mer än en gång.
---

# Grind — så att fyndet inte kommer tillbaka

Projektets arbetssätt är att varje återkommande fynd blir en maskinell vakt.
`lint:schema`, `lint:grants`, `lint:links`, `lint:design`, `lint:vercel`,
krisstödsvakten, `tools-json-pastaenden`, språkpariteten.

**Skälet, ordagrant ur A36:** *"En granskning hittar ett läge; bara en grind
håller det."* A17 stängde 18 av 53 definer-funktioner den 4 augusti. Mätt den
1 september: 36 av 65 öppna. Den öppna mängden hade vuxit, utan att något larmade.

---

## Steg 1 — är det här ens en grind?

| Bygg en grind när | Skriv en lärdom i stället när |
|---|---|
| Felet har träffat mer än en gång | Det var en engångsdetalj |
| Koden runt omkring rör sig och kan återinföra felet | Ämnet är omdöme, inte mekanik |
| Felet är osynligt tills någon råkar titta | En människa märker det direkt |
| Det finns ett maskinellt kontrollerbart utfall | Påståendet är kvalitativt |

Det som inte går att kontrollera maskinellt — tonfall, om "gratis" stämmer, om en
text känns nedlåtande — ska lämnas oskyddat **med flit**. Hellre en liten grind
som håller än en stor som låtsas.

---

## Steg 2 — välj plats

| Plats | När | Exempel |
|---|---|---|
| `client/scripts/<namn>.cjs` + npm-skript i `verify` | Statisk analys över repot | `lint-links.cjs`, `check-schema-drift.cjs` |
| Snapshot + jämförelse | Sanningen bor i prod och måste hämtas | `schema-snapshot.json`, `grants-snapshot.json` |
| `vitest` i `src/test/` | Påståendet knyts till en källa i koden | `tools-json-pastaenden.test.ts` |
| Byggsteg i `prerender-guides.cjs` | Felet får inte nå `dist/` | route-validering, tomma kategorisidor |
| Smoke-test i `deploy.yml` | Bara drift avslöjar det | `Content-Type` på `robots.txt` |

**Lägg in nya CI-skript i `npm run verify`**, annars körs de aldrig. Och kom ihåg
att pre-push-hooken bara kör fem av tio grindar — se skillen `slapp`.

---

## Steg 3 — mät utfallet, inte kommandot

Den enskilt viktigaste regeln, och den som gjort flest grindar verkningslösa.

- **`REVOKE … FROM anon` lyckas tyst** när PUBLIC har EXECUTE. Grinden måste mäta
  `has_function_privilege('anon', oid, 'EXECUTE')`, inte att kommandot gick igenom.
- **`robots.txt` svarade 200** — med `Content-Type: text/html`. Statuskoden var
  hela buggen, så grinden mäter `Content-Type`.
- **En headers-konfiguration som inte gäller.** Grinden kontrollerar att CSP,
  `X-Frame-Options` och `frame-ancestors` **finns i svaret**, inte att de står i
  `vercel.json`.
- **Ett jobb som skippar tyst rapporterar grönt.** `e2e-authenticated` hoppade
  över 74 av 94 tester utan secrets. Grinden måste fälla på att den inte kunde
  köra.

---

## Steg 4 — härled listan, hårdkoda den inte

En hårdkodad lista blir precis den drift grinden finns för att fånga.

`lint-links.cjs` härleder de prerenderade sidorna ur `publish-list.json`,
`KATEGORIER`, `tools.json` och `b2b.json` — samma källor som
`prerender-guides.cjs` bygger sidorna av. Perplexity-grinden härleder sin egen
lista ur koden. Krisstödsgrinden räknar upp **varje** `render*`-funktion, så en
sjunde sidtyp tvingar fram ett aktivt val i stället för att glida igenom.

**Lägg regeln på sammansättningsstället, inte i varje gren.** AI-teamets
regelverksregel låg i en av fem agentsträngar; nu är den en konstant som slås
ihop med vald agent, så en sjätte agent inte kan tillkomma utan skyddet.

---

## Steg 5 — grinden måste kunna falla. Bevisa det.

**Ett test som passerar bevisar ingenting förrän du vet att det kan falla.**

```
1. Muterade koden/datan så att grinden BORDE fälla
2. Kontrollera att mutationen faktiskt tog:  if (fore === efter) throw
3. Kör grinden — den ska bli röd, med en riktig assertion-miss
4. Återställ
5. Kör igen — grön
```

Tre sätt en mutationskontroll har gett falskt grönt i det här projektet:

- **Mutationen applicerades aldrig.** Söksträngen matchade inte p.g.a. escaping.
  Utan `if (fore === efter) throw` såg det ut som att grinden höll.
- **`toContain` mot ett tal som står två gånger.** "119 övningar" fanns i både
  ingress och punktlista; en muterad förekomst passerade eftersom rätt värde
  fanns kvar på det andra stället. **Loopa över varje träff och kräv att var och
  en stämmer.**
- **Testet prövade standardgrenen.** Anropet utan `agentTyp` föll tillbaka på den
  enda agent som redan var säker. **Iterera över alla grenar.**

En positiv kontroll som ska falla — t.ex. fail closed → fail open — visar att
själva testharnessen är giltig.

> **Arbetskopian har CRLF.** Flerradiga sökmönster i ett mutationsskript matchar
> bara mot LF. Normalisera vid inläsning och skriv tillbaka i samma format,
> annars får du antingen tysta missar eller en diff över hela filen.

---

## Steg 6 — tak i stället för nollkrav, när skulden är stor

Tre grindar bär ett **fryst tak**: `lint:ci` 122 warnings,
`typecheck:ceiling` 356 typfel, `lint:design` 52 gradienter.

Taket finns för att skulden ska kunna minska men inte växa. Skriptet skriver ut
det nya talet när skulden minskat. **Höj aldrig ett tak för att bli grön.**

En ny grind som startar på noll ska starta på noll — `typecheck:api` betalade av
allt först och har därför inget tak.

---

## Steg 7 — skriv varför grinden finns, i grinden

Varje grind i det här projektet har ett kommentarshuvud som säger vilket konkret
fel den föddes ur. Det är inte dekoration: nästa läsare ska kunna avgöra om
grinden fortfarande behövs, och inte "harmonisera" bort den.

Skriv också ut policyn när grinden är en säkerhets- eller rättighetsgrind:

> **Fail closed vs fail open — välj efter vad felet kostar.** Kostar felet pengar
> kan fail open vara rätt. Kostar det en olaglig överföring eller en rättighet:
> fail closed, och skriv ut varför i koden så nästa läsare inte harmoniserar dem.
> `checkDailyTokenCap` släpper igenom vid uppslagsfel; samma mönster kopierat
> till art. 9-grinden hade betytt att hälsodata skickas till USA när databasen
> strular.

---

## Efter: håll snapshotarna färska

Grindar som jämför mot prod är bara så sanna som sin snapshot.

```bash
cd client
npm run schema:refresh   # efter migration som rör tabeller/kolumner
npm run grants:refresh   # efter migration som rör GRANT/REVOKE eller RLS
```

**Committa snapshoten i samma commit som migrationen.** Utan uppdaterad snapshot
blir grinden falskt röd — och en falskt röd grind är det snabbaste sättet att
lära ett team att ignorera den.

---

## Checklista

- [ ] Fyndet är en klass, inte en instans
- [ ] Grinden mäter **utfallet**, inte att kommandot gick igenom
- [ ] Listan **härleds** ur samma källa som produktionskoden använder
- [ ] Regeln ligger på **sammansättningsstället**, inte i varje gren
- [ ] Mutationstestad — och mutationen bevisligen applicerad
- [ ] Itererar över **alla** grenar/förekomster, inte bara den första
- [ ] Inlagd i `npm run verify`
- [ ] Kommentarshuvud som säger vilket fel den föddes ur
- [ ] Tak bara om skulden är befintlig; ny grind startar på noll
