/**
 * Nyckelordskontroll mot en jobbannons — utan AI (O4, 2026-08-25).
 *
 * ## Varför den finns bredvid AI-matchningen
 *
 * `CVJobMatchPanel` gör redan en AI-matchning (`cv-jobbmatchning`). Den är bra
 * men har tre begränsningar som gör att den inte alltid går att använda:
 *
 * 1. Den kräver att användaren har AI påslaget. Är brytaren av får personen
 *    ingenting alls.
 * 2. Den har ett tak på tio anrop per kvart.
 * 3. Den tar sekunder, inte millisekunder.
 *
 * Den här funktionen körs lokalt i webbläsaren, alltid, direkt. Ingen text
 * lämnar enheten.
 *
 * ## Vad den säger, och vad den inte säger
 *
 * Den svarar på **en** fråga: *vilka ord förekommer i annonsen men inte i ditt
 * CV?* Det är samma fråga rekryteringssystemens nyckelordsfiltrering ställer.
 *
 * Den sätter **ingen poäng**. En procentsats hade sett exakt ut utan att vara
 * det — vi vet inte vilket system arbetsgivaren använder, hur det viktar, eller
 * ens om det finns ett. Ett tal utan täckning är ett påhittat värde.
 *
 * ## Så matchas orden
 *
 * Svenska böjs mycket: annonsen skriver "erfarenheter", CV:t "erfarenhet".
 * Full stemming är för trubbig (den slår ihop "lager" och "lagerarbete" med
 * "lag"), så vi använder **prefixjämförelse med golv**: två ord räknas som
 * samma om det ena börjar med det andra och det kortare är minst sex tecken.
 * "erfarenhet" ⊂ "erfarenheter" träffar; "lag" ⊂ "lager" gör det inte.
 */

/**
 * Ord som säger något om språket, inte om jobbet.
 *
 * Listan är avsiktligt kort. Ett för aggressivt filter tar bort riktiga krav
 * ("körkort", "svenska"), och ett för snålt fyller listan med brus. Den täcker
 * funktionsord, de vanligaste verben i annonsspråk, och företagsfloskler som
 * aldrig hjälper någon att komma vidare.
 */
const STOPPORD = new Set<string>([
  // funktionsord
  'och', 'eller', 'men', 'som', 'att', 'det', 'den', 'det', 'dessa', 'denna', 'detta',
  'för', 'till', 'från', 'med', 'utan', 'över', 'under', 'mellan', 'genom', 'inom',
  'har', 'hade', 'har', 'ska', 'skall', 'kan', 'kunna', 'vill', 'vara', 'blir', 'bli',
  'också', 'samt', 'både', 'inte', 'ingen', 'någon', 'några', 'alla', 'varje', 'annan',
  'där', 'här', 'när', 'hur', 'vad', 'vem', 'vilka', 'vilket', 'vilken',
  'din', 'ditt', 'dina', 'vår', 'vårt', 'våra', 'sin', 'sitt', 'sina', 'oss', 'dig',
  'the', 'and', 'you', 'your', 'our', 'for', 'with', 'that', 'this', 'will', 'are',
  // annonsspråk
  'tjänsten', 'tjänst', 'rollen', 'roll', 'jobbet', 'arbetet', 'arbeta', 'arbetar',
  'söker', 'söka', 'sökande', 'ansökan', 'ansöker', 'anställning', 'anställd',
  'erbjuder', 'erbjuda', 'välkommen', 'välkomna', 'gärna', 'meriterande',
  'företaget', 'företag', 'verksamheten', 'verksamhet', 'organisationen',
  'arbetsplats', 'arbetsplatsen', 'kollegor', 'kollegorna', 'medarbetare',
  'urval', 'intervjuer', 'löpande', 'sista', 'ansökningsdag', 'tillträde',
  'omfattning', 'heltid', 'deltid', 'placering', 'placeringsort',
  // floskler
  'spännande', 'utmanande', 'utvecklande', 'dynamisk', 'engagerad', 'driven',
  'passion', 'passionerad', 'framåt', 'framtiden', 'möjlighet', 'möjligheter',
])

/** Kortare än så här bär ordet sällan information i det här sammanhanget. */
const MINSTA_ORDLANGD = 4

/** Golvet för prefixjämförelse. Under sex tecken blir träffarna slumpmässiga. */
const MINSTA_PREFIX = 6

/**
 * Delar upp text i ord.
 *
 * Behåller `+`, `#` och `.` inuti ord så att `c++`, `c#` och `.net` överlever.
 * Siffror behålls i ord som `iso9001` men rena tal filtreras bort — ett årtal
 * i annonsen säger ingenting om kompetens.
 */
export function delaIOrd(text: string): string[] {
  if (!text) return []
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#.\-/]+/gu, ' ')
    .split(' ')
    .map((ord) => ord.replace(/^[.\-/]+|[.\-/]+$/g, ''))
    .filter(Boolean)
}

function arKandidat(ord: string): boolean {
  if (ord.length < MINSTA_ORDLANGD) return false
  if (STOPPORD.has(ord)) return false
  if (/^\d+$/.test(ord)) return false
  return true
}

/** Finns `sokord` i mängden, med hänsyn till svensk böjning? */
function finnsBland(sokord: string, ord: Set<string>): boolean {
  if (ord.has(sokord)) return true
  if (sokord.length < MINSTA_PREFIX) return false

  for (const kandidat of ord) {
    if (kandidat.length < MINSTA_PREFIX) continue
    if (kandidat.startsWith(sokord) || sokord.startsWith(kandidat)) return true
  }
  return false
}

export interface Nyckelordsjamforelse {
  /** Ord ur annonsen som också finns i CV:t. Vanligast först. */
  finns: string[]
  /** Ord ur annonsen som saknas i CV:t. Vanligast först. */
  saknas: string[]
  /** Hur många ord ur annonsen som prövades. */
  provade: number
}

/** Hur många ord ur annonsen som prövas. Fler blir brus, färre missar krav. */
const MAX_NYCKELORD = 30

/**
 * Jämför ett CV mot en jobbannons.
 *
 * Orden rangordnas efter hur ofta de förekommer i annonsen — det som nämns
 * flera gånger är oftare ett krav än något som nämns i förbigående.
 */
export function jamforMotAnnons(cvText: string, annonsText: string): Nyckelordsjamforelse {
  const cvOrd = new Set(delaIOrd(cvText))

  const frekvens = new Map<string, number>()
  for (const ord of delaIOrd(annonsText)) {
    if (!arKandidat(ord)) continue
    frekvens.set(ord, (frekvens.get(ord) ?? 0) + 1)
  }

  const rangordnade = [...frekvens.entries()]
    // Frekvens först, sedan bokstavsordning så att resultatet blir
    // deterministiskt — annars flyttar sig orden mellan två körningar på
    // samma annons, vilket ser ut som att något ändrats.
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'sv'))
    .slice(0, MAX_NYCKELORD)
    .map(([ord]) => ord)

  const finns: string[] = []
  const saknas: string[] = []

  for (const ord of rangordnade) {
    if (finnsBland(ord, cvOrd)) finns.push(ord)
    else saknas.push(ord)
  }

  return { finns, saknas, provade: rangordnade.length }
}
