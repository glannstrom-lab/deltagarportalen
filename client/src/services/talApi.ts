/**
 * AIX8 — "Prata, så skriver vi": rensa en inpratad text.
 *
 * Servern (`client/api/_prompts/tal.js` + `_tal.js`) har redan kastat en rensning
 * som innehåller ord, siffror eller negationer som inte fanns i originalet, som
 * tappat innehåll eller som är längre än originalet. Här skickas texten och det
 * rensade svaret lämnas tillbaka — personen väljer själv vilken version som
 * hamnar i fältet.
 *
 * Går genom `callAI`: PII-sanering, AI-av-brytaren och dagstaket gäller.
 */

import { callAI } from '@/services/aiApi'

/** Samma tak som servern. */
export const TAL_MAX_TECKEN = 3000

/** Lägger det valda i slutet av fältets text, med ett mellanrum om det behövs. */
export function laggTillText(fore: string, valt: string): string {
  const nytt = valt.trim()
  if (!nytt) return fore
  if (!fore.trim()) return nytt
  return fore.replace(/\s+$/, '') + ' ' + nytt
}

/** Rensar texten. Kastar vid fel i anropet eller ett svar som inte går att läsa. */
export async function rensaTal(text: string): Promise<string> {
  const underlag = text.trim().slice(0, TAL_MAX_TECKEN)
  if (!underlag) throw new Error('Det finns ingen text att rensa.')
  // Modellen skriver ibland ogiltig JSON (se rattstavningApi.ts). Ett nytt
  // försök är billigt; personen slipper ett fel hen inte kan påverka.
  let svar: unknown
  try {
    svar = await callAI<unknown>('rensa-tal', { text: underlag })
  } catch (err) {
    if ((err as { kod?: string })?.kod !== 'AI_INVALID_RESPONSE') throw err
    svar = await callAI<unknown>('rensa-tal', { text: underlag })
  }
  const rensad = (svar as { rensning?: { rensad?: unknown } })?.rensning?.rensad
  if (typeof rensad !== 'string' || !rensad.trim()) {
    throw new Error('Svaret gick inte att läsa. Försök igen om en stund.')
  }
  return rensad.trim()
}
