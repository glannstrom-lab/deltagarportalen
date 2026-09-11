/**
 * KG3 — en delningsbild per kategori/sidtyp, inte samma på alla 269 sidor.
 *
 * Tre saker som annars ruttnar tyst:
 *   1. registret pekar på en fil som inte finns → 404 i delningskortet;
 *   2. en kategori i guides.cjs saknar bild → faller tillbaka på den gamla utan
 *      att någon ser det;
 *   3. mallen får tillbaka det hårdkodade värdet på något av de sju ställena.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

/* eslint-disable @typescript-eslint/no-require-imports */
const ogBild = require('../../scripts/lib/og-bild.cjs') as {
  OG_BILDER: Record<string, { fil: string; hub: string; rubrik: string }>
  HUBBAR: Record<string, { bg: string; text: string; solid: string }>
  FALLBACK: string
  ogBildFor: (sida: { typ?: string; category_key?: string }) => string
  ogBildSokvag: (sida: { typ?: string; category_key?: string }) => string
  allaBildfiler: () => string[]
}
const guides = require('../../scripts/lib/guides.cjs') as {
  KATEGORI_NAMN: Record<string, string>
  KATEGORIER: Array<{ key: string; slug: string; rubrik: string }>
  SITE: string
}
const mall = require('../../scripts/lib/guide-template.cjs') as {
  renderGuide: (a: unknown, relaterade: unknown[]) => string
  renderIndex: (artiklar: unknown[]) => string
  renderLattlast: (artiklar: unknown[]) => string
  renderKategori: (kat: unknown, artiklar: unknown[], syskon: unknown[]) => string
  renderTool: (t: unknown, guider: unknown[]) => string
  renderToolIndex: (verktyg: unknown[]) => string
  renderB2B: (b: unknown, guider: unknown[]) => string
}
/* eslint-enable @typescript-eslint/no-require-imports */

const PUBLIC = join(__dirname, '..', '..', 'public')

function artikel(over: Record<string, unknown> = {}) {
  return {
    slug: 'cv-grunder',
    title: 'Så skriver du ett CV',
    summary: 'Vad som ska stå i ett CV.',
    content: '## Rubrik\n\nEn kort brödtext.\n',
    category_key: 'job-search',
    difficulty: 'medium',
    reading_time: 4,
    checklist: null,
    related_tools: null,
    actions: null,
    ...over,
  }
}

describe('registret mot disk', () => {
  it('varje bildfil i registret finns i public/og/ och är under 150 kB', () => {
    for (const fil of ogBild.allaBildfiler()) {
      const p = join(PUBLIC, 'og', `${fil}.png`)
      expect(existsSync(p), `${fil}.png saknas — kör node scripts/og-bilder.cjs`).toBe(true)
      expect(statSync(p).size).toBeLessThan(150 * 1024)
    }
  })

  it('varje kategori i KATEGORI_NAMN har en egen bild (ingen faller tillbaka)', () => {
    for (const key of Object.keys(guides.KATEGORI_NAMN)) {
      expect(ogBild.ogBildSokvag({ typ: 'guide', category_key: key }), key).not.toBe(ogBild.FALLBACK)
    }
    for (const kat of guides.KATEGORIER) {
      expect(ogBild.ogBildSokvag({ typ: 'kategori', category_key: kat.key }), kat.key).not.toBe(ogBild.FALLBACK)
    }
  })

  it('varje bild hör till en hubb i paletten', () => {
    for (const [key, post] of Object.entries(ogBild.OG_BILDER)) {
      expect(Object.keys(ogBild.HUBBAR), key).toContain(post.hub)
    }
  })

  it('okänd kategori och saknad typ ger fallbacken, aldrig en påhittad sökväg', () => {
    expect(ogBild.ogBildSokvag({ typ: 'guide', category_key: 'finns-inte' })).toBe(ogBild.FALLBACK)
    expect(ogBild.ogBildSokvag({ typ: 'nagot-annat' })).toBe(ogBild.FALLBACK)
    expect(ogBild.ogBildFor({ typ: 'guide', category_key: 'finns-inte' })).toBe(`${guides.SITE}/og-image.png`)
  })
})

describe('mallen använder registret', () => {
  const meta = (html: string) => html.match(/<meta property="og:image" content="([^"]+)">/)?.[1]

  it('en guide i varje kategori får sin kategoribild — inte den gemensamma', () => {
    const sedda = new Set<string>()
    for (const key of Object.keys(guides.KATEGORI_NAMN)) {
      const html = mall.renderGuide(artikel({ category_key: key }), [])
      const bild = meta(html)
      expect(bild, key).toBe(ogBild.ogBildFor({ typ: 'guide', category_key: key }))
      expect(bild, key).not.toContain('/og-image.png')
      sedda.add(bild!)
    }
    // Minst fem olika bilder över kategorierna — annars är "per kategori" bara en omdöpning.
    expect(sedda.size).toBeGreaterThanOrEqual(5)
  })

  it('index, lättläst, kategorisida, verktyg, verktygsindex och B2B får var sin', () => {
    const kat = guides.KATEGORIER[0]
    const tool = { slug: 'cv', title: 'CV-byggare', description: 'x', h1: 'CV', lead: 'x', route: '/cv', punkter: [], steg: [], for: [], faq: [], guider: [] }
    const b2b = { slug: 'for-arbetsmarknadsenheter', malgrupp: 'x', title: 'x', description: 'x', h1: 'x', lead: 'x', facts: [], ctaLabel: 'x', ctaAmne: 'x', forDeltagaren: { rubrik: 'x', text: 'x', punkter: [], lankHref: '/verktyg/', lankText: 'x' }, forKonsulenten: { rubrik: 'x', text: 'x', punkter: [], obs: null }, leverantorsvardag: null, gdprAi: { rubrik: 'x', intro: 'x', klart: [], pagar: [], lankHref: '/#/privacy', lankText: 'x' }, tillganglighet: { rubrik: 'x', text: 'x', lankHref: '/#/tillganglighet', lankText: 'x' }, faq: [], guider: [], slutCta: { rubrik: 'x', text: 'x', ctaLabel: 'x', ctaAmne: 'x' } }
    const fall: Array<[string, string | undefined]> = [
      ['index', meta(mall.renderIndex([artikel()]))],
      ['lattlast', meta(mall.renderLattlast([artikel({ category_key: 'easy-swedish' })]))],
      ['kategori', meta(mall.renderKategori(kat, [artikel({ category_key: kat.key })], guides.KATEGORIER))],
      ['tool', meta(mall.renderTool(tool, []))],
      ['tool-index', meta(mall.renderToolIndex([tool]))],
      ['b2b', meta(mall.renderB2B(b2b, []))],
    ]
    for (const [typ, bild] of fall) {
      expect(bild, typ).toBeDefined()
      expect(bild, typ).not.toContain('/og-image.png')
      expect(bild, typ).toMatch(/\/og\/[a-z-]+\.png$/)
    }
    expect(fall.find((f) => f[0] === 'kategori')![1]).toBe(ogBild.ogBildFor({ typ: 'kategori', category_key: kat.key }))
  })
})
