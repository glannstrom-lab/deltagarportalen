/**
 * CV-byggarens mallkort på engelska (driftgenomgången 2026-09-22).
 *
 * Mallarnas namn, beskrivningar, taggar och bildens alt-text var hårdkodad
 * svenska i TEMPLATES i CVBuilder.tsx och syntes så i engelskt läge. Texten
 * går nu genom `cvBuilder.templates.meta.<id>` — den här vakten ser till att
 * varje mall i TEMPLATES har en översättning på båda språken, så en ny mall
 * inte smyger in på svenska.
 *
 * Mutation: ta bort en mall ur `meta` i en av locale-filerna → testet faller.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import sv from '@/i18n/locales/sv.json'
import en from '@/i18n/locales/en.json'

const kod = readFileSync(join(__dirname, 'CVBuilder.tsx'), 'utf8')
const block = kod.slice(kod.indexOf('const TEMPLATES = ['), kod.indexOf(']\n', kod.indexOf('const TEMPLATES = [')) + 1)
const ids = [...block.matchAll(/id: '([a-z-]+)'/g)].map((m) => m[1])

type Meta = Record<string, { name: string; desc: string; f1: string; f2: string; f3: string }>

describe('CV-mallarnas texter finns på båda språken', () => {
  it('hittar mallarna i CVBuilder.tsx', () => {
    expect(ids.length).toBeGreaterThanOrEqual(12)
  })

  for (const [sprak, fil] of [['sv', sv], ['en', en]] as const) {
    it(`${sprak}: varje mall har namn, beskrivning och tre taggar`, () => {
      const meta = (fil as unknown as { cvBuilder: { templates: { meta: Meta } } }).cvBuilder.templates.meta
      for (const id of ids) {
        expect(meta[id], `${sprak}: ${id}`).toBeDefined()
        for (const falt of ['name', 'desc', 'f1', 'f2', 'f3'] as const) {
          expect(meta[id][falt], `${sprak}: ${id}.${falt}`).toBeTruthy()
        }
      }
    })
  }

  it('bildens alt-text och kortets texter går genom t()', () => {
    expect(kod).not.toMatch(/alt=\{`Förhandsvisning av mallen/)
    expect(kod).toMatch(/cvBuilder\.templates\.meta\.\$\{tpl\.id\}\.desc/)
  })
})
