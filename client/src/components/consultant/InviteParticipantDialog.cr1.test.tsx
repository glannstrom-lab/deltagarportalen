/**
 * CR1 (2026-09-29): dialogen skapade en rad i consultant_requests för ett
 * befintligt konto och lovade att deltagaren "kommer att se din förfrågan".
 * Ingen deltagarvy läste tabellen och ingen kunde svara. Nu ett ärligt besked,
 * och ingenting skrivs.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const skrivna: string[] = []
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: { id: 'konsulent-1' } }, error: null }),
      getSession: async () => ({ data: { session: { user: { id: 'konsulent-1' } } }, error: null }),
    },
    from: (tabell: string) => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
          maybeSingle: async () => ({
            data: tabell === 'profiles' ? { id: 'deltagare-1', first_name: 'Anna', last_name: 'A', consultant_id: null } : null,
            error: null,
          }),
        }),
      }),
      insert: () => {
        skrivna.push(tabell)
        return { select: () => ({ single: async () => ({ data: { id: 'x' }, error: null }) }), then: undefined }
      },
      delete: () => ({ eq: async () => { skrivna.push(tabell + ':delete'); return { error: null } } }),
    }),
  },
}))

import { InviteParticipantDialog } from './InviteParticipantDialog'

describe('InviteParticipantDialog — befintligt konto (CR1)', () => {
  it('säger som det är och skriver ingen kopplingsförfrågan', async () => {
    const onSuccess = vi.fn()
    render(<InviteParticipantDialog isOpen onClose={vi.fn()} onSuccess={onSuccess} />)
    fireEvent.change(screen.getByPlaceholderText('anna@example.com'), { target: { value: 'anna@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /^skicka$/i }))
    await waitFor(() => expect(screen.getByText(/har redan ett konto hos jobin/i)).toBeInTheDocument())
    expect(skrivna).toEqual([])
    expect(onSuccess).not.toHaveBeenCalled()
    expect(screen.queryByText(/kommer att se din förfrågan/i)).toBeNull()
  })
})
