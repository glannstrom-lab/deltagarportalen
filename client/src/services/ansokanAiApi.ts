/**
 * Ansökningsstödet i AI-teamets orbit: Förklara annonsen (AIX1), Samtalsmanus
 * för telefon (AIX6) och Uppföljningsmejl efter avslag eller tystnad (AIX5).
 *
 * Alla tre går genom `callAI` — alltså PII-sanering, AI-av-brytaren och
 * dagstaket gäller. Servern bor i `client/api/_prompts/ansokan.js`.
 */

import { callAI } from '@/services/aiApi'

// ============================================
// AIX1 — Förklara annonsen
// ============================================

export type KravTyp = 'hart' | 'onskemal' | 'oklart'

export interface AnnonsForklaring {
  uppgifter: Array<{ punkt: string; citat: string }>
  krav: Array<{ typ: KravTyp; punkt: string; citat: string }>
  ord: Array<{ ord: string; betydelse: string }>
}

export interface AnnonsUnderlag {
  /** Annonsens id hos Platsbanken. Saknas det cachas på textens innehåll. */
  id?: string
  titel?: string
  foretag?: string
  text: string
}

/** Samma tak som servern och `buildCvAdaptUrl` — mer läses inte. */
export const ANNONS_MAX_TECKEN = 3000

/** Kort, stabil nyckel av en text (djb2) — för annonser som saknar id. */
function textnyckel(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

/**
 * Cache per annons. Texten är offentlig och lika för alla, så ett svar kan
 * återanvändas under hela sessionen — det sparar ett anrop (och ett väntande
 * på ~9 tokens/s) varje gång personen öppnar samma annons igen. Cachen är
 * medvetet bara minnet i webbläsaren: en delad cache i databasen kräver en
 * migration och ett beslut om vem som får skriva i den.
 */
const cache = new Map<string, AnnonsForklaring>()
const pagaende = new Map<string, Promise<AnnonsForklaring>>()

export function annonsCacheNyckel(u: Pick<AnnonsUnderlag, 'id' | 'text'>): string {
  const text = u.text.slice(0, ANNONS_MAX_TECKEN)
  // id + textnyckel: en annons som ändrats efter publicering ger ny förklaring.
  return `${u.id ?? 'text'}:${textnyckel(text)}`
}

/** Bara för test. */
export function rensaAnnonsCache(): void {
  cache.clear()
  pagaende.clear()
}

export function lasCachadForklaring(u: Pick<AnnonsUnderlag, 'id' | 'text'>): AnnonsForklaring | null {
  return cache.get(annonsCacheNyckel(u)) ?? null
}

function arForklaring(v: unknown): v is AnnonsForklaring {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return Array.isArray(o.uppgifter) && Array.isArray(o.krav) && Array.isArray(o.ord)
}

export async function forklaraAnnons(u: AnnonsUnderlag): Promise<AnnonsForklaring> {
  const text = u.text.trim().slice(0, ANNONS_MAX_TECKEN)
  if (!text) throw new Error('Annonsen har ingen text att förklara.')

  const nyckel = annonsCacheNyckel({ id: u.id, text })
  const finns = cache.get(nyckel)
  if (finns) return finns
  const pagar = pagaende.get(nyckel)
  if (pagar) return pagar

  const lopande = (async () => {
    const svar = await callAI<AnnonsForklaring>('annons-forklaring', {
      annons: text,
      titel: u.titel ?? '',
      foretag: u.foretag ?? '',
    })
    const f = (svar as { forklaring?: unknown }).forklaring
    if (!arForklaring(f)) throw new Error('Svaret gick inte att läsa. Försök igen om en stund.')
    cache.set(nyckel, f)
    return f
  })().finally(() => pagaende.delete(nyckel))
  pagaende.set(nyckel, lopande)
  return lopande
}

// ============================================
// AIX6 — Samtalsmanus
// ============================================

export type SamtalsSyfte = 'fraga' | 'folj_upp' | 'spontan'

export interface SamtalsUnderlag {
  syfte: SamtalsSyfte
  foretag?: string
  roll?: string
  kontaktnamn?: string
  kontakttitel?: string
  /** Utdrag ur annonsen om sådan finns. Aldrig CV eller personuppgifter. */
  annons?: string
}

export async function skapaSamtalsmanus(u: SamtalsUnderlag): Promise<string> {
  const svar = await callAI<string>('samtalsmanus', { ...u })
  const manus = (svar as { manus?: unknown }).manus
  if (typeof manus !== 'string' || !manus.trim()) throw new Error('Manuset blev tomt. Försök igen om en stund.')
  return manus.trim()
}

// ============================================
// AIX5 — Uppföljningsmejl
// ============================================

export type UppfoljningOrsak = 'avslag' | 'tystnad'

export interface UppfoljningUnderlag {
  orsak: UppfoljningOrsak
  foretag?: string
  roll?: string
  kontaktnamn?: string
  /** ÅÅÅÅ-MM-DD */
  ansoktDatum?: string
  /** Räknas av koden (`dagarSedan`), aldrig av modellen. */
  dagarSedan?: number
}

export async function skapaUppfoljningsmejl(u: UppfoljningUnderlag): Promise<string> {
  const svar = await callAI<string>('uppfoljningsmejl', { ...u })
  const mejl = (svar as { mejl?: unknown }).mejl
  if (typeof mejl !== 'string' || !mejl.trim()) throw new Error('Mejlet blev tomt. Försök igen om en stund.')
  return mejl.trim()
}
