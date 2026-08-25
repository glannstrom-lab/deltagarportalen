/**
 * Mallregistret mot verkligheten (O4, 2026-08-25).
 *
 * ## Driften som testet finns för
 *
 * Mallarnas id:n bor på tre ställen: `TEMPLATES` i `pages/CVBuilder.tsx`
 * (korten användaren väljer bland), `switch (data.template)` i
 * `components/cv/CVPreview.tsx` (vilken komponent som renderas) och nu
 * `MALLFORMER` i `data/cvMallar.ts` (spaltformen vi påstår).
 *
 * Går de isär får användaren en etikett som beskriver fel mall — vilket är
 * värre än ingen etikett alls, eftersom den ser ut att vara kontrollerad.
 * Testet läser källfilerna i stället för att lita på en kopierad lista, så en
 * ny mall som läggs till på ett ställe men inte de andra fäller bygget.
 *
 * Testet kan falla: tar man bort en rad ur MALLFORMER faller det första
 * testet, och stavar man fel på ett komponentnamn faller det tredje.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { MALLFORMER, spaltformFor } from './cvMallar'

function las(relativ: string): string {
  return readFileSync(resolve(__dirname, '..', relativ), 'utf-8')
}

const cvBuilder = las('pages/CVBuilder.tsx')
const cvPreview = las('components/cv/CVPreview.tsx')

/** Id:n ur `TEMPLATES`-listan i CV-byggaren. */
function idnIByggaren(): string[] {
  const block = cvBuilder.slice(cvBuilder.indexOf('const TEMPLATES = ['))
  const slut = block.indexOf('\n]')
  return [...block.slice(0, slut).matchAll(/^\s+id: '([a-z-]+)'/gm)].map((m) => m[1])
}

/** `case '<id>':` ur CVPreviews switch. */
function idnIPreview(): string[] {
  const start = cvPreview.indexOf('switch (data.template)')
  const block = cvPreview.slice(start, start + 2500)
  return [...block.matchAll(/case '([a-z-]+)':/g)].map((m) => m[1])
}

describe('MALLFORMER', () => {
  it('täcker exakt de mallar CV-byggaren erbjuder', () => {
    const byggaren = idnIByggaren()
    expect(byggaren.length).toBeGreaterThan(0)
    expect([...MALLFORMER.map((m) => m.id)].sort()).toEqual([...byggaren].sort())
  })

  it('täcker exakt de mallar förhandsvisningen kan rendera', () => {
    const preview = idnIPreview()
    expect(preview.length).toBeGreaterThan(0)
    // 'sidebar' ligger i CVPreview som `case 'sidebar': default:` — den räknas.
    expect([...MALLFORMER.map((m) => m.id)].sort()).toEqual([...preview].sort())
  })

  it('pekar på komponenter som finns och renderas', () => {
    for (const mall of MALLFORMER) {
      expect(cvPreview, `${mall.id} → ${mall.komponent}`).toContain(`<${mall.komponent} `)
    }
  })

  it('har ingen dubblett', () => {
    const idn = MALLFORMER.map((m) => m.id)
    expect(new Set(idn).size).toBe(idn.length)
  })
})

describe('spaltformen stämmer med mallfilerna', () => {
  it('två-spaltsmallar har en sidopanel, en-spaltsmallar har ingen', () => {
    for (const mall of MALLFORMER) {
      const kalla = las(`components/cv/templates/${mall.komponent}.tsx`)
      const harAside = kalla.includes('<aside')

      if (mall.spaltform === 'en-spalt') {
        expect(harAside, `${mall.id} påstås vara en spalt men har <aside>`).toBe(false)
      } else {
        expect(harAside, `${mall.id} påstås ha en sidopanel men har ingen <aside>`).toBe(true)
      }
    }
  })

  it('Berlins spalt är dekorativ — den bär inga uppgifter', () => {
    const berlin = las('components/cv/templates/BerlinTemplate.tsx')
    // Panelen är 60 px bred och dess text är aria-hidden. Bär den plötsligt
    // kontaktuppgifter är etiketten "dekorativ" inte längre sann.
    expect(berlin).toContain("width: '60px'")
    expect(berlin).toContain('aria-hidden="true"')
  })
})

describe('spaltformFor', () => {
  it('svarar för kända mallar', () => {
    expect(spaltformFor('minimal')).toBe('en-spalt')
    expect(spaltformFor('nordic')).toBe('tva-spalter')
    expect(spaltformFor('berlin')).toBe('dekorativ-spalt')
  })

  it('gissar aldrig för okänt id', () => {
    expect(spaltformFor('finns-inte')).toBeNull()
    expect(spaltformFor('')).toBeNull()
    expect(spaltformFor(null)).toBeNull()
    expect(spaltformFor(undefined)).toBeNull()
  })
})
