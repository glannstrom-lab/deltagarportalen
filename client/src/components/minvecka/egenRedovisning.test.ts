/**
 * RD29 (rollspelet 2026-09-27): deltagarens egen redovisning på intyget.
 *   1. Bara pass i månaden med egen incheckning, i tidsordning.
 *   2. Jobbsökandet räknas i månaden; en sparad-men-inte-skickad räknas inte som ansökan.
 *   3. Avsnittet är tydligt märkt som hennes eget, inte konsulentens bedömning,
 *      och ett läsfel sägs i stället för att tiga.
 *      Mutation: låt `jobbsok: null` ge "Inget eget jobbsökande" → sista testet faller.
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

import { egnaIncheckningar, raknaManadensJobbsok, egenRedovisningAvsnitt } from './egenRedovisning'
import type { ActivitySession } from '@/services/aktivitetApi'

const s = (o: Record<string, unknown>) =>
  ({ id: 'x', date: '2026-09-10', start_time: '09:00', end_time: '12:00', title: 'Verkstad', self_checkin_at: null, ...o }) as ActivitySession

describe('egenRedovisning (RD29)', () => {
  it('tar egna incheckningar i månaden, i tidsordning', () => {
    const rader = egnaIncheckningar(
      [
        s({ id: 'b', date: '2026-09-17', self_checkin_at: '2026-09-17T09:04:00' }),
        s({ id: 'a', date: '2026-09-03', self_checkin_at: '2026-09-03T08:58:00', title: 'Språkcafé' }),
        s({ id: 'c', date: '2026-09-24' }),
        s({ id: 'd', date: '2026-08-31', self_checkin_at: '2026-08-31T09:00:00' }),
      ],
      '2026-09',
    )
    expect(rader).toEqual([
      { datum: '2026-09-03', tid: '09:00-12:00', titel: 'Språkcafé', incheckadKl: '08:58' },
      { datum: '2026-09-17', tid: '09:00-12:00', titel: 'Verkstad', incheckadKl: '09:04' },
    ])
  })

  it('räknar månadens jobbsökande', () => {
    const r = raknaManadensJobbsok(
      {
        savedJobs: [
          { created_at: '2026-09-02T10:00:00', application_date: '2026-09-05', status: 'applied' },
          { created_at: '2026-09-12T10:00:00', application_date: null, status: 'saved' },
          { created_at: '2026-08-20T10:00:00', application_date: '2026-08-21', status: 'interview' },
        ],
        cvUpdatedAt: '2026-09-15T12:00:00',
        coverLetters: [{ created_at: '2026-09-05T08:00:00' }],
        interviews: [{ completed_at: null, started_at: '2026-10-01T09:00:00' }],
      },
      '2026-09',
    )
    expect(r).toEqual({ sparadeJobb: 2, ansokningar: 1, cvUppdaterat: true, brev: 1, intervjuovningar: 0 })
  })

  it('avsnittet är märkt som hennes eget och skilt från konsulentens markering', () => {
    const a = egenRedovisningAvsnitt({
      incheckningar: [{ datum: '2026-09-03', tid: '09:00-12:00', titel: 'Verkstad', incheckadKl: '08:58' }],
      jobbsok: { sparadeJobb: 2, ansokningar: 1, cvUppdaterat: false, brev: 0, intervjuovningar: 0 },
    })
    expect(a.rubrik).toBe('Deltagarens egen redovisning')
    expect(a.forklaring).toMatch(/inte bedömda eller bekräftade av arbetskonsulenten/)
    expect(a.incheckningar.body).toEqual([['3 september 2026', '09:00-12:00', 'Verkstad', 'Incheckad kl 08:58']])
    expect(a.jobbsokRader).toEqual(['Sparade jobbannonser: 2', 'Skickade ansökningar: 1'])
  })

  it('ett läsfel säger det, en tom månad säger det — de blandas inte ihop', () => {
    expect(egenRedovisningAvsnitt({ incheckningar: [], jobbsok: null }).jobbsokRader[0]).toMatch(/kunde inte hämtas/)
    const tom = egenRedovisningAvsnitt({ incheckningar: [], jobbsok: { sparadeJobb: 0, ansokningar: 0, cvUppdaterat: false, brev: 0, intervjuovningar: 0 } })
    expect(tom.jobbsokRader[0]).toMatch(/Inget eget jobbsökande/)
    expect(tom.incheckningar.tomText).toMatch(/Inga egna incheckningar/)
  })
})
