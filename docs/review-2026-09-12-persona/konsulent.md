# Persona-genomgång: "Karin", kommunkonsulent — prod 2026-09-12 kväll

Konto: km-konsulent@jobin.test (chef i "Testkommun (KM-pilot)", en deltagare: Dana/km-deltagare).
Skript: `e2e/persona-konsulent-2026-09-12.cjs` (del 1: alla ytor, mörkt läge, mobil), `-del2.cjs`
(dialoger, exporter), `-del3.cjs` (uppgifter: närvaro, mål, journal, möte, placering, överlämning).
Alla siffror nedan står i en skärmdump i den här mappen (`NN-namn.png`, ARIA-snapshot i `.aria.yaml`).
Nätverksfel (4xx/5xx): 0 i alla tre körningarna. Konsolfel: 1 (Rapporter, se K2).
Muterat: ett mål "Förbereda för intervju" skapat via mall och raderat via SQL efteråt (UI-borttagning
hittades inte, se V4). Inga mejl, inga inbjudningar, AI-brytaren orörd.

## 1. Funktion → fungerar? syns? upplevs?

| Yta | Fungerar | Syns | Upplevs | Skärmdump |
|---|---|---|---|---|
| Översikt (Min dag, KPI, Kräver uppmärksamhet, Snabbåtgärder, Senaste aktivitet, Målöversikt) | ja | ja | lugn, tydlig — **men Målöversikt visar tre stapeldiagram utan mål (K1)** | 01, 12-morkt-oversikt, M1 |
| Deltagare (lista, filter, sortering, rutnät/lista, Bjud in) | ja | ja | kortet säger "— CV, 0 Jobb, 0 Anteckningar, Aldrig kontaktad, Inget möte än" — ärligt | 02, 31, 32 |
| Deltagardetalj — huvud + sektioner Översikt/Aktivitet/Mål/Dagbok/Tidslinje | ja | ja | sektionsknapparna är knappar, inte flikar (ingen tablist) — OK för mus, oklart för skärmläsare (S3) | 03, 20-sektion-* |
| Aktivitet: plan, försörjningshinder, veckovy, pass, närvaro, plan-PDF | ja — PDF laddades ner (`aktivitetsplan-dana-deltagare-2026-09-12.pdf`), närvaroknappen visar Närvarande/Giltig/Ogiltig/Sjuk inline | ja | tätt men begripligt; texten om socialnämnden är bra | 20-sektion-Aktivitet, 40, 41 |
| Mål: skapa via mall, SMART-formulär | ja — mall "Förbereda för intervju" gav förifyllda 7 fält, "Skapa mål" aktiv, målet syntes | ja | **sju fält för ett mål** (V3); ingen synlig väg att ta bort målet (V4) | 22-mal-dialog, 42, 43 |
| Dagbok/journal: Ny anteckning (kategori Anteckning/Framsteg/Oro/Mål) | formuläret visas inline; jag sparade ingen (skriptet letade efter en dialog) | ja | varningstexten "Deltagaren kan läsa alla anteckningar…" är precis rätt | 44 |
| Snabbanteckning (Översikt-sektionen) | ej bekräftad (Spara aktiverades inte inom timeout) | ja | — | 03 |
| Rapportutkast (AI) | dialogen öppnar: period, orosanteckningar-val, "Skapa utkast" (ej körd) | ja | tydlig om vad som tas med | 46 |
| Boka möte | kalender med förflutna dagar avstängda | ja | — | 28, 47 |
| Registrera placering | formulär: arbetsgivare, titel, start, anställningstyp, lön, anteckning | ja | — | 48 |
| Platser | tom lista, filter insatstyp/status | ja | "0 0" i fetstil utan etikett (S1) | 07 |
| Rapporter | KPI, kohort, IVO-kvartalsunderlag, Excel-export OK (`konsultrapport-2026-09-12.xlsx`) | ja | **AI-insikter visar ett fel varje gång (K2)**; PDF-rapport gav ingen nedladdning (V1) | 08, 33 |
| Kommunikation: meddelanden, mallar, möten | Nytt meddelande öppnar inline, Möten-fliken visar "Inga kommande möten" | ja | mallknapparna "Påminnelse/Check-in/Grattis" står utan förklaring under en tom lista (S4) | 09, 34, 51 |
| Resurser: Målmallar, Schemamallar, Aktivitetskatalog, Jobbsamlingar, Best Practices | ja | ja | Aktivitetskatalogen är tom ("Inga aktiviteter i katalogen än") fast KM8 byggde en (V5) | 10, 36-* |
| Inställningar: projekt, notiser, standardvy, språk, tidszon, organisation, caseload, överlämning, data & integritet | ja | ja | löften om "kommande" på två ställen (V6); tidszon London/New York (S5); språkval i en vy som inte är översatt (S6) | 11, 37, 50 |
| Överlämning | knappen expanderar; utan kollega: "Ingen annan … att lämna över till. Lägg till en kollega först." | ja | ärligt och rätt | 50 |
| AI-brytare per organisation | **finns inte i UI:t** — ingen text om AI någonstans i Inställningar | nej | chefen kan inte själv slå av AI för organisationen (V7) | 11, 37 |
| Mörkt läge | inga trasiga ytor på Översikt/Detalj/Inställningar | ja | bra | 12-* |
| Mobil 390 | allt nås; konsulentens avsnitt som scrollrad | ja | menyn är deltagarens hela hubbmeny med "Konsultportal" sist (V8); profil-dialogen kallar konsulenten "Deltagare" (V9) | M1–M5 |

## 2. Fynd

### KRITISKT (hindrar arbetet eller ljuger)

**K1. Målöversikten på Översikt visar påhittade staplar.** Med 0 mål registrerade renderar
"Vanligaste målkategorierna" tre staplar (CV-förbättring, Jobbansökningar, Intervjuträning)
med fasta bredder 75 % / 60 % / 45 %. Kod: `client/src/pages/consultant/OverviewTab.tsx:868–895`
— `goalCategories.length > 0 ? … : <placeholder-staplar>`. Samma sida säger 0 avklarade, 0 försenade.
Rapporter-fliken säger ärligt "Inga mål registrerade än". Väntade mig: en invit ("Inga mål än —
skapa det första"), aldrig en stapel utan underlag (CLAUDE.md: tomt fält ≠ nolla, ingen påhittad
exempeldata). Skärmdump: 01-oversikt.png nederst till höger.

**K2. Rapporter → AI-insikter visar ett fel varje gång.** "Insikterna kunde inte hämtas — Försök igen
om en stund" + status "Mål-baserade insikter … kunde inte hämtas just nu". Konsolen: `PGRST201 …
Try changing 'consultant_dashboard_participants' to one of the following …` — PostgREST kan inte
välja relation för embed:et `participant:consultant_dashboard_participants!inner(...)` i
`client/src/services/consultantInsights.ts:189`. Det är ett fast fel, inte "en stund". Fliken Risker
fungerar (Dana 25 %, "Inget CV skapat"). Skärmdump: 08-rapporter.png, 33-rapporter-risker.png.

### VIKTIGT (kostar tid eller förtroende)

**V1. "PDF-rapport" (Rapporter) och "Exportera rapport" (Översikt) gav ingen nedladdning** i
Playwright, medan Excel gjorde det. Antingen öppnas PDF:en i ny flik (skriptet fångade inte popups)
eller så händer inget — kunde inte avgöra. Excel: `konsultrapport-2026-09-12.xlsx`. Verifiera manuellt.

**V2. Tidslinjen är ett löfte.** "Aktivitetshistorik kommer — vi spårar deltagarens aktiviteter … men
måste först ge konsulenter läsrättighet — kommer i …" (`sv.json` `timelineComingTitle`). En flik som
bara säger "kommer" ska antingen byggas eller tas bort ur sektionsraden. Skärmdump: 20-sektion-Tidslinje.

**V3. Att skapa ett mål kräver sju textfält** (Vad ska uppnås + fem SMART-fält + tidsram) plus
prioritet. Mallen förifyller allt, men "Skapa eget mål" ger sju tomma rutor. En konsulent under
aktivitetskravet sätter mål i samtal, på tre minuter. Väntade mig: titel + deadline räcker, SMART
som valfri utfällning. Skärmdump: 22-mal-sparat (dialogen "Anpassa målet").

**V4. Ett skapat mål går inte att ta bort från Mål-sektionen** (ingen meny/knapp hittades på kortet;
skriptet letade efter "ta bort/radera" och en …-meny). Jag fick radera via SQL. Verifiera manuellt —
om det finns en meny är den inte namngiven för skärmläsare.

**V5. Aktivitetskatalogen i Resurser är tom** ("Inga aktiviteter i katalogen än") trots att KM8
byggde en katalog och planen "Jobbsökarverkstad 15 h (test)" finns som schemamall. Om katalogen är
per organisation borde Testkommun ha de aktiviteter planen använder. Skärmdump: 36-resurser-Aktivitetskatalog.

**V6. Två "kommande"-löften i Inställningar:** Projekt "Rusta och Matcha — Sidor för projektet kommer
i en kommande uppdatering" (`ProgramSelector.tsx:137`) och Notiser "Kommande — de här aviseringarna
skickas inte ännu. Dina val sparas, men levereras inte". Det andra är ärligt formulerat; det första
lovar en uppdatering ingen planerat. Sex notisval som inte gör något tar dessutom halva sidan.

**V7. AI-brytaren per organisation saknar UI.** Pass 8 byggde brytaren (`my_ai_policy`, org
`ai_enabled`), deltagaren ser texten "AI-funktionerna är avstängda av {{orgName}}" — men chefen har
ingen ruta att slå av/på den i Inställningar → Din organisation. I dag kräver det SQL. (Står som
"självservice för AI-brytaren" under Chefsvy i uppdraget — det här bekräftar att den behövs.)

**V8. Mobilmenyn är deltagarens meny.** Konsulenten får hela hubbmenyn (Sök jobb, CV, Intresseguide,
Hälsa, Dagbok …) och "Konsultportal" sist under rubriken "Konsulent". Hennes egna avsnitt
(Deltagare, Platser, Rapporter …) finns bara som scrollrad ovanför innehållet. Skärmdump: M3-detalj.

**V9. Profil-dialogen på mobil kallar konsulenten "Deltagare"** (M3-detalj: dialog "Min profil" →
"km-konsulent@jobin.test / Deltagare") trots `active_role = CONSULTANT` i prod. Kandidat:
`client/src/components/layout/Sidebar.tsx:285` eller motsvarande i TopBar.

**V10. Deltagarkortet och Översikt säger olika om kontakt:** listan "Aldrig kontaktad", Översikt
"Ej kontaktad på 7+ dagar". Båda kan vara sanna, men en konsulent läser dem som två fakta.

### SKAV

**S1.** Platser: "0 0" i fetstil utan etiketter ovanför "Lägg till plats" (07-platser).
**S2.** Detaljhuvudet visar "0 Sparade jobb / 0 Aktiva mål" som siffror — som räkning är det sant,
men "—" används i samma rad för CV-poäng och Senaste kontakt; blandat språk.
**S3.** Sektionsknapparna på detaljsidan (Översikt/Aktivitet/Mål/Dagbok/Tidslinje) är knappar utan
`aria-current`/tablist — skärmläsaren vet inte vilken som är vald.
**S4.** Kommunikation: mallknapparna "Påminnelse om möte / Check-in meddelande / Grattis till
framsteg" står lösa under en tom konversationslista utan rubrik.
**S5.** Tidszon "Stockholm / London / New York" i en svensk kommunportal.
**S6.** Språkval Svenska/English i konsulentinställningarna medan konsulentvyn inte är översatt (med flit).
**S7.** Aktivitet: "Underlag till handläggaren" visar bara en "Ångra"-knapp utan status-text (vad
ångras?). 20-sektion-Aktivitet.
**S8.** "Eget jobbsökande: Hämtar …" syns ~1 s vid varje sektionsbyte — kort men märkbart.

## 3. Förslag på nya funktioner — ur flödet under aktivitetskravet

1. **Dagens pass som startvy.** Min dag visar möten och måldeadlines men inte dagens *pass* ur
   aktivitetsplanerna (vilka deltagare har pass i dag, vilka har checkat in, vilka saknar närvaro).
   Det är konsulentens faktiska morgonfråga under aktivitetskravet. Underlag: 01-oversikt saknar det,
   närvaron finns bara inne på varje deltagares Aktivitet.
2. **Underlagsflödet till handläggaren.** Rapporter har IVO-kvartalsunderlaget, och planen har
   "Underlag till handläggaren" med en Ångra-knapp — men det finns inget "skicka/markera lämnat"
   med datum, mottagare och kvitto. Utan det blir "Underlag lämnat 1" i IVO-tabellen ett påstående
   ingen kan spåra.
3. **Frånvaroanmälan från deltagaren + kvittens.** Konsulenten registrerar Giltig/Ogiltig/Sjuk, men
   det finns ingen väg för deltagaren att anmäla i förväg med orsak, som konsulenten sedan bekräftar.
   (STA-arkivets `AbsenceForm` hade orsakskategorier — återbrukskartan pekar dit.)
4. **Enkelt mål: titel + datum.** Se V3. Låt SMART vara utfällning, och visa målet på deltagarens
   sida samma dag.
5. **Kontakt-logg med ett klick från Översikt.** "Hör av dig → Skicka meddelande" leder till
   meddelandeformuläret; ett "Logga kontakt (telefon/möte)" direkt i listan hade tagit bort
   "Ej kontaktad"-varningen på rätt sätt när samtalet skett utanför portalen. (KA4 finns i
   massåtgärder, inte här.)
6. **Chefens AI-brytare och ett chefsläge** (V7, V8): Din organisation-blocket kan bära AI av/på,
   och mobilens meny bör byta till konsulentens avsnitt när `active_role = CONSULTANT`.
7. **Ersätt Tidslinjen med det som finns**: läsloggen (ÖV1), närvaro och journal i tidsordning —
   det är en tidslinje, och datan finns redan.

## 4. Vad jag INTE kunde pröva

- **Att skicka meddelande, gruppmeddelande, inbjudan** — avsiktligt (inga mejl, inga riktiga adresser);
  dialogerna öppnades och stängdes (26, 27, 32, 34).
- **Rapportutkast (AI)** — dialogen öppnad, "Skapa utkast" ej klickad (modellanrop kostar).
- **Överlämning hela vägen** — Testkommun har bara en konsulent; UI:t säger korrekt "Lägg till en
  kollega först".
- **Snabbanteckning och Ny anteckning sparade** — skriptet väntade på en dialog som inte finns
  (formuläret är inline); ingen rad skapades (verifierat i DB: 0 journalrader, 0 notes i dag).
- **PDF-rapport/Exportera rapport** — se V1, kräver manuell kontroll av om en ny flik öppnas.
- **Närvaroregistrering** — knapparna visades (Närvarande/Giltig/Ogiltig/Sjuk) men jag registrerade
  inte, för att inte ändra KM-röktestets utgångsläge.
