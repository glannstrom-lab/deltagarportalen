/**
 * Kategoriregistret mot verkligheten.
 *
 * ## Mutationen som gick grönt
 *
 * Ett kategori-id ändrades från `wellness` till `valmaende`. Kortet
 * "Välmående och motivation" pekade då på `?category=valmaende`, filtret
 * matchade noll artiklar, kortet sa "Inga artiklar än" — och samtliga 2 331
 * tester förblev gröna. Ett kort som leder till ett tomt rum ser ut som ett
 * innehållsproblem, inte som en bugg.
 *
 * Id-listan nedan är **mätt mot prod** 2026-08-22:
 *
 *   SELECT category_key, count(*) FROM articles WHERE is_active GROUP BY 1;
 *     job-search 27 · wellness 19 · career-development 16 · interview 15
 *     easy-swedish 15 · employment-law 13 · self-awareness 12 · job-market 11
 *     accessibility 11 · digital-presence 10 · networking 6 · tools 6
 *     getting-started 2                                        Σ 163
 */

import { describe, it, expect } from 'vitest'
import {
  ARTIKELKATEGORIER,
  harKategori,
  kategoriNamn,
  kategoriBeskrivning,
  kategoriIkon,
} from './artikelkategorier'
import { articleCategories } from '@/services/articleData'
import svJson from '@/i18n/locales/sv.json'
import enJson from '@/i18n/locales/en.json'

/** `category_key`-värdena i prod, mätta mot databasen (se filhuvudet). */
const KATEGORIER_I_PROD = [
  'accessibility',
  'career-development',
  'digital-presence',
  'easy-swedish',
  'employment-law',
  'getting-started',
  'interview',
  'job-market',
  'job-search',
  'networking',
  'self-awareness',
  'tools',
  'wellness',
]

/** i18next-liknande uppslag: hittas nyckeln används den, annars reserven. */
function fejkT(ordbok: Record<string, unknown>) {
  return ((nyckel: string, reserv?: string) => {
    let nod: unknown = ordbok
    for (const del of nyckel.split('.')) {
      if (nod && typeof nod === 'object' && del in (nod as Record<string, unknown>)) {
        nod = (nod as Record<string, unknown>)[del]
      } else {
        return reserv ?? nyckel
      }
    }
    return typeof nod === 'string' ? nod : (reserv ?? nyckel)
  }) as never
}

describe('ARTIKELKATEGORIER mot prod', () => {
  it('täcker exakt de category_key som artiklarna faktiskt bär', () => {
    const iRegistret = ARTIKELKATEGORIER.map((k) => k.id).sort()
    expect(iRegistret).toEqual([...KATEGORIER_I_PROD].sort())
  })

  it('delar id-rymd med det gamla registret i articleData', () => {
    // De två listorna får ha olika namn (emoji vs inte), men aldrig olika id —
    // då pekar landningens kort och filterkolumnen på skilda saker.
    const gamla = articleCategories.map((k) => k.id).sort()
    expect(ARTIKELKATEGORIER.map((k) => k.id).sort()).toEqual(gamla)
  })

  it('har unika id och en ikon per kategori', () => {
    const idn = ARTIKELKATEGORIER.map((k) => k.id)
    expect(new Set(idn).size).toBe(idn.length)
    for (const kategori of ARTIKELKATEGORIER) {
      // Lucide-ikoner är forwardRef-OBJEKT, inte funktioner.
      expect(kategori.ikon, kategori.id).toBeTruthy()
      expect(['function', 'object']).toContain(typeof kategori.ikon)
    }
  })
})

describe('kategoriNamn', () => {
  it('returnerar ALDRIG slugen — inte ens för en okänd kategori', () => {
    const t = fejkT(svJson)
    for (const id of [...KATEGORIER_I_PROD, 'nagot-som-inte-finns', '', null, undefined]) {
      const namn = kategoriNamn(t, id as string)
      expect(namn).not.toBe(id)
      expect(namn).not.toMatch(/^[a-z]+(-[a-z]+)*$/)
    }
  })

  it('bär inga emoji — de lästes upp som "raket komma igång"', () => {
    const t = fejkT(svJson)
    for (const kategori of ARTIKELKATEGORIER) {
      expect(kategoriNamn(t, kategori.id)).not.toMatch(/\p{Extended_Pictographic}/u)
    }
  })

  it('faller tillbaka på det svenska reservnamnet när nyckeln saknas', () => {
    const t = fejkT({})
    expect(kategoriNamn(t, 'job-search')).toBe('Jobbsökning')
    expect(kategoriBeskrivning(t, 'job-search')).toMatch(/Strategier/)
  })
})

describe('språkfilerna', () => {
  for (const [sprak, ordbok] of [
    ['sv', svJson],
    ['en', enJson],
  ] as const) {
    it(`${sprak}.json har namn och beskrivning för varje kategori`, () => {
      const t = fejkT(ordbok)
      const kategorier = (ordbok as { knowledgeBase: { categories: Record<string, unknown> } })
        .knowledgeBase.categories
      for (const kategori of ARTIKELKATEGORIER) {
        expect(kategorier[kategori.id], `${sprak}: ${kategori.id}`).toBeDefined()
        expect(kategoriNamn(t, kategori.id).length).toBeGreaterThan(2)
        expect(kategoriBeskrivning(t, kategori.id).length).toBeGreaterThan(10)
      }
    })
  }
})

describe('hjälpfunktionerna', () => {
  it('harKategori säger nej till okända och tomma värden', () => {
    expect(harKategori('wellness')).toBe(true)
    expect(harKategori('valmaende')).toBe(false)
    expect(harKategori('')).toBe(false)
    expect(harKategori(undefined)).toBe(false)
  })

  it('kategoriIkon ger en reservikon i stället för att krascha', () => {
    expect(kategoriIkon('finns-inte')).toBeTruthy()
    expect(['function', 'object']).toContain(typeof kategoriIkon('finns-inte'))
  })
})
