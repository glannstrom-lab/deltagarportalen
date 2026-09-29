/**
 * SFT3/SV4 — ett sparat dagboksinlägg går att ändra. UPDATE är grindad av
 * hälsosamtycke i RLS (MV2), så ett nekat UPDATE ska synas i formuläret.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockUpdateEntry = vi.fn()
const entries = [
  { id: 'e1', title: 'Min dag', content: 'Gammal text', mood: 3, tags: ['jobb'], entry_date: '2026-08-10', word_count: 2, is_favorite: false },
]

vi.mock('@/hooks/useDiary', () => ({
  useDiaryEntries: () => ({
    entries,
    isLoading: false,
    isError: false,
    retry: vi.fn(),
    createEntry: vi.fn(),
    updateEntry: mockUpdateEntry,
    deleteEntry: vi.fn(),
    toggleFavorite: vi.fn(),
  }),
  useWritingPrompts: () => ({ prompt: null, getNewPrompt: vi.fn(), isLoading: false }),
}))

import { JournalTab } from './JournalTab'

describe('JournalTab — ändra ett sparat inlägg', () => {
  beforeEach(() => {
    mockUpdateEntry.mockReset()
  })

  it('fyller formuläret med inläggets värden och sparar via updateEntry', async () => {
    mockUpdateEntry.mockResolvedValue({ ok: true, entry: { ...entries[0], content: 'Ny text' } })
    const user = userEvent.setup()
    render(<JournalTab />)
    await user.click(screen.getByRole('button', { name: /ändra dagboksinlägget "min dag"/i }))

    const content = screen.getByLabelText(/dina tankar|innehåll/i) as HTMLTextAreaElement
    expect(content.value).toBe('Gammal text')
    await user.clear(content)
    await user.type(content, 'Ny text')
    await user.click(screen.getByRole('button', { name: /^spara$/i }))

    expect(mockUpdateEntry).toHaveBeenCalledWith(
      'e1',
      expect.objectContaining({ content: 'Ny text', mood: 3, tags: ['jobb'] })
    )
  })

  it('ett nekat UPDATE visas och texten ligger kvar', async () => {
    mockUpdateEntry.mockResolvedValue({ ok: false, orsak: 'samtycke' })
    const user = userEvent.setup()
    render(<JournalTab />)
    await user.click(screen.getByRole('button', { name: /ändra dagboksinlägget "min dag"/i }))
    await user.click(screen.getByRole('button', { name: /^spara$/i }))

    expect(await screen.findByText(/sparades inte/i)).toBeInTheDocument()
    expect((screen.getByLabelText(/dina tankar|innehåll/i) as HTMLTextAreaElement).value).toBe('Gammal text')
  })

  it('"Ändra" finns i läsvyn', async () => {
    const user = userEvent.setup()
    render(<JournalTab />)
    await user.click(screen.getByText('Gammal text'))
    await user.click(screen.getByRole('button', { name: /^ändra$/i }))
    expect(screen.getByLabelText(/dina tankar|innehåll/i)).toBeInTheDocument()
  })
})
