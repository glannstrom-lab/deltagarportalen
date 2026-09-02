/**
 * TI1 — källkodsvakt: varje amber-klass i "gammal ansökan"-varningen
 * (ApplicationsPipeline.tsx:502-526) ska ha en dark:-motsvarighet.
 *
 * Bakgrund: `<Card>`-primitiven byter själv botten i mörkt läge
 * (`dark:bg-stone-800` i cardVariants), men de sex amber-klasserna på
 * kortet gjorde det inte. Uppmätt (e2e/mat-kontrast.cjs-formeln, se
 * scratch-skriptet i granskningsrapporten): text-amber-900 mot den mörka
 * kortbottnen (#38372F) gav 1,32:1 — AA kräver 4,5:1.
 *
 * Testet läser KÄLLKODEN (inte renderad DOM) eftersom jsdom inte tillämpar
 * riktig CSS-cascade för `dark:`-varianter — ett DOM-test skulle inte kunna
 * se skillnaden. I stället granskas varje `className`-sträng som bär en
 * `amber-`-klass: för varje `(bg|text|border)-amber-N`-token utan `dark:`
 * krävs en matchande `dark:(bg|text|border)-amber-N`-token i SAMMA sträng.
 *
 * Mutationstestat (se slutrapport): borttagen enskild dark:-token → faller.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

// Läs källfilen rakt av — normalisera CRLF så mönstret inte missar rader
// på en arbetskopia med Windows-radslut (samma fälla som 2026-08-23-lärdomen).
const kalla = readFileSync(
  join(__dirname, 'ApplicationsPipeline.tsx'),
  'utf-8'
).replace(/\r\n/g, '\n')

// Alla className="..." (eller className={cn(...)}-fria) strängar som bär minst en amber-klass.
function hittaClassNameStrangar(kod: string): string[] {
  const traff: string[] = []
  const re = /className="([^"]*amber-[^"]*)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(kod))) traff.push(m[1])
  return traff
}

describe('ApplicationsPipeline — amber i mörkt läge (TI1)', () => {
  it('varningskortet om gamla ansökningar har minst sex amber-bärande className-strängar', () => {
    // Regressionsskydd mot att blocket flyttas/tas bort utan att någon
    // uppdaterar det här testet — roadmapens premiss (sex förekomster).
    const strangar = hittaClassNameStrangar(kalla)
    expect(strangar.length).toBeGreaterThanOrEqual(6)
  })

  it('varje bg-amber-/text-amber-/border-amber-token har en dark:-motsvarighet i samma className', () => {
    const strangar = hittaClassNameStrangar(kalla)
    expect(strangar.length).toBeGreaterThan(0)

    for (const str of strangar) {
      const tokens = str.split(/\s+/)
      for (const prefix of ['bg', 'text', 'border'] as const) {
        const utanDark = tokens.some(t => new RegExp(`^${prefix}-amber-\\d+(\\/\\d+)?$`).test(t))
        if (!utanDark) continue
        const medDark = tokens.some(t => new RegExp(`^dark:${prefix}-amber-\\d+(\\/\\d+)?$`).test(t))
        expect(
          medDark,
          `className "${str}" har ${prefix}-amber-* utan dark:${prefix}-amber-*`
        ).toBe(true)
      }
    }
  })

  it('knappen för enskild försenad ansökan har en dark:-bakgrund (inte bara amber-bordern)', () => {
    // Den enda className i blocket som INTE är amber-bakgrund är knappen
    // (bg-white). Den ska ändå bytas i mörkt läge — annars blir den vit
    // text på vit botten om bg-white någonsin blir bg-amber-50 igen.
    const strangar = hittaClassNameStrangar(kalla)
    const knappklass = strangar.find(s => s.includes('bg-white'))
    expect(knappklass).toBeTruthy()
    expect(knappklass).toMatch(/dark:bg-/)
  })
})
