/**
 * Gruppnärvaro (RK36, rollspelet 2026-09-27) — vad som är "samma pass".
 * Motprov (körda): (1) jämför titeln med skiftläge → "Jobbsökarverkstad " och
 * "jobbsökarverkstad" blir två grupper och testet faller. (2) ta bort
 * `!p.absence_reason` i kanMarkerasNarvarandeIMassa → massregeln faller.
 */
import { describe, it, expect } from 'vitest'
import { dagensPoster, gemensammaPass, gruppLank, gruppNyckel, grupperaPass, kanMarkerasNarvarandeIMassa, narvaroForslag, restenNarvarande } from './gruppnarvaro'
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

describe('förslag (omtaget steg 4)', () => {
  it('incheckning föreslår Här; sjuk → Sjuk; vård av barn → Giltig; "annat" och markerade pass har inget förslag', () => {
    expect(narvaroForslag(pass({ self_checkin_at: '2026-09-28T06:58:00Z' }))?.varde).toBe('present')
    expect(narvaroForslag(pass({ absence_reason: 'sick' }))?.varde).toBe('sick_certified')
    expect(narvaroForslag(pass({ absence_reason: 'child_care' }))?.varde).toBe('absent_valid')
    expect(narvaroForslag(pass({ absence_reason: 'other' }))).toBeNull()
    expect(narvaroForslag(pass({ attendance: 'present', self_checkin_at: '2026-09-28T06:58:00Z' }))).toBeNull()
    // Den som anmält sig sjuk men ändå checkat in är på plats.
    expect(narvaroForslag(pass({ absence_reason: 'sick', self_checkin_at: '2026-09-28T06:58:00Z' }))?.varde).toBe('present')
  })

  it('ogiltig föreslås aldrig', () => {
    for (const orsak of ['sick', 'child_care', 'authority_meeting', 'other', 'okänd']) {
      expect(narvaroForslag(pass({ absence_reason: orsak }))?.varde).not.toBe('absent_invalid')
    }
  })

  it('"resten" är de omarkerade utan förslag och utan anmälan', () => {
    const lista = [
      pass({ id: 'a' }),
      pass({ id: 'c', self_checkin_at: '2026-09-28T06:58:00Z' }),
      pass({ id: 'o', absence_reason: 'other' }),
      pass({ id: 'm', attendance: 'present' }),
    ]
    expect(restenNarvarande(lista).map((p) => p.id)).toEqual(['a'])
  })

  it('dagens poster: grupper med två deltagare eller fler, eget jobbsökande alltid för sig, i tidsordning', () => {
    const poster = dagensPoster([
      pass({ id: '1', participant_id: 'anna', start_time: '13:00:00' }),
      pass({ id: '2', participant_id: 'lisa', start_time: '13:00:00' }),
      pass({ id: '3', participant_id: 'anna', title: 'Samtal', start_time: '09:00:00' }),
      pass({ id: '4', participant_id: 'anna', title: 'Eget', activity_type: 'jobsearch_own', start_time: '10:00:00' }),
      pass({ id: '5', participant_id: 'lisa', title: 'Eget', activity_type: 'jobsearch_own', start_time: '10:00:00' }),
    ])
    expect(poster.map((p) => (p.typ === 'grupp' ? `grupp:${p.grupp.pass.length}` : p.pass.id))).toEqual(['3', '4', '5', 'grupp:2'])
  })
})
