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
