/**
 * Deltagarlistans "Läget" och veckoremsa (omtaget "Kvarter", steg 4, 2026-10-11).
 *
 * Förslagets princip "Personen är enheten" och "Ord före siffror": varje rad i
 * deltagarlistan får EN mening om hur det står till, härledd ur det datan bär —
 * planen och veckans pass (närvaro, anmäld frånvaro, incheckning). Inget annat.
 * Saknas underlaget säger meningen det; den gissar aldrig.
 *
 * Ordningen när flera saker gäller samma person (den första vinner, resten blir
 * "+N till"):
 *   1. ogiltig frånvaro i veckan          (det handläggaren behöver veta)
 *   2. anmäld frånvaro som inte bedömts   (deltagaren väntar på ett beslut)
 *   3. incheckning/redovisning att kvittera
 *   4. pass som varit men inte markerats
 *   5. sjuk
 *   6. giltig frånvaro
 * Annars: "Har varit på alla pass hittills i veckan", eller vad som är planerat.
 *
 * Datumen är LOKALA kalenderdagar (YYYY-MM-DD) — se lärdomen "Idag i UTC".
 * Konsulentvyn är svensk med flit (DESIGN.md §2).
 */
import { supabase } from '@/lib/supabase'
import { anvandareFranSession } from '@/lib/anvandareFranSession'
import { addDays, parseLocalDate, veckansMandag, type Attendance } from '@/services/aktivitetSchema'
import { vantarPaKvittens } from '@/services/egenrapport'
import { franNarvarovarde, type Status } from '@/components/ui/kvarterStatus'
import type { VeckoremsaDag } from '@/components/ui/Veckoremsa'
import { orsakText } from './dagensPass'

export interface LagePlan {
  id: string
  participant_id: string
  weekly_hours_target: number | string | null
  status: 'active' | 'paused' | 'ended' | string
}

export interface LagePass {
  id: string
  participant_id: string
  plan_id: string
  date: string
  start_time: string
  end_time: string
  title: string
  activity_type: string
  attendance: Attendance | null
  attendance_note?: string | null
  self_checkin_at?: string | null
  absence_reason?: string | null
}

export interface VeckansUnderlag {
  planer: LagePlan[]
  pass: LagePass[]
}

/**
 * Den inloggade konsulentens planer och passen från veckans måndag två veckor
 * framåt (veckan + nästa vecka, för "Nästa pass"). Samma urval som Dagens pass:
 * planer där den inloggade är konsulent. Kastar vid fel — anroparen visar en rad
 * om det, aldrig en tom vecka.
 */
export async function hamtaVeckansUnderlag(idag: string): Promise<VeckansUnderlag> {
  const { data: { user }, error: userError } = await anvandareFranSession()
  if (userError) throw userError
  if (!user) throw new Error('Inte inloggad')

  const { data: planer, error: planFel } = await supabase
    .from('activity_plans')
    .select('id, participant_id, weekly_hours_target, status')
    .eq('consultant_id', user.id)
  if (planFel) throw planFel
  const planLista = (planer ?? []) as LagePlan[]
  if (planLista.length === 0) return { planer: [], pass: [] }

  const mandag = veckansMandag(idag)
  const { data, error } = await supabase
    .from('activity_sessions')
    .select('id, participant_id, plan_id, date, start_time, end_time, title, activity_type, attendance, attendance_note, self_checkin_at, absence_reason')
    .in('plan_id', planLista.map((p) => p.id))
    .gte('date', mandag)
    .lte('date', addDays(mandag, 13))
    .order('date', { ascending: true })
  if (error) throw error
  return { planer: planLista, pass: (data ?? []) as LagePass[] }
}

// ---------------------------------------------------------------------------
// Ord för dagar
// ---------------------------------------------------------------------------

const VECKODAG = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag']
const VECKODAG_KORT = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör']

/** "i dag", "i går", "i måndags" — för något som HAR hänt. */
export function dagSomVarit(datum: string, idag: string): string {
  if (datum === idag) return 'i dag'
  if (datum === addDays(idag, -1)) return 'i går'
  return `i ${VECKODAG[parseLocalDate(datum).getDay()]}s`
}

/** "i dag", "i morgon", "på torsdag" — för något som ska hända. */
export function dagSomKommer(datum: string, idag: string): string {
  if (datum === idag) return 'i dag'
  if (datum === addDays(idag, 1)) return 'i morgon'
  if (datum < idag) return dagSomVarit(datum, idag)
  return `på ${VECKODAG[parseLocalDate(datum).getDay()]}`
}

const kl = (t: string) => t.slice(0, 5)

// ---------------------------------------------------------------------------
// Passets status i remsan
// ---------------------------------------------------------------------------

/** Har passet varit? Dagar före i dag, eller i dag efter sluttiden. */
function harVarit(p: Pick<LagePass, 'date' | 'end_time'>, idag: string, klockan: string): boolean {
  return p.date < idag || (p.date === idag && kl(p.end_time) <= klockan)
}

/**
 * Ett pass status i veckoremsan. Omarkerat pass som deltagaren anmält frånvaro
 * för, checkat in på eller som redan varit = "Väntar på dig": det är
 * konsulentens tur. Omarkerat framtida pass = "Planerat".
 */
export function passetsStatus(p: LagePass, idag: string, klockan: string): Status {
  const markerad = franNarvarovarde(p.attendance)
  if (markerad) return markerad
  if (p.absence_reason || p.self_checkin_at) return 'vantar'
  if (vantarPaKvittens({ ...p, self_checkin_at: p.self_checkin_at ?? null }, idag)) return 'vantar'
  return harVarit(p, idag, klockan) ? 'vantar' : 'planerat'
}

/** Vilken status som syns när en dag har flera pass: det som kräver något först. */
const DAG_ORDNING: Record<Status, number> = { ogiltig: 0, vantar: 1, sjuk: 2, giltig: 3, planerat: 4, narvarande: 5 }

/** Måndag–fredag för veckan `idag` ligger i, med status per dag. */
export function veckoremsa(pass: readonly LagePass[], idag: string, klockan: string): VeckoremsaDag[] {
  const mandag = veckansMandag(idag)
  return [0, 1, 2, 3, 4].map((i) => {
    const datum = addDays(mandag, i)
    const dagens = pass.filter((p) => p.date === datum)
    if (dagens.length === 0) return { datum, status: null }
    const statusar = dagens.map((p) => passetsStatus(p, idag, klockan))
    const status = statusar.reduce((a, b) => (DAG_ORDNING[b] < DAG_ORDNING[a] ? b : a))
    return { datum, status, detalj: dagens.map((p) => `${p.title} ${kl(p.start_time)}`).join(', ') }
  })
}

// ---------------------------------------------------------------------------
// Läget
// ---------------------------------------------------------------------------

export interface DeltagarLage {
  /** En mening. */
  lage: string
  /** Ord under meningen, t.ex. "Ingen anteckning om varför än". */
  tillagg: string | null
  /** Statuschippet, eller null när inget väntar. */
  status: Status | null
  statusText?: string
  /** Fler saker om personen utöver den första. */
  fler: number
  /** "Plan 10 h/vecka", "Planen är pausad" eller null. */
  plan: string | null
  dagar: VeckoremsaDag[] | null
  /** Nästa omarkerade pass, t.ex. "I dag 13:00 · Gruppträff". */
  nasta: string | null
  utanPlan: boolean
  franvaroIVeckan: boolean
}

interface Sak {
  lage: string
  tillagg?: string
  status: Status
  statusText?: string
}

function timmarText(v: number | string | null): string | null {
  const n = typeof v === 'string' ? Number(v) : v
  if (n === null || n === undefined || !Number.isFinite(n) || n <= 0) return null
  return `Plan ${String(n).replace('.', ',')} h/vecka`
}

export function deltagarLage(args: {
  participantId: string
  underlag: VeckansUnderlag
  /** Lokal kalenderdag, YYYY-MM-DD. */
  idag: string
  /** Lokal klocka "HH:MM" — avgör om dagens pass har varit. */
  klockan: string
  /**
   * KSL21: hos en Rusta och matcha-leverantör är frånvaron fakta (anmäld / inte
   * anmäld i förväg), aldrig "giltig" eller "ogiltig". Utan: kommunens ord.
   */
  franvaroSomFakta?: boolean
}): DeltagarLage {
  const { participantId, underlag, idag, klockan, franvaroSomFakta = false } = args
  const planer = underlag.planer.filter((p) => p.participant_id === participantId)
  const aktiv = planer.find((p) => p.status === 'active') ?? null
  const pausad = !aktiv ? planer.find((p) => p.status === 'paused') ?? null : null

  const mandag = veckansMandag(idag)
  const sondag = addDays(mandag, 6)
  const mina = underlag.pass.filter((p) => p.participant_id === participantId)
  const veckans = mina.filter((p) => p.date >= mandag && p.date <= sondag)

  const plan = aktiv ? timmarText(aktiv.weekly_hours_target) ?? 'Aktivitetsplan' : pausad ? 'Planen är pausad' : null
  const dagar = aktiv || pausad || veckans.length > 0 ? veckoremsa(veckans, idag, klockan) : null

  const kommande = mina
    // Nästa = ett pass som inte börjat än. Ett pass som pågår, eller som deltagaren
    // redan checkat in på eller anmält frånvaro för, är inte "nästa".
    .filter((p) => p.attendance === null && !p.absence_reason && !p.self_checkin_at
      && (p.date > idag || (p.date === idag && kl(p.start_time) > klockan)))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))[0]
  const nasta = kommande
    ? `${kommande.date === idag ? 'I dag' : kommande.date === addDays(idag, 1) ? 'I morgon' : VECKODAG_KORT[parseLocalDate(kommande.date).getDay()]} ${kl(kommande.start_time)} · ${kommande.title}`
    : null

  const franvaroIVeckan = veckans.some((p) =>
    p.attendance === 'absent_invalid' || p.attendance === 'absent_valid' || p.attendance === 'sick_certified'
    || (p.attendance === null && !!p.absence_reason))

  const bas = { plan, dagar, nasta, utanPlan: !aktiv, franvaroIVeckan }

  // Saker i prioritetsordning. Varje kategori ger högst en sak.
  const saker: Sak[] = []
  const varit = veckans.filter((p) => p.date <= idag)

  const ogiltiga = varit.filter((p) => p.attendance === 'absent_invalid')
  if (ogiltiga.length > 0) {
    const senast = ogiltiga[ogiltiga.length - 1]
    const utanRad = ogiltiga.some((p) => !p.attendance_note?.trim())
    saker.push(franvaroSomFakta
      ? {
          lage: ogiltiga.length === 1
            ? `Frånvarande utan anmälan ${dagSomVarit(senast.date, idag)} (${senast.title})`
            : `Frånvarande utan anmälan på ${ogiltiga.length} pass i veckan`,
          tillagg: utanRad ? 'Ingen orsak antecknad än' : undefined,
          status: 'ogiltig',
          statusText: 'Frånvarande, inte anmäld',
        }
      : {
          lage: ogiltiga.length === 1
            ? `Ogiltig frånvaro ${dagSomVarit(senast.date, idag)} (${senast.title})`
            : `Ogiltig frånvaro på ${ogiltiga.length} pass i veckan`,
          tillagg: utanRad ? 'Ingen anteckning om varför än' : undefined,
          status: 'ogiltig',
        })
  }

  const anmalda = veckans.filter((p) => p.attendance === null && !!p.absence_reason)
  if (anmalda.length > 0) {
    const forsta = anmalda[0]
    saker.push({
      lage: `Har anmält frånvaro ${dagSomKommer(forsta.date, idag)}: ${orsakText(forsta.absence_reason)}`,
      status: 'vantar',
      statusText: 'Väntar på dig',
    })
  }

  const kvittens = veckans.filter((p) => !p.absence_reason && vantarPaKvittens({ ...p, self_checkin_at: p.self_checkin_at ?? null }, idag))
  if (kvittens.length > 0) {
    const egen = kvittens.some((p) => p.activity_type === 'jobsearch_own')
    saker.push({
      lage: egen ? 'Eget jobbsökande väntar på kvittens' : `Har checkat in ${dagSomVarit(kvittens[0].date, idag)}`,
      status: 'vantar',
      statusText: 'Väntar på kvittens',
    })
  }

  const omarkerade = veckans.filter((p) =>
    p.attendance === null && !p.absence_reason && !p.self_checkin_at && p.activity_type !== 'jobsearch_own'
    && harVarit(p, idag, klockan))
  if (omarkerade.length > 0) {
    saker.push({
      lage: omarkerade.length === 1
        ? `Passet ${dagSomVarit(omarkerade[0].date, idag)} är inte markerat`
        : `${omarkerade.length} pass i veckan är inte markerade`,
      status: 'vantar',
      statusText: 'Inte markerat',
    })
  }

  const sjuka = varit.filter((p) => p.attendance === 'sick_certified')
  if (sjuka.length > 0) {
    const forsta = sjuka[0]
    saker.push({ lage: sjuka.length === 1 ? `Sjuk ${dagSomVarit(forsta.date, idag)}` : `Sjuk sedan ${dagSomVarit(forsta.date, idag)}`, status: 'sjuk' })
  }

  const giltiga = varit.filter((p) => p.attendance === 'absent_valid')
  if (giltiga.length > 0) {
    const dag = dagSomVarit(giltiga[giltiga.length - 1].date, idag)
    saker.push(franvaroSomFakta
      ? { lage: `Frånvarande, anmäld i förväg ${dag}`, status: 'giltig', statusText: 'Frånvarande, anmäld i förväg' }
      : { lage: `Giltig frånvaro ${dag}`, status: 'giltig' })
  }

  if (saker.length > 0) {
    const [forsta, ...resten] = saker
    return { ...bas, lage: forsta.lage, tillagg: forsta.tillagg ?? null, status: forsta.status, statusText: forsta.statusText, fler: resten.length }
  }

  // Inget väntar. Säg bara det datan bär.
  const narvarande = varit.filter((p) => p.attendance === 'present' || p.attendance === 'external')
  let lage: string
  if (!aktiv && !pausad) lage = 'Ingen aktivitetsplan'
  else if (pausad && veckans.length === 0) lage = 'Planen är pausad'
  else if (veckans.length === 0) lage = 'Inga pass inlagda den här veckan'
  else if (narvarande.length > 0) lage = 'Har varit på alla pass hittills i veckan'
  else lage = 'Inget pass har varit än den här veckan'
  return { ...bas, lage, tillagg: null, status: null, fler: 0 }
}

// ---------------------------------------------------------------------------
// Senaste kontakt i ord
// ---------------------------------------------------------------------------

export const DYGN_MS = 24 * 60 * 60 * 1000

/**
 * Kalenderdagar (lokal tid) mellan ett datum och `nu`. "I går" betyder
 * föregående kalenderdag, inte "24–48 timmar sedan": en kontakt i går 20:00
 * läst i dag 08:00 är 1 dag, inte 0. Math.round tar sommartidens 23/25-
 * timmarsdygn.
 */
function kalenderdagarSedan(iso: string, nu: number): number {
  const idag = new Date(nu); idag.setHours(0, 0, 0, 0)
  const dag = new Date(iso); dag.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((idag.getTime() - dag.getTime()) / DYGN_MS))
}

/** "Senaste kontakt i går" — ord, med siffran kvar för den som vill räkna. */
export function kontaktText(iso: string | null, nu: number): string {
  if (!iso) return 'Ingen kontakt registrerad'
  const dagar = kalenderdagarSedan(iso, nu)
  if (dagar === 0) return 'Senaste kontakt i dag'
  if (dagar === 1) return 'Senaste kontakt i går'
  if (dagar < 7) return `Senaste kontakt för ${dagar} dagar sedan`
  const veckor = Math.floor(dagar / 7)
  return `Senaste kontakt för ${veckor} ${veckor === 1 ? 'vecka' : 'veckor'} sedan`
}
