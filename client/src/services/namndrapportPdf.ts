/**
 * namndrapportPdf — "Nämndrapport (kvartal)" ur aktivitetskravet (F17, 2026-09-13).
 *
 * Det nämnden frågar efter är inte kohortanalys utan, per kvartal och
 * försörjningshinder: hur många deltagare hade en plan, hur stor del av de
 * bedömda passen var närvaro, hur mycket frånvaro var anmäld respektive
 * oanmäld, och hur många underlag lämnades till handläggaren. Det är en
 * RÄKNING ur portalens planer och pass — beslut om nedsättning fattas av
 * socialnämnden och registreras i kommunens verksamhetssystem, precis som
 * IVO-underlaget (`ivoKvartal.ts`) säger.
 *
 * Regler (så att en siffra aldrig uppstår ur tomhet):
 *   deltagare_med_plan   unika deltagare med en plan som var aktiv någon dag i kvartalet
 *   pass_bedomda         pass i kvartalet med satt närvaro (bara konsulenten sätter den)
 *   narvarograd          närvarande (present/external) ÷ pass_bedomda — `null` när inget
 *                        pass är bedömt; PDF:en skriver "—" och förklarar varför
 *   franvaro_anmald      pass som deltagaren anmält (F1: `absence_reported_at`) eller som
 *                        konsulenten bedömt giltiga (absent_valid, sick_certified)
 *   franvaro_oanmald     absent_invalid utan föregående anmälan
 *   underlag_lamnat      planer med `nedsattning_underlag_lamnat_at` i kvartalet — SAMMA
 *                        källa som IVO-underlaget. När det spårbara underlagsflödet
 *                        (F10, egen tabell) finns byts `underlagLamnatIKvartal()` — det
 *                        är det enda stället.
 *
 * Ren logik + jsPDF. Svenska literaler: konsulentvyn översätts inte (DESIGN.md §2).
 */

import type { ActivityPlan, ActivitySession, Forsorjningshinder } from './aktivitetApi'
import { FORSORJNINGSHINDER, FORSORJNINGSHINDER_ETIKETT } from './aktivitetApi'
import { EJ_ANGIVET_ETIKETT, kvartalForDatum, kvartalGranser, planAktivIPeriod, type Kvartal, type KvartalGranser, type KvartalVal } from './ivoKvartal'

type PlanFalt = Pick<ActivityPlan, 'id' | 'participant_id' | 'start_date' | 'end_date' | 'forsorjningshinder' | 'nedsattning_underlag_lamnat_at'>
/** `absence_reported_at` kom med F1 (migration 20260913002000) — typen i aktivitetApi bär den inte än, raden gör det. */
type PassFalt = Pick<ActivitySession, 'plan_id' | 'date' | 'attendance'> & { absence_reported_at?: string | null }

export interface NamndRad {
  nyckel: Forsorjningshinder | 'ej_angivet'
  etikett: string
  deltagare_med_plan: number
  pass_bedomda: number
  /** Procent 0–100, eller null när inget pass är bedömt. */
  narvarograd: number | null
  franvaro_anmald: number
  franvaro_oanmald: number
  underlag_lamnat: number
}

export interface Namndrapport {
  ar: number
  kvartal: Kvartal
  from: string
  to: string
  rader: NamndRad[]
  summa: Omit<NamndRad, 'nyckel' | 'etikett'>
}

const NARVARANDE = new Set(['present', 'external'])
const GILTIG = new Set(['absent_valid', 'sick_certified'])

/** Enda stället som avgör "underlag lämnat" — byts när F10:s spårbara flöde finns. */
export function underlagLamnatIKvartal(plan: Pick<ActivityPlan, 'nedsattning_underlag_lamnat_at'>, { from, to }: KvartalGranser): boolean {
  const d = plan.nedsattning_underlag_lamnat_at
  return d !== null && d !== undefined && d >= from && d <= to
}

/** Innevarande och föregående kvartal relativt ett datum (`YYYY-MM-DD`). */
export function kvartalsval(idag: string): { innevarande: KvartalVal; foregaende: KvartalVal } {
  const nu = kvartalForDatum(idag)
  const foregaende: KvartalVal = nu.kvartal === 1 ? { ar: nu.ar - 1, kvartal: 4 } : { ar: nu.ar, kvartal: (nu.kvartal - 1) as Kvartal }
  return { innevarande: nu, foregaende }
}

export function kvartalEtikett({ ar, kvartal }: KvartalVal): string {
  const g = kvartalGranser(ar, kvartal)
  return `Kvartal ${kvartal} ${ar} (${g.from} – ${g.to})`
}

export function namndrapportUnderlag(plans: readonly PlanFalt[], sessions: readonly PassFalt[], val: KvartalVal): Namndrapport {
  const granser = kvartalGranser(val.ar, val.kvartal)
  const aktiva = plans.filter((p) => planAktivIPeriod(p, granser))
  const planKategori = new Map<string, Forsorjningshinder | 'ej_angivet'>()
  for (const p of aktiva) planKategori.set(p.id, p.forsorjningshinder ?? 'ej_angivet')

  const iKvartalet = sessions.filter((s) => s.date >= granser.from && s.date <= granser.to && planKategori.has(s.plan_id))

  const nycklar: Array<Forsorjningshinder | 'ej_angivet'> = [...FORSORJNINGSHINDER, 'ej_angivet']
  const rader: NamndRad[] = nycklar.map((nyckel) => {
    const planer = aktiva.filter((p) => (p.forsorjningshinder ?? 'ej_angivet') === nyckel)
    const pass = iKvartalet.filter((s) => planKategori.get(s.plan_id) === nyckel)
    const bedomda = pass.filter((s) => s.attendance !== null && s.attendance !== undefined)
    const narvarande = bedomda.filter((s) => NARVARANDE.has(s.attendance as string)).length
    const anmald = pass.filter((s) => (s.absence_reported_at ?? null) !== null || GILTIG.has(s.attendance as string)).length
    const oanmald = pass.filter((s) => s.attendance === 'absent_invalid' && (s.absence_reported_at ?? null) === null).length
    return {
      nyckel,
      etikett: nyckel === 'ej_angivet' ? EJ_ANGIVET_ETIKETT : FORSORJNINGSHINDER_ETIKETT[nyckel],
      deltagare_med_plan: new Set(planer.map((p) => p.participant_id)).size,
      pass_bedomda: bedomda.length,
      narvarograd: bedomda.length === 0 ? null : Math.round((narvarande / bedomda.length) * 100),
      franvaro_anmald: anmald,
      franvaro_oanmald: oanmald,
      underlag_lamnat: planer.filter((p) => underlagLamnatIKvartal(p, granser)).length,
    }
  })

  const summaBedomda = rader.reduce((a, r) => a + r.pass_bedomda, 0)
  const summaNarvarande = rader.reduce((a, r) => a + (r.narvarograd === null ? 0 : Math.round((r.narvarograd / 100) * r.pass_bedomda)), 0)
  const alla = new Set(aktiva.map((p) => p.participant_id))
  const summa = {
    deltagare_med_plan: alla.size,
    pass_bedomda: summaBedomda,
    narvarograd: summaBedomda === 0 ? null : Math.round((summaNarvarande / summaBedomda) * 100),
    franvaro_anmald: rader.reduce((a, r) => a + r.franvaro_anmald, 0),
    franvaro_oanmald: rader.reduce((a, r) => a + r.franvaro_oanmald, 0),
    underlag_lamnat: rader.reduce((a, r) => a + r.underlag_lamnat, 0),
  }
  return { ar: val.ar, kvartal: val.kvartal, from: granser.from, to: granser.to, rader, summa }
}

export interface NamndrapportMeta {
  organisation: string | null
  konsulentNamn?: string
  /** `YYYY-MM-DD` — skickas in så tester och PDF:en säger samma datum. */
  datum: string
}

const STRECK = '—'

/** Raderna som hamnar i tabellen — exporterad så testet kan kontrollera dem utan PDF. */
export function tabellRader(u: Namndrapport, medTomma = false): string[][] {
  const rad = (etikett: string, r: Omit<NamndRad, 'nyckel' | 'etikett'>): string[] => [
    etikett,
    String(r.deltagare_med_plan),
    String(r.pass_bedomda),
    r.narvarograd === null ? STRECK : `${r.narvarograd} %`,
    String(r.franvaro_anmald),
    String(r.franvaro_oanmald),
    String(r.underlag_lamnat),
  ]
  const synliga = u.rader.filter((r) => medTomma || r.deltagare_med_plan > 0)
  return [...synliga.map((r) => rad(r.etikett, r)), rad('Summa', u.summa)]
}

let jsPDFModule: typeof import('jspdf') | null = null
let autoTableModule: typeof import('jspdf-autotable') | null = null
async function laddaPdf() {
  if (!jsPDFModule || !autoTableModule) {
    const [a, b] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
    jsPDFModule = a
    autoTableModule = b
  }
  return { jsPDF: jsPDFModule.jsPDF, autoTable: autoTableModule.default }
}

export async function generateNamndrapportDoc(u: Namndrapport, meta: NamndrapportMeta) {
  const { jsPDF, autoTable } = await laddaPdf()
  const doc = new jsPDF('l', 'mm', 'a4')
  const bredd = doc.internal.pageSize.getWidth()
  const marginal = 15
  const org = meta.organisation ?? STRECK

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Nämndrapport – aktivitetskravet', marginal, 20)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(kvartalEtikett({ ar: u.ar, kvartal: u.kvartal }), marginal, 28)
  doc.setFontSize(9)
  doc.text(`Organisation: ${org}`, bredd - marginal, 20, { align: 'right' })
  doc.text(`Framtagen: ${meta.datum}${meta.konsulentNamn ? ` av ${meta.konsulentNamn}` : ''}`, bredd - marginal, 26, { align: 'right' })

  const harTommaRader = u.rader.some((r) => r.deltagare_med_plan === 0)
  autoTable(doc, {
    startY: 36,
    head: [['Försörjningshinder', 'Deltagare med plan', 'Bedömda pass', 'Närvarograd', 'Anmäld frånvaro', 'Oanmäld frånvaro', 'Underlag lämnat']],
    body: tabellRader(u),
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [47, 93, 80], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 60 } },
    didParseCell: (data) => {
      if (data.row.index === tabellRader(u).length - 1) data.cell.styles.fontStyle = 'bold'
    },
  })

  const efterTabell = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 80
  let y = efterTabell + 8
  doc.setFontSize(9)
  const rader = [
    'Läsanvisning: "Deltagare med plan" = unika personer med en aktivitetsplan som var aktiv någon dag i kvartalet.',
    '"Bedömda pass" = pass där konsulenten satt närvaro. "Närvarograd" = närvarande (inkl. extern aktivitet) delat med bedömda pass.',
    '"Anmäld frånvaro" = pass deltagaren själv anmält förhinder för, eller som bedömts som giltig frånvaro/sjuk med intyg.',
    '"Oanmäld frånvaro" = pass bedömda som ogiltig frånvaro utan föregående anmälan. "Underlag lämnat" = underlag till handläggare daterat i kvartalet.',
    ...(harTommaRader ? ['Försörjningshinder utan deltagare i kvartalet visas inte. "—" = inga bedömda pass, därför ingen närvarograd.'] : [STRECK + ' = inga bedömda pass, därför ingen närvarograd.']),
    `Källa: ur Jobin, ${meta.datum}, ${org}. Räkning ur planer och pass. Beslut om nekande eller nedsättning fattas av socialnämnden och registreras i kommunens verksamhetssystem, inte här.`,
  ]
  for (const r of rader) {
    const brutna = doc.splitTextToSize(r, bredd - 2 * marginal) as string[]
    doc.text(brutna, marginal, y)
    y += brutna.length * 4.2
  }
  return doc
}

export async function generateNamndrapportDataUrl(u: Namndrapport, meta: NamndrapportMeta): Promise<string> {
  const doc = await generateNamndrapportDoc(u, meta)
  return doc.output('dataurlstring')
}

export async function generateNamndrapportBlob(u: Namndrapport, meta: NamndrapportMeta): Promise<Blob> {
  const doc = await generateNamndrapportDoc(u, meta)
  return doc.output('blob')
}

/** Laddas ner via jsPDF.save — ingen `window.open` efter await (popup-fällan 2026-08-23). */
export async function downloadNamndrapport(u: Namndrapport, meta: NamndrapportMeta): Promise<void> {
  const doc = await generateNamndrapportDoc(u, meta)
  doc.save(`namndrapport-${u.ar}-Q${u.kvartal}.pdf`)
}
