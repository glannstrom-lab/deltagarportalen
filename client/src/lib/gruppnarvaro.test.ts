/**
 * Gruppnärvaro (RK36, rollspelet 2026-09-27) — vad som är "samma pass".
 * Motprov (körda): (1) jämför titeln med skiftläge → "Jobbsökarverkstad " och
 * "jobbsökarverkstad" blir två grupper och testet faller. (2) ta bort
 * `!p.absence_reason` i kanMarkerasNarvarandeIMassa → massregeln faller.
 */
import { describe, it, expect } from 'vitest'
import { gemensammaPass, gruppLank, gruppNyckel, grupperaPass, kanMarkerasNarvarandeIMassa } from './gruppnarvaro'
import type { PassIdag } from './dagensPass'

const pass = (o: Partial<PassIdag>): PassIdag => ({
  id: 's', participant_id: 'anna', plan_id: 'p', date: '2026-09-28', start_time: '09:00:00', end_time: '12:00:00',
  title: 'Jobbsökarverkstad', attendance: null, self_checkin_at: null, ...o,
})

describe('gruppnärvaro', () => {
  it('samma datum, tid och titel är samma pass — oavsett skiftläge, blanksteg och sekunder', () => {
    expect(gruppNyckel(pass({ title: 'Jobbsökarverkstad ' }))).toBe(gruppNyckel(pass({ title: 'jobbsökarverkstad', start_time: '09:00', end_time: '12:00' })))
    expect(gruppNyckel(pass({ title: 'Jobbsökarverkstad 2' }))).not.toBe(gruppNyckel(pass({})))
    expect(gruppNyckel(pass({ start_time: '13:00' }))).not.toBe(gruppNyckel(pass({})))
  })

  it('grupperar i tidsordning; gemensamma pass kräver minst två olika deltagare', () => {
    const lista = [
      pass({ id: '1', participant_id: 'anna', title: 'Jobbsökarverkstad ' }),
      pass({ id: '2', participant_id: 'lisa', title: 'jobbsökarverkstad' }),
      pass({ id: '3', participant_id: 'anna', title: 'Motivationsgrupp', start_time: '08:00:00', end_time: '09:00:00' }),
    ]
    const g = grupperaPass(lista)
    expect(g.map((x) => [x.title, x.start_time, x.pass.length])).toEqual([['Motivationsgrupp', '08:00', 1], ['Jobbsökarverkstad', '09:00', 2]])
    expect(gemensammaPass(lista).map((x) => x.title)).toEqual(['Jobbsökarverkstad'])
  })

  it('länken bär datum, tid och titel', () => {
    const lank = gruppLank({ date: '2026-09-28', start_time: '09:00', end_time: '12:00', title: 'Jobbsökarverkstad & fika' })
    expect(lank.startsWith('/consultant/pass/grupp?')).toBe(true)
    const q = new URLSearchParams(lank.split('?')[1])
    expect(Object.fromEntries(q)).toEqual({ datum: '2026-09-28', start: '09:00', slut: '12:00', titel: 'Jobbsökarverkstad & fika' })
  })

  it('"alla närvarande" rör bara omarkerade pass utan anmäld frånvaro', () => {
    expect(kanMarkerasNarvarandeIMassa(pass({}))).toBe(true)
    expect(kanMarkerasNarvarandeIMassa(pass({ attendance: 'absent_invalid' }))).toBe(false)
    expect(kanMarkerasNarvarandeIMassa(pass({ absence_reason: 'sick' }))).toBe(false)
  })
})
