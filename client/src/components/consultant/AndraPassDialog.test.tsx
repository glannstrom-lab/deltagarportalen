/** SFT7: flytta ett pass till annat datum, eller en serie till annan veckodag. */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'

vi.mock('@/services/aktivitetApi', () => ({
  aktivitetsplanApi: {
    flyttaSessions: vi.fn(async (f: unknown[]) => f),
    updateSessions: vi.fn(async (ids: string[]) => ids),
  },
}))

import { aktivitetsplanApi } from '@/services/aktivitetApi'
import { AndraPassDialog } from './AndraPassDialog'

const pass = (id: string, date: string, o: Record<string, unknown> = {}) => ({
  id, plan_id: 'pl', participant_id: 'd', date, start_time: '09:00', end_time: '11:00', title: 'Verkstad',
  activity_type: 'jobsearch', location: null, attendance: null, ...o,
}) as never

const alla = [pass('a', '2026-10-01'), pass('b', '2026-10-08'), pass('c', '2026-10-15', { attendance: 'present' })]

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

function rendera(session = alla[0], onSparat = vi.fn()) {
  render(<AndraPassDialog session={session} allaPass={alla} onClose={vi.fn()} onSparat={onSparat} kolumnerFinns={false} />)
  return onSparat
}

describe('AndraPassDialog — flytta', () => {
  it('ett pass: nytt datum säger vad som flyttas och flyttar bara det passet, utan fältskrivning', async () => {
    const onSparat = rendera()
    fireEvent.change(screen.getByLabelText('Datum'), { target: { value: '2026-10-02' } })
    expect(screen.getByRole('status')).toHaveTextContent('flyttas från 1 oktober 2026 till 2 oktober 2026')
    fireEvent.click(screen.getByRole('button', { name: 'Flytta passet' }))
    await waitFor(() => expect(onSparat).toHaveBeenCalledWith(1))
    expect(aktivitetsplanApi.flyttaSessions).toHaveBeenCalledWith([{ id: 'a', date: '2026-10-02' }], { tystNotis: false })
    expect(aktivitetsplanApi.updateSessions).not.toHaveBeenCalled()
  })

  it('serien: ny veckodag flyttar de omarkerade passen i sin egen vecka, aldrig det markerade', async () => {
    const onSparat = rendera()
    fireEvent.click(screen.getByLabelText(/Det här och alla kommande/))
    fireEvent.change(screen.getByLabelText('Veckodag'), { target: { value: '3' } })
    expect(screen.getByRole('status')).toHaveTextContent('2 pass flyttas')
    fireEvent.click(screen.getByRole('button', { name: 'Flytta 2 pass' }))
    await waitFor(() => expect(onSparat).toHaveBeenCalledWith(2))
    expect(aktivitetsplanApi.flyttaSessions).toHaveBeenCalledWith(
      [{ id: 'a', date: '2026-09-30' }, { id: 'b', date: '2026-10-07' }], { tystNotis: false })
  })

  it('ändras en tid samtidigt skrivs fälten och flytten ger ingen egen notis', async () => {
    rendera()
    fireEvent.change(screen.getByLabelText('Datum'), { target: { value: '2026-10-02' } })
    fireEvent.change(screen.getByLabelText('Start'), { target: { value: '10:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Spara' }))
    await waitFor(() => expect(aktivitetsplanApi.updateSessions).toHaveBeenCalled())
    expect(aktivitetsplanApi.flyttaSessions).toHaveBeenCalledWith([{ id: 'a', date: '2026-10-02' }], { tystNotis: true })
  })

  it('ett markerat pass går inte att flytta — inget datumfält, ingen flytt', () => {
    rendera(alla[2])
    expect(screen.queryByLabelText('Datum')).toBeNull()
    expect(screen.getByText(/markerat och kan inte flyttas/)).toBeInTheDocument()
  })
})
