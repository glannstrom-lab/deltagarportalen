/**
 * MeetingSchedulerDialog — mötesbokning från deltagarsidan (KA5).
 *
 * Buggen (städpasset 2026-09-22): på deltagarsidan är dialogen monterad hela
 * tiden och får deltagaren som `preselectedParticipant`. `resetForm()` (som
 * körs vid både Avbryt/X och efter en lyckad bokning) nollade
 * `selectedParticipant`, och effekten vid nästa öppning satte bara steget —
 * inte deltagaren. Andra gången konsulenten försökte boka ett möte gick hon
 * igenom datum, tid och detaljer och tryckte "Boka möte" — och ingenting
 * hände: `handleSubmit` returnerade tyst på `!selectedParticipant`.
 *
 * Samma fil: ett misslyckat insert loggades bara till konsolen. Dialogen stod
 * kvar utan ett ord, och konsulenten kunde tro att mötet var bokat.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'

const mockInsert = vi.fn()
let insertSvar: { error: unknown } = { error: null }

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'konsulent-1' } } }) },
    from: () => ({
      select: () => ({ eq: async () => ({ data: [], error: null }) }),
      insert: async (rad: unknown) => {
        mockInsert(rad)
        return insertSvar
      },
    }),
  },
}))

import { MeetingSchedulerDialog } from './MeetingSchedulerDialog'

const anna = { participant_id: 'p1', first_name: 'Anna', last_name: 'Andersson', email: 'anna@example.com' }

beforeEach(() => {
  insertSvar = { error: null }
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

/** Välj en framtida dag (nästa månad, dag 15), en tid och gå till detaljsteget. */
function fyllIDatumOchTid() {
  fireEvent.click(screen.getByRole('button', { name: 'Nästa månad' }))
  fireEvent.click(screen.getByRole('button', { name: '15' }))
  fireEvent.click(screen.getByRole('button', { name: '10:00' }))
  fireEvent.click(screen.getByRole('button', { name: /Fortsätt/ }))
}

describe('MeetingSchedulerDialog med förvald deltagare', () => {
  it('bokar mötet även efter att dialogen stängts och öppnats igen', async () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <MeetingSchedulerDialog isOpen onClose={onClose} onSuccess={vi.fn()} preselectedParticipant={anna} />,
    )
    // Konsulenten ångrar sig första gången.
    fireEvent.click(screen.getByRole('button', { name: 'Avbryt' }))
    rerender(<MeetingSchedulerDialog isOpen={false} onClose={onClose} onSuccess={vi.fn()} preselectedParticipant={anna} />)
    rerender(<MeetingSchedulerDialog isOpen onClose={onClose} onSuccess={vi.fn()} preselectedParticipant={anna} />)

    expect(await screen.findByText('Anna Andersson')).toBeInTheDocument()
    fyllIDatumOchTid()
    fireEvent.click(screen.getByRole('button', { name: /Boka möte/ }))

    await waitFor(() => expect(mockInsert).toHaveBeenCalledTimes(1))
    expect(mockInsert.mock.calls[0][0]).toMatchObject({ participant_id: 'p1', consultant_id: 'konsulent-1' })
  })

  it('"Tillbaka" från datumsteget leder inte till en tom deltagarlista', async () => {
    render(<MeetingSchedulerDialog isOpen onClose={vi.fn()} onSuccess={vi.fn()} preselectedParticipant={anna} />)
    await screen.findByText('Anna Andersson')
    expect(screen.queryByRole('button', { name: /Tillbaka/ })).not.toBeInTheDocument()
  })

  it('ett misslyckat insert syns i dialogen och stänger den inte', async () => {
    insertSvar = { error: { message: 'new row violates row-level security policy' } }
    const onClose = vi.fn()
    const onSuccess = vi.fn()
    render(<MeetingSchedulerDialog isOpen onClose={onClose} onSuccess={onSuccess} preselectedParticipant={anna} />)
    await screen.findByText('Anna Andersson')
    fyllIDatumOchTid()
    fireEvent.click(screen.getByRole('button', { name: /Boka möte/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Mötet kunde inte bokas/)
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})
