/**
 * Jobbevakningens frekvensgrind (O1, 2026-08-25).
 *
 * ## Varför den här filen finns
 *
 * Cron-schemat i `client/vercel.json` kör `action=check` en gång per dygn. Utan
 * grinden i `shouldEmailToday` fick varje bevakning med frekvens ≠ `none` ett
 * mejl varje dygn — även de användaren satt till `weekly`. Ett gränssnitt som
 * säger "varje vecka" och en kod som mejlar varje dag är samma felklass som
 * portalen betalat av i övrigt: ett påstående utan täckning.
 *
 * Testet kan falla. Tar man bort `weekly`-grenen faller måndagstestet; tar man
 * bort `none`-grenen faller det första.
 */

import { describe, it, expect } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const jobAlerts = require('../../api/job-alerts.js') as {
  shouldEmailToday: (frekvens: string | null | undefined, nu?: Date) => boolean
}

const { shouldEmailToday } = jobAlerts

/** UTC-datum, eftersom grinden läser `getUTCDay()`. */
function utc(år: number, månad1till12: number, dag: number): Date {
  return new Date(Date.UTC(år, månad1till12 - 1, dag, 12, 0, 0))
}

// 2026-08-24 är en måndag; 25 tisdag; 30 söndag.
const MÅNDAG = utc(2026, 8, 24)
const TISDAG = utc(2026, 8, 25)
const SÖNDAG = utc(2026, 8, 30)

describe('shouldEmailToday', () => {
  it('mejlar aldrig när användaren stängt av aviseringen', () => {
    expect(shouldEmailToday('none', MÅNDAG)).toBe(false)
    expect(shouldEmailToday('none', TISDAG)).toBe(false)
    expect(shouldEmailToday('none', SÖNDAG)).toBe(false)
  })

  it('mejlar veckovisa bevakningar bara på måndagar', () => {
    expect(shouldEmailToday('weekly', MÅNDAG)).toBe(true)
    expect(shouldEmailToday('weekly', TISDAG)).toBe(false)
    expect(shouldEmailToday('weekly', SÖNDAG)).toBe(false)
  })

  it('mejlar dagliga bevakningar varje körning', () => {
    expect(shouldEmailToday('daily', MÅNDAG)).toBe(true)
    expect(shouldEmailToday('daily', TISDAG)).toBe(true)
    expect(shouldEmailToday('daily', SÖNDAG)).toBe(true)
  })

  it('behandlar saknad frekvens som daglig — hellre ett mejl än tystnad', () => {
    expect(shouldEmailToday(null, TISDAG)).toBe(true)
    expect(shouldEmailToday(undefined, TISDAG)).toBe(true)
    expect(shouldEmailToday('', TISDAG)).toBe(true)
  })

  it('levererar instant dagligen, eftersom cron går en gång per dygn', () => {
    // Dokumenterar beteendet i stället för att låta det vara en överraskning.
    // Vill vi ha äkta instant krävs tätare cron.
    expect(shouldEmailToday('instant', TISDAG)).toBe(true)
  })
})
