import { describe, it, expect } from 'vitest'
import { byggLagesbildUnderlag, harUnderlag } from './lagesbildUnderlag'

const IDAG = '2026-10-18'

describe('KF6: underlaget till Läget just nu — dataminimering', () => {
  it('frånvaroorsaken följer aldrig med — sjuk och giltig/ogiltig blir bara "frånvaro"', () => {
    const u = byggLagesbildUnderlag({
      idag: IDAG, journal: [], mal: [], plan: null, moten: [],
      pass: [
        { date: '2026-10-01', attendance: 'present' },
        { date: '2026-10-02', attendance: 'sick_certified' },
        { date: '2026-10-03', attendance: 'sick' },
        { date: '2026-10-06', attendance: 'absent_invalid' },
        { date: '2026-10-07', attendance: 'absent_valid' },
        { date: '2026-10-08', attendance: null },
        { date: '2026-10-20', attendance: null },
      ],
    })
    expect(u.narvaro).toEqual({ narvarande: 1, franvaro: 4, ejMarkerat: 1, kommande: 1, dagar: 28 })
    const json = JSON.stringify(u)
    expect(json).not.toMatch(/sick|absent_valid|absent_invalid/)
  })

  it('CONCERN-anteckningar utesluts, de senaste kommer först', () => {
    const u = byggLagesbildUnderlag({
      idag: IDAG, mal: [], pass: [], plan: null, moten: [],
      journal: [
        { content: 'Gammal', category: 'MEETING', created_at: '2026-09-20T10:00:00Z' },
        { content: 'Intern oro', category: 'CONCERN', created_at: '2026-10-10T10:00:00Z' },
        { content: 'Ny', category: 'GENERAL', created_at: '2026-10-15T10:00:00Z' },
      ],
    })
    expect(u.journal.map((j) => j.text)).toEqual(['Ny', 'Gammal'])
  })

  it('planens fritext och försörjningshinder finns inte ens som fält', () => {
    const u = byggLagesbildUnderlag({
      idag: IDAG, journal: [], mal: [], pass: [], moten: [],
      plan: { status: 'active', start_date: '2026-09-01', end_date: null, weekly_hours_target: 40, template_name: 'Aktivitetskrav' },
    })
    expect(Object.keys(u.plan!)).toEqual(['status', 'start', 'slut', 'timmarPerVecka', 'mall'])
  })

  it('nästa möte är det första framtida som inte är inställt', () => {
    const u = byggLagesbildUnderlag({
      idag: IDAG, journal: [], mal: [], pass: [], plan: null,
      moten: [
        { scheduled_at: '2026-10-25T09:00:00Z', status: 'scheduled' },
        { scheduled_at: '2026-10-20T09:00:00Z', status: 'cancelled' },
        { scheduled_at: '2026-10-10T09:00:00Z', status: 'completed' },
      ],
    })
    expect(u.nastaMote).toBe('2026-10-25')
  })

  it('utan något underlag anropas inte AI:n', () => {
    const tom = byggLagesbildUnderlag({ idag: IDAG, journal: [], mal: [], pass: [], plan: null, moten: [] })
    expect(harUnderlag(tom)).toBe(false)
  })
})
