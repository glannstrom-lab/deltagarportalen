/**
 * Sidbilderna på de publika sidorna (2026-11-09).
 *
 * Tre saker ska hålla:
 *  1. En sida utan bildfil renderar ingen <img> — aldrig en trasig bild.
 *  2. En sida med bildfil får den i hjälteblocket, dekorativ (alt="") och med
 *     mått satta så att layouten inte hoppar när bilden laddas.
 *  3. Varje verktygssida som lånar en av appens sidbilder pekar på en fil som finns.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const gb = require('../../scripts/lib/guidebild.cjs') as {
  KATALOG: string
  VERKTYG_SIDBILD: Record<string, string>
  guidebildHtml: (nyckel: string) => string
}

const ILLUSTRATIONER = path.join(__dirname, '..', '..', 'public', 'illustrations')

describe('guidebild', () => {
  it('ger ingenting för en nyckel utan fil', () => {
    expect(gb.guidebildHtml('finns-inte-' + Date.now())).toBe('')
    expect(gb.guidebildHtml('')).toBe('')
  })

  it('ger en dekorativ bild med mått för en nyckel som har fil', () => {
    const fil = readdirSync(gb.KATALOG).find((f) => f.endsWith('.webp'))
    expect(fil, 'public/guidebilder är tom — kör npm run guidebilder').toBeTruthy()
    const html = gb.guidebildHtml(fil!.replace(/\.webp$/, ''))
    expect(html).toContain('<figure class="hero-bild">')
    expect(html).toContain('alt=""')
    expect(html).toMatch(/width="\d+" height="\d+"/)
  })

  it('varje lånad verktygsbild finns i public/illustrations', () => {
    for (const [slug, nyckel] of Object.entries(gb.VERKTYG_SIDBILD)) {
      expect(existsSync(path.join(ILLUSTRATIONER, `sida-${nyckel}-mjuk.webp`)), `${slug} → sida-${nyckel}-mjuk.webp`).toBe(true)
    }
  })
})
