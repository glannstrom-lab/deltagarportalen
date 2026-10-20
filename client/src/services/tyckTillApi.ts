import { supabase } from '@/lib/supabase'
import type { TyckTillTyp } from '@/stores/tyckTillStore'

export interface TyckTillInskick {
  typ: TyckTillTyp
  meddelande: string
  farKontakta: boolean
  sida: string
  sprak: string
  klientfel: string[]
}

export type TyckTillSvar = { ok: true } | { ok: false; fel: 'inloggning' | 'forManga' | 'okant' }

/**
 * Skickar till /api/tyck-till. Servern sätter användare och roll ur den
 * verifierade sessionen — klienten skickar aldrig sitt eget user_id.
 */
export async function skickaTyckTill(inskick: TyckTillInskick): Promise<TyckTillSvar> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) return { ok: false, fel: 'inloggning' }
  try {
    const r = await fetch('/api/tyck-till', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(inskick),
    })
    if (r.ok) return { ok: true }
    if (r.status === 401) return { ok: false, fel: 'inloggning' }
    if (r.status === 429) return { ok: false, fel: 'forManga' }
    return { ok: false, fel: 'okant' }
  } catch {
    return { ok: false, fel: 'okant' }
  }
}

export interface TyckTillRad {
  id: string
  typ: TyckTillTyp
  meddelande: string
  sida: string | null
  roll: string | null
  sprak: string | null
  webblasare: string | null
  klientfel: string[]
  far_kontakta: boolean
  status: 'ny' | 'last' | 'atgardad'
  mejl_skickat: boolean
  created_at: string
}

/** Superadmin: alla inskick, nyast först. RLS släpper bara in SUPERADMIN. */
export async function hamtaTyckTill(): Promise<TyckTillRad[]> {
  const { data, error } = await supabase
    .from('tyck_till')
    .select('id, typ, meddelande, sida, roll, sprak, webblasare, klientfel, far_kontakta, status, mejl_skickat, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return (data ?? []) as TyckTillRad[]
}

export async function sattTyckTillStatus(id: string, status: TyckTillRad['status']): Promise<void> {
  const { error } = await supabase.from('tyck_till').update({ status }).eq('id', id)
  if (error) throw error
}
