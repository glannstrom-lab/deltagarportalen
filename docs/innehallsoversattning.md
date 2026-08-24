# Engelsk översättning — så fungerar den

*Byggd 2026-08-24. Föregicks av granskningen i `docs/engelska-granskning-2026-08-24.md`,
som visade att gränssnittet var översatt men innehållet inte.*

Portalens engelska bor på **tre ställen**, av tre olika skäl. Innan du lägger till
text någonstans: läs vilket av dem din text hör hemma i, annars blir den osynlig
för engelskan.

| Vad | Var | Laddas |
|---|---|---|
| Gränssnittstext (knappar, rubriker, felmeddelanden) | `src/i18n/locales/{sv,en}.json` | `sv` eagerly, `en` dynamiskt |
| Innehållsdata (övningar, intresseguide, externa resurser, rådgivare) | `src/data/oversattningar/*.en.json` | dynamiskt, bara på engelska |
| Kunskapsbankens artiklar | Kolumnerna `title_en`, `summary_en`, `content_en` i `articles` | med raden |

## 1. Gränssnittstext — i18next

Som förut: `t('nyckel')`. Svenskan är originalet, engelskan speglar den.

**Grind:** `src/i18n/sprakparitet.test.ts` — samma nycklar, samma typer, samma
`{{variabler}}`, och **svenska myndighetsnamn kvar i engelskan**. Startar på noll.

## 2. Innehållsdata — overlay

Innehållet ligger på svenska i sina datafiler. Engelskan är en **platt karta
`nyckel → text`** som läggs ovanpå vid körning.

```
src/lib/innehallsOversattning.ts     vandraren: härleder nycklar, applicerar overlay
src/data/oversattningar/register.ts  vilka moduler och exporter som översätts
src/data/oversattningar/index.ts     körningen: useInnehall() och oversattInnehall()
src/data/oversattningar/*.en.json    översättningarna (6 731 strängar)
```

**Nyckeln byggs av vägen genom strukturen**, med `id`/`slug` som segment där
posten har ett: `exercises.strengths.steps.0.title`. Den är alltså stabil även
om övningarna byter ordning.

### Varför overlay och inte en engelsk kopia av datan

En engelsk tvillingfil hade dubblerat strukturen — samma id:n, samma ikoner,
samma ordning på två ställen. Sådant glider isär tyst: en ny övning läggs till
på svenska, den engelska filen glöms, och ingen märker det förrän en användare
ser ett tomt kort. Här bor strukturen på **ett** ställe, och en saknad nyckel
ger svensk text i stället för tom.

### Fält som INTE översätts

`FALT_SOM_AR_NYCKLAR` i `innehallsOversattning.ts`. Där ligger fält vars värden
koden **jämför mot**: `id`, `category`, `difficulty`, `coachIds`, `kategorier`
m.fl. En övnings `category` filtrerar, slår upp färg och mappar mot
kunskapsbanken (`Exercises.tsx`) samtidigt som den visas — översätts den i datan
går grupperingen sönder. Den renderas i stället genom
`t('exercises.categories.<svenska>')`.

**Lägger du till ett fält där:** kontrollera att det renderas genom `t()`
någonstans, annars blir det osynligt för engelskan.

### Så här läser du översatt innehåll

```ts
// Komponent — räknar om vid språkbyte
const resurser = useInnehall('externaResurser', EXTERNA_RESURSER, 'EXTERNA_RESURSER')

// Tjänstelager — översätter vid gränsen så alla vägar in får samma sak
return oversattInnehall('exercises', lista, 'exercises')
```

Intresseguiden har egna hookar i `src/services/useIntresseguideInnehall.ts`
(`useYrken`, `useFragor`, `useJobbmatchningar` …). **Använd dem** — läser du
`occupations` direkt ur `interestGuideData.ts` får du svenska.

`calculateJobMatches` tar en yrkeslista som tredje argument just därför:
matchningen bär med sig hela yrkesobjektet ut i gränssnittet, så det räcker inte
att översätta listan på sidan — beräkningen måste utgå från den.

**Grindar:**
- `innehallsparitet.test.ts` — varje svensk sträng har en engelsk motsvarighet.
  Nycklarna räknas fram ur den **levande datan** vid varje körning, så det finns
  inget manifest som kan bli inaktuellt.
- `innehallKorning.test.ts` — att översättningen faktiskt *används*. En komplett
  overlay som ingen läser ser annars ut som ett fungerande system.

### Lägga till innehåll

1. Skriv svenskan i datafilen som vanligt.
2. `npx vite-node scripts/innehall/extrahera.ts` → manifest med alla nycklar.
3. Översätt de nya nycklarna in i motsvarande `*.en.json`.
4. `npx vitest run src/data/oversattningar` — grinden säger vad som saknas.

## 3. Artiklarna — kolumner i databasen

`articles` har `title_en`, `summary_en`, `content_en` (nullbara).
`contentApi.ts` väljer kolumn efter `localStorage.language`, **fältvis**: en
artikel med översatt titel men inte brödtext visar engelsk rubrik och svensk
text, i stället för att helt utebli. Att blanda är fult men läsbart; att sakna
är varken.

En ny artikel kan alltså publiceras på svenska först — `_en` är NULL och
svenskan visas.

`LISTKOLUMNER` hämtar `title_en` och `summary_en` (listvyer behöver ingen
brödtext); enskild artikel hämtar allt med `select('*')`.

## Översättningsstandarden

Den som skriver engelsk text i portalen ska följa det här. Det är inte stil —
det följer av vem som läser.

**Läsaren är oftast nyanländ och har varken svenska eller engelska som
modersmål.** Skriv **enkel, entydig, internationell engelska (ungefär B1)**:
korta meningar, vanliga ord, aktiv form. **Inga idiom** — "hit the ground
running", "a leg up", "get your ducks in a row" är exakt fel nivå. Är två
formuleringar båda korrekta, välj den enklare. Det väger tyngre än att låta
idiomatiskt.

**Svenska myndighets- och begreppsnamn översätts aldrig:** Arbetsförmedlingen,
Försäkringskassan, Skatteverket, Migrationsverket, Bolagsverket, Kronofogden,
Socialstyrelsen, Integritetsskyddsmyndigheten, CSN, UHR, a-kassa, SFI, LAS,
personnummer, samordningsnummer, BankID, komvux, yrkeshögskola, folkbokföring,
Jourhavande medmänniska. Vid första förekomsten i en fristående mening: kort
förklaring inom parentes — `Arbetsförmedlingen (the Swedish Public Employment
Service)`. **Ett generiskt engelskt namn går inte att googla, står inte på
skylten och finns inte på blanketten.**

Detta vaktas maskinellt av `sprakparitet.test.ts` (`SKYDDADE_NAMN`).

**Tonen** är densamma som svenskans: en lugn vän, aldrig en myndighet, aldrig en
prestationsmätning. Peppig amerikansk app-engelska är fel register. Ingen
administrationsengelska: "Configure" → "Change", "Activate" → "Turn on".

**Inga påståenden utan underlag.** Engelskan får aldrig säga mer än svenskan —
inga belopp, procentsatser eller regelvillkor som inte står i originalet.

**Amerikansk stavning** genomgående (organize, analyze, behavior, center).

## Vad som medvetet INTE är översatt

- **Konsulentvyn** (`/consultant`, `pages/consultant/`, `components/consultant/`).
  Arbetskonsulenterna är svensktalande och vyn har enligt DESIGN.md §2 medvetet
  en annan ton än deltagarvyerna. Att översätta den är ett eget beslut.
- **STA-modulen** (`pages/sta/`) — avaktiverad sedan 2026-08-03.
- **`data/afRegions.ts`** — svenska länsnamn ska vara svenska.
- **`international.language.phrases.*.sv`** — svenska övningsfraser, med flit.
- **De prerenderade guidesidorna** (`dist/guider/`, `scripts/prerender-guides.cjs`).
  De är en svensk SEO-yta. Nu när artiklarna har `content_en` **går** det att
  generera engelska motsvarigheter, men det kräver beslut om URL-struktur,
  `hreflang` och sitemap — och det är en produktfråga, inte en översättningsfråga.
