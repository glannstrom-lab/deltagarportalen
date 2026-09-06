---
name: sidgranskning
description: Granska en sida eller ett flöde i portalen hela vägen — kod, prod-schema, ärlighet i det som visas, tillgänglighet och mörkt läge, i18n, dödkod och grindarnas verkliga täckning — och verifiera mot skarp drift, aldrig mot dev-servern. Använd när Mikael säger "granska X", "gå igenom X-sidan", "se över X", "vad är fel på X", "kolla X", eller när en sida ska förbättras eller felsökas.
---

# Sidgranskning

Det mest körda passet i projektet. Formen är fast; det som varierar är sidan.

**Läs alltid först:** `docs/DESIGN.md` §1 (Manifestet) och §2 (Voice & Tone).
De är obligatoriska före allt annat.

---

## 0. Var kör du?

| | Rätt |
|---|---|
| Dev-server | `cd client && npm run dev` → **`:3000`** (Playwright defaultar felaktigt till 5173) |
| AI-utdata | **Endast prod: `https://www.jobin.se`.** `vite.config.ts` svarar `501 "AI-funktion X är inte mockad i dev"` för allt utom STA-mocken, och det finns ingen proxy. Två granskare mätte en attrapp innan de upptäckte det. |
| Testkontot | Har **AI avstängt** — inga anrop går ut. Ett grönt AI-flöde kan betyda "inget hände". |

---

## 1. Är sidan ens levande?

```bash
node client/scripts/dead-code.cjs
```

18 % av `client/src` nås inte från `main.tsx`, och **hela `components/dashboard/`
är dött**. En importsökning hittar barrel-filen och rapporterar "har importör" —
fast ingen importerar barreln. Tre stycken betalt arbete har landat i sådana
filer, och ett WCAG-svep skrev 58 rader i femton onåbara filer och sköt
raderingspasset en vecka.

Kontrollera också att routen finns i `App.tsx` och att sökvägen matchas rätt:
`/spontanansökan` och `/nätverk` når koden **procentkodade** — använd
`lib/sokvag.ts`, en rå strängjämförelse missar dem tyst.

---

## 2. Schemat — fråga databasen, inte migrationsfilerna

```bash
npx supabase db query --linked "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='<tabell>';" --output table
```

`npm run lint:schema` fångar `.from()`, `.rpc()`, `.storage.from()` och
kolumnreferenser — men **inte kolumnnycklar i `.insert()/.update()/.upsert()`**,
och inte vydefinitioner. Det är där de skarpa buggarna gömt sig: AI-teamets
"skapa uppgift i kalendern" skickade fem obefintliga kolumner och utelämnade
NOT NULL-fältet `date`, så insertet strukturellt aldrig kunde lyckas — och
`if (!error)` svalde det. Deltagaren klickade och inget hände.

Rör sidan en JSON-kolumn: kontrollera formen, inte bara att kolumnen finns.

```bash
npx supabase db query --linked "SELECT jsonb_typeof(kolumn->0) FROM tabell LIMIT 5;"
```

---

## 3. Ärligheten — projektets dominerande felklass

**Regeln:** *ett värde utan underlag visar `—` och en rad om varför — aldrig 0,
aldrig 100 %, aldrig ett påhittat exempel, aldrig en mall märkt som AI.*

Sök efter vanan, inte instanserna:

```bash
grep -rnE "\?\? 0|\|\| 0|catch[^)]*\)\s*\{[^}]*return \[\]" client/src/<sida>/
```

En saknad rad och ett fel ser likadana ut, och båda renderas som ett tal.
Tjugo belagda instanser hittades i ett svep: startsidan påstod 5 000+ användare
(prod hade 92 konton, 7 aktiva), personligt brev levererade mock-utdata märkt
"genererat med AI-stöd", konsulentvyn skickade `QNaN NaN` vidare till en PDF.

### Tre lägen krävs: laddar / fel / klart

`isLoading === false` räcker **inte** som "klart" — en fråga med
`enabled: false` är `pending` men inte `fetching`. Härled ur `isLoading || !data`.

Översikt sa "Du har inte börjat söka jobb än" i 1,4 s på bredband och 7,4 s på
3G till en användare med fem ansökningar.

**Ett tomt fält är inte en nolla.** En rad utan underlag visar en invit ("skriv
ditt första"), aldrig `0` och aldrig ett tankstreck som låtsas vara data.

### Kontrollera varje påstående sidan gör om portalen

Rådgivarna lovade tjugo saker portalen inte gjorde. Skriv inget du inte kan visa
i kod eller i RLS.

---

## 4. Cache och tillstånd

**En delad React Query-nyckel är ett kontrakt utan typ.** Skriver två ställen
till samma nyckel måste de dela form.

```bash
grep -rn "setQueryData" client/src/
```

`['application-stats']` skrevs av två features med olika form; hubben skrev noll
över verkligheten och gömde hela pipelinen. TypeScript var grönt (`setQueryData`
är otypad mot nyckeln), `lint:schema` var grön (tabellen finns, den är bara tom),
och enhetstestet asserterade den trasiga formen.

**Uppträder buggen bara på en väg till sidan men inte vid direktnavigering —
misstänk delad cache, inte data.**

Kontrollera också att tillstånd nollställs vid byte: panelen monteras inte om vid
klientnavigering, bara `pathname`-propen ändras. Testa genom att **byta** sida,
inte genom att montera om — direktladdning ser rätt ut.

---

## 5. Tillgänglighet, mörkt läge, geometri

```bash
node e2e/axe-contrast.cjs        # axe över sidan
node e2e/mat-kontrast.cjs        # kontrastmätning
node e2e/matt-accent-kontrast.cjs
```

- **`--c-accent` som textfärg i mörkt läge ger 1,77:1.** `--c-text` ensam räcker
  i båda lägena. Det fanns 47 träffar kvar i koden vid senaste mätningen.
- **Statusfärger:** tre intensiteter. Höj inte till `/22` — `/25` faller under AA.
- **`.mobile-device form` slår varje Tailwind-klass.** Kontrollera mobilen separat.
- **En geometrisk fix behöver en geometrisk regression.** Flyttar du ett fixerat
  element: hit-testa **alla** fixerade lager på sidan, inte bara det buggen
  handlade om. UX16 flyttade CV-knappraden 64 px upp, rakt in under
  CoachWidget-knappen; 58 % av "Nästa" blockerades. Okulär besiktning duger inte
  — `opacity: 0` och `pointer-events: none` ger både falska positiva och negativa.
- **Rådgivarkolumnen ritas bara där det finns innehåll** (`harRadgivarinnehall()`).
  Sidor utan innehåll reserverade tidigare 324 px tomt, vilket ser ut som
  marginal och stod okommenterat i månader.

---

## 6. i18n

Texten bor på **tre** ställen (`docs/innehallsoversattning.md`):

| Vad | Var |
|---|---|
| Gränssnittstext | `src/i18n/locales/{sv,en}.json` via `t()` |
| Innehållsdata | overlay i `src/data/oversattningar/*.en.json` |
| Artiklar | `title_en`/`summary_en`/`content_en` i `articles` |

- **Varje nytt `t()`-anrop kräver nyckel i BÅDA filerna.** Grinden
  (`i18n/nycklar-finns.test.ts`) bor i **coverage-sviten**, inte i `lint:ci`.
- **Sätt in nycklar kirurgiskt** med `scripts/i18n-infoga-nycklar.cjs` — locale-
  filerna är inte `JSON.stringify`-normaliserade, och en omserialisering ger en
  diff över hela filen. `addKeys` returnerar `{text, insatta, konflikter}`.
- **`t(key) || fallback` faller aldrig tillbaka.** Använd `t(key, 'default')`.
- Konsulentvyn i18n:as **inte** med flit (DESIGN.md §2).
- Svenska myndighetsnamn översätts aldrig. Grind: `SKYDDADE_NAMN` i
  `i18n/sprakparitet.test.ts`.

---

## 7. Testerna — fråga inte om de finns, fråga om de kan falla

**Antalet tester är projektets mest missvisande tal.** Sex riktade mutationer tog
under tio minuter och visade att fyra av sex inte kunde falla: `/cv`-routen
borttagen ur `App.tsx` gav 33/33 gröna nav-tester; art. 9-grinden fick läsa fel
tabell **och** fel kolumn och gav 14/14 gröna båda gångerna.

```bash
# Mönstret: mutera, kontrollera att mutationen tog, kör, återställ
# if (fore === efter) throw new Error('MUTATIONEN TOG INTE')
```

Fyra fällor i testuppsättningen:

- **Mockar utan backing store ljuger för alla tester samtidigt.**
  `localStorage`-mocken var fyra `vi.fn()` utan lagring — allt som skrevs
  försvann, och testet såg alltid modalen.
- **Fixturer ska spegla prod-formen.** `skills: ['React']` gjorde testerna gröna
  mot data som inte existerar; prod har `[{id,name,level,category}]`.
- **En mockad klient godkänner vilket tabellnamn som helst.** Ett test
  asserterade `journey_goals`, som inte finns.
- **jsdom har alltid `offsetParent === null`**, och `useFocusTrap` filtrerar bort
  sådana element som dolda. Utan shim ser fokusfällan noll element — och
  fokustester går gröna även när fokushanteringen är trasig.
- **Prövar testet standardgrenen?** `ai-sanningsregel.test.ts` anropade utan
  `agentTyp` och träffade därför den enda agent som redan var säker. **När en
  prompt eller funktion har grenar måste grinden itereras över alla.**

Skriv kända defekter som `it.fails` (se `profileStore.test.ts:476`) i stället för
att cementera dem i ett vanligt test.

---

## 8. AI-vägar (om sidan har någon)

Två backends — säg alltid vilken:

- **`client/api/ai.js`** (`/api/ai`) — default för UI. Streaming finns för **en**
  funktion, `ai-team-chat`, genom `callAIStream()` i `services/aiApi.ts`.
- **`supabase/functions/`** (Deno edge) — AF, Bolagsverket, längre prompts.

**Gå aldrig förbi `callAI`/`callAIStream` med ett eget `fetch`** — då körs varken
PII-saneringen eller art. 9-grinden.

Modellen är låst till en allowlist med **två** modeller. Kontrollera mot listan,
inte mot en enda modell:

```bash
grep -roh "model: '[^']*'" supabase/functions client/api | sort -u
```

Fem edge-funktioner skickar användardata till **Perplexity**, som inte står i
integritetspolicyn eller Art. 30-registret. Det är ett känt, öppet fynd — inte
något att "laga" genom att byta modell.

Grindar som måste finnas i varje ny Perplexity-anropare: `checkAiEnabled` +
tokentak ur `_shared/aiGate.ts`, plus en rad i `ai-sanningsregel.test.ts`.

---

## 9. Rapportera

Enligt stående order publiceras granskningen som en **Artifact**: mätvärden
överst, "börja här", tre allvarlighetsnivåer. Varje fynd ska bära kommandot du
körde och vad det svarade.

Skriv in fynden i `docs/ROADMAP.md` — projektets enda gällande plan. Nya idéer
förs in där, aldrig i nya plandokument.

**Är fyndet en klass snarare än en instans — bygg en grind.** Se skillen `grind`.
