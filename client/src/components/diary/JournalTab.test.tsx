/**
 * JournalTab — F21 (WCAG 4.1.2): fyra namnlösa ikonknappar på desktop
 * (docs/portal-review-2026-08-09.md fynd 5 / ROADMAP F21). Raderingsknappen
 * är den viktigaste — den förstör data och läses tidigare bara upp som
 * "knapp", oavsett vilket inlägg den hör till.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockToggleFavorite = vi.fn()
const mockDeleteEntry = vi.fn()
const mockGetNewPrompt = vi.fn()
const mockCreateEntry = vi.fn()

const entries = [
  { id: 'e1', title: 'Min dag', content: 'Innehåll', tags: [], entry_date: '2026-08-10', word_count: 2, is_favorite: false },
]

const lage = { isError: false, entries: entries as unknown[] }
const mockRetry = vi.fn()

vi.mock('@/hooks/useDiary', () => ({
  useDiaryEntries: () => ({
    entries: lage.entries,
    isLoading: false,
    isError: lage.isError,
    retry: mockRetry,
    createEntry: mockCreateEntry,
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
    mockCreateEntry.mockReset()
    mockCreateEntry.mockResolvedValue({ ok: true, entry: { id: 'ny' } })
    lage.isError = false
    lage.entries = entries
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

describe('F6: mood är valfritt, inte förvalt', () => {
  beforeEach(() => {
    mockCreateEntry.mockReset()
    mockCreateEntry.mockResolvedValue({ ok: true, entry: { id: 'ny' } })
    lage.isError = false
    lage.entries = entries
  })

  const oppnaSkrivläge = async (user: ReturnType<typeof userEvent.setup>) => {
    render(<JournalTab />)
    await user.click(screen.getByRole('button', { name: /^ny anteckning$/i }))
  }

  it('en sparad rad bär mood: null om användaren aldrig rört reglaget', async () => {
    const user = userEvent.setup()
    await oppnaSkrivläge(user)

    const content = screen.getByLabelText(/dina tankar|innehåll/i)
    await user.type(content, 'En vanlig jobbsökaranteckning.')
    await user.click(screen.getByRole('button', { name: /^spara$/i }))

    expect(mockCreateEntry).toHaveBeenCalledWith(
      expect.objectContaining({ mood: null })
    )
  })

  it('klick på samma mood-knapp igen rensar valet', async () => {
    const user = userEvent.setup()
    await oppnaSkrivläge(user)

    const moodButtons = ['😢', '😔', '😐', '🙂', '😄'].map((emoji) =>
      screen.getByRole('button', { name: emoji })
    )

    await user.click(moodButtons[2]) // välj mood 3
    expect(moodButtons[2]).toHaveAttribute('aria-pressed', 'true')

    await user.click(moodButtons[2]) // klicka igen — rensar
    expect(moodButtons[2]).toHaveAttribute('aria-pressed', 'false')

    const content = screen.getByLabelText(/dina tankar|innehåll/i)
    await user.type(content, 'Text.')
    await user.click(screen.getByRole('button', { name: /^spara$/i }))
    expect(mockCreateEntry).toHaveBeenCalledWith(expect.objectContaining({ mood: null }))
  })
})

/**
 * 2026-09-22 — dagboken svalde fel i två lager (diaryApi → [], useDiary
 * fångade igen), så JournalTab visade "Skriv ditt första inlägg" vid ett
 * läsfel. Och skrivrutan stängdes och tömdes även när databasen nekade
 * sparningen — varje inlägg utan hälsosamtycke (diary_entries kräver det på
 * INSERT) försvann utan ett ord.
 *
 * Mutationer (kontrollerade): ta bort `if (isError)`-grenen → test 1 faller;
 * ta bort `if (fel) { setSparfel… return }` i WriteModal → test 2 och 3 faller.
 */
describe('JournalTab — laddar / fel / klart', () => {
  beforeEach(() => {
    mockCreateEntry.mockReset()
    mockRetry.mockReset()
    lage.isError = false
    lage.entries = []
  })

  it('ett läsfel visar ett fel med "Försök igen", inte den tomma dagboken', () => {
    lage.isError = true
    render(<JournalTab />)
    expect(screen.getByRole('alert')).toHaveTextContent(/kunde inte hämta din dagbok/i)
    expect(screen.queryByText(/skriv ditt första inlägg/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /försök igen/i }))
    expect(mockRetry).toHaveBeenCalled()
  })

  const skrivOchSpara = async (user: ReturnType<typeof userEvent.setup>) => {
    render(<JournalTab />)
    await user.click(screen.getByRole('button', { name: /^ny anteckning$/i }))
    await user.type(screen.getByLabelText(/dina tankar|innehåll/i), 'Viktig text.')
    await user.click(screen.getByRole('button', { name: /^spara$/i }))
  }

  it('nekad sparning utan samtycke: rutan stannar, texten finns kvar, orsaken sägs', async () => {
    mockCreateEntry.mockResolvedValue({ ok: false, orsak: 'samtycke' })
    const user = userEvent.setup()
    await skrivOchSpara(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(/mående/i)
    expect(screen.getByLabelText(/dina tankar|innehåll/i)).toHaveValue('Skriv om din dag\n\nViktig text.')
  })

  it('övrigt fel: rutan stannar med ett fel', async () => {
    mockCreateEntry.mockResolvedValue({ ok: false, orsak: 'fel' })
    const user = userEvent.setup()
    await skrivOchSpara(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(/gick inte att spara/i)
    expect(screen.getByLabelText(/dina tankar|innehåll/i)).toBeInTheDocument()
  })

  it('lyckad sparning stänger rutan', async () => {
    mockCreateEntry.mockResolvedValue({ ok: true, entry: { id: 'ny' } })
    const user = userEvent.setup()
    await skrivOchSpara(user)

    expect(screen.queryByLabelText(/dina tankar|innehåll/i)).not.toBeInTheDocument()
  })
})
