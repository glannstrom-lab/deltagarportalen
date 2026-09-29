/**
 * NY4 (datum) och SV13 (relaterade övningar) på artikelsidan.
 *
 * NY4: "Updated 9/6/2026" (en-US) lästes som 9 juni av den som är van vid
 * dag/månad. Datumet går nu genom kortDatum() — månaden skrivs ut.
 * SV13: hela kortet låg i en enda länk, så skärmläsaren läste rubrik,
 * beskrivning, kategori och tid som ett länknamn. Länknamnet är nu rubriken.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { Routes, Route } from 'react-router-dom'
import { render, screen, cleanup, within } from '@/test/utils'
import i18n from '@/i18n/config'
import Article from './Article'

const artikel = {
  id: 'skriva-cv',
  title: 'Så skriver du ett CV',
  summary: 'Kort.',
  content: 'Brödtext.',
  category: 'job-search',
  tags: [],
  readingTime: 5,
  difficulty: 'easy',
  checklist: [],
  relatedArticles: [],
  relatedExercises: ['ovning-1'],
  updatedAt: '2026-09-06T12:00:00Z',
}

vi.mock('../services/pdfExportService', () => ({ generateArticlePDF: vi.fn(), downloadPDF: vi.fn() }))
vi.mock('../services/supabaseApi', () => ({ articleApi: { getById: vi.fn(async () => artikel) } }))
vi.mock('../services/contentApi', () => ({
  contentArticleApi: { getBySlugs: vi.fn(async () => []) },
  contentExerciseApi: {
    getAll: vi.fn(async () => [
      {
        id: 'ovning-1',
        title: 'Hitta ditt jobb-jag',
        description: 'Upptäck vilken personlighetstyp du är.',
        category: 'Självkännedom',
        duration: '20-30 min',
        difficulty: 'Lätt',
        icon: () => null,
      },
    ]),
  },
}))
vi.mock('../services/cloudStorage', () => ({
  articleBookmarksApi: { isBookmarked: vi.fn(async () => false), add: vi.fn(), remove: vi.fn() },
  articleProgressApi: { get: vi.fn(async () => null), save: vi.fn(async () => {}) },
  articleChecklistApi: { get: vi.fn(async () => []), save: vi.fn(async () => {}) },
}))
vi.mock('../hooks/useAchievementTracker', () => ({
  useAchievementTracker: () => ({ trackArticleRead: vi.fn(), trackArticleSaved: vi.fn() }),
}))

function visa() {
  return render(
    <Routes>
      <Route path="/knowledge-base/article/:id" element={<Article />} />
    </Routes>,
    { route: '/knowledge-base/article/skriva-cv' }
  )
}

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('sv')
})

describe('NY4 — datumet på artikelsidan', () => {
  it('skriver ut månaden på engelska, inte M/D/ÅÅÅÅ', async () => {
    await i18n.changeLanguage('en')
    visa()
    expect(await screen.findByText(/6 September 2026/)).toBeInTheDocument()
    expect(screen.queryByText(/9\/6\/2026/)).toBeNull()
  })
})

describe('SV13 — relaterade övningar', () => {
  it('länknamnet är bara rubriken, beskrivningen ligger utanför länken', async () => {
    visa()
    const länk = await screen.findByRole('link', { name: 'Hitta ditt jobb-jag' })
    expect(länk).toHaveAttribute('href', '/exercises?id=ovning-1')
    expect(within(länk).queryByText(/personlighetstyp/)).toBeNull()
    expect(screen.getByText(/personlighetstyp/)).toBeInTheDocument()
  })
})
