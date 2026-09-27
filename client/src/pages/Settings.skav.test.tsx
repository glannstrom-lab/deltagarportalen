/**
 * Skav från rollspelet 2026-09-27 i Inställningar.
 *
 * RD17: på mobil nåddes avsnitten bara via en ☰-ikon i "Profil"-kortet, så
 * Tillgänglighet (språk, större text) var svår att hitta. Avsnitten ligger nu
 * synliga i en navigering. Mutation: lägg tillbaka den hopfällda menyn → faller.
 *
 * RD18: "gpt-oss-120b via OpenRouter, USA", "GDPR Art 21", "tvåfaktorsauth",
 * och en profilsynlighet "Endast jag / Arbetsförmedlare / Alla" som inte ens
 * var kopplad till något. Fakta finns kvar under "Läs mer".
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import sv from '@/i18n/locales/sv.json'

let profilRad: Record<string, unknown> = {}
vi.mock('@/services/supabaseApi', () => ({
  userApi: { getProfile: async () => profilRad, updateProfile: vi.fn() },
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
vi.mock('@/components/settings/SprakVal', () => ({ SprakVal: () => <p>Språkval</p> }))
vi.mock('@/components/settings/DeleteAccountSection', () => ({ DeleteAccountSection: () => null }))
vi.mock('@/components/consent/DataSharingSettings', () => ({ DataSharingSettings: () => null }))
vi.mock('@/components/FocusModeProvider', () => ({ useFocusMode: () => ({ isFocusMode: false, toggleFocusMode: vi.fn() }) }))
vi.mock('@/hooks/useOrgAiSparr', () => ({ useOrgAiSparr: () => null }))
vi.mock('@/components/focus/shell/PageFocusShell', () => ({ PageFocusShell: () => null }))
vi.mock('@/components/focus/pages/FocusSettingsWizard', () => ({ FocusSettingsWizard: () => null }))

import Settings from './Settings'

afterEach(cleanup)

function renderSettings(section?: string) {
  return render(
    <MemoryRouter initialEntries={[section ? `/settings?section=${section}` : '/settings']}>
      <Settings />
    </MemoryRouter>,
  )
}

describe('Inställningar — avsnitten syns utan meny (RD17)', () => {
  it('alla avsnitt, också Tillgänglighet, är knappar i en navigering direkt', () => {
    profilRad = {}
    renderSettings()
    const nav = screen.getByRole('navigation', { name: 'Avsnitt i inställningarna' })
    for (const namn of ['Profil', 'Tillgänglighet', 'Notifikationer', 'Utseende', 'Integritet', 'Säkerhet']) {
      expect(within(nav).getByRole('button', { name: new RegExp(namn) })).toBeInTheDocument()
    }
    // Ingen hopfälld ☰-meny kvar
    expect(screen.queryByRole('button', { expanded: false })).toBeNull()
    // Aktivt avsnitt markeras för skärmläsare
    expect(within(nav).getByRole('button', { name: /Profil/ })).toHaveAttribute('aria-current', 'page')
  })
})

describe('Inställningar — begripligt språk (RD18)', () => {
  it('Integritet: AI-texten är begriplig; modell, leverantör och artikel finns under "Läs mer"', async () => {
    profilRad = { ai_consent_at: '2026-09-27T10:00:00Z', ai_enabled: true }
    renderSettings('privacy')
    const las = await screen.findByText('Läs mer om AI-tjänsten')
    const detaljer = las.closest('details')
    expect(detaljer).not.toBeNull()
    expect(detaljer!.textContent).toMatch(/gpt-oss-120b/)
    expect(detaljer!.textContent).toMatch(/artikel 21/)
    // Utanför "Läs mer" står ingen teknik och ingen paragraf
    const utanfor = document.body.textContent!.replace(detaljer!.textContent!, '')
    expect(utanfor).not.toMatch(/gpt-oss|OpenRouter|GDPR Art 21/)
    // Den okopplade profilsynligheten ("Alla") är borta
    expect(screen.queryByRole('combobox', { name: /Profilsynlighet/ })).toBeNull()
    expect(screen.queryByText('Arbetsförmedlare')).toBeNull()
  })

  it('Säkerhet: inget "tvåfaktorsauth" och ingen "Aktivera"-knapp som inte gör något', () => {
    profilRad = {}
    renderSettings('security')
    expect(document.body.textContent).not.toMatch(/tvåfaktor/i)
    expect(screen.queryByRole('button', { name: 'Aktivera' })).toBeNull()
  })

  it('delning av hälsodata säger vad det är, inte "ICF-data"', () => {
    expect(sv.datasharing.health.description).not.toMatch(/ICF|kognitiv|motorisk|sensorisk/)
    expect(sv.settings.appearance.graphicsActionDesc).not.toMatch(/Matchdag/)
  })
})
