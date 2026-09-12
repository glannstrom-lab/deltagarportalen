/**
 * narvaroIntygPdf — deltagarens eget närvarointyg för en månad (F5, persona-
 * genomgången 2026-09-12).
 *
 * Konsulentens plan-PDF (aktivitetsplanPdf.ts) går till kommunens akt. Det här
 * är deltagarens kvitto: det hon själv kan visa handläggaren på försörjningsstöd
 * utan att gå via konsulenten. Allt innehåll kommer ur passen hon själv får läsa
 * (RLS: participant_id = auth.uid()). Inga påhittade summeringar — ett pass som
 * inte markerats av konsulenten räknas aldrig som närvaro, och det står i intyget.
 *
 * Samma jsPDF-mönster som aktivitetsplanPdf.ts: lazy-laddat, `doc.save()` för
 * nedladdning (aldrig window.open efter await — popup-spärren), vanligt
 * bindestreck i stället för tankstreck (Helvetica skriver inte U+2013/2014).
 */

import type { jsPDF } from 'jspdf'
import type { ActivitySession } from './aktivitetApi'
import { timmar, type ActivityType, type Attendance } from './aktivitetSchema'
import { franvaroAv, type FranvaroOrsak } from './franvaroApi'

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
const MANADER = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'] as const

const TYP_ETIKETT: Record<ActivityType, string> = {
  motivation: 'Motivation och förmåga',
  language: 'Språk',
  jobsearch: 'Jobbsökande',
  workplace: 'Arbetsplatsförlagd',
  jobsearch_own: 'Eget jobbsökande',
}

/** Konsulentens markering — samma ord som i Min vecka. */
const NARVARO_ETIKETT: Record<Attendance, string> = {
  present: 'Närvarande',
  absent_valid: 'Frånvaro, giltig',
  absent_invalid: 'Frånvaro',
  sick_certified: 'Sjuk',
  external: 'Annan aktivitet',
}

const ORSAK_ETIKETT: Record<FranvaroOrsak, string> = {
  sick: 'sjuk',
  child_care: 'vård av barn',
  authority_meeting: 'möte hos myndighet',
  other: 'annat',
}

export interface IntygInput {
  participantName: string
  organizationName?: string | null
  /** 'YYYY-MM' */
  manad: string
  /** Alla pass deltagaren får läsa; filtreras på månaden här. */
  sessions: readonly ActivitySession[]
  /** Dagens datum (ISO), injicerbart för test. */
  idag?: string
}

export function idagIso(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Månaderna från planens start till i dag, senaste först. Högst 12. */
export function valbaraManader(planStart: string, idag: string = idagIso()): string[] {
  const [sy, sm] = planStart.slice(0, 7).split('-').map(Number)
  const [iy, im] = idag.slice(0, 7).split('-').map(Number)
  const ut: string[] = []
  let y = iy
  let m = im
  while ((y > sy || (y === sy && m >= sm)) && ut.length < 12) {
    ut.push(`${y}-${String(m).padStart(2, '0')}`)
    m -= 1
    if (m === 0) {
      m = 12
      y -= 1
    }
  }
  return ut.length > 0 ? ut : [idag.slice(0, 7)]
}


export function manadsEtikett(manad: string): string {
  const [y, m] = manad.split('-').map(Number)
  return `${MANADER[m - 1]} ${y}`
}

function datumSv(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MANADER[m - 1]} ${y}`
}

/** Passen i månaden, i tidsordning. Eget jobbsökande är ingen anvisad aktivitet och tas inte med. */
export function manadensPass(sessions: readonly ActivitySession[], manad: string): ActivitySession[] {
  return [...sessions]
    .filter((s) => s.date.startsWith(manad + '-') && s.activity_type !== 'jobsearch_own')
    .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
}

/**
 * Utfallet på ett pass, i den ordning som betyder något: konsulentens markering
 * vinner; sedan deltagarens egen anmälan; sedan incheckning som konsulenten
 * inte bekräftat; sedan "ej markerat" för passerade pass och "kommande" för resten.
 */
export function utfall(session: ActivitySession, idag: string): string {
  if (session.attendance) return NARVARO_ETIKETT[session.attendance]
  const anm = franvaroAv(session)
  if (anm) return `Anmäld frånvaro (${ORSAK_ETIKETT[anm.reason]})`
  if (session.self_checkin_at) return 'Incheckad, ej bekräftad av konsulent'
  return session.date < idag ? 'Ej markerat' : 'Kommande'
}

export function intygRader(sessions: readonly ActivitySession[], manad: string, idag: string): string[][] {
  return manadensPass(sessions, manad).map((s) => [
    datumSv(s.date),
    `${s.start_time}-${s.end_time}`,
    s.title,
    TYP_ETIKETT[s.activity_type],
    utfall(s, idag),
  ])
}

/** Timmar med konsulentens markering Närvarande. Bara det — inget annat räknas. */
export function narvaroTimmar(sessions: readonly ActivitySession[], manad: string): number {
  const sum = manadensPass(sessions, manad)
    .filter((s) => s.attendance === 'present')
    .reduce((acc, s) => acc + timmar(s.start_time, s.end_time), 0)
  return Math.round(sum * 10) / 10
}

export function antalPerUtfall(sessions: readonly ActivitySession[], manad: string, idag: string): Record<string, number> {
  const r: Record<string, number> = {}
  for (const s of manadensPass(sessions, manad)) {
    const u = utfall(s, idag)
    r[u] = (r[u] ?? 0) + 1
  }
  return r
}

export async function generateNarvaroIntygPDF(input: IntygInput): Promise<jsPDF> {
  const jsPDFClass = await loadPDFLibraries()
  const { default: autoTable } = autoTableModule!
  const idag = input.idag ?? idagIso()
  const { participantName, organizationName, manad, sessions } = input

  const doc = new jsPDFClass('p', 'mm', 'a4')
  const bredd = doc.internal.pageSize.getWidth()
  const hojd = doc.internal.pageSize.getHeight()
  const marg = 20
  let y = marg

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(`Närvarointyg ${manadsEtikett(manad)}`, marg, y)
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  autoTable(doc, {
    startY: y,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
    body: [
      ['Deltagare', participantName.trim() || STRECK],
      ['Organisation', organizationName?.trim() || STRECK],
      ['Period', manadsEtikett(manad)],
      ['Genererat', `${datumSv(idag)} ur Jobin, av deltagaren själv`],
    ],
    margin: { left: marg, right: marg },
  })
  y = doc.lastAutoTable.finalY + 8

  const rader = intygRader(sessions, manad, idag)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Anvisade aktiviteter', marg, y)
  y += 4
  if (rader.length === 0) {
    y += 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Inga anvisade aktiviteter är registrerade för den här månaden.', marg, y)
    y += 8
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Datum', 'Tid', 'Aktivitet', 'Typ', 'Utfall']],
      body: rader,
      styles: { fontSize: 9, cellPadding: 1.5 },
      headStyles: { fillColor: [68, 83, 78], textColor: 255 },
      margin: { left: marg, right: marg },
    })
    y = doc.lastAutoTable.finalY + 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const per = antalPerUtfall(sessions, manad, idag)
    doc.text(`Närvaro som konsulenten markerat: ${narvaroTimmar(sessions, manad)} timmar.`, marg, y)
    y += 5
    const summering = Object.entries(per).map(([u, n]) => `${u}: ${n}`).join(', ')
    const sumRader = doc.splitTextToSize(`Pass per utfall: ${summering}.`, bredd - marg * 2) as string[]
    doc.text(sumRader, marg, y)
    y += sumRader.length * 5 + 3
  }

  if (y + 30 > hojd - 25) {
    doc.addPage()
    y = marg
  }
  y += 6
  doc.setFontSize(9)
  const not = doc.splitTextToSize(
    'Intyget bygger på det som finns registrerat i Jobin. Bara pass som arbetskonsulenten markerat som Närvarande räknas som närvaro; pass utan markering är inte bedömda. Arbetskonsulenten kan bekräfta uppgifterna på begäran.',
    bredd - marg * 2,
  ) as string[]
  doc.text(not, marg, y)

  const sidor = doc.getNumberOfPages()
  for (let i = 1; i <= sidor; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(110)
    doc.text(`Genererat från jobin.se ${idag}. Beslut om försörjningsstöd fattas av socialnämnden.`, marg, hojd - 12)
    doc.text(`Sida ${i} av ${sidor}`, bredd - marg, hojd - 12, { align: 'right' })
    doc.setTextColor(0)
  }
  return doc
}

export async function generateNarvaroIntygBlob(input: IntygInput): Promise<Blob> {
  const doc = await generateNarvaroIntygPDF(input)
  return doc.output('blob')
}

export async function downloadNarvaroIntygPDF(input: IntygInput): Promise<void> {
  const doc = await generateNarvaroIntygPDF(input)
  const namn = input.participantName.trim().toLowerCase().replace(/[^a-z0-9åäö]+/g, '-').replace(/^-|-$/g, '') || 'deltagare'
  doc.save(`narvarointyg-${namn}-${input.manad}.pdf`)
}
