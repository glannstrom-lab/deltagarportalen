/**
 * Min konsulent följer språkbytet (react-hooks/exhaustive-deps, 2026-09-24).
 *
 * fetchConsultantData lägger ÖVERSATTA strängar i state (konsulentens titel,
 * raderna i "Det här ser din konsulent"). Effekten körde bara på [user], så
 * efter ett språkbyte stod de kvar på det gamla språket tills sidan laddades om.
 *
 * Mutation: sätt tillbaka beroendelistan till [userId] → testet faller.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

vi.mock('@/lib/supabase', () => {
  const svar = { data: null, error: null, count: 0 }
  const kedja: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'or', 'order', 'limit', 'gte', 'in', 'is', 'neq']) kedja[m] = () => kedja
  kedja.maybeSingle = () => Promise.resolve(svar)
  kedja.single = () => Promise.resolve(svar)
  kedja.then = (res: (v: unknown) => unknown) => Promise.resolve(svar).then(res)
  return { supabase: { from: () => kedja, rpc: () => Promise.resolve(svar) } }
})
vi.mock('@/services/myConsultantApi', () => ({
  getMyConsultant: async () => ({ id: 'k1', first_name: 'Karin', last_name: 'K', email: 'k@example.com', phone: null, avatar_url: null }),
}))
vi.mock('@/services/applicationsApi', () => ({ applicationsApi: { getStats: async () => ({ saved: 0, interested: 0, applied: 0 }) } }))
vi.mock('@/services/konsulentMeddelandeApi', () => ({ konsulentMeddelandeApi: {} }))
vi.mock('@/stores/authStore', () => {
  const state = { user: { id: 'u1' }, profile: { consultant_id: 'k1' } }
  const useAuthStore = Object.assign(() => state, { setState: vi.fn(), getState: () => state })
  return { useAuthStore }
})
vi.mock('@/components/layout/PageLayout', () => ({ PageLayout: ({ children }: { children: ReactNode }) => <div>{children}</div> }))
vi.mock('@/components/focus/shell/FokusVaxel', () => ({ FokusVaxel: ({ children }: { children: ReactNode }) => <>{children}</> }))
vi.mock('@/components/focus/pages/FocusMyConsultantWizard', () => ({ FocusMyConsultantWizard: () => null }))
vi.mock('@/components/FocusModeProvider', () => ({ useFocusMode: () => ({ leaveWizard: vi.fn() }) }))
vi.mock('@/components/consultant/RevokeConsultantLinkSection', () => ({ RevokeConsultantLinkSection: () => null }))
vi.mock('@/components/consultant/VemHarOppnatKort', () => ({ VemHarOppnatKort: () => null }))
vi.mock('@/components/participant/Delningsforslag', () => ({ Delningsforslag: () => null }))
vi.mock('@/components/radgivare/RadgivarPanel', () => ({ RadgivarTips: () => null }))

import MyConsultant from './MyConsultant'
import sv from '@/i18n/locales/sv.json'
import en from '@/i18n/locales/en.json'

afterEach(cleanup)

describe('MyConsultant — språkbyte', () => {
  it('konsulentens titel byts till engelska när språket byts', async () => {
    const { default: i18n } = await import('@/i18n/config')
    i18n.addResourceBundle('en', 'translation', en, true, true)
    await i18n.changeLanguage('sv')
    try {
      render(<MemoryRouter><MyConsultant /></MemoryRouter>)
      expect(await screen.findByText(sv.myConsultant.consultant.yourConsultant)).toBeInTheDocument()
      await act(async () => { await i18n.changeLanguage('en') })
      expect(await screen.findByText(en.myConsultant.consultant.yourConsultant)).toBeInTheDocument()
    } finally {
      await i18n.changeLanguage('sv')
    }
  })
})
