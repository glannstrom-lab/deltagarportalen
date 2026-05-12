/**
 * STA PDF-export
 *
 * Genererar PDF för STA-rapporter med jspdf. Layouten är portal-egen men
 * sektionerna matchar AF:s blankett (Af 00825 3.0 etc.). I framtida iteration
 * byts detta mot pdf-lib-fyllning av AF:s officiella ifyllbara PDF.
 *
 * För tidiga iterationer ger konsulenten en ren utskrift som hen jämför med
 * AF:s blankett och fyller över för hand.
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  fetchEnrollmentBundle,
  type DocumentType,
  type EnrollmentBundle,
} from './staApi'
import type { DocumentDraftSections } from './staAiApi'
import { DOC_TYPE_META } from './staAiApi'

interface PdfOptions {
  docType: DocumentType
  bundle: EnrollmentBundle
  draft?: DocumentDraftSections
  consultantName?: string
  organizationName?: string
}

// =============================================================================
// LAYOUT-KONSTANTER
// =============================================================================
const PAGE_MARGIN_X = 18
const PAGE_WIDTH = 210 // A4 mm
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN_X * 2
const PAGE_HEIGHT = 297

const COLORS = {
  primary: [31, 138, 102] as [number, number, number], // action-solid mint
  text: [44, 44, 42] as [number, number, number],
  muted: [106, 104, 100] as [number, number, number],
  border: [221, 217, 208] as [number, number, number],
  bgSoft: [236, 247, 241] as [number, number, number],
}

// =============================================================================
// HELPER: lägg till en sektionsrubrik + körspår
// =============================================================================
class PdfBuilder {
  doc: jsPDF
  y: number

  constructor() {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4' })
    this.y = 20
  }

  ensureSpace(needed: number) {
    if (this.y + needed > PAGE_HEIGHT - 20) {
      this.doc.addPage()
      this.y = 20
    }
  }

  setColor(rgb: [number, number, number]) {
    this.doc.setTextColor(rgb[0], rgb[1], rgb[2])
  }

  setFillColor(rgb: [number, number, number]) {
    this.doc.setFillColor(rgb[0], rgb[1], rgb[2])
  }

  setDrawColor(rgb: [number, number, number]) {
    this.doc.setDrawColor(rgb[0], rgb[1], rgb[2])
  }

  pageHeader(title: string, subtitle?: string) {
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(20)
    this.setColor(COLORS.text)
    this.doc.text(title, PAGE_MARGIN_X, this.y)
    this.y += 7

    if (subtitle) {
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(10)
      this.setColor(COLORS.muted)
      this.doc.text(subtitle, PAGE_MARGIN_X, this.y)
      this.y += 5
    }

    // Färgsträck under header
    this.setFillColor(COLORS.primary)
    this.doc.rect(PAGE_MARGIN_X, this.y + 1, 30, 1.2, 'F')
    this.y += 8
  }

  sectionTitle(title: string) {
    this.ensureSpace(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(12)
    this.setColor(COLORS.primary)
    this.doc.text(title, PAGE_MARGIN_X, this.y)
    this.y += 6
  }

  paragraph(text: string, opts?: { italic?: boolean; size?: number; color?: [number, number, number] }) {
    if (!text) return
    this.doc.setFont('helvetica', opts?.italic ? 'italic' : 'normal')
    this.doc.setFontSize(opts?.size ?? 10)
    this.setColor(opts?.color ?? COLORS.text)
    const lines = this.doc.splitTextToSize(text, CONTENT_WIDTH) as string[]
    for (const line of lines) {
      this.ensureSpace(5)
      this.doc.text(line, PAGE_MARGIN_X, this.y)
      this.y += 5
    }
    this.y += 2
  }

  keyValueTable(rows: Array<[string, string]>) {
    autoTable(this.doc, {
      startY: this.y,
      margin: { left: PAGE_MARGIN_X, right: PAGE_MARGIN_X },
      head: [],
      body: rows,
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, textColor: COLORS.muted },
        1: { cellWidth: CONTENT_WIDTH - 50 },
      },
      theme: 'plain',
      didDrawPage: () => { /* noop */ },
    })
    const finalY = (this.doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
    this.y = (finalY ?? this.y) + 4
  }

  bulletList(items: string[]) {
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(10)
    this.setColor(COLORS.text)
    for (const item of items) {
      this.ensureSpace(5)
      const lines = this.doc.splitTextToSize(item, CONTENT_WIDTH - 5) as string[]
      this.doc.text('•', PAGE_MARGIN_X, this.y)
      for (let i = 0; i < lines.length; i++) {
        this.doc.text(lines[i], PAGE_MARGIN_X + 4, this.y)
        if (i < lines.length - 1) this.y += 5
      }
      this.y += 5
    }
    this.y += 2
  }

  divider() {
    this.ensureSpace(6)
    this.setDrawColor(COLORS.border)
    this.doc.setLineWidth(0.2)
    this.doc.line(PAGE_MARGIN_X, this.y, PAGE_WIDTH - PAGE_MARGIN_X, this.y)
    this.y += 6
  }

  fillableBox(label: string, height = 18) {
    this.ensureSpace(height + 4)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(8)
    this.setColor(COLORS.muted)
    this.doc.text(label, PAGE_MARGIN_X, this.y)
    this.y += 2
    this.setDrawColor(COLORS.border)
    this.doc.setLineWidth(0.3)
    this.doc.rect(PAGE_MARGIN_X, this.y, CONTENT_WIDTH, height, 'S')
    this.y += height + 4
  }

  footer(text: string) {
    const pageCount = this.doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(8)
      this.setColor(COLORS.muted)
      this.doc.text(`${text} · sida ${i} av ${pageCount}`, PAGE_MARGIN_X, PAGE_HEIGHT - 8)
      this.doc.text(new Date().toLocaleString('sv-SE'), PAGE_WIDTH - PAGE_MARGIN_X, PAGE_HEIGHT - 8, { align: 'right' })
    }
  }
}

// =============================================================================
// DELREDOVISNING DEL 1
// =============================================================================

function buildDelredovisningDel1(b: PdfBuilder, opts: PdfOptions) {
  const meta = DOC_TYPE_META[opts.docType]
  const e = opts.bundle.enrollment
  const completedActivities = opts.bundle.activities.filter((a) => a.completed_at)
  const dagsslinga = completedActivities.filter((a) => a.activity_type === 'dagsslinga').length
  const startsamtal = completedActivities.find((a) => a.activity_type === 'startsamtal')

  b.pageHeader(meta.title, `AF-blankett: ${meta.afBlankett ?? '—'}`)

  // ===== Deltagaruppgifter =====
  b.sectionTitle('Deltagaruppgifter')
  const namn = e.external_name ?? '[Hämta från Jobin-profil]'
  const pnr = e.external_personal_id ?? '[Hämta från Jobin-profil]'
  b.keyValueTable([
    ['Namn:', namn],
    ['Personnummer:', pnr],
    ['Start i tjänsten:', e.started_at],
    ['Del 1 startade:', e.part_started_at],
    ['Fokusyrke:', e.focus_occupation ?? 'Ej fastställt'],
    ['Anpassningsbehov:', e.adaptations ?? 'Inga noterade'],
    ['Språkstöd:', e.language_support.length ? e.language_support.join(', ') : 'Ej behov'],
    ['Kommunikationsstöd:', e.communication_support.length ? e.communication_support.join(', ') : 'Ej behov'],
  ])

  // ===== Leverantörsuppgifter =====
  b.sectionTitle('Leverantörsuppgifter')
  b.keyValueTable([
    ['Konsulent:', opts.consultantName ?? '[Fyll i]'],
    ['Organisation:', opts.organizationName ?? '[Fyll i]'],
  ])

  b.divider()

  // ===== Aktiviteter genomförda =====
  b.sectionTitle('Genomförda aktiviteter i Del 1')
  b.keyValueTable([
    ['Dagar i dagsslingan:', `${dagsslinga} av 14 genomförda`],
    ['Startsamtal:', startsamtal ? `Genomfört ${startsamtal.completed_at?.slice(0, 10)}` : 'Ej genomfört'],
  ])

  if (completedActivities.length > 0) {
    autoTable(b.doc, {
      startY: b.y,
      margin: { left: PAGE_MARGIN_X, right: PAGE_MARGIN_X },
      head: [['Aktivitet', 'Typ', 'Klart']],
      body: completedActivities.slice(0, 20).map((a) => [
        a.activity_key ?? '—',
        a.activity_type,
        a.completed_at?.slice(0, 10) ?? '—',
      ]),
      styles: { fontSize: 8.5, cellPadding: 1.8 },
      headStyles: { fillColor: COLORS.bgSoft, textColor: COLORS.text, fontStyle: 'bold' },
      theme: 'grid',
    })
    const finalY = (b.doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
    b.y = (finalY ?? b.y) + 6
  }

  // ===== AI-utkast sektioner =====
  if (opts.draft) {
    b.divider()
    for (const [, section] of Object.entries(opts.draft)) {
      b.sectionTitle(section.title)
      b.paragraph(section.content)
    }
  }

  // ===== Skattningar =====
  if (opts.bundle.assessments.length > 0) {
    b.divider()
    b.sectionTitle('Skattningar i Del 1')
    for (const a of opts.bundle.assessments.filter((x) => x.part === 1)) {
      b.paragraph(`${a.instrument} — status: ${a.status}`, { italic: true, color: COLORS.muted })
      if (a.summary) b.paragraph(a.summary)
    }
  }

  // ===== Konsulent-fält att fylla i för hand =====
  b.divider()
  b.sectionTitle('Att fylla i för hand innan inskick')
  b.fillableBox('Föreslagen nästa del (Del 2 eller Del 3):', 14)
  b.fillableBox('Motivering till nästa del:', 28)
  b.fillableBox('Övrigt som AF behöver veta:', 28)

  // Signatur
  b.divider()
  b.sectionTitle('Underskrift')
  b.fillableBox('Datum, ort:', 12)
  b.fillableBox('Konsulent/leverantör (namnteckning + namnförtydligande):', 22)
}

// =============================================================================
// GENERISK FALLBACK FÖR ANDRA DOKUMENTTYPER
// =============================================================================

function buildGeneric(b: PdfBuilder, opts: PdfOptions) {
  const meta = DOC_TYPE_META[opts.docType]
  const e = opts.bundle.enrollment

  b.pageHeader(meta.title, `AF-blankett: ${meta.afBlankett ?? '—'}`)

  b.sectionTitle('Deltagaruppgifter')
  b.keyValueTable([
    ['Namn:', e.external_name ?? '[Hämta från Jobin-profil]'],
    ['Personnummer:', e.external_personal_id ?? '[Hämta från Jobin-profil]'],
    ['Aktuell del:', `Del ${e.current_part}`],
    ['Fokusyrke:', e.focus_occupation ?? 'Ej fastställt'],
  ])

  if (opts.draft) {
    b.divider()
    for (const section of Object.values(opts.draft)) {
      b.sectionTitle(section.title)
      b.paragraph(section.content)
    }
  }

  b.divider()
  b.sectionTitle('Att fylla i för hand')
  b.fillableBox('Datum, ort:', 12)
  b.fillableBox('Underskrift konsulent:', 22)
}

// =============================================================================
// PUBLIC API
// =============================================================================

export interface ExportPdfParams {
  enrollmentId: string
  docType: DocumentType
  draft?: DocumentDraftSections
  consultantName?: string
  organizationName?: string
}

export async function exportStaDocumentPdf(params: ExportPdfParams): Promise<Blob | null> {
  const bundle = await fetchEnrollmentBundle(params.enrollmentId)
  if (!bundle) return null

  const builder = new PdfBuilder()

  const opts: PdfOptions = {
    docType: params.docType,
    bundle,
    draft: params.draft,
    consultantName: params.consultantName,
    organizationName: params.organizationName,
  }

  switch (params.docType) {
    case 'delredovisning_1':
      buildDelredovisningDel1(builder, opts)
      break
    default:
      buildGeneric(builder, opts)
  }

  builder.footer(`AI-UTKAST — granska och justera innan inskick · STA · ${DOC_TYPE_META[params.docType].title}`)

  return builder.doc.output('blob')
}

/**
 * Hjälpare: ladda ner direkt i webbläsaren.
 */
export async function downloadStaDocumentPdf(params: ExportPdfParams, filename?: string): Promise<void> {
  const blob = await exportStaDocumentPdf(params)
  if (!blob) throw new Error('Kunde inte generera PDF')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename ?? `${DOC_TYPE_META[params.docType].title.replace(/\s+/g, '-')}-${params.enrollmentId.slice(0, 8)}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
