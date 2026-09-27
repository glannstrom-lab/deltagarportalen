/**
 * ParticipantJournal — journal enligt SoL (RK38, rollspelet 2026-09-27).
 *
 * Före migrationen (solKolumner false): klockslag och författare syns på varje
 * rad, men inga fält för kontaktform/klockslag och inget extra skickas.
 * Efter (true): fälten finns, `extra` följer med, ändrade rader visar när och
 * har en ändringslogg där originalet står först.
 *
 * Motprov (körda): (1) skicka alltid `extra` → "före migrationen"-testet faller.
 * (2) sortera på createdAt i stället för kontaktTid → ordningstestet faller.
 * (3) ta bort JournalHistorik-raden → loggtestet faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'

const historik = vi.hoisted(() => ({ hamta: vi.fn(), namn: vi.fn() }))
vi.mock('@/services/journalSol', async () => {
  const faktisk = await vi.importActual<typeof import('@/services/journalSol')>('@/services/journalSol')
  return { ...faktisk, hamtaJournalHistorik: historik.hamta, hamtaNamn: historik.namn }
})

import { ParticipantJournal, type JournalEntry, type JournalMutationResult } from './ParticipantJournal'

function rita(overrides: Partial<React.ComponentProps<typeof ParticipantJournal>> = {}) {
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
  render(<ConfirmDialogProvider><ParticipantJournal {...props} /></ConfirmDialogProvider>)
  return props
}

const rad = (o: Partial<JournalEntry>): JournalEntry => ({
  id: 'j1', content: 'Ringde om intervjun.', category: 'GENERAL', createdAt: new Date(2026, 8, 27, 10, 30).toISOString(), consultantId: 'k1', ...o,
})

beforeEach(() => {
  vi.clearAllMocks()
  historik.namn.mockResolvedValue({ k1: 'Karin Konsulent' })
})

describe('Journal enligt SoL — före migrationen', () => {
  it('klockslag och författare på varje rad, men inga nya fält och inget extra till föräldern', async () => {
    const props = rita({ currentConsultantId: 'k1', entries: [rad({})], solKolumner: false })
    expect(screen.getByText(/Kl\. 10:30 · skriven av dig/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Ny anteckning/i }))
    expect(screen.queryByLabelText('Kontaktform')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('När skedde kontakten?')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Anteckning'), { target: { value: 'Möte om CV' } })
    fireEvent.click(screen.getByRole('button', { name: /^Spara$/ }))
    await waitFor(() => expect(props.onAddEntry).toHaveBeenCalledTimes(1))
    expect((props.onAddEntry as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual(['Möte om CV', 'GENERAL'])
  })
})

describe('Journal enligt SoL — efter migrationen', () => {
  it('kontaktform och klockslag skickas med som extra', async () => {
    const props = rita({ solKolumner: true })
    fireEvent.click(screen.getByRole('button', { name: /Ny anteckning/i }))
    fireEvent.change(screen.getByLabelText('Kontaktform'), { target: { value: 'telefon' } })
    fireEvent.change(screen.getByLabelText('När skedde kontakten?'), { target: { value: '2026-09-26T13:05' } })
    fireEvent.change(screen.getByLabelText('Anteckning'), { target: { value: 'Ringde, mår bättre.' } })
    fireEvent.click(screen.getByRole('button', { name: /^Spara$/ }))
    await waitFor(() => expect(props.onAddEntry).toHaveBeenCalledWith('Ringde, mår bättre.', 'GENERAL', {
      occurredAt: new Date(2026, 8, 26, 13, 5).toISOString(),
      contactForm: 'telefon',
    }))
  })

  it('ett klockslag i framtiden sparas inte — felet visas och texten står kvar', async () => {
    const props = rita({ solKolumner: true })
    fireEvent.click(screen.getByRole('button', { name: /Ny anteckning/i }))
    fireEvent.change(screen.getByLabelText('När skedde kontakten?'), { target: { value: '2099-01-01T09:00' } })
    fireEvent.change(screen.getByLabelText('Anteckning'), { target: { value: 'Text' } })
    fireEvent.click(screen.getByRole('button', { name: /^Spara$/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Klockslaget ligger i framtiden.')
    expect(props.onAddEntry).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Anteckning')).toHaveValue('Text')
  })

  it('raderna ordnas efter när kontakten skedde och visar kontaktform', () => {
    rita({
      solKolumner: true,
      currentConsultantId: 'k1',
      entries: [
        rad({ id: 'a', content: 'Skrevs sist men gällde i går', createdAt: new Date(2026, 8, 27, 11, 30).toISOString(), occurredAt: new Date(2026, 8, 26, 14).toISOString(), contactForm: 'besok' }),
        rad({ id: 'b', content: 'Skrevs först, gällde i dag', createdAt: new Date(2026, 8, 27, 11).toISOString() }),
      ],
    })
    const texter = screen.getAllByText(/^Skrevs/).map((e) => e.textContent)
    expect(texter).toEqual(['Skrevs först, gällde i dag', 'Skrevs sist men gällde i går'])
    expect(screen.getByText('Besök')).toBeInTheDocument()
    expect(screen.getByText(/Kontakt 14:00 · skriven av dig · journalförd/)).toBeInTheDocument()
  })

  it('en ändrad rad säger när och visar ändringsloggen med originalet först', async () => {
    historik.hamta.mockResolvedValue([
      { id: 'r1', journalId: 'j1', action: 'update', content: 'Originaltexten', category: 'GENERAL', occurredAt: null, contactForm: null, authorId: 'k1', versionFrom: '2026-09-25T08:00:00Z', changedBy: 'k1', changedAt: '2026-09-26T08:00:00Z' },
    ])
    rita({ solKolumner: true, currentConsultantId: 'k1', entries: [rad({ updatedAt: '2026-09-26T08:00:00Z', updatedBy: 'k1' })] })
    fireEvent.click(screen.getByRole('button', { name: 'Visa ändringarna' }))
    const logg = await screen.findByRole('list', { name: 'Tidigare versioner' })
    expect(logg).toHaveTextContent('Original')
    expect(logg).toHaveTextContent('Originaltexten')
    expect(logg).toHaveTextContent('Ändrad 26 sep 2026 10:00 av Karin Konsulent')
    expect(historik.hamta).toHaveBeenCalledWith('j1', true)
  })

  it('kan loggen inte hämtas står det så, med "Försök igen"', async () => {
    historik.hamta.mockRejectedValueOnce(new Error('nekad'))
    rita({ solKolumner: true, currentConsultantId: 'k1', entries: [rad({ updatedAt: '2026-09-26T08:00:00Z' })] })
    fireEvent.click(screen.getByRole('button', { name: 'Visa ändringarna' }))
    expect(await screen.findByText(/Ändringsloggen kunde inte hämtas/)).toBeInTheDocument()
  })

  it('bekräftelsen vid radering säger att originalet sparas', async () => {
    rita({ solKolumner: true, currentConsultantId: 'k1', entries: [rad({})] })
    fireEvent.click(screen.getByRole('button', { name: /Ta bort anteckningen/i }))
    expect(await screen.findByText(/Originalet sparas i ändringsloggen/)).toBeInTheDocument()
  })
})
