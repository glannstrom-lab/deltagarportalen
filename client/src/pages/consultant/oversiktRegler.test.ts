/**
 * oversiktRegler — veckan och det brådskande på konsulentens Översikt
 * (rollspelet 2026-09-27).
 *
 * Motprov (kontrollerade): (1) byt veckansGranser mot den gamla räkningen
 * `idag − getDay() + 1` → söndagstestet faller (start blir 28/9). (2) ta bort
 * frånvarogrenen i bradskandePunkter → RK7-testet faller. (3) jämför med
 * `>= 60` i stället för MOTE_GRANS_DAGAR → RR3-testet (33 dagar) faller.
 */
import { describe, it, expect } from 'vitest'
import { bradskandePunkter, franvaroFonster, veckansGranser } from './oversiktRegler'
import type { MoteRad } from '@/services/moteskadens'

const lokal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

describe('veckansGranser — RK6', () => {
  it('en söndag hör till veckan som började i måndags, inte till nästa vecka', () => {
    const sondag = new Date(2026, 8, 27, 10, 0) // sön 27 sep 2026
    const { start, slut } = veckansGranser(sondag)
    expect(lokal(start)).toBe('2026-09-21')
    expect(lokal(slut)).toBe('2026-09-27')
    expect(slut.getHours()).toBe(23)
    // Ett möte i dag söndag ligger i veckan, måndagens (28/9) gör det inte
    expect(new Date(2026, 8, 27, 14).getTime()).toBeLessThanOrEqual(slut.getTime())
    expect(new Date(2026, 8, 28, 9).getTime()).toBeGreaterThan(slut.getTime())
  })

  it('måndag och onsdag ger samma vecka, med start vid midnatt lokal tid', () => {
    const mandag = veckansGranser(new Date(2026, 8, 21, 0, 5))
    const onsdag = veckansGranser(new Date(2026, 8, 23, 23, 59))
    expect(lokal(mandag.start)).toBe('2026-09-21')
    expect(onsdag.start.getTime()).toBe(mandag.start.getTime())
    expect(mandag.start.getHours()).toBe(0)
  })

  it('över ett månadsskifte', () => {
    expect(lokal(veckansGranser(new Date(2026, 9, 4)).start)).toBe('2026-09-28') // sön 4 okt
  })
})

describe('bradskandePunkter — RR3/RK7', () => {
  const idag = new Date(2026, 8, 27, 9, 0)
  const mote = (pid: string, dagarSedan: number, typ: MoteRad['meeting_type'] = 'video'): MoteRad => ({
    participant_id: pid,
    scheduled_at: new Date(2026, 8, 27 - dagarSedan, 10).toISOString(),
    meeting_type: typ,
    status: 'completed',
  })

  it('RR3: ett möte för 33 dagar sedan är över gränsen 14 — det syns', () => {
    const p = bradskandePunkter({ deltagare: [{ participant_id: 'jonas', status: 'ACTIVE' }], moten: [mote('jonas', 33)], pass: [], idag })
    expect(p).toEqual([{ participantId: 'jonas', typ: 'mote', text: 'Senaste möte 33 dagar sedan — gränsen är 14' }])
  })

  it('ett färskt möte är inte brådskande, och "inget möte än" är grått som i deltagarlistan', () => {
    const p = bradskandePunkter({
      deltagare: [{ participant_id: 'a', status: 'ACTIVE' }, { participant_id: 'b', status: 'ACTIVE' }],
      moten: [mote('a', 5, 'physical')],
      pass: [],
      idag,
    })
    expect(p).toEqual([])
  })

  it('fysiskt möte över 28 dagar är brådskande även när ett digitalt möte är färskt', () => {
    const p = bradskandePunkter({
      deltagare: [{ participant_id: 'a', status: 'ACTIVE' }],
      moten: [mote('a', 3), mote('a', 30, 'physical')],
      pass: [],
      idag,
    })
    expect(p).toEqual([{ participantId: 'a', typ: 'mote', text: 'Senaste fysiska möte 30 dagar sedan — gränsen är 28' }])
  })

  it('bara aktiva deltagare bedöms mot möteskadensen', () => {
    const p = bradskandePunkter({ deltagare: [{ participant_id: 'klar', status: 'COMPLETED' }], moten: [mote('klar', 40)], pass: [], idag })
    expect(p).toEqual([])
  })

  it('RK7: ogiltig frånvaro de senaste 7 dagarna syns — äldre, giltig och andras gör det inte', () => {
    const p = bradskandePunkter({
      deltagare: [{ participant_id: 'anna', status: 'ACTIVE' }],
      moten: [mote('anna', 2)],
      pass: [
        { participant_id: 'anna', date: '2026-09-25', attendance: 'absent_invalid' },
        { participant_id: 'anna', date: '2026-09-21', attendance: 'absent_invalid' },
        { participant_id: 'anna', date: '2026-09-20', attendance: 'absent_invalid' }, // 8 dagar sedan
        { participant_id: 'anna', date: '2026-09-24', attendance: 'absent_valid' },
        { participant_id: 'annan', date: '2026-09-25', attendance: 'absent_invalid' }, // inte min deltagare
      ],
      idag,
    })
    expect(p).toEqual([{ participantId: 'anna', typ: 'franvaro', text: 'Ogiltig frånvaro på 2 pass senaste 7 dagarna, senast 25 sep' }])
  })

  it('frånvarofönstret är i dag och sex dagar bakåt, i lokal tid', () => {
    expect(franvaroFonster(idag)).toEqual({ fran: '2026-09-21', till: '2026-09-27' })
  })
})
