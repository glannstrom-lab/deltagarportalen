/**
 * mittUnderlag — "Ta med dig"-paketet (FN16, 2026-10-30).
 *
 * En zip som deltagaren själv hämtar och kan ta med sig till ny leverantör,
 * ny kommun eller bara till sig själv: CV (PDF), en underlags-PDF med
 * ansökningar, aktivitetsrapport, plan och mål, och de kommande sju dagarna
 * som .ics. Dataexporten under "Radera konto" (`export_user_data`, rå JSON)
 * finns kvar för art. 20; det här är den läsbara versionen.
 *
 * Tre regler som styr filen:
 *  1. Varje del har fyra lägen — `ok`, `tom`, `fel`, `utelamnad` — och de
 *     skrivs ut med olika ord. Ett läsfel är inte "inga ansökningar", och en
 *     tom del är inte en nolla (CLAUDE.md: "läsfel som tom data").
 *     `Las-mig.txt` listar vad som kom med och varför resten inte.
 *  2. Journalen (konsulentens anteckningar om deltagaren, `consultant_journal`)
 *     hämtas och skrivs BARA när deltagaren aktivt bockat i den för just den här
 *     hämtningen. Annars läses tabellen inte ens. Dagboken (`journal_entries`)
 *     tas aldrig med: den är privat och portalen lovar det.
 *  3. Läsningarna går som deltagaren själv — RLS (`participant_id = auth.uid()`)
 *     avgör vad som kommer ut. Ingen service role, ingen ny RPC.
 *
 * Planens `target_reason` och `forsorjningshinder` ingår medvetet inte: de är
 * konsulentens bedömningsfält och hör till den handläggning som underlagen
 * ("Lämna underlag") redan hanterar.
 */
import { supabase } from '@/lib/supabase'
import { anvandareFranSession } from '@/lib/anvandareFranSession'
import { applicationsApi } from './applicationsApi'
import { cvApi } from './cvApi'
import { minVeckaApi, type ActivityPlan, type ActivitySession, mapSession } from './aktivitetApi'
import { formatLocalDate } from './aktivitetSchema'
import { hamtaMoten } from '@/components/minvecka/konsulentMoten'
import { veckansKalenderPoster } from '@/components/minvecka/veckansKalender'
import { TYP_NYCKEL } from '@/components/minvecka/passTyp'
import { franNarvarovarde, STATUS_NYCKEL, STATUS_ORD_SV } from '@/components/ui/kvarterStatus'
import { generateServerCV } from '@/components/pdf/serverCvPdf'
import { cvFilnamn } from '@/lib/cvFilnamn'
import { byggIcs } from '@/lib/ics'
import { APPLICATION_STATUS_CONFIG, type Application } from '@/types/application.types'
import { byggZip, type ZipFil } from './zipLagring'
import { byggUnderlagPdf } from './mittUnderlagPdf'
import type { Dokument, DokSektion } from './mittUnderlagTyper'

export type { Dokument, DokSektion } from './mittUnderlagTyper'

export type Overs = (nyckel: string, standard: string, vars?: Record<string, unknown>) => string

export interface UnderlagVal {
  /** Konsulentens journalanteckningar om deltagaren. Av som standard. */
  journal: boolean
}

export type Del<R> =
  | { status: 'ok'; rader: R[] }
  | { status: 'tom' }
  | { status: 'fel' }
  | { status: 'utelamnad' }

export interface Mal {
  titel: string
  fran: 'du' | 'konsulent'
  status: string
  slutdatum: string | null
}

export interface JournalPost {
  datum: string
  kategori: string | null
  text: string
}

export interface UnderlagRader {
  ansokningar: Del<Application>
  pass: Del<ActivitySession>
  planer: Del<ActivityPlan>
  mal: Del<Mal>
  journal: Del<JournalPost>
}

export interface CvResultat {
  blob: Blob
  namn: string
}

type VeckoPoster = ReturnType<typeof veckansKalenderPoster>

/** Källor som kan bytas i test. Varje funktion kastar vid läsfel. */
export interface UnderlagKallor {
  ansokningar(): Promise<Application[]>
  pass(): Promise<ActivitySession[]>
  planer(): Promise<ActivityPlan[]>
  mal(): Promise<Mal[]>
  journal(): Promise<JournalPost[]>
  /** null = deltagaren har inget CV att exportera */
  cv(): Promise<CvResultat | null>
  vecka(idag: string, nu: Date, t: Overs): Promise<VeckoPoster>
}

async function jag(): Promise<string> {
  const { data } = await anvandareFranSession()
  if (!data.user) throw new Error('Inte inloggad')
  return data.user.id
}

export const standardKallor: UnderlagKallor = {
  ansokningar: () => applicationsApi.getAll(),

  async pass() {
    const id = await jag()
    const { data, error } = await supabase
      .from('activity_sessions')
      .select('*')
      .eq('participant_id', id)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(5000)
    if (error) throw error
    return (data ?? []).map((r) => mapSession(r as Record<string, unknown>))
  },

  async planer() {
    const id = await jag()
    const { data, error } = await supabase
      .from('activity_plans')
      .select('*')
      .eq('participant_id', id)
      .order('start_date', { ascending: false })
    if (error) throw error
    return (data ?? []) as ActivityPlan[]
  },

  async mal() {
    const id = await jag()
    const [egna, konsulent] = await Promise.all([
      supabase.from('user_goals').select('title, is_completed, deadline').eq('user_id', id),
      supabase.from('consultant_goals').select('title, status, deadline').eq('participant_id', id),
    ])
    if (egna.error) throw egna.error
    if (konsulent.error) throw konsulent.error
    return [
      ...(egna.data ?? []).map((g): Mal => ({
        titel: g.title ?? '',
        fran: 'du',
        status: g.is_completed ? 'COMPLETED' : 'IN_PROGRESS',
        slutdatum: g.deadline ?? null,
      })),
      ...(konsulent.data ?? []).map((g): Mal => ({
        titel: g.title ?? '',
        fran: 'konsulent',
        status: g.status ?? '',
        slutdatum: g.deadline ?? null,
      })),
    ]
  },

  async journal() {
    const id = await jag()
    const { data, error } = await supabase
      .from('consultant_journal')
      .select('category, content, created_at, occurred_at')
      .eq('participant_id', id)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map((j): JournalPost => ({
      datum: String(j.occurred_at ?? j.created_at ?? '').slice(0, 10),
      kategori: j.category ?? null,
      text: j.content ?? '',
    }))
  },

  async cv() {
    const cv = await cvApi.getCV()
    if (!cv) return null
    const harInnehall = !!(cv.firstName || cv.lastName || cv.title || cv.summary
      || cv.workExperience?.length || cv.education?.length || cv.skills?.length)
    if (!harInnehall) return null
    const blob = await generateServerCV(cv.template || 'sidebar')
    return { blob, namn: cvFilnamn(cv) }
  },

  async vecka(idag, nu, t) {
    const till = formatLocalDate(new Date(nu.getTime() + 6 * 86_400_000))
    const [pass, moten] = await Promise.all([minVeckaApi.listMySessions(idag, till), hamtaMoten(idag, till)])
    return veckansKalenderPoster(pass, moten, idag, nu, {
      moteTitel: t('minVecka.mote.rubrik', 'Möte med din konsulent'),
      passBeskrivning: (p) => t(TYP_NYCKEL[p.activity_type], ''),
      moteBeskrivning: (m) => t(m.meeting_type === 'phone' ? 'myConsultant.nextMeeting.meetingTypes.phone'
        : m.meeting_type === 'physical' || m.meeting_type === 'in_person' ? 'myConsultant.nextMeeting.meetingTypes.inPerson'
        : 'myConsultant.nextMeeting.meetingTypes.video', ''),
    })
  },
}

async function lasDel<R>(hamta: () => Promise<R[]>): Promise<Del<R>> {
  try {
    const rader = await hamta()
    return rader.length === 0 ? { status: 'tom' } : { status: 'ok', rader }
  } catch (e) {
    console.warn('[mittUnderlag] en del kunde inte läsas', e)
    return { status: 'fel' }
  }
}

/** Läser alla delar. Journalen läses bara om deltagaren valt det — annars rörs tabellen inte. */
export async function hamtaUnderlag(val: UnderlagVal, kallor: UnderlagKallor): Promise<UnderlagRader> {
  const [ansokningar, pass, planer, mal, journal] = await Promise.all([
    lasDel(kallor.ansokningar),
    lasDel(kallor.pass),
    lasDel(kallor.planer),
    lasDel(kallor.mal),
    val.journal ? lasDel(kallor.journal) : Promise.resolve<Del<JournalPost>>({ status: 'utelamnad' }),
  ])
  return { ansokningar, pass, planer, mal, journal }
}

// ---------------------------------------------------------------------------
// Dokumentmodell: ren text, ingen jsPDF. Testas direkt.
// ---------------------------------------------------------------------------

const STRECK = '-'

function statusOrd(s: Application['status'], sprak: string): string {
  const c = APPLICATION_STATUS_CONFIG[s]
  return c ? (sprak === 'en' ? c.labelEn : c.label) : s
}

function narvaroOrd(p: ActivitySession, idag: string, t: Overs): string {
  const st = franNarvarovarde(p.attendance)
  if (st) return t(STATUS_NYCKEL[st], STATUS_ORD_SV[st])
  return p.date >= idag
    ? t(STATUS_NYCKEL.planerat, STATUS_ORD_SV.planerat)
    : t('underlag.pdf.integMarkerad', 'Inte markerad')
}

function malStatus(m: Mal, t: Overs): string {
  switch (m.status) {
    case 'COMPLETED': return t('underlag.pdf.malKlart', 'Klart')
    case 'IN_PROGRESS': return t('underlag.pdf.malPagar', 'Pågår')
    case 'NOT_STARTED': return t('underlag.pdf.malEjStartat', 'Inte påbörjat')
    case 'BLOCKED': return t('underlag.pdf.malStopp', 'Fastnat')
    default: return STRECK
  }
}

function meddelandeFor(del: Del<unknown>, tom: string, fel: string, utelamnad?: string): string | undefined {
  if (del.status === 'tom') return tom
  if (del.status === 'fel') return fel
  if (del.status === 'utelamnad') return utelamnad
  return undefined
}

export function byggDokument(rader: UnderlagRader, t: Overs, sprak: string, nu: Date): Dokument {
  const idag = formatLocalDate(nu)
  const sektioner: DokSektion[] = []
  const felText = t(
    'underlag.pdf.fel',
    'Den här delen kunde inte läsas just nu, så den saknas i filen. Det betyder inte att du saknar uppgifter. Hämta paketet igen om en stund.',
  )

  // Ansökningar
  {
    const del = rader.ansokningar
    const ok = del.status === 'ok' ? del.rader : null
    sektioner.push({
      id: 'ansokningar',
      rubrik: t('underlag.pdf.ansokningar', 'Dina ansökningar och sparade jobb'),
      meddelande: meddelandeFor(del, t('underlag.pdf.ansokningarTom', 'Du har inga ansökningar sparade.'), felText),
      kolumner: ok
        ? [t('underlag.pdf.kolForetag', 'Företag'), t('underlag.pdf.kolTjanst', 'Tjänst'), t('underlag.pdf.kolStatus', 'Status'), t('underlag.pdf.kolSokt', 'Sökt'), t('underlag.pdf.kolOrt', 'Ort')]
        : undefined,
      rader: ok?.map((a) => [
        a.companyName || STRECK,
        a.jobTitle || STRECK,
        statusOrd(a.status, sprak),
        a.applicationDate ? a.applicationDate.slice(0, 10) : STRECK,
        a.location || STRECK,
      ]),
    })
  }

  // Aktivitetsrapport
  {
    const del = rader.pass
    const ok = del.status === 'ok' ? del.rader : null
    let ingress: string | undefined
    if (ok) {
      let narvarande = 0
      let franvaro = 0
      let utan = 0
      for (const p of ok) {
        const st = franNarvarovarde(p.attendance)
        if (st === 'narvarande') narvarande++
        else if (st) franvaro++
        else if (p.date < idag) utan++
      }
      ingress = t(
        'underlag.pdf.aktivitetIngress',
        '{{antal}} pass: {{narvarande}} med närvaro, {{franvaro}} med frånvaro, {{utan}} ännu inte markerade.',
        { antal: ok.length, narvarande, franvaro, utan },
      )
    }
    sektioner.push({
      id: 'aktivitet',
      rubrik: t('underlag.pdf.aktivitet', 'Aktivitetsrapport'),
      meddelande: meddelandeFor(del, t('underlag.pdf.aktivitetTom', 'Du har inga aktivitetspass registrerade.'), felText),
      ingress,
      kolumner: ok
        ? [t('underlag.pdf.kolDatum', 'Datum'), t('underlag.pdf.kolTid', 'Tid'), t('underlag.pdf.kolAktivitet', 'Aktivitet'), t('underlag.pdf.kolTyp', 'Typ'), t('underlag.pdf.kolNarvaro', 'Närvaro')]
        : undefined,
      rader: ok?.map((p) => [
        p.date,
        `${p.start_time.slice(0, 5)}-${p.end_time.slice(0, 5)}`,
        p.title || STRECK,
        t(TYP_NYCKEL[p.activity_type], ''),
        narvaroOrd(p, idag, t),
      ]),
    })
  }

  // Plan
  {
    const del = rader.planer
    const ok = del.status === 'ok' ? del.rader : null
    sektioner.push({
      id: 'plan',
      rubrik: t('underlag.pdf.plan', 'Plan'),
      meddelande: meddelandeFor(del, t('underlag.pdf.planTom', 'Du har ingen aktivitetsplan.'), felText),
      kolumner: ok
        ? [t('underlag.pdf.kolPeriod', 'Period'), t('underlag.pdf.kolStatus', 'Status'), t('underlag.pdf.kolTimmar', 'Timmar i veckan'), t('underlag.pdf.kolEgetSok', 'Varav eget jobbsökande')]
        : undefined,
      rader: ok?.map((p) => [
        `${p.start_date} - ${p.end_date ?? t('underlag.pdf.tillsVidare', 'tills vidare')}`,
        p.status === 'active' ? t('underlag.pdf.planAktiv', 'Pågår') : p.status === 'paused' ? t('underlag.pdf.planPausad', 'Pausad') : t('underlag.pdf.planAvslutad', 'Avslutad'),
        String(p.weekly_hours_target),
        String(p.jobsearch_hours_per_week ?? 0),
      ]),
      stycken: ok?.filter((p) => p.plan_text?.trim()).map((p) => `${p.start_date}: ${p.plan_text!.trim()}`),
    })
  }

  // Mål
  {
    const del = rader.mal
    const ok = del.status === 'ok' ? del.rader : null
    sektioner.push({
      id: 'mal',
      rubrik: t('underlag.pdf.mal', 'Mål'),
      meddelande: meddelandeFor(del, t('underlag.pdf.malTom', 'Du har inga mål sparade.'), felText),
      kolumner: ok
        ? [t('underlag.pdf.kolMal', 'Mål'), t('underlag.pdf.kolFran', 'Satt av'), t('underlag.pdf.kolStatus', 'Status'), t('underlag.pdf.kolSlutdatum', 'Slutdatum')]
        : undefined,
      rader: ok?.map((m) => [
        m.titel || STRECK,
        m.fran === 'du' ? t('underlag.pdf.franDu', 'Du') : t('underlag.pdf.franKonsulent', 'Din konsulent'),
        malStatus(m, t),
        m.slutdatum ? m.slutdatum.slice(0, 10) : STRECK,
      ]),
    })
  }

  // Journal — bara om deltagaren valt det
  {
    const del = rader.journal
    const ok = del.status === 'ok' ? del.rader : null
    sektioner.push({
      id: 'journal',
      rubrik: t('underlag.pdf.journal', 'Journalanteckningar från din konsulent'),
      meddelande: meddelandeFor(
        del,
        t('underlag.pdf.journalTom', 'Det finns inga journalanteckningar om dig.'),
        felText,
        t('underlag.pdf.journalUtelamnad', 'Journalanteckningarna ingår inte, eftersom du inte valde att ta med dem.'),
      ),
      kolumner: ok
        ? [t('underlag.pdf.kolDatum', 'Datum'), t('underlag.pdf.kolKategori', 'Kategori'), t('underlag.pdf.kolAnteckning', 'Anteckning')]
        : undefined,
      rader: ok?.map((j) => [j.datum || STRECK, j.kategori || STRECK, j.text]),
    })
  }

  return {
    titel: t('underlag.pdf.titel', 'Mitt underlag'),
    undertitel: t('underlag.pdf.undertitel', 'Hämtat från Jobin {{datum}}. Uppgifterna är dina egna, som de stod när du hämtade paketet.', { datum: idag }),
    sektioner,
  }
}

// ---------------------------------------------------------------------------
// Paketet
// ---------------------------------------------------------------------------

export type FilStatus = 'med' | 'tom' | 'fel' | 'utelamnad'

export interface PaketPost {
  fil: string
  status: FilStatus
}

export interface Paket {
  zip: Uint8Array
  filnamn: string
  poster: PaketPost[]
}

export function lasMigText(poster: PaketPost[], t: Overs, nu: Date): string {
  const ord: Record<FilStatus, string> = {
    med: t('underlag.lasMig.med', 'ingår'),
    tom: t('underlag.lasMig.tom', 'ingår inte: det fanns inget att ta med'),
    fel: t('underlag.lasMig.fel', 'ingår inte: det gick inte att läsa just nu, hämta paketet igen'),
    utelamnad: t('underlag.lasMig.utelamnad', 'ingår inte: du valde att inte ta med det'),
  }
  return [
    t('underlag.lasMig.rubrik', 'Mitt underlag från Jobin'),
    t('underlag.lasMig.hamtat', 'Hämtat {{datum}}', { datum: formatLocalDate(nu) }),
    '',
    ...poster.map((p) => `${p.fil}: ${ord[p.status]}`),
    '',
    t('underlag.lasMig.privat', 'Filen innehåller bara det du själv kan se i Jobin. Din dagbok ingår aldrig. Förvara filen på ett ställe du litar på.'),
    '',
  ].join('\r\n')
}

const bytes = (s: string) => new TextEncoder().encode(s)

/** Blob.arrayBuffer finns i alla aktuella webbläsare men inte i jsdom; FileReader är reservvägen. */
function blobTillBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer().then((b) => new Uint8Array(b))
  return new Promise((ok, nej) => {
    const r = new FileReader()
    r.onload = () => ok(new Uint8Array(r.result as ArrayBuffer))
    r.onerror = () => nej(r.error)
    r.readAsArrayBuffer(blob)
  })
}

/**
 * Hämtar allt och packar zip:en. Ett fel i EN del fäller inte paketet — delen
 * saknas och `Las-mig.txt` säger varför. Kastar bara om ingenting alls kunde
 * packas (då finns inget att ge).
 */
export async function skapaUnderlag(
  val: UnderlagVal,
  t: Overs,
  sprak: string,
  kallor: UnderlagKallor = standardKallor,
  nu: Date = new Date(),
): Promise<Paket> {
  const idag = formatLocalDate(nu)
  const rader = await hamtaUnderlag(val, kallor)
  const dok = byggDokument(rader, t, sprak, nu)
  const filer: ZipFil[] = []
  const poster: PaketPost[] = []

  try {
    filer.push({ namn: 'Mitt-underlag.pdf', data: await byggUnderlagPdf(dok) })
    poster.push({ fil: 'Mitt-underlag.pdf', status: 'med' })
  } catch (e) {
    console.warn('[mittUnderlag] PDF:en kunde inte skapas', e)
    poster.push({ fil: 'Mitt-underlag.pdf', status: 'fel' })
  }

  try {
    const cv = await kallor.cv()
    if (cv) {
      filer.push({ namn: cv.namn, data: await blobTillBytes(cv.blob) })
      poster.push({ fil: cv.namn, status: 'med' })
    } else {
      poster.push({ fil: 'CV.pdf', status: 'tom' })
    }
  } catch (e) {
    console.warn('[mittUnderlag] CV:t kunde inte hämtas', e)
    poster.push({ fil: 'CV.pdf', status: 'fel' })
  }

  try {
    const vecka = await kallor.vecka(idag, nu, t)
    if (vecka.length > 0) {
      filer.push({ namn: 'Veckan.ics', data: bytes(byggIcs(vecka, { nu })) })
      poster.push({ fil: 'Veckan.ics', status: 'med' })
    } else {
      poster.push({ fil: 'Veckan.ics', status: 'tom' })
    }
  } catch (e) {
    console.warn('[mittUnderlag] veckan kunde inte hämtas', e)
    poster.push({ fil: 'Veckan.ics', status: 'fel' })
  }

  // Journalen ligger i Mitt-underlag.pdf; raden i Las-mig.txt säger hur det gick.
  poster.push({
    fil: t('underlag.lasMig.journalNamn', 'Journalanteckningar (i Mitt-underlag.pdf)'),
    status: rader.journal.status === 'ok' ? 'med' : rader.journal.status,
  })

  if (filer.length === 0) throw new Error('Ingenting kunde packas')
  filer.push({ namn: 'Las-mig.txt', data: bytes(lasMigText(poster, t, nu)) })
  return { zip: byggZip(filer, nu), filnamn: `jobin-mitt-underlag-${idag}.zip`, poster }
}

export function laddaNerZip(zip: Uint8Array, filnamn: string): void {
  const blob = new Blob([zip as BlobPart], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filnamn
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
