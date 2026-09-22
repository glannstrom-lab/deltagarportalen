/**
 * SuperAdminPanel — rollbyte, fel och döda knappar (städpasset 2026-09-22).
 *
 * 1. Rollväljaren skrev bara `role`. Behörigheten läses ur `roles ∪ {role}`
 *    (useUserRoles) och den aktiva rollen ur `active_role || role`. En
 *    konsulent med roles={CONSULTANT} (två konton i prod) som sänktes till
 *    Deltagare behöll därför konsulentvyn. Bytet ska skriva alla tre fälten.
 * 2. En uppdatering som RLS släpper igenom med noll rader ger inget fel —
 *    listan visade ändå den nya rollen.
 * 3. Hämtfel gav en tom lista och statistiken "0 användare".
 * 4. "Bjud in konsulent" och "Åtgärder" var knappar utan onClick.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'

const profiler = [
  { id: 'k1', email: 'konsulent@orebro.se', first_name: 'Karin', last_name: 'K', role: 'CONSULTANT', status: 'ACTIVE', created_at: '' },
]

let hamtSvar: { data: unknown; error: unknown } = { data: profiler, error: null }
let uppdateraSvar: { data: unknown; error: unknown } = { data: [{ id: 'k1' }], error: null }
const mockUpdate = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ order: async () => hamtSvar }),
      update: (rad: unknown) => {
        mockUpdate(rad)
        return { eq: () => ({ select: async () => uppdateraSvar }) }
      },
    }),
  },
}))
vi.mock('./OrganisationerTab', () => ({ OrganisationerTab: () => null }))

import { SuperAdminPanel } from './SuperAdminPanel'

beforeEach(() => {
  hamtSvar = { data: profiler, error: null }
  uppdateraSvar = { data: [{ id: 'k1' }], error: null }
  vi.spyOn(window, 'alert').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  mockUpdate.mockClear()
})

describe('rollbyte', () => {
  it('sänkt till Deltagare: roles och active_role följer med, så konsulentvyn försvinner', async () => {
    render(<SuperAdminPanel />)
    const valjare = await screen.findByDisplayValue('Konsulent')
    fireEvent.change(valjare, { target: { value: 'USER' } })
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
    expect(mockUpdate.mock.calls[0][0]).toEqual({ role: 'USER', roles: ['USER'], active_role: null })
  })

  it('en uppdatering som träffar noll rader visas som fel och rollen står kvar', async () => {
    uppdateraSvar = { data: [], error: null }
    render(<SuperAdminPanel />)
    const valjare = await screen.findByDisplayValue('Konsulent')
    fireEvent.change(valjare, { target: { value: 'USER' } })
    expect(await screen.findByRole('alert')).toHaveTextContent(/kunde inte ändra roll/i)
    expect(screen.getByDisplayValue('Konsulent')).toBeInTheDocument()
  })
})

describe('hämtfel', () => {
  it('visar ett fel i stället för en tom lista och "0 användare"', async () => {
    hamtSvar = { data: null, error: { message: 'JWT expired' } }
    render(<SuperAdminPanel />)
    expect(await screen.findByText(/Användarna kunde inte hämtas/)).toBeInTheDocument()
    expect(screen.queryByText('Totalt antal användare')).not.toBeInTheDocument()
  })
})

describe('döda knappar', () => {
  it('inga knappar utan verkan', async () => {
    render(<SuperAdminPanel />)
    await screen.findByText('konsulent@orebro.se')
    expect(screen.queryByRole('button', { name: /Bjud in konsulent/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Åtgärder för användare/ })).not.toBeInTheDocument()
  })
})
