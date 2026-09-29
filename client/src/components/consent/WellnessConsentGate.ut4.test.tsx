/**
 * UT4 (2026-09-29): efter samtycket laddades hela appen om (window.location.reload),
 * och deltagaren såg två ordlösa snurror i flera sekunder. Nu läggs tidsstämpeln i
 * storen och barnen monteras direkt. Mutation: återinför reload → testet faller.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const { store, single } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { create } = require('zustand') as typeof import('zustand')
  const store = create<{ profile: { id: string; wellness_consent_at: string | null } | null; isLoading: boolean }>(() => ({
    profile: { id: 'u1', wellness_consent_at: null },
    isLoading: false,
  }))
  return { store, single: vi.fn() }
})

vi.mock('@/stores/authStore', () => ({ useAuthStore: store }))
vi.mock('@/services/consentApi', () => ({ beviljaSamtycke: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/supabase', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: single }) }) }) },
}))

import { WellnessConsentGate } from './WellnessConsentGate'

describe('WellnessConsentGate — ingen omladdning efter samtycket (UT4)', () => {
  beforeEach(() => {
    store.setState({ profile: { id: 'u1', wellness_consent_at: null }, isLoading: false })
    single.mockReset()
  })

  it('visar det skyddade innehållet direkt, utan att ladda om sidan', async () => {
    single.mockResolvedValue({ data: { wellness_consent_at: '2026-09-29T19:00:00Z' }, error: null })
    const reload = vi.fn()
    Object.defineProperty(window, 'location', { value: { ...window.location, reload }, writable: true })
    render(<MemoryRouter><WellnessConsentGate><p>skyddat</p></WellnessConsentGate></MemoryRouter>)
    const knappar = screen.getAllByRole('button').filter((b) => !b.hasAttribute('disabled'))
    fireEvent.click(knappar[knappar.length - 1])
    await waitFor(() => expect(screen.getByText('skyddat')).toBeInTheDocument())
    expect(reload).not.toHaveBeenCalled()
  })

  it('laddningsläget har text för skärmläsare', () => {
    store.setState({ isLoading: true })
    render(<MemoryRouter><WellnessConsentGate><p>skyddat</p></WellnessConsentGate></MemoryRouter>)
    expect(screen.getByRole('status')).toHaveTextContent(/laddar/i)
  })
})
