/**
 * Rollspelet 2026-09-27, RK1 och RK2.
 *
 * RK1: veckoampeln jämförde närvaro i anvisade pass med ett veckomål som även
 * innehåller eget jobbsökande — Annas plan (8 h anvisat + 3 h eget = 11 h)
 * kunde aldrig bli grön trots full närvaro.
 *
 * RK2: en plan ur en mall på 8 h anvisat förifylldes med 40 h utan varning.
 */
import { describe, it, expect } from 'vitest'
import {
  anvisatVeckomal,
  forifylltVeckomalUrMall,
  mallensTimmarPerTyp,
  veckoampel,
  veckomalMotSchema,
  veckosaldo,
  type SessionLike,
  type TemplateItem,
} from './aktivitetSchema'

const s = (date: string, start: string, end: string, activity_type: SessionLike['activity_type'], attendance: SessionLike['attendance']): SessionLike =>
  ({ date, start_time: start, end_time: end, activity_type, attendance })

// Anna vecka 21–27 sep: närvarande på alla fyra anvisade pass (8 h), 12 h eget jobbsökande.
const annasVecka = [
  s('2026-09-21', '09:00', '11:00', 'jobsearch', 'present'),
  s('2026-09-22', '09:00', '11:00', 'motivation', 'present'),
  s('2026-09-23', '09:00', '11:00', 'language', 'present'),
  s('2026-09-24', '09:00', '11:00', 'workplace', 'present'),
  s('2026-09-25', '09:00', '12:00', 'jobsearch_own', null),
  s('2026-09-27', '08:00', '17:00', 'jobsearch_own', null),
]
const annasPlan = { weekly_hours_target: 11, jobsearch_hours_per_week: 3 }

describe('RK1: ampeln mäter den anvisade delen av veckomålet', () => {
  it('den anvisade delen är målet minus planens eget jobbsökande', () => {
    expect(anvisatVeckomal(annasPlan)).toBe(8)
    // Supabase numeric kan komma som sträng
    expect(anvisatVeckomal({ weekly_hours_target: '11' as unknown as number, jobsearch_hours_per_week: '3' as unknown as number })).toBe(8)
    expect(anvisatVeckomal({ weekly_hours_target: 5, jobsearch_hours_per_week: 8 })).toBe(0)
  })

  it('Annas vecka med full närvaro är på veckomålet', () => {
    const saldo = veckosaldo(annasVecka, '2026-09-21')
    expect(saldo.narvaroTimmar).toBe(8)
    expect(veckoampel(saldo, anvisatVeckomal(annasPlan))).toBe('pa_mal')
  })

  it('eget jobbsökande lyfter aldrig en vecka till grönt', () => {
    const franvarande = annasVecka.map((p) => (p.activity_type === 'jobsearch_own' ? p : { ...p, attendance: 'absent_valid' as const }))
    expect(veckoampel(veckosaldo(franvarande, '2026-09-21'), anvisatVeckomal(annasPlan))).toBe('under_mal')
  })
})

describe('RK2: veckomålet ur mallen, och en varning när det inte går ihop', () => {
  // Demomallen: 8 h anvisat + 3 h eget jobbsökande = "11 h/vecka"
  const mall: TemplateItem[] = [
    { weekday: 1, start_time: '09:00', end_time: '11:00', title: 'Verkstad', activity_type: 'jobsearch' },
    { weekday: 2, start_time: '09:00', end_time: '11:00', title: 'Motivation', activity_type: 'motivation' },
    { weekday: 3, start_time: '09:00', end_time: '11:00', title: 'Språk', activity_type: 'language' },
    { weekday: 4, start_time: '09:00', end_time: '11:00', title: 'Praktik', activity_type: 'workplace' },
    { weekday: 5, start_time: '09:00', end_time: '12:00', title: 'Eget jobbsökande', activity_type: 'jobsearch_own' },
  ]

  it('delar mallens timmar i anvisat och eget jobbsökande', () => {
    expect(mallensTimmarPerTyp(mall)).toEqual({ anvisade: 8, egetJobbsok: 3 })
  })

  it('förifyller målet ur mallen, aldrig lagens tak på 40 h', () => {
    expect(forifylltVeckomalUrMall(mall, 40)).toEqual({ veckomal: 11, egetJobbsok: 3 })
    // Lagens förslag är taket: barn under 8 → 30 h
    const stor = Array.from({ length: 7 }, (_, i) => ({ ...mall[0], weekday: i + 1, end_time: '15:00' }))
    expect(forifylltVeckomalUrMall(stor, 30).veckomal).toBe(30)
  })

  it('Omar: 40 h mål mot 8 h anvisat och 5 h eget i planen mot 3 h i schemat — två varningar', () => {
    const glapp = veckomalMotSchema({ veckomal: 40, egetJobbsokPlan: 5, anvisatSchema: 8, egetJobbsokSchema: 3 })
    expect(glapp.anvisat).toMatch(/8 h anvisad aktivitet, men veckomålet kräver 35 h/)
    expect(glapp.egetJobbsok).toBe('Planen anger 5 h eget jobbsökande i veckan, schemat har 3 h.')
  })

  it('ingen varning när målet och schemat går ihop', () => {
    expect(veckomalMotSchema({ veckomal: 11, egetJobbsokPlan: 3, anvisatSchema: 8, egetJobbsokSchema: 3 })).toEqual({ anvisat: null, egetJobbsok: null })
  })
})
