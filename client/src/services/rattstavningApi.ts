/**
 * AIX27 — Skrivstöd: rättstavning.
 *
 * Modellen returnerar en LISTA över små ändringar (före → efter), aldrig en
 * omskriven text. Servern (`client/api/_prompts/_rattstavning.js`) har redan
 * kastat allt som lägger till nya ord av betydelse eller nya siffror, och
 * avvisar för stora listor. Här tillämpas bara de ändringar personen godkänt,
 * och bara där biten finns exakt en gång i texten som den ser ut NU — har
 * personen hunnit skriva om stycket hoppas ändringen över i stället för att
 * gissas fram.
 *
 * Går genom `callAI`: PII-sanering, AI-av-brytaren och dagstaket gäller.
 */

import { callAI } from '@/services/aiApi'

export interface Rattning {
  fore: string
  efter: string
}

/** Samma tak som servern — mer skickas inte. */
export const RATTSTAVNING_MAX_TECKEN = 4000

function arRattning(v: unknown): v is Rattning {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return typeof o.fore === 'string' && typeof o.efter === 'string' && o.fore.length > 0
}

/** Ber om förslag. Tom lista = inget att rätta. Kastar vid fel i anropet. */
export async function foreslaRattningar(text: string): Promise<Rattning[]> {
  const underlag = text.slice(0, RATTSTAVNING_MAX_TECKEN)
  if (!underlag.trim()) return []
  const svar = await callAI<unknown>('ratta-stavning', { text: underlag })
  const rattning = (svar as { rattning?: { andringar?: unknown } }).rattning
  if (!rattning || !Array.isArray(rattning.andringar)) {
    throw new Error('Svaret gick inte att läsa. Försök igen om en stund.')
  }
  return rattning.andringar.filter(arRattning)
}

function antalForekomster(text: string, bit: string): number {
  let n = 0
  let pos = 0
  while ((pos = text.indexOf(bit, pos)) !== -1) {
    n++
    pos += Math.max(1, bit.length)
  }
  return n
}

/**
 * Tillämpar de godkända ändringarna. En ändring hoppas över om biten inte
 * längre finns på exakt ett ställe, eller om den överlappar en annan ändring.
 * Allt annat i texten lämnas orört, tecken för tecken.
 */
export function tillampaRattningar(
  text: string,
  godkanda: Rattning[],
): { text: string; tillampade: number; overhoppade: number } {
  const platser: Array<{ start: number; slut: number; efter: string }> = []
  let overhoppade = 0
  for (const r of godkanda) {
    if (!arRattning(r) || r.fore === r.efter || antalForekomster(text, r.fore) !== 1) {
      overhoppade++
      continue
    }
    const start = text.indexOf(r.fore)
    const slut = start + r.fore.length
    if (platser.some((p) => start < p.slut && slut > p.start)) {
      overhoppade++
      continue
    }
    platser.push({ start, slut, efter: r.efter })
  }
  let ut = text
  for (const p of [...platser].sort((a, b) => b.start - a.start)) {
    ut = ut.slice(0, p.start) + p.efter + ut.slice(p.slut)
  }
  return { text: ut, tillampade: platser.length, overhoppade }
}
