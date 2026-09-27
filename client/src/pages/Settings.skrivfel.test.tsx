/**
 * RD2/RD26 (rollspelet 2026-09-27): "Spara ändringar" i profilen gav 500 och
 * ingenting syntes — felet svaldes med console.error.
 *
 * Mutation: låt profilSparning svälja felet (try/catch med console.error) →
 * första testet faller (ingen alert).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

const updateProfile = vi.fn()
vi.mock('@/services/supabaseApi', () => ({
  userApi: { getProfile: async () => ({ first_name: 'Anna', phone: '' }), updateProfile: (...a: unknown[]) => updateProfile(...a) },
}))
vi.mock('@/services/consentApi', () => ({ vaxlaSamtycke: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: () => ({}) } }))
vi.mock('@/stores/authStore', () => {
  const state = { user: { id: 'u1', email: 'anna@example.com' }, profile: { first_name: 'Anna' } }
  return { useAuthStore: Object.assign(() => state, { getState: () => state }) }
})
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn(), isDark: false, systemPreference: 'light' }),
}))
vi.mock('@/components/layout/index', () => ({ PageLayout: ({ children }: { children: ReactNode }) => <div>{children}</div> }))
vi.mock('@/components/settings/RoleSelector', () => ({ RoleSelector: () => null }))
vi.mock('@/components/settings/ProgramSelector', () => ({ ProgramSelector: () => null }))
vi.mock('@/components/settings/SprakVal', () => ({ SprakVal: () => null }))
vi.mock('@/components/settings/DeleteAccountSection', () => ({ DeleteAccountSection: () => null }))
vi.mock('@/components/consent/DataSharingSettings', () => ({ DataSharingSettings: () => null }))
vi.mock('@/components/FocusModeProvider', () => ({ useFocusMode: () => ({ isFocusMode: false, toggleFocusMode: vi.fn() }) }))
vi.mock('@/hooks/useOrgAiSparr', () => ({ useOrgAiSparr: () => null }))
vi.mock('@/components/focus/shell/PageFocusShell', () => ({ PageFocusShell: () => null }))
vi.mock('@/components/focus/pages/FocusSettingsWizard', () => ({ FocusSettingsWizard: () => null }))

import Settings from './Settings'

beforeEach(() => { updateProfile.mockReset() })
afterEach(cleanup)

async function oppnaProfil() {
  render(<MemoryRouter initialEntries={['/settings']}><Settings /></MemoryRouter>)
  return screen.findByRole('button', { name: 'Spara ändringar' })
}

describe('Inställningar — profilen sparas inte tyst (RD2/RD26)', () => {
  it('ett fel visas med "Det du skrev är kvar" och Försök igen', async () => {
    updateProfile.mockRejectedValue(new Error('42P17 infinite recursion'))
    fireEvent.click(await oppnaProfil())
    expect(await screen.findByRole('alert')).toHaveTextContent('Det gick inte att spara. Det du skrev är kvar.')
    updateProfile.mockResolvedValue({})
    fireEvent.click(screen.getByRole('button', { name: 'Försök igen' }))
    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('Dina ändringar är sparade.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
