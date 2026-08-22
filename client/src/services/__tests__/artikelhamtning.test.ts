/**
 * Kontraktstest för artikelhämtningen.
 *
 * ## Mutationen som gick grönt
 *
 * `contentApi.ts:202` — `if (error)` → `if (!error)`, alltså "fall alltid
 * tillbaka på reservkopian". Hela portalen serverade då 141 inbyggda artiklar
 * i stället för prods 163, och samtliga 2 331 tester förblev gröna.
 *
 * Reservkopian är borttagen 2026-08-22. Det som vaktas här är att den inte
 * kommer tillbaka: ett databasfel ska KASTA, så att React Query kan sätta
 * `isError` och sidan kan säga att den inte når artiklarna. Ett fel som ser
 * ut som innehåll är portalens vanligaste felklass (CLAUDE.md, 2026-08-09).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const svar = { data: null as unknown, error: null as unknown }

vi.mock('@/lib/supabase', () => {
  const kedja: Record<string, unknown> = {}
  const self = () => kedja
  Object.assign(kedja, {
    select: self,
    eq: self,
    in: self,
    or: self,
    limit: self,
    order: self,
    returns: () => Promise.resolve(svar),
    maybeSingle: () => Promise.resolve(svar),
    then: (lös: (v: unknown) => unknown) => Promise.resolve(svar).then(lös),
  })
  return { supabase: { from: () => kedja } }
})

const { contentArticleApi } = await import('@/services/contentApi')

const RAD = {
  id: '11111111-1111-1111-1111-111111111111',
  slug: 'cv-grunder',
  title: 'Så skriver du ett CV',
  summary: 'Grunderna.',
  category_key: 'job-search',
  subcategory: null,
  tags: ['CV'],
  reading_time: 4,
  difficulty: 'easy',
  energy_level: 'low',
  author: 'Katarina Holm',
  author_title: 'Handläggare Arbetsförmedlingen',
  related_article_slugs: [],
  related_exercise_slugs: [],
  related_tools: [],
  checklist: [],
  actions: [],
  helpfulness_rating: null,
  bookmark_count: 0,
  created_at: '2026-05-15T21:54:28Z',
  updated_at: '2026-08-12T08:39:56Z',
}

beforeEach(() => {
  svar.data = null
  svar.error = null
})

describe('contentArticleApi.getAll', () => {
  it('KASTAR vid databasfel — returnerar aldrig reservartiklar', async () => {
    svar.error = { message: 'permission denied for table articles', code: '42501' }
    await expect(contentArticleApi.getAll()).rejects.toThrow(/Kunde inte hämta artiklar/)
  })

  it('returnerar tom lista när databasen faktiskt är tom', async () => {
    svar.data = []
    await expect(contentArticleApi.getAll()).resolves.toEqual([])
  })

  it('mappar databasraden till artikelformen UI:t läser', async () => {
    svar.data = [RAD]
    const [artikel] = await contentArticleApi.getAll()

    expect(artikel.id).toBe('cv-grunder') // slug, inte uuid — kortlänkarna bygger på det
    expect(artikel.category).toBe('job-search')
    expect(artikel.updatedAt).toBe('2026-08-12T08:39:56Z')
    // Listvyerna hämtar inte brödtexten. Ett `undefined` här skulle krascha
    // varje `.toLowerCase()` i sökfiltret.
    expect(artikel.content).toBe('')
  })
})

describe('contentArticleApi.getBySlugs', () => {
  it('frågar inte alls när listan är tom', async () => {
    svar.error = { message: 'skulle ha kastat om frågan gick iväg' }
    await expect(contentArticleApi.getBySlugs([])).resolves.toEqual([])
  })

  it('behåller ordningen anroparen bad om', async () => {
    svar.data = [
      { ...RAD, slug: 'b', title: 'B' },
      { ...RAD, slug: 'a', title: 'A' },
    ]
    const träffar = await contentArticleApi.getBySlugs(['a', 'b'])
    expect(träffar.map((a) => a.id)).toEqual(['a', 'b'])
  })
})

describe('contentArticleApi.searchSlugs', () => {
  it('söker inte på ett enda tecken', async () => {
    svar.error = { message: 'skulle ha kastat om frågan gick iväg' }
    await expect(contentArticleApi.searchSlugs('a')).resolves.toEqual([])
  })

  it('returnerar tomt i stället för att kasta när sökningen failar', async () => {
    // Sökningen är ett tillägg till klientfiltret. Faller den ska listan
    // fortfarande visa det den kan matcha lokalt.
    svar.error = { message: 'timeout' }
    await expect(contentArticleApi.searchSlugs('personligt brev')).resolves.toEqual([])
  })
})
