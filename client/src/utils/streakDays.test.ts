import { describe, it, expect } from 'vitest'
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
