/**
 * Vad `generateArticlePDF` faktiskt lägger på pappret.
 *
 * Bakgrund: artiklarna är markdown, men generatorn strök HTML-taggar och
 * skrev resten rakt av. Varje nedladdad artikel bar därför "## Rubrik",
 * "**fetstil**" och "[text](https://…)" som synlig text mitt i brödtexten —
 * samma familj som uppläsningen, som läste tabellpipes högt innan den fick
 * `textUrMarkdown`. Sedan 2026-08-23 går PDF:en genom samma parser som
 * skärmen.
 *
 * Testet läser PDF:ens byteström. jsPDF komprimerar inte strömmarna, så
 * texten går att söka i — och det är den enda kontroll som ser vad läsaren
 * ser, i stället för vad koden tänkte skriva.
 */

import { describe, it, expect } from 'vitest'
import { generateArticlePDF } from '../pdfExportService'

const MARKDOWN = [
  '## En rubrik med **fetstil**',
  '',
  'Ett stycke med [Alfa-kassan](https://alfakassan.se), **fetstil** och *kursivt*.',
  '',
  '- Punkt ett',
  '- Punkt två',
  '',
  '| Villkor | Betyder |',
  '| --- | --- |',
  '| Medlemsvillkoret | Hur länge du varit medlem |',
].join('\n')

/**
 * PDF-strängar eskaperar `(`, `)` och `\` med bakstreck — de avgränsar
 * strängar i formatet. Utan den här normaliseringen letar testet efter
 * `](http` i en ström som i själva verket bär `]\(http`, och en rå länk
 * slinker igenom. Uppmätt under mutationskontrollen 2026-08-23.
 */
const avEskapera = (rå: string) => rå.replace(/\\([()\\])/g, '$1')

async function textenIPdf(): Promise<string> {
  const blob = await generateArticlePDF({
    id: 'provartikel',
    title: 'Provartikel',
    summary: 'Sammanfattning.',
    content: MARKDOWN,
    category: 'Arbetsrätt och anställning',
    readingTime: 4,
    checklist: [{ id: 'c1', text: 'Bocka av mig' }],
  })
  // jsdom:s Blob saknar `arrayBuffer()`. FileReader finns däremot, och
  // `readAsBinaryString` ger byten som latin1 — precis vad en PDF-ström är.
  return await new Promise<string>((resolve, reject) => {
    const läsare = new FileReader()
    läsare.onload = () => resolve(String(läsare.result))
    läsare.onerror = () => reject(läsare.error)
    läsare.readAsBinaryString(blob)
  }).then(avEskapera)
}

describe('generateArticlePDF — markdown ska tolkas, inte skrivas av', () => {
  it('lämnar ingen rå markdown-syntax i PDF:en', async () => {
    const pdf = await textenIPdf()

    expect(pdf).not.toContain('## ')
    expect(pdf).not.toContain('**')
    expect(pdf).not.toContain('](http')
    expect(pdf).not.toContain('| --- |')
  }, 30000)

  it('behåller rubriker, punktlistor, länkadress och checklista', async () => {
    const pdf = await textenIPdf()

    expect(pdf).toContain('En rubrik med fetstil')
    expect(pdf).toContain('Punkt ett')
    // Adressen måste följa med — en länk utan adress är oanvändbar på papper.
    expect(pdf).toContain('alfakassan.se')
    expect(pdf).toContain('Bocka av mig')
    // Tabellen skrivs som kolumnrubrik: värde, samma val som uppläsningen.
    expect(pdf).toContain('Medlemsvillkoret')
  }, 30000)

  it('anger rätt hostname i sidfoten', async () => {
    const pdf = await textenIPdf()

    expect(pdf).toContain('www.jobin.se')
    // deltagarportalen.se är staging och stod på varje PDF till 2026-08-23.
    expect(pdf).not.toContain('deltagarportalen.se')
  }, 30000)
})
