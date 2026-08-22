/**
 * Word/.docx-export för personligt brev.
 *
 * ## Varför den här filen finns
 *
 * Fram till 2026-08-22 låg exporten som en lokal funktion i `pages/Resources.tsx`
 * — enda Word-vägen för brev i hela portalen, men gömd i en sidfil och därför
 * osynlig för den som letade i `services/`. Tre fel följde av att den låg där:
 *
 * 1. **Datumet var dagens**, inte brevets. `new Date().toLocaleDateString('sv-SE')`
 *    stämplades överst. Kortet i gränssnittet visade `created_at` — samma brev
 *    bar alltså två olika datum beroende på om man tittade eller laddade ner.
 * 2. **Rubriken var hårdkodad** "Personligt brev" i stället för brevets titel.
 * 3. **Ingen avsändare.** `pdfExportService` har en tio raders kommentar om att
 *    namnet aldrig får gissas — men också om att det ska *finnas* när profilen
 *    har det. Word-brevet nådde arbetsgivaren utan namn, mejl eller telefon.
 *
 * Och ett fjärde som inte var exportens fel men blev synligt här: brev med
 * `ai_generated = true` märks "AI-genererad" på kortet, och den märkningen
 * försvann i filen — alltså just i det dokument som skickas vidare.
 *
 * Formen speglar `CoverLetterPDF` så de två nedladdningarna av samma brev inte
 * ser ut som två olika brev.
 */

export interface BrevForWord {
  /** Brevets egen rubrik. Faller tillbaka på "Personligt brev" om den saknas. */
  title?: string
  content: string
  company?: string
  jobTitle?: string
  /** Brevets skapandedatum (ISO). Utelämnas raden helt om det saknas. */
  createdAt?: string
  /** Sant om texten kommer ur en AI-generering — märks ut i filen. */
  aiGenerated?: boolean
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  location?: string
}

const GRA = '666666'

/**
 * Bygger och laddar ner brevet som .docx.
 *
 * Kastar vidare vid fel — anroparen ska visa ett besked. Att svälja felet gör
 * knappen till en knapp som inte gör något, vilket är sämre än ett felmeddelande.
 */
export async function generateCoverLetterWord(brev: BrevForWord): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx')
  const { saveAs } = await import('file-saver')

  const barn: InstanceType<typeof Paragraph>[] = []

  // Avsändaren först, som i ett riktigt brev. INGEN platshållare: saknas
  // namnet utelämnas raden. Samma regel som CoverLetterPDF — 28 av 92
  // profiler i prod saknar förnamn, och "Ditt Namn" har hamnat hos en
  // arbetsgivare en gång redan.
  const namn = [brev.firstName, brev.lastName].map((n) => n?.trim()).filter(Boolean).join(' ')
  const kontakt = [brev.email, brev.phone, brev.location].map((v) => v?.trim()).filter(Boolean)

  if (namn) {
    barn.push(
      new Paragraph({
        children: [new TextRun({ text: namn, bold: true, size: 24 })],
        spacing: { after: kontakt.length ? 40 : 200 },
      })
    )
  }
  if (kontakt.length) {
    barn.push(
      new Paragraph({
        children: [new TextRun({ text: kontakt.join(' · '), size: 20, color: GRA })],
        spacing: { after: 200 },
      })
    )
  }

  // Brevets datum — inte dagens. Saknas det står ingen datumrad alls.
  if (brev.createdAt) {
    const d = new Date(brev.createdAt)
    if (!Number.isNaN(d.getTime())) {
      barn.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: d.toLocaleDateString('sv-SE'), size: 22, color: GRA })],
          spacing: { after: 400 },
        })
      )
    }
  }

  barn.push(
    new Paragraph({
      text: brev.title?.trim() || 'Personligt brev',
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    })
  )

  if (brev.company) {
    barn.push(
      new Paragraph({
        children: [new TextRun({ text: brev.company, bold: true, size: 26 })],
        spacing: { after: 50 },
      })
    )
  }
  if (brev.jobTitle) {
    barn.push(
      new Paragraph({
        children: [new TextRun({ text: brev.jobTitle, size: 24, color: GRA })],
        spacing: { after: 300 },
      })
    )
  }

  for (const stycke of brev.content.split('\n\n')) {
    if (!stycke.trim()) continue
    barn.push(
      new Paragraph({
        children: [new TextRun({ text: stycke.trim(), size: 24 })],
        spacing: { after: 200 },
      })
    )
  }

  // AI Act art. 50.2: den som tar emot dokumentet ska kunna se att texten är
  // maskingenererad. Märkningen finns på kortet i portalen — den ska följa med
  // ut i filen, för det är filen som når arbetsgivaren.
  if (brev.aiGenerated) {
    barn.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Utkastet till den här texten är genererat med AI-stöd och bearbetat av avsändaren.',
            size: 18,
            italics: true,
            color: GRA,
          }),
        ],
        spacing: { before: 400 },
      })
    )
  }

  const doc = new Document({ sections: [{ children: barn }] })
  const blob = await Packer.toBlob(doc)
  saveAs(blob, filnamn(brev))
}

function filnamn(brev: BrevForWord): string {
  const del = brev.company?.trim() || brev.jobTitle?.trim() || brev.title?.trim() || 'ansokan'
  const rent = del
    .replace(/[^a-zA-Z0-9åäöÅÄÖ_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  return `Personligt-brev-${rent || 'ansokan'}.docx`
}
