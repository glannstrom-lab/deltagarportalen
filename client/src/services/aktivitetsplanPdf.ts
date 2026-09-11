/**
 * aktivitetsplanPdf — den individuella planen för aktivitet som PDF (KM5).
 *
 * Lagen (SoL 12 kap.) kräver en individuell plan för aktiviteterna där tiden
 * för eget jobbsökande framgår. Det här är ett myndighetsdokument som går till
 * akten i kommunens verksamhetssystem: allt innehåll kommer ur planen,
 * mallen och konsulentens egen text. Ingen AI-text, inga påhittade tal —
 * ett tomt fält skrivs som `-` (se STRECK nedan om varför inte `—`).
 *
 * jsPDF + autotable lazy-laddas som i pdfReportGenerator.ts.
 */

import type { jsPDF } from 'jspdf'
import type { ActivityPlan, ActivitySession } from './aktivitetApi'
import { FORSORJNINGSHINDER_ETIKETT } from './aktivitetApi'
import { addDays, isoWeekday, timmar, veckansMandag, type ActivityType } from './aktivitetSchema'

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

/** Samma etiketter som i konsulentvyn; dubbleras här så services/ inte importerar components/. */
const TYP_ETIKETT: Record<ActivityType, string> = {
  motivation: 'Motivation och förmåga',
  language: 'Språk',
  jobsearch: 'Jobbsökande',
  workplace: 'Arbetsplatsförlagd',
  jobsearch_own: 'Eget jobbsökande',
}
const VECKODAG = ['', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'] as const

export interface PlanPdfInput {
  plan: ActivityPlan
  /** Alla pass i planen — första hela veckan med pass blir veckoschemat. */
  sessions: readonly ActivitySession[]
  participantName: string
  consultantName: string
  organizationName?: string | null
}

// jsPDF med standardfonten Helvetica SKRIVER INTE tankstreck (U+2013/U+2014):
// cellen blir `() Tj`, alltså tom. Uppmätt 2026-09-11 i byteströmmen. Därför
// vanligt bindestreck här, trots att UI:t använder `—`.
const STRECK = '-'

function tomt(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return STRECK
  const s = String(v).trim()
  return s === '' ? STRECK : s
}

function datumSv(s: string | null): string {
  if (!s) return STRECK
  const [y, m, d] = s.split('-').map(Number)
  return `${d} ${['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'][m - 1]} ${y}`
}

function idagIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Veckoschemat: passen i den första veckan (mån–sön) som har minst ett pass.
 * Det är den vecka mallen gav upphov till; senare veckor kan vara ändrade
 * ett och ett, och då är det passen, inte mallen, som är planen.
 */
export function forstaVeckansPass(sessions: readonly ActivitySession[]): ActivitySession[] {
  if (sessions.length === 0) return []
  const sorterade = [...sessions].sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
  const mandag = veckansMandag(sorterade[0].date)
  const sondag = addDays(mandag, 6)
  return sorterade.filter((s) => s.date >= mandag && s.date <= sondag)
}

export function veckoschemaRader(sessions: readonly ActivitySession[]): string[][] {
  return forstaVeckansPass(sessions).map((s) => [
    VECKODAG[isoWeekday(s.date)],
    `${s.start_time}-${s.end_time}`,
    s.title,
    TYP_ETIKETT[s.activity_type],
    tomt(s.location),
  ])
}

export async function generateAktivitetsplanPDF(input: PlanPdfInput): Promise<jsPDF> {
  const jsPDFClass = await loadPDFLibraries()
  const { default: autoTable } = autoTableModule!
  const { plan, sessions, participantName, consultantName, organizationName } = input

  const doc = new jsPDFClass('p', 'mm', 'a4')
  const bredd = doc.internal.pageSize.getWidth()
  const hojd = doc.internal.pageSize.getHeight()
  const marg = 20
  let y = marg

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Individuell plan för aktivitet enligt socialtjänstlagen 12 kap.', marg, y, { maxWidth: bredd - marg * 2 })
  y += 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const uppgifter: Array<[string, string]> = [
    ['Deltagare', tomt(participantName)],
    ['Arbetskonsulent', tomt(consultantName)],
    ['Organisation', tomt(organizationName)],
    ['Schemamall', tomt(plan.template_name)],
    ['Period', `${datumSv(plan.start_date)} - ${plan.end_date ? datumSv(plan.end_date) : 'tills vidare'}`],
    ['Veckomål', `${Number(plan.weekly_hours_target)} timmar per vecka`],
    ['Motivering till veckomålet', tomt(plan.target_reason)],
    ['Tid för eget jobbsökande', `${Number(plan.jobsearch_hours_per_week)} timmar per vecka`],
    ['Försörjningshinder', plan.forsorjningshinder ? FORSORJNINGSHINDER_ETIKETT[plan.forsorjningshinder] : STRECK],
    ['Beslutsdatum', datumSv(plan.decided_at)],
    ['Status', { active: 'Aktiv', paused: 'Pausad', ended: 'Avslutad' }[plan.status]],
  ]

  autoTable(doc, {
    startY: y,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    body: uppgifter,
    margin: { left: marg, right: marg },
  })
  y = doc.lastAutoTable.finalY + 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Planen', marg, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const planText = tomt(plan.plan_text)
  const rader = doc.splitTextToSize(planText, bredd - marg * 2) as string[]
  doc.text(rader, marg, y)
  y += rader.length * 5 + 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Veckoschema', marg, y)
  y += 4
  const schema = veckoschemaRader(sessions)
  if (schema.length === 0) {
    y += 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Inga pass är planerade än.', marg, y)
    y += 8
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Dag', 'Tid', 'Aktivitet', 'Typ', 'Plats']],
      body: schema,
      styles: { fontSize: 9, cellPadding: 1.5 },
      headStyles: { fillColor: [68, 83, 78], textColor: 255 },
      margin: { left: marg, right: marg },
    })
    y = doc.lastAutoTable.finalY + 6
    const veckotimmar = forstaVeckansPass(sessions)
      .filter((s) => s.activity_type !== 'jobsearch_own')
      .reduce((sum, s) => sum + timmar(s.start_time, s.end_time), 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Planerad anvisad aktivitet: ${Math.round(veckotimmar * 10) / 10} timmar per vecka.`, marg, y)
    y += 8
  }

  // Signaturer
  if (y + 40 > hojd - 25) {
    doc.addPage()
    y = marg
  }
  y += 12
  doc.setFontSize(10)
  const kolumn = (bredd - marg * 2 - 10) / 2
  doc.line(marg, y, marg + kolumn, y)
  doc.line(marg + kolumn + 10, y, bredd - marg, y)
  y += 5
  doc.text('Deltagare, underskrift och datum', marg, y)
  doc.text('Handläggare, underskrift och datum', marg + kolumn + 10, y)

  // Sidfot på varje sida
  const sidor = doc.getNumberOfPages()
  for (let i = 1; i <= sidor; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(110)
    doc.text(
      `Utskriven från jobin.se ${idagIso()}. Beslut om försörjningsstöd fattas av socialnämnden.`,
      marg,
      hojd - 12,
    )
    doc.text(`Sida ${i} av ${sidor}`, bredd - marg, hojd - 12, { align: 'right' })
    doc.setTextColor(0)
  }

  return doc
}

export async function generateAktivitetsplanBlob(input: PlanPdfInput): Promise<Blob> {
  const doc = await generateAktivitetsplanPDF(input)
  return doc.output('blob')
}

export async function downloadAktivitetsplanPDF(input: PlanPdfInput): Promise<void> {
  const doc = await generateAktivitetsplanPDF(input)
  const namn = input.participantName.trim().toLowerCase().replace(/[^a-z0-9åäö]+/g, '-').replace(/^-|-$/g, '') || 'deltagare'
  doc.save(`aktivitetsplan-${namn}-${idagIso()}.pdf`)
}
