/**
 * Tester för kunskapsbankens filtrerade vy.
 *
 * ## Varför filen finns
 *
 * Ett mutationsstickprov 2026-08-22 slog sönder fyra saker i tur och ordning —
 * artikelhämtningen, sökningen, kategorifiltret och artikellänken — och
 * projektets 2 331 tester förblev **gröna varje gång**. Kunskapsbanken
 * vaktades av 32 tester som alla handlade om hur en artikeltext blir HTML,
 * och av noll om huruvida rätt artiklar över huvud taget kommer fram.
 *
 * Varje test nedan motsvarar en mutation som gick igenom.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, within } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import TopicsTab from './TopicsTab'
import type { Article } from '@/types/knowledge'

vi.mock('@/services/contentApi', () => ({
  contentArticleApi: { searchSlugs: vi.fn(async () => []) },
}))

afterEach(cleanup)

/**
 * `render` från test/utils gör själv `history.pushState(..., route)`, så en
 * egen pushState FÖRE anropet skrivs över. Rutten måste skickas in.
 */
function visa(sokstrang: string, artiklar: Article[] = ARTIKLAR) {
  return render(<TopicsTab articles={artiklar} />, { route: `/knowledge-base${sokstrang}` })
}

/** Formen är den `contentArticleApi.getAll()` faktiskt levererar. */
function artikel(over: Partial<Article> & { id: string; title: string }): Article {
  return {
    summary: '',
    content: '',
    category: 'job-search',
    tags: [],
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-08-12T00:00:00Z',
    readingTime: 4,
    difficulty: 'easy',
    energyLevel: 'low',
    relatedArticles: [],
    ...over,
  } as Article
}

const ARTIKLAR: Article[] = [
  artikel({
    id: 'cv-grunder',
    title: 'Så skriver du ett CV som får resultat',
    summary: 'Lär dig grunderna i CV-skrivning.',
    category: 'job-search',
    tags: ['CV', 'ATS'],
  }),
  artikel({
    id: 'lonesamtalet',
    title: 'Löneförhandling steg för steg',
    summary: 'Vad du säger och när.',
    category: 'interview',
    tags: ['lön'],
  }),
  artikel({
    id: 'sova-battre',
    title: 'Sömn under jobbsökningen',
    summary: 'Rutiner som håller.',
    category: 'wellness',
    tags: [],
  }),
]

describe('TopicsTab — sökning', () => {
  it('matchar titel och sammanfattning, inte kategorinyckeln', async () => {
    // Mutationen som gick grönt: sökfiltret jämförde mot `article.category`.
    // Sökordet nedan finns i EN titel och i ingen kategori.
    visa('?q=Löneförhandling')

    const lista = await screen.findByRole('heading', { level: 2, name: /Träffar på/ })
    expect(lista).toBeInTheDocument()
    expect(screen.getByText('Löneförhandling steg för steg')).toBeInTheDocument()
    expect(screen.queryByText('Sömn under jobbsökningen')).not.toBeInTheDocument()
  })

  it('hittar ordet även utan diakriter — "lon" ska ge "Löneförhandling"', () => {
    // Uppmätt mot prod före fixen: `lon` gav 0 träffar, `lön` gav 14.
    visa('?q=lonefor')
    expect(screen.getByText('Löneförhandling steg för steg')).toBeInTheDocument()
  })

  it('matchar taggar', () => {
    visa('?q=ATS')
    expect(screen.getByText('Så skriver du ett CV som får resultat')).toBeInTheDocument()
    expect(screen.queryByText('Sömn under jobbsökningen')).not.toBeInTheDocument()
  })
})

describe('TopicsTab — kategorifilter', () => {
  it('filtrerar på article.category', () => {
    // Mutationen som gick grönt: filtret jämförde mot `article.title`.
    visa('?category=wellness')

    expect(screen.getByText('Sömn under jobbsökningen')).toBeInTheDocument()
    expect(screen.queryByText('Så skriver du ett CV som får resultat')).not.toBeInTheDocument()
  })

  it('visar kategorins NAMN som rubrik, inte "Sökresultat" och inte slugen', () => {
    visa('?category=job-search')

    const rubrik = screen.getByRole('heading', { level: 2 })
    expect(rubrik).toHaveTextContent('Jobbsökning')
    expect(rubrik).not.toHaveTextContent('job-search')
    expect(rubrik).not.toHaveTextContent(/Sökresultat/)
  })

  it('skriver filtret till URL:en så bakåtknappen och delade länkar fungerar', async () => {
    visa('')
    await userEvent.click(screen.getByRole('button', { name: /Välmående/ }))
    expect(new URLSearchParams(window.location.search).get('category')).toBe('wellness')
  })
})

describe('TopicsTab — artikelkortet', () => {
  it('länkar till den sökväg App.tsx faktiskt har en route för', () => {
    // Mutationen som gick grönt: `/kunskapsbank/artikel/${id}`. Varje kort i
    // portalen ledde då till catch-allen. `lint:links` ser det inte heller —
    // mall-literaler faller utanför dess teckenklass.
    visa('?category=wellness')

    const lank = screen.getByRole('link', { name: /Sömn under jobbsökningen/ })
    expect(lank).toHaveAttribute('href', '/knowledge-base/article/sova-battre')
  })

  it('visar kategorins läsbara namn på kortet, aldrig råslugen', () => {
    visa('?category=job-search')

    const kort = screen.getByRole('link', { name: /Så skriver du ett CV/ })
    expect(within(kort).getByText('Jobbsökning')).toBeInTheDocument()
    expect(kort).not.toHaveTextContent('job-search')
  })
})

describe('TopicsTab — tomt och antal', () => {
  it('annonserar antalet träffar i en liveregion', () => {
    visa('?category=wellness')
    expect(screen.getByRole('status')).toHaveTextContent('1 artikel')
  })

  it('visar ett tomtillstånd med en väg tillbaka när inget matchar', () => {
    visa('?q=zzzqqq')
    expect(screen.getByText(/hittade ingen artikel/i)).toBeInTheDocument()
    // Två "Rensa filter" är rätt: en i filterpanelen, en i tomtillståndet.
    expect(screen.getAllByRole('button', { name: /Rensa filter/i })).toHaveLength(2)
  })
})
