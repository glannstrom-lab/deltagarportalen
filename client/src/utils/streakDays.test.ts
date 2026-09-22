import { describe, it, expect, afterEach } from 'vitest'
import { streakDays } from './streakDays'

describe('streakDays', () => {
  it('returns 0 for an empty array', () => {
    expect(streakDays([])).toBe(0)
  })

  it('returns 0 for null/undefined input (defensive)', () => {
    expect(streakDays(null)).toBe(0)
    expect(streakDays(undefined)).toBe(0)
  })

  it('returns 1 for a single log entry', () => {
    expect(streakDays([{ log_date: '2026-04-27' }])).toBe(1)
  })

  it('returns 3 for 3 consecutive days (most-recent first)', () => {
    expect(
      streakDays([
        { log_date: '2026-04-27' },
        { log_date: '2026-04-26' },
        { log_date: '2026-04-25' },
      ])
    ).toBe(3)
  })

  it('returns 1 when there is a gap after the most-recent log (gap breaks the streak)', () => {
    // 2026-04-27 then 2026-04-25 — 2026-04-26 is missing
    expect(
      streakDays([
        { log_date: '2026-04-27' },
        { log_date: '2026-04-25' },
      ])
    ).toBe(1)
  })

  it('handles unsorted input — sorts descending by log_date defensively', () => {
    expect(
      streakDays([
        { log_date: '2026-04-25' },
        { log_date: '2026-04-27' },
        { log_date: '2026-04-26' },
      ])
    ).toBe(3)
  })

  it('counts streak anchored at most-recent log (NOT today) — empathy contract', () => {
    // Logs from a week ago — still counts 3 if 3 are consecutive.
    expect(
      streakDays([
        { log_date: '2026-04-20' },
        { log_date: '2026-04-19' },
        { log_date: '2026-04-18' },
      ])
    ).toBe(3)
  })
})

/**
 * Regression 2026-09-22: räknaren gick i LOKAL tid (`setDate`) men jämförde i
 * UTC (`toISOString`). Så länge dygnet var 24 timmar tog felen ut varandra —
 * men natten mot sommartidens slut (25 okt 2026) är dygnet 25 timmar i
 * Sverige, och markören hamnade på 24 okt i stället för 25. Tre dagar i rad
 * blev "1 dag i rad" på Min vardag, just för den som loggat hela helgen.
 * I en västlig zon slog samma fel till vid dess eget höstskifte (1 nov i USA).
 *
 * `process.env.TZ` sätts i testet: CI kör i UTC, där felet inte syns.
 */
describe('streakDays över sommartidsskiftet', () => {
  const tidigareTz = process.env.TZ
  afterEach(() => {
    if (tidigareTz === undefined) delete process.env.TZ
    else process.env.TZ = tidigareTz
  })

  it.each(['Europe/Stockholm', 'America/New_York', 'UTC'])(
    'räknar tre dagar i rad över höstens skifte i %s',
    (tz) => {
      process.env.TZ = tz
      expect(
        streakDays([
          { log_date: '2026-10-26' },
          { log_date: '2026-10-25' },
          { log_date: '2026-10-24' },
        ])
      ).toBe(3)
    }
  )

  it.each(['Europe/Stockholm', 'America/New_York', 'UTC'])(
    'räknar tre dagar i rad över USA:s höstskifte (1 nov) i %s',
    (tz) => {
      process.env.TZ = tz
      expect(
        streakDays([
          { log_date: '2026-11-02' },
          { log_date: '2026-11-01' },
          { log_date: '2026-10-31' },
        ])
      ).toBe(3)
    }
  )

  it.each(['Europe/Stockholm', 'America/New_York', 'UTC'])(
    'räknar tre dagar i rad över vårens skifte i %s',
    (tz) => {
      process.env.TZ = tz
      expect(
        streakDays([
          { log_date: '2026-03-30' },
          { log_date: '2026-03-29' },
          { log_date: '2026-03-28' },
        ])
      ).toBe(3)
    }
  )
})
