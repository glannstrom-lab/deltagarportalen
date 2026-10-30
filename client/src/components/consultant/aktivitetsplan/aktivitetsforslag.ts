/**
 * AIX21 — Aktivitetsförslag ur kommunens egen katalog.
 *
 * Konsulenten skriver deltagarens mål; AI:n föreslår tre till fyra poster ur
 * ORGANISATIONENS katalog (`activity_catalog_items`), med en motivering. Tre lås:
 *
 *   1. Modellen får katalogens poster under korta alias (a1, a2 …) och får bara
 *      svara med dem. Servern (`_prompts/_aktivitetsforslag.js`) förkastar varje
 *      okänt id; här görs det en gång till, så att en aktivitet som inte finns i
 *      katalogen aldrig kan nå gränssnittet.
 *   2. Bara aktiva poster skickas — en avstängd aktivitet ska inte föreslås.
 *   3. Inget skapas av AI:n. Ett förslag fyller i dialogen "Lägg till pass"
 *      (`forslagTillPass`) och konsulenten sparar själv.
 *
 * Målet är konsulentens egen text och går genom `callAI` (PII-sanering).
 */

import { callAI } from '@/services/aiApi'
import type { CatalogItem } from '@/services/aktivitetskatalogApi'
import { formatLocalDate, type PassTyp } from '@/services/aktivitetSchema'
import { AKTIVITETSTYP_ETIKETT, VECKODAG_LANG } from '../aktivitetEtiketter'

/** Samma tak som servern. */
export const KATALOG_MAX_POSTER = 60
export const MAL_MAX_TECKEN = 800

export interface Aktivitetsforslag {
  post: CatalogItem
  motivering: string
}

interface KatalogRad {
  id: string
  namn: string
  typ: string
  plats: string
  tid: string
}

function tidText(p: CatalogItem): string {
  const dag = p.weekday ? VECKODAG_LANG[p.weekday] ?? '' : ''
  const klockslag = p.start_time && p.end_time ? `${p.start_time}–${p.end_time}` : p.start_time ?? ''
  return [dag, klockslag].filter(Boolean).join(' ')
}

/** Aliasen → posterna. a1 = första aktiva posten. Ordningen är den som skickas. */
export function aliasPoster(poster: readonly CatalogItem[]): Array<{ alias: string; post: CatalogItem }> {
  return poster
    .filter((p) => p.is_active)
    .slice(0, KATALOG_MAX_POSTER)
    .map((post, i) => ({ alias: `a${i + 1}`, post }))
}

function tillKatalogRad({ alias, post }: { alias: string; post: CatalogItem }): KatalogRad {
  return {
    id: alias,
    namn: post.title,
    typ: AKTIVITETSTYP_ETIKETT[post.activity_type] ?? '',
    plats: post.location ?? '',
    tid: tidText(post),
  }
}

/**
 * Ber om förslag. Tom lista = inget i katalogen passar tydligt. Kastar vid fel i
 * anropet, och när det inte finns något att välja bland.
 */
export async function foreslaAktiviteter(mal: string, poster: readonly CatalogItem[]): Promise<Aktivitetsforslag[]> {
  const underlag = mal.trim().slice(0, MAL_MAX_TECKEN)
  if (!underlag) throw new Error('Skriv först deltagarens mål.')
  const alias = aliasPoster(poster)
  if (alias.length === 0) throw new Error('Katalogen har inga aktiva aktiviteter att välja bland.')
  const data = { mal: underlag, katalog: alias.map(tillKatalogRad) }

  // Modellen skriver ibland ogiltig JSON (mätt i prod 2026-10-30): ett nytt försök är billigt.
  let svar: unknown
  try {
    svar = await callAI<unknown>('konsulent-aktivitetsforslag', data)
  } catch (err) {
    if ((err as { kod?: string })?.kod !== 'AI_INVALID_RESPONSE') throw err
    svar = await callAI<unknown>('konsulent-aktivitetsforslag', data)
  }
  const lista = (svar as { aktivitetsforslag?: { forslag?: unknown } })?.aktivitetsforslag?.forslag
  if (!Array.isArray(lista)) throw new Error('Svaret gick inte att läsa. Försök igen om en stund.')

  const perAlias = new Map(alias.map((a) => [a.alias, a.post]))
  const ut: Aktivitetsforslag[] = []
  const sedda = new Set<string>()
  for (const rad of lista) {
    const r = rad as { id?: unknown; motivering?: unknown }
    if (typeof r?.id !== 'string' || typeof r.motivering !== 'string' || !r.motivering.trim()) continue
    const post = perAlias.get(r.id)
    if (!post || sedda.has(r.id)) continue // okänt id: släpps
    sedda.add(r.id)
    ut.push({ post, motivering: r.motivering.trim() })
    if (ut.length >= 4) break
  }
  return ut
}

/** Nästa datum (från och med `franDatum`, `YYYY-MM-DD`) som faller på ISO-veckodagen `veckodag` (1–7). */
export function naestaDatumForVeckodag(franDatum: string, veckodag: number): string {
  const [y, m, d] = franDatum.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const iso = ((start.getDay() + 6) % 7) + 1
  start.setDate(start.getDate() + ((veckodag - iso + 7) % 7))
  return formatLocalDate(start)
}

export interface PassForslag {
  date?: string
  start_time?: string
  end_time?: string
  title: string
  activity_type: PassTyp
  location: string
}

/** Det ett förslag fyller i i "Lägg till pass". Saknar posten dag eller tid lämnas de fälten orörda. */
export function forslagTillPass(post: CatalogItem, franDatum: string): PassForslag {
  return {
    ...(post.weekday ? { date: naestaDatumForVeckodag(franDatum, post.weekday) } : {}),
    ...(post.start_time && post.end_time ? { start_time: post.start_time, end_time: post.end_time } : {}),
    title: post.title,
    activity_type: post.activity_type,
    location: post.location ?? '',
  }
}
