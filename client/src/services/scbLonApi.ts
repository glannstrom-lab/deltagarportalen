/**
 * MK2 (spår KF, 2026-10-18): lön per yrkesgrupp ur SCB:s lönestrukturstatistik,
 * via edge-funktionen `scb-lon` (SCB står inte i portalens CSP, och svaren cachas där).
 *
 * Strikt tolkning: ett värde som inte är ett tal blir null och visas som "SCB
 * redovisar ingen lön", aldrig som 0. Samma regel som afPrognosApi.
 */
import { supabase } from '@/lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export interface Lon {
  ssyk: string
  median: number | null
  p10: number | null
  p25: number | null
  p75: number | null
  p90: number | null
}

export interface LonSvar {
  ar: string | null
  rader: Map<string, Lon>
}

const talEllerNull = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null)

export function tolkaLonSvar(body: unknown): LonSvar {
  const b = (body && typeof body === 'object' ? body : {}) as { ar?: unknown; rader?: unknown }
  const rader = new Map<string, Lon>()
  for (const r of Array.isArray(b.rader) ? b.rader : []) {
    const x = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>
    if (typeof x.ssyk !== 'string' || !/^\d{4}$/.test(x.ssyk)) continue
    rader.set(x.ssyk, { ssyk: x.ssyk, median: talEllerNull(x.median), p10: talEllerNull(x.p10), p25: talEllerNull(x.p25), p75: talEllerNull(x.p75), p90: talEllerNull(x.p90) })
  }
  return { ar: typeof b.ar === 'string' && /^\d{4}$/.test(b.ar) ? b.ar : null, rader }
}

/** Hämtar lön för upp till åtta SSYK-koder. Kastar vid fel. */
export async function hamtaLon(ssyk: readonly string[]): Promise<LonSvar> {
  const koder = [...new Set(ssyk.filter((k) => /^\d{4}$/.test(k)))].slice(0, 8)
  if (koder.length === 0) return { ar: null, rader: new Map() }
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || SUPABASE_ANON_KEY
  const res = await fetch(`${SUPABASE_URL}/functions/v1/scb-lon?ssyk=${koder.join(',')}`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
  })
  let body: unknown = null
  try { body = await res.json() } catch { body = null }
  if (!res.ok) throw new Error(`scb-lon svarade ${res.status}`)
  return tolkaLonSvar(body)
}
