/**
 * Slipningen 2026-10-11 (R&M A8): en avvikelse utan orsak fick texten "skriv den i
 * passets anteckning" — utan något fält. Fältet ligger nu i raden.
 * Mutation: ta bort OrsakFalt (återställ texten) → första testet faller.
 */
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '@/test/utils'
import { AvvikelserapportKort } from './AvvikelserapportKort'
import type { ActivitySession } from '@/services/aktivitetApi'

vi.mock('@/services/aktivitetApi', () => ({
  aktivitetsplanApi: {
    saveAttendanceNote: vi.fn(async (id: string, note: string) => ({ id, attendance_note: note })),
    sattAfUnderrattad: vi.fn(),
  },
}))

const idag = new Date()
const datum = `${idag.getFullYear()}-${String(idag.getMonth() + 1).padStart(2, '0')}-01`
const pass = (o: Record<string, unknown>) => ({
  id: 's1', plan_id: 'plan1', participant_id: 'p1', date: datum, start_time: '09:00', end_time: '11:00', title: 'Jobbsökarverkstad',
  activity_type: 'jobsearch', location: 'Rum 3', notes: null, attendance: 'absent_invalid', attendance_note: null,
  sick_certificate_received: false, marked_by: null, marked_at: null, self_checkin_at: null, created_at: '', updated_at: '', ...o,
}) as unknown as ActivitySession

describe('AvvikelserapportKort — orsaken skrivs i raden', () => {
  it('en avvikelse utan orsak har ett fält som sparar till passets anteckning', async () => {
    const { aktivitetsplanApi } = await import('@/services/aktivitetApi')
    const onChanged = vi.fn()
    render(<AvvikelserapportKort planStart={datum} sessions={[pass({})]} onChanged={onChanged} kolumnerFinns={false} />)
    const falt = screen.getByLabelText(/Vad hände\?/)
    fireEvent.change(falt, { target: { value: 'Ringde, var sjuk' } })
    fireEvent.click(screen.getByRole('button', { name: 'Spara orsak' }))
    await waitFor(() => expect(aktivitetsplanApi.saveAttendanceNote).toHaveBeenCalledWith('s1', 'Ringde, var sjuk'))
    await waitFor(() => expect(onChanged).toHaveBeenCalled())
  })

  it('en avvikelse med orsak visar orsaken, inget fält', () => {
    render(<AvvikelserapportKort planStart={datum} sessions={[pass({ attendance_note: 'Försov sig' })]} onChanged={vi.fn()} kolumnerFinns={false} />)
    expect(screen.getByText('Försov sig')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Vad hände\?/)).toBeNull()
  })
})
