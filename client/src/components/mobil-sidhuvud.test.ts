/**
 * Mobilens sidhuvud får inte göra sidan bredare än telefonen.
 *
 * Driftgenomgången 2026-09-22: 65 av 76 deltagarrutter och 8 av 8
 * konsulentrutter var 406 px breda på 375 px. Den globala regeln i
 * styles/mobile.css (`button, a { min-width: 48px }`) gjorde sidhuvudets sex
 * `w-8`-ikoner 48 px. Rättelsen är tre delar som måste hänga ihop — den här
 * vakten håller dem ihop, eftersom jsdom inte kan mäta en layout:
 *
 *  1. `data-mobil-sidhuvud` på sidhuvudet i Layout.tsx,
 *  2. regeln i mobile.css som sätter 44 px under det attributet (aldrig
 *     under 44 — WCAG 2.5.5, och målgruppens motorik),
 *  3. tabeller på mobil är innehållande block (`position: relative`), så en
 *     `sr-only`-cell inte rymmer ur skrollrutan (/consultant/settings, 478 px).
 *
 * Den geometriska kontrollen (Playwright, 320/360/375 px, 22 deltagar- och
 * 6 konsulentrutter) kördes mot dev-servern 2026-09-22: alla lika breda som
 * skärmen, alla sidhuvudknappar 44 × 44.
 *
 * Mutation: ta bort attributet, sänk 44px till 40px, eller ta bort
 * `position: relative` ur tabellregeln → testet faller.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = join(__dirname, '..')
const layout = readFileSync(join(SRC, 'components', 'Layout.tsx'), 'utf8')
const css = readFileSync(join(SRC, 'styles', 'mobile.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

describe('mobilens sidhuvud ryms på telefonen', () => {
  it('sidhuvudet bär data-mobil-sidhuvud', () => {
    expect(layout).toMatch(/<header\s+data-mobil-sidhuvud/)
  })

  it('mobile.css ger knappar och länkar i sidhuvudet exakt 44 px minsta tryckyta', () => {
    const regel = css.match(/\[data-mobil-sidhuvud\] button,\s*\[data-mobil-sidhuvud\] a\s*\{([^}]*)\}/)
    expect(regel).not.toBeNull()
    expect(regel![1]).toMatch(/min-width:\s*44px/)
    expect(regel![1]).toMatch(/min-height:\s*44px/)
  })

  it('tabeller på mobil är innehållande block för sr-only-celler', () => {
    const regel = css.match(/\.mobile-device table\s*\{([^}]*)\}/)
    expect(regel).not.toBeNull()
    expect(regel![1]).toMatch(/position:\s*relative/)
  })
})
