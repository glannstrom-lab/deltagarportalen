/**
 * manadsunderlagPdf — underlag per stödmånad (RK39, rollspelet 2026-09-27).
 *
 * Aktivitetskravet tillämpas på stödet för en kalendermånad: försörjningsstöd
 * som avser oktober 2026 prövas mot hur oktober gick. "Lämna underlag" gällde
 * en valfri period (senaste månaden bakåt från i dag), så handläggaren fick
 * 27 aug–26 sep när beslutet gäller september. Det här är EN deltagare och EN
 * kalendermånad, med ISO-veckonummer — kommunen planerar i veckonummer (RK27).
 *
 * Innehåll: månadens sammanfattning (samma räkning som "Lämna underlag",
 * sammanfattaNarvaro), en rad per vecka som berör månaden (veckor som går över
 * månadsskiftet räknas bara för dagarna i månaden, och det står), och varje
 * pass dag för dag med utfall, intyg, anteckning, deltagarens förklaring och
 * vem som markerat. Samma hjälpfunktioner som underlagspaketet — inga egna
 * etiketter för samma sak.
 *
 * Ett värde utan underlag skrivs "-" med en rad om varför (CLAUDE.md,
 * 2026-08-09). Ingen AI. Svenska literaler (DESIGN.md §2). jsPDF lazy-laddas,
 * `doc.save()` (aldrig window.open efter await), bindestreck i stället för
 * tankstreck (Helvetica skriver inte U+2013/2014).
 */

import type { jsPDF } from 'jspdf'
import { supabase } from '@/lib/supabase'
import { aktivitetsplanApi, sammanfattaNarvaro, type ActivityPlan } from './aktivitetApi'
import { addDays, arAnvisad, arNarvaro, isoVeckonummer, timmar, veckansMandag, type PassTyp } from './aktivitetSchema'
import { manadGranser } from './aktivitetslogg'
import { forklaringAv } from './franvaroApi'
import { orgApi } from './orgApi'
import { regelverkForPlan } from '@/components/consultant/orgTypVisning'
import { ARENDE_ETIKETT, PLAN_PASS_KOLUMNER_FINNS } from './planMarkning'
import {
  intygStatus,
  markeradAv,
  paketAnteckning,
  paketUtfall,
  periodensPass,
  sammanfattningRader,
  tidpunkt,
  type PaketPass,
} from './underlagspaketPdf'

import { anvandareFranSession } from '@/lib/anvandareFranSession'
const STRECK = '-'
const MANAD_NAMN = ['', 'januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december']
const MANAD_KORT = ['', 'jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
const VECKODAGAR = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'] as const

/** "oktober 2026" för `2026-10`. */
export function manadEtikett(ym: string): string {
  const [ar, manad] = ym.split('-').map(Number)
  return `${MANAD_NAMN[manad]} ${ar}`
}

/** Innevarande månad och de tolv före, nyast först — samma val som avtalsloggen. */
export function stodmanadAlternativ(idag: Date): { value: string; label: string }[] {
  const ut: { value: string; label: string }[] = []
  for (let i = 0; i < 13; i++) {
    const d = new Date(idag.getFullYear(), idag.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    ut.push({ value, label: manadEtikett(value) })
  }
  return ut
}

function kortDag(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${d} ${MANAD_KORT[m]}`
}

export interface ManadsVecka {
  vecka: number
  mandag: string
  /** Veckans första och sista dag INOM månaden. */
  fran: string
  till: string
  /** Veckan går över månadsskiftet — bara dagarna i månaden räknas. */
  delvis: boolean
}

/** ISO-veckorna som berör månaden, klippta till månadens dagar. */
export function manadensVeckor(ym: string): ManadsVecka[] {
  const { from, to } = manadGranser(ym)
  const ut: ManadsVecka[] = []
  for (let mandag = veckansMandag(from); mandag <= to; mandag = addDays(mandag, 7)) {
    const sondag = addDays(mandag, 6)
    const fran = mandag < from ? from : mandag
    const till = sondag > to ? to : sondag
    ut.push({ vecka: isoVeckonummer(mandag), mandag, fran, till, delvis: fran !== mandag || till !== sondag })
  }
  return ut
}

type ManadsPass = PaketPass & { activity_type: PassTyp }

function timText(h: number): string {
  return String(Math.round(h * 10) / 10).replace('.', ',')
}

/**
 * En rad per vecka: Vecka | Dagar | Pass | Närvaro anvisat h | Eget jobbsökande kvitterat h |
 * Giltig | Ogiltig | Sjuk med intyg | Sjuk utan intyg | Ej markerade.
 * Timmarna räknar bara närvaro (närvarande/annan aktivitet) — samma regel som
 * veckosaldot. En vecka utan pass får "-" i timkolumnerna, aldrig 0 h.
 */
export function veckoRader(sessions: readonly ManadsPass[], ym: string): string[][] {
  return manadensVeckor(ym).map((v) => {
    const veckans = sessions.filter((s) => s.date >= v.fran && s.date <= v.till)
    const s = sammanfattaNarvaro(veckans, v.fran, v.till)
    const anvisat = veckans.filter((p) => arAnvisad(p) && arNarvaro(p.attendance)).reduce((sum, p) => sum + timmar(p.start_time, p.end_time), 0)
    const eget = veckans.filter((p) => p.activity_type === 'jobsearch_own' && arNarvaro(p.attendance)).reduce((sum, p) => sum + timmar(p.start_time, p.end_time), 0)
    const tom = veckans.length === 0
    return [
      `v. ${v.vecka}`,
      `${kortDag(v.fran)} - ${kortDag(v.till)}${v.delvis ? ' (del av veckan)' : ''}`,
      String(s.pass),
      tom ? STRECK : timText(anvisat),
      tom ? STRECK : timText(eget),
      String(s.absent_valid),
      String(s.absent_invalid),
      String(s.sick_certified),
      String(s.sjuk_utan_intyg),
      String(s.omarkerade),
    ]
  })
}

function datumMedVeckodag(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`)
  return `${VECKODAGAR[d.getUTCDay()]} ${d.getUTCDate()} ${MANAD_KORT[d.getUTCMonth() + 1]}`
}

/** Konsulentens anteckning, deltagarens anmälan och deltagarens förklaring i efterhand. */
export function manadsAnteckning(s: ManadsPass): string {
  const delar: string[] = []
  const bas = paketAnteckning(s)
  if (bas !== STRECK) delar.push(bas)
  const forklaring = forklaringAv(s)
  if (forklaring) delar.push(`Deltagarens förklaring${forklaring.at ? ` ${tidpunkt(forklaring.at)}` : ''}: ${forklaring.text}`)
  return delar.length ? delar.join('\n') : STRECK
}

/** Passen i månaden, dag för dag: Vecka | Datum | Tid | Aktivitet | Utfall | Intyg | Anteckning | Markerat av | Markerat. */
export function passRader(sessions: readonly ManadsPass[], ym: string, participantId: string, namn: Readonly<Record<string, string>>): string[][] {
  const { from, to } = manadGranser(ym)
  return periodensPass(sessions, from, to).map((s) => [
    String(isoVeckonummer(s.date)),
    datumMedVeckodag(s.date),
    `${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)}`,
    s.title,
    paketUtfall(s),
    intygStatus(s),
    manadsAnteckning(s),
    markeradAv(s, participantId, namn),
    s.marked_at ? tidpunkt(s.marked_at) : STRECK,
  ])
}

export interface ManadsunderlagInput {
  ym: string
  plan: Pick<ActivityPlan, 'id' | 'participant_id' | 'start_date' | 'end_date' | 'weekly_hours_target' | 'jobsearch_hours_per_week'> & { case_reference?: string | null }
  participantName: string
  /** Den som tar fram underlaget. */
  framtagetAv: string
  organizationName?: string | null
  sessions: readonly ManadsPass[]
  namn: Readonly<Record<string, string>>
  regelverk?: 'kommun' | 'leverantor' | null
  /** Visa ärendenumret (RK40) — standard: när kolumnen finns. */
  visaArende?: boolean
  nu?: Date
}

function datumLang(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MANAD_KORT[m]} ${y}`
}

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

export async function generateManadsunderlagPDF(input: ManadsunderlagInput): Promise<jsPDF> {
  const jsPDFClass = await loadPDFLibraries()
  const { default: autoTable } = autoTableModule!
  const nu = input.nu ?? new Date()
  const { from, to } = manadGranser(input.ym)

  const doc = new jsPDFClass('l', 'mm', 'a4')
  const bredd = doc.internal.pageSize.getWidth()
  const hojd = doc.internal.pageSize.getHeight()
  const marg = 15
  let y = marg + 2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(`Underlag om närvaro - stödmånad ${manadEtikett(input.ym)}`, marg, y)
  y += 8

  const { plan } = input
  const mal = Number(plan.weekly_hours_target)
  const egen = Number(plan.jobsearch_hours_per_week) || 0
  const visaArende = input.visaArende ?? PLAN_PASS_KOLUMNER_FINNS
  autoTable(doc, {
    startY: y,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    body: [
      ['Deltagare', input.participantName.trim() || STRECK],
      ['Organisation', input.organizationName?.trim() || STRECK],
      ...(visaArende
        ? [[input.regelverk === 'leverantor' ? ARENDE_ETIKETT.leverantor : ARENDE_ETIKETT.kommun, plan.case_reference?.trim() || STRECK]]
        : []),
      ['Stödmånad', `${manadEtikett(input.ym)} (${datumLang(from)} - ${datumLang(to)})`],
      ['Planens period', `${datumLang(plan.start_date)} - ${plan.end_date ? datumLang(plan.end_date) : 'tills vidare'}`],
      ['Veckomål i planen', Number.isFinite(mal) && mal > 0
        ? `${timText(mal)} timmar per vecka, varav ${timText(egen)} timmar eget jobbsökande`
        : `${STRECK} (inget veckomål i planen)`],
      ['Framtaget', `${tidpunkt(nu.toISOString())} av ${input.framtagetAv.trim() || STRECK}`],
    ],
    margin: { left: marg, right: marg },
  })
  y = doc.lastAutoTable.finalY + 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Sammanfattning för månaden', marg, y)
  y += 2
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 0.9 },
    columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 40 } },
    body: sammanfattningRader(sammanfattaNarvaro(input.sessions, from, to)),
    margin: { left: marg, right: marg },
    tableWidth: 110,
  })
  y = doc.lastAutoTable.finalY + 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Vecka för vecka', marg, y)
  y += 2
  autoTable(doc, {
    startY: y,
    head: [['Vecka', 'Dagar i månaden', 'Pass', 'Närvaro anvisat (h)', 'Eget jobbsökande kvitterat (h)', 'Giltig frånvaro', 'Ogiltig frånvaro', 'Sjuk med intyg', 'Sjuk utan intyg', 'Ej markerade']],
    body: veckoRader(input.sessions, input.ym),
    styles: { fontSize: 8, cellPadding: 1.2 },
    headStyles: { fillColor: [68, 83, 78], textColor: 255 },
    margin: { left: marg, right: marg },
  })
  y = doc.lastAutoTable.finalY + 6

  const rader = passRader(input.sessions, input.ym, plan.participant_id, input.namn)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  if (y + 20 > hojd - 12) {
    doc.addPage()
    y = marg
  }
  doc.text('Pass dag för dag', marg, y)
  y += 2
  if (rader.length === 0) {
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Inga pass är registrerade i månaden.', marg, y)
    y += 6
  } else {
    autoTable(doc, {
      startY: y,
      head: [['V.', 'Datum', 'Tid', 'Aktivitet', 'Utfall', 'Intyg', 'Anteckning', 'Markerat av', 'Markerat']],
      body: rader,
      styles: { fontSize: 8, cellPadding: 1.2, valign: 'top' },
      headStyles: { fillColor: [68, 83, 78], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 9 }, 1: { cellWidth: 20 }, 2: { cellWidth: 20 }, 3: { cellWidth: 38 }, 4: { cellWidth: 30 },
        5: { cellWidth: 18 }, 6: { cellWidth: 72 }, 7: { cellWidth: 32 }, 8: { cellWidth: 28 },
      },
      margin: { left: marg, right: marg },
    })
    y = doc.lastAutoTable.finalY + 6
  }

  if (y + 14 > hojd - 12) {
    doc.addPage()
    y = marg
  }
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const idag = `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, '0')}-${String(nu.getDate()).padStart(2, '0')}`
  const pagaende = to >= idag
    ? ' Månaden är inte slut: pass efter utskriften är planerade och inte bedömda.'
    : ''
  const beslut = input.regelverk === 'kommun'
    ? ' Beslut om försörjningsstöd, och om eventuell nedsättning, fattas av socialnämnden.'
    : input.regelverk === 'leverantor'
      ? ' Beslut om ersättning fattas av Arbetsförmedlingen.'
      : ''
  const not = doc.splitTextToSize(
    'Underlaget är en sammanställning av det som registrerats i Jobin, inte ett beslut. Bara pass som arbetskonsulenten markerat är bedömda; "Ej markerat" betyder att ingen bedömning gjorts. Veckor som går över månadsskiftet räknas bara för dagarna i månaden.' + pagaende + beslut,
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

export function manadsunderlagFilnamn(participantName: string, ym: string): string {
  const namn = participantName.trim().toLowerCase().replace(/[^a-z0-9åäö]+/g, '-').replace(/^-|-$/g, '') || 'deltagare'
  return `manadsunderlag-${namn}-${ym}.pdf`
}

/**
 * Hämtar månadens pass färskt ur databasen (inte ur en cache) och laddar ner
 * PDF:en. Namn och organisation fäller inte utskriften — går de inte att läsa
 * står det "-" eller "Namn saknas". Kastar när passen inte kan hämtas.
 */
export async function laddaNerManadsunderlag(args: {
  plan: ManadsunderlagInput['plan'] & Pick<ActivityPlan, 'org_id'>
  ym: string
  participantName?: string | null
}): Promise<void> {
  const { plan, ym } = args
  const { from, to } = manadGranser(ym)
  const sessions = (await aktivitetsplanApi.listSessions(plan.id, from, to)) as ManadsPass[]

  const { data: { user } } = await anvandareFranSession()
  const ids = new Set<string>([plan.participant_id])
  if (user) ids.add(user.id)
  for (const s of sessions) if (s.marked_by) ids.add(s.marked_by)
  const namn: Record<string, string> = {}
  const { data: profiler, error } = await supabase.from('profiles').select('id, first_name, last_name').in('id', [...ids])
  if (error) console.warn('[manadsunderlag] namnen kunde inte läsas', error)
  for (const p of (profiler ?? []) as Array<{ id: string; first_name: string | null; last_name: string | null }>) {
    const n = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
    if (n) namn[p.id] = n
  }

  const medlemskap = await orgApi.myMemberships().catch(() => null)
  const organizationName = plan.org_id && medlemskap
    ? medlemskap.find((m) => m.org_id === plan.org_id)?.organization?.name ?? null
    : null
  const participantName = args.participantName?.trim() || namn[plan.participant_id] || ''

  const doc = await generateManadsunderlagPDF({
    ym,
    plan,
    participantName,
    framtagetAv: (user && namn[user.id]) || STRECK,
    organizationName,
    sessions,
    namn,
    regelverk: medlemskap ? regelverkForPlan(medlemskap, plan.org_id) : null,
  })
  doc.save(manadsunderlagFilnamn(participantName, ym))
}
