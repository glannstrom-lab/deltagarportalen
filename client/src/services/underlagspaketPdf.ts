/**
 * underlagspaketPdf — handlingen som "Lämna underlag" lämnar (RK8, rollspelet
 * 2026-09-27).
 *
 * Före den här filen blev "Markera som lämnat" bara en rad i
 * `activity_plan_handovers`: "Lämnat 27 september till …". Ingen PDF, ingen
 * utskrift — inget som faktiskt kunde nå handläggaren. Paketet är det
 * dokumentet: period, varje pass dag för dag, frånvaro med anteckning,
 * intygsstatus (med/utan intyg, skilda åt sedan RK3), vem som markerade och när.
 *
 * Två tidpunkter, hållna isär med flit:
 *   - Sammanfattningen är den som LÄMNADES (raden i handovers-tabellen). Det är
 *     den handläggaren fick; den räknas aldrig om.
 *   - Passtabellen är registreringen NU. Har passen ändrats efter att
 *     underlaget lämnades står det i klartext, i stället för att två tal för
 *     samma sak tyst skiljer sig åt.
 *
 * Ett värde utan underlag skrivs "-" med en rad om varför (CLAUDE.md,
 * 2026-08-09). Underlag lämnade före RK3 saknar `sjuk_utan_intyg`; då står det
 * så, i stället för en nolla.
 *
 * Ingen AI. Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 * Samma jsPDF-mönster som narvaroIntygPdf.ts: lazy-laddat, `doc.save()`
 * (aldrig window.open efter await), bindestreck i stället för tankstreck
 * (Helvetica skriver inte U+2013/2014).
 */

import type { jsPDF } from 'jspdf'
import { supabase } from '@/lib/supabase'
import {
  aktivitetsplanApi,
  sammanfattaNarvaro,
  type ActivityPlan,
  type ActivitySession,
  type NarvaroSammanfattning,
  type PlanHandover,
} from './aktivitetApi'
import type { ActivityType, Attendance } from './aktivitetSchema'
import { franvaroAv, type FranvaroOrsak } from './franvaroApi'
import { orgApi } from './orgApi'
import { regelverkForPlan } from '@/components/consultant/orgTypVisning'
import { ARENDE_ETIKETT, PLAN_PASS_KOLUMNER_FINNS } from './planMarkning'

let jsPDFModule: typeof import('jspdf') | null = null
let autoTableModule: typeof import('jspdf-autotable') | null = null

async function loadPDFLibraries(): Promise<typeof import('jspdf').jsPDF> {
  if (!jsPDFModule || !autoTableModule) {
    const [jspdfLib, autoTableLib] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
    jsPDFModule = jspdfLib
    autoTableModule = autoTableLib
  }
  return jsPDFModule.jsPDF
}

const STRECK = '-'
const MANADER = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'] as const
const VECKODAGAR = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'] as const

const TYP_ETIKETT: Record<ActivityType, string> = {
  motivation: 'Motivation och förmåga',
  language: 'Språk',
  jobsearch: 'Jobbsökande',
  workplace: 'Arbetsplatsförlagd',
  jobsearch_own: 'Eget jobbsökande (egen redovisning)',
  sfi: 'SFI (hålls av skolan)',
  studier: 'Studier (hålls av skolan)',
  vagledning: 'Studie- och yrkesvägledning',
  halsa: 'Hälsa',
}

/** Samma ord som närvaropanelen och närvarointyget. */
const NARVARO_ETIKETT: Record<Attendance, string> = {
  present: 'Närvarande',
  absent_valid: 'Frånvaro, giltig',
  absent_invalid: 'Frånvaro, ogiltig',
  sick_certified: 'Sjuk',
  external: 'Annan aktivitet',
}

const ORSAK_ETIKETT: Record<FranvaroOrsak, string> = {
  sick: 'sjuk',
  child_care: 'vård av barn',
  authority_meeting: 'möte hos myndighet',
  other: 'annat',
}

export type PaketPass = ActivitySession & {
  absence_reported_at?: string | null
  absence_reason?: FranvaroOrsak | null
  absence_note?: string | null
}

export interface UnderlagspaketInput {
  underlag: Pick<PlanHandover, 'recipient' | 'period_from' | 'period_to' | 'handed_over_at' | 'summary' | 'note' | 'withdrawn_at' | 'withdrawn_reason'>
  participantId: string
  participantName: string
  /** Den som lämnade underlaget (konsulenten). */
  lamnatAv: string
  organizationName?: string | null
  /** Alla pass i perioden (fler filtreras bort här). */
  sessions: readonly PaketPass[]
  /** Användar-id → namn för den som markerat ett pass. */
  namn: Readonly<Record<string, string>>
  /** Planens regelverk; bara 'kommun' nämner socialnämnden. */
  regelverk?: 'kommun' | 'leverantor' | null
  /** Tidpunkt för utskriften (injicerbar för test). */
  nu?: Date
  /** RK40: planens ärende-/dossiernummer; raden skrivs när kolumnen finns (tomt = "-"). */
  caseReference?: string | null
  /** Utelämnat = när kolumnen finns (PENDING_20260927d). */
  visaArende?: boolean
}

function datumMedVeckodag(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`)
  return `${VECKODAGAR[d.getUTCDay()]} ${d.getUTCDate()} ${MANADER[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function datumKort(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${d} ${MANADER[m - 1]} ${y}`
}

/** "2026-09-27 14:03" i svensk tid. Mellanslagen normaliseras — Helvetica saknar U+202F. */
export function tidpunkt(isoTs: string): string {
  const f = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
  return f.format(new Date(isoTs)).replace(/[\u00a0\u202f]/g, ' ')
}

/** Intygsstatus för ett pass. Bara sjukmarkering har en; övriga får "-". */
export function intygStatus(s: Pick<ActivitySession, 'attendance' | 'sick_certificate_received'>): string {
  if (s.attendance !== 'sick_certified') return STRECK
  return s.sick_certificate_received === true ? 'Med intyg' : 'Utan intyg'
}

/**
 * Utfallet på passet. Konsulentens markering vinner; annars deltagarens egen
 * anmälan; annars incheckning utan bekräftelse; annars "Ej markerat".
 */
export function paketUtfall(s: PaketPass): string {
  if (s.attendance) return NARVARO_ETIKETT[s.attendance]
  const anm = franvaroAv(s)
  if (anm) return `Anmäld frånvaro (${ORSAK_ETIKETT[anm.reason]}), ej bedömd`
  if (s.self_checkin_at) return 'Incheckad, ej bekräftad'
  return 'Ej markerat'
}

/** Konsulentens anteckning och deltagarens egen anmälan, i den ordningen. */
export function paketAnteckning(s: PaketPass): string {
  const delar: string[] = []
  if (s.attendance_note?.trim()) delar.push(s.attendance_note.trim())
  const anm = franvaroAv(s)
  if (anm) {
    const text = `Deltagaren anmälde ${tidpunkt(anm.reportedAt)}: ${ORSAK_ETIKETT[anm.reason]}${anm.note?.trim() ? ` - ${anm.note.trim()}` : ''}`
    delar.push(text)
  }
  return delar.length ? delar.join('\n') : STRECK
}

/** Vem som markerade passet. Ett id utan läsbart namn sägs rakt ut, aldrig gissat. */
export function markeradAv(s: Pick<ActivitySession, 'marked_by' | 'self_checkin_at'>, participantId: string, namn: Readonly<Record<string, string>>): string {
  if (!s.marked_by) return s.self_checkin_at ? 'Deltagaren (incheckning)' : STRECK
  if (s.marked_by === participantId) return 'Deltagaren'
  return namn[s.marked_by]?.trim() || 'Namn saknas (annan användare)'
}

/** Passen i perioden, dag för dag, i tidsordning. */
export function periodensPass<T extends Pick<ActivitySession, 'date' | 'start_time'>>(sessions: readonly T[], from: string, to: string): T[] {
  return sessions
    .filter((s) => s.date >= from && s.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
}

export function paketRader(input: Pick<UnderlagspaketInput, 'sessions' | 'participantId' | 'namn' | 'underlag'>): string[][] {
  const { period_from, period_to } = input.underlag
  return periodensPass(input.sessions, period_from, period_to).map((s) => [
    datumMedVeckodag(s.date),
    `${s.start_time}-${s.end_time}`,
    `${s.title}\n${TYP_ETIKETT[s.activity_type] ?? s.activity_type}`,
    paketUtfall(s),
    intygStatus(s),
    paketAnteckning(s),
    markeradAv(s, input.participantId, input.namn),
    s.marked_at ? tidpunkt(s.marked_at) : STRECK,
  ])
}

const SAMMANFATTNING_ETIKETT: ReadonlyArray<[keyof NarvaroSammanfattning, string]> = [
  ['pass', 'Pass i perioden'],
  ['present', 'Närvarande'],
  ['absent_valid', 'Frånvaro, giltig'],
  ['absent_invalid', 'Frånvaro, ogiltig'],
  ['sick_certified', 'Sjuk med intyg'],
  ['sjuk_utan_intyg', 'Sjuk utan intyg'],
  ['external', 'Annan aktivitet'],
  ['omarkerade', 'Ej markerade'],
  ['anmald_franvaro', 'Anmälda i förväg av deltagaren'],
]

/**
 * Den lämnade sammanfattningen som tabellrader. Underlag från före RK3 saknar
 * `sjuk_utan_intyg` och räknade all sjukfrånvaro som "sick_certified" — då
 * står det så, inte en nolla.
 */
export function sammanfattningRader(summary: Partial<NarvaroSammanfattning>): string[][] {
  const fore = typeof summary.sjuk_utan_intyg !== 'number'
  return SAMMANFATTNING_ETIKETT.map(([nyckel, etikett]) => {
    const v = summary[nyckel]
    if (nyckel === 'sick_certified' && fore && typeof v === 'number') {
      return ['Sjuk (med och utan intyg ihop)', String(v)]
    }
    if (typeof v !== 'number') {
      return [etikett, nyckel === 'sjuk_utan_intyg' ? `${STRECK} (räknades inte separat när underlaget lämnades)` : `${STRECK} (saknas i underlaget)`]
    }
    return [etikett, String(v)]
  })
}

/** Har registreringen ändrats sedan underlaget lämnades? Jämför bara nycklar som lämnades. */
export function avvikerFranLamnat(lamnad: Partial<NarvaroSammanfattning>, nu: NarvaroSammanfattning): boolean {
  const fore = typeof lamnad.sjuk_utan_intyg !== 'number'
  return SAMMANFATTNING_ETIKETT.some(([k]) => {
    const v = lamnad[k]
    if (typeof v !== 'number') return false
    if (k === 'sick_certified' && fore) return v !== nu.sick_certified + nu.sjuk_utan_intyg
    return v !== nu[k]
  })
}

export async function generateUnderlagspaketPDF(input: UnderlagspaketInput): Promise<jsPDF> {
  const jsPDFClass = await loadPDFLibraries()
  const { default: autoTable } = autoTableModule!
  const nu = input.nu ?? new Date()
  const { underlag } = input

  const doc = new jsPDFClass('l', 'mm', 'a4')
  const bredd = doc.internal.pageSize.getWidth()
  const hojd = doc.internal.pageSize.getHeight()
  const marg = 15
  let y = marg + 2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Underlag om närvaro i aktivitetsplanen', marg, y)
  y += 8

  if (underlag.withdrawn_at) {
    doc.setFontSize(11)
    doc.setTextColor(170, 30, 30)
    const angrat = doc.splitTextToSize(
      `ÅNGRAT ${tidpunkt(underlag.withdrawn_at)}${underlag.withdrawn_reason ? `: ${underlag.withdrawn_reason}` : ''}. Underlaget gäller inte längre.`,
      bredd - marg * 2,
    ) as string[]
    doc.text(angrat, marg, y)
    doc.setTextColor(0)
    y += angrat.length * 5 + 2
  }

  autoTable(doc, {
    startY: y,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
    body: [
      ['Deltagare', input.participantName.trim() || STRECK],
      ['Organisation', input.organizationName?.trim() || STRECK],
      ...(input.visaArende ?? PLAN_PASS_KOLUMNER_FINNS
        ? [[input.regelverk === 'leverantor' ? ARENDE_ETIKETT.leverantor : ARENDE_ETIKETT.kommun, input.caseReference?.trim() || STRECK]]
        : []),
      ['Period', `${datumKort(underlag.period_from)} - ${datumKort(underlag.period_to)}`],
      ['Mottagare', underlag.recipient.trim() || STRECK],
      ['Lämnat', `${tidpunkt(underlag.handed_over_at)} av ${input.lamnatAv.trim() || STRECK}`],
      ['Anteckning', underlag.note?.trim() || STRECK],
    ],
    margin: { left: marg, right: marg },
  })
  y = doc.lastAutoTable.finalY + 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Sammanfattning som lämnades', marg, y)
  y += 2
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 0.9 },
    columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 80 } },
    body: sammanfattningRader(underlag.summary ?? {}),
    margin: { left: marg, right: marg },
    tableWidth: 150,
  })
  y = doc.lastAutoTable.finalY + 6

  const rader = paketRader(input)
  const nuRaknat = sammanfattaNarvaro(input.sessions, underlag.period_from, underlag.period_to)
  if (avvikerFranLamnat(underlag.summary ?? {}, nuRaknat)) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const obs = doc.splitTextToSize(
      `Obs: passen har ändrats efter att underlaget lämnades. Sammanfattningen ovan är den som lämnades; tabellen nedan visar registreringen ${tidpunkt(nu.toISOString())}.`,
      bredd - marg * 2,
    ) as string[]
    doc.text(obs, marg, y)
    y += obs.length * 4.5 + 2
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Pass dag för dag', marg, y)
  y += 2
  if (rader.length === 0) {
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Inga pass är registrerade i perioden.', marg, y)
    y += 6
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Datum', 'Tid', 'Aktivitet', 'Utfall', 'Intyg', 'Anteckning', 'Markerat av', 'Markerat']],
      body: rader,
      styles: { fontSize: 8, cellPadding: 1.2, valign: 'top' },
      headStyles: { fillColor: [68, 83, 78], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 26 }, 1: { cellWidth: 20 }, 2: { cellWidth: 42 }, 3: { cellWidth: 32 },
        4: { cellWidth: 18 }, 5: { cellWidth: 64 }, 6: { cellWidth: 36 }, 7: { cellWidth: 29 },
      },
      margin: { left: marg, right: marg },
    })
    y = doc.lastAutoTable.finalY + 6
  }

  if (y + 10 > hojd - 12) {
    doc.addPage()
    y = marg
  }
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const beslut = input.regelverk === 'kommun'
    ? ' Beslut om försörjningsstöd, och om eventuell nedsättning, fattas av socialnämnden.'
    : input.regelverk === 'leverantor'
      ? ' Beslut om ersättning fattas av Arbetsförmedlingen.'
      : ''
  const not = doc.splitTextToSize(
    'Underlaget är en sammanställning av det som registrerats i Jobin, inte ett beslut. Bara pass som arbetskonsulenten markerat är bedömda; "Ej markerat" betyder att ingen bedömning gjorts.' + beslut,
    bredd - marg * 2,
  ) as string[]
  doc.text(not, marg, y)

  const sidor = doc.getNumberOfPages()
  const utskrift = tidpunkt(nu.toISOString())
  for (let i = 1; i <= sidor; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(110)
    doc.text(`Utskrivet ur jobin.se ${utskrift}`, marg, hojd - 8)
    doc.text(`Sida ${i} av ${sidor}`, bredd - marg, hojd - 8, { align: 'right' })
    doc.setTextColor(0)
  }
  return doc
}

export async function generateUnderlagspaketBlob(input: UnderlagspaketInput): Promise<Blob> {
  const doc = await generateUnderlagspaketPDF(input)
  return doc.output('blob')
}

export function underlagspaketFilnamn(participantName: string, from: string, to: string): string {
  const namn = participantName.trim().toLowerCase().replace(/[^a-z0-9åäö]+/g, '-').replace(/^-|-$/g, '') || 'deltagare'
  return `underlag-${namn}-${from}-${to}.pdf`
}

/**
 * Hämtar det paketet behöver och laddar ner PDF:en. Passen läses om ur
 * databasen (inte ur vyns cache) så tabellen visar registreringen nu.
 * Namn och organisation är inte värda att fälla utskriften för — går de inte
 * att läsa står det "-" eller "Namn saknas".
 */
export async function laddaNerUnderlagspaket(args: {
  /** `case_reference` följer med när anroparen har hela planen (RK40). */
  plan: Pick<ActivityPlan, 'id' | 'participant_id' | 'org_id'> & { case_reference?: string | null }
  underlag: UnderlagspaketInput['underlag'] & Pick<PlanHandover, 'handed_over_by'>
  participantName?: string | null
  /** Namnet på den inloggade konsulenten, om det redan finns i klienten. */
  egetNamn?: { id: string; namn: string } | null
}): Promise<void> {
  const { plan, underlag } = args
  const sessions = (await aktivitetsplanApi.listSessions(plan.id, underlag.period_from, underlag.period_to)) as PaketPass[]

  const ids = new Set<string>([plan.participant_id])
  for (const s of sessions) if (s.marked_by) ids.add(s.marked_by)
  if (underlag.handed_over_by) ids.add(underlag.handed_over_by)
  const namn: Record<string, string> = {}
  if (args.egetNamn?.namn.trim()) namn[args.egetNamn.id] = args.egetNamn.namn.trim()
  const { data: profiler, error } = await supabase.from('profiles').select('id, first_name, last_name').in('id', [...ids])
  if (error) console.warn('[underlagspaket] namnen kunde inte läsas', error)
  for (const p of (profiler ?? []) as Array<{ id: string; first_name: string | null; last_name: string | null }>) {
    const n = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
    if (n && !namn[p.id]) namn[p.id] = n
  }

  const medlemskap = await orgApi.myMemberships().catch(() => null)
  const organizationName = plan.org_id && medlemskap
    ? medlemskap.find((m) => m.org_id === plan.org_id)?.organization?.name ?? null
    : null

  const participantName = args.participantName?.trim() || namn[plan.participant_id] || ''
  const doc = await generateUnderlagspaketPDF({
    underlag,
    participantId: plan.participant_id,
    participantName,
    lamnatAv: (underlag.handed_over_by && namn[underlag.handed_over_by]) || STRECK,
    organizationName,
    sessions,
    namn,
    regelverk: medlemskap ? regelverkForPlan(medlemskap, plan.org_id) : null,
    caseReference: plan.case_reference ?? null,
  })
  doc.save(underlagspaketFilnamn(participantName, underlag.period_from, underlag.period_to))
}
