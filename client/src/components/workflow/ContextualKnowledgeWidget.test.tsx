/**
 * Kunskapsrutan i CV-byggaren visade tre påhittade artiklar (`cv-1`–`cv-3`)
 * med påhittade lästider. Ingen av dem fanns i kunskapsbanken (0 av 4 i prod,
 * 2026-09-22) — varje klick ledde till "artikeln finns inte". Nu väljs riktiga
 * artiklar ur useArticles().
 *
 * Mutation: lägg tillbaka en hårdkodad lista → första testet faller.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const artiklar = vi.fn()
vi.mock('@/hooks/knowledge-base/useArticles', () => ({
  useArticles: () => ({ data: artiklar() }),
}))

import { ContextualKnowledgeWidget, valjArtiklar } from './ContextualKnowledgeWidget'

afterEach(() => cleanup())

const LISTA = [
  { id: 'cv-grunder', title: 'Grunderna i ett CV', summary: 'Så börjar du', category: 'job-search', readingTime: 5 },
  { id: 'luckor-i-cv', title: 'Luckor i CV:t', category: 'job-search', readingTime: 4 },
  { id: 'lattsvenska-cv', title: 'CV på lätt svenska', category: 'easy-swedish', readingTime: 1 },
  { id: 'intervju-fragor', title: 'Vanliga intervjufrågor', category: 'interview', readingTime: 6 },
]

function rendera() {
  return render(
    <MemoryRouter>
      <ContextualKnowledgeWidget context="cv-building" variant="full" />
    </MemoryRouter>
  )
}

describe('ContextualKnowledgeWidget', () => {
  it('länkar bara till artiklar som finns', () => {
    artiklar.mockReturnValue(LISTA)
    rendera()
    const lankar = screen.getAllByRole('link').map((l) => l.getAttribute('href'))
    expect(lankar).toEqual(['/knowledge-base/article/cv-grunder', '/knowledge-base/article/luckor-i-cv'])
  })

  it('visar ingenting medan listan laddar — inga reservartiklar', () => {
    artiklar.mockReturnValue(undefined)
    const { container } = rendera()
    expect(container).toBeEmptyDOMElement()
  })

  it('väljer per kontext via slug och kategori', () => {
    expect(valjArtiklar(LISTA, 'interview-prep', 3).map((a) => a.id)).toEqual(['intervju-fragor'])
    expect(valjArtiklar(LISTA, 'cv-building', 1).map((a) => a.id)).toEqual(['cv-grunder'])
  })
})
