/**
 * Tester för kunskapsbankens landningsvy.
 *
 * ## Mutationen som gick grönt
 *
 * `articleApi.getAll()` → `return []`. Kunskapsbanken levererade noll
 * artiklar, sökningen hittade inget och alla tretton kategorikort sa "Inga
 * artiklar än" — och samtliga 2 331 tester i projektet förblev gröna.
 *
 * Testerna nedan täcker de tre lägena (laddar / fel / klart), som DESIGN.md §3
 * kräver och som sidan saknade helt: `contentApi` bytte varje fel mot 141
 * inbyggda artiklar, så `isError` kunde aldrig bli sant.
 *
 * **Hooken mockas, inte nätverket.** Det som prövas här är hur sidan RITAR de
 * tre lägena. Att `getAll()` faktiskt kastar vid databasfel — i stället för
 * att returnera reservartiklar — prövas i
 * `services/__tests__/artikelhamtning.test.ts`, där det hör hemma.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@/test/utils'
import KnowledgeBase from './KnowledgeBase'
import type { Article } from '@/types/knowledge'

interface Hooksvar {
  data?: Article[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

let hooksvar: Hooksvar = { data: [], isLoading: false, isError: false, refetch: vi.fn() }

vi.mock('@/hooks/knowledge-base/useArticles', () => ({
  useArticles: () => hooksvar,
}))
vi.mock('@/services/contentApi', () => ({
  contentArticleApi: { searchSlugs: vi.fn(async () => []) },
}))
// Rådgivarpanelen läser en 43 kB datafil och hör inte till det som testas.
vi.mock('@/components/radgivare/RadgivarPanel', () => ({ RadgivarTips: () => null }))

afterEach(cleanup)

function artikel(id: string, category: string): Article {
  return {
    id,
    title: `Artikel ${id}`,
    summary: 'Sammanfattning.',
    content: '',
    category,
    tags: [],
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-08-12T00:00:00Z',
    readingTime: 4,
    difficulty: 'easy',
    energyLevel: 'low',
    relatedArticles: [],
  } as Article
}

const TRE = [artikel('a', 'job-search'), artikel('b', 'job-search'), artikel('c', 'wellness')]

function visa(svar: Partial<Hooksvar>, rutt = '/knowledge-base') {
  hooksvar = { data: TRE, isLoading: false, isError: false, refetch: vi.fn(), ...svar }
  return render(<KnowledgeBase />, { route: rutt })
}

describe('KnowledgeBase — de tre lägena', () => {
  it('visar ett FELLÄGE med försök-igen när artiklarna inte går att hämta', () => {
    visa({ data: undefined, isError: true })

    expect(screen.getByText(/kunde inte hämta artiklarna/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Försök igen/i })).toBeInTheDocument()
    // Får INTE se ut som ett tomt utbud.
    expect(screen.queryByText(/Fylls på/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Vad vill du läsa om/i })).not.toBeInTheDocument()
  })

  it('påstår ingenting om utbudet medan hämtningen pågår', () => {
    visa({ data: undefined, isLoading: true })

    expect(screen.queryByText(/Fylls på/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Vad vill du läsa om/i })).not.toBeInTheDocument()
  })

  it('ritar landningen när svaret är inne', () => {
    visa({})
    expect(screen.getByRole('heading', { name: /Vad vill du läsa om/i })).toBeInTheDocument()
  })
})

describe('KnowledgeBase — landningen', () => {
  it('räknar kategorierna ur DATAN, inte ur en hårdkodad lista', () => {
    visa({})

    expect(screen.getByRole('link', { name: /^Jobbsökning —/ })).toHaveAccessibleName(/2 artiklar/)
    expect(screen.getByRole('link', { name: /^Välmående och motivation —/ })).toHaveAccessibleName(/1 artikel/)
    // En kategori utan artiklar lovar ingenting den inte har.
    expect(screen.getByRole('link', { name: /^Nätverkande —/ })).toHaveAccessibleName(/fylls på/i)
  })

  it('säger hur många artiklar sökningen faktiskt täcker', () => {
    visa({})
    expect(screen.getByText(/Söker i 3 artiklar/)).toBeInTheDocument()
  })

  it('kategorikorten länkar till ett id som registret känner igen', () => {
    visa({})
    const mal = screen.getAllByRole('link', { name: /—/ }).map((k) => k.getAttribute('href'))
    expect(mal).toContain('/knowledge-base?category=job-search')
    expect(mal.every((h) => h?.startsWith('/knowledge-base?category='))).toBe(true)
  })

  it('har ett sökformulär med etikett och role="search"', () => {
    visa({})
    expect(screen.getByRole('search')).toBeInTheDocument()
    expect(screen.getByLabelText(/Vad letar du efter/i)).toBeInTheDocument()
  })

  it('visar inga emoji i kategorinamnen', () => {
    visa({})
    for (const lank of screen.getAllByRole('link', { name: /—/ })) {
      expect(lank.textContent ?? '').not.toMatch(/\p{Extended_Pictographic}/u)
    }
  })
})
