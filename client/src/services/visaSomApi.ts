/**
 * "Visa som" (2026-09-27) — superadmin ser portalen som ett demo- eller
 * testkonto. Vilka konton som är tillåtna avgör edge-funktionen
 * `superadmin-visa-som`; klienten visar bara det servern släpper igenom.
 *
 * Inloggningen sker med en engångs-token_hash via supabase.auth.verifyOtp på
 * sidan /visa-som. Markeringen i sessionStorage är per flik: en privat flik
 * som visar demokontot påverkar inte superadmin-fliken.
 */

import { supabase } from '@/lib/supabase'

export type VisaSomKonto = {
  id: string
  email: string
  namn: string | null
  roll: string | null
  organisation: string | null
  orgTyp: string | null
  orgRoll: string | null
  grupp: 'demo' | 'test' | 'ovrigt'
}

export type VisaSomLank = { tokenHash: string; email: string; landning: string }

export const VISA_SOM_NYCKEL = 'jobin_visa_som'

async function anropa<T>(body: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Inte inloggad')
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/superadmin-visa-som`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error || `Fel ${res.status}`)
  return json as T
}

export const visaSomApi = {
  async lista(): Promise<VisaSomKonto[]> {
    const { konton } = await anropa<{ konton: VisaSomKonto[] }>({ action: 'lista' })
    return konton
  },
  oppna(userId: string): Promise<VisaSomLank> {
    return anropa<VisaSomLank>({ action: 'oppna', userId })
  },
}

/** Bara interna sökvägar — aldrig en extern adress eller //värd. */
export function sakerLandning(till: string | null): string {
  if (!till || !till.startsWith('/') || till.startsWith('//')) return '/'
  return till
}

export function beskrivRoll(k: VisaSomKonto): string {
  if (k.orgRoll === 'arbetsgivare') return 'Företag (kontaktperson)'
  if (k.orgRoll === 'chef') return 'Chef'
  if (k.orgRoll === 'admin') return 'Administratör i organisationen'
  if (k.roll === 'CONSULTANT') return 'Konsulent'
  if (k.roll === 'ADMIN' || k.roll === 'SUPERADMIN') return 'Admin'
  return 'Deltagare'
}

/** Adressen som loggar in som kontot — öppnas i en privat flik, eller i samma. */
export function visaSomUrl(lank: VisaSomLank): string {
  const q = new URLSearchParams({ t: lank.tokenHash, e: lank.email, till: lank.landning })
  return `${window.location.origin}/#/visa-som?${q.toString()}`
}
