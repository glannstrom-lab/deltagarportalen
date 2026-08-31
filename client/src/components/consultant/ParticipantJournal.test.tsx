/**
 * ParticipantJournal — kopplades in 2026-08-31 (beslut Mikael).
 *
 * Verifierar det uppdraget krävde:
 * - en anteckning kan sparas MED VALD KATEGORI (inte alltid 'GENERAL', som
 *   den bar textarean den ersatte gjorde)
 * - kategorin "Oro" går att sätta (gör ReportDraftDialogs CONCERN-filter
 *   meningsfullt — se komponentens filhuvud)
 * - en anteckning kan redigeras och raderas
 * - ett RLS-fel (42501, eller en tyst nollradig UPDATE/DELETE) visas som ett
 *   FEL, inte som tom data — KRAVET i CLAUDE.md: "Ett fel får aldrig se ut
 *   som tom data"
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'
import { ParticipantJournal, type JournalEntry, type JournalMutationResult } from './ParticipantJournal'

function renderJournal(overrides: Partial<React.ComponentProps<typeof ParticipantJournal>> = {}) {
  const props: React.ComponentProps<typeof ParticipantJournal> = {
    participantName: 'Anna Andersson',
    entries: [],
    loadError: null,
    onRetryLoad: vi.fn(),
    onAddEntry: vi.fn(async (): Promise<JournalMutationResult> => ({ ok: true })),
    onUpdateEntry: vi.fn(async (): Promise<JournalMutationResult> => ({ ok: true })),
    onDeleteEntry: vi.fn(async (): Promise<JournalMutationResult> => ({ ok: true })),
    ...overrides,
  }
  render(
    <ConfirmDialogProvider>
      <ParticipantJournal {...props} />
    </ConfirmDialogProvider>
  )
  return props
}

function makeEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: 'entry-1',
    content: 'Deltagaren har skickat tre ansökningar den här veckan.',
    category: 'GENERAL',
    createdAt: '2026-08-25T10:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ParticipantJournal — spara med vald kategori', () => {
  it('sparar en ny anteckning med den kategori konsulenten valt, inte alltid GENERAL', async () => {
    const props = renderJournal()

    fireEvent.click(screen.getByRole('button', { name: /Ny anteckning/i }))
    fireEvent.click(screen.getByRole('radio', { name: /Framsteg/i }))
    fireEvent.change(screen.getByPlaceholderText('Skriv din anteckning här...'), {
      target: { value: 'Har bokat in en provintervju på fredag.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Spara$/i }))

    await waitFor(() => {
      expect(props.onAddEntry).toHaveBeenCalledWith('Har bokat in en provintervju på fredag.', 'PROGRESS')
    })
  })

  it('kan sätta kategorin "Oro" — skyddet i ReportDraftDialog blir därmed meningsfullt', async () => {
    const props = renderJournal()

    fireEvent.click(screen.getByRole('button', { name: /Ny anteckning/i }))
    fireEvent.click(screen.getByRole('radio', { name: /^Oro$/i }))
    fireEvent.change(screen.getByPlaceholderText('Skriv din anteckning här...'), {
      target: { value: 'Verkar nedstämd, bör följas upp innan nästa möte.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Spara$/i }))

    await waitFor(() => {
      expect(props.onAddEntry).toHaveBeenCalledWith(
        'Verkar nedstämd, bör följas upp innan nästa möte.',
        'CONCERN'
      )
    })
  })

  it('en misslyckad sparning tappar inte det konsulenten skrev, och visar felet', async () => {
    const onAddEntry = vi.fn(
      async (): Promise<JournalMutationResult> => ({
        ok: false,
        error: 'Anteckningen kunde inte sparas — du har troligen inte längre en aktiv koppling till den här deltagaren.',
      })
    )
    renderJournal({ onAddEntry })

    fireEvent.click(screen.getByRole('button', { name: /Ny anteckning/i }))
    fireEvent.change(screen.getByPlaceholderText('Skriv din anteckning här...'), {
      target: { value: 'Ett viktigt utkast som inte får försvinna.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Spara$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/inte längre en aktiv koppling/i)
    // Texten ska fortfarande stå kvar i fältet — inget fel får kosta arbetet.
    expect(screen.getByPlaceholderText('Skriv din anteckning här...')).toHaveValue(
      'Ett viktigt utkast som inte får försvinna.'
    )
  })
})

describe('ParticipantJournal — redigering', () => {
  it('redigerar en befintlig anteckning och skickar rätt id, innehåll och kategori', async () => {
    const entry = makeEntry({ category: 'CONCERN', content: 'Ursprunglig text.' })
    const props = renderJournal({ entries: [entry] })

    fireEvent.click(screen.getByRole('button', { name: /Redigera anteckningen/i }))

    const textarea = screen.getByPlaceholderText('Skriv din anteckning här...')
    expect(textarea).toHaveValue('Ursprunglig text.')
    // Formuläret ska öppnas förifyllt med entrytens egen kategori (Oro), inte
    // återställt till GENERAL.
    expect(screen.getByRole('radio', { name: /^Oro$/i })).toHaveAttribute('aria-checked', 'true')

    fireEvent.change(textarea, { target: { value: 'Rättad text efter uppföljning.' } })
    fireEvent.click(screen.getByRole('button', { name: /^Uppdatera$/i }))

    await waitFor(() => {
      expect(props.onUpdateEntry).toHaveBeenCalledWith('entry-1', 'Rättad text efter uppföljning.', 'CONCERN')
    })
  })
})

describe('ParticipantJournal — radering', () => {
  it('raderar först efter bekräftelse, och skickar rätt id', async () => {
    const entry = makeEntry()
    const props = renderJournal({ entries: [entry] })

    fireEvent.click(screen.getByRole('button', { name: /Ta bort anteckningen/i }))

    const dialog = await screen.findByRole('dialog')
    expect(props.onDeleteEntry).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByRole('button', { name: /^Ta bort$/i }))

    await waitFor(() => {
      expect(props.onDeleteEntry).toHaveBeenCalledWith('entry-1')
    })
  })

  it('en nekad radering (tyst RLS-nollträff) visas som ett fel, inte som att raden bara försvann', async () => {
    const entry = makeEntry()
    const onDeleteEntry = vi.fn(
      async (): Promise<JournalMutationResult> => ({
        ok: false,
        error: 'Anteckningen kunde inte tas bort — du har troligen inte längre en aktiv koppling till den här deltagaren.',
      })
    )
    renderJournal({ entries: [entry], onDeleteEntry })

    fireEvent.click(screen.getByRole('button', { name: /Ta bort anteckningen/i }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /^Ta bort$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/inte längre en aktiv koppling/i)
    // Anteckningen ska fortfarande synas — den låtsas inte att raderingen lyckades.
    expect(screen.getByText(entry.content)).toBeInTheDocument()
  })
})

describe('ParticipantJournal — fel vid hämtning', () => {
  it('visar ett fel, inte tomtillståndet, när listan inte gick att hämta', () => {
    const onRetryLoad = vi.fn()
    renderJournal({
      entries: [],
      loadError: 'Anteckningarna kunde inte hämtas. Försök igen.',
      onRetryLoad,
    })

    expect(screen.getByRole('alert')).toHaveTextContent('Anteckningarna kunde inte hämtas. Försök igen.')
    expect(screen.queryByText(/Här samlas anteckningarna/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Försök igen/i }))
    expect(onRetryLoad).toHaveBeenCalled()
  })

  it('visar tomtillståndet — inte felet — när listan bara är tom', () => {
    renderJournal({ entries: [], loadError: null })

    expect(screen.getByText(/Här samlas anteckningarna/i)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
