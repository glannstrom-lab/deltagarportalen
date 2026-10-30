/**
 * AIX4 — Intervjuberättelse av egna minnen.
 *
 * Personen skriver en händelse, svarar på EN följdfråga i taget, och får en
 * berättelse i STAR-form som bara består av det hon själv har sagt. Servern
 * (`intervju-berattelse` i `client/api/ai.js`) stryker varje steg som inte står
 * ordagrant i hennes text; klienten bygger därför aldrig om eller kompletterar
 * något — den visar det servern lämnat.
 *
 * Berättelserna sparas bara i webbläsaren (som övningsutkastet i
 * `interviewService.ts`): det är personens egna minnen, och en tabell för dem
 * vore en migration och ett beslut om gallring som ingen har tagit.
 */

import { callAI } from '@/services/aiApi'

export const STAR_STEG = ['situation', 'uppgift', 'handling', 'resultat'] as const
export type StarSteg = (typeof STAR_STEG)[number]

export type StarStegText = Record<StarSteg, string | null>

export interface BerattelseSvar {
  steg?: StarSteg
  text: string
}

export interface BerattelseResultat {
  steg: StarStegText
  /** Steg modellen påstod men som inte stod i personens text, och som därför ströks. */
  struket: StarSteg[]
  fragaSteg: StarSteg | null
  fraga: string | null
  sammanstallning: string | null
  kalla: 'ai' | 'egna-ord' | null
}

export const HANDELSE_MAX = 1500
export const SVAR_MAX = 500

function arSteg(v: unknown): v is StarSteg {
  return typeof v === 'string' && (STAR_STEG as readonly string[]).includes(v)
}

/** Läser servern svar defensivt — formen är vår, men en gammal cache eller ett fel ska inte krascha. */
export function tolkaBerattelse(raw: unknown): BerattelseResultat | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const s = (r.steg && typeof r.steg === 'object' ? r.steg : {}) as Record<string, unknown>
  const steg = {} as StarStegText
  for (const k of STAR_STEG) steg[k] = typeof s[k] === 'string' && s[k] ? (s[k] as string) : null
  return {
    steg,
    struket: Array.isArray(r.struket) ? r.struket.filter(arSteg) : [],
    fragaSteg: arSteg(r.fragaSteg) ? r.fragaSteg : null,
    fraga: typeof r.fraga === 'string' && r.fraga.trim() ? r.fraga.trim() : null,
    sammanstallning: typeof r.sammanstallning === 'string' && r.sammanstallning.trim() ? r.sammanstallning.trim() : null,
    kalla: r.kalla === 'ai' || r.kalla === 'egna-ord' ? r.kalla : null,
  }
}

export async function byggBerattelse(handelse: string, svar: BerattelseSvar[]): Promise<BerattelseResultat> {
  const data = await callAI<{ berattelse?: unknown }>('intervju-berattelse', {
    handelse: handelse.slice(0, HANDELSE_MAX),
    svar: svar.map((s) => ({ steg: s.steg, text: s.text.slice(0, SVAR_MAX) })),
  })
  const tolkad = tolkaBerattelse((data as { berattelse?: unknown })?.berattelse)
  if (!tolkad) throw new Error('Berättelsesvaret saknade form')
  return tolkad
}

// ---------------------------------------------------------------
// Sparade berättelser (webbläsaren)
// ---------------------------------------------------------------

export interface SparadBerattelse {
  id: string
  steg: StarStegText
  sammanstallning: string | null
  sparadVid: string
}

const NYCKEL = 'interview_berattelser'
const MAX_SPARADE = 5

export function lasBerattelser(): SparadBerattelse[] {
  try {
    const rå = localStorage.getItem(NYCKEL)
    if (!rå) return []
    const lista = JSON.parse(rå) as unknown
    if (!Array.isArray(lista)) return []
    return lista.filter((b): b is SparadBerattelse => !!b && typeof b === 'object' && typeof (b as SparadBerattelse).id === 'string')
  } catch {
    return []
  }
}

export function sparaBerattelse(r: BerattelseResultat): SparadBerattelse[] {
  const ny: SparadBerattelse = {
    id: `b${Date.now().toString(36)}`,
    steg: r.steg,
    sammanstallning: r.sammanstallning,
    sparadVid: new Date().toISOString(),
  }
  const lista = [ny, ...lasBerattelser()].slice(0, MAX_SPARADE)
  try {
    localStorage.setItem(NYCKEL, JSON.stringify(lista))
  } catch {
    // Full disk eller privat läge: berättelsen finns kvar i vyn, bara inte till nästa gång.
  }
  return lista
}

export function raderaBerattelse(id: string): SparadBerattelse[] {
  const lista = lasBerattelser().filter((b) => b.id !== id)
  try {
    localStorage.setItem(NYCKEL, JSON.stringify(lista))
  } catch {
    // Se ovan.
  }
  return lista
}

/** Artikeln om STAR-metoden i kunskapsbanken. Slugen vaktas mot artikelkorpusen i testet. */
export const STAR_ARTIKEL_SLUG = 'kompetensbaserad-intervju-star-metoden'
