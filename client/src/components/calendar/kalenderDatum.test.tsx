/**
 * Kalenderns primitiver: datum i lokal tid, och ett nytt formulär som faktiskt
 * är ifyllt.
 *
 * (1) `EventModal` monteras stängd med `event = null` av Calendar.tsx, och
 *     "Ny händelse" öppnar den med `event` fortfarande `null`. Återställningen
 *     jämförde bara `event` mot sitt eget startvärde — så första nya händelsen
 *     efter sidladdning fick ett TOMT formulär (ingen typ, datum eller tid, och
 *     Spara låst). Mutation: ta bort `oppnas` ur villkoret → första testet faller.
 *
 * (2) `toISOString().split('T')[0]` ger UTC-datumet. 00:30 svensk sommartid är
 *     det fortfarande gårdagen i UTC — nya händelser föreslogs på gårdagen, och
 *     veckovyn slog upp gårdagens händelser under dagens kolumn om `currentDate`
 *     låg efter midnatt. Mutation: återställ `formatLocalDate` → testerna faller.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@/test/utils'
import { EventModal } from './EventModal'
import { WeekView } from './WeekView'
import { DayView } from './DayView'
import type { CalendarEvent } from '@/services/calendarData'

const ursprungligTz = process.env.TZ
beforeAll(() => {
  process.env.TZ = 'Europe/Stockholm'
})
afterAll(() => {
  process.env.TZ = ursprungligTz
})

beforeEach(() => {
  // 2026-09-22 00:30 svensk tid = 2026-09-21 22:30 UTC
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-09-21T22:30:00Z') })
})
afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

const handelser = [
  { id: 'e1', title: 'Möte idag', date: '2026-09-22', time: '10:00', type: 'meeting' },
  { id: 'e2', title: 'Möte igår', date: '2026-09-21', time: '10:00', type: 'meeting' },
] as unknown as CalendarEvent[]

function Modal({ isOpen }: { isOpen: boolean }) {
  return (
    <EventModal event={null} isOpen={isOpen} onClose={() => {}} onSave={() => {}} onDelete={() => {}} />
  )
}

describe('EventModal — ny händelse', () => {
  it('första öppningen efter montering ger ett ifyllt formulär med dagens lokala datum', () => {
    const { rerender } = render(<Modal isOpen={false} />)
    rerender(<Modal isOpen />)

    const datum = document.getElementById('eventmodal-f2') as HTMLInputElement
    expect(datum).not.toBeNull()
    expect(datum.value).toBe('2026-09-22')
  })

  it('en modal som monteras öppen får också standardvärden', () => {
    render(<Modal isOpen />)
    const datum = document.getElementById('eventmodal-f2') as HTMLInputElement
    expect(datum.value).toBe('2026-09-22')
  })
})

describe('Vecko- och dagvyn slår upp på lokalt datum', () => {
  it('veckovyn visar dagens händelse, inte gårdagens, strax efter midnatt', () => {
    // currentDate = "nu" (00:30 lokal tid), som när sidan precis laddats
    render(<WeekView currentDate={new Date()} events={handelser} onEventClick={() => {}} onDateClick={() => {}} />)
    // Veckan är mån 21 – sön 27 september: båda händelserna hör hemma i den,
    // men var och en ska stå i sin egen kolumn. Raden börjar med tidsetiketten,
    // så måndag är barn 1 och tisdag (den 22:a) barn 2.
    const kolumn = (titel: string) => {
      const cell = screen.getByText(titel).closest('button')!.parentElement!
      return Array.from(cell.parentElement!.children).indexOf(cell)
    }
    expect(kolumn('Möte igår')).toBe(1)
    expect(kolumn('Möte idag')).toBe(2)
  })

  it('dagvyn för en Date strax efter midnatt visar den dagens händelser', () => {
    render(<DayView date={new Date()} events={handelser} onEventClick={() => {}} />)
    expect(screen.getByText('Möte idag')).toBeInTheDocument()
    expect(screen.queryByText('Möte igår')).not.toBeInTheDocument()
  })
})
