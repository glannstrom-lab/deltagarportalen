/**
 * afPrognosApi — Arbetsförmedlingens Yrkesbarometer via edge-funktionen
 * `af-prognos` (MK3, 2026-09-12).
 *
 * Källan är öppna data (CC0): 219 yrken × riket + 21 län, publicerad två
 * gånger om året. Vi visar AF:s egna bedömningar och texter ordagrant —
 * `jobbmojligheter` (små/medelstora/stora), `rekryteringssituation`
 * (överskott/balans/paradox/brist), `prognos` på fem års sikt (öka/vara
 * oförändrad/minska) — och räknar aldrig fram egna procent eller poäng.
 * Saknas yrket är svaret en tom lista, inte en gissning.
 *
 * Cache 24 h i klienten (samma rytm som edge-funktionens minnescache).
 * Fel kastas; anroparen äger lägena laddar / fel / tomt / klart.
 */

import CacheService from './cacheService'
import { supabase } from '@/lib/supabase'
import { AF_REGIONS } from '@/data/afRegions'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export type Jobbmojligheter = 'små' | 'medelstora' | 'stora'
export type Rekryteringssituation = 'överskott' | 'balans' | 'paradox' | 'brist'
export type Prognos = 'öka' | 'vara oförändrad' | 'minska'

export interface PrognosRad {
  yb_yrke: string
  yb_concept_id: string
  ssyk: string
  ssyk_text: string
  yrkesomrade: string
  yb_beskrivning: string | null
  /** SCB:s länskod, '00' = riket */
  lan: string
  jobbmojligheter: Jobbmojligheter | null
  rekryteringssituation: Rekryteringssituation | null
  paradox: string[]
  prognos: Prognos | null
  text_jobbmojligheter: string
  text_rekryteringssituation: string
  hogsta_bedomningsniva: string | null
  delvis_helt: string | null
}

export interface PrognosSvar {
  kalla: string
  licens: string
  /** T.ex. '2026-1' — AF:s omgångsbeteckning */
  omgang: string | null
  /** HTTP Last-Modified från källfilen, ISO/RFC-datum eller null */
  last_modified: string | null
  traffar: PrognosRad[]
}

export const prognosCache = new CacheService({ ttl: 24 * 60 * 60 * 1000 })

const JOBB: ReadonlySet<string> = new Set(['små', 'medelstora', 'stora'])
const REKR: ReadonlySet<string> = new Set(['överskott', 'balans', 'paradox', 'brist'])
const PROG: ReadonlySet<string> = new Set(['öka', 'vara oförändrad', 'minska'])

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}
function enumEllerNull<T extends string>(v: unknown, set: ReadonlySet<string>): T | null {
  return typeof v === 'string' && set.has(v) ? (v as T) : null
}

/**
 * Ren tolkning av edge-svaret. Kastar om formen inte stämmer — ett svar vi inte
 * förstår ska inte renderas som "ingen prognos".
 */
export function tolkaPrognosSvar(json: unknown): PrognosSvar {
  if (!json || typeof json !== 'object') throw new Error('Ogiltigt svar från af-prognos')
  const o = json as Record<string, unknown>
  if (typeof o.error === 'string') throw new Error(o.error)
  if (!Array.isArray(o.traffar)) throw new Error('af-prognos: traffar saknas')
  const traffar: PrognosRad[] = o.traffar.map((r) => {
    const x = (r ?? {}) as Record<string, unknown>
    if (!str(x.yb_yrke) || !str(x.lan)) throw new Error('af-prognos: rad utan yrke eller län')
    return {
      yb_yrke: str(x.yb_yrke),
      yb_concept_id: str(x.yb_concept_id),
      ssyk: str(x.ssyk),
      ssyk_text: str(x.ssyk_text),
      yrkesomrade: str(x.yrkesomrade),
      yb_beskrivning: typeof x.yb_beskrivning === 'string' ? x.yb_beskrivning : null,
      lan: str(x.lan),
      jobbmojligheter: enumEllerNull<Jobbmojligheter>(x.jobbmojligheter, JOBB),
      rekryteringssituation: enumEllerNull<Rekryteringssituation>(x.rekryteringssituation, REKR),
      paradox: Array.isArray(x.paradox) ? x.paradox.filter((p): p is string => typeof p === 'string') : [],
      prognos: enumEllerNull<Prognos>(x.prognos, PROG),
      text_jobbmojligheter: str(x.text_jobbmojligheter),
      text_rekryteringssituation: str(x.text_rekryteringssituation),
      hogsta_bedomningsniva: typeof x.hogsta_bedomningsniva === 'string' ? x.hogsta_bedomningsniva : null,
      delvis_helt: typeof x.delvis_helt === 'string' ? x.delvis_helt : null,
    }
  })
  return {
    kalla: str(o.kalla),
    licens: str(o.licens),
    omgang: typeof o.omgang === 'string' ? o.omgang : null,
    last_modified: typeof o.last_modified === 'string' ? o.last_modified : null,
    traffar,
  }
}

/** Grupperar träffarna per yrke: rikets rad + länets rad (om begärd). */
export interface YrkesUtsikt {
  concept_id: string
  yrke: string
  riket: PrognosRad | null
  lan: PrognosRad | null
}
export function grupperaPerYrke(traffar: PrognosRad[], lanskod: string | null): YrkesUtsikt[] {
  const map = new Map<string, YrkesUtsikt>()
  for (const r of traffar) {
    const u = map.get(r.yb_concept_id) ?? { concept_id: r.yb_concept_id, yrke: r.yb_yrke, riket: null, lan: null }
    if (r.lan === '00') u.riket = r
    else if (lanskod && r.lan === lanskod) u.lan = r
    map.set(r.yb_concept_id, u)
  }
  return [...map.values()]
}

/** Länsnamn ur länskoden, för visning. Riket för '00'. */
export function lansnamn(lanskod: string): string {
  if (lanskod === '00') return 'hela Sverige'
  return AF_REGIONS.find((r) => r.lanskod === lanskod)?.name ?? lanskod
}

/** Publiceringsdatum ur Last-Modified, i läsbar form — eller null om okänt. */
export function formateraPublicerad(lastModified: string | null, locale: string): string | null {
  if (!lastModified) return null
  const d = new Date(lastModified)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(locale === 'en' ? 'en-GB' : 'sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })
}

/** Hämtar utsikter för ett yrkesnamn (minst två tecken), valfritt ett län. Kastar vid fel. */
export async function sokPrognos(q: string, lanskod?: string | null): Promise<PrognosSvar> {
  const fraga = q.trim()
  if (fraga.length < 2) throw new Error('Skriv minst två tecken')
  const params = new URLSearchParams({ q: fraga })
  if (lanskod && lanskod !== '00') params.set('lan', lanskod)
  const nyckel = `af-prognos:${params.toString()}`
  const cached = prognosCache.get<PrognosSvar>(nyckel)
  if (cached) return cached

  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || SUPABASE_ANON_KEY
  const res = await fetch(`${SUPABASE_URL}/functions/v1/af-prognos?${params.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
  })
  let body: unknown = null
  try { body = await res.json() } catch { body = null }
  if (!res.ok) {
    const msg = body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string'
      ? (body as { error: string }).error
      : `af-prognos svarade ${res.status}`
    throw new Error(msg)
  }
  const svar = tolkaPrognosSvar(body)
  prognosCache.set(nyckel, svar)
  return svar
}
