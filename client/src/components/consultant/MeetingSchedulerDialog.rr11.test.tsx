/**
 * RR11 (rollspelet 2026-09-27): mötestypen var förvald till Video även när
 * mötesregeln krävde att nästa möte var fysiskt.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'

const mockInsert = vi.fn()
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'k1' } } }) },
    from: () => ({
      select: () => ({ eq: async () => ({ data: [], error: null }) }),
      insert: async (rad: unknown) => { mockInsert(rad); return { error: null } },
    }),
  },
}))

import { MeetingSchedulerDialog } from './MeetingSchedulerDialog'

const jonas = { participant_id: 'p1', first_name: 'Jonas', last_name: 'Demo', email: 'j@example.com' }
afterEach(() => { cleanup(); vi.clearAllMocks() })

function tillDetaljer() {
  fireEvent.click(screen.getByRole('button', { name: 'Nästa månad' }))
  fireEvent.click(screen.getByRole('button', { name: '15' }))
  fireEvent.click(screen.getByRole('button', { name: '10:00' }))
  fireEvent.click(screen.getByRole('button', { name: /Fortsätt/ }))
}

describe('RR11 — förvald mötestyp', () => {
  it('förslaget fysiskt är valt och bokas som fysiskt', async () => {
    render(<MeetingSchedulerDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} preselectedParticipant={jonas} forvaldTyp="physical" forvaldSkal="Inget fysiskt möte på 33 dagar." />)
    await screen.findByText('Jonas Demo')
    tillDetaljer()
    expect(screen.getByRole('button', { name: 'Fysiskt' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Inget fysiskt möte på 33 dagar.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Boka möte/ }))
    await waitFor(() => expect(mockInsert).toHaveBeenCalledTimes(1))
    expect(mockInsert.mock.calls[0][0]).toMatchObject({ meeting_type: 'physical' })
  })
})
