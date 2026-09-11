/**
 * SuperAdminPanel — BL5: testkonton borträknade i statistiken och dolda i
 * listan som default. Mockar bara supabase; OrganisationerTab byts ut mot ett
 * tomt skal så fliken inte drar in orgApi.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

const profiler = [
  { id: 'r1', email: 'anna@orebro.se', first_name: 'Anna', last_name: 'A', role: 'USER', status: 'ACTIVE', created_at: '' },
  { id: 'r2', email: 'fanny.forsell@hellefors.se', first_name: 'Fanny', last_name: 'F', role: 'CONSULTANT', status: 'ACTIVE', created_at: '' },
  { id: 'r3', email: 'mikael@jobin.se', first_name: 'Mikael', last_name: 'G', role: 'SUPERADMIN', status: 'ACTIVE', created_at: '' },
  { id: 't1', email: 'km-deltagare@jobin.test', first_name: 'Dana', last_name: 'D', role: 'USER', status: 'ACTIVE', created_at: '' },
  { id: 't2', email: 'claude-playwright-test@jobin.se', first_name: 'Claude', last_name: 'T', role: 'USER', status: 'ACTIVE', created_at: '' },
]

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: async () => ({ data: profiler, error: null }),
      }),
    }),
  },
}))
vi.mock('./OrganisationerTab', () => ({ OrganisationerTab: () => null }))

import { SuperAdminPanel } from './SuperAdminPanel'

describe('SuperAdminPanel (BL5)', () => {
  afterEach(() => cleanup())

  it('statistiken räknar utan testkonton och visar hur många som är borträknade', async () => {
    render(<SuperAdminPanel />)
    fireEvent.click(await screen.findByRole('button', { name: /Statistik/ }))
    const totalt = screen.getByText('Totalt antal användare').nextElementSibling
    expect(totalt).toHaveTextContent('3')
    expect(screen.getByText('Deltagare').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('Konsulenter').nextElementSibling).toHaveTextContent('1')
    expect(screen.getByText('Testkonton (borträknade): 2')).toBeInTheDocument()
  })

  it('listan döljer testkonton som default och visar dem med chip när kryssrutan slås av', async () => {
    render(<SuperAdminPanel />)
    await screen.findByText('anna@orebro.se')
    expect(screen.queryByText('km-deltagare@jobin.test')).not.toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(1 + 3) // rubrikrad + 3 riktiga

    fireEvent.click(screen.getByLabelText('Dölj testkonton'))
    expect(screen.getAllByRole('row')).toHaveLength(1 + 5)
    expect(screen.getByText('km-deltagare@jobin.test')).toBeInTheDocument()
    expect(screen.getAllByText('Testkonto')).toHaveLength(2)
  })
})
