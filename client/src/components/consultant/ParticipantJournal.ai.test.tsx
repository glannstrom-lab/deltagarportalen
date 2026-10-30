/**
 * AIX11 — journalpost från stolpar.
 *
 * Det som måste hålla:
 *  - hälsoord i stolparna ger en varning INNAN något anrop görs
 *  - inget sparas av AI:n: förslaget hamnar i textrutan först efter "läst" + "Använd förslaget"
 *  - en AI-formulerad post sparas med märkningen "AI-formulerad, granskad"
 *  - en egen anteckning sparas utan märkning
 *  - utkastet går genom AIX13-granskaren (ett påhittat tal syns)
 *  - AI avstängd = ingen knapp
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'
import { ParticipantJournal, type JournalMutationResult } from './ParticipantJournal'
import { A2_BESVARAD } from './a2Sparr'
import { AI_MARKERING } from './journalAi'
import { callAI } from '@/services/aiApi'

vi.mock('@/services/aiApi', () => {
  class AiConsentRequiredError extends Error {}
  return { callAI: vi.fn(), AiConsentRequiredError }
})

function renderJournal(overrides: Partial<React.ComponentProps<typeof ParticipantJournal>> = {}) {
  const props: React.ComponentProps<typeof ParticipantJournal> = {
    participantName: 'Anna Andersson',
    journalAi: true,
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

const skrivStolpar = (text: string) => {
  fireEvent.click(screen.getByRole('button', { name: /Ny anteckning/i }))
  fireEvent.change(screen.getByPlaceholderText('Skriv din anteckning här...'), { target: { value: text } })
}
const klickaAi = () => fireEvent.click(screen.getByRole('button', { name: /Formulera med AI/i }))
const svar = (journalpost: string) =>
  vi.mocked(callAI).mockResolvedValueOnce({ journalpost } as unknown as Awaited<ReturnType<typeof callAI>>)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AIX11 — hälsovarning före anrop', () => {
  it('stolpar med hälsoord ger en varning och INGET anrop', () => {
    renderJournal()
    skrivStolpar('Ringde. Hon har en diagnos och mår dåligt.')
    klickaAi()

    expect(screen.getByRole('alert')).toHaveTextContent(/hälsouppgifter/i)
    expect(screen.getByRole('alert')).toHaveTextContent(/utan AI/i)
    expect(callAI).not.toHaveBeenCalled()
  })

  it('"Spara utan AI" stänger varningen — stolparna är kvar och inget har skickats', () => {
    renderJournal()
    skrivStolpar('Sjukskriven sedan måndag.')
    klickaAi()
    fireEvent.click(screen.getByRole('button', { name: /Spara utan AI/i }))

    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByPlaceholderText('Skriv din anteckning här...')).toHaveValue('Sjukskriven sedan måndag.')
    expect(callAI).not.toHaveBeenCalled()
  })

  it('"Formulera med AI ändå" är ett uttryckligt val och anropar då', async () => {
    svar('Deltagaren var sjukskriven.')
    renderJournal()
    skrivStolpar('Sjukskriven sedan måndag.')
    klickaAi()
    fireEvent.click(screen.getByRole('button', { name: /Formulera med AI ändå/i }))

    await waitFor(() => expect(callAI).toHaveBeenCalledTimes(1))
  })

  it('stolpar utan hälsoord anropar direkt, med stolparna som enda indata', async () => {
    svar('Deltagaren ringde och berättade att hon sökt två jobb.')
    renderJournal()
    skrivStolpar('ringde, sökt 2 jobb')
    klickaAi()

    await waitFor(() => expect(callAI).toHaveBeenCalledTimes(1))
    expect(callAI).toHaveBeenCalledWith('konsulent-journalpost', { stolpar: 'ringde, sökt 2 jobb' })
  })
})

describe('AIX11 — inget sparas av sig självt', () => {
  it('förslaget ligger i en egen ruta; textrutan och onAddEntry är orörda tills konsulenten använder det', async () => {
    svar('Deltagaren sökte 2 jobb.')
    const props = renderJournal()
    skrivStolpar('sökt 2 jobb')
    klickaAi()

    expect(await screen.findByTestId('journalpost-forslag')).toHaveTextContent('Deltagaren sökte 2 jobb.')
    expect(screen.getByPlaceholderText('Skriv din anteckning här...')).toHaveValue('sökt 2 jobb')
    expect(props.onAddEntry).not.toHaveBeenCalled()
  })

  it('"Använd förslaget" kräver att "läst" är ikryssat', async () => {
    svar('Deltagaren sökte 2 jobb.')
    renderJournal()
    skrivStolpar('sökt 2 jobb')
    klickaAi()
    await screen.findByTestId('journalpost-forslag')

    expect(screen.getByRole('button', { name: /Använd förslaget/i })).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox', { name: /läst igenom/i }))
    expect(screen.getByRole('button', { name: /Använd förslaget/i })).toBeEnabled()
  })

  it('en AI-formulerad post sparas med märkningen "AI-formulerad, granskad"', async () => {
    svar('Deltagaren sökte 2 jobb.')
    const props = renderJournal()
    skrivStolpar('sökt 2 jobb')
    klickaAi()
    await screen.findByTestId('journalpost-forslag')
    fireEvent.click(screen.getByRole('checkbox', { name: /läst igenom/i }))
    fireEvent.click(screen.getByRole('button', { name: /Använd förslaget/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Spara$/i }))

    await waitFor(() => expect(props.onAddEntry).toHaveBeenCalledTimes(1))
    const sparad = vi.mocked(props.onAddEntry).mock.calls[0][0]
    expect(sparad).toContain('Deltagaren sökte 2 jobb.')
    expect(sparad).toContain(AI_MARKERING)
  })

  it('en egen anteckning sparas utan märkning', async () => {
    const props = renderJournal()
    skrivStolpar('Egen text.')
    fireEvent.click(screen.getByRole('button', { name: /^Spara$/i }))

    await waitFor(() => expect(props.onAddEntry).toHaveBeenCalledTimes(1))
    expect(vi.mocked(props.onAddEntry).mock.calls[0][0]).toBe('Egen text.')
  })

  it('att slänga förslaget lämnar stolparna och ingen märkning', async () => {
    svar('Deltagaren sökte 2 jobb.')
    const props = renderJournal()
    skrivStolpar('sökt 2 jobb')
    klickaAi()
    await screen.findByTestId('journalpost-forslag')
    fireEvent.click(screen.getByRole('button', { name: /Släng förslaget/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Spara$/i }))

    await waitFor(() => expect(props.onAddEntry).toHaveBeenCalledTimes(1))
    expect(vi.mocked(props.onAddEntry).mock.calls[0][0]).toBe('sökt 2 jobb')
  })
})

describe('AIX11 — granskning och fel', () => {
  it('AIX13: ett tal som inte fanns i stolparna flaggas i förslaget', async () => {
    svar('Deltagaren sökte 9 jobb.')
    renderJournal()
    skrivStolpar('sökt 2 jobb')
    klickaAi()

    const granskning = await screen.findByTestId('utkast-granskning')
    expect(granskning).toHaveTextContent(/1 mening att kontrollera/)
    expect(granskning).toHaveTextContent(/"9"/)
    expect(granskning).toHaveTextContent(/inte mot sanningen/)
  })

  it('AIX13: ett värdeomdöme i förslaget flaggas', async () => {
    svar('Deltagaren är motiverad och sökte 2 jobb.')
    renderJournal()
    skrivStolpar('sökt 2 jobb')
    klickaAi()

    expect(await screen.findByTestId('utkast-granskning')).toHaveTextContent(/Värderande ord/)
  })

  it('ett AI-fel lämnar texten kvar och säger det', async () => {
    vi.mocked(callAI).mockRejectedValueOnce(new Error('503'))
    renderJournal()
    skrivStolpar('sökt 2 jobb')
    klickaAi()

    expect(await screen.findByRole('alert')).toHaveTextContent(/kunde inte formuleras/)
    expect(screen.getByPlaceholderText('Skriv din anteckning här...')).toHaveValue('sökt 2 jobb')
  })

  it('spärr A2: knappen finns inte i drift förrän juristfrågan är besvarad', () => {
    expect(A2_BESVARAD).toBe(false)
    renderJournal({ journalAi: undefined })
    skrivStolpar('sökt 2 jobb')
    expect(screen.queryByTestId('journalpost-ai')).toBeNull()
  })

  it('AI avstängd: ingen knapp, ett lugnt besked', () => {
    renderJournal({ aiAv: true })
    skrivStolpar('sökt 2 jobb')

    expect(screen.queryByRole('button', { name: /Formulera med AI/i })).toBeNull()
    expect(screen.getByTestId('journalpost-ai')).toHaveTextContent(/AI är avstängd/)
  })
})
