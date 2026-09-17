/**
 * Chromium-binären får aldrig tillbaka in i funktionsbundlen.
 *
 * BAKGRUND (2026-09-17). `@sparticuz/chromium` bär `bin/chromium.br` — 64 MB —
 * och den följde med i VARJE deploy. Uppmätt: `cv-pdf.func` var 90 MB av
 * ~120 MB per deployment, och Functions Storage på Vercel låg över Hobby-taket.
 * Paketet är utbytt mot `@sparticuz/chromium-min` (52 kB, samma kod utan
 * binär); binären hämtas vid kallstart från `CHROMIUM_PACK_URL`.
 *
 * VARFÖR EN GRIND. Ett `npm install @sparticuz/chromium` — eller en `import`
 * som råkar tappa `-min` — återför 66 MB per deploy helt tyst. Ingen
 * befintlig grind mäter bundlestorlek, bygget blir grönt, testerna blir
 * gröna, och siffran syns först på Vercels Usage-sida veckor senare. Exakt
 * den klassen tog en månad att hitta förra gången (A19).
 *
 * VAKTEN MATCHAR KODFORMEN, inte ordet: paketnamnet följt av ett tecken som
 * inte är bindestreck. `@sparticuz/chromium-min` matchar därför inte, medan
 * `require('@sparticuz/chromium')` och `"@sparticuz/chromium": "^148"` gör
 * det. Prosan här i huvudet nämner båda namnen och får inte läsas — därför
 * söks bara i package.json och i client/api/, aldrig i den här filen.
 * (Lärdomen 2026-08-21: en vakt som matchar sin egen förklaring kan aldrig
 * bli grön.)
 *
 * Mutationstestad 2026-09-17: att byta importen i cv-pdf.js tillbaka till
 * paketet utan `-min` fäller testet, och att ta bort `CHROMIUM_PACK_URL`
 * fäller det andra fallet.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const API_DIR = resolve(__dirname, '../../api')
const PKG = resolve(__dirname, '../../package.json')

/** Paketet som bär binären, satt ihop så att den här filen inte matchar sig själv. */
const TUNGT = ['@sparticuz', 'chromium'].join('/')
/** Namnet följt av något som inte är ett bindestreck — så `-min` går fri. */
const TUNGT_MONSTER = new RegExp(
  TUNGT.replace(/[/@]/g, (c) => `\\${c}`) + '(?![-\\w])',
)

function apiFiler(): string[] {
  return readdirSync(API_DIR, { recursive: true, encoding: 'utf-8' })
    .filter((f) => f.endsWith('.js'))
    .map((f) => resolve(API_DIR, f))
}

describe('Chromium-binären ligger utanför funktionsbundlen', () => {
  it('package.json har inte paketet som bär binären', () => {
    const pkg = JSON.parse(readFileSync(PKG, 'utf-8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const alla = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
    const traffar = alla.filter((n) => TUNGT_MONSTER.test(n))
    expect(
      traffar,
      `${traffar.join(', ')} bär bin/chromium.br (64 MB) och hamnar i varje deploy. ` +
        'Använd -min-varianten och CHROMIUM_PACK_URL.',
    ).toEqual([])
  })

  it('ingen fil i client/api/ importerar paketet som bär binären', () => {
    const syndare = apiFiler().filter((f) => {
      // Bara rader med import/require — kommentarer som beskriver historiken
      // ska få nämna paketet.
      return readFileSync(f, 'utf-8')
        .split(/\r?\n/)
        .some((rad) => /\b(import|require)\b/.test(rad) && TUNGT_MONSTER.test(rad))
    })
    expect(syndare, `${syndare.join(', ')} drar in 64 MB binär i bundlen.`).toEqual([])
  })

  it('cv-pdf.js hämtar binären från CHROMIUM_PACK_URL', () => {
    const kod = readFileSync(resolve(API_DIR, 'cv-pdf.js'), 'utf-8')
    expect(kod).toContain('process.env.CHROMIUM_PACK_URL')
    // Utan URL ska funktionen kasta, inte tyst starta en Chromium som inte finns.
    expect(kod).toMatch(/if \(!kalla\)[\s\S]{0,200}throw new Error/)
  })
})
