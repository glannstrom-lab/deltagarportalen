/**
 * Regression 2026-09-22: statusbytets datumstämplar och uppföljningshorisonten
 * räknades i UTC (`toISOString().split('T')[0]`). Mellan midnatt och kl. 02
 * svensk sommartid (01 vintertid) är UTC-datumet GÅRDAGENS — den som bockade
 * av "kontaktad" efter midnatt fick gårdagens datum på kortet, och Översikts
 * "väntar sedan" räknade en dag för mycket.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { buildStatusUpdates } from './useSpontaneousCompanies'
import type { SpontaneousCompany } from '@/services/supabaseApi'

const tidigareTz = process.env.TZ

beforeEach(() => {
  process.env.TZ = 'Europe/Stockholm'
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  if (tidigareTz === undefined) delete process.env.TZ
  else process.env.TZ = tidigareTz
})

const foretag = { outreach_date: null, response_date: null } as unknown as SpontaneousCompany

describe('buildStatusUpdates', () => {
  it('stämplar dagens SVENSKA datum strax efter midnatt', () => {
    // 01:30 den 23 september i Stockholm = 23:30 den 22:a i UTC
    vi.setSystemTime(new Date('2026-09-22T23:30:00Z'))
    expect(buildStatusUpdates(foretag, 'contacted').outreach_date).toBe('2026-09-23')
    expect(buildStatusUpdates(foretag, 'response_positive').response_date).toBe('2026-09-23')
  })

  it('stämplar samma dag mitt på dagen', () => {
    vi.setSystemTime(new Date('2026-09-22T10:00:00Z'))
    expect(buildStatusUpdates(foretag, 'contacted').outreach_date).toBe('2026-09-22')
  })

  it('skriver inte över ett datum som redan finns', () => {
    vi.setSystemTime(new Date('2026-09-22T10:00:00Z'))
    const redan = { outreach_date: '2026-09-01', response_date: null } as unknown as SpontaneousCompany
    expect(buildStatusUpdates(redan, 'contacted').outreach_date).toBeUndefined()
  })
})
