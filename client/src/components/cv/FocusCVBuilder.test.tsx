/**
 * CB3 — Fokuslägets CV-wizard avancerade tidigare oavsett om sparningen
 * lyckades.
 *
 * `handleSave()` var en fire-and-forget `mutate()`, och `setCurrentStep`
 * kördes på raden direkt efter — utan att vänta på svaret. Misslyckades
 * sparningen visades bara en toast medan deltagaren redan stod på nästa
 * steg, med den ifyllda informationen i limbo. Fokusläget är byggt för
 * användare med minst marginal för just den sortens förvirring.
 *
 * Fixen: `goNext` väntar nu in `handleSave()` (som i sin tur väntar in
 * `saveMutation.mutateAsync`). Lyckas sparningen byts steget som förut;
 * misslyckas den stannar wizarden kvar på steget med felet synligt
 * (`role="alert"`) och en "Försök igen"-knapp.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from '@/i18n/config'
import { FocusCVBuilder } from './FocusCVBuilder'

const mockGetCV = vi.fn()
const mockUpdateCV = vi.fn()

vi.mock('@/services/cvApi', () => ({
  cvApi: {
    getCV: (...args: unknown[]) => mockGetCV(...args),
    updateCV: (...args: unknown[]) => mockUpdateCV(...args),
  },
}))

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('@/components/Toast', () => ({
  showToast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

const mockCelebrate = vi.fn()
vi.mock('@/hooks/useCelebration', () => ({
  useCelebration: () => ({ celebrate: mockCelebrate }),
}))

function renderBuilder() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <FocusCVBuilder />
      </I18nextProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  mockGetCV.mockReset()
  mockUpdateCV.mockReset()
  mockToastSuccess.mockReset()
  mockToastError.mockReset()
  mockCelebrate.mockReset()
  mockGetCV.mockResolvedValue(null)
})

describe('FocusCVBuilder — väntar in sparningen innan steget byts (CB3)', () => {
  it('byter INTE steg när sparningen misslyckas, och visar felet synligt', async () => {
    mockUpdateCV.mockRejectedValue(new Error('nätverksfel'))
    renderBuilder()

    // Vänta in att CV-hämtningen är klar och första steget renderat.
    const nextButton = await screen.findByRole('button', { name: /nästa/i })

    fireEvent.click(nextButton)

    // Toasten kommer (befintligt beteende), men det viktiga är att steget
    // INTE bytt — mutationsstickprov visade att just den premissen är den
    // som lätt överlever en trasig fix.
    await waitFor(() => expect(mockToastError).toHaveBeenCalled())
    expect(mockUpdateCV).toHaveBeenCalledTimes(1)

    // Fortfarande på steg 1 av 6 — INTE steg 2. Det här är den skarpa
    // assertionen: en mutation som återinför fire-and-forget (`goNext`
    // byter steg oavsett utfall) håller "Nästa"-knappen kvar också, så en
    // svagare kontroll (bara att knappen finns) hade missat regressionen.
    expect(screen.getByText(/steg 1 av 6/i)).toBeInTheDocument()
    expect(screen.queryByText(/steg 2 av 6/i)).toBeNull()

    // Felet är synligt, inte bara en toast som kan missas.
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/kunde inte spara/i)

    // Celebrate ska aldrig triggas för en misslyckad autosave.
    expect(mockCelebrate).not.toHaveBeenCalled()
  })

  it('byter steg när sparningen lyckas', async () => {
    mockUpdateCV.mockResolvedValue({})
    renderBuilder()

    const nextButton = await screen.findByRole('button', { name: /nästa/i })
    fireEvent.click(nextButton)

    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalled())

    // "Steg 2 av 6" bekräftar att currentStep faktiskt gick upp.
    await waitFor(() => {
      expect(screen.getByText(/steg 2 av 6/i)).toBeInTheDocument()
    })

    // Inget kvarliggande fel från en lyckad sparning.
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('"Försök igen" kör om samma sparning och byter steg vid ny framgång', async () => {
    mockUpdateCV.mockRejectedValueOnce(new Error('nätverksfel'))
    mockUpdateCV.mockResolvedValueOnce({})
    renderBuilder()

    const nextButton = await screen.findByRole('button', { name: /nästa/i })
    fireEvent.click(nextButton)

    const retryButton = await screen.findByRole('button', { name: /försök igen/i })
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText(/steg 2 av 6/i)).toBeInTheDocument()
    })
    expect(mockUpdateCV).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
