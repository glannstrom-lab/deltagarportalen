/**
 * Ansökningens detaljvy i mörkt läge — källkodsvakt.
 *
 * Fram till 2026-09-22 hade ApplicationDetailModal inte en enda `dark:`-klass.
 * I mörkt läge låg alltså en vit dialog ovanpå mörk sida, och `<Card>`
 * inuti (som själv byter till `dark:bg-stone-800`) bar `text-stone-900` —
 * kontaktnamn och påminnelsetitlar blev i praktiken svart på nästan svart
 * (~1,2:1; AA kräver 4,5:1).
 *
 * Samma metod som ApplicationsPipeline.morkt-lage.test.tsx: jsdom kör ingen
 * riktig `dark:`-kaskad, så varje klassträng med en ljus neutral token
 * (bg-white, bg/text/border-stone-N) granskas i källan och ska ha en
 * `dark:`-motsvarighet för samma egenskap i SAMMA sträng.
 *
 * Mutation: ta bort `dark:text-stone-100` ur kontaktnamnets klass → RÖD.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const kalla = readFileSync(join(__dirname, 'ApplicationDetailModal.tsx'), 'utf-8').replace(/\r\n/g, '\n')

const LJUSA = /^(bg-white|bg-stone-\d+|text-stone-\d+|border-stone-\d+)$/

function klasstrangar(kod: string): string[] {
  const ut: string[] = []
  const re = /(["'])([^"'\n{}<>=]*?)\1/g
  let m: RegExpExecArray | null
  while ((m = re.exec(kod))) {
    if (m[2].split(' ').some((t) => LJUSA.test(t))) ut.push(m[2])
  }
  return ut
}

describe('ApplicationDetailModal — mörkt läge', () => {
  const strangar = klasstrangar(kalla)

  it('hittar klasssträngarna (annars mäter vakten ingenting)', () => {
    expect(strangar.length).toBeGreaterThan(40)
  })

  it('varje ljus neutral token har en dark:-motsvarighet i samma sträng', () => {
    const saknas: string[] = []
    for (const s of strangar) {
      const tokens = s.split(' ')
      for (const tok of tokens) {
        if (!LJUSA.test(tok)) continue
        const egenskap = tok.split('-')[0] // bg | text | border
        if (!tokens.some((d) => d.startsWith(`dark:${egenskap}-`))) saknas.push(`${tok} i "${s}"`)
      }
    }
    expect(saknas).toEqual([])
  })
})
