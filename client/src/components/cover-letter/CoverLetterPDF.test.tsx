/**
 * CoverLetterPDF — mätande regression för alla fyra mallar
 *
 * Varför testet finns: PDF-generering är den enda vägen i portalen där ett fel
 * inte syns i UI:t utan i en nedladdad fil som redan ligger hos en arbetsgivare.
 *
 * Varför det skrevs OM 2026-08-19: den gamla versionen kontrollerade bara
 * `%PDF-`, filstorlek och sidräkning. En mutationskontroll visade att den inte
 * kunde falla där det räknades:
 *   - kollapsa alla fyra mallar till `professional` → alla tio testerna gröna
 *   - ta bort hela signaturblocket → grönt
 *   - byt ut åäö mot frågetecken → grönt (huvudet LOVADE att svenska tecken
 *     kontrolleras; ingen assertion gjorde det)
 * Och det som faktiskt var trasigt — modern-mallens marginaler — kunde det
 * per konstruktion inte se, eftersom det aldrig tittade in i sidan.
 *
 * Den här versionen läser PDF:en med pdfjs-dist och mäter: texten som faktiskt
 * står där, teckensnitten, namnets grad, färgerna och millimetrarna till
 * papperskanten på VARJE sida.
 *
 * Mutationskontrollerad 2026-08-19 (bröt koden, såg testet bli rött, återställde):
 *   1. alla fyra mallar kollapsade till professional  → 3 röda
 *   2. signaturblocket borttaget ur alla mallar       → 12 röda
 *   3. åäö/é ersatta med ? i parseContent             → 8 röda
 *   4. modern återställd till View-padding (buggen)   → 1 röd (marginalerna)
 *   5. formatDate returnerar strängen orörd           → 3 röda
 *   6. platshållaren "Ditt Namn" tillbaka             → 5 röda
 * Alla sex överlevde den gamla sviten. En sjunde mutation (åäö) rapporterades
 * först som överlevare — den hade i själva verket inte applicerats. Kontrollera
 * ALLTID att mutationen tog innan du drar en slutsats om testet.
 *
 * Sätt PDF_VERIFY_OUT till en katalog för att även spara filerna:
 *   PDF_VERIFY_OUT=./pdf-verify npx vitest run CoverLetterPDF.test
 */
import { describe, it, expect } from 'vitest'
import { writeFileSync, mkdirSync } from 'node:fs'
import { createElement } from 'react'
import { pdf } from '@react-pdf/renderer'
import { CoverLetterPDF, type CoverLetterPDFData } from './CoverLetterPDF'

const OUT = process.env.PDF_VERIFY_OUT
const TEMPLATES = ['professional', 'modern', 'minimal', 'executive'] as const

/**
 * Testtexten pressar det som brukar gå sönder i PDF-motorer: åäö/ÅÄÖ, é,
 * tankstreck, långa sammansatta ord och flera stycken. Precis sådant som gick
 * fel i den gamla html2canvas-lösningen som @react-pdf/renderer ersatte.
 */
const LETTER = `Hej!

Jag heter Åsa Öberg-Ekström och söker tjänsten som verksamhetsutvecklare hos er. Under mina år på Försäkringskassan arbetade jag med förändringsledning, kvalitetsuppföljning och samverkan mellan enheter — ofta i miljöer där förutsättningarna ändrades snabbt.

Det som lockar mig med er organisation är kombinationen av tydligt samhällsuppdrag och vilja att pröva nytt. Särskilt intresserad är jag av hur ni använder uppföljning för att förbättra verksamheten, snarare än bara redovisa den.

Jag bifogar mitt CV och svarar gärna på frågor.`

/** Långt brev som säkert spiller över till sida 2 och 3. */
const LONG_LETTER = [
  'Hej!',
  ...Array.from({ length: 9 }, (_, i) =>
    `Stycke ${i + 1}. Under mina år på Försäkringskassan och senare i Västra Götalandsregionen ` +
    'arbetade jag med förändringsledning, kvalitetsuppföljning och samverkan mellan enheter. ' +
    'Jag har vant mig vid att arbeta självständigt i miljöer där förutsättningarna ändrades ' +
    'snabbt, men trivs bäst när jag får bolla idéer med andra — särskilt när uppföljningen ' +
    'används för att förbättra verksamheten snarare än att bara redovisa den. Det är också ' +
    'därför jag söker mig till er: kombinationen av tydligt samhällsuppdrag och en uttalad ' +
    'vilja att pröva nya arbetssätt känns ovanlig och angelägen.'
  ),
  'Jag bifogar mitt CV och svarar gärna på frågor. Tack för att du tog dig tid att läsa hela vägen hit.',
].join('\n\n')

const DATA: CoverLetterPDFData = {
  content: LETTER,
  company: 'Västra Götalandsregionen',
  jobTitle: 'Verksamhetsutvecklare',
  sender: {
    name: 'Åsa Öberg-Ekström',
    email: 'asa.oberg@example.se',
    phone: '070-123 45 67',
    location: 'Göteborg',
  },
}

// ============================================================================
// Rendering + inspektion
// ============================================================================

/** toBuffer() i stället för toBlob(): jsdoms Blob saknar arrayBuffer(). */
async function render(data: CoverLetterPDFData): Promise<Buffer> {
  // Casten speglar en typmismatch i @react-pdf/renderer: `pdf()` deklarerar
  // sin parameter som ReactElement<DocumentProps>, men en komponent som
  // RETURNERAR ett <Document> matchar inte den signaturen. Produktionskoden
  // har exakt samma problem. Casten döljer inget verkligt fel.
  const stream = await pdf(createElement(CoverLetterPDF, { data }) as Parameters<typeof pdf>[0]).toBuffer()
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (c: Buffer) => chunks.push(c))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

const renderTemplate = (templateId: string, content = LETTER) =>
  render({ ...DATA, content, templateId })

const PT_PER_MM = 72 / 25.4
const mm = (pt: number) => pt / PT_PER_MM

interface PageInfo {
  /** Textstycken i läsordning, sammanfogade med "\n". */
  text: string
  /** Antal textobjekt med innehåll — 0 = blank sida. */
  textCount: number
  /** Grad (pt) på första textraden, dvs. avsändarens namn i sidhuvudet. */
  firstTextSize: number
  /** Millimeter från papperskanten till närmaste text, per sida. */
  top: number
  bottom: number
  left: number
  right: number
  /** Alla fyllnadsfärger som ritas på sidan (t.ex. modern-mallens band). */
  fillColors: string[]
  /** Ritade ytor som bbox i pt: [x0, y0, x1, y1]. */
  boxes: number[][]
  widthPt: number
  heightPt: number
}

/** Läser PDF:en och mäter varje sida. Ingen okulär besiktning. */
async function inspect(bytes: Buffer): Promise<{ pages: PageInfo[]; baseFonts: string[] }> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise
  const pages: PageInfo[] = []

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const viewport = page.getViewport({ scale: 1 })
    const ops = await page.getOperatorList()
    const items = ((await page.getTextContent()).items as Array<{
      str: string; transform: number[]; width: number; height: number
    }>).filter((i) => i.str.trim().length > 0)

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const i of items) {
      const x = i.transform[4]
      const y = i.transform[5]
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x + i.width)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y + (i.height || 11))
    }

    const fillColors: string[] = []
    const boxes: number[][] = []
    for (let i = 0; i < ops.fnArray.length; i++) {
      if (ops.fnArray[i] === pdfjs.OPS.setFillRGBColor) {
        fillColors.push(String((ops.argsArray[i] as unknown[])[0]).toLowerCase())
      }
      if (ops.fnArray[i] === pdfjs.OPS.constructPath) {
        const args = ops.argsArray[i] as unknown[]
        const bbox = args[2] as Record<string, number> | undefined
        if (bbox && typeof bbox[0] === 'number') boxes.push([bbox[0], bbox[1], bbox[2], bbox[3]])
      }
    }

    pages.push({
      text: items.map((i) => i.str).join('\n'),
      textCount: items.length,
      firstTextSize: items[0]?.height ?? 0,
      top: items.length ? mm(viewport.height - maxY) : NaN,
      bottom: items.length ? mm(minY) : NaN,
      left: items.length ? mm(minX) : NaN,
      right: items.length ? mm(viewport.width - maxX) : NaN,
      fillColors,
      boxes,
      widthPt: viewport.width,
      heightPt: viewport.height,
    })
  }

  const baseFonts = [...new Set(
    (bytes.toString('latin1').match(/\/BaseFont\s*\/([A-Za-z0-9+#-]+)/g) || [])
      .map((m) => m.replace(/\/BaseFont\s*\//, ''))
  )]

  return { pages, baseFonts }
}

function save(name: string, bytes: Buffer) {
  if (!OUT) return
  mkdirSync(OUT, { recursive: true })
  writeFileSync(`${OUT}/${name}.pdf`, bytes)
}

// ============================================================================
// Mallarna är fyra olika mallar — inte fyra namn på samma
// ============================================================================

/**
 * Varje mall har egna, MÄTBARA kännetecken. Kollapsar man switchen i
 * `CoverLetterPDF` så att alla fyra renderar samma komponent faller minst tre
 * av de fyra fallen nedan. Den gamla sviten märkte det inte alls.
 */
const FINGERPRINT: Record<string, {
  /** Sidans vänstermarginal i mm (padding). */
  leftMm: number
  /** Grad på avsändarens namn i sidhuvudet. */
  nameSizePt: number
  /** Teckensnittsfamilj: Times = executive, Helvetica = övriga. */
  serif: boolean
  /** Färgband kant-till-kant över sidhuvudet. */
  headerBand: boolean
}> = {
  professional: { leftMm: 25, nameSizePt: 22, serif: false, headerBand: false },
  modern: { leftMm: 25, nameSizePt: 24, serif: false, headerBand: true },
  minimal: { leftMm: 30, nameSizePt: 18, serif: false, headerBand: false },
  executive: { leftMm: 25, nameSizePt: 24, serif: true, headerBand: false },
}

describe('CoverLetterPDF — mallarna skiljer sig åt', () => {
  for (const templateId of TEMPLATES) {
    it(`"${templateId}" har sina egna kännetecken (grad, snitt, marginal, band)`, async () => {
      const bytes = await renderTemplate(templateId)
      save(`1sida-${templateId}`, bytes)
      const { pages, baseFonts } = await inspect(bytes)
      const fp = FINGERPRINT[templateId]
      const page = pages[0]

      expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
      expect(pages).toHaveLength(1)

      // Namnets grad skiljer alla utom modern/executive åt.
      expect(page.firstTextSize).toBe(fp.nameSizePt)

      // Sidans vänstermarginal (minimal är den enda med 30 mm).
      expect(page.left).toBeCloseTo(fp.leftMm, 0)

      // Serif vs sans — executive är den enda med Times.
      const hasTimes = baseFonts.some((f) => f.includes('Times'))
      expect(hasTimes).toBe(fp.serif)

      // Modern-mallens färgband ska gå kant-till-kant över hela sidbredden.
      const fullWidthBand = page.boxes.some(
        ([x0, y0, x1, y1]) =>
          x0 <= 0.5 && x1 >= page.widthPt - 0.5 && y0 <= 0.5 && y1 > 50 && y1 < page.heightPt / 3
      )
      expect(fullWidthBand).toBe(fp.headerBand)
    }, 60_000)
  }
})

// ============================================================================
// Innehållet — svenska tecken och signatur
// ============================================================================

describe('CoverLetterPDF — innehållet kommer med', () => {
  for (const templateId of TEMPLATES) {
    it(`"${templateId}" behåller åäö, é och tankstreck`, async () => {
      const { pages } = await inspect(await renderTemplate(templateId))
      const text = pages.map((p) => p.text).join('\n')

      // Namnet, adressaten och brödtexten — alla med svenska tecken.
      expect(text).toContain('Åsa Öberg-Ekström')
      expect(text).toContain('Västra Götalandsregionen')
      expect(text).toContain('förändringsledning')
      expect(text).toContain('Särskilt')
      expect(text).toContain('Angående: Verksamhetsutvecklare')

      // Ingen mojibake: raderade eller ersatta tecken syns som ? eller □.
      expect(text).not.toMatch(/[?□]{2,}/)
    }, 60_000)

    it(`"${templateId}" avslutar med hälsningsfras och avsändarens namn`, async () => {
      const { pages } = await inspect(await renderTemplate(templateId))
      const text = pages.map((p) => p.text).join('\n')

      expect(text).toContain('Med vänliga hälsningar,')

      // Signaturblocket ligger EFTER hälsningsfrasen: namn, telefon, e-post.
      // (Namnet står också i sidhuvudet och i brödtexten, så en ren räkning
      // av förekomster hade inte sagt något om att blocket finns kvar.)
      const signatur = text.slice(text.indexOf('Med vänliga hälsningar,'))
      expect(signatur).toContain('Åsa Öberg-Ekström')
      expect(signatur).toContain('070-123 45 67')
      expect(signatur).toContain('asa.oberg@example.se')

      // Sidhuvudet har sitt eget block med samma uppgifter.
      const huvud = text.slice(0, text.indexOf('Med vänliga hälsningar,'))
      expect(huvud).toContain('Åsa Öberg-Ekström')
      expect(huvud).toContain('Göteborg')
    }, 60_000)
  }
})

// ============================================================================
// Marginalerna — på VARJE sida, inte bara den första
// ============================================================================

/**
 * Regressionen som gjorde att testet skrevs om. Modern-mallen la sin padding
 * på Views som bryts i stället för på `<Page>`; uppmätt före fixen:
 *   sida 1 top 19,2 mm / bottom 7,7 mm
 *   sida 2 top -0,4 mm  ← texten låg utanför papperet
 *   sida 3 0 textobjekt ← helt blank sida sist i brevet
 * Skriv aldrig marginaler på en View som kan brytas — se filhuvudet i
 * CoverLetterPDF.tsx.
 */
describe('CoverLetterPDF — marginalerna håller på alla sidor', () => {
  for (const templateId of TEMPLATES) {
    it(`"${templateId}": inget spiller utanför skrivbart område och ingen sida är blank`, async () => {
      const bytes = await renderTemplate(templateId, LONG_LETTER)
      save(`flersidigt-${templateId}`, bytes)
      const { pages } = await inspect(bytes)

      // Ett brev med 11 stycken MÅSTE flöda vidare till fler sidor.
      expect(pages.length).toBeGreaterThanOrEqual(2)
      expect(pages.length).toBeLessThanOrEqual(4)

      pages.forEach((page, i) => {
        // Blank sida = innehåll som försvann eller en sidbrytning för mycket.
        expect(page.textCount, `sida ${i + 1} är blank`).toBeGreaterThan(0)

        // Minsta säkerhetszon mot papperskanten. 15 mm ligger under alla
        // mallars nominella marginal (20–25 mm) men långt över de 0 mm som
        // buggen gav — och över skrivarens icke-skrivbara zon.
        expect(page.top, `sida ${i + 1} toppmarginal`).toBeGreaterThan(15)
        expect(page.bottom, `sida ${i + 1} bottenmarginal`).toBeGreaterThan(15)
        expect(page.left, `sida ${i + 1} vänstermarginal`).toBeGreaterThan(15)
        expect(page.right, `sida ${i + 1} högermarginal`).toBeGreaterThan(15)

        // Marginalen får inte heller svälla — då har innehåll tappats bort.
        expect(page.top, `sida ${i + 1} toppmarginal`).toBeLessThan(40)
      })

      // Slutet kom med: signaturen står på sista sidan, inte i tomma intet.
      expect(pages[pages.length - 1].text).toContain('Med vänliga hälsningar,')
    }, 90_000)
  }
})

// ============================================================================
// Datumet
// ============================================================================

describe('CoverLetterPDF — datumet', () => {
  it('skriver ut Postgres-tidsstämpeln som ett svenskt datum', async () => {
    // Rått prod-värde ur cover_letters.created_at. Det stod tidigare
    // oförändrat i brevets datumrad, hela vägen ut till arbetsgivaren.
    const { pages } = await inspect(await render({ ...DATA, date: '2026-02-23 21:26:02.810016+00' }))
    const text = pages[0].text

    expect(text).toContain('23 februari 2026')
    expect(text).not.toContain('21:26')
    expect(text).not.toContain('+00')
    expect(text).not.toContain('2026-02-23')
  }, 60_000)

  it('skriver ut ISO-tidsstämpeln som ett svenskt datum', async () => {
    const { pages } = await inspect(await render({ ...DATA, date: '2026-08-01T10:00:00Z' }))
    expect(pages[0].text).toContain('1 augusti 2026')
    expect(pages[0].text).not.toContain('2026-08-01')
  }, 60_000)

  it('lämnar en otolkbar sträng orörd i stället för att hitta på ett datum', async () => {
    // Hellre en sträng vi inte förstod än ett datum vi hittat på. Testet går
    // via en riktig PDF — formateraren är intern, och det som räknas är vad
    // som står i filen som lämnar portalen.
    const { pages } = await inspect(await render({ ...DATA, date: 'inget datum alls här' }))
    expect(pages[0].text).toContain('inget datum alls här')
  }, 60_000)

  it('faller tillbaka på dagens datum när brevet saknar datum', async () => {
    const idag = new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })
    const { pages } = await inspect(await render({ ...DATA, date: undefined }))
    expect(pages[0].text).toContain(idag)
  }, 60_000)
})

// ============================================================================
// Platshållare får aldrig följa med ut
// ============================================================================

describe('CoverLetterPDF — inga påhittade uppgifter', () => {
  for (const templateId of TEMPLATES) {
    it(`"${templateId}" utelämnar namnraden hellre än att skriva "Ditt Namn"`, async () => {
      // 28 av 92 profiler i prod saknar förnamn, 83 saknar telefon och ort.
      // Dessutom är profilen null vid varje sidladdning (profileStore
      // persistar den inte) medan PDF-knappen redan går att klicka.
      const { pages } = await inspect(await render({
        content: LETTER,
        company: 'Acme AB',
        templateId,
        sender: {},
      }))
      const text = pages.map((p) => p.text).join('\n')

      expect(text).not.toContain('Ditt Namn')
      expect(text).not.toMatch(/\[.*\]/)      // inga [platshållare]
      expect(text).not.toMatch(/\{\{.*\}\}/)  // ingen oersatt mall-token

      // Brevet är fortfarande ett brev: adressat, brödtext och hälsningsfras.
      expect(text).toContain('Acme AB')
      expect(text).toContain('Med vänliga hälsningar,')
      expect(text).toContain('förändringsledning')
    }, 60_000)
  }

  it('behandlar ett namn som bara är blanksteg som saknat', async () => {
    const { pages } = await inspect(await render({
      content: 'Hej.\n\nText.',
      templateId: 'professional',
      sender: { name: '   ', email: 'a@example.se' },
    }))
    expect(pages[0].text).not.toContain('Ditt Namn')
    // E-posten finns kvar — bara den tomma raden utelämnas.
    expect(pages[0].text).toContain('a@example.se')
  }, 60_000)
})

// ============================================================================
// Robusthet
// ============================================================================

describe('CoverLetterPDF — robusthet', () => {
  it('faller tillbaka på standardmallen vid okänt templateId', async () => {
    const bytes = await renderTemplate('finns-inte')
    const { pages, baseFonts } = await inspect(bytes)
    expect(pages).toHaveLength(1)
    // Standardmallen är professional: 22 pt namn, sans-serif.
    expect(pages[0].firstTextSize).toBe(FINGERPRINT.professional.nameSizePt)
    expect(baseFonts.some((f) => f.includes('Times'))).toBe(false)
  }, 60_000)

  it('renderar även utan företag och jobbtitel', async () => {
    const { pages } = await inspect(await render({
      content: LETTER,
      sender: { name: 'Åsa Öberg' },
    }))
    expect(pages).toHaveLength(1)
    expect(pages[0].text).toContain('Åsa Öberg')
    expect(pages[0].text).not.toContain('Angående:')
  }, 60_000)
})
