/**
 * Vakt för KT4 (2026-08-31): statusikonernas kontrast höll inte SC 1.4.11.
 *
 * `text-amber-600` (#D97706) på `bg-amber-100` (#FEF3C7) mäter 2,86:1 — kravet
 * för grafiska element som bär information är 3:1. Paret satt på "Behöver
 * kontakt" / "lågt engagemang" i OverviewTab (den lista konsulenten skannar
 * först varje morgon) och återkom i tre andra filer. `text-amber-700`
 * (#B45309) på samma botten mäter 4,51:1 och klarar gränsen med marginal.
 *
 * Källkodsvakt, inte en renderingsvakt: felet sitter i en Tailwind-klass som
 * en mockad rendering inte avslöjar (jsdom räknar inte kontrast). Se
 * lärdomen 2026-08-09 ("mutationsstickprov slår kodläsning") — denna vakt är
 * mutationstestad genom att återinföra `text-amber-600` och bekräfta att den
 * faller.
 *
 * Rör INTE detta test till att gälla amber i allmänhet — KT3 (amber som
 * hubfärg i konsulentvyn) är ett separat beslut med egen omfattning. Den här
 * vakten kontrollerar bara paret text-amber-600 + bg-amber-100.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(__dirname, '..', '..')

/** Källkoden UTAN kommentarer — annars matchar vakten sin egen förklaring. */
const kod = (relativSokvag: string) =>
  readFileSync(join(ROOT, relativSokvag), 'utf-8')
    .replace(/(?<!:)\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')

const FILER = [
  'pages/consultant/OverviewTab.tsx',
  'components/consultant/ConsultantStats.tsx',
  'components/consultant/InsightsPanel.tsx',
  'pages/consultant/AnalyticsTab.tsx',
] as const

describe('Statusikonernas kontrast (KT4) — text-amber-600 på bg-amber-100 är förbjudet', () => {
  it.each(FILER)('%s innehåller inte det underkända paret text-amber-600 + bg-amber-100', (fil) => {
    const kalla = kod(fil)

    // Det underkända paret kan stå i valfri ordning inom samma Tailwind-
    // klasslista ("text-amber-600 bg-amber-100" eller tvärtom). Vi letar
    // därför efter varje rad/klass-sträng som innehåller BÅDA klasserna.
    const rader = kalla.split('\n')
    const overtradelser = rader.filter(
      (rad) => /\btext-amber-600\b/.test(rad) && /\bbg-amber-100\b/.test(rad)
    )

    expect(overtradelser).toEqual([])
  })

  it.each(FILER)('%s har inte tappat den mörka varianten (dark:bg-amber-900) där bg-amber-100 finns', (fil) => {
    const kalla = kod(fil)

    // Varje bg-amber-100 ska ha en dark:bg-amber-900-variant intill sig —
    // annars återkommer felet att en ljus botten används rakt av i mörkt
    // läge (rättat i OverviewTab.tsx:173/188 i samma commit).
    const rader = kalla.split('\n')
    const utanMorktLage = rader.filter(
      (rad) => /\bbg-amber-100\b/.test(rad) && !/dark:bg-amber-900/.test(rad)
    )

    expect(utanMorktLage).toEqual([])
  })
})
