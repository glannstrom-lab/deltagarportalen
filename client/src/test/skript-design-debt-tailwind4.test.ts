/**
 * lint:design kände bara igen Tailwind 3:s gradientsyntax (2026-09-22).
 *
 * Mönstret matchade bara `bg-gradient-to-*`. Portalen kör Tailwind 4.2, där
 * samma sak skrivs med prefixen linear/radial/conic — och det är den formen
 * v4-dokumentationen visar. En ny gradientknapp passerade alltså grinden som
 * ska förbjuda den (DESIGN.md §6).
 *
 * OBS: klassnamnen nedan byggs med `bg('…')` i stället för att stå som
 * literaler. Grinden läser hela src/, testfiler inräknade, och en literal här
 * hade själv höjt räkningen över baslinjen.
 */
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { raknaGradienter } = require(resolve(__dirname, '../../scripts/check-design-debt.cjs')) as {
  raknaGradienter: (text: string) => number
}

const bg = (rest: string) => ['bg', rest].join('-')

describe('lint:design räknar gradienter i båda Tailwind-syntaxerna', () => {
  it.each([
    'gradient-to-r',
    'gradient-to-br',
    'linear-to-r',
    'linear-to-tl',
    'linear-45',
    'linear-[25deg,red_5%,blue_60%]',
    'radial',
    'radial-[at_50%_75%]',
    'conic',
    'conic-180',
  ])('bg-%s räknas', (rest) => {
    expect(raknaGradienter(`<div className="${bg(rest)} from-sky-500 to-indigo-500" />`)).toBe(1)
  })

  it.each(['red-500', 'linear', 'surface', '[var(--c-bg)]'])('bg-%s räknas inte', (rest) => {
    expect(raknaGradienter(`<div className="${bg(rest)}" />`)).toBe(0)
  })
})
