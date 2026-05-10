/**
 * Word/.docx-export för CV — tabell-baserad layout med sidobar.
 *
 * Tidigare exporterade vi bara en linear textström (rubriker + paragrafer)
 * vilket användaren upplevde som "bara text". Den här versionen använder
 * docx-bibliotekets `Table`/`TableRow`/`TableCell` för att skapa en
 * 2-kolumns layout som speglar Manhattan-mallens designprinciper:
 *
 *  - Vänster smal sidobar med mörk navy bakgrund (#0F1B2D) och vita texter
 *    för kontakt, kompetenser, språk
 *  - Höger huvudkolumn med stort namn, copper-accent (#B07A4C) på rubriker
 *    och justerade datum-rader för erfarenhet/utbildning
 *  - Inga synliga celler (border: NONE) — det är layout, inte tabell-design
 *
 * Lazy-importerar `docx` och `file-saver` så bundle-storleken inte påverkas
 * när användaren bara kör PDF-export.
 */

interface CVData {
  firstName?: string
  lastName?: string
  title?: string
  email?: string
  phone?: string
  location?: string
  summary?: string
  workExperience?: Array<{
    title: string
    company: string
    location?: string
    description?: string
    startDate?: string
    endDate?: string
    current?: boolean
  }>
  education?: Array<{
    degree: string
    school: string
    field?: string
    startDate?: string
    endDate?: string
  }>
  skills?: Array<{ id?: string; name: string; level?: number; category?: string }> | string[]
  languages?: Array<{
    language: string
    level: string
  }>
  certificates?: Array<{ id?: string; name: string; issuer?: string }>
  links?: Array<{ id?: string; label?: string; url: string }>
}

const NAVY = '0F1B2D'
const COPPER = 'B07A4C'
const COPPER_SOFT = 'D4A574'
const INK = '1A1A1A'
const MUTED = '5A5A5A'
const WHITE = 'FFFFFF'
const SOFT_WHITE = 'E5E7EB'

const LEVEL_LABEL: Record<string, string> = {
  basic: 'Grundläggande',
  good: 'God',
  fluent: 'Flytande',
  native: 'Modersmål',
  Grundläggande: 'Grundläggande',
  God: 'God',
  Flytande: 'Flytande',
  Modersmål: 'Modersmål',
}

export async function generateCVWord(cvData: CVData): Promise<void> {
  const docx = await import('docx')
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, BorderStyle, AlignmentType, ShadingType, HeightRule,
  } = docx
  const { saveAs } = await import('file-saver')

  const fullName = `${cvData.firstName || ''} ${cvData.lastName || ''}`.trim() || 'CV'
  const skills = (cvData.skills || []).map(s => typeof s === 'string' ? s : s?.name).filter(Boolean) as string[]

  // ────────── HJÄLP-FUNKTIONER ──────────
  // Inga celler ska visas som rektanglar — vi använder bara tabellen som layout.
  const noBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: WHITE },
    bottom: { style: BorderStyle.NONE, size: 0, color: WHITE },
    left: { style: BorderStyle.NONE, size: 0, color: WHITE },
    right: { style: BorderStyle.NONE, size: 0, color: WHITE },
  }

  /** Sektionsrubrik på sidobar (vit caps, copper underline). */
  const sidebarHeading = (text: string) => new Paragraph({
    children: [new TextRun({ text, bold: true, size: 20, color: COPPER, allCaps: true, font: 'Calibri' })],
    spacing: { before: 280, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COPPER, space: 4 } },
  })

  /** Liten textrad i sidobar (vit på navy). */
  const sidebarLine = (text: string, opts: { soft?: boolean; bold?: boolean } = {}) => new Paragraph({
    children: [new TextRun({
      text,
      size: 20,
      color: opts.soft ? SOFT_WHITE : WHITE,
      bold: opts.bold,
      font: 'Calibri',
    })],
    spacing: { after: 80 },
  })

  /** Sektionsrubrik i main (navy caps). */
  const mainHeading = (text: string) => new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: NAVY, allCaps: true, font: 'Calibri' })],
    spacing: { before: 360, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: COPPER, space: 4 } },
  })

  // ────────── VÄNSTER SIDOBAR ──────────
  const sidebarChildren: InstanceType<typeof Paragraph>[] = []

  // Initialer-cirkel via stor bokstav (text-baserad markering — Word kan inte
  // rita cirklar utan bilder).
  const initials = `${cvData.firstName?.[0] || ''}${cvData.lastName?.[0] || ''}`.toUpperCase() || 'CV'
  sidebarChildren.push(new Paragraph({
    children: [new TextRun({ text: initials, bold: true, size: 56, color: COPPER_SOFT, font: 'Georgia' })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 280 },
  }))

  // Kontakt
  sidebarChildren.push(sidebarHeading('Kontakt'))
  if (cvData.email) sidebarChildren.push(sidebarLine(cvData.email, { soft: true }))
  if (cvData.phone) sidebarChildren.push(sidebarLine(cvData.phone, { soft: true }))
  if (cvData.location) sidebarChildren.push(sidebarLine(cvData.location, { soft: true }))

  // Kompetenser
  if (skills.length > 0) {
    sidebarChildren.push(sidebarHeading('Kompetenser'))
    skills.forEach(s => sidebarChildren.push(sidebarLine(s, { soft: true })))
  }

  // Språk
  if (cvData.languages && cvData.languages.length > 0) {
    sidebarChildren.push(sidebarHeading('Språk'))
    cvData.languages.forEach(l => {
      const name = l.language || ''
      const level = LEVEL_LABEL[l.level] || l.level
      sidebarChildren.push(new Paragraph({
        children: [new TextRun({ text: name, bold: true, size: 20, color: WHITE, font: 'Calibri' })],
        spacing: { after: 0 },
      }))
      if (level) {
        sidebarChildren.push(new Paragraph({
          children: [new TextRun({ text: level, italics: true, size: 18, color: COPPER_SOFT, font: 'Calibri' })],
          spacing: { after: 100 },
        }))
      }
    })
  }

  // Certifikat
  if (cvData.certificates && cvData.certificates.length > 0) {
    sidebarChildren.push(sidebarHeading('Certifikat'))
    cvData.certificates.forEach(c => {
      sidebarChildren.push(new Paragraph({
        children: [new TextRun({ text: c.name, bold: true, size: 20, color: WHITE, font: 'Calibri' })],
        spacing: { after: 0 },
      }))
      if (c.issuer) {
        sidebarChildren.push(new Paragraph({
          children: [new TextRun({ text: c.issuer, size: 18, color: COPPER_SOFT, font: 'Calibri' })],
          spacing: { after: 100 },
        }))
      }
    })
  }

  // Länkar
  if (cvData.links && cvData.links.length > 0) {
    sidebarChildren.push(sidebarHeading('Länkar'))
    cvData.links.forEach(l => {
      if (l.label) {
        sidebarChildren.push(new Paragraph({
          children: [new TextRun({ text: l.label, bold: true, size: 20, color: WHITE, font: 'Calibri' })],
          spacing: { after: 0 },
        }))
      }
      sidebarChildren.push(new Paragraph({
        children: [new TextRun({ text: l.url, size: 18, color: COPPER_SOFT, font: 'Calibri' })],
        spacing: { after: 100 },
      }))
    })
  }

  // ────────── HÖGER MAIN ──────────
  const mainChildren: InstanceType<typeof Paragraph>[] = []

  // Stort namn
  mainChildren.push(new Paragraph({
    children: [new TextRun({ text: fullName, bold: true, size: 56, color: NAVY, font: 'Georgia' })],
    spacing: { before: 200, after: 80 },
  }))
  if (cvData.title) {
    mainChildren.push(new Paragraph({
      children: [new TextRun({ text: cvData.title.toUpperCase(), size: 24, color: COPPER, font: 'Calibri' })],
      spacing: { after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: COPPER, space: 8 } },
    }))
  } else {
    mainChildren.push(new Paragraph({
      children: [new TextRun({ text: '' })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: COPPER, space: 8 } },
      spacing: { after: 120 },
    }))
  }

  // Profil
  if (cvData.summary) {
    mainChildren.push(mainHeading('Profil'))
    mainChildren.push(new Paragraph({
      children: [new TextRun({ text: cvData.summary, size: 22, color: INK, font: 'Calibri' })],
      spacing: { after: 200, line: 320 },
    }))
  }

  // Erfarenhet
  if (cvData.workExperience && cvData.workExperience.length > 0) {
    mainChildren.push(mainHeading('Erfarenhet'))
    cvData.workExperience.forEach(job => {
      const dateStr = `${job.startDate || ''} — ${job.current ? 'Nuvarande' : (job.endDate || '')}`
      mainChildren.push(new Paragraph({
        children: [
          new TextRun({ text: job.title, bold: true, size: 26, color: NAVY, font: 'Georgia' }),
          new TextRun({ text: '\t' }),
          new TextRun({ text: dateStr, bold: true, size: 18, color: COPPER, font: 'Calibri' }),
        ],
        tabStops: [{ type: docx.TabStopType.RIGHT, position: 8500 }],
        spacing: { before: 160, after: 40 },
      }))
      mainChildren.push(new Paragraph({
        children: [new TextRun({
          text: job.location ? `${job.company} · ${job.location}` : job.company,
          italics: true,
          size: 22,
          color: MUTED,
          font: 'Calibri',
        })],
        spacing: { after: 100 },
      }))
      if (job.description) {
        mainChildren.push(new Paragraph({
          children: [new TextRun({ text: job.description, size: 22, color: INK, font: 'Calibri' })],
          spacing: { after: 200, line: 300 },
        }))
      }
    })
  }

  // Utbildning
  if (cvData.education && cvData.education.length > 0) {
    mainChildren.push(mainHeading('Utbildning'))
    cvData.education.forEach(edu => {
      const dateStr = `${edu.startDate || ''} — ${edu.endDate || ''}`
      mainChildren.push(new Paragraph({
        children: [
          new TextRun({ text: edu.degree, bold: true, size: 24, color: NAVY, font: 'Georgia' }),
          new TextRun({ text: '\t' }),
          new TextRun({ text: dateStr, bold: true, size: 18, color: COPPER, font: 'Calibri' }),
        ],
        tabStops: [{ type: docx.TabStopType.RIGHT, position: 8500 }],
        spacing: { before: 160, after: 40 },
      }))
      mainChildren.push(new Paragraph({
        children: [new TextRun({ text: edu.school, italics: true, size: 22, color: MUTED, font: 'Calibri' })],
        spacing: { after: 40 },
      }))
      if (edu.field) {
        mainChildren.push(new Paragraph({
          children: [new TextRun({ text: edu.field, size: 20, color: MUTED, font: 'Calibri' })],
          spacing: { after: 120 },
        }))
      }
    })
  }

  // ────────── BYGG TABELL-LAYOUT ──────────
  // En enda rad med två celler. Vänster cell = sidobar (navy), höger = main.
  // Word respekterar cell-höjd via row HeightRule och tablet width via dxa
  // (twentieths of a point) — A4 är 11906 dxa, vi delar 3500/8406.
  const layoutTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        height: { value: 16400, rule: HeightRule.ATLEAST },
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: NAVY },
            margins: { top: 360, bottom: 360, left: 360, right: 360 },
            borders: noBorders,
            children: sidebarChildren,
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            margins: { top: 360, bottom: 360, left: 480, right: 480 },
            borders: noBorders,
            children: mainChildren,
          }),
        ],
      }),
    ],
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: WHITE },
      bottom: { style: BorderStyle.NONE, size: 0, color: WHITE },
      left: { style: BorderStyle.NONE, size: 0, color: WHITE },
      right: { style: BorderStyle.NONE, size: 0, color: WHITE },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: WHITE },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: WHITE },
    },
  })

  // Document. Marginaler 0 — sidobar går edge-to-edge precis som PDF.
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0 },
        },
      },
      children: [layoutTable],
    }],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `CV-${cvData.firstName || 'Mitt'}-${cvData.lastName || ''}.docx`.replace(/\s+/g, '-'))
}
