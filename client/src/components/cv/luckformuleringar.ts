/**
 * AIX3: "Luckan i CV:t". Färdiga formuleringar för en tidslucka.
 *
 * Medvetet UTAN AI. Skälen:
 *  - Orsaken är personens egen och kan vara hälsa (art. 9). Med mallar lämnar
 *    ingenting webbläsaren, och det finns ingenting att logga.
 *  - Formuleringarna är korta och formelartade. En modell tillför här mest en
 *    risk att den hittar på detaljer (en kurs, en arbetsgivare, ett resultat)
 *    som personen inte har att stå för i en intervju.
 *  - Mallarna fungerar även när AI är avstängt för kontot eller organisationen.
 *
 * Orsaken är alltid en KOD ur LUCKKODER, aldrig fritext. Inget här anropar
 * nätverket; testet `luckformuleringar.test.ts` vaktar att det förblir så.
 *
 * Texten är svensk, eftersom CV:t och brevet är det.
 */

export const LUCKKODER = ['barn', 'narstaende', 'studier', 'omstallning', 'sjukdom', 'vill_inte_ange'] as const
export type Luckkod = typeof LUCKKODER[number]

export interface Luckformuleringar {
  /** En kort rad som kan stå i CV:t under erfarenhet. */
  cvRad: string
  /** En mening till det personliga brevet. */
  brev: string
  /** Ett kort svar på "Vad gjorde du under den tiden?". */
  intervju: string
}

const MANADER = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']

/** `2021-03` → `mars 2021`. Ogiltigt värde ger tom sträng. */
export function manadsText(yyyyMm: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(yyyyMm)
  if (!m) return ''
  const namn = MANADER[Number(m[2]) - 1]
  return namn ? `${namn} ${m[1]}` : ''
}

export function periodText(fran: string, till: string): string {
  const a = manadsText(fran)
  const b = manadsText(till)
  if (!a || !b) return ''
  return a === b ? a : `${a} till ${b}`
}

/**
 * Sådant som inte står i mallarna: ingen formulering påstår något om vad
 * personen lärde sig, uppnådde eller gjorde under tiden. Bara den neutrala
 * orsaken, att perioden är över och att hen är redo. Personen ska kunna stå
 * för varje ord i en intervju.
 */
const MALLAR: Record<Luckkod, (period: string) => Luckformuleringar> = {
  barn: (p) => ({
    cvRad: 'Hemma med barn',
    brev: `Under ${p} var jag hemma med mina barn. Nu är jag redo att arbeta igen.`,
    intervju: `Under ${p} var jag hemma med mina barn. Den perioden är avslutad, och nu är jag redo att börja arbeta.`,
  }),
  narstaende: (p) => ({
    cvRad: 'Vård av närstående',
    brev: `Under ${p} tog jag hand om en närstående. Nu är jag redo att arbeta igen.`,
    intervju: `Under ${p} tog jag hand om en närstående. Den perioden är över, och jag är redo att börja arbeta.`,
  }),
  studier: (p) => ({
    cvRad: 'Studier',
    brev: `Under ${p} studerade jag. Nu vill jag använda det jag lärt mig i ett arbete.`,
    intervju: `Under ${p} studerade jag. Nu vill jag komma ut i arbete och använda det jag har lärt mig.`,
  }),
  omstallning: (p) => ({
    cvRad: 'Omställning och jobbsökande',
    brev: `Under ${p} ställde jag om och sökte nytt arbete. Nu är jag redo för nästa steg i arbetslivet.`,
    intervju: `Under ${p} var jag mellan två arbeten och sökte något nytt. Nu söker jag det här jobbet för att det passar det jag vill göra.`,
  }),
  sjukdom: (p) => ({
    cvRad: 'Tid för återhämtning',
    brev: `Under ${p} tog jag en paus från arbetet för att återhämta mig. Nu är jag redo att arbeta.`,
    intervju: `Under ${p} behövde jag en paus från arbetet. Den är avslutad och jag är redo att börja arbeta. Jag går inte gärna in på detaljer, men jag svarar gärna på frågor om vad jag kan bidra med.`,
  }),
  vill_inte_ange: (p) => ({
    cvRad: 'Uppehåll från arbete',
    brev: `Under ${p} hade jag ett uppehåll från arbete av personliga skäl. Nu är jag redo att arbeta.`,
    intervju: `Under ${p} hade jag ett uppehåll av personliga skäl. Det är avslutat och jag är redo att börja arbeta. Jag går inte gärna in på detaljer.`,
  }),
}

export function arLuckkod(v: unknown): v is Luckkod {
  return typeof v === 'string' && (LUCKKODER as readonly string[]).includes(v)
}

/**
 * Tre formuleringar för en kod och en period (`YYYY-MM`). Okänd kod eller
 * ogiltig period ger null — hellre ingen text än en text med hål i.
 */
export function luckformuleringar(kod: unknown, fran: string, till: string): Luckformuleringar | null {
  if (!arLuckkod(kod)) return null
  const period = periodText(fran, till)
  if (!period) return null
  return MALLAR[kod](period)
}
