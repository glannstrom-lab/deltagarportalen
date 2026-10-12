import { describe, it, expect } from 'vitest'
import { veckansKalenderPoster } from './veckansKalender'
import { byggIcs } from '@/lib/ics'
import type { ActivitySession } from '@/services/aktivitetApi'
import type { KonsulentMote } from './konsulentMoten'

const texter = { moteTitel: 'Möte', passBeskrivning: () => 'p', moteBeskrivning: () => 'm' }
const pass = (o: Partial<ActivitySession>) =>
  ({ id: 'p1', date: '2026-10-14', start_time: '09:00', end_time: '12:00', title: 'Verkstad', location: null, attendance: null, activity_type: 'workshop', ...o }) as ActivitySession
const mote = (o: Partial<KonsulentMote>): KonsulentMote =>
  ({ id: 'm1', scheduled_at: '2026-10-14T10:00:00Z', duration_minutes: 30, meeting_type: 'video', location: null, meeting_link: null, status: 'scheduled', ...o })
const NU = new Date('2026-10-12T08:00:00Z')

describe('veckansKalenderPoster', () => {
  it('tar bara inbokade, kommande poster', () => {
    const p = veckansKalenderPoster(
      [pass({}), pass({ id: 'p2', attendance: 'absent_valid' }), pass({ id: 'p3', attendance: 'sick_certified' }), pass({ id: 'p4', date: '2026-10-05' })],
      [mote({}), mote({ id: 'm2', status: 'cancelled' }), mote({ id: 'm3', duration_minutes: null }), mote({ id: 'm4', scheduled_at: '2026-10-01T10:00:00Z' })],
      '2026-10-12', NU, texter,
    )
    expect(p.map((x) => x.uid)).toEqual(['p1@jobin.se', 'm1@jobin.se'])
  })

  it('mötet skrivs i rätt UTC-ögonblick oavsett webbläsarens zon, och UID är stabilt', () => {
    const poster = veckansKalenderPoster([], [mote({})], '2026-10-12', NU, texter)
    const a = byggIcs(poster, { nu: NU })
    expect(a).toContain('DTSTART:20261014T100000Z')
    expect(a).toContain('DTEND:20261014T103000Z')
    expect(byggIcs(poster, { nu: new Date() })).toContain('UID:m1@jobin.se')
  })

  it('pass runt sommartidsbytet (25 okt 2026) får rätt UTC', () => {
    const a = byggIcs(veckansKalenderPoster([pass({ date: '2026-10-24' }), pass({ id: 'p5', date: '2026-10-26' })], [], '2026-10-12', NU, texter), { nu: NU })
    expect(a).toContain('DTSTART:20261024T070000Z') // CEST
    expect(a).toContain('DTSTART:20261026T080000Z') // CET
  })
})
