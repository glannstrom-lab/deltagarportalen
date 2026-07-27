/**
 * CoverLetterPDF — rendering-smoke för alla fyra mallar (ROADMAP I1)
 *
 * Varför testet finns: PDF-generering är den enda vägen i portalen där ett fel
 * inte syns i UI:t utan i en nedladdad fil. D9 noterade att PDF-exporten var
 * otestad. Det här täcker brev-vägen: varje mall ska producera en giltig PDF
 * med svenska tecken i innehållet.
 *
 * Testtexten är vald för att pressa det som brukar gå sönder i PDF-motorer:
 * åäö/ÅÄÖ, é, tankstreck, långa sammansatta ord (avstavning) och flera stycken.
 * Det var precis sådant som gick fel i den gamla html2canvas-lösningen som
 * @react-pdf/renderer ersatte.
 *
 * Sätt PDF_VERIFY_OUT till en katalog för att även spara filerna och granska
 * dem visuellt:
 *   PDF_VERIFY_OUT=./pdf-verify npx vitest run CoverLetterPDF.test
 */
import { describe, it, expect } from 'vitest'
import { writeFileSync, mkdirSync } from 'node:fs'
import { createElement } from 'react'
import { pdf } from '@react-pdf/renderer'
import { CoverLetterPDF, type CoverLetterPDFData } from './CoverLetterPDF'

const OUT = process.env.PDF_VERIFY_OUT

const LETTER = `Hej!

Jag heter Åsa Öberg-Ekström och söker tjänsten som verksamhetsutvecklare hos er. Under mina år på Försäkringskassan arbetade jag med förändringsledning, kvalitetsuppföljning och samverkan mellan enheter — ofta i miljöer där förutsättningarna ändrades snabbt.

Det som lockar mig med er organisation är kombinationen av tydligt samhällsuppdrag och vilja att pröva nytt. Särskilt intresserad är jag av hur ni använder uppföljning för att förbättra verksamheten, snarare än bara redovisa den.

Jag bifogar mitt CV och svarar gärna på frågor.`

/**
 * Långt brev som säkert spiller över till sida 2. Flersidiga PDF:er är den
 * kända svaga punkten i portalens PDF-generering: CV-exporten hade fel på
 * per-sida-marginaler och kant-till-kant-bakgrund (lärdom 2026-07-03), så
 * brevvägen ska kontrolleras på samma sätt — inte antas fungera.
 */
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

/** Räknar sidor i en renderad PDF via /Type /Page-objekten. */
function countPages(bytes: Buffer): number {
  return bytes.toString('latin1').match(/\/Type\s*\/Page[^s]/g)?.length ?? 0
}

/** toBuffer() i stället för toBlob(): jsdoms Blob saknar arrayBuffer(). */
async function renderToBuffer(templateId: string, content = LETTER): Promise<Buffer> {
  // Casten speglar en typmismatch i @react-pdf/renderer: `pdf()` deklarerar
  // sin parameter som ReactElement<DocumentProps>, men en komponent som
  // RETURNERAR ett <Document> matchar inte den signaturen. Produktionskoden
  // (pdfExportService.ts:1616) har exakt samma problem. Casten här är för att
  // testet inte ska lägga till ett nytt fel i strict-taket (I2) — den döljer
  // inget verkligt fel, PDF:en renderas korrekt.
  const stream = await pdf(
    createElement(CoverLetterPDF, { data: { ...DATA, content, templateId } }) as Parameters<typeof pdf>[0]
  ).toBuffer()

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (c: Buffer) => chunks.push(c))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

function save(name: string, bytes: Buffer) {
  if (!OUT) return
  mkdirSync(OUT, { recursive: true })
  writeFileSync(`${OUT}/${name}.pdf`, bytes)
}

describe('CoverLetterPDF — ensidigt brev', () => {
  for (const templateId of ['professional', 'modern', 'minimal', 'executive']) {
    it(`renderar mallen "${templateId}" på EN sida`, async () => {
      const bytes = await renderToBuffer(templateId)
      save(`1sida-${templateId}`, bytes)

      // Giltig PDF-header
      expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
      // Rimlig storlek = faktiskt innehåll renderat, inte en tom sida
      expect(bytes.length).toBeGreaterThan(2000)
      // Ett kort brev ska INTE tippa över till två sidor
      expect(countPages(bytes)).toBe(1)
    }, 60_000)
  }
})

describe('CoverLetterPDF — flersidigt brev', () => {
  for (const templateId of ['professional', 'modern', 'minimal', 'executive']) {
    it(`renderar mallen "${templateId}" på flera sidor utan att tappa innehåll`, async () => {
      const short = await renderToBuffer(templateId)
      const bytes = await renderToBuffer(templateId, LONG_LETTER)
      save(`flersidigt-${templateId}`, bytes)

      expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')

      // Ett brev med 11 stycken MÅSTE bli mer än en sida. Blir det bara en
      // har innehåll klippts bort i stället för att flöda vidare — precis den
      // tysta förlusten som är svår att upptäcka i en nedladdad fil.
      const pages = countPages(bytes)
      expect(pages).toBeGreaterThanOrEqual(2)

      // Rimlighetsspärr uppåt: varje stycke ska inte hamna på egen sida.
      // Faktiskt utfall 2026-07-27: executive 2 sidor (serif är kompaktare),
      // professional/modern/minimal 3.
      expect(pages).toBeLessThanOrEqual(4)

      // AVKLIPPNINGSSPÄRR: det långa brevet har ~8× texten i det korta, så
      // filen ska växa tydligt. Blir den inte större har texten kapats i
      // stället för att flöda vidare — sidräkningen ensam skulle inte fånga
      // att SLUTET (inkl. signaturen) försvann.
      expect(bytes.length).toBeGreaterThan(short.length * 1.4)
    }, 60_000)
  }
})

describe('CoverLetterPDF — robusthet', () => {
  it('faller tillbaka på standardmallen vid okänt templateId', async () => {
    const bytes = await renderToBuffer('finns-inte')
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
    expect(countPages(bytes)).toBe(1)
  }, 60_000)

  it('renderar även utan företag och jobbtitel', async () => {
    const stream = await pdf(
      createElement(CoverLetterPDF, {
        data: { content: LETTER, sender: { name: 'Åsa Öberg' } },
      }) as Parameters<typeof pdf>[0]
    ).toBuffer()
    const bytes: Buffer = await new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      stream.on('data', (c: Buffer) => chunks.push(c))
      stream.on('end', () => resolve(Buffer.concat(chunks)))
      stream.on('error', reject)
    })
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
    expect(countPages(bytes)).toBe(1)
  }, 60_000)
})
