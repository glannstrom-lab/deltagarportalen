/**
 * AIX9 — Varför passar annonsen mig?
 *
 * Skälen rad för rad, med citat ur både annonsen och personens CV. Inget
 * procenttal någonstans: servern (`RESPONSE_VALIDATORS['annons-matchning']`,
 * `client/api/_prompts/_matchskal.js`) släpper bara igenom rader vars citat
 * står ordagrant i underlaget, och stryker allt som liknar en träffprocent.
 *
 * Går genom `callAI` (PII-sanering, AI-brytare, dagstak). CV-underlaget byggs
 * här av de strukturerade fälten och innehåller aldrig namn eller kontaktuppgifter.
 */

import { callAI } from '@/services/aiApi'
import { cvApi } from '@/services/cvApi'
import { skillNamn } from '@/utils/skillText'
import { annonsCacheNyckel, ANNONS_MAX_TECKEN, type AnnonsUnderlag } from '@/services/ansokanAiApi'
import type { CVData } from '@/types/cv'

/** Samma tak som servern (`CV_TAK` i _matchskal.js). */
export const CV_MAX_TECKEN = 6000
/** Under det här finns inget i CV:t att jämföra med. */
export const CV_MIN_TECKEN = 30

export interface MatchSkal {
  typ: 'traffar' | 'saknas'
  punkt: string
  annons: string
  /** Bara på "traffar". */
  cv?: string
}

export type Matchskal = { skal: MatchSkal[] } | { inteCv: true }

/**
 * CV:t som löpande text, en rad per sak, så att modellen kan citera ur det.
 * Skills är objekt i prod ({id,name,level,category}) — alltid via `skillNamn`.
 * Både camelCase och snake_case (`work_experience`) läses.
 */
export function byggCvUnderlag(cv: Partial<CVData> | null | undefined): string {
  if (!cv) return ''
  const rader: string[] = []
  const lagg = (etikett: string, varde: string | null | undefined) => {
    const v = (varde ?? '').toString().replace(/\s+/g, ' ').trim()
    if (v) rader.push(`${etikett}: ${v}`)
  }
  lagg('Titel', cv.title)
  lagg('Sammanfattning', cv.summary)
  const kompetenser = (cv.skills ?? []).map((s) => skillNamn(s).trim()).filter(Boolean)
  if (kompetenser.length) rader.push(`Kompetenser: ${kompetenser.join(', ')}`)
  const erfarenhet = cv.workExperience ?? cv.work_experience ?? []
  for (const e of erfarenhet) {
    lagg('Erfarenhet', [e.title, e.company].filter(Boolean).join(' på ') + (e.description ? `. ${e.description}` : ''))
  }
  for (const u of cv.education ?? []) {
    lagg('Utbildning', [u.degree, u.field, u.school].filter(Boolean).join(', '))
  }
  for (const c of cv.certificates ?? []) lagg('Certifikat', c.name)
  for (const l of cv.languages ?? []) lagg('Språk', [l.language, l.level].filter(Boolean).join(' '))
  return rader.join('\n').slice(0, CV_MAX_TECKEN)
}

function hash(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

/** Cache per annons och CV-version, bara minnet i webbläsaren (som AIX1). */
const cache = new Map<string, MatchSkal[]>()
const pagaende = new Map<string, Promise<MatchSkal[]>>()

/** Bara för test. */
export function rensaMatchskalCache(): void {
  cache.clear()
  pagaende.clear()
}

function cacheNyckel(a: Pick<AnnonsUnderlag, 'id' | 'text'>, cvText: string): string {
  return `${annonsCacheNyckel(a)}|${hash(cvText)}`
}

function arSkal(v: unknown): v is MatchSkal[] {
  return Array.isArray(v)
}

/**
 * Hämtar personens CV, bygger underlaget och ber om skälen. Saknas CV (eller
 * är det i stort sett tomt) görs inget AI-anrop: då finns inget att citera, och
 * en tom jämförelse får inte se ut som "inget passar".
 */
export async function hamtaMatchskal(a: AnnonsUnderlag): Promise<Matchskal> {
  const text = a.text.trim().slice(0, ANNONS_MAX_TECKEN)
  if (!text) throw new Error('Annonsen har ingen text att jämföra med.')

  const cvText = byggCvUnderlag(await cvApi.getCV())
  if (cvText.length < CV_MIN_TECKEN) return { inteCv: true }

  const nyckel = cacheNyckel({ id: a.id, text }, cvText)
  const finns = cache.get(nyckel)
  if (finns) return { skal: finns }
  const pagar = pagaende.get(nyckel)
  if (pagar) return { skal: await pagar }

  const lopande = (async () => {
    const svar = await callAI<MatchSkal[]>('annons-matchning', {
      annons: text,
      cvText,
      titel: a.titel ?? '',
      foretag: a.foretag ?? '',
    })
    const m = (svar as { matchning?: { skal?: unknown } }).matchning
    if (!m || !arSkal(m.skal)) throw new Error('Svaret gick inte att läsa. Försök igen om en stund.')
    cache.set(nyckel, m.skal)
    return m.skal
  })().finally(() => pagaende.delete(nyckel))
  pagaende.set(nyckel, lopande)
  return { skal: await lopande }
}
