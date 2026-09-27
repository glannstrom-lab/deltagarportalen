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
 * den borttagna `generateRecurringEvents()` gick i (aktivitetSchema.ts).
 */

import { supabase } from '@/lib/supabase'

export const MOTE_GRANS_DAGAR = 14
export const FYSISKT_GRANS_DAGAR = 28
/** "Snart" = så här många dagar före gränsen börjar vi flagga. */
export const SNART_DAGAR = 3

/**
 * RR11/RR23 (rollspelet 2026-09-27): regeln i klartext, för chipens tooltip
 * och mötesrutan på deltagarsidan. Coachen trodde att kravet var "var fjärde
 * vecka" och förstod inte varför chipet var gult efter 12 dagar.
 */
export const KADENS_REGEL = `Individuellt möte minst var ${MOTE_GRANS_DAGAR}:e dag och fysiskt möte minst var ${FYSISKT_GRANS_DAGAR}:e dag (RM3). Bara genomförda möten räknas.`

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
  /**
   * RR11: närmaste inbokade möte framåt (status `scheduled`). Påverkar inte
   * läget — ett möte räknas först när det hållits — men chipet ska visa att
   * saken är omhändertagen. `null` = inget bokat.
   */
  bokat: Pick<MoteRad, 'scheduled_at' | 'meeting_type'> | null
  /** Närmaste inbokade FYSISKA möte framåt, `null` = inget. */
  bokatFysiskt: Pick<MoteRad, 'scheduled_at' | 'meeting_type'> | null
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
  const framtida = moten
    .filter((m) => m.status === 'scheduled' && new Date(m.scheduled_at).getTime() > idag.getTime())
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
  const forsta = framtida[0]
  const forstaFysiska = framtida.find((m) => m.meeting_type === 'physical')
  return {
    dagarSedanMote: senaste,
    veckorSedanFysiskt: senasteFysiskt === null ? null : Math.floor(senasteFysiskt / 7),
    dagarSedanFysiskt: senasteFysiskt,
    laget,
    bokat: forsta ? { scheduled_at: forsta.scheduled_at, meeting_type: forsta.meeting_type } : null,
    bokatFysiskt: forstaFysiska ? { scheduled_at: forstaFysiska.scheduled_at, meeting_type: forstaFysiska.meeting_type } : null,
  }
}

/**
 * RR11: vilken mötestyp bokningsdialogen ska föreslå. Nästa individuella möte
 * ska hållas inom 14 dagar; har det inte varit ett fysiskt möte på 14 dagar
 * måste just det mötet vara fysiskt för att 28-dagarsgränsen ska hålla. Är ett
 * fysiskt möte redan bokat behövs inget nytt. Utan underlag (ingen kadens
 * hämtad) föreslås fysiskt — det är det kravet som kostar att missa.
 */
export function forvaldMotestyp(k: Kadens | undefined): MoteTyp {
  if (!k) return 'physical'
  if (k.bokatFysiskt) return 'video'
  if (k.dagarSedanFysiskt === null) return 'physical'
  return k.dagarSedanFysiskt > FYSISKT_GRANS_DAGAR - MOTE_GRANS_DAGAR ? 'physical' : 'video'
}

const MOTESTYP_KORT: Record<MoteTyp, string> = { physical: 'fysiskt möte', video: 'videomöte', phone: 'telefonmöte' }

function kortDag(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

/** "fysiskt möte bokat 30/9" — eller `null` när inget är bokat. */
export function bokatText(k: Kadens | undefined): string | null {
  const b = k?.bokatFysiskt ?? k?.bokat ?? null
  if (!b) return null
  return `${MOTESTYP_KORT[b.meeting_type]} bokat ${kortDag(b.scheduled_at)}`
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
  if (!k || k.dagarSedanMote === null) {
    const bokat = bokatText(k)
    return bokat ? `Inget möte än · ${bokat}` : 'Inget möte än'
  }
  const mote = k.dagarSedanMote === 0 ? 'möte i dag' : k.dagarSedanMote === 1 ? 'möte i går' : `möte ${k.dagarSedanMote} dagar sedan`
  const fys = k.dagarSedanFysiskt === null
    ? 'inget fysiskt än'
    : k.veckorSedanFysiskt === 0
      ? 'fysiskt denna vecka'
      : `fysiskt ${k.veckorSedanFysiskt} v sedan`
  const bokat = bokatText(k)
  return `Senaste ${mote} · ${fys}${bokat ? ` · ${bokat}` : ''}`
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

/** En deltagares möte som det visas och bekräftas på deltagarsidan. */
export interface DeltagarMote extends MoteRad {
  id: string
  duration_minutes: number | null
  location: string | null
}

/**
 * RR11: den inloggade konsulentens möten med EN deltagare, senaste 180 dagarna
 * och alla framåt. Kastar vid fel — anroparen visar felet, aldrig "inga möten".
 */
export async function hamtaMotenForDeltagare(participantId: string, idag: Date = new Date()): Promise<DeltagarMote[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Inte inloggad')
  const fran = new Date(idag)
  fran.setDate(fran.getDate() - 180)
  const { data, error } = await supabase
    .from('consultant_meetings')
    .select('id, participant_id, scheduled_at, meeting_type, status, duration_minutes, location')
    .eq('consultant_id', user.id)
    .eq('participant_id', participantId)
    .gte('scheduled_at', fran.toISOString())
    .order('scheduled_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as DeltagarMote[]
}

/**
 * RR11: ett inbokat möte vars tid passerat och som ingen bekräftat. Utan
 * bekräftelse räknas det aldrig mot kadensen — det var därför chipet stod
 * still: portalen hade ingen väg att markera ett möte som hållet.
 */
export function vantarPaBekraftelse(m: Pick<MoteRad, 'status' | 'scheduled_at'>, idag: Date = new Date()): boolean {
  return m.status === 'scheduled' && new Date(m.scheduled_at).getTime() <= idag.getTime()
}

/** Markerar ett möte som hållet eller inte av. RLS begränsar till egna möten. */
export async function bekraftaMote(meetingId: string, status: 'completed' | 'cancelled'): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Inte inloggad')
  const { data, error } = await supabase
    .from('consultant_meetings')
    .update({ status })
    .eq('id', meetingId)
    .eq('consultant_id', user.id)
    .select('id')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('Mötet kunde inte uppdateras — det finns inte längre, eller så saknas behörighet.')
}

/**
 * RR8: den inloggade konsulentens möten i en period (alla deltagare), för
 * underlaget till den periodiska rapporten. `to` är inklusive (hela dagen).
 * Kastar vid fel.
 */
export async function hamtaMotenIPeriod(from: string, to: string): Promise<MoteRad[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Inte inloggad')
  const [fa, fm, fd] = from.split('-').map(Number)
  const [ta, tm, td] = to.split('-').map(Number)
  const { data, error } = await supabase
    .from('consultant_meetings')
    .select('participant_id, scheduled_at, meeting_type, status')
    .eq('consultant_id', user.id)
    .gte('scheduled_at', new Date(fa, fm - 1, fd).toISOString())
    .lt('scheduled_at', new Date(ta, tm - 1, td + 1).toISOString())
    .order('scheduled_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as MoteRad[]
}

// ---------------------------------------------------------------------------
// RK31 (rollspelet 2026-09-27): varningar när ett möte bokas
// ---------------------------------------------------------------------------
//
// Boka möte lät konsulenten välja en lördag utan ett ord, och sa ingenting
// när mötet låg mitt i deltagarens jobbsökarverkstad. Varningar — inte spärrar:
// ett möte på en lördag kan vara avtalat, och ett pass kan ha ställts in.

export interface PassTid {
  start_time: string
  end_time: string
  title: string
}

function minuter(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Pass som överlappar mötet `tid` + `langdMin` samma dag. Kant i kant är ingen krock. */
export function krockandePass<T extends PassTid>(pass: readonly T[], tid: string, langdMin: number): T[] {
  const start = minuter(tid)
  const slut = start + langdMin
  return pass.filter((p) => minuter(p.start_time) < slut && start < minuter(p.end_time))
}

/** Varningstexter för ett möte en viss dag (`datum` i lokal tid, JS-veckodag 0 = söndag). */
export function motesVarningar(indata: { veckodag: number; tid: string | null; langdMin: number; pass: readonly PassTid[] }): string[] {
  const ut: string[] = []
  if (indata.veckodag === 6 || indata.veckodag === 0) {
    ut.push(`${indata.veckodag === 6 ? 'Lördag' : 'Söndag'} — stämmer dagen? Mötet bokas ändå om du fortsätter.`)
  }
  if (indata.tid) {
    for (const p of krockandePass(indata.pass, indata.tid, indata.langdMin)) {
      ut.push(`Krockar med deltagarens pass ${p.title} ${p.start_time}–${p.end_time}.`)
    }
  }
  return ut
}
