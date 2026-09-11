import { describe, it, expect } from 'vitest'
import {
  addDays,
  foreslagetVeckomal,
  generateSessions,
  isoWeekday,
  mallensVeckotimmar,
  validateTemplateItem,
  veckansMandag,
  veckoampel,
  veckosaldo,
  type SessionLike,
  type TemplateItem,
} from './aktivitetSchema'

const item = (o: Partial<TemplateItem>): TemplateItem => ({
  weekday: 1,
  start_time: '09:00',
  end_time: '12:00',
  title: 'Jobbsökarverkstad',
  activity_type: 'jobsearch',
  ...o,
})

describe('datum i lokal tid', () => {
  it('2026-09-14 är en måndag och 2026-09-13 en söndag', () => {
    expect(isoWeekday('2026-09-14')).toBe(1)
    expect(isoWeekday('2026-09-13')).toBe(7)
  })
  it('veckansMandag hittar måndagen även från söndag', () => {
    expect(veckansMandag('2026-09-13')).toBe('2026-09-07')
    expect(veckansMandag('2026-09-14')).toBe('2026-09-14')
    expect(veckansMandag('2026-09-16')).toBe('2026-09-14')
  })
  it('addDays går över månadsskifte utan UTC-fel', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30')
  })
})

describe('foreslagetVeckomal', () => {
  it('är 40 utan barn och deltid', () => {
    expect(foreslagetVeckomal({ barnUnder8: false })).toBe(40)
  })
  it('drar 10 h för barn under 8', () => {
    expect(foreslagetVeckomal({ barnUnder8: true })).toBe(30)
  })
  it('drar deltidsarbetet proportionellt och går aldrig under 0', () => {
    expect(foreslagetVeckomal({ barnUnder8: false, deltidTimmar: 20 })).toBe(20)
    expect(foreslagetVeckomal({ barnUnder8: true, deltidTimmar: 35 })).toBe(0)
  })
})

describe('generateSessions', () => {
  const mall = [
    item({ weekday: 1, start_time: '09:00', end_time: '12:00' }),
    item({ weekday: 3, start_time: '13:00', end_time: '16:00', title: 'Språkcafé', activity_type: 'language' }),
    item({ weekday: 1, start_time: '13:00', end_time: '15:00', title: 'Eget jobbsök', activity_type: 'jobsearch_own' }),
  ]

  it('ger BÅDA veckodagarna varje vecka — det generateRecurringEvents inte klarar', () => {
    const pass = generateSessions(mall, '2026-10-05', '2026-10-18') // mån–sön, två veckor
    const datum = pass.map((p) => `${p.date} ${p.start_time}`)
    expect(datum).toEqual([
      '2026-10-05 09:00',
      '2026-10-05 13:00',
      '2026-10-07 13:00',
      '2026-10-12 09:00',
      '2026-10-12 13:00',
      '2026-10-14 13:00',
    ])
  })

  it('startar mitt i veckan utan att hitta på passet som redan passerat', () => {
    const pass = generateSessions(mall, '2026-10-06', '2026-10-11') // tis–sön
    expect(pass.map((p) => p.date)).toEqual(['2026-10-07'])
  })

  it('tar med slutdatumet och ger tomt när slut < start', () => {
    expect(generateSessions(mall, '2026-10-12', '2026-10-12')).toHaveLength(2)
    expect(generateSessions(mall, '2026-10-12', '2026-10-11')).toEqual([])
  })

  it('bär rubrik, typ, plats och anteckning från raden', () => {
    const [p] = generateSessions([item({ location: 'Hjernet', notes: 'Ta med CV' })], '2026-10-05', '2026-10-05')
    expect(p).toMatchObject({ title: 'Jobbsökarverkstad', activity_type: 'jobsearch', location: 'Hjernet', notes: 'Ta med CV' })
  })
})

describe('mallensVeckotimmar och validering', () => {
  it('summerar alla rader inklusive eget jobbsök', () => {
    expect(mallensVeckotimmar([item({}), item({ start_time: '13:00', end_time: '14:30' })])).toBe(4.5)
  })
  it('fäller slut före start, tom rubrik och fel veckodag', () => {
    expect(validateTemplateItem(item({ end_time: '08:00' }))).toMatch(/Sluttiden/)
    expect(validateTemplateItem(item({ title: '  ' }))).toMatch(/rubrik/)
    expect(validateTemplateItem(item({ weekday: 8 }))).toMatch(/1–7/)
    expect(validateTemplateItem(item({}))).toBeNull()
  })
})

describe('veckosaldo och ampel', () => {
  const s = (o: Partial<SessionLike>): SessionLike => ({
    date: '2026-10-05',
    start_time: '09:00',
    end_time: '12:00',
    activity_type: 'jobsearch',
    attendance: null,
    ...o,
  })

  it('räknar bara veckan som innehåller datumet', () => {
    const saldo = veckosaldo(
      [s({ date: '2026-10-05', attendance: 'present' }), s({ date: '2026-10-12', attendance: 'present' })],
      '2026-10-08',
    )
    expect(saldo.vecka).toBe('2026-10-05')
    expect(saldo.antalPass).toBe(1)
    expect(saldo.narvaroTimmar).toBe(3)
  })

  it('räknar eget jobbsök separat, inte som anvisad aktivitet', () => {
    const saldo = veckosaldo(
      [s({ attendance: 'present' }), s({ activity_type: 'jobsearch_own', start_time: '13:00', end_time: '15:00' })],
      '2026-10-05',
    )
    expect(saldo.planeradeTimmar).toBe(3)
    expect(saldo.jobbsokTimmar).toBe(2)
    expect(saldo.antalPass).toBe(1)
  })

  it('skiljer giltig, ogiltig, sjuk och omarkerad', () => {
    const saldo = veckosaldo(
      [
        s({ attendance: 'absent_valid' }),
        s({ attendance: 'absent_invalid', start_time: '13:00', end_time: '14:00' }),
        s({ attendance: 'sick_certified', date: '2026-10-06' }),
        s({ attendance: null, date: '2026-10-07' }),
        s({ attendance: 'external', date: '2026-10-08' }),
      ],
      '2026-10-05',
    )
    expect(saldo.antalGiltigFranvaro).toBe(1)
    expect(saldo.antalOgiltigFranvaro).toBe(1)
    expect(saldo.antalSjuk).toBe(1)
    expect(saldo.antalOmarkerade).toBe(1)
    expect(saldo.narvaroTimmar).toBe(3)
  })

  it('ampeln säger inga_pass när inget är planerat — aldrig 0 %', () => {
    expect(veckoampel(veckosaldo([], '2026-10-05'), 40)).toBe('inga_pass')
  })

  it('ogiltig frånvaro vinner över att målet är nått', () => {
    const saldo = veckosaldo(
      [s({ attendance: 'absent_invalid', start_time: '08:00', end_time: '17:00' }), s({ date: '2026-10-06', start_time: '08:00', end_time: '17:00', attendance: 'present' })],
      '2026-10-05',
    )
    expect(veckoampel(saldo, 18)).toBe('ogiltig_franvaro')
  })

  it('på mål när planerade timmar når veckomålet', () => {
    const saldo = veckosaldo([s({ start_time: '08:00', end_time: '16:00' })], '2026-10-05')
    expect(veckoampel(saldo, 8)).toBe('pa_mal')
    expect(veckoampel(saldo, 10)).toBe('under_mal')
  })
})
