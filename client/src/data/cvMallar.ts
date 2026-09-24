/**
 * CV-mallarnas spaltform — registret bakom "hur läses den här mallen?" (O4, 2026-08-25).
 *
 * ## Varför registret finns
 *
 * Varje svensk CV-sajt leder med ordet "ATS-vänlig". Vi har aldrig sagt det,
 * och kunde inte ha sagt det: ingenstans i portalen stod hur mallarna faktiskt
 * är byggda. Den här filen är den mätningen, gjord 2026-08-25 genom att läsa
 * alla tolv mallfilerna.
 *
 * ## Vad vi säger, och vad vi inte säger
 *
 * Vi **beskriver layouten**. Vi sätter **inget betyg** och lovar ingenting om
 * hur ett enskilt rekryteringssystem beter sig — vi har inte testat mallarna
 * mot något. "ATS-godkänd" utan en sådan körning vore ett påhittat värde av
 * exakt den sorten portalen betalat av under sommaren.
 *
 * Det vi kan säga med täckning:
 *
 * - PDF:erna innehåller **riktig text**, inte bilder. De renderas av Chromium
 *   ur HTML (`client/api/cv-pdf.js`), så all text går att markera och kopiera.
 *   Det är den enskilt viktigaste egenskapen för maskinell läsning, och den
 *   gäller alla tolv mallarna.
 * - **Spaltformen** avgör i vilken ordning texten kommer ut när en parser
 *   läser dokumentet linjärt. En sidopanel kan hamna före, efter eller mitt i
 *   huvudtexten beroende på verktyg.
 *
 * ## Mätningen
 *
 * `<aside>`-elementet i en vågrät flex-behållare = egen spalt. Sju mallar har
 * en sidopanel som bär innehåll (kontaktuppgifter, kompetenser, språk). Fyra
 * har ingen alls. Berlin har en 60 px smal panel som bara innehåller initialer
 * och en roterad dekortext — den är `aria-hidden` och bär inga uppgifter.
 *
 * Id:na nedan är CV-byggarens (`TEMPLATES` i `pages/CVBuilder.tsx`), inte
 * komponentnamnen. `spaltform.test.ts` vaktar att de två listorna inte glider
 * isär.
 */

/** Hur mallens innehåll är fördelat över sidan. */
export type Spaltform = 'en-spalt' | 'tva-spalter' | 'dekorativ-spalt'

export interface Mallform {
  /** CV-byggarens template-id. */
  id: string
  spaltform: Spaltform
  /** Komponenten som renderar mallen — för spårbarhet vid nästa mätning. */
  komponent: string
}

export const MALLFORMER: readonly Mallform[] = [
  { id: 'sidebar', spaltform: 'tva-spalter', komponent: 'ModernTemplate' },
  { id: 'centered', spaltform: 'en-spalt', komponent: 'CenteredTemplate' },
  { id: 'minimal', spaltform: 'en-spalt', komponent: 'MinimalTemplate' },
  { id: 'creative', spaltform: 'en-spalt', komponent: 'CreativeTemplate' },
  { id: 'executive', spaltform: 'en-spalt', komponent: 'ExecutiveTemplate' },
  { id: 'nordic', spaltform: 'tva-spalter', komponent: 'NordicTemplate' },
  { id: 'budapest', spaltform: 'tva-spalter', komponent: 'BudapestTemplate' },
  { id: 'rotterdam', spaltform: 'tva-spalter', komponent: 'RotterdamTemplate' },
  { id: 'chicago', spaltform: 'tva-spalter', komponent: 'ChicagoTemplate' },
  { id: 'atelier', spaltform: 'tva-spalter', komponent: 'AtelierTemplate' },
  { id: 'manhattan', spaltform: 'tva-spalter', komponent: 'ManhattanTemplate' },
  { id: 'berlin', spaltform: 'dekorativ-spalt', komponent: 'BerlinTemplate' },
] as const

const EFTER_ID = new Map(MALLFORMER.map((m) => [m.id, m]))

/** Det id som används när inget annat är valt — och när ett id inte går att tyda. */
export const STANDARDMALL = 'sidebar'

/**
 * Mallarna som visas direkt i CV-byggarens första steg (LS3, 2026-09-24).
 * De övriga sju ligger bakom "Visa fler mallar".
 *
 * Tolv kort på en gång bröt mot DESIGN.md ("hellre 5 saker väl än 15 saker
 * tätt"). Urvalet är de fem mest valda i prod, mätt 2026-09-24 på `cvs.template`
 * (minimal 11, sidebar 8, manhattan 3, executive 2, centered 2 — creative och
 * budapest hade också 2). Tre av fem är enspaltiga, vilket stämmer med
 * `atsNote`: en spalt är det säkraste valet mot ett rekryteringssystem.
 * `STANDARDMALL` måste finnas med — den är förvald och ska synas.
 */
export const REKOMMENDERADE_MALLAR: readonly string[] = [
  'sidebar',
  'centered',
  'minimal',
  'executive',
  'manhattan',
]

/**
 * Vilka mallkort som ska visas, i vilken ordning.
 *
 * De rekommenderade först, sedan de övriga — ordningen inom varje grupp följer
 * `alla`. Ordningen är densamma utfällt och hopfällt, så att fälla ut lägger
 * till kort efter de som redan syns i stället för att kasta om dem.
 *
 * Hopfällt syns de rekommenderade plus den valda mallen om den hör till de
 * övriga — annars ser användaren inte vad hen redan valt.
 */
export function mallarAttVisa<T extends { id: string }>(
  alla: readonly T[],
  valtId: string | null | undefined,
  visaAlla: boolean,
): T[] {
  const rekommenderade = alla.filter((m) => REKOMMENDERADE_MALLAR.includes(m.id))
  const ovriga = alla.filter((m) => !REKOMMENDERADE_MALLAR.includes(m.id))
  if (visaAlla) return [...rekommenderade, ...ovriga]
  return [...rekommenderade, ...ovriga.filter((m) => m.id === valtId)]
}

/**
 * Mall-id som finns i `cvs.template` i prod men inte i `MALLFORMER`.
 *
 * Tre generationer har skrivit till den kolumnen. Mätt 2026-09-18 bar 7 av
 * 33 CV:n ett id som mallregistret inte känner igen:
 *
 * | id           | antal | varifrån |
 * |--------------|-------|----------|
 * | `modern`     | 4     | kolumnens DEFAULT och `CVBuilder`s starttillstånd |
 * | `centrerad`  | 1     | svenskt visningsnamn sparat som id |
 * | `sidokolumn` | 1     | svenskt visningsnamn sparat som id |
 * | `classic`    | 1     | den gamla väljaren (`CVTemplateSelector`, numera dödkod) |
 *
 * `modern` och `sidokolumn` pekar båda på dagens `sidebar` — komponenten bakom
 * `sidebar` heter fortfarande `ModernTemplate`, och `Sidokolumn` är dess
 * svenska namn i väljaren. `centrerad` är `centered`. `classic` hette
 * "Klassisk" i den gamla väljaren; närmast idag är `centered`, som beskrivs
 * som "Klassisk navy-header … Tidlös". Den sista är ett omdöme, inte en
 * mätning — de tre andra är entydiga.
 */
const ARVDA_MALL_ID: Readonly<Record<string, string>> = {
  modern: 'sidebar',
  sidokolumn: 'sidebar',
  centrerad: 'centered',
  classic: 'centered',
  // Finns inte i prod, men `pdfExportService` bar en egen `nordisk`-nyckel.
  // Utan raden hade normaliseringen skickat den till `sidebar` och tagit bort
  // ett stöd som faktiskt fanns.
  nordisk: 'nordic',
}

/**
 * Kanoniskt mall-id. Arvda id översätts, okända faller på `STANDARDMALL`.
 *
 * VARFÖR DEN FINNS. `CVPrintLayout` slog upp `SIDEBAR_CONFIG[template]` direkt.
 * Registret har `centered: null` och `minimal: null` med betydelsen "känd mall,
 * ingen sidopanel" — men ett OKÄNT id ger `undefined`, och koden behandlade de
 * två lika. Följden: mallen renderades av `default`-grenen, alltså
 * `ModernTemplate` som HAR en sidopanel, medan panelens bakgrund aldrig målades.
 *
 * Verifierat i prod 2026-09-18 på print-vägen: med `sidebar` sätts
 * `html { background: linear-gradient(...) }`, med `modern` blir den `none`.
 * Panelen slutar då där `<aside>`-innehållet tar slut i stället för att gå ned
 * till papperskanten, och på ett flersidigt CV saknar sida 2 och framåt panel
 * helt. Det är samma kant-till-kant-mekanik som lärdomen 2026-07-03 beskriver.
 *
 * Normalisera vid varje gräns där ett id kommer utifrån — databasen, en URL
 * eller en sparad version — så kan `undefined` aldrig uppstå längre in.
 */
export function normaliseraMallId(id: string | null | undefined): string {
  if (!id) return STANDARDMALL
  if (EFTER_ID.has(id)) return id
  return ARVDA_MALL_ID[id] ?? STANDARDMALL
}

/** Är id:t ett av de tolv som registret känner till? */
export function arKantMallId(id: string | null | undefined): boolean {
  return !!id && EFTER_ID.has(id)
}

/** Spaltform för ett mall-id. Okänt id ger `null` — aldrig en gissning. */
export function spaltformFor(id: string | null | undefined): Spaltform | null {
  if (!id) return null
  return EFTER_ID.get(id)?.spaltform ?? null
}

/**
 * i18n-nyckeln för spaltformens korta etikett.
 * Texterna bor i `cvBuilder.templates.spaltform.*`.
 */
export function spaltformNyckel(spaltform: Spaltform): string {
  return `cvBuilder.templates.spaltform.${spaltform}`
}
