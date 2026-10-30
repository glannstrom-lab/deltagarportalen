/**
 * Språkstöd i AI-teamets orbit: Förklara myndighetsbrevet (AIX24) och
 * Gör det mindre (AIX29).
 *
 * Båda går genom `callAI`, så PII-sanering, AI-av-brytaren (profilens och
 * organisationens) och dagstaket gäller. Servern bor i
 * `client/api/_prompts/sprak.js`; ärlighetskontrollerna i
 * `_prompts/_sprakvalidering.js`.
 */

import { callAI } from '@/services/aiApi'

/** Samma tak som servern läser. */
export const BREV_MAX_TECKEN = 4000
export const UPPGIFT_MAX_TECKEN = 300

// ============================================
// AIX24 — Förklara myndighetsbrevet
// ============================================

export interface BrevForklaring {
  avsandare: string
  vad: string
  gor: Array<{ steg: string; citat: string }>
  senast: Array<{ sak: string; datum: string; citat: string }>
  vem: Array<{ namn: string; kontakt: string; citat: string }>
}

/** Läkarintyg och annan vårdtext skickas inte vidare till modellen. */
export class BrevAvvisatError extends Error {
  constructor() {
    super('Det här ser ut som ett läkarintyg eller en journaltext. Den sortens text läser vi inte här.')
    this.name = 'BrevAvvisatError'
  }
}

function arForklaring(v: unknown): v is BrevForklaring {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return typeof o.vad === 'string' && Array.isArray(o.gor) && Array.isArray(o.senast) && Array.isArray(o.vem)
}

export async function forklaraBrev(brev: string): Promise<BrevForklaring> {
  const text = brev.trim().slice(0, BREV_MAX_TECKEN)
  if (!text) throw new Error('Klistra in texten från brevet först.')
  const svar = await callAI<BrevForklaring>('myndighetsbrev', { brev: text })
  const f = (svar as { forklaring?: unknown }).forklaring
  if (f && typeof f === 'object' && (f as { avvisad?: unknown }).avvisad) throw new BrevAvvisatError()
  if (!arForklaring(f)) throw new Error('Svaret gick inte att läsa. Försök igen om en stund.')
  return f
}

// ============================================
// AIX29 — Gör det mindre
// ============================================

export async function delaUppgift(uppgift: string): Promise<string[]> {
  const text = uppgift.trim().slice(0, UPPGIFT_MAX_TECKEN)
  if (!text) throw new Error('Skriv vad du behöver göra först.')
  const svar = await callAI<string[]>('gor-mindre', { uppgift: text })
  const plan = (svar as { plan?: unknown }).plan as { steg?: unknown } | undefined
  const steg = Array.isArray(plan?.steg) ? plan.steg.filter((s): s is string => typeof s === 'string' && s.trim().length > 0) : []
  if (steg.length < 2) throw new Error('Svaret gick inte att läsa. Försök igen om en stund.')
  return steg.slice(0, 5)
}
