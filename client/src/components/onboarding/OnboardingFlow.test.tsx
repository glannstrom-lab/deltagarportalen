/**
 * FN5: "Hoppa över" och Escape får inte se ut som "klar" i databasen.
 * Grindarna: hoppa över → valkomstHoppad sparas; sista steget → sparas INTE;
 * ett fel i flaggskrivningen får inte hålla kvar modalen.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const updateProfile = vi.fn()
const updateOnboardingStep = vi.fn()
let onEscape: (() => void) | undefined

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k: string, d?: unknown) => (typeof d === 'string' ? d : (d as { defaultValue?: string })?.defaultValue ?? _k) }),
}))
vi.mock('@/hooks/useFocusTrap', () => ({
  useFocusTrap: (_a: boolean, o: { onEscape?: () => void }) => {
    onEscape = o.onEscape
    return { current: null }
  },
}))
vi.mock('@/services/userApi', () => ({
  userApi: { updateOnboardingStep: (...a: unknown[]) => updateOnboardingStep(...a) },
}))
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'u1' },
    profile: { id: 'u1', activeRole: 'USER', onboarding_completed: false },
    updateProfile,
  }),
}))

import { OnboardingFlow } from './OnboardingFlow'

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  updateProfile.mockResolvedValue({ error: null })
  updateOnboardingStep.mockResolvedValue({})
})

describe('OnboardingFlow — hoppade över vs klar (FN5)', () => {
  it('Hoppa över sparar onboarding_completed OCH valkomstHoppad', async () => {
    render(<OnboardingFlow />)
    fireEvent.click(await screen.findByText('Hoppa över'))
    await waitFor(() => expect(updateOnboardingStep).toHaveBeenCalledWith('valkomstHoppad', true))
    expect(updateProfile).toHaveBeenCalledWith({ onboarding_completed: true })
  })

  it('Escape räknas som att hoppa över', async () => {
    render(<OnboardingFlow />)
    await screen.findByText('Hoppa över')
    onEscape?.()
    await waitFor(() => expect(updateOnboardingStep).toHaveBeenCalledWith('valkomstHoppad', true))
  })

  it('sista steget (Till min vy) är "klar": ingen hoppad-flagga', async () => {
    render(<OnboardingFlow />)
    for (let i = 0; i < 4; i++) fireEvent.click(await screen.findByText('Nästa'))
    fireEvent.click(await screen.findByText('Till min vy'))
    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith({ onboarding_completed: true }))
    expect(updateOnboardingStep).not.toHaveBeenCalled()
  })

  it('ett fel när flaggan skrivs håller inte kvar modalen', async () => {
    updateOnboardingStep.mockRejectedValue(new Error('nät'))
    render(<OnboardingFlow />)
    fireEvent.click(await screen.findByText('Hoppa över'))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('skriver inte flaggan om själva profiluppdateringen föll', async () => {
    updateProfile.mockResolvedValue({ error: 'fel' })
    render(<OnboardingFlow />)
    fireEvent.click(await screen.findByText('Hoppa över'))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(updateOnboardingStep).not.toHaveBeenCalled()
  })
})
