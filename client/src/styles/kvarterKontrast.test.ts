/**
 * Kontrasten i omtagets palett ("Kvarter", 2026-10-11), uträknad ur tokens.css.
 *
 * Förslaget lovar att varje statusfärg klarar 4,5:1 mot sin chipbakgrund i
 * båda lägena. Ett handbyte av en hexkod ska inte kunna bryta det tyst —
 * därför läses värdena ur filen, inte ur en kopia här.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(__dirname, 'tokens.css'), 'utf8')
const avsnitt = css.slice(css.indexOf('OMTAGET 2026-10-11'))

function block(selektor: string): Record<string, string> {
  const start = avsnitt.indexOf(`${selektor} {`)
  if (start < 0) throw new Error(`hittar inte ${selektor} i omtagets avsnitt`)
  const slut = avsnitt.indexOf('\n}', start)
  const varden: Record<string, string> = {}
  for (const m of avsnitt.slice(start, slut).matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
    varden[m[1]] = m[2].trim()
  }
  return varden
}

const ljust = block(':root')
const morkt = { ...ljust, ...block('.dark') }

function los(v: Record<string, string>, namn: string): string {
  let varde = v[namn]
  for (let i = 0; i < 5 && varde?.startsWith('var('); i++) {
    varde = v[varde.slice(4, -1).trim()]
  }
  if (!varde || !/^#[0-9a-f]{6}$/i.test(varde)) throw new Error(`${namn} löser inte till en hexfärg: ${varde}`)
  return varde
}

function luminans(hex: string): number {
  const kanal = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * kanal(1) + 0.7152 * kanal(3) + 0.0722 * kanal(5)
}

function kontrast(a: string, b: string): number {
  const [l1, l2] = [luminans(a), luminans(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

const PAR: Array<[string, string]> = [
  ['--s-narvarande-text', '--s-narvarande-bg'],
  ['--s-giltig-text', '--s-giltig-bg'],
  ['--s-ogiltig-text', '--s-ogiltig-bg'],
  ['--s-sjuk-text', '--s-sjuk-bg'],
  ['--s-vantar-text', '--s-vantar-bg'],
  ['--s-planerat-text', '--s-planerat-bg'],
  ['--j-blak', '--j-papper'],
  ['--j-blak-2', '--j-kort'],
  ['--j-blak-3', '--j-kort'],
  ['--j-blak-3', '--j-papper'],
  ['--j-blak-3', '--j-sankt'],
  ['--j-blak-2', '--j-sankt'],
  ['--j-gran-text', '--j-papper'],
  ['--j-glod', '--j-kort'],
  ['--j-pa-gran', '--j-gran'],
  // Statustext i en ovald NarvaroVal-knapp och i menyns farliga val.
  ['--s-ogiltig-text', '--j-kort'],
]

describe('Kvarter-paletten klarar 4,5:1', () => {
  for (const [lage, v] of [['ljust', ljust], ['mörkt', morkt]] as const) {
    it.each(PAR)(`${lage}: %s mot %s`, (fg, bg) => {
      const k = kontrast(los(v, fg), los(v, bg))
      expect(k, `${fg} mot ${bg} i ${lage} läge = ${k.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
    })
  }

  it('Gran som fokusring och ram mot Papper klarar 3:1 (WCAG 1.4.11)', () => {
    for (const v of [ljust, morkt]) {
      expect(kontrast(los(v, '--j-gran'), los(v, '--j-papper'))).toBeGreaterThanOrEqual(3)
    }
  })
})
