/**
 * Tester för kohortberäkningen (AR1, genomgången 2026-08-17).
 *
 * Buggen som gör testerna nödvändiga: `calculateCohorts` läste `created_at` på
 * rader som kommer ur vyn `consultant_dashboard_participants` — en vy som inte
 * har den kolumnen. Varje deltagare hamnade därför i kohorten `QNaN NaN`, och
 * eftersom kohortanalysen är påslagen som default i exportdialogen följde den
 * strängen med in i den PDF konsulenten skickar till uppdragsgivaren.
 *
 * Fixturerna nedan har **vyns verkliga kolumnuppsättning**, hämtad ur
 * `information_schema` 2026-08-17: consultant_id, participant_id, user_id,
 * email, first_name, last_name, phone, avatar_url, status, registered_at,
 * assigned_at, priority, tags, last_contact_at, next_meeting_scheduled,
 * consultant_notes, has_cv, ats_score, cv_updated_at, completed_interest_test,
 * holland_code, saved_jobs_count, notes_count, last_note_date, last_login.
 *
 * Notera vad som INTE står i listan: `created_at`. En fixtur som lagt till det
 * fältet hade gjort testerna gröna mot data som inte finns — exakt den fälla
 * projektet gick i med `skills: ['React']` och med `journey_goals`.
 */

import { describe, it, expect } from 'vitest'
import { calculateCohorts, startdatum, KOHORT_UTAN_DATUM } from './cohorts'

/** En rad med vyns form. Inget `created_at` — vyn har inte det. */
function deltagare(over: Record<string, unknown> = {}) {
  return {
    consultant_id: 'k1',
    participant_id: 'p1',
    user_id: 'u1',
    id: 'p1',
    email: 'a@example.com',
    first_name: 'Anna',
    last_name: 'Andersson',
    status: 'ACTIVE',
    registered_at: '2026-02-11T09:00:00Z',
    assigned_at: '2026-04-03T09:00:00Z',
    has_cv: true,
    last_login: '2026-08-01T09:00:00Z',
    ...over,
  }
}

describe('startdatum läser vyns faktiska kolumner', () => {
  it('föredrar assigned_at — när deltagaren kom till den här konsulenten', () => {
    const d = startdatum(deltagare())
    expect(d).not.toBeNull()
    expect(d!.getUTCFullYear()).toBe(2026)
    expect(d!.getUTCMonth()).toBe(3) // april
  })

  it('faller tillbaka på registered_at när assigned_at saknas', () => {
    const d = startdatum(deltagare({ assigned_at: null }))
    expect(d!.getUTCMonth()).toBe(1) // februari
  })

  it('ger null i stället för Invalid Date när inget datum finns', () => {
    expect(startdatum(deltagare({ assigned_at: null, registered_at: null }))).toBeNull()
  })

  it('ger null på skräpvärden i stället för att låtsas', () => {
    expect(startdatum(deltagare({ assigned_at: 'inte ett datum', registered_at: null }))).toBeNull()
    expect(startdatum(deltagare({ assigned_at: 12345, registered_at: null }))).toBeNull()
  })
})

describe('kohortnyckeln är aldrig NaN', () => {
  it('grupperar på kvartal', () => {
    const rader = calculateCohorts(
      [
        deltagare({ id: 'a', assigned_at: '2026-02-01T00:00:00Z' }),
        deltagare({ id: 'b', assigned_at: '2026-03-20T00:00:00Z' }),
        deltagare({ id: 'c', assigned_at: '2026-07-05T00:00:00Z' }),
      ],
      []
    )
    const namn = rader.map(r => r.cohort)
    expect(namn).toContain('Q1 2026')
    expect(namn).toContain('Q3 2026')
    expect(rader.find(r => r.cohort === 'Q1 2026')!.participants).toBe(2)
  })

  it('REGRESSION AR1: vyns form ger inget QNaN — inte i någon rad', () => {
    // Precis den indata som orsakade buggen: rader utan created_at.
    const rader = calculateCohorts([deltagare(), deltagare({ id: 'b' })], [])
    for (const r of rader) {
      expect(r.cohort).not.toContain('NaN')
      expect(r.cohort).not.toBe('QNaN NaN')
    }
    // Och inget tal i raden får vara NaN — det är de som hamnar i PDF:en.
    for (const r of rader) {
      expect(Number.isFinite(r.participants)).toBe(true)
      expect(Number.isFinite(r.cvComplete)).toBe(true)
      expect(Number.isFinite(r.placed)).toBe(true)
      expect(Number.isFinite(r.avgTime)).toBe(true)
    }
  })

  it('deltagare utan datum hamnar i en namngiven kohort, inte i ett påhittat kvartal', () => {
    const rader = calculateCohorts(
      [
        deltagare({ id: 'a' }),
        deltagare({ id: 'b', assigned_at: null, registered_at: null }),
      ],
      []
    )
    const okand = rader.find(r => r.cohort === KOHORT_UTAN_DATUM)
    expect(okand, 'deltagaren utan datum försvann ur summeringen').toBeDefined()
    expect(okand!.participants).toBe(1)
    // Summan ska fortfarande stämma — ingen får tappas bort tyst.
    expect(rader.reduce((s, r) => s + r.participants, 0)).toBe(2)
  })

  it('den okända kohorten sorteras sist och förstör inte ordningen', () => {
    const rader = calculateCohorts(
      [
        deltagare({ id: 'a', assigned_at: '2026-01-10T00:00:00Z' }),
        deltagare({ id: 'x', assigned_at: null, registered_at: null }),
        deltagare({ id: 'c', assigned_at: '2026-07-10T00:00:00Z' }),
      ],
      []
    )
    expect(rader[rader.length - 1].cohort).toBe(KOHORT_UTAN_DATUM)
    expect(rader[0].cohort).toBe('Q3 2026') // nyast först
  })
})

describe('avgTime räknar bara på mätbara par', () => {
  it('räknar dagar mellan start och placering', () => {
    const rader = calculateCohorts(
      [deltagare({ id: 'a', assigned_at: '2026-01-01T00:00:00Z' })],
      [{ participant_id: 'a', start_date: '2026-01-31T00:00:00Z' }]
    )
    expect(rader[0].avgTime).toBe(30)
  })

  it('ett oläsbart datum ger inte NaN och sänker inte snittet', () => {
    const rader = calculateCohorts(
      [
        deltagare({ id: 'a', assigned_at: '2026-01-01T00:00:00Z' }),
        deltagare({ id: 'b', assigned_at: '2026-01-01T00:00:00Z' }),
      ],
      [
        { participant_id: 'a', start_date: '2026-01-31T00:00:00Z' },
        { participant_id: 'b', start_date: null, created_at: null },
      ]
    )
    expect(Number.isFinite(rader[0].avgTime)).toBe(true)
    // 30 dagar delat på ETT mätbart par — inte på två.
    expect(rader[0].avgTime).toBe(30)
  })
})

describe('negativ kontroll — testet kan falla', () => {
  it('hade fällt på den gamla implementationen', () => {
    // Den gamla koden var i praktiken detta. Kör den mot samma fixtur och
    // bekräfta att den ger QNaN NaN — annars bevisar regressionstestet ovan
    // ingenting om att buggen någonsin fanns.
    const p = deltagare() as Record<string, unknown>
    const gammal = new Date(p.created_at as string)
    const nyckel = `Q${Math.floor(gammal.getMonth() / 3) + 1} ${gammal.getFullYear()}`
    expect(nyckel).toBe('QNaN NaN')
  })
})
