/**
 * moteskadens — RM3. Individuellt möte minst var 14:e kalenderdag och fysiskt
 * möte minst var fjärde vecka (Rusta och matcha, FFU §4.1.1; samma rytm duger
 * för kommunens konsulenter under aktivitetskravet). Byggstenarna finns i
 * `consultant_meetings`; det här är bara bevakningen — ingen skrivväg.
 *
 * Bara GENOMFÖRDA möten räknas (`status = 'completed'`, se consultantService
 * `Meeting.status`). Ett inbokat möte i framtiden bryter inte kadensen förrän det
 * hållits, och ett avbokat räknas inte alls.
 *
 * Datum räknas i lokal tid utan `toISOString()` — samma fälla som
 * `generateRecurringEvents()` gick i (aktivitetSchema.ts).
 */

import { supabase } from '@/lib/supabase'

export const MOTE_GRANS_DAGAR = 14
export const FYSISKT_GRANS_DAGAR = 28
/** "Snart" = så här många dagar före gränsen börjar vi flagga. */
export const SNART_DAGAR = 3

export type MoteTyp = 'video' | 'phone' | 'physical'
export type KadensLage = 'ok' | 'snart' | 'over' | 'inget'

export interface MoteRad {
  participant_id: string
  scheduled_at: string
  meeting_type: MoteTyp
  status: 'scheduled' | 'completed' | 'cancelled'
}

export interface Kadens {
  /** Dagar sedan senaste genomförda möte (vilken typ som helst), null = inget. */
  dagarSedanMote: number | null
  /** Hela veckor sedan senaste genomförda fysiska möte, null = inget fysiskt. */
  veckorSedanFysiskt: number | null
  /** Dagar sedan senaste fysiska — för läget och testerna. */
  dagarSedanFysiskt: number | null
  laget: KadensLage
}

function lokalMidnatt(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** Hela kalenderdagar mellan ett tidsstämpel-datum och `idag`, lokal tid. */
export function dagarSedan(iso: string, idag: Date): number {
  const d = new Date(iso)
  return Math.floor((lokalMidnatt(idag) - lokalMidnatt(d)) / 86_400_000)
}

function lage(dagar: number | null, grans: number): KadensLage {
  if (dagar === null) return 'inget'
  if (dagar > grans) return 'over'
  if (dagar >= grans - SNART_DAGAR) return 'snart'
  return 'ok'
}

const RANG: Record<KadensLage, number> = { ok: 0, inget: 1, snart: 2, over: 3 }

/** Kadens för EN deltagares möten. */
export function kadensForMoten(moten: readonly MoteRad[], idag: Date): Kadens {
  const klara = moten.filter((m) => m.status === 'completed' && new Date(m.scheduled_at).getTime() <= idag.getTime())
  let senaste: number | null = null
  let senasteFysiskt: number | null = null
  for (const m of klara) {
    const d = dagarSedan(m.scheduled_at, idag)
    if (senaste === null || d < senaste) senaste = d
    if (m.meeting_type === 'physical' && (senasteFysiskt === null || d < senasteFysiskt)) senasteFysiskt = d
  }
  const lageMote = lage(senaste, MOTE_GRANS_DAGAR)
  const lageFysiskt = lage(senasteFysiskt, FYSISKT_GRANS_DAGAR)
  // Inget möte alls → 'inget'. Finns möten men inget fysiskt räknas det som
  // 'over' för fysiskt-kravet så fort första fönstret passerat räknat från
  // senaste mötet — enklare regel: det värsta av de två lägena vinner, där
  // "inget fysiskt" med ett genomfört möte behandlas som 'snart' (flagga, inte larm).
  const fysisktLage: KadensLage = senaste !== null && senasteFysiskt === null ? 'snart' : lageFysiskt
  const laget: KadensLage = senaste === null ? 'inget' : (RANG[fysisktLage] > RANG[lageMote] ? fysisktLage : lageMote)
  return {
    dagarSedanMote: senaste,
    veckorSedanFysiskt: senasteFysiskt === null ? null : Math.floor(senasteFysiskt / 7),
    dagarSedanFysiskt: senasteFysiskt,
    laget,
  }
}

/** Kadens per deltagare ur en platt lista av möten. */
export function kadens(moten: readonly MoteRad[], idag: Date): Map<string, Kadens> {
  const perDeltagare = new Map<string, MoteRad[]>()
  for (const m of moten) {
    const list = perDeltagare.get(m.participant_id) ?? []
    list.push(m)
    perDeltagare.set(m.participant_id, list)
  }
  const ut = new Map<string, Kadens>()
  for (const [id, list] of perDeltagare) ut.set(id, kadensForMoten(list, idag))
  return ut
}

/** Kort text för chipen. `null`-fri: säger "Inget möte än" i stället för 0. */
export function kadensText(k: Kadens | undefined): string {
  if (!k || k.dagarSedanMote === null) return 'Inget möte än'
  const mote = k.dagarSedanMote === 0 ? 'möte i dag' : k.dagarSedanMote === 1 ? 'möte i går' : `möte ${k.dagarSedanMote} dagar sedan`
  const fys = k.dagarSedanFysiskt === null
    ? 'inget fysiskt än'
    : k.veckorSedanFysiskt === 0
      ? 'fysiskt denna vecka'
      : `fysiskt ${k.veckorSedanFysiskt} v sedan`
  return `Senaste ${mote} · ${fys}`
}

/**
 * Alla möten hos den inloggade konsulenten de senaste 90 dagarna, plus
 * inbokade framåt (de påverkar inte kadensen förrän genomförda, men
 * hämtas för att slippa en andra fråga senare). Kastar vid fel.
 */
export async function hamtaMotenForKonsulent(idag: Date = new Date()): Promise<MoteRad[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Inte inloggad')
  const fran = new Date(idag)
  fran.setDate(fran.getDate() - 90)
  const { data, error } = await supabase
    .from('consultant_meetings')
    .select('participant_id, scheduled_at, meeting_type, status')
    .eq('consultant_id', user.id)
    .gte('scheduled_at', fran.toISOString())
    .order('scheduled_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as MoteRad[]
}
