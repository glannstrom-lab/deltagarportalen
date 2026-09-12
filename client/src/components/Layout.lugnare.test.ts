/**
 * PG12 (persona-genomgång 2026-09-12): Lugnare läge låg bara i rådgivarkolumnen
 * i Layout, så de sju sidor som saknar rådgivarinnehåll (Min vecka, CV, Hjälp,
 * Nätverk, Integritet, Tillgänglighet …) hade det inte alls på mobil — där
 * TopBar med fokuslägesknappen inte heller renderas.
 *
 * Layout är för tungt att montera i jsdom (lazy-laddade paneler, stores,
 * router). Vakten läser källan: blocket som ritar LugnarePanel utanför
 * rådgivarvillkoret ska finnas och vara villkorat på just mobil + ingen rådgivare.
 * Tar någon bort blocket, eller villkorar det på visaRadgivare igen, faller testet.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const kalla = readFileSync(join(__dirname, 'Layout.tsx'), 'utf8').replace(/\r\n/g, '\n')

describe('Lugnare läge finns på mobil även utan rådgivarinnehåll (PG12)', () => {
  it('LugnarePanel ritas i ett eget block villkorat på isMobile && !visaRadgivare', () => {
    const block = /\{showBars && isMobile && !visaRadgivare && \(\s*<div[^>]*>\s*<Suspense fallback=\{null\}>\s*<LugnarePanel \/>/
    expect(kalla).toMatch(block)
  })

  it('rådgivarkolumnens LugnarePanel finns kvar (desktop och sidor med rådgivare)', () => {
    const traffar = kalla.match(/<LugnarePanel \/>/g) ?? []
    expect(traffar.length).toBe(2)
  })

  it('ingen tom rådgivarkolumn återinförs på desktop: grid-klassen är fortfarande villkorad på visaRadgivare', () => {
    expect(kalla).toMatch(/cn\(visaRadgivare && 'xl:grid xl:grid-cols-\[minmax\(0,1fr\)_300px\] xl:gap-6'\)/)
  })
})
