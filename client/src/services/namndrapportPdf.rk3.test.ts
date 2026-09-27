/**
 * RK3 (rollspelet 2026-09-27): underlaget till handläggaren och nämndrapporten
 * räknade all sjukfrånvaro som "sjuk med intyg", oavsett om läkarintyget kommit
 * in. Anna markerades Sjuk 22/9 utan intyg; underlaget sa "1 sjuk med intyg" och
 * nämndrapporten lade passet under "Anmäld frånvaro".
 */
import { describe, it, expect } from 'vitest'
import { sammanfattaNarvaro } from './aktivitetApi'
import { namndrapportUnderlag, tabellRader } from './namndrapportPdf'

const Q3 = { ar: 2026, kvartal: 3 as const }
const plan = { id: 'a', participant_id: 'anna', forsorjningshinder: 'arbetslos' as const, start_date: '2026-07-01', end_date: null, nedsattning_underlag_lamnat_at: null }
const sjuk = (date: string, intyg: boolean, anmald: string | null = null) =>
  ({ plan_id: 'a', date, attendance: 'sick_certified' as const, sick_certificate_received: intyg, absence_reported_at: anmald })

describe('RK3: sjuk med och utan intyg hålls isär', () => {
  it('underlaget till handläggaren räknar bara inkomna intyg som "sjuk med intyg"', () => {
    const s = sammanfattaNarvaro([sjuk('2026-09-22', false), sjuk('2026-09-23', true)], '2026-09-01', '2026-09-30')
    expect(s.sick_certified).toBe(1)
    expect(s.sjuk_utan_intyg).toBe(1)
    expect(s.pass).toBe(2)
  })

  it('nämndrapporten lägger sjuk utan intyg i en egen kolumn, inte under anmäld frånvaro', () => {
    const u = namndrapportUnderlag([plan], [sjuk('2026-09-22', false), sjuk('2026-09-23', true)], Q3)
    const rad = u.rader.find((r) => r.nyckel === 'arbetslos')!
    expect(rad.franvaro_anmald).toBe(1) // bara den med intyg
    expect(rad.sjuk_utan_intyg).toBe(1)
    expect(rad.franvaro_oanmald).toBe(0)
    expect(u.summa.sjuk_utan_intyg).toBe(1)
    // Kolumnordning: …, Anmäld, Oanmäld, Sjuk utan intyg, Underlag lämnat
    expect(tabellRader(u)[0]).toEqual(['Arbetslös', '1', '2', '0 %', '1', '0', '1', '0'])
  })

  it('en sjukanmälan i förväg räknas som anmäld även utan intyg — och bara en gång', () => {
    const u = namndrapportUnderlag([plan], [sjuk('2026-09-22', false, '2026-09-22T06:15:00Z')], Q3)
    const rad = u.rader.find((r) => r.nyckel === 'arbetslos')!
    expect(rad.franvaro_anmald).toBe(1)
    expect(rad.sjuk_utan_intyg).toBe(0)
  })
})
