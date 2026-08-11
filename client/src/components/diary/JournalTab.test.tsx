/**
 * JournalTab — F21 (WCAG 4.1.2): fyra namnlösa ikonknappar på desktop
 * (docs/portal-review-2026-08-09.md fynd 5 / ROADMAP F21). Raderingsknappen
 * är den viktigaste — den förstör data och läses tidigare bara upp som
 * "knapp", oavsett vilket inlägg den hör till.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const mockToggleFavorite = vi.fn()
const mockDeleteEntry = vi.fn()
const mockGetNewPrompt = vi.fn()

const entries = [
  { id: 'e1', title: 'Min dag', content: 'Innehåll', tags: [], entry_date: '2026-08-10', word_count: 2, is_favorite: false },
]

vi.mock('@/hooks/useDiary', () => ({
  useDiaryEntries: () => ({
    entries,
    isLoading: false,
    createEntry: vi.fn(),
    deleteEntry: mockDeleteEntry,
    toggleFavorite: mockToggleFavorite,
  }),
  useWritingPrompts: () => ({
    prompt: { prompt_text: 'Skriv om din dag' },
    getNewPrompt: mockGetNewPrompt,
    isLoading: false,
  }),
}))

import { JournalTab } from './JournalTab'

describe('F21: JournalTab ikonknappar har tillgängliga namn', () => {
  beforeEach(() => {
    mockToggleFavorite.mockReset()
    mockDeleteEntry.mockReset()
    mockGetNewPrompt.mockReset()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('raderingsknappen namnger vilket inlägg den tar bort, inte bara "knapp"', () => {
    render(<JournalTab />)
    const deleteBtn = screen.getByRole('button', { name: /radera dagboksinlägget "min dag"/i })
    expect(deleteBtn).toBeInTheDocument()

    fireEvent.click(deleteBtn)
    expect(mockDeleteEntry).toHaveBeenCalledWith('e1')
  })

  it('favorit-knappen har ett namn som beskriver handlingen och inlägget', () => {
    render(<JournalTab />)
    expect(screen.getByRole('button', { name: /markera "min dag" som favorit/i })).toBeInTheDocument()
  })

  it('filterknappen har ett tillgängligt namn', () => {
    render(<JournalTab />)
    expect(screen.getByRole('button', { name: /filtrera efter tagg/i })).toBeInTheDocument()
  })

  it('skrivtips-knappen har ett tillgängligt namn', () => {
    render(<JournalTab />)
    expect(screen.getByRole('button', { name: /nytt skrivtips/i })).toBeInTheDocument()
  })
})
