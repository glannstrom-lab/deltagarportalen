/**
 * B12 (2026-08-05) — intervjusimulatorn får inte visa ett betyg AI aldrig gav.
 *
 * Koden satte `rating: resultat.rating || 3` och `feedback: resultat.feedback ||
 * 'Bra svar!'`. Saknade AI-svaret betyg fick deltagaren alltså en trea, märkt
 * "AI-betyg" i historiken, inräknad i snittet — och ett beröm som ingen
 * bedömning låg bakom. Dessutom räknades snittet på *alla* svar, så obetygsatta
 * svar drog ned det som nollor.
 *
 * Testerna låser fast att en siffra bara visas när någon faktiskt satt den, och
 * att det står vem som satte den.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const callAIMock = vi.fn()
vi.mock('@/services/aiApi', () => ({
  callAI: (fn: string, params: unknown) => callAIMock(fn, params),
}))

vi.mock('@/services/interviewService', () => ({
  saveSimulatorSession: vi.fn(),
}))

// Fokusläget har en egen guide-vy — vi testar den vanliga sidan.
vi.mock('@/components/FocusModeProvider', () => ({
  useFocusMode: () => ({ isFocusMode: false, leaveWizard: vi.fn() }),
}))

vi.mock('@/hooks/useAchievementTracker', () => ({
  useAchievementTracker: () => ({
    trackInterviewCompleted: vi.fn(),
    trackCVCreated: vi.fn(),
  }),
}))

vi.mock('@/hooks/useAudioRecorder', () => ({
  useAudioRecorder: () => ({
    isRecording: false,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    isSupported: false,
    error: null,
  }),
}))

vi.mock('@/components/layout/PageLayout', () => ({
  PageLayout: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/ConfirmDialog', () => ({
  useConfirmDialog: () => ({
    confirm: () => Promise.resolve(true),
    ConfirmDialogPortal: () => null,
  }),
}))

import InterviewSimulator from './InterviewSimulator'

const renderPage = () =>
  render(
    <MemoryRouter>
      <InterviewSimulator />
    </MemoryRouter>
  )

/** Fälla ut feedback-panelen för svar nr `index` (den är hopfälld som default). */
async function visaFeedback(index = 0) {
  const knappar = await screen.findAllByRole('button', { name: /Visa feedback och tips/ })
  fireEvent.click(knappar[index])
}

/** Skicka in ett svar i en redan startad intervju. */
async function skickaSvar(container: HTMLElement, svar: string) {
  const textarea = container.querySelector('textarea') as HTMLTextAreaElement
  fireEvent.change(textarea, { target: { value: svar } })
  fireEvent.click(await screen.findByRole('button', { name: /Nästa fråga/ }))
}

/** Starta en intervju och skicka in ett svar. */
async function startaOchSvara(container: HTMLElement, svar = 'Mitt svar på frågan') {
  const rollFalt = container.querySelector('input') as HTMLInputElement
  fireEvent.change(rollFalt, { target: { value: 'Utvecklare' } })

  fireEvent.click(screen.getByRole('button', { name: 'Starta intervjun' }))

  await waitFor(() => {
    expect(container.querySelector('textarea')).toBeTruthy()
  })

  await skickaSvar(container, svar)
}

beforeEach(() => {
  // mockReset, inte clearAllMocks: clear tömmer anropslistan men lämnar kvar
  // oanvända mockResolvedValueOnce-köer, som då läcker in i nästa test.
  callAIMock.mockReset()
})

describe('InterviewSimulator — betyg utan bedömning', () => {
  it('sätter inget betyg när AI-svaret saknar rating', async () => {
    callAIMock
      // Första anropet: startfrågan
      .mockResolvedValueOnce({ resultat: 'Berätta om dig själv' })
      // Andra anropet: bedömning utan rating — det var här trean uppstod
      .mockResolvedValueOnce({ resultat: { feedback: 'Utveckla gärna mer.', nastaFraga: 'Nästa fråga?' } })

    const { container } = renderPage()
    await startaOchSvara(container)
    await visaFeedback()

    await waitFor(() => {
      expect(container.textContent).toContain('Utveckla gärna mer.')
    })

    // Ingen "AI-betyg"-etikett, eftersom AI:n inte gav något betyg.
    expect(container.textContent).not.toMatch(/AI-betyg/)
    expect(container.textContent).toMatch(/Betygsätt detta svar/)
    // Och inget snitt — ett snitt över noll bedömningar finns inte.
    expect(container.textContent).toContain('Inget svar är betygsatt än')
    expect(container.textContent).not.toMatch(/3\.0\/5|0\.0\/5/)
  })

  it('hittar inte på beröm när AI-svaret saknar feedback', async () => {
    callAIMock
      .mockResolvedValueOnce({ resultat: 'Berätta om dig själv' })
      .mockResolvedValueOnce({ resultat: { rating: 4, nastaFraga: 'Nästa fråga?' } })

    const { container } = renderPage()
    await startaOchSvara(container)

    await waitFor(() => {
      expect(container.textContent).toMatch(/AI-betyg/)
    })

    // 'Bra svar!' var den hårdkodade fallbacken — den fanns bara i koden.
    expect(container.textContent).not.toContain('Bra svar!')
  })

  it('visar AI:ns betyg som AI-betyg och räknar snittet på det', async () => {
    callAIMock
      .mockResolvedValueOnce({ resultat: 'Berätta om dig själv' })
      .mockResolvedValueOnce({ resultat: { rating: 5, feedback: 'Starkt svar.', nastaFraga: 'Nästa?' } })

    const { container } = renderPage()
    await startaOchSvara(container)

    await waitFor(() => {
      expect(container.textContent).toMatch(/AI-betyg/)
    })

    expect(container.textContent).toContain('5.0/5')
  })

  it('avvisar betyg utanför 1-5 i stället för att visa dem', async () => {
    callAIMock
      .mockResolvedValueOnce({ resultat: 'Berätta om dig själv' })
      .mockResolvedValueOnce({ resultat: { rating: 42, feedback: 'Feedback här.', nastaFraga: 'Nästa?' } })

    const { container } = renderPage()
    await startaOchSvara(container)
    await visaFeedback()

    await waitFor(() => {
      expect(container.textContent).toContain('Feedback här.')
    })

    expect(container.textContent).not.toContain('42')
    expect(container.textContent).not.toMatch(/AI-betyg/)
    expect(container.textContent).toContain('Inget svar är betygsatt än')
  })

  it('kallar deltagarens eget betyg för deltagarens, inte AI:ns', async () => {
    callAIMock
      .mockResolvedValueOnce({ resultat: 'Berätta om dig själv' })
      .mockResolvedValueOnce({ resultat: { feedback: 'Feedback.', nastaFraga: 'Nästa?' } })

    const { container } = renderPage()
    await startaOchSvara(container)

    await waitFor(() => {
      expect(container.textContent).toMatch(/Betygsätt detta svar/)
    })

    const stjarnor = screen.getAllByRole('button', { name: /Betyg \d av 5/ })
    fireEvent.click(stjarnor[3]) // fyra stjärnor

    await waitFor(() => {
      expect(container.textContent).toMatch(/Ditt betyg/)
    })

    expect(container.textContent).not.toMatch(/AI-betyg/)
    expect(container.textContent).toContain('4.0/5')
  })

  it('räknar snittet bara på betygsatta svar — obetygsatta drar inte ned det', async () => {
    callAIMock
      .mockResolvedValueOnce({ resultat: 'Fråga 1' })
      // Svar 1: AI ger 5
      .mockResolvedValueOnce({ resultat: { rating: 5, feedback: 'Bra.', nastaFraga: 'Fråga 2' } })
      // Svar 2: AI ger inget betyg
      .mockResolvedValueOnce({ resultat: { feedback: 'Okej.', nastaFraga: 'Fråga 3' } })

    const { container } = renderPage()
    await startaOchSvara(container, 'Första svaret')

    await waitFor(() => {
      expect(container.textContent).toContain('5.0/5')
    })

    await skickaSvar(container, 'Andra svaret')

    await waitFor(() => {
      expect(container.textContent).toContain('Andra svaret')
    })

    // Gamla uträkningen: (5 + 0) / 2 = "2.5/5". Nu: 5 / 1.
    expect(container.textContent).toContain('5.0/5')
    expect(container.textContent).not.toContain('2.5/5')

    // Sammanfattningsskärmen ska tala om hur tunt underlaget är.
    fireEvent.click(screen.getByRole('button', { name: /Avsluta intervjun/ }))
    await waitFor(() => {
      expect(container.textContent).toContain('Baserat på 1 betygsatt svar')
    })
  })
})
