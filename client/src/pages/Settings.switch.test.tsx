/**
 * SFT3/SV6: reglagen i Inställningar (notiser, tillgänglighet, coach-tips) är
 * switchar för hjälpmedel — role="switch" + aria-checked. Mutation: ta bort
 * role/aria-checked på en <Toggle> → testet faller.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
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

afterEach(cleanup)

describe('Inställningar — reglagen är switchar (SV6)', () => {
  it('notisreglagen har role=switch och aria-checked', async () => {
    render(<MemoryRouter initialEntries={['/settings']}><Settings /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: /notifikationer/i }))
    const reglage = await screen.findAllByRole('switch')
    expect(reglage.length).toBeGreaterThanOrEqual(3)
    for (const r of reglage) expect(r).toHaveAttribute('aria-checked')
    const first = reglage[0]
    const before = first.getAttribute('aria-checked')
    fireEvent.click(first)
    expect(first.getAttribute('aria-checked')).not.toBe(before)
  })
})
