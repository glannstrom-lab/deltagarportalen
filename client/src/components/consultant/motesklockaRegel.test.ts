/**
 * Mötesklockan (Rusta och matcha, 14/28 dagar). Räknas ur samma kadens som chipen.
 */
import { describe, it, expect } from 'vitest'
import { motesklocka, motesklockaText, dagMedVeckodag } from './motesklockaRegel'
import type { Kadens } from '@/services/moteskadens'

const idag = new Date(2026, 9, 12, 10) // måndag 12 okt
const k = (o: Partial<Kadens>): Kadens => ({
  dagarSedanMote: 9, veckorSedanFysiskt: 1, dagarSedanFysiskt: 9, laget: 'ok', bokat: null, bokatFysiskt: null, ...o,
})

describe('motesklocka', () => {
  it('9 dagar sedan senaste mötet: 5 kvar, senast fredag 17 okt, fysiskt senast 31 okt', () => {
    const m = motesklocka(k({}), idag)
    expect(m).toMatchObject({ dagarKvar: 5, senast: '2026-10-17', fysisktSenast: '2026-10-31', status: 'narvarande' })
    const text = motesklockaText(m)
    expect(text.rubrik).toBe('Nästa möte senast lördag 17 okt')
    expect(text.rad).toBe('5 dagar kvar till 14-dagarsgränsen. Fysiskt möte senast lördag 31 okt.')
  })

  it('nära gränsen väntar, över gränsen är det en avvikelse', () => {
    expect(motesklocka(k({ dagarSedanMote: 12 }), idag).status).toBe('vantar')
    const over = motesklocka(k({ dagarSedanMote: 16 }), idag)
    expect(over.status).toBe('ogiltig')
    expect(motesklockaText(over).rubrik).toBe('Mötet är 2 dagar sent')
  })

  it('utan genomfört möte: inget tal, ingen påhittad nolla', () => {
    const m = motesklocka(k({ dagarSedanMote: null, dagarSedanFysiskt: null }), idag)
    expect(m).toMatchObject({ dagarKvar: null, senast: null, andel: 0, status: 'planerat' })
    expect(motesklockaText(m).rubrik).toBe('Inget genomfört möte registrerat')
  })

  it('läser datumet som lokal dag', () => {
    expect(dagMedVeckodag('2026-10-16')).toBe('fredag 16 okt')
  })
})
