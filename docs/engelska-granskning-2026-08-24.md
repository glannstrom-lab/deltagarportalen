# Granskning av den engelska översättningen — 2026-08-24

Sju parallella granskare (Sonnet), ett område var, hela `en.json` (8 550 nycklar)
läst mot svenskan rad för rad. Fullständiga rapporter med förslag per nyckel:
`docs/review-2026-08-24-engelska/`.

## Domen

**Översättningen är i väsentligt bättre skick än portalens övriga skuld.** Strukturen
var redan ren när granskningen började: 8 550 nycklar i båda filerna, exakt samma
uppsättning, noll avvikelser i `{{variabler}}`, noll typskillnader, noll tomma
engelska värden. Den juridiska texten (`privacy.*`, `terms.*`) höll GDPR:s
etablerade engelska terminologi rakt igenom, och krisstödet (`crisis.*`) höll —
hjälpnumren 112, 1177 och 90101 är hårdkodade utanför i18n och kan alltså inte
"lokaliseras" bort av en översättning.

Men **pariteten var disciplin, inte mekanik.** Ingenting vaktade den. En ny nyckel
som bara läggs i `sv.json` ger ingen krasch och inget typfel — i18next faller
tillbaka på svenska, och den engelska användaren ser svensk text mitt i
gränssnittet utan att något larmar.

**111 fynd: 16 kritiska, 39 stora, 52 små, 4 fel i svenskan.**

## De två felklasserna som betyder något

### 1. Svenska myndighetsnamn översattes bort — 53 strängar

`Arbetsförmedlingen` blev "the Employment Agency". `Migrationsverket` blev "the
Migration Agency". `Skatteverket` blev "the Tax Agency". `a-kassa` blev "an
unemployment insurance fund". `personnummer` blev "personal ID number".
`Integritetsskyddsmyndigheten` försvann helt ur klagomålstexten och lämnade bara
en beskrivning.

Det är värst exakt där det gör mest skada. Tjugofem av de 53 låg i
`international.*` — sidan "Ny i Sverige", som läses av den som just anlänt och
ska hitta rätt myndighet. **Ett generiskt engelskt namn går inte att googla, står
inte på skylten och finns inte på blanketten.** Den som söker "the Migration
Agency" hittar inte Migrationsverket.

Mönstret var inte ett medvetet val: samma myndigheter behöll korrekt sina svenska
namn i `career.laborMarket.*` och `career.relocation.*`. Det var alltså glapp
mellan namnrymder — vilket är precis vad som händer när ingen grind finns.

**Åtgärdat.** Alla 53 bär nu det svenska namnet, med kort engelsk förklaring inom
parentes där meningen står fristående: `Skatteverket (the Swedish Tax Agency)`,
`personnummer (Swedish personal identity number)`.

### 2. Kontoraderingen gick inte att slutföra på engelska

`DeleteAccountSection.tsx` jämförde mot den hårdkodade svenska strängen `'RADERA'`
på fyra ställen — inklusive `placeholder="RADERA"` — medan den engelska texten bad
användaren skriva "DELETE". En engelskspråkig användare fick alltså instruktionen
"Type DELETE to confirm", ett fält vars platshållare sa `RADERA`, och en knapp som
aldrig gick att aktivera: `disabled={confirmText !== 'RADERA'}`.

**Det är rätten till radering (GDPR art. 17) blockerad i gränssnittet för en hel
språkgrupp.** Det var inte en översättningsbugg utan en kodbugg som översättningen
avslöjade.

**Åtgärdat i koden, inte i texten.** Bekräftelseordet är nu en egen nyckel
(`settings.deleteAccount.confirmWord`), instruktionen och felmeddelandet
interpolerar det (`{{ord}}`), och jämförelsen läser samma nyckel. Ordet kan därmed
aldrig mer glida isär från jämförelsen. En sökning genom hela `src` visar att
detta var det enda stället där kod jämförde mot ett svenskt ord som *användaren
skriver in* — de övriga versalsträngarna är databasenum och ska vara som de är.

## Övriga rättade fynd

- **`profile.tip1`** påstod att *arbetsgivare* kan se ett profilfält. Svenskan säger
  *arbetsförmedlare* — handläggaren. Ett påstående om vem som får åtkomst, felaktigt.
- **Hubbnamnen** hade glidit isär: "Översikt" var både "Overview" och "Dashboard",
  "Söka jobb" hade tre engelska namn, "Din vardag" fyra. Nu ett namn per hubb.
  *Notera:* "Your everyday life" är längre än "Din vardag" och kan behöva kortas om
  det bryter navigationens layout — en sträng att ändra i så fall.
- **`common.submit`** stod kvar som "Submit" trots DESIGN.md:s regel (→ "Send").
- **`crisis.resources.companion.name`** hade översatt egennamnet "Jourhavande
  medmänniska" till "On-call Companion" — svårt att ringa en tjänst vars namn inte
  finns.
- **`cvBuilder.placeholders.phone`** var "555-123-4567", ett amerikanskt
  testnummerformat på en svensk portal.
- Genomgående: Title Case där mening-versalisering är regeln, blandad
  brittisk/amerikansk stavning, och tomtillstånd som konstaterade ("No CVs found")
  i stället för att bjuda in.

**164 engelska strängar ändrade totalt.**

## Kvar att besluta — inte översättningsfrågor

Åtta fynd rör påståenden som står **identiskt i båda språken**. Att rätta dem bara
på engelska hade skapat divergens mellan språken, vilket är värre än felet. De
kräver ett beslut om den svenska texten, och lämnas därför orörda:

| Nyckel | Påstående |
|---|---|
| `landing.trust.partnersTitle` | "Trusted by organizations across Sweden" |
| `landing.trust.arbetsformedlingen` | Arbetsförmedlingen visad som förtroendelogotyp |
| `landing.socialProof.quote` + `quoteSource` | Kundcitat utan namngiven källa |
| `landing.socialProof.growing` + `everyDay` | "Growing every day" / "New users registering" |
| `landing.faq.a2`, `a3` | "many of our users" fick jobb / nya karriärvägar |
| `ai.assistant.insights.*` (3 st) | "3x more responses", "+25%", "78% chance of interview" — hårdkodade strängar framställda som personliga AI-insikter |

Detta är samma felklass som granskningen 2026-08-09 dokumenterade ("ett påhittat
värde har alltid föredragits framför ett tomt fält"), och `landing.trust.*` är
allvarligast: en myndighetslogotyp under rubriken "Trusted by" antyder ett
officiellt samarbete som inte är belagt.

Tre rena fel i svenskan, också olösta: `journey.tabs.achievements` är på engelska
i den svenska filen; `consultant.participants.noParticipantsDesc` saknar ett `s`
(*tilldelat* → *tilldelats*); `aiPolicy.compliance.aiActDesc` citerar AI Act
**art. 52**, ett utkastnummer — den slutliga förordningen har märkningskravet i
art. 50.2. `resurserHub.hubDescription` lovar fortfarande "utskriftsmaterial",
som togs bort 2026-08-23.

## Den större luckan: översättningen slutar där innehållet börjar

Granskningen ovan gäller `en.json`. Men **portalens innehåll ligger inte där.**
En nåbarhetsanalys från `main.tsx` (`node client/scripts/dead-code.cjs`) korsad med
en sökning efter svensk text i levande filer ger:

| | Träffrader med svensk text |
|---|---|
| `src/data/` + `src/services/` (innehållsdata) | **3 088** i 26 filer |
| Komponenter och sidor | 551 i 105 filer |
| `pages/sta/` (avaktiverad modul) | 271 |

De tyngsta är `data/exercises.ts` (1 922), `services/interestGuideData.ts` (418)
och `data/externaResurser.ts` (378). Det betyder konkret att en användare som
byter till engelska får **ett engelskt skal runt svenskt innehåll**: hela
övningsbiblioteket, intresseguidens frågor och yrkesbeskrivningar, artiklarna,
rådgivartexterna och de externa resurserna är enbart svenska.

Intresseguiden är det tydligaste exemplet — en engelskspråkig användare svarar på
frågor som *"Jag tycker om praktiskt arbete med händerna, som att meka, bygga
eller arbeta med maskiner"* på svenska, och får ett resultat byggt på svaren.

*Undantag som inte ska översättas:* `data/afRegions.ts` (svenska länsnamn) och
`international.language.phrases.*.sv` (svenska övningsfraser, med flit).

Det här är inte en bugg utan en produktavgränsning som aldrig blivit uttalad.
Alternativen är att översätta innehållet, att avgränsa engelskan till de ytor där
den håller, eller att säga rakt ut i gränssnittet att innehållet är på svenska.
**Det är ett beslut, inte en åtgärd** — och det största kvarvarande arbetet på
engelskan.

## Grinden som nu finns

`client/src/i18n/sprakparitet.test.ts` — elva kontroller, alla gröna:

1. Ingen svensk nyckel saknas i engelskan, och tvärtom.
2. Samma nyckel har samma typ i båda filerna.
3. Inget engelskt värde är tomt där svenskan har text.
4. `{{variabler}}` är identiska per nyckel (en tappad variabel renderas som tom
   sträng, en påhittad renderas rått i gränssnittet — båda är produktionsbuggar).
5. **Skyddade svenska namn står kvar i engelskan** — 15 myndigheter och begrepp.
   Kontrollen är skiftlägesokänslig (svenskan böjer: *A-kassa* i rubrik, *a-kassan*
   i löptext) och godtar en förklaring inom parentes, eftersom den bara kräver att
   det svenska namnet **finns kvar**.

Fem av testerna är positiva kontroller som bevisar att kontrollerna kan falla —
per lärdomen 2026-08-09 om att ett test som passerar inte bevisar något förrän man
vet att det kan fela. Grinden startar på **noll**, inte på ett fryst tak.

Vill man lägga till ett skyddat namn: `SKYDDADE_NAMN` i samma fil. Behöver en
enskild nyckel undantas: `UNDANTAG`, som i dag är tom.

## Verifierat

`npm run verify` i `client/` — exit 0. 2 419 tester i 150 filer gröna, samtliga
åtta grindar inklusive de tre frysta taken.

*Not:* första körningen visade tre fel i `nav-smoke` och `guest-returnto` — samtliga
20-sekunders timeouts under full parallell last. De passerar isolerat och passerade
vid omkörning av hela sviten. De är lastberoende flakes, inte orsakade av de här
ändringarna.
