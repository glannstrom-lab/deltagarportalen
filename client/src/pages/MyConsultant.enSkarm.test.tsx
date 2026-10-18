/**
 * Min konsulent på EN skärm (omtaget steg 6, 2026-10-11). Sidan var nio
 * skärmhöjder: rådgivare, konsulentkort, mål, meddelanden, delning, läslogg,
 * snabbåtgärder och uppsägning stod öppet samtidigt.
 *
 *   1. Vem, hur du når hen, nästa möte och meddelandena står öppet — resten är
 *      rader som är stängda från början. Mutation: `open` på MerRad → faller.
 *   2. EN primärknapp, "Skriv", och den flyttar fokus till meddelandefältet.
 *      Mutation: gör skicka-knappen primär → faller.
 *   3. Rådgivarens förinspelade hälsning lovar "Ändra vad du delar" — länken
 *      finns kvar (radgivarHalsningar.ts, myConsultant).
 *   4. Mer-menyn bär det som inte är vardag: e-post och be om en tid.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// O13 (2026-10-18): Min konsulent läser mötesförslagen via React Query — appen har alltid en klient.
const nyKlient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })
import type { ReactNode } from 'react'

let motesRad: Record<string, unknown> | null = null
let malRader: unknown[] = []
vi.mock('@/lib/supabase', () => {
  const kedja = (tabell: string) => {
    const svar = () => {
      if (tabell === 'consultant_meetings') return { data: motesRad, error: null }
      if (tabell === 'consultant_goals') return { data: malRader, error: null }
      return { data: null, error: null }
    }
    const k: Record<string, unknown> = {}
    for (const m of ['select', 'eq', 'or', 'order', 'limit', 'gte', 'in', 'is', 'neq']) k[m] = () => k
    k.maybeSingle = () => Promise.resolve(svar())
    k.single = () => Promise.resolve(svar())
    k.then = (res: (v: unknown) => unknown) => Promise.resolve(svar()).then(res)
    return k
  }
  return { supabase: { from: (t: string) => kedja(t), rpc: () => Promise.resolve({ data: null, error: null }) } }
})
vi.mock('@/services/myConsultantApi', () => ({
  getMyConsultant: async () => ({ id: 'k1', first_name: 'Karin', last_name: 'Lindqvist', email: 'karin@example.com', phone: '070 123 45 67', avatar_url: null }),
}))
vi.mock('@/services/applicationsApi', () => ({ applicationsApi: { getStats: async () => ({ saved: 0, interested: 0, applied: 0 }) } }))
vi.mock('@/services/konsulentMeddelandeApi', () => ({ konsulentMeddelandeApi: {} }))
vi.mock('@/stores/authStore', () => {
  const state = { user: { id: 'u1', last_sign_in_at: '2026-10-10T14:00:00Z' }, profile: { consultant_id: 'k1' } }
  const useAuthStore = Object.assign(() => state, { setState: vi.fn(), getState: () => state })
  return { useAuthStore }
})
vi.mock('@/components/layout/PageLayout', () => ({ PageLayout: ({ children }: { children: ReactNode }) => <div>{children}</div> }))
vi.mock('@/components/focus/shell/FokusVaxel', () => ({ FokusVaxel: ({ children }: { children: ReactNode }) => <>{children}</> }))
vi.mock('@/components/focus/pages/FocusMyConsultantWizard', () => ({ FocusMyConsultantWizard: () => null }))
vi.mock('@/components/FocusModeProvider', () => ({ useFocusMode: () => ({ leaveWizard: vi.fn() }) }))
vi.mock('@/components/consultant/RevokeConsultantLinkSection', () => ({ RevokeConsultantLinkSection: () => <p>uppsägningen</p> }))
vi.mock('@/components/consultant/VemHarOppnatKort', () => ({ VemHarOppnatKort: () => <p>läsloggen</p> }))
vi.mock('@/components/participant/Delningsforslag', () => ({ Delningsforslag: () => null }))

import MyConsultant from './MyConsultant'

afterEach(() => {
  cleanup()
  motesRad = null
  malRader = []
})

function sida() {
  return render(<QueryClientProvider client={nyKlient()}><MemoryRouter><MyConsultant /></MemoryRouter></QueryClientProvider>)
}

describe('Min konsulent — en skärm', () => {
  it('vem, nästa möte och meddelanden står öppet; resten är stängda rader', async () => {
    motesRad = { id: 'm1', scheduled_at: '2026-10-14T08:00:00Z', meeting_type: 'physical', location: 'Kyrkgatan 2', status: 'scheduled' }
    malRader = [{ id: 'g1', title: 'Delta varje vecka', status: 'IN_PROGRESS' }]
    sida()
    const huvud = await screen.findByTestId('konsulent-huvud')
    expect(within(huvud).getByRole('heading', { name: 'Karin Lindqvist' })).toBeInTheDocument()
    expect(within(huvud).getByText(/Kyrkgatan 2/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Meddelanden/ })).toBeInTheDocument()

    const rader = document.querySelectorAll('details')
    expect(rader).toHaveLength(4) // mål, det här ser Karin, läsloggen, uppsägningen
    rader.forEach((r) => expect(r).not.toHaveAttribute('open'))
    expect(screen.getByRole('heading', { name: 'Det här ser Karin' })).toBeInTheDocument()
  })

  it('utan mål finns ingen målrad', async () => {
    sida()
    await screen.findByTestId('konsulent-huvud')
    expect(document.querySelectorAll('details')).toHaveLength(3)
    expect(screen.queryByRole('heading', { name: 'Era mål' })).toBeNull()
  })

  it('EN primärknapp, "Skriv", som flyttar fokus till meddelandefältet', async () => {
    sida()
    await screen.findByTestId('konsulent-huvud')
    const primar = document.querySelectorAll('[data-variant="primary"]')
    expect(primar).toHaveLength(1)
    expect(primar[0]).toHaveTextContent('Skriv')
    await userEvent.click(primar[0] as HTMLElement)
    expect(screen.getByLabelText('Skriv ett meddelande')).toHaveFocus()
  })

  it('länken som rådgivarens hälsning lovar finns kvar', async () => {
    sida()
    await screen.findByTestId('konsulent-huvud')
    expect(screen.getByRole('link', { name: /Ändra vad du delar/ })).toHaveAttribute('href', '/settings?section=privacy')
  })

  it('Ring är den ramade knappen; e-post och be om en tid ligger i Mer', async () => {
    sida()
    const huvud = await screen.findByTestId('konsulent-huvud')
    expect(within(huvud).getByRole('button', { name: 'Ring' })).toHaveAttribute('data-variant', 'secondary')
    await userEvent.click(within(huvud).getByRole('button', { name: 'Mer' }))
    expect(await screen.findByRole('menuitem', { name: /Skicka e-post/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Boka möte/ })).toBeInTheDocument()
  })
})
