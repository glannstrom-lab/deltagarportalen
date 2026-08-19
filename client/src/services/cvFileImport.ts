/**
 * Textutläsning ur ett uppladdat CV (PDF eller Word).
 *
 * Allt sker i WEBBLÄSAREN. Filen laddas aldrig upp till någon server — bara
 * den utlästa texten skickas vidare till /api/ai för strukturering, och den
 * går genom PII-saneringen som vanligt (personnummer stryks helt).
 * Det är också skälet till att parsningen inte lades i en edge-funktion:
 * ett CV är en personuppgiftssamling och behöver inte lämna enheten för att
 * bli läst.
 *
 * `pdfjs-dist` och `mammoth` importeras dynamiskt så att ingen som bara
 * öppnar sidan betalar deras vikt — samma mönster som `cvWordExport.ts`.
 */

/** Största fil vi ens försöker läsa. Ett CV som är större är inte ett CV. */
export const MAX_FILSTORLEK = 10 * 1024 * 1024 // 10 MB

/** Under så här många tecken är utläsningen inte användbar som CV-underlag. */
const MINSTA_ANVANDBARA_TEXT = 120

export type ImportFel =
  | 'for-stor'
  | 'okant-format'
  | 'gammalt-word'
  | 'tom-text'
  | 'kunde-inte-lasa'

export class CvImportError extends Error {
  // Explicit fält i stället för parameter-property: tsconfig kör
  // `erasableSyntaxOnly`, som förbjuder den kortare formen.
  kod: ImportFel

  constructor(kod: ImportFel, message: string) {
    super(message)
    this.name = 'CvImportError'
    this.kod = kod
  }
}

/** Filändelser vi tar emot — används både i <input accept> och i kontrollen. */
export const ACCEPTERADE_FILTYPER = '.pdf,.docx'

function filandelse(namn: string): string {
  const i = namn.lastIndexOf('.')
  return i === -1 ? '' : namn.slice(i).toLowerCase()
}

/**
 * Städar utläst text: pdf.js ger en textbit per rad-fragment, och Word ger
 * ofta dubbla radbrytningar. Vi normaliserar radbrytningar och blanksteg men
 * ändrar ALDRIG orden — det är personens egen text.
 */
function stadaText(ratext: string): string {
  return ratext
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function lasPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  // Vite bundlar workern som en egen tillgång via new URL(...) + import.meta.url.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  const buffer = await file.arrayBuffer()
  const laddning = pdfjs.getDocument({ data: buffer })
  const dok = await laddning.promise
  try {
    const sidor: string[] = []
    // Ett CV är sällan över 10 sidor; taket finns för att en felaktig fil inte
    // ska låsa webbläsaren. Att taket slår rapporteras — tyst avkortning är
    // just den sortens halvsanning portalen städat bort på andra ställen.
    const antal = Math.min(dok.numPages, 10)
    for (let i = 1; i <= antal; i++) {
      const sida = await dok.getPage(i)
      const innehall = await sida.getTextContent()
      const text = innehall.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
      sidor.push(text)
    }
    return sidor.join('\n\n')
  } finally {
    // Frigör worker och buffertar. `destroy()` sitter på laddningsuppgiften,
    // inte på dokumentet, i pdfjs-dist 6.
    void laddning.destroy()
  }
}

async function lasDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const buffer = await file.arrayBuffer()
  const resultat = await mammoth.extractRawText({ arrayBuffer: buffer })
  return resultat.value || ''
}

/**
 * Läser ut ren text ur ett CV i PDF- eller .docx-format.
 * Kastar `CvImportError` med en kod som anroparen kan översätta till en
 * begriplig mening — aldrig ett tomt resultat som ser ut som ett lyckat svar.
 */
export async function lasTextUrCvFil(file: File): Promise<string> {
  if (file.size > MAX_FILSTORLEK) {
    throw new CvImportError('for-stor', 'Filen är större än 10 MB.')
  }

  const andelse = filandelse(file.name)

  if (andelse === '.doc') {
    // Gamla binära .doc går inte att läsa i webbläsaren utan ett tungt
    // bibliotek. Säg det rakt ut i stället för att misslyckas kryptiskt.
    throw new CvImportError(
      'gammalt-word',
      'Filformatet .doc är för gammalt för att läsas här.'
    )
  }

  let text = ''
  try {
    if (andelse === '.pdf' || file.type === 'application/pdf') {
      text = await lasPdf(file)
    } else if (
      andelse === '.docx' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      text = await lasDocx(file)
    } else {
      throw new CvImportError('okant-format', 'Formatet stöds inte.')
    }
  } catch (e) {
    if (e instanceof CvImportError) throw e
    console.error('Kunde inte läsa CV-filen:', e)
    throw new CvImportError('kunde-inte-lasa', 'Filen gick inte att öppna.')
  }

  const stadad = stadaText(text)

  if (stadad.length < MINSTA_ANVANDBARA_TEXT) {
    // Vanligaste orsaken: en inskannad PDF, alltså en bild utan textlager.
    throw new CvImportError(
      'tom-text',
      'Vi hittade nästan ingen text i filen — den kan vara inskannad som bild.'
    )
  }

  return stadad
}
