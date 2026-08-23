/**
 * Tester för artikelsidans Skriv ut och Ladda ner.
 *
 * Bakgrund: sidan `/print-resources` togs bort 2026-08-23. Där valde man
 * artiklar i en andra lista och exporterade dem i klump. Nu sitter de två
 * handlingarna på artikeln man redan läser.
 *
 * Det som prövas är kopplingen — att knapparna finns, att de faktiskt kallar
 * `window.print()` respektive `generateArticlePDF` + `downloadPDF`, och att
 * kategorin skickas som visningsnamn och inte som slug. Själva PDF-innehållet
 * hör hemma i `pdfExportService` och prövas inte här.
 *
 * Mutationskontroll (2026-08-23): tas `onClick={skrivUtArtikel}` bort faller
 * utskriftstestet; skickas `article.category` rått i stället för
 * `kategoriNamn(...)` faller kategoritestet.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Routes, Route } from 'react-router-dom'
import { render, screen, cleanup, waitFor, userEvent } from '@/test/utils'
import Article from './Article'

const artikel = {
  id: 'skriva-cv',
  title: 'Så skriver du ett CV',
  summary: 'Kort sammanfattning.',
  content: 'Brödtext med **fetstil**.',
  category: 'job-search',
  tags: ['cv'],
  readingTime: 5,
  difficulty: 'easy',
  checklist: [{ id: 'c1', text: 'Läs igenom en gång till' }],
  relatedArticles: [],
  relatedExercises: [],
  updatedAt: '2026-08-12T00:00:00Z',
}

// Argumenttyperna är inte dekoration: utan dem blir `mock.calls[0]` en tom
// tupel, och `calls[0][0]` ett typfel mot det frysta taket.
const generatePDF = vi.hoisted(() =>
  vi.fn(async (_underlag: { title: string; category?: string }) => new Blob(['pdf']))
)
const laddaNer = vi.hoisted(() => vi.fn((_blob: Blob, _filnamn: string) => {}))

vi.mock('../services/pdfExportService', () => ({
  generateArticlePDF: generatePDF,
  downloadPDF: laddaNer,
}))
vi.mock('../services/supabaseApi', () => ({
  articleApi: { getById: vi.fn(async () => artikel) },
}))
vi.mock('../services/contentApi', () => ({
  contentArticleApi: { getBySlugs: vi.fn(async () => []) },
  contentExerciseApi: { getAll: vi.fn(async () => []) },
}))
vi.mock('../services/cloudStorage', () => ({
  articleBookmarksApi: {
    isBookmarked: vi.fn(async () => false),
    add: vi.fn(),
    remove: vi.fn(),
  },
  // Läsprogress och checklista monteras av artikeln men hör inte till det
  // som prövas här. Utan dem loggar båda ett fel per rendering.
  articleProgressApi: { get: vi.fn(async () => null), save: vi.fn(async () => {}) },
  articleChecklistApi: { get: vi.fn(async () => []), save: vi.fn(async () => {}) },
}))
vi.mock('../hooks/useAchievementTracker', () => ({
  useAchievementTracker: () => ({ trackArticleRead: vi.fn(), trackArticleSaved: vi.fn() }),
}))

function visaArtikel() {
  return render(
    <Routes>
      <Route path="/knowledge-base/article/:id" element={<Article />} />
    </Routes>,
    { route: '/knowledge-base/article/skriva-cv' }
  )
}

beforeEach(() => {
  generatePDF.mockClear()
  laddaNer.mockClear()
})
afterEach(cleanup)

describe('Artikelsidan — skriv ut och ladda ner', () => {
  it('kallar webbläsarens utskrift när Skriv ut trycks', async () => {
    const skrivUt = vi.spyOn(window, 'print').mockImplementation(() => {})
    visaArtikel()
    const knapp = await screen.findByRole('button', { name: 'Skriv ut' })

    await userEvent.click(knapp)

    expect(skrivUt).toHaveBeenCalledTimes(1)
    skrivUt.mockRestore()
  })

  it('laddar ner artikeln som PDF med slugen som filnamn', async () => {
    visaArtikel()
    const knapp = await screen.findByRole('button', { name: 'Ladda ner' })

    await userEvent.click(knapp)

    await waitFor(() => expect(laddaNer).toHaveBeenCalledTimes(1))
    expect(laddaNer.mock.calls[0][1]).toBe('skriva-cv.pdf')
  })

  it('skickar kategorins visningsnamn till PDF:en, inte slugen', async () => {
    visaArtikel()
    await userEvent.click(await screen.findByRole('button', { name: 'Ladda ner' }))

    await waitFor(() => expect(generatePDF).toHaveBeenCalledTimes(1))
    const underlag = generatePDF.mock.calls[0][0]
    expect(underlag.category).not.toBe('job-search')
    expect(underlag.title).toBe('Så skriver du ett CV')
  })

  it('säger till när PDF:en inte gick att skapa', async () => {
    generatePDF.mockRejectedValueOnce(new Error('jsPDF nere'))
    visaArtikel()
    await userEvent.click(await screen.findByRole('button', { name: 'Ladda ner' }))

    expect(await screen.findByText(/Kunde inte skapa PDF/)).toBeInTheDocument()
    expect(laddaNer).not.toHaveBeenCalled()
  })

  // Utskriftsreglerna i accessibility.css hänger på kroppsklassen. Utan den
  // skriver webbläsaren ut hela portalen — skena, rådgivare och allt.
  it('märker kroppen som artikelsida så utskriftsreglerna gäller', async () => {
    const { unmount } = visaArtikel()
    await screen.findByRole('button', { name: 'Skriv ut' })

    expect(document.body.classList.contains('artikelsida')).toBe(true)
    unmount()
    expect(document.body.classList.contains('artikelsida')).toBe(false)
  })
})
