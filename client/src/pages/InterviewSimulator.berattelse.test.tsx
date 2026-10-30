/**
 * AIX4 — från ett eget minne till en övning i simulatorn.
 *
 * Det som prövas här är UI-sidan av ärlighetsregeln: ett steg som servern inte
 * lämnat visas som "Saknas", aldrig som en gissning, och övningen på berättelsen
 * startas utan nytt AI-anrop för första frågan, med personens egna ord som stödord.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const callAIMock = vi.fn()
vi.mock('@/services/aiApi', () => ({
  callAI: (fn: string, params: unknown) => callAIMock(fn, params),
}))

vi.mock('@/services/interviewService', () => ({
  saveSimulatorSession: vi.fn(),
  getSimulatorSessions: () => [],
  sparaSimulatorUtkast: vi.fn(),
  lasSimulatorUtkast: () => null,
  rensaSimulatorUtkast: vi.fn(),
}))
vi.mock('@/hooks/knowledge-base/useArticles', () => ({ useArticles: () => ({ data: [], isLoading: false }) }))
vi.mock('@/components/FocusModeProvider', () => ({ useFocusMode: () => ({ isFocusMode: false, leaveWizard: vi.fn() }) }))
vi.mock('@/hooks/useAchievementTracker', () => ({ useAchievementTracker: () => ({ trackInterviewCompleted: vi.fn(), trackCVCreated: vi.fn() }) }))
vi.mock('@/hooks/useAudioRecorder', () => ({
  useAudioRecorder: () => ({ isRecording: false, startRecording: vi.fn(), stopRecording: vi.fn(), isSupported: false, error: null }),
}))
vi.mock('@/components/layout/PageLayout', () => ({
  PageLayout: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/ui/ConfirmDialog', () => ({
  useConfirmDialog: () => ({ confirm: () => Promise.resolve(true), ConfirmDialogPortal: () => null }),
}))

import InterviewSimulator from './InterviewSimulator'

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <InterviewSimulator />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const tomma = { situation: null, uppgift: null, handling: null, resultat: null }

beforeEach(() => {
  callAIMock.mockReset()
  localStorage.clear()
})

describe('AIX4: berättelsebyggaren i simulatorn', () => {
  it('visar saknade steg som "Saknas", frågar EN fråga och låter inte övningen börja utan handling', async () => {
    callAIMock.mockResolvedValueOnce({
      berattelse: {
        steg: { ...tomma, situation: 'En pall med fel varor' },
        struket: [],
        fragaSteg: 'uppgift',
        fraga: 'Vad var din del i det här?',
        sammanstallning: null,
        kalla: null,
      },
    })
    const { container } = renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Gör ett minne till en intervjuberättelse/ }))
    fireEvent.change(container.querySelector('textarea') as HTMLTextAreaElement, {
      target: { value: 'På lagret kom en pall med fel varor och jag fick lösa det.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gå vidare' }))

    await waitFor(() => expect(screen.getByText('Vad var din del i det här?')).toBeTruthy())
    expect(callAIMock).toHaveBeenCalledWith('intervju-berattelse', expect.objectContaining({ handelse: expect.stringContaining('fel varor'), svar: [] }))
    expect(screen.getAllByText(/Saknas ännu/)).toHaveLength(3)
    expect((screen.getByRole('button', { name: /Öva den här berättelsen/ }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('startar en övning på berättelsen utan nytt AI-anrop, med stödorden bredvid frågan', async () => {
    callAIMock.mockResolvedValueOnce({
      berattelse: {
        steg: { situation: 'En pall med fel varor', uppgift: null, handling: 'Jag ringde leverantören', resultat: null },
        struket: ['resultat'],
        fragaSteg: 'uppgift',
        fraga: 'Vad var din del i det här?',
        sammanstallning: null,
        kalla: null,
      },
    })
    const { container } = renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Gör ett minne till en intervjuberättelse/ }))
    fireEvent.change(container.querySelector('textarea') as HTMLTextAreaElement, {
      target: { value: 'På lagret kom en pall med fel varor. Jag ringde leverantören.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gå vidare' }))
    await waitFor(() => expect(screen.getByText(/Vi tog bort något som inte stod/)).toBeTruthy())

    callAIMock.mockClear()
    fireEvent.click(screen.getByRole('button', { name: /Öva den här berättelsen/ }))

    await waitFor(() => expect(screen.getByTestId('nuvarande-fraga').textContent).toMatch(/Berätta om en gång/))
    expect(callAIMock).not.toHaveBeenCalled()
    const stod = screen.getByRole('region', { name: 'Dina stödord' })
    expect(within(stod).getByText(/Jag ringde leverantören/)).toBeTruthy()
    // Det som saknas är inte ifyllt åt henne.
    expect(within(stod).getAllByText(/fyller du i själv/)).toHaveLength(2)
    expect(stod.textContent).not.toMatch(/nöjd|lyckad/i)
  })
})
