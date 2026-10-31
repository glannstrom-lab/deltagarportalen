/** KC15 — konsulentens val av kurs fyller i passet men sparar inget. */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KursForslag } from './KursForslag'
import { KURSER, kursMinuter } from '@/data/kurser'

describe('KursForslag', () => {
  it('ett val skickar rubrik, typ och sluttid ur kursens uppskattade tid', () => {
    const onValj = vi.fn()
    render(<KursForslag startTid="13:00" onValj={onValj} />)
    fireEvent.change(screen.getByLabelText(/Lägg in en kurs/), { target: { value: KURSER[1].id } })
    const min = kursMinuter(KURSER[1].delar)
    expect(onValj).toHaveBeenCalledWith({
      title: `Kurs: ${KURSER[1].namn}`,
      activity_type: 'motivation',
      start_time: '13:00',
      end_time: `${String(13 + Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`,
    })
  })
  it('"Ingen kurs" gör ingenting', () => {
    const onValj = vi.fn()
    render(<KursForslag startTid="09:00" onValj={onValj} />)
    fireEvent.change(screen.getByLabelText(/Lägg in en kurs/), { target: { value: '' } })
    expect(onValj).not.toHaveBeenCalled()
  })
})
